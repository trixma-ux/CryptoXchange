import { Request, Response } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendError, MOCK_PRICES, FCFA_PER_USD } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";
import { creditPlatformFee, PLATFORM_FEES } from "../../lib/platform-fees.js";
import { initCinetPayPayment, checkCinetPayPayment } from "../../lib/cinetpay.js";

const PROVIDER_CHANNEL: Record<string, string> = {
  orange_money: "ORANGE_CI",
  mtn_money: "MTN_CI",
  wave: "WAVE_CI",
  moov_money: "MOOV_CI",
  airtel_money: "AIRTEL_CI",
};

export const mobileMoneyDeposit = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, phone, amount, currency = "XOF", cryptoCurrency } = req.body;
  const userId = req.user!.id;
  const userPhone = phoneNumber || phone;

  if (!amount || !provider) return sendError(res, "Montant et opérateur requis", 400);
  if (!cryptoCurrency) return sendError(res, "Cryptomonnaie cible requise", 400);

  const fiatAmountNum = parseFloat(amount);
  if (isNaN(fiatAmountNum) || fiatAmountNum < 100)
    return sendError(res, "Montant minimum 100 FCFA", 400);

  const feePct = PLATFORM_FEES.deposit / 100;
  const feeFcfa = fiatAmountNum * feePct;
  const netFcfa = fiatAmountNum - feeFcfa;
  const priceUSD = MOCK_PRICES[cryptoCurrency] || 1;
  const netUSD = netFcfa / FCFA_PER_USD;
  const cryptoAmount = netUSD / priceUSD;

  const users = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const userInfo = users[0];

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "DEPOSIT_FIAT", status: "PENDING",
    currency: cryptoCurrency, amount: cryptoAmount.toString(),
    fee: feeFcfa.toString(), netAmount: cryptoAmount.toString(),
    fiatCurrency: currency, fiatAmount: fiatAmountNum.toString(),
    exchangeRate: priceUSD.toString(),
    description: `Dépôt via ${provider}${userPhone ? ` (${userPhone})` : ""}`,
    metadata: { provider, phoneNumber: userPhone, fiatAmount: fiatAmountNum, fiatCurrency: currency, feeFcfa },
  }).returning();

  let paymentUrl: string | undefined;
  let useCinetPay = false;

  try {
    const cinetResult = await initCinetPayPayment({
      transactionId: tx.id,
      amount: fiatAmountNum,
      currency,
      description: `Achat ${cryptoCurrency} sur CryptoXchange`,
      customerName: userInfo ? `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim() || undefined : undefined,
      customerEmail: userInfo?.email,
      customerPhone: userPhone,
      channels: PROVIDER_CHANNEL[provider] || "ALL",
    });
    paymentUrl = cinetResult.paymentUrl;
    useCinetPay = true;
  } catch (err: any) {
    if (err?.message !== "CINETPAY_NOT_CONFIGURED") {
      console.error("CinetPay error:", err?.message);
    }
    // Fallback simulation — NEVER runs in production
    if (process.env.NODE_ENV === "production") {
      console.error("CinetPay init failed in production — transaction left PENDING, no auto-credit");
      return sendSuccess(res, { transaction: tx, paymentUrl: undefined, useCinetPay: false, summary: {} },
        "Paiement en attente. Contactez le support si le problème persiste.", 201);
    }
    setTimeout(async () => {
      try {
        const wallets = await db.select().from(walletsTable)
          .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, cryptoCurrency))).limit(1);
        if (wallets.length > 0) {
          const newBal = parseFloat(wallets[0].balance.toString()) + cryptoAmount;
          await db.update(walletsTable).set({ balance: newBal.toFixed(8), updatedAt: new Date() })
            .where(eq(walletsTable.id, wallets[0].id));
          await db.update(transactionsTable).set({ status: "COMPLETED", processedAt: new Date(), updatedAt: new Date() })
            .where(eq(transactionsTable.id, tx.id));
          await creditPlatformFee({ feeAmountFcfa: feeFcfa, sourceType: "DEPOSIT", description: `Simulation dépôt ${provider} — ${fiatAmountNum} XOF` });
        }
      } catch (e) { console.error("Fallback deposit error:", e); }
    }, 3000);
  }

  return sendSuccess(res, {
    transaction: tx,
    paymentUrl,
    useCinetPay,
    summary: {
      provider, phoneNumber: userPhone,
      fiatAmount: fiatAmountNum, currency,
      feeFcfa: feeFcfa.toFixed(0),
      feePct: PLATFORM_FEES.deposit,
      netFcfa: netFcfa.toFixed(0),
      cryptoAmount, cryptoCurrency,
    },
  }, useCinetPay
    ? "Redirigez-vous vers CinetPay pour confirmer le paiement."
    : `Dépôt initié. Frais: ${feeFcfa.toFixed(0)} FCFA (${PLATFORM_FEES.deposit}%)`,
    201);
};

export const cinetpayWebhook = async (req: Request, res: Response) => {
  const { cpm_trans_id, cpm_result, cpm_amount, cpm_currency } = req.body;
  res.status(200).send("OK");
  if (!cpm_trans_id) return;

  try {
    const payment = await checkCinetPayPayment(cpm_trans_id);
    if (payment.status !== "ACCEPTED") {
      await db.update(transactionsTable).set({ status: "FAILED", updatedAt: new Date() })
        .where(eq(transactionsTable.id, cpm_trans_id));
      return;
    }

    const txRows = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.id, cpm_trans_id)).limit(1);
    if (!txRows.length || txRows[0].status === "COMPLETED") return;

    const tx = txRows[0];
    const cryptoCurrency = tx.currency;
    const cryptoAmount = parseFloat(tx.amount.toString());
    const feeFcfa = parseFloat(tx.fee.toString());

    const wallets = await db.select().from(walletsTable)
      .where(and(eq(walletsTable.userId, tx.userId!), eq(walletsTable.currency, cryptoCurrency))).limit(1);
    if (wallets.length > 0) {
      const newBal = parseFloat(wallets[0].balance.toString()) + cryptoAmount;
      await db.update(walletsTable).set({ balance: newBal.toFixed(8), updatedAt: new Date() })
        .where(eq(walletsTable.id, wallets[0].id));
    }
    await db.update(transactionsTable).set({ status: "COMPLETED", processedAt: new Date(), updatedAt: new Date() })
      .where(eq(transactionsTable.id, cpm_trans_id));
    await creditPlatformFee({ feeAmountFcfa: feeFcfa, sourceType: "DEPOSIT", description: `CinetPay confirmé — ${cpm_amount} ${cpm_currency || "XOF"}` });
  } catch (e) { console.error("CinetPay webhook error:", e); }
};

export const mobileMoneyWithdrawal = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, cryptoCurrency, cryptoAmount, fiatCurrency = "XOF" } = req.body;
  const userId = req.user!.id;

  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, cryptoCurrency))).limit(1);
  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);

  const cryptoAmountNum = parseFloat(cryptoAmount);
  const balance = parseFloat(wallets[0].balance.toString());
  if (balance < cryptoAmountNum) return sendError(res, "Solde insuffisant", 400);

  const priceUSD = MOCK_PRICES[cryptoCurrency] || 1;
  const grossUSD = cryptoAmountNum * priceUSD;
  const grossFcfa = fiatCurrency === "XOF" ? grossUSD * FCFA_PER_USD : grossUSD;
  const feePct = PLATFORM_FEES.withdrawal / 100;
  const feeFcfa = grossFcfa * feePct;
  const netFcfa = grossFcfa - feeFcfa;
  const feeUSD = grossUSD * feePct;

  await db.update(walletsTable).set({ balance: (balance - cryptoAmountNum).toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, wallets[0].id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "WITHDRAWAL_FIAT", status: "REQUIRES_APPROVAL",
    currency: cryptoCurrency, amount: cryptoAmountNum.toString(),
    fee: feeUSD.toString(), netAmount: cryptoAmountNum.toString(),
    fiatCurrency, fiatAmount: grossFcfa.toString(), exchangeRate: priceUSD.toString(),
    description: `Retrait vers ${provider} (${phoneNumber})`,
    metadata: { provider, phoneNumber, feeFcfa, feePct: PLATFORM_FEES.withdrawal },
  }).returning();

  await creditPlatformFee({
    feeAmountFcfa: feeFcfa,
    sourceType: "WITHDRAWAL",
    description: `Retrait ${provider} — ${grossFcfa.toFixed(0)} XOF`,
  });

  return sendSuccess(res, {
    transaction: tx,
    summary: {
      grossFcfa: grossFcfa.toFixed(0),
      feeFcfa: feeFcfa.toFixed(0),
      feePct: PLATFORM_FEES.withdrawal,
      netFcfa: netFcfa.toFixed(0),
    },
  }, `Retrait soumis. Frais: ${feeFcfa.toFixed(0)} FCFA (${PLATFORM_FEES.withdrawal}%)`, 201);
};

export const bankTransferDeposit = async (req: AuthRequest, res: Response) => {
  const { bankName, accountNumber, amount, currency = "XOF", cryptoCurrency } = req.body;
  const userId = req.user!.id;

  const fiatAmountNum = parseFloat(amount);
  const feePct = PLATFORM_FEES.deposit / 100;
  const feeFcfa = fiatAmountNum * feePct;
  const netFcfa = fiatAmountNum - feeFcfa;

  const priceUSD = MOCK_PRICES[cryptoCurrency] || 1;
  const netUSD = netFcfa / FCFA_PER_USD;
  const cryptoAmount = netUSD / priceUSD;

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "DEPOSIT_FIAT", status: "PENDING",
    currency: cryptoCurrency, amount: cryptoAmount.toString(),
    fee: feeFcfa.toString(), netAmount: cryptoAmount.toString(),
    fiatCurrency: currency, fiatAmount: fiatAmountNum.toString(),
    exchangeRate: priceUSD.toString(),
    description: `Dépôt virement bancaire ${bankName}`,
    metadata: { bankName, accountNumber, feeFcfa },
  }).returning();

  setTimeout(async () => {
    await creditPlatformFee({
      feeAmountFcfa: feeFcfa,
      sourceType: "DEPOSIT",
      description: `Virement ${bankName} — ${fiatAmountNum} XOF`,
    });
  }, 0);

  return sendSuccess(res, { transaction: tx, feeFcfa: feeFcfa.toFixed(0), feePct: PLATFORM_FEES.deposit },
    `Virement enregistré. Frais plateforme: ${feeFcfa.toFixed(0)} FCFA`, 201);
};

export const bankTransferWithdrawal = async (req: AuthRequest, res: Response) => {
  const { bankName, accountNumber, accountName, cryptoCurrency, cryptoAmount, fiatCurrency = "XOF" } = req.body;
  const userId = req.user!.id;

  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, cryptoCurrency))).limit(1);
  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);

  const cryptoAmountNum = parseFloat(cryptoAmount);
  const balance = parseFloat(wallets[0].balance.toString());
  if (balance < cryptoAmountNum) return sendError(res, "Solde insuffisant", 400);

  const priceUSD = MOCK_PRICES[cryptoCurrency] || 1;
  const grossUSD = cryptoAmountNum * priceUSD;
  const grossFcfa = fiatCurrency === "XOF" ? grossUSD * FCFA_PER_USD : grossUSD;
  const feePct = PLATFORM_FEES.withdrawal / 100;
  const feeFcfa = grossFcfa * feePct;
  const feeUSD = grossUSD * feePct;

  await db.update(walletsTable).set({ balance: (balance - cryptoAmountNum).toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, wallets[0].id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "WITHDRAWAL_FIAT", status: "REQUIRES_APPROVAL",
    currency: cryptoCurrency, amount: cryptoAmountNum.toString(),
    fee: feeUSD.toString(), netAmount: cryptoAmountNum.toString(),
    fiatCurrency, fiatAmount: grossFcfa.toString(), exchangeRate: priceUSD.toString(),
    description: `Retrait virement bancaire vers ${bankName}`,
    metadata: { bankName, accountNumber, accountName, feeFcfa },
  }).returning();

  await creditPlatformFee({
    feeAmountFcfa: feeFcfa,
    sourceType: "WITHDRAWAL",
    description: `Retrait virement ${bankName} — ${grossFcfa.toFixed(0)} XOF`,
  });

  return sendSuccess(res, { transaction: tx, feeFcfa: feeFcfa.toFixed(0), feePct: PLATFORM_FEES.withdrawal },
    `Retrait soumis. Frais plateforme: ${feeFcfa.toFixed(0)} FCFA`, 201);
};
