import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { createAuditLog } from '../../utils/audit';
import { AuthRequest } from '../../middleware/auth';
import { config } from '../../config';

const FCFA_PER_USD = 605;

// ---- Mobile Money Deposit ----
export const mobileMoneyDeposit = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, amount, currency, cryptoCurrency } = req.body;
  const userId = req.user!.id;

  // In production: call real mobile money API (Orange, MTN, Wave)
  // Here we simulate the payment
  const fiatAmountNum = parseFloat(amount);
  const priceUSD = ( { BTC: 95000, ETH: 3400, USDT_TRC20: 1, BNB: 620, SOL: 185 } as Record<string, number> )[cryptoCurrency] || 1;
  const fiatUSD = currency === 'XOF' ? fiatAmountNum / FCFA_PER_USD : fiatAmountNum;
  const fee = fiatUSD * (config.fees.deposit / 100);
  const netUSD = fiatUSD - fee;
  const cryptoAmount = netUSD / priceUSD;

  // --- API Intégration (Mock pour CinetPay / FedaPay) ---
  // Dans un environnement de production, vous feriez un appel HTTP ici :
  // const response = await axios.post('https://api.cinetpay.com/v1/?method=getSignatureByPost', {
  //   apikey: process.env.CINETPAY_API_KEY,
  //   site_id: process.env.CINETPAY_SITE_ID,
  //   transaction_id: transactionId,
  //   amount: fiatAmountNum,
  //   currency: currency,
  //   channels: 'MOBILE_MONEY',
  //   customer_phone_number: phoneNumber
  // });
  
  // Simulation de la réponse de l'API Mobile Money
  console.log(`[MOBILE MONEY] Requête de dépôt de ${fiatAmountNum} ${currency} vers ${provider} (${phoneNumber})`);

  // Create pending transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId, type: 'DEPOSIT_FIAT', status: 'PENDING',
      currency: cryptoCurrency, amount: cryptoAmount,
      fee, netAmount: cryptoAmount,
      fiatCurrency: currency, fiatAmount: fiatAmountNum,
      exchangeRate: priceUSD,
      description: `Dépôt via ${provider} (${phoneNumber})`,
      metadata: JSON.stringify({ provider, phoneNumber, fiatAmount: fiatAmountNum, fiatCurrency: currency }),
    },
  });

  // Simulate auto-confirmation for demo via a Webhook / Callback Simulation
  setTimeout(async () => {
    console.log(`[MOBILE MONEY WEBHOOK] Réception du paiement pour la transaction ${transaction.id}`);
    const wallet = await prisma.wallet.findFirst({ where: { userId, currency: cryptoCurrency as any } });
    if (wallet) {
      await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: cryptoAmount } } });
      await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'COMPLETED' } });
      console.log(`[MOBILE MONEY] Portefeuille mis à jour pour la transaction ${transaction.id}`);
    }
  }, 3000); // 3 secondes au lieu de 5 pour fluidifier les tests

  await createAuditLog({ userId, action: 'MOBILE_MONEY_DEPOSIT', entity: 'Transaction', entityId: transaction.id });

  return sendSuccess(res, {
    transaction,
    summary: { provider, phoneNumber, fiatAmount: fiatAmountNum, currency, cryptoAmount, cryptoCurrency },
  }, `Dépôt via ${provider} initié. Confirmation en cours...`, 201);
};

// ---- Mobile Money Withdrawal ----
export const mobileMoneyWithdrawal = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, cryptoCurrency, cryptoAmount, fiatCurrency = 'XOF' } = req.body;
  const userId = req.user!.id;

  const wallet = await prisma.wallet.findFirst({ where: { userId, currency: cryptoCurrency as any } });
  if (!wallet) return sendError(res, 'Wallet introuvable', 404);

  const cryptoAmountNum = parseFloat(cryptoAmount);
  const balance = parseFloat(wallet.balance.toString());
  if (balance < cryptoAmountNum) return sendError(res, 'Solde insuffisant', 400);

  const priceUSD = ( { BTC: 95000, ETH: 3400, USDT_TRC20: 1, BNB: 620, SOL: 185 } as Record<string, number> )[cryptoCurrency] || 1;
  const grossUSD = cryptoAmountNum * priceUSD;
  const feeUSD = grossUSD * (config.fees.withdrawal / 100);
  const netUSD = grossUSD - feeUSD;
  const fiatAmount = fiatCurrency === 'XOF' ? netUSD * FCFA_PER_USD : netUSD;

  await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: cryptoAmountNum }, frozenBalance: { increment: cryptoAmountNum } } });

  // --- API Intégration (Mock pour CinetPay / FedaPay Transferts) ---
  // const response = await axios.post('https://api.cinetpay.com/v1/?method=getTransfer', { ... });
  console.log(`[MOBILE MONEY] Requête de retrait de ${fiatAmount} ${fiatCurrency} vers ${provider} (${phoneNumber})`);

  const transaction = await prisma.transaction.create({
    data: {
      userId, type: 'WITHDRAWAL_FIAT', status: 'REQUIRES_APPROVAL',
      currency: cryptoCurrency, amount: cryptoAmountNum,
      fee: feeUSD, netAmount: cryptoAmountNum,
      fiatCurrency, fiatAmount, exchangeRate: priceUSD,
      description: `Retrait vers ${provider} (${phoneNumber})`,
      metadata: JSON.stringify({ provider, phoneNumber, fiatAmount, fiatCurrency }),
    },
  });

  // Simulation de l'approbation automatique par un Admin après quelques secondes
  setTimeout(async () => {
    console.log(`[ADMIN BOT] Approbation automatique du retrait ${transaction.id}`);
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'COMPLETED', processedAt: new Date() } });
    await prisma.wallet.update({ where: { id: wallet.id }, data: { frozenBalance: { decrement: cryptoAmountNum } } });
    console.log(`[MOBILE MONEY] Transfert effectué vers ${provider} (${phoneNumber})`);
  }, 4000);

  return sendSuccess(res, { transaction, summary: { provider, phoneNumber, fiatAmount, fiatCurrency, cryptoAmount: cryptoAmountNum, cryptoCurrency } }, `Retrait vers ${provider} soumis, en attente de validation`, 201);
};
