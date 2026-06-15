import { Router } from 'express';
import { body } from 'express-validator';
import * as usersController from './users.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', usersController.getProfile);
router.patch('/profile', [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().isMobilePhone('any'),
], validateRequest, usersController.updateProfile);

router.post('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validateRequest, usersController.changePassword);

// Payment accounts
router.get('/mobile-money-accounts', usersController.getMobileMoneyAccounts);
router.post('/mobile-money-accounts', [
  body('provider').notEmpty(),
  body('phoneNumber').isMobilePhone('any'),
  body('accountName').optional().trim(),
], validateRequest, usersController.addMobileMoneyAccount);

router.get('/bank-accounts', usersController.getBankAccounts);
router.post('/bank-accounts', [
  body('bankName').notEmpty(),
  body('accountNumber').notEmpty(),
  body('accountName').notEmpty(),
  body('country').notEmpty(),
  body('currency').notEmpty(),
], validateRequest, usersController.addBankAccount);

export default router;
