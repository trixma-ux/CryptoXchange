import { Router } from 'express';
import { body } from 'express-validator';
import * as paymentsController from './payments.controller';
import { authenticate, requireKyc } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
router.use(authenticate, requireKyc);

router.post('/mobile-money/deposit', [
  body('provider').isIn(['ORANGE_MONEY', 'MTN_MONEY', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY']),
  body('phoneNumber').isMobilePhone('any'),
  body('amount').isNumeric().isFloat({ min: 1 }),
  body('currency').isIn(['XOF', 'XAF', 'USD']),
  body('cryptoCurrency').notEmpty(),
], validateRequest, paymentsController.mobileMoneyDeposit);

router.post('/mobile-money/withdrawal', [
  body('provider').isIn(['ORANGE_MONEY', 'MTN_MONEY', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY']),
  body('phoneNumber').isMobilePhone('any'),
  body('cryptoCurrency').notEmpty(),
  body('cryptoAmount').isNumeric().isFloat({ min: 0 }),
  body('fiatCurrency').optional().isIn(['XOF', 'XAF', 'USD']),
], validateRequest, paymentsController.mobileMoneyWithdrawal);

export default router;
