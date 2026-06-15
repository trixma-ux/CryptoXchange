import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { createAuditLog } from '../../utils/audit';
import { AuthRequest } from '../../middleware/auth';

// ---- Get Profile ----
export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, username: true, firstName: true, lastName: true,
      phone: true, country: true, city: true, address: true, avatarUrl: true,
      role: true, status: true, kycStatus: true, emailVerified: true,
      phoneVerified: true, twoFactorEnabled: true, lastLoginAt: true, createdAt: true,
    },
  });
  if (!user) return sendError(res, 'Utilisateur introuvable', 404);
  return sendSuccess(res, user, 'Profil récupéré');
};

// ---- Update Profile ----
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, phone, country, city, address } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { firstName, lastName, phone, country, city, address },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, country: true, city: true, address: true },
  });
  await createAuditLog({ userId: req.user!.id, action: 'PROFILE_UPDATED' });
  return sendSuccess(res, user, 'Profil mis à jour');
};

// ---- Change Password ----
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return sendError(res, 'Utilisateur introuvable', 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return sendError(res, 'Mot de passe actuel incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await createAuditLog({ userId: user.id, action: 'PASSWORD_CHANGED', ipAddress: req.ip });

  return sendSuccess(res, null, 'Mot de passe modifié avec succès');
};

// ---- Get Mobile Money Accounts ----
export const getMobileMoneyAccounts = async (req: AuthRequest, res: Response) => {
  const accounts = await prisma.mobileMoneyAccount.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, accounts, 'Comptes mobile money récupérés');
};

// ---- Add Mobile Money Account ----
export const addMobileMoneyAccount = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, accountName } = req.body;

  const existing = await prisma.mobileMoneyAccount.findFirst({
    where: { userId: req.user!.id, provider, phoneNumber },
  });
  if (existing) return sendError(res, 'Ce compte est déjà enregistré', 409);

  const account = await prisma.mobileMoneyAccount.create({
    data: { userId: req.user!.id, provider, phoneNumber, accountName },
  });
  return sendSuccess(res, account, 'Compte mobile money ajouté', 201);
};

// ---- Get Bank Accounts ----
export const getBankAccounts = async (req: AuthRequest, res: Response) => {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, accounts, 'Comptes bancaires récupérés');
};

// ---- Add Bank Account ----
export const addBankAccount = async (req: AuthRequest, res: Response) => {
  const { bankName, accountNumber, accountName, swiftCode, iban, country, currency } = req.body;
  const account = await prisma.bankAccount.create({
    data: { userId: req.user!.id, bankName, accountNumber, accountName, swiftCode, iban, country, currency },
  });
  return sendSuccess(res, account, 'Compte bancaire ajouté', 201);
};
