import { Router } from 'express';
import * as walletsController from './wallets.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', walletsController.getWallets);
router.get('/portfolio', walletsController.getPortfolioSummary);
router.get('/:currency', walletsController.getWallet);
router.get('/:currency/qrcode', walletsController.getWalletQRCode);

export default router;
