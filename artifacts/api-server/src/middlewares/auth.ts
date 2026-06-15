import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access token required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const users = await db.select({
      id: usersTable.id, email: usersTable.email, role: usersTable.role, status: usersTable.status,
    }).from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);

    const user = users[0];
    if (!user) return res.status(401).json({ success: false, message: "Utilisateur introuvable" });
    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return res.status(403).json({ success: false, message: "Compte suspendu ou banni" });
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token invalide ou expiré" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    return res.status(403).json({ success: false, message: "Accès administrateur requis" });
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ success: false, message: "Accès super-admin requis" });
  }
  next();
};
