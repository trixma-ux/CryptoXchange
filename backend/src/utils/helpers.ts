import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, message: string, statusCode = 400, errors?: any) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const generateOTP = (length = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

export const calculateFee = (amount: number, feePercentage: number): number => {
  return (amount * feePercentage) / 100;
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const generateWalletAddress = (currency: string): string => {
  // In production, use actual blockchain SDK to generate real addresses
  const prefixes: Record<string, string> = {
    BTC: '1',
    ETH: '0x',
    USDT_TRC20: 'T',
    USDT_ERC20: '0x',
    USDT_BEP20: '0x',
    BNB: '0x',
    SOL: '',
    LTC: 'L',
    XRP: 'r',
  };
  const prefix = prefixes[currency] || '';
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let address = prefix;
  for (let i = 0; i < 34; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
};
