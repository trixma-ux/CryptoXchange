import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../../utils/prisma';
import { config } from '../../config';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/email';
import { sendSuccess, sendError } from '../../utils/helpers';
import { createAuditLog } from '../../utils/audit';
import { AuthRequest } from '../../middleware/auth';

// ---- Register ----
export const register = async (req: Request, res: Response) => {
  const { email, username, firstName, lastName, password, phone } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return sendError(res, 'Email ou nom d\'utilisateur déjà utilisé', 409);
  }

  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
  const user = await prisma.user.create({
    data: { email, username, firstName, lastName, passwordHash, phone },
  });

  // Create verification token
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.emailVerificationToken.create({
    data: { email, token, expiresAt },
  });

  // Initialize wallets for the user
  const currencies = [
    { currency: 'BTC', network: 'BITCOIN' },
    { currency: 'ETH', network: 'ETHEREUM' },
    { currency: 'USDT_TRC20', network: 'TRON' },
    { currency: 'USDT_ERC20', network: 'ETHEREUM' },
    { currency: 'BNB', network: 'BSC' },
    { currency: 'SOL', network: 'SOLANA' },
    { currency: 'LTC', network: 'LITECOIN' },
  ];

  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (const { currency, network } of currencies) {
    const address = Array.from({ length: 34 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    await prisma.wallet.create({
      data: { userId: user.id, currency: currency as any, network: network as any, address },
    });
  }

  await sendVerificationEmail(email, token, firstName);
  await createAuditLog({ userId: user.id, action: 'USER_REGISTERED', ipAddress: req.ip });

  return sendSuccess(res, { userId: user.id }, 'Compte créé. Vérifiez votre email.', 201);
};

// ---- Verify Email ----
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  const verToken = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!verToken || verToken.expiresAt < new Date()) {
    return sendError(res, 'Lien de vérification invalide ou expiré', 400);
  }

  await prisma.user.update({
    where: { email: verToken.email },
    data: { emailVerified: true, emailVerifiedAt: new Date(), status: 'ACTIVE' },
  });
  await prisma.emailVerificationToken.delete({ where: { token } });

  return sendSuccess(res, null, 'Email vérifié avec succès');
};

// ---- Login ----
export const login = async (req: Request, res: Response) => {
  const { email, password, totpCode } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return sendError(res, 'Email ou mot de passe incorrect', 401);

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return sendError(res, `Compte verrouillé. Réessayez dans ${minutesLeft} minutes.`, 423);
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    const attempts = user.loginAttempts + 1;
    const lockedUntil = attempts >= config.security.loginAttemptsMax
      ? new Date(Date.now() + config.security.loginLockoutDuration)
      : null;
    await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: attempts, lockedUntil } });

    await createAuditLog({ userId: user.id, action: 'LOGIN_FAILED', ipAddress: req.ip, metadata: { attempts } });
    return sendError(res, 'Email ou mot de passe incorrect', 401);
  }

  if (!user.emailVerified) return sendError(res, 'Vérifiez votre email avant de vous connecter', 403);
  if (user.status === 'SUSPENDED' || user.status === 'BANNED')
    return sendError(res, 'Compte suspendu ou banni. Contactez le support.', 403);

  // 2FA check
  if (user.twoFactorEnabled) {
    if (!totpCode) return sendSuccess(res, { require2FA: true }, 'Code 2FA requis');
    const valid = authenticator.verify({ token: totpCode, secret: user.twoFactorSecret! });
    if (!valid) return sendError(res, 'Code 2FA invalide', 401);
  }

  // Reset login attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: req.ip },
  });

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshTokenValue = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await createAuditLog({ userId: user.id, action: 'LOGIN_SUCCESS', ipAddress: req.ip });

  return sendSuccess(res, {
    accessToken,
    refreshToken: refreshTokenValue,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, kycStatus: user.kycStatus },
  }, 'Connexion réussie');
};

// ---- Refresh Token ----
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) return sendError(res, 'Refresh token requis', 400);

  try {
    const decoded = verifyRefreshToken(token);
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return sendError(res, 'Refresh token invalide ou expiré', 401);
    }

    const payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({
      data: { userId: decoded.userId, token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    return sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Tokens renouvelés');
  } catch {
    return sendError(res, 'Refresh token invalide', 401);
  }
};

// ---- Logout ----
export const logout = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (token) await prisma.refreshToken.deleteMany({ where: { token } });
  return sendSuccess(res, null, 'Déconnexion réussie');
};

// ---- Forgot Password ----
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return sendSuccess(res, null, 'Si ce compte existe, un email a été envoyé.');

  const token = uuidv4();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  await sendPasswordResetEmail(email, token, user.firstName);
  return sendSuccess(res, null, 'Email de réinitialisation envoyé');
};

// ---- Reset Password ----
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return sendError(res, 'Lien de réinitialisation invalide ou expiré', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
  await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
  await prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } });

  return sendSuccess(res, null, 'Mot de passe réinitialisé avec succès');
};

// ---- Setup 2FA ----
export const setup2FA = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return sendError(res, 'Utilisateur introuvable', 404);

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, config.totp.issuer, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Temporarily store secret (not enabled yet)
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

  return sendSuccess(res, { secret, qrCode: qrCodeDataUrl }, 'Scannez le QR code avec votre app authenticator');
};

// ---- Verify & Enable 2FA ----
export const enable2FA = async (req: AuthRequest, res: Response) => {
  const { totpCode } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || !user.twoFactorSecret) return sendError(res, 'Configurez d\'abord le 2FA', 400);

  const valid = authenticator.verify({ token: totpCode, secret: user.twoFactorSecret });
  if (!valid) return sendError(res, 'Code invalide', 400);

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  await createAuditLog({ userId: user.id, action: '2FA_ENABLED' });

  return sendSuccess(res, null, '2FA activé avec succès');
};

// ---- Disable 2FA ----
export const disable2FA = async (req: AuthRequest, res: Response) => {
  const { totpCode, password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return sendError(res, 'Utilisateur introuvable', 404);

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return sendError(res, 'Mot de passe incorrect', 401);

  if (user.twoFactorEnabled) {
    const valid = authenticator.verify({ token: totpCode, secret: user.twoFactorSecret! });
    if (!valid) return sendError(res, 'Code 2FA invalide', 400);
  }

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  await createAuditLog({ userId: user.id, action: '2FA_DISABLED' });

  return sendSuccess(res, null, '2FA désactivé');
};
