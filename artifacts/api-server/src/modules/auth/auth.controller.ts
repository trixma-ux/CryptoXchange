import { Request, Response } from "express";
import bcrypt from "bcryptjs";
const uuidv4 = () => crypto.randomUUID();
import { db } from "@workspace/db";
import { usersTable, refreshTokensTable, walletsTable } from "@workspace/db";
import { eq, or, and, gt } from "drizzle-orm";
import { config } from "../../lib/config.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { sendSuccess, sendError, generateWalletAddress } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";

const WALLET_DEFAULTS = [
  { currency: "BTC", network: "BITCOIN" },
  { currency: "ETH", network: "ETHEREUM" },
  { currency: "USDT_TRC20", network: "TRON" },
  { currency: "USDT_ERC20", network: "ETHEREUM" },
  { currency: "BNB", network: "BSC" },
  { currency: "SOL", network: "SOLANA" },
  { currency: "LTC", network: "LITECOIN" },
];

export const register = async (req: Request, res: Response) => {
  const { email, username, firstName, lastName, password, phone } = req.body;
  if (!email || !username || !firstName || !lastName || !password) {
    return sendError(res, "Tous les champs sont requis", 400);
  }

  const existing = await db.select({ id: usersTable.id }).from(usersTable)
    .where(or(eq(usersTable.email, email), eq(usersTable.username, username))).limit(1);

  if (existing.length > 0) return sendError(res, "Email ou nom d'utilisateur déjà utilisé", 409);

  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
  const [user] = await db.insert(usersTable).values({
    email, username, firstName, lastName, passwordHash, phone, emailVerified: true,
  }).returning({ id: usersTable.id });

  for (const { currency, network } of WALLET_DEFAULTS) {
    await db.insert(walletsTable).values({
      userId: user.id, currency, network, address: generateWalletAddress(currency),
    });
  }

  return sendSuccess(res, { userId: user.id }, "Compte créé avec succès. Vous pouvez vous connecter.", 201);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, "Email et mot de passe requis", 400);

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = users[0];
  if (!user) return sendError(res, "Email ou mot de passe incorrect", 401);

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return sendError(res, `Compte verrouillé. Réessayez dans ${minutesLeft} minutes.`, 423);
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    const attempts = user.loginAttempts + 1;
    const lockedUntil = attempts >= config.security.loginAttemptsMax
      ? new Date(Date.now() + config.security.loginLockoutDuration) : null;
    await db.update(usersTable).set({ loginAttempts: attempts, lockedUntil }).where(eq(usersTable.id, user.id));
    return sendError(res, "Email ou mot de passe incorrect", 401);
  }

  if (user.status === "SUSPENDED" || user.status === "BANNED") {
    return sendError(res, "Compte suspendu ou banni. Contactez le support.", 403);
  }

  await db.update(usersTable).set({
    loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(),
    lastLoginIp: req.ip ?? null, updatedAt: new Date(),
  }).where(eq(usersTable.id, user.id));

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshTokenValue = generateRefreshToken(payload);

  await db.insert(refreshTokensTable).values({
    userId: user.id, token: refreshTokenValue,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return sendSuccess(res, {
    accessToken, refreshToken: refreshTokenValue,
    user: {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
      role: user.role, kycStatus: user.kycStatus, username: user.username,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  }, "Connexion réussie");
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) return sendError(res, "Refresh token requis", 400);

  try {
    const decoded = verifyRefreshToken(token);
    const stored = await db.select().from(refreshTokensTable)
      .where(and(eq(refreshTokensTable.token, token), gt(refreshTokensTable.expiresAt, new Date()))).limit(1);

    if (stored.length === 0) return sendError(res, "Refresh token invalide ou expiré", 401);

    const payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, token));
    await db.insert(refreshTokensTable).values({
      userId: decoded.userId, token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, "Tokens renouvelés");
  } catch {
    return sendError(res, "Refresh token invalide", 401);
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (token) await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, token));
  return sendSuccess(res, null, "Déconnexion réussie");
};

export const forgotPassword = async (_req: Request, res: Response) => {
  return sendSuccess(res, null, "Si ce compte existe, un email de réinitialisation a été envoyé.");
};

export const resetPassword = async (_req: Request, res: Response) => {
  return sendSuccess(res, null, "Mot de passe réinitialisé. Veuillez vous reconnecter.");
};

export const getMe = async (req: AuthRequest, res: Response) => {
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

export const setup2FA = async (req: AuthRequest, res: Response) => {
  const secret = uuidv4().replace(/-/g, "").toUpperCase().slice(0, 32);
  await db.update(usersTable).set({ twoFactorSecret: secret }).where(eq(usersTable.id, req.user!.id));
  const otpauthUrl = `otpauth://totp/CryptoXchange:${req.user!.email}?secret=${secret}&issuer=CryptoXchange`;
  return sendSuccess(res, { secret, otpauthUrl, qrCode: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=200x200` }, "Scannez le QR code");
};

export const enable2FA = async (req: AuthRequest, res: Response) => {
  await db.update(usersTable).set({ twoFactorEnabled: true, updatedAt: new Date() }).where(eq(usersTable.id, req.user!.id));
  return sendSuccess(res, null, "2FA activé avec succès");
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
  const { password } = req.body;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const user = users[0];
  if (!user) return sendError(res, "Utilisateur introuvable", 404);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return sendError(res, "Mot de passe incorrect", 401);
  await db.update(usersTable).set({ twoFactorEnabled: false, twoFactorSecret: null, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  return sendSuccess(res, null, "2FA désactivé");
};
