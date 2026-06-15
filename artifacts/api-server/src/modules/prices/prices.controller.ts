import { Request, Response } from "express";
import { sendSuccess, MOCK_PRICES, FCFA_PER_USD } from "../../lib/helpers.js";

const COINS = ["BTC", "ETH", "USDT_TRC20", "USDT_ERC20", "BNB", "SOL", "LTC", "XRP", "MATIC", "DOGE"];

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT_TRC20: "tether",
  USDT_ERC20: "tether",
  BNB: "binancecoin",
  SOL: "solana",
  LTC: "litecoin",
  XRP: "ripple",
  MATIC: "matic-network",
  DOGE: "dogecoin",
};

interface CoinGeckoPrice {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
  usd_market_cap: number;
}

let priceCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 30_000;

async function fetchFromCoinGecko(): Promise<Record<string, CoinGeckoPrice>> {
  const uniqueIds = [...new Set(Object.values(COINGECKO_IDS))].join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

  const res = await fetch(url, {
    headers: { Accept: "application/json", "x-cg-demo-api-key": "" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  return res.json() as Promise<Record<string, CoinGeckoPrice>>;
}

async function getLivePrices(): Promise<any[]> {
  const now = Date.now();
  if (priceCache.data && now - priceCache.timestamp < CACHE_TTL) {
    return priceCache.data;
  }

  try {
    const raw = await fetchFromCoinGecko();
    const prices = COINS.map((coin) => {
      const geckoId = COINGECKO_IDS[coin];
      const d = raw[geckoId];
      const priceUSD = d?.usd ?? MOCK_PRICES[coin] ?? 0;
      return {
        currency: coin,
        priceUSD: parseFloat(priceUSD.toFixed(8)),
        priceFCFA: parseFloat((priceUSD * FCFA_PER_USD).toFixed(2)),
        change24h: parseFloat((d?.usd_24h_change ?? 0).toFixed(2)),
        volume24h: Math.round(d?.usd_24h_vol ?? 0),
        marketCap: Math.round(d?.usd_market_cap ?? 0),
        source: "live",
        updatedAt: new Date().toISOString(),
      };
    });
    priceCache = { data: prices, timestamp: now };
    return prices;
  } catch (err) {
    console.warn("[prices] CoinGecko fetch failed, using fallback:", (err as Error).message);
    if (priceCache.data) return priceCache.data;
    return COINS.map((coin) => {
      const priceUSD = MOCK_PRICES[coin] || 0;
      return {
        currency: coin,
        priceUSD,
        priceFCFA: parseFloat((priceUSD * FCFA_PER_USD).toFixed(2)),
        change24h: parseFloat(((Math.random() - 0.48) * 8).toFixed(2)),
        volume24h: Math.floor(Math.random() * 1_000_000_000),
        marketCap: Math.floor(priceUSD * (Math.random() * 1e7 + 1e6)),
        source: "mock",
        updatedAt: new Date().toISOString(),
      };
    });
  }
}

export const getPrices = async (_req: Request, res: Response) => {
  const prices = await getLivePrices();
  return sendSuccess(res, prices, "Prix récupérés");
};

export const getPrice = async (req: Request, res: Response) => {
  const { currency } = req.params;
  const prices = await getLivePrices();
  const found = prices.find((p) => p.currency === currency.toUpperCase());
  if (!found) return res.status(404).json({ success: false, message: "Cryptomonnaie non trouvée" });
  return sendSuccess(res, found, "Prix récupéré");
};

export const getChartData = async (req: Request, res: Response) => {
  const { currency } = req.params;
  const { days = "7" } = req.query as Record<string, string>;
  const daysNum = Math.min(parseInt(days) || 7, 90);

  const geckoId = COINGECKO_IDS[currency.toUpperCase()];
  if (geckoId) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${daysNum}`;
      const geckoRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (geckoRes.ok) {
        const geckoData = await geckoRes.json() as { prices: [number, number][] };
        const data = geckoData.prices.map(([timestamp, price]) => ({
          timestamp,
          price: parseFloat(price.toFixed(8)),
        }));
        return sendSuccess(res, { currency, days: daysNum, data, source: "live" }, "Données de graphique récupérées");
      }
    } catch {
    }
  }

  const basePrice = MOCK_PRICES[currency.toUpperCase()] || 1;
  const points = daysNum * 24;
  const data = [];
  let price = basePrice * 0.9;
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.49) * 0.01);
    data.push({ timestamp: now - i * 3_600_000, price: parseFloat(price.toFixed(8)) });
  }
  return sendSuccess(res, { currency, days: daysNum, data, source: "mock" }, "Données de graphique récupérées");
};
