import { Response } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendError, MOCK_PRICES, FCFA_PER_USD } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const mobileMoneyDeposit = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, amount, currency = "XOF", cryptoCurrency } = req.body;
  const userId = req.user!.id;

  const fiatAmountNum = parseFloat(amount);
  const priceUSD = MOCK_PRICES[cryptoCurrency] || 1;
  const fiatUSD = currency === "XOF" ? fiatAmountNum / FCFA_PER_USD : fiatAmountNum;
  const cryptoAmount = fiatUSD / priceUSD;

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "DEPOSIT_FIAT", status: "PENDING",
    currency: cryptoCurrency, amount: cryptoAmount.toString(),
    fee: "0", netAmount: cryptoAmount.toString(),
    fiatCurrency: currency, fiatAmount: fiatAmountNum.toString(),
    exchangeRate: priceUSD.toString(),
    description: `Dépôt via ${provider} (${phoneNumber})`,
    metadata: { provider, phoneNumber, fiatAmount: fiatAmountNum, fiatCurrency: currency },
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
    }
  }, 3000);

  return sendSuccess(res, {
    transaction: tx,
    summary: { provider, phoneNumber, fiatAmount: fiatAmountNum, currency, cryptoAmount, cryptoCurrency },
  }, `Dépôt via ${provider} initié. Confirmation en cours...`, 201);
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
  const fiatAmount = fiatCurrency === "XOF" ? grossUSD * FCFA_PER_USD : grossUSD;
  const fee = grossUSD * 0.005;

  await db.update(walletsTable).set({ balance: (balance - cryptoAmountNum).toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, wallets[0].id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "WITHDRAWAL_FIAT", status: "REQUIRES_APPROVAL",
    currency: cryptoCurrency, amount: cryptoAmountNum.toString(),
    fee: fee.toString(), netAmount: cryptoAmountNum.toString(),
    fiatCurrency, fiatAmount: fiatAmount.toString(), exchangeRate: priceUSD.toString(),
    description: `Retrait vers ${provider} (${phoneNumber})`,
    metadata: { provider, phoneNumber },
  }).returning();

  return sendSuccess(res, { transaction: tx }, "Demande de retrait soumise pour validation", 201);
};

export const bankTransferDeposit = async (req: AuthRequest, res: Response) => {
  const { bankName, accountNumber, amount, currency = "XOF", cryptoCurrency } = req.body;
  const userId = req.user!.id;

  const fiatAmountNum = parseFloat(amount);
  const priceUSD = MOCK_PRICES[cryptoCurrency] || 1;
  const fiatUSD = currency === "XOF" ? fiatAmountNum / FCFA_PER_USD : fiatAmountNum;
  const cryptoAmount = fiatUSD / priceUSD;

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "DEPOSIT_FIAT", status: "PENDING",
    currency: cryptoCurrency, amount: cryptoAmount.toString(),
    fee: "0", netAmount: cryptoAmount.toString(),
    fiatCurrency: currency, fiatAmount: fiatAmountNum.toString(),
    exchangeRate: priceUSD.toString(),
    description: `Dépôt virement bancaire ${bankName}`,
    metadata: { bankName, accountNumber },
  }).returning();

  return sendSuccess(res, { transaction: tx }, "Virement bancaire enregistré. En attente de réception.", 201);
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
  const fiatAmount = fiatCurrency === "XOF" ? grossUSD * FCFA_PER_USD : grossUSD;

  await db.update(walletsTable).set({ balance: (balance - cryptoAmountNum).toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, wallets[0].id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "WITHDRAWAL_FIAT", status: "REQUIRES_APPROVAL",
    currency: cryptoCurrency, amount: cryptoAmountNum.toString(),
    fee: "0", netAmount: cryptoAmountNum.toString(),
    fiatCurrency, fiatAmount: fiatAmount.toString(), exchangeRate: priceUSD.toString(),
    description: `Retrait virement bancaire vers ${bankName}`,
    metadata: { bankName, accountNumber, accountName },
  }).returning();

  return sendSuccess(res, { transaction: tx }, "Demande de retrait soumise", 201);
};
