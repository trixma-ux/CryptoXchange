import { Router } from 'express';
import { body } from 'express-validator';
import * as tradingController from './trading.controller';
import { authenticate, requireKyc } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
router.use(authenticate);

router.get('/quote', tradingController.getQuote);
router.get('/history', tradingController.getTradeHistory);
router.post('/buy', requireKyc, [
  body('currency').notEmpty(),
  body('fiatAmount').isNumeric().isFloat({ min: 1 }),
  body('fiatCurrency').optional().isIn(['XOF', 'USD', 'EUR', 'XAF']),
], validateRequest, tradingController.buyCrypto);

router.post('/sell', requireKyc, [
  body('currency').notEmpty(),
  body('cryptoAmount').isNumeric().isFloat({ min: 0 }),
  body('fiatCurrency').optional().isIn(['XOF', 'USD', 'EUR', 'XAF']),
], validateRequest, tradingController.sellCrypto);

export default router;
