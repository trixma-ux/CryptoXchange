import { Response } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendError, calculateFee, MOCK_PRICES, FCFA_PER_USD } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";
import { config } from "../../lib/config.js";

export const getUnifiedQuote = async (req: AuthRequest, res: Response) => {
  const { type = "buy", currency, fiatAmount, cryptoAmount, fiatCurrency = "XOF" } = req.query as Record<string, string>;
  if (type === "sell") return getSellQuote(req, res);
  return getBuyQuote(req, res);
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  const { db } = await import("@workspace/db");
  const { transactionsTable } = await import("@workspace/db");
  const { eq, or, desc } = await import("drizzle-orm");
  const rows = await db.select().from(transactionsTable)
    .where(or(eq(transactionsTable.type, "TRADE_BUY"), eq(transactionsTable.type, "TRADE_SELL")))
    .orderBy(desc(transactionsTable.createdAt)).limit(50);
  return sendSuccess(res, rows, "Historique de trading récupéré");
};

export const getBuyQuote = async (req: AuthRequest, res: Response) => {
  const { currency, fiatAmount, fiatCurrency = "XOF" } = req.query as Record<string, string>;
  const priceUSD = MOCK_PRICES[currency];
  if (!priceUSD) return sendError(res, "Cryptomonnaie non supportée", 400);

  const fiatAmountNum = parseFloat(fiatAmount);
  const fiatAmountUSD = fiatCurrency === "XOF" ? fiatAmountNum / FCFA_PER_USD : fiatAmountNum;
  const feePercent = config.fees.trading;
  const feeUSD = calculateFee(fiatAmountUSD, feePercent);
  const netUSD = fiatAmountUSD - feeUSD;
  const cryptoAmount = netUSD / priceUSD;

  return sendSuccess(res, {
    currency, fiatAmount: fiatAmountNum, fiatCurrency, cryptoAmount,
    exchangeRate: priceUSD, feePercent, feeUSD, netUSD,
  }, "Devis d'achat calculé");
};

export const buyCrypto = async (req: AuthRequest, res: Response) => {
  const { currency, fiatAmount, fiatCurrency = "XOF" } = req.body;
  const userId = req.user!.id;

  const priceUSD = MOCK_PRICES[currency];
  if (!priceUSD) return sendError(res, "Cryptomonnaie non supportée", 400);

  const fiatAmountNum = parseFloat(fiatAmount);
  const fiatAmountUSD = fiatCurrency === "XOF" ? fiatAmountNum / FCFA_PER_USD : fiatAmountNum;
  const feePercent = config.fees.trading;
  const feeUSD = calculateFee(fiatAmountUSD, feePercent);
  const netUSD = fiatAmountUSD - feeUSD;
  const cryptoAmount = netUSD / priceUSD;

  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, currency))).limit(1);
  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);

  const newBalance = parseFloat(wallets[0].balance.toString()) + cryptoAmount;
  await db.update(walletsTable).set({ balance: newBalance.toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, wallets[0].id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "TRADE_BUY", status: "COMPLETED", currency,
    amount: cryptoAmount.toString(), fee: feeUSD.toString(), netAmount: cryptoAmount.toString(),
    fiatCurrency, fiatAmount: fiatAmountNum.toString(), exchangeRate: priceUSD.toString(),
    description: `Achat ${cryptoAmount.toFixed(8)} ${currency}`,
  }).returning();

  return sendSuccess(res, {
    transaction: tx,
    summary: { cryptoAmount, fiatAmount: fiatAmountNum, feeUSD, netUSD, exchangeRate: priceUSD, fiatCurrency },
  }, `Achat de ${cryptoAmount.toFixed(8)} ${currency} réussi`);
};

export const getSellQuote = async (req: AuthRequest, res: Response) => {
  const { currency, cryptoAmount, fiatCurrency = "XOF" } = req.query as Record<string, string>;
  const priceUSD = MOCK_PRICES[currency];
  if (!priceUSD) return sendError(res, "Cryptomonnaie non supportée", 400);

  const cryptoAmountNum = parseFloat(cryptoAmount);
  const feePercent = config.fees.trading;
  const grossUSD = cryptoAmountNum * priceUSD;
  const feeUSD = calculateFee(grossUSD, feePercent);
  const netUSD = grossUSD - feeUSD;
  const fiatAmount = fiatCurrency === "XOF" ? netUSD * FCFA_PER_USD : netUSD;

  return sendSuccess(res, {
    currency, cryptoAmount: cryptoAmountNum, fiatAmount, fiatCurrency,
    exchangeRate: priceUSD, feePercent, feeUSD, grossUSD, netUSD,
  }, "Devis de vente calculé");
};

export const sellCrypto = async (req: AuthRequest, res: Response) => {
  const { currency, cryptoAmount, fiatCurrency = "XOF" } = req.body;
  const userId = req.user!.id;

  const priceUSD = MOCK_PRICES[currency];
  if (!priceUSD) return sendError(res, "Cryptomonnaie non supportée", 400);

  const cryptoAmountNum = parseFloat(cryptoAmount);
  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, currency))).limit(1);
  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);

  const balance = parseFloat(wallets[0].balance.toString());
  if (balance < cryptoAmountNum) return sendError(res, "Solde insuffisant", 400);

  const grossUSD = cryptoAmountNum * priceUSD;
  const feeUSD = calculateFee(grossUSD, config.fees.trading);
  const netUSD = grossUSD - feeUSD;
  const fiatAmount = fiatCurrency === "XOF" ? netUSD * FCFA_PER_USD : netUSD;

  await db.update(walletsTable).set({ balance: (balance - cryptoAmountNum).toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, wallets[0].id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "TRADE_SELL", status: "COMPLETED", currency,
    amount: cryptoAmountNum.toString(), fee: feeUSD.toString(), netAmount: cryptoAmountNum.toString(),
    fiatCurrency, fiatAmount: fiatAmount.toString(), exchangeRate: priceUSD.toString(),
    description: `Vente ${cryptoAmountNum.toFixed(8)} ${currency}`,
  }).returning();

  return sendSuccess(res, {
    transaction: tx,
    summary: { cryptoAmount: cryptoAmountNum, fiatAmount, feeUSD, netUSD, exchangeRate: priceUSD, fiatCurrency },
  }, `Vente de ${cryptoAmountNum.toFixed(8)} ${currency} réussie`);
};
