import { Request, Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable, transactionsTable, kycDocumentsTable, supportTicketsTable,
  supportMessagesTable, feesTable, notificationsTable,
} from "@workspace/db";
import { eq, desc, sql, gte, and, or, ilike } from "drizzle-orm";
import { sendSuccess, sendError } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const getDashboardStats = async (_req: Request, res: Response) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsersResult, activeUsersResult, pendingKycResult,
    totalTxResult, pendingWithdrawals,
    recentUsers, recentTx, monthlyFeeResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.status, "ACTIVE")),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.kycStatus, "SUBMITTED")),
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable),
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(eq(transactionsTable.status, "REQUIRES_APPROVAL")),
    db.select({
      id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName,
      lastName: usersTable.lastName, kycStatus: usersTable.kycStatus, status: usersTable.status, createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt)).limit(10),
    db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(10),
    db.select({ total: sql<number>`coalesce(sum(fee::numeric), 0)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.status, "COMPLETED"), gte(transactionsTable.createdAt, monthStart))),
  ]);

  return sendSuccess(res, {
    totalUsers: Number(totalUsersResult[0].count),
    activeUsers: Number(activeUsersResult[0].count),
    pendingKyc: Number(pendingKycResult[0].count),
    totalTransactions: Number(totalTxResult[0].count),
    pendingWithdrawals: Number(pendingWithdrawals[0].count),
    monthlyFees: Number(monthlyFeeResult[0].total),
    recentUsers, recentTransactions: recentTx,
  }, "Statistiques admin récupérées");
};

export const getAllUsers = async (req: Request, res: Response) => {
  const { page = "1", limit = "20", search, status, kycStatus } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (search) conditions.push(or(ilike(usersTable.email, `%${search}%`), ilike(usersTable.username, `%${search}%`), ilike(usersTable.firstName, `%${search}%`)));
  if (status) conditions.push(eq(usersTable.status, status as any));
  if (kycStatus) conditions.push(eq(usersTable.kycStatus, kycStatus as any));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, countResult] = await Promise.all([
    db.select({
      id: usersTable.id, email: usersTable.email, username: usersTable.username,
      firstName: usersTable.firstName, lastName: usersTable.lastName,
      status: usersTable.status, kycStatus: usersTable.kycStatus, role: usersTable.role,
      createdAt: usersTable.createdAt, lastLoginAt: usersTable.lastLoginAt,
    }).from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(where),
  ]);

  return sendSuccess(res, {
    users, total: Number(countResult[0].count), page: pageNum, totalPages: Math.ceil(Number(countResult[0].count) / limitNum),
  }, "Utilisateurs récupérés");
};

export const getUser = async (req: Request, res: Response) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.params.userId)).limit(1);
  if (users.length === 0) return sendError(res, "Utilisateur introuvable", 404);
  const { passwordHash, twoFactorSecret, ...user } = users[0];
  return sendSuccess(res, user, "Utilisateur récupéré");
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const { userId } = req.params;
  const [user] = await db.update(usersTable).set({ status, updatedAt: new Date() })
    .where(eq(usersTable.id, userId)).returning({ id: usersTable.id, email: usersTable.email, status: usersTable.status });
  return sendSuccess(res, user, "Statut utilisateur mis à jour");
};

export const getKycRequests = async (req: Request, res: Response) => {
  const { page = "1", limit = "20", status = "SUBMITTED" } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const where = status !== "ALL" ? eq(kycDocumentsTable.status, status as any) : undefined;

  const [docs, countResult] = await Promise.all([
    db.select({
      id: kycDocumentsTable.id, documentType: kycDocumentsTable.documentType,
      documentUrl: kycDocumentsTable.documentUrl, status: kycDocumentsTable.status,
      adminNotes: kycDocumentsTable.adminNotes, createdAt: kycDocumentsTable.createdAt,
      userId: kycDocumentsTable.userId,
      userEmail: usersTable.email, userFirstName: usersTable.firstName, userLastName: usersTable.lastName,
    }).from(kycDocumentsTable)
      .leftJoin(usersTable, eq(kycDocumentsTable.userId, usersTable.id))
      .where(where).orderBy(kycDocumentsTable.createdAt).limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(kycDocumentsTable).where(where),
  ]);

  return sendSuccess(res, { documents: docs, total: Number(countResult[0].count), page: pageNum, totalPages: Math.ceil(Number(countResult[0].count) / limitNum) }, "Demandes KYC récupérées");
};

export const reviewKyc = async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  const { status, adminNotes } = req.body;
  if (!["APPROVED", "REJECTED"].includes(status)) return sendError(res, "Statut invalide", 400);

  const [doc] = await db.update(kycDocumentsTable).set({
    status, adminNotes, reviewedBy: req.user!.id, reviewedAt: new Date(), updatedAt: new Date(),
  }).where(eq(kycDocumentsTable.id, documentId)).returning();

  if (!doc) return sendError(res, "Document introuvable", 404);

  if (status === "APPROVED") {
    await db.update(usersTable).set({ kycStatus: "APPROVED", updatedAt: new Date() })
      .where(eq(usersTable.id, doc.userId));
    await db.insert(notificationsTable).values({
      userId: doc.userId, title: "KYC Approuvé", type: "SUCCESS",
      message: "Votre vérification d'identité a été approuvée. Vous pouvez désormais effectuer toutes les opérations.",
    });
  } else {
    await db.update(usersTable).set({ kycStatus: "REJECTED", updatedAt: new Date() })
      .where(eq(usersTable.id, doc.userId));
    await db.insert(notificationsTable).values({
      userId: doc.userId, title: "KYC Rejeté", type: "ERROR",
      message: `Votre vérification d'identité a été rejetée. Raison: ${adminNotes || "Documents non conformes"}`,
    });
  }

  return sendSuccess(res, doc, `KYC ${status === "APPROVED" ? "approuvé" : "rejeté"}`);
};

export const getAllTransactions = async (req: Request, res: Response) => {
  const { page = "1", limit = "20", status, type } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (status) conditions.push(eq(transactionsTable.status, status as any));
  if (type) conditions.push(eq(transactionsTable.type, type as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [txs, countResult] = await Promise.all([
    db.select().from(transactionsTable).where(where).orderBy(desc(transactionsTable.createdAt)).limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(where),
  ]);

  return sendSuccess(res, { transactions: txs, total: Number(countResult[0].count), page: pageNum, totalPages: Math.ceil(Number(countResult[0].count) / limitNum) }, "Transactions récupérées");
};

export const approveTransaction = async (req: Request, res: Response) => {
  const [tx] = await db.update(transactionsTable).set({ status: "COMPLETED", processedAt: new Date(), updatedAt: new Date() })
    .where(eq(transactionsTable.id, req.params.txId)).returning();
  if (!tx) return sendError(res, "Transaction introuvable", 404);
  return sendSuccess(res, tx, "Transaction approuvée");
};

export const rejectTransaction = async (req: Request, res: Response) => {
  const [tx] = await db.update(transactionsTable).set({ status: "FAILED", updatedAt: new Date() })
    .where(eq(transactionsTable.id, req.params.txId)).returning();
  if (!tx) return sendError(res, "Transaction introuvable", 404);
  return sendSuccess(res, tx, "Transaction rejetée");
};

export const getFees = async (_req: Request, res: Response) => {
  const fees = await db.select().from(feesTable);
  return sendSuccess(res, fees, "Frais récupérés");
};

export const updateFee = async (req: Request, res: Response) => {
  const { type } = req.params;
  const { value, description } = req.body;
  const existing = await db.select().from(feesTable).where(eq(feesTable.type, type)).limit(1);

  let fee;
  if (existing.length === 0) {
    [fee] = await db.insert(feesTable).values({ type, value: value.toString(), description }).returning();
  } else {
    [fee] = await db.update(feesTable).set({ value: value.toString(), description, updatedAt: new Date() })
      .where(eq(feesTable.type, type)).returning();
  }
  return sendSuccess(res, fee, "Frais mis à jour");
};

export const getSupportTickets = async (req: Request, res: Response) => {
  const { page = "1", limit = "20", status } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const where = status ? eq(supportTicketsTable.status, status as any) : undefined;

  const [tickets, countResult] = await Promise.all([
    db.select({
      id: supportTicketsTable.id, subject: supportTicketsTable.subject,
      category: supportTicketsTable.category, priority: supportTicketsTable.priority,
      status: supportTicketsTable.status, createdAt: supportTicketsTable.createdAt,
      userId: supportTicketsTable.userId,
      userEmail: usersTable.email, userFirstName: usersTable.firstName, userLastName: usersTable.lastName,
    }).from(supportTicketsTable)
      .leftJoin(usersTable, eq(supportTicketsTable.userId, usersTable.id))
      .where(where).orderBy(desc(supportTicketsTable.updatedAt)).limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(supportTicketsTable).where(where),
  ]);

  return sendSuccess(res, { tickets, total: Number(countResult[0].count), page: pageNum }, "Tickets récupérés");
};

export const adminReplyTicket = async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message) return sendError(res, "Message requis", 400);

  const [msg] = await db.insert(supportMessagesTable).values({
    ticketId: req.params.ticketId, userId: req.user!.id, message, isStaff: true,
  }).returning();

  await db.update(supportTicketsTable).set({ status: "IN_PROGRESS", updatedAt: new Date() })
    .where(eq(supportTicketsTable.id, req.params.ticketId));

  return sendSuccess(res, msg, "Réponse envoyée");
};

export const resolveTicket = async (req: Request, res: Response) => {
  await db.update(supportTicketsTable).set({ status: "RESOLVED", updatedAt: new Date() })
    .where(eq(supportTicketsTable.id, req.params.ticketId));
  return sendSuccess(res, null, "Ticket résolu");
};
