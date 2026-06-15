import { Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendSuccess, sendError } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const getProfile = async (req: AuthRequest, res: Response) => {
  const users = await db.select({
    id: usersTable.id, email: usersTable.email, username: usersTable.username,
    firstName: usersTable.firstName, lastName: usersTable.lastName, phone: usersTable.phone,
    country: usersTable.country, city: usersTable.city, avatarUrl: usersTable.avatarUrl,
    role: usersTable.role, status: usersTable.status, kycStatus: usersTable.kycStatus,
    emailVerified: usersTable.emailVerified, twoFactorEnabled: usersTable.twoFactorEnabled,
    lastLoginAt: usersTable.lastLoginAt, createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

  if (users.length === 0) return sendError(res, "Utilisateur introuvable", 404);
  return sendSuccess(res, users[0], "Profil récupéré");
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, phone, country, city } = req.body;
  const [user] = await db.update(usersTable).set({
    firstName, lastName, phone, country, city, updatedAt: new Date(),
  }).where(eq(usersTable.id, req.user!.id)).returning({
    id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName,
    lastName: usersTable.lastName, phone: usersTable.phone, country: usersTable.country, city: usersTable.city,
  });
  return sendSuccess(res, user, "Profil mis à jour");
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const user = users[0];
  if (!user) return sendError(res, "Utilisateur introuvable", 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return sendError(res, "Mot de passe actuel incorrect", 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, user.id));

  return sendSuccess(res, null, "Mot de passe modifié avec succès");
};

export const getMobileMoneyAccounts = async (req: AuthRequest, res: Response) => {
  return sendSuccess(res, [], "Comptes Mobile Money récupérés");
};

export const addMobileMoneyAccount = async (req: AuthRequest, res: Response) => {
  const { provider, phoneNumber, accountName } = req.body;
  return sendSuccess(res, { id: crypto.randomUUID(), provider, phoneNumber, accountName, userId: req.user!.id }, "Compte Mobile Money ajouté", 201);
};

export const getBankAccounts = async (req: AuthRequest, res: Response) => {
  return sendSuccess(res, [], "Comptes bancaires récupérés");
};

export const addBankAccount = async (req: AuthRequest, res: Response) => {
  const { bankName, accountNumber, accountName, iban, swift } = req.body;
  return sendSuccess(res, { id: crypto.randomUUID(), bankName, accountNumber, accountName, iban, swift, userId: req.user!.id }, "Compte bancaire ajouté", 201);
};
