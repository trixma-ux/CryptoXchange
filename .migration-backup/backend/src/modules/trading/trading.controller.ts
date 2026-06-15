import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError, calculateFee } from '../../utils/helpers';
import { createAuditLog } from '../../utils/audit';
import { AuthRequest } from '../../middleware/auth';
import { io } from '../../index';
import { config } from '../../config';

// Mock prices (replace with CoinGecko in production)
const MOCK_PRICES: Record<string, number> = {
  BTC: 95000, ETH: 3400, USDT_TRC20: 1, USDT_ERC20: 1, USDT_BEP20: 1,
  BNB: 620, SOL: 185, LTC: 105, XRP: 2.1,
};
const FCFA_PER_USD = 605;

// ---- Buy Crypto ----
export const buyCrypto = async (req: AuthRequest, res: Response) => {
  const { currency, fiatAmount, fiatCurrency = 'XOF' } = req.body;
  const userId = req.user!.id;

  const priceUSD = MOCK_PRICES[currency];
  if (!priceUSD) return sendError(res, 'Cryptomonnaie non supportée', 400);

  const fiatAmountNum = parseFloat(fiatAmount);
  const fiatAmountUSD = fiatCurrency === 'XOF' ? fiatAmountNum / FCFA_PER_USD : fiatAmountNum;
  const feePercent = config.fees.trading;
  const feeUSD = calculateFee(fiatAmountUSD, feePercent);
  const netUSD = fiatAmountUSD - feeUSD;
  const cryptoAmount = netUSD / priceUSD;
  const exchangeRate = priceUSD;

  // Update wallet balance
  const wallet = await prisma.wallet.findFirst({ where: { userId, currency: currency as any } });
  if (!wallet) return sendError(res, 'Wallet introuvable', 404);

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: cryptoAmount } },
  });

  const trade = await prisma.trade.create({
    data: {
      userId, type: 'BUY', cryptoCurrency: currency, fiatCurrency,
      cryptoAmount, fiatAmount: fiatAmountNum, exchangeRate,
      fee: feeUSD, status: 'COMPLETED',
    },
  });

  await prisma.transaction.create({
    data: {
      userId, type: 'TRADE_BUY', status: 'COMPLETED', currency,
      amount: cryptoAmount, fee: feeUSD, netAmount: cryptoAmount,
      fiatCurrency, fiatAmount: fiatAmountNum, exchangeRate,
      description: `Achat ${cryptoAmount.toFixed(8)} ${currency}`,
    },
  });

  await createAuditLog({ userId, action: 'CRYPTO_BOUGHT', entity: 'Trade', entityId: trade.id });

  // Notify via socket
  io.to(`user_${userId}`).emit('trade_completed', { type: 'BUY', currency, cryptoAmount, fiatAmount: fiatAmountNum });

  return sendSuccess(res, {
    trade,
    summary: { cryptoAmount, fiatAmount: fiatAmountNum, feeUSD, netUSD, exchangeRate, fiatCurrency },
  }, `Achat de ${cryptoAmount.toFixed(8)} ${currency} réussi`);
};

// ---- Sell Crypto ----
export const sellCrypto = async (req: AuthRequest, res: Response) => {
  const { currency, cryptoAmount, fiatCurrency = 'XOF' } = req.body;
  const userId = req.user!.id;

  const priceUSD = MOCK_PRICES[currency];
  if (!priceUSD) return sendError(res, 'Cryptomonnaie non supportée', 400);

  const cryptoAmountNum = parseFloat(cryptoAmount);
  const wallet = await prisma.wallet.findFirst({ where: { userId, currency: currency as any } });
  if (!wallet) return sendError(res, 'Wallet introuvable', 404);

  const walletBalance = parseFloat(wallet.balance.toString());
  if (walletBalance < cryptoAmountNum) return sendError(res, 'Solde insuffisant', 400);

  const grossUSD = cryptoAmountNum * priceUSD;
  const feePercent = config.fees.trading;
  const feeUSD = calculateFee(grossUSD, feePercent);
  const netUSD = grossUSD - feeUSD;
  const fiatAmount = fiatCurrency === 'XOF' ? netUSD * FCFA_PER_USD : netUSD;

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: cryptoAmountNum } },
  });

  const trade = await prisma.trade.create({
    data: {
      userId, type: 'SELL', cryptoCurrency: currency, fiatCurrency,
      cryptoAmount: cryptoAmountNum, fiatAmount, exchangeRate: priceUSD,
      fee: feeUSD, status: 'COMPLETED',
    },
  });

  await prisma.transaction.create({
    data: {
      userId, type: 'TRADE_SELL', status: 'COMPLETED', currency,
      amount: cryptoAmountNum, fee: feeUSD, netAmount: cryptoAmountNum,
      fiatCurrency, fiatAmount, exchangeRate: priceUSD,
      description: `Vente ${cryptoAmountNum.toFixed(8)} ${currency}`,
    },
  });

  await createAuditLog({ userId, action: 'CRYPTO_SOLD', entity: 'Trade', entityId: trade.id });
  io.to(`user_${userId}`).emit('trade_completed', { type: 'SELL', currency, cryptoAmount: cryptoAmountNum, fiatAmount });

  return sendSuccess(res, {
    trade,
    summary: { cryptoAmount: cryptoAmountNum, fiatAmount, feeUSD, grossUSD, exchangeRate: priceUSD, fiatCurrency },
  }, `Vente de ${cryptoAmountNum.toFixed(8)} ${currency} réussie`);
};

// ---- Get Quote ----
export const getQuote = async (req: AuthRequest, res: Response) => {
  const { currency, fiatAmount, cryptoAmount, type, fiatCurrency = 'XOF' } = req.query as Record<string, string>;
  const priceUSD = MOCK_PRICES[currency];
  if (!priceUSD) return sendError(res, 'Cryptomonnaie non supportée', 400);

  const feePercent = config.fees.trading;
  let quote: object;

  if (type === 'BUY' && fiatAmount) {
    const fiatAmountNum = parseFloat(fiatAmount);
    const fiatUSD = fiatCurrency === 'XOF' ? fiatAmountNum / FCFA_PER_USD : fiatAmountNum;
    const feeUSD = calculateFee(fiatUSD, feePercent);
    const netUSD = fiatUSD - feeUSD;
    const cryptoOut = netUSD / priceUSD;
    quote = { type: 'BUY', currency, fiatAmount: fiatAmountNum, fiatCurrency, cryptoAmount: cryptoOut, priceUSD, feeUSD, feePercent };
  } else if (type === 'SELL' && cryptoAmount) {
    const cryptoAmountNum = parseFloat(cryptoAmount);
    const grossUSD = cryptoAmountNum * priceUSD;
    const feeUSD = calculateFee(grossUSD, feePercent);
    const netUSD = grossUSD - feeUSD;
    const fiatOut = fiatCurrency === 'XOF' ? netUSD * FCFA_PER_USD : netUSD;
    quote = { type: 'SELL', currency, cryptoAmount: cryptoAmountNum, priceUSD, grossUSD, feeUSD, feePercent, fiatAmount: fiatOut, fiatCurrency };
  } else {
    return sendError(res, 'Paramètres invalides', 400);
  }

  return sendSuccess(res, quote, 'Devis calculé');
};

// ---- Get Trade History ----
export const getTradeHistory = async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', type } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = { userId: req.user!.id };
  if (type) where.type = type;

  const [trades, total] = await Promise.all([
    prisma.trade.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.trade.count({ where }),
  ]);

  return sendSuccess(res, { trades, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, 'Historique récupéré');
};
