import { Response } from "express";
import { db } from "@workspace/db";
import { transactionsTable, walletsTable } from "@workspace/db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { sendSuccess, sendError } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const getTransactions = async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20", type, status, currency, startDate, endDate } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(transactionsTable.userId, req.user!.id)];
  if (type) conditions.push(eq(transactionsTable.type, type as any));
  if (status) conditions.push(eq(transactionsTable.status, status as any));
  if (currency) conditions.push(eq(transactionsTable.currency, currency));
  if (startDate) conditions.push(gte(transactionsTable.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(transactionsTable.createdAt, new Date(endDate)));

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(transactionsTable).where(where).orderBy(desc(transactionsTable.createdAt)).limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(where),
  ]);

  const total = Number(countResult[0].count);
  return sendSuccess(res, {
    transactions: rows, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum),
  }, "Transactions récupérées");
};

export const getTransaction = async (req: AuthRequest, res: Response) => {
  const rows = await db.select().from(transactionsTable)
    .where(and(eq(transactionsTable.id, req.params.id), eq(transactionsTable.userId, req.user!.id))).limit(1);
  if (rows.length === 0) return sendError(res, "Transaction introuvable", 404);
  return sendSuccess(res, rows[0], "Transaction récupérée");
};

export const createCryptoDeposit = async (req: AuthRequest, res: Response) => {
  const { currency, amount, txHash, network } = req.body;
  const userId = req.user!.id;

  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, currency))).limit(1);
  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);

  const amountNum = parseFloat(amount);
  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "DEPOSIT_CRYPTO", status: "PENDING", currency,
    amount: amountNum.toString(), fee: "0", netAmount: amountNum.toString(),
    txHash, network, toAddress: wallets[0].address,
    description: `Dépôt ${amountNum} ${currency}`,
  }).returning();

  return sendSuccess(res, tx, "Dépôt soumis, en attente de confirmation", 201);
};

export const createCryptoWithdrawal = async (req: AuthRequest, res: Response) => {
  const { currency, amount, toAddress, network } = req.body;
  const userId = req.user!.id;

  const wallets = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, currency))).limit(1);
  if (wallets.length === 0) return sendError(res, "Wallet introuvable", 404);

  const amountNum = parseFloat(amount);
  const balance = parseFloat(wallets[0].balance.toString());
  const fee = amountNum * 0.005;
  const netAmount = amountNum - fee;

  if (balance < amountNum) return sendError(res, "Solde insuffisant", 400);

  await db.update(walletsTable).set({
    balance: (balance - amountNum).toFixed(8), updatedAt: new Date(),
  }).where(eq(walletsTable.id, wallets[0].id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "WITHDRAWAL_CRYPTO", status: "REQUIRES_APPROVAL", currency,
    amount: amountNum.toString(), fee: fee.toString(), netAmount: netAmount.toString(),
    network, toAddress, description: `Retrait ${netAmount.toFixed(8)} ${currency}`,
  }).returning();

  return sendSuccess(res, tx, "Demande de retrait soumise", 201);
};
