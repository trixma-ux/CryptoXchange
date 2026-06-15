import { Response } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendError, calculateFee, MOCK_PRICES } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";
import { config } from "../../lib/config.js";

export const getSwapQuote = async (req: AuthRequest, res: Response) => {
  const { fromCurrency, toCurrency, fromAmount } = req.query as Record<string, string>;
  const fromPrice = MOCK_PRICES[fromCurrency];
  const toPrice = MOCK_PRICES[toCurrency];
  if (!fromPrice || !toPrice) return sendError(res, "Paire de swap non supportée", 400);

  const fromAmountNum = parseFloat(fromAmount);
  const exchangeRate = fromPrice / toPrice;
  const feePercent = config.fees.swap;
  const feeInFrom = calculateFee(fromAmountNum, feePercent);
  const netFromAmount = fromAmountNum - feeInFrom;
  const toAmount = netFromAmount * exchangeRate;

  return sendSuccess(res, {
    fromCurrency, toCurrency, fromAmount: fromAmountNum, toAmount,
    exchangeRate, feePercent, feeInFrom, fromPrice, toPrice,
  }, "Devis swap calculé");
};

export const executeSwap = async (req: AuthRequest, res: Response) => {
  const { fromCurrency, toCurrency, fromAmount } = req.body;
  const userId = req.user!.id;

  const fromPrice = MOCK_PRICES[fromCurrency];
  const toPrice = MOCK_PRICES[toCurrency];
  if (!fromPrice || !toPrice) return sendError(res, "Paire non supportée", 400);

  const fromAmountNum = parseFloat(fromAmount);
  const [fromWallet] = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, fromCurrency))).limit(1);
  const [toWallet] = await db.select().from(walletsTable)
    .where(and(eq(walletsTable.userId, userId), eq(walletsTable.currency, toCurrency))).limit(1);

  if (!fromWallet || !toWallet) return sendError(res, "Wallet introuvable", 404);

  const fromBalance = parseFloat(fromWallet.balance.toString());
  if (fromBalance < fromAmountNum) return sendError(res, "Solde insuffisant", 400);

  const exchangeRate = fromPrice / toPrice;
  const feePercent = config.fees.swap;
  const feeInFrom = calculateFee(fromAmountNum, feePercent);
  const netFromAmount = fromAmountNum - feeInFrom;
  const toAmount = netFromAmount * exchangeRate;

  await db.update(walletsTable).set({ balance: (fromBalance - fromAmountNum).toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, fromWallet.id));

  const toBalance = parseFloat(toWallet.balance.toString());
  await db.update(walletsTable).set({ balance: (toBalance + toAmount).toFixed(8), updatedAt: new Date() })
    .where(eq(walletsTable.id, toWallet.id));

  const [tx] = await db.insert(transactionsTable).values({
    userId, type: "SWAP", status: "COMPLETED", currency: fromCurrency,
    amount: fromAmountNum.toString(), fee: feeInFrom.toString(), netAmount: netFromAmount.toString(),
    exchangeRate: exchangeRate.toString(),
    description: `Swap ${fromAmountNum} ${fromCurrency} → ${toAmount.toFixed(8)} ${toCurrency}`,
    metadata: { fromCurrency, toCurrency, fromAmount: fromAmountNum, toAmount, exchangeRate },
  }).returning();

  return sendSuccess(res, {
    transaction: tx,
    summary: { fromCurrency, toCurrency, fromAmount: fromAmountNum, toAmount, exchangeRate, feeInFrom },
  }, `Swap réussi: ${fromAmountNum} ${fromCurrency} → ${toAmount.toFixed(8)} ${toCurrency}`);
};
