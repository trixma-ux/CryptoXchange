import { Router } from 'express';
import axios from 'axios';
import { sendSuccess, sendError } from '../../utils/helpers';

const router = Router();

// Crypto price mappings for CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT_TRC20: 'tether', USDT_ERC20: 'tether',
  USDT_BEP20: 'tether', BNB: 'binancecoin', SOL: 'solana', LTC: 'litecoin',
  XRP: 'ripple', MATIC: 'matic-network', DOGE: 'dogecoin',
};

// Mock prices fallback
const MOCK_PRICES: Record<string, { usd: number; usd_24h_change: number }> = {
  bitcoin: { usd: 95000, usd_24h_change: 2.34 },
  ethereum: { usd: 3400, usd_24h_change: 1.87 },
  tether: { usd: 1, usd_24h_change: 0.01 },
  binancecoin: { usd: 620, usd_24h_change: -0.45 },
  solana: { usd: 185, usd_24h_change: 3.12 },
  litecoin: { usd: 105, usd_24h_change: -1.23 },
  ripple: { usd: 2.1, usd_24h_change: 0.87 },
  'matic-network': { usd: 0.95, usd_24h_change: -2.11 },
  dogecoin: { usd: 0.35, usd_24h_change: 4.56 },
};

let cachedPrices: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

router.get('/', async (_req, res) => {
  const now = Date.now();
  if (cachedPrices && (now - lastFetchTime) < CACHE_TTL) {
    return sendSuccess(res, cachedPrices, 'Prix récupérés (cache local)');
  }

  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      { timeout: 5000 }
    );

    const prices: Record<string, any> = {};
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      prices[symbol] = response.data[geckoId] || MOCK_PRICES[geckoId];
    }

    // Add FCFA conversion
    const FCFA_RATE = 605;
    const XAF_RATE = 655;
    for (const symbol of Object.keys(prices)) {
      if (prices[symbol]?.usd) {
        prices[symbol].xof = prices[symbol].usd * FCFA_RATE;
        prices[symbol].xaf = prices[symbol].usd * XAF_RATE;
      }
    }

    cachedPrices = { prices, fcfaRate: FCFA_RATE, xafRate: XAF_RATE, updatedAt: new Date() };
    lastFetchTime = now;

    return sendSuccess(res, cachedPrices, 'Prix récupérés');
  } catch (error: any) {
    console.error('Erreur API CoinGecko:', error.message);
    if (cachedPrices) {
      return sendSuccess(res, cachedPrices, 'Prix récupérés (cache local - erreur API)');
    }
    // Fallback to mock prices
    const prices: Record<string, any> = {};
    const FCFA_RATE = 605;
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      const mock = MOCK_PRICES[geckoId] || { usd: 0, usd_24h_change: 0 };
      prices[symbol] = { ...mock, xof: mock.usd * FCFA_RATE, xaf: mock.usd * 655 };
    }
    return sendSuccess(res, { prices, fcfaRate: FCFA_RATE, source: 'mock', updatedAt: new Date() }, 'Prix (cache par défaut)');
  }
});

router.get('/chart/:currency', async (req, res) => {
  const { currency } = req.params;
  const { days = '7' } = req.query as { days: string };
  const geckoId = COINGECKO_IDS[currency];
  if (!geckoId) return sendError(res, 'Crypto non supportée', 400);

  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`,
      { timeout: 10000 }
    );
    return sendSuccess(res, response.data, 'Graphique récupéré');
  } catch {
    // Generate mock chart data
    const now = Date.now();
    const interval = (parseInt(days) * 24 * 60 * 60 * 1000) / 100;
    const basePrice = MOCK_PRICES[geckoId]?.usd || 1;
    const prices = Array.from({ length: 100 }, (_, i) => {
      const time = now - (100 - i) * interval;
      const variation = (Math.random() - 0.5) * 0.05;
      return [time, basePrice * (1 + variation)];
    });
    return sendSuccess(res, { prices }, 'Graphique (simulé)');
  }
});

export default router;
