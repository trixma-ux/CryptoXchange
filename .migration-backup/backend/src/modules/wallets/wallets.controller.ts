import { Response } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { AuthRequest } from '../../middleware/auth';

// ---- Get All Wallets ----
export const getWallets = async (req: AuthRequest, res: Response) => {
  const wallets = await prisma.wallet.findMany({
    where: { userId: req.user!.id, isActive: true },
    orderBy: { currency: 'asc' },
  });
  return sendSuccess(res, wallets, 'Wallets récupérés');
};

// ---- Get Single Wallet ----
export const getWallet = async (req: AuthRequest, res: Response) => {
  const { currency } = req.params;
  const wallet = await prisma.wallet.findFirst({
    where: { userId: req.user!.id, currency: currency as any },
  });
  if (!wallet) return sendError(res, 'Wallet introuvable', 404);

  // Get recent transactions for this wallet
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user!.id, currency },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return sendSuccess(res, { wallet, transactions }, 'Wallet récupéré');
};

// ---- Get Wallet QR Code ----
export const getWalletQRCode = async (req: AuthRequest, res: Response) => {
  const { currency } = req.params;
  const wallet = await prisma.wallet.findFirst({
    where: { userId: req.user!.id, currency: currency as any },
  });
  if (!wallet) return sendError(res, 'Wallet introuvable', 404);

  const qrCode = await QRCode.toDataURL(wallet.address);
  return sendSuccess(res, { address: wallet.address, qrCode }, 'QR code généré');
};

// ---- Get Portfolio Summary ----
export const getPortfolioSummary = async (req: AuthRequest, res: Response) => {
  const wallets = await prisma.wallet.findMany({
    where: { userId: req.user!.id, isActive: true },
  });

  // In production, fetch real prices from CoinGecko
  const mockPrices: Record<string, number> = {
    BTC: 95000,
    ETH: 3400,
    USDT_TRC20: 1,
    USDT_ERC20: 1,
    USDT_BEP20: 1,
    BNB: 620,
    SOL: 185,
    LTC: 105,
    XRP: 2.1,
    MATIC: 0.95,
    DOGE: 0.35,
  };

  const FCFA_RATE = 605; // 1 USD = 605 FCFA approx

  const portfolioItems = wallets.map((w) => {
    const priceUSD = mockPrices[w.currency] || 0;
    const balanceNum = parseFloat(w.balance.toString());
    const valueUSD = balanceNum * priceUSD;
    const valueFCFA = valueUSD * FCFA_RATE;
    return {
      currency: w.currency,
      network: w.network,
      balance: balanceNum,
      address: w.address,
      priceUSD,
      valueUSD,
      valueFCFA,
    };
  });

  const totalUSD = portfolioItems.reduce((sum, item) => sum + item.valueUSD, 0);
  const totalFCFA = totalUSD * FCFA_RATE;

  return sendSuccess(res, { portfolioItems, totalUSD, totalFCFA, fcfaRate: FCFA_RATE }, 'Portfolio récupéré');
};
