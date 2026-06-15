import { Request, Response } from "express";
import { sendSuccess } from "../../lib/helpers.js";
import { MOCK_PRICES, FCFA_PER_USD } from "../../lib/helpers.js";

const COINS = ["BTC", "ETH", "USDT_TRC20", "USDT_ERC20", "BNB", "SOL", "LTC", "XRP", "MATIC", "DOGE"];

function generateChange(): number {
  return parseFloat(((Math.random() - 0.48) * 8).toFixed(2));
}

export const getPrices = (_req: Request, res: Response) => {
  const prices = COINS.map((coin) => ({
    currency: coin,
    priceUSD: MOCK_PRICES[coin] || 0,
    priceFCFA: (MOCK_PRICES[coin] || 0) * FCFA_PER_USD,
    change24h: generateChange(),
    volume24h: Math.floor(Math.random() * 1000000000),
    marketCap: Math.floor((MOCK_PRICES[coin] || 0) * (Math.random() * 1e7 + 1e6)),
  }));
  return sendSuccess(res, prices, "Prix récupérés");
};

export const getPrice = (req: Request, res: Response) => {
  const { currency } = req.params;
  const priceUSD = MOCK_PRICES[currency.toUpperCase()];
  if (!priceUSD) return res.status(404).json({ success: false, message: "Cryptomonnaie non trouvée" });
  return sendSuccess(res, {
    currency, priceUSD, priceFCFA: priceUSD * FCFA_PER_USD, change24h: generateChange(),
  }, "Prix récupéré");
};

export const getChartData = (req: Request, res: Response) => {
  const { currency } = req.params;
  const { days = "7" } = req.query as Record<string, string>;
  const basePrice = MOCK_PRICES[currency.toUpperCase()] || 1;
  const daysNum = parseInt(days);
  const points = daysNum * 24;

  const data = [];
  let price = basePrice * 0.9;
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.49) * 0.01);
    data.push({ timestamp: now - i * 3600000, price: parseFloat(price.toFixed(8)) });
  }

  return sendSuccess(res, { currency, days: daysNum, data }, "Données de graphique récupérées");
};
