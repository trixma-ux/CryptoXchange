import { Response } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { sendSuccess, sendError, MOCK_PRICES, FCFA_PER_USD } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const getWallets = async (req: AuthRequest, res: Response) => {
  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, req.user!.id), eq(walletsTable.isActive, true)));

  const enriched = wallets.map((w) => {
    const priceUSD = MOCK_PRICES[w.currency] || 0;
    const balance = parseFloat(w.balance.toString());
    const valueUSD = balance * priceUSD;
    const valueFCFA = valueUSD * FCFA_PER_USD;
    return { ...w, priceUSD, valueUSD, valueFCFA };
  });

  const totalFCFA = enriched.reduce((sum, w) => sum + w.valueFCFA, 0);
  const totalUSD = enriched.reduce((sum, w) => sum + w.valueUSD, 0);

  return sendSuccess(res, { wallets: enriched, totalFCFA, totalUSD }, "Wallets récupérés");
};

export const getWallet = async (req: AuthRequest, res: Response) => {
  const { currency } = req.params;
  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, req.user!.id), eq(walletsTable.currency, currency))).limit(1);

  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);
  const wallet = wallets[0];

  const transactions = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.userId, req.user!.id), eq(transactionsTable.currency, currency)))
    .orderBy(desc(transactionsTable.createdAt)).limit(20);

  const priceUSD = MOCK_PRICES[currency] || 0;
  const balance = parseFloat(wallet.balance.toString());
  return sendSuccess(res, {
    wallet: { ...wallet, priceUSD, valueUSD: balance * priceUSD, valueFCFA: balance * priceUSD * FCFA_PER_USD },
    transactions,
  }, "Wallet récupéré");
};

export const getWalletQRCode = async (req: AuthRequest, res: Response) => {
  const { currency } = req.params;
  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, req.user!.id), eq(walletsTable.currency, currency))).limit(1);
  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);
  const address = wallets[0].address;
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(address)}&size=200x200`;
  return sendSuccess(res, { address, qrCode }, "QR code généré");
};

export const getPortfolioSummary = async (req: AuthRequest, res: Response) => {
  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, req.user!.id), eq(walletsTable.isActive, true)));

  const portfolioItems = wallets.map((w) => {
    const priceUSD = MOCK_PRICES[w.currency] || 0;
    const balance = parseFloat(w.balance.toString());
    const valueUSD = balance * priceUSD;
    const valueFCFA = valueUSD * FCFA_PER_USD;
    return { currency: w.currency, network: w.network, balance, address: w.address, priceUSD, valueUSD, valueFCFA };
  });

  const totalFCFA = portfolioItems.reduce((s, i) => s + i.valueFCFA, 0);
  const totalUSD = portfolioItems.reduce((s, i) => s + i.valueUSD, 0);

  return sendSuccess(res, { portfolioItems, totalFCFA, totalUSD }, "Portfolio récupéré");
};
