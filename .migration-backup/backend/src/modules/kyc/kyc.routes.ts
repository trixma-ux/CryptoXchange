import { Router } from 'express';
import * as kycController from './kyc.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/status', kycController.getKycStatus);
router.post('/upload', kycController.upload.single('document'), kycController.uploadDocument);

export default router;
