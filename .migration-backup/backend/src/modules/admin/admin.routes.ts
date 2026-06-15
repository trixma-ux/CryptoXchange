import { Router } from 'express';
import { body } from 'express-validator';
import * as adminController from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/status', [body('status').isIn(['ACTIVE', 'SUSPENDED', 'BANNED'])], validateRequest, adminController.updateUserStatus);

// KYC
router.get('/kyc', adminController.getKycRequests);
router.patch('/kyc/:documentId/review', [
  body('status').isIn(['APPROVED', 'REJECTED']),
  body('adminNotes').optional().trim(),
], validateRequest, adminController.reviewKyc);

// Transactions
router.get('/transactions', adminController.getAllTransactions);
router.patch('/transactions/:txId/review', [
  body('action').isIn(['APPROVE', 'REJECT']),
  body('adminNotes').optional().trim(),
], validateRequest, adminController.reviewWithdrawal);

// Fees
router.get('/fees', adminController.getFeeConfigs);
router.post('/fees', [
  body('type').notEmpty(),
  body('percentage').isNumeric(),
], validateRequest, adminController.updateFeeConfig);

// Support
router.get('/support/tickets', adminController.getAllTickets);
router.post('/support/tickets/:id/reply', [body('message').notEmpty()], validateRequest, adminController.replyToTicketAdmin);

export default router;
