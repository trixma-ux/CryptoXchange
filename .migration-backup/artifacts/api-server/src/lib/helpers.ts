import { Response } from "express";

export const sendSuccess = (res: Response, data: unknown, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res: Response, message: string, statusCode = 400, errors?: unknown) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const calculateFee = (amount: number, feePercentage: number): number => {
  return (amount * feePercentage) / 100;
};

export const generateWalletAddress = (currency: string): string => {
  const prefixes: Record<string, string> = {
    BTC: "1", ETH: "0x", USDT_TRC20: "T", USDT_ERC20: "0x",
    USDT_BEP20: "0x", BNB: "0x", SOL: "", LTC: "L", XRP: "r",
  };
  const prefix = prefixes[currency] || "";
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let address = prefix;
  for (let i = 0; i < 34; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
};

export const MOCK_PRICES: Record<string, number> = {
  BTC: 95000, ETH: 3400, USDT_TRC20: 1, USDT_ERC20: 1, USDT_BEP20: 1,
  BNB: 620, SOL: 185, LTC: 105, XRP: 2.1, MATIC: 0.95, DOGE: 0.35,
};

export const FCFA_PER_USD = 605;
