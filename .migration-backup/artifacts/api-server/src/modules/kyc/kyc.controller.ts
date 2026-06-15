import { Request, Response } from "express";
import { db } from "@workspace/db";
import { kycDocumentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sendSuccess, sendError } from "../../lib/helpers.js";
import { AuthRequest } from "../../middlewares/auth.js";
import * as fs from "fs";
import * as path from "path";

export const getKycStatus = async (req: AuthRequest, res: Response) => {
  const docs = await db.select().from(kycDocumentsTable)
    .where(eq(kycDocumentsTable.userId, req.user!.id));

  const users = await db.select({ kycStatus: usersTable.kycStatus }).from(usersTable)
    .where(eq(usersTable.id, req.user!.id)).limit(1);

  return sendSuccess(res, {
    kycStatus: users[0]?.kycStatus || "PENDING",
    documents: docs,
  }, "Statut KYC récupéré");
};

export const uploadKycDocument = async (req: AuthRequest, res: Response) => {
  const { documentType } = req.body;
  const file = (req as Request & { file?: Express.Multer.File }).file;

  if (!file) return sendError(res, "Fichier requis", 400);
  if (!documentType) return sendError(res, "Type de document requis", 400);

  const documentUrl = `/uploads/kyc/${file.filename}`;

  const [doc] = await db.insert(kycDocumentsTable).values({
    userId: req.user!.id,
    documentType: documentType as any,
    documentUrl,
    status: "SUBMITTED",
  }).returning();

  await db.update(usersTable).set({ kycStatus: "SUBMITTED", updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.id));

  return sendSuccess(res, doc, "Document KYC soumis avec succès", 201);
};

export const getKycDocuments = async (req: AuthRequest, res: Response) => {
  const docs = await db.select().from(kycDocumentsTable).where(eq(kycDocumentsTable.userId, req.user!.id));
  return sendSuccess(res, docs, "Documents KYC récupérés");
};
