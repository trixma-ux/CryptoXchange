import { Response } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendError, MOCK_PRICES, FCFA_PER_USD } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";
import { creditPlatformFee, PLATFORM_FEES } from "../../lib/platform-fees.js";

export const mobileMoneyDeposit = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, amount, currency = "XOF", cryptoCurrency } = req.body;
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
    description: `Dépôt via ${provider} (${phoneNumber})`,
    metadata: { provider, phoneNumber, fiatAmount: fiatAmountNum, fiatCurrency: currency, feeFcfa },
  }).returning();

  setTimeout(async () => {
    const wallets = await db.select().from(walletsTable)
      .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, cryptoCurrency))).limit(1);
    if (wallets.length > 0) {
      const newBal = parseFloat(wallets[0].balance.toString()) + cryptoAmount;
      await db.update(walletsTable).set({ balance: newBal.toFixed(8), updatedAt: new Date() })
        .where(eq(walletsTable.id, wallets[0].id));
      await db.update(transactionsTable).set({ status: "COMPLETED", processedAt: new Date(), updatedAt: new Date() })
        .where(eq(transactionsTable.id, tx.id));

      await creditPlatformFee({
        feeAmountFcfa: feeFcfa,
        sourceType: "DEPOSIT",
        description: `Dépôt ${provider} — ${fiatAmountNum} XOF`,
      });
    }
  }, 3000);

  return sendSuccess(res, {
    transaction: tx,
    summary: {
      provider, phoneNumber,
      fiatAmount: fiatAmountNum, currency,
      feeFcfa: feeFcfa.toFixed(0),
      feePct: PLATFORM_FEES.deposit,
      netFcfa: netFcfa.toFixed(0),
      cryptoAmount, cryptoCurrency,
    },
  }, `Dépôt via ${provider} initié. Frais: ${feeFcfa.toFixed(0)} FCFA (${PLATFORM_FEES.deposit}%)`, 201);
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
