import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError, calculateFee } from '../../utils/helpers';
import { createAuditLog } from '../../utils/audit';
import { AuthRequest } from '../../middleware/auth';
import { config } from '../../config';

const MOCK_PRICES: Record<string, number> = {
  BTC: 95000, ETH: 3400, USDT_TRC20: 1, USDT_ERC20: 1, USDT_BEP20: 1,
  BNB: 620, SOL: 185, LTC: 105, XRP: 2.1,
};

// ---- Get Swap Quote ----
export const getSwapQuote = async (req: AuthRequest, res: Response) => {
  const { fromCurrency, toCurrency, fromAmount } = req.query as Record<string, string>;

  const fromPrice = MOCK_PRICES[fromCurrency];
  const toPrice = MOCK_PRICES[toCurrency];
  if (!fromPrice || !toPrice) return sendError(res, 'Paire de swap non supportée', 400);

  const fromAmountNum = parseFloat(fromAmount);
  const exchangeRate = fromPrice / toPrice;
  const feePercent = config.fees.swap;
  const feeInFrom = calculateFee(fromAmountNum, feePercent);
  const netFromAmount = fromAmountNum - feeInFrom;
  const toAmount = netFromAmount * exchangeRate;

  return sendSuccess(res, {
    fromCurrency, toCurrency, fromAmount: fromAmountNum, toAmount,
    exchangeRate, feePercent, feeInFrom, fromPrice, toPrice,
  }, 'Devis swap calculé');
};

// ---- Execute Swap ----
export const executeSwap = async (req: AuthRequest, res: Response) => {
  const { fromCurrency, toCurrency, fromAmount } = req.body;
  const userId = req.user!.id;

  const fromPrice = MOCK_PRICES[fromCurrency];
  const toPrice = MOCK_PRICES[toCurrency];
  if (!fromPrice || !toPrice) return sendError(res, 'Paire non supportée', 400);

  const fromAmountNum = parseFloat(fromAmount);
  const fromWallet = await prisma.wallet.findFirst({ where: { userId, currency: fromCurrency as any } });
  const toWallet = await prisma.wallet.findFirst({ where: { userId, currency: toCurrency as any } });

  if (!fromWallet || !toWallet) return sendError(res, 'Wallet introuvable', 404);

  const fromBalance = parseFloat(fromWallet.balance.toString());
  if (fromBalance < fromAmountNum) return sendError(res, 'Solde insuffisant', 400);

  const exchangeRate = fromPrice / toPrice;
  const feePercent = config.fees.swap;
  const feeInFrom = calculateFee(fromAmountNum, feePercent);
  const netFromAmount = fromAmountNum - feeInFrom;
  const toAmount = netFromAmount * exchangeRate;

  // Atomic update
  await prisma.$transaction([
    prisma.wallet.update({ where: { id: fromWallet.id }, data: { balance: { decrement: fromAmountNum } } }),
    prisma.wallet.update({ where: { id: toWallet.id }, data: { balance: { increment: toAmount } } }),
  ]);

  const swap = await prisma.swap.create({
    data: {
      userId, fromCurrency, toCurrency, fromAmount: fromAmountNum,
      toAmount, exchangeRate, fee: feeInFrom, status: 'COMPLETED',
    },
  });

  await createAuditLog({ userId, action: 'SWAP_EXECUTED', entity: 'Swap', entityId: swap.id });

  return sendSuccess(res, { swap, toAmount, exchangeRate, fee: feeInFrom }, `Swap de ${fromAmountNum} ${fromCurrency} → ${toAmount.toFixed(8)} ${toCurrency} réussi`);
};

// ---- Get Swap History ----
export const getSwapHistory = async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [swaps, total] = await Promise.all([
    prisma.swap.findMany({ where: { userId: req.user!.id }, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.swap.count({ where: { userId: req.user!.id } }),
  ]);
  return sendSuccess(res, { swaps, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, 'Historique swap récupéré');
};
