import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { createAuditLog } from '../../utils/audit';
import { AuthRequest } from '../../middleware/auth';

// ---- Dashboard Stats ----
export const getDashboardStats = async (_req: Request, res: Response) => {
  const [
    totalUsers, activeUsers, pendingKyc,
    totalTransactions, pendingWithdrawals,
    recentUsers, recentTransactions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { kycStatus: 'PENDING' } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: 'REQUIRES_APPROVAL' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, email: true, firstName: true, lastName: true, kycStatus: true, status: true, createdAt: true } }),
    prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  // Monthly revenue from fees
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const feeAgg = await prisma.transaction.aggregate({
    where: { createdAt: { gte: monthStart }, status: 'COMPLETED' },
    _sum: { fee: true },
  });

  return sendSuccess(res, {
    totalUsers, activeUsers, pendingKyc,
    totalTransactions, pendingWithdrawals,
    monthlyFees: feeAgg._sum.fee || 0,
    recentUsers, recentTransactions,
  }, 'Statistiques admin récupérées');
};

// ---- Get All Users ----
export const getAllUsers = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, status, kycStatus } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  if (search) where.OR = [
    { email: { contains: search, mode: 'insensitive' } },
    { username: { contains: search, mode: 'insensitive' } },
    { firstName: { contains: search, mode: 'insensitive' } },
  ];
  if (status) where.status = status;
  if (kycStatus) where.kycStatus = kycStatus;

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, username: true, firstName: true, lastName: true, status: true, kycStatus: true, role: true, createdAt: true, lastLoginAt: true } }),
    prisma.user.count({ where }),
  ]);

  return sendSuccess(res, { users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, 'Utilisateurs récupérés');
};

// ---- Update User Status ----
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const { userId } = req.params;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, email: true, status: true },
  });

  await createAuditLog({ userId: req.user!.id, action: 'USER_STATUS_UPDATED', entity: 'User', entityId: userId, metadata: { newStatus: status } });
  return sendSuccess(res, user, 'Statut utilisateur mis à jour');
};

// ---- Get KYC Requests ----
export const getKycRequests = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status = 'PENDING' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [documents, total] = await Promise.all([
    prisma.kycDocument.findMany({
      where: { status: status as any },
      skip, take: parseInt(limit),
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    }),
    prisma.kycDocument.count({ where: { status: status as any } }),
  ]);

  return sendSuccess(res, { documents, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, 'Demandes KYC récupérées');
};

// ---- Review KYC ----
export const reviewKyc = async (req: AuthRequest, res: Response) => {
  const { documentId } = req.params;
  const { status, adminNotes } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) return sendError(res, 'Statut invalide', 400);

  const document = await prisma.kycDocument.update({
    where: { id: documentId },
    data: { status, adminNotes, reviewedAt: new Date(), reviewedBy: req.user!.id },
    include: { user: true },
  });

  // If all required documents approved, update user KYC status
  if (status === 'APPROVED') {
    const allDocs = await prisma.kycDocument.findMany({ where: { userId: document.userId } });
    const hasId = allDocs.some(d => ['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE'].includes(d.type) && d.status === 'APPROVED');
    const hasSelfie = allDocs.some(d => d.type === 'SELFIE' && d.status === 'APPROVED');
    if (hasId && hasSelfie) {
      await prisma.user.update({ where: { id: document.userId }, data: { kycStatus: 'APPROVED' } });
    }
  } else {
    await prisma.user.update({ where: { id: document.userId }, data: { kycStatus: 'REJECTED' } });
  }

  await createAuditLog({ userId: req.user!.id, action: `KYC_${status}`, entity: 'KycDocument', entityId: documentId });
  return sendSuccess(res, document, `Document KYC ${status === 'APPROVED' ? 'approuvé' : 'refusé'}`);
};

// ---- Get All Transactions (Admin) ----
export const getAllTransactions = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', type, status } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true, firstName: true, lastName: true } } } }),
    prisma.transaction.count({ where }),
  ]);

  return sendSuccess(res, { transactions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, 'Transactions récupérées');
};

// ---- Approve/Reject Withdrawal ----
export const reviewWithdrawal = async (req: AuthRequest, res: Response) => {
  const { txId } = req.params;
  const { action, adminNotes } = req.body;

  if (!['APPROVE', 'REJECT'].includes(action)) return sendError(res, 'Action invalide', 400);

  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  if (!tx || tx.status !== 'REQUIRES_APPROVAL') return sendError(res, 'Transaction introuvable ou non en attente', 404);

  if (action === 'APPROVE') {
    await prisma.transaction.update({ where: { id: txId }, data: { status: 'COMPLETED', adminNotes, processedAt: new Date(), processedBy: req.user!.id } });
    // Release frozen balance
    if (tx.currency) {
      await prisma.wallet.updateMany({ where: { userId: tx.userId, currency: tx.currency as any }, data: { frozenBalance: { decrement: tx.amount } } });
    }
  } else {
    await prisma.transaction.update({ where: { id: txId }, data: { status: 'CANCELLED', adminNotes, processedAt: new Date(), processedBy: req.user!.id } });
    // Restore balance
    if (tx.currency) {
      await prisma.wallet.updateMany({ where: { userId: tx.userId, currency: tx.currency as any }, data: { balance: { increment: tx.amount }, frozenBalance: { decrement: tx.amount } } });
    }
  }

  await createAuditLog({ userId: req.user!.id, action: `WITHDRAWAL_${action}D`, entity: 'Transaction', entityId: txId });
  return sendSuccess(res, null, `Retrait ${action === 'APPROVE' ? 'approuvé' : 'rejeté'}`);
};

// ---- Get/Update Fee Config ----
export const getFeeConfigs = async (_req: Request, res: Response) => {
  const fees = await prisma.feeConfig.findMany();
  return sendSuccess(res, fees, 'Frais récupérés');
};

export const updateFeeConfig = async (req: AuthRequest, res: Response) => {
  const { type, percentage, minAmount, maxAmount } = req.body;
  const fee = await prisma.feeConfig.upsert({
    where: { type },
    create: { type, percentage, minAmount, maxAmount },
    update: { percentage, minAmount, maxAmount },
  });
  await createAuditLog({ userId: req.user!.id, action: 'FEE_CONFIG_UPDATED', entity: 'FeeConfig', entityId: fee.id });
  return sendSuccess(res, fee, 'Frais mis à jour');
};

// ---- Admin Support ----
export const getAllTickets = async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const where: any = {};
  if (status) where.status = status;

  const tickets = await prisma.supportTicket.findMany({
    where, orderBy: { updatedAt: 'desc' },
    include: { user: { select: { email: true, firstName: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return sendSuccess(res, tickets, 'Tickets récupérés');
};

export const replyToTicketAdmin = async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return sendError(res, 'Ticket introuvable', 404);

  const msg = await prisma.supportMessage.create({
    data: { ticketId: ticket.id, userId: req.user!.id, message, isAdmin: true },
  });
  await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: 'IN_PROGRESS', updatedAt: new Date() } });
  return sendSuccess(res, msg, 'Réponse envoyée', 201);
};
