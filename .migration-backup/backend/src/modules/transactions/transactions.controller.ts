import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { AuthRequest } from '../../middleware/auth';

// ---- Get All Transactions ----
export const getTransactions = async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', type, status, currency, startDate, endDate } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: any = { userId: req.user!.id };
  if (type) where.type = type;
  if (status) where.status = status;
  if (currency) where.currency = currency;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  return sendSuccess(res, {
    transactions,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  }, 'Transactions récupérées');
};

// ---- Get Single Transaction ----
export const getTransaction = async (req: AuthRequest, res: Response) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!transaction) return sendError(res, 'Transaction introuvable', 404);
  return sendSuccess(res, transaction, 'Transaction récupérée');
};

// ---- Deposit Crypto (manual confirmation) ----
export const createCryptoDeposit = async (req: AuthRequest, res: Response) => {
  const { currency, amount, txHash, network } = req.body;
  const userId = req.user!.id;

  const wallet = await prisma.wallet.findFirst({ where: { userId, currency: currency as any } });
  if (!wallet) return sendError(res, 'Wallet introuvable', 404);

  const transaction = await prisma.transaction.create({
    data: {
      userId, type: 'DEPOSIT_CRYPTO', status: 'PENDING',
      currency, amount, fee: 0, netAmount: amount,
      txHash, network, toAddress: wallet.address,
      description: `Dépôt ${amount} ${currency}`,
    },
  });

  return sendSuccess(res, transaction, 'Dépôt soumis, en attente de confirmation', 201);
};

// ---- Withdraw Crypto ----
export const createCryptoWithdrawal = async (req: AuthRequest, res: Response) => {
  const { currency, amount, toAddress, network } = req.body;
  const userId = req.user!.id;

  const wallet = await prisma.wallet.findFirst({ where: { userId, currency: currency as any } });
  if (!wallet) return sendError(res, 'Wallet introuvable', 404);

  const amountNum = parseFloat(amount);
  const balance = parseFloat(wallet.balance.toString());
  const fee = amountNum * 0.005; // 0.5% withdrawal fee
  const netAmount = amountNum - fee;

  if (balance < amountNum) return sendError(res, 'Solde insuffisant', 400);

  // Freeze balance
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { frozenBalance: { increment: amountNum }, balance: { decrement: amountNum } },
  });

  const transaction = await prisma.transaction.create({
    data: {
      userId, type: 'WITHDRAWAL_CRYPTO', status: 'REQUIRES_APPROVAL',
      currency, amount: amountNum, fee, netAmount,
      toAddress, network,
      description: `Retrait ${amountNum} ${currency} vers ${toAddress}`,
    },
  });

  return sendSuccess(res, transaction, 'Retrait soumis, en attente de validation', 201);
};
