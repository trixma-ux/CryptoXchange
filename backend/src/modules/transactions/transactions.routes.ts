import { Router } from 'express';
import { body } from 'express-validator';
import * as txController from './transactions.controller';
import { authenticate, requireKyc } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { withdrawalRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.use(authenticate);

router.get('/', txController.getTransactions);
router.get('/:id', txController.getTransaction);
router.post('/deposit/crypto', requireKyc, [
  body('currency').notEmpty(),
  body('amount').isNumeric().isFloat({ min: 0 }),
  body('txHash').optional().trim(),
], validateRequest, txController.createCryptoDeposit);

router.post('/withdraw/crypto', requireKyc, withdrawalRateLimiter, [
  body('currency').notEmpty(),
  body('amount').isNumeric().isFloat({ min: 0 }),
  body('toAddress').notEmpty().trim(),
  body('network').notEmpty(),
], validateRequest, txController.createCryptoWithdrawal);

export default router;
