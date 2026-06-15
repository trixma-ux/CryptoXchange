import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();

router.post('/register', authRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], validateRequest, authController.register);

router.get('/verify-email', authController.verifyEmail);

router.post('/login', authRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validateRequest, authController.login);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.post('/forgot-password', authRateLimiter, [
  body('email').isEmail().normalizeEmail(),
], validateRequest, authController.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validateRequest, authController.resetPassword);

// 2FA routes (authenticated)
router.post('/2fa/setup', authenticate, authController.setup2FA);
router.post('/2fa/enable', authenticate, [
  body('totpCode').isLength({ min: 6, max: 6 }).isNumeric(),
], validateRequest, authController.enable2FA);
router.post('/2fa/disable', authenticate, authController.disable2FA);

export default router;
