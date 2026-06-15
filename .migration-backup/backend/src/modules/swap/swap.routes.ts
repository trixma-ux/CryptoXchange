import { Router } from 'express';
import { body } from 'express-validator';
import * as swapController from './swap.controller';
import { authenticate, requireKyc } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
router.use(authenticate);

router.get('/quote', swapController.getSwapQuote);
router.get('/history', swapController.getSwapHistory);
router.post('/', requireKyc, [
  body('fromCurrency').notEmpty(),
  body('toCurrency').notEmpty(),
  body('fromAmount').isNumeric().isFloat({ min: 0 }),
], validateRequest, swapController.executeSwap);

export default router;
