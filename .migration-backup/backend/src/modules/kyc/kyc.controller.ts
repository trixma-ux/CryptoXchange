import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../utils/prisma';
import { sendSuccess, sendError } from '../../utils/helpers';
import { createAuditLog } from '../../utils/audit';
import { AuthRequest } from '../../middleware/auth';
import { config } from '../../config';

// Multer config
const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé'));
  },
});

// ---- Get KYC Status ----
export const getKycStatus = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { kycStatus: true },
  });

  const documents = await prisma.kycDocument.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, { kycStatus: user?.kycStatus, documents }, 'Statut KYC récupéré');
};

// ---- Upload KYC Document ----
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  const { type } = req.body;
  const file = req.file;

  if (!file) return sendError(res, 'Fichier requis', 400);
  if (!type) return sendError(res, 'Type de document requis', 400);

  const validTypes = ['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'UTILITY_BILL', 'SELFIE'];
  if (!validTypes.includes(type)) return sendError(res, 'Type de document invalide', 400);

  // Delete existing document of same type if any
  await prisma.kycDocument.deleteMany({
    where: { userId: req.user!.id, type: type as any, status: { not: 'APPROVED' } },
  });

  const document = await prisma.kycDocument.create({
    data: {
      userId: req.user!.id,
      type: type as any,
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      status: 'PENDING',
    },
  });

  // Update user KYC status to PENDING if not already approved
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { kycStatus: true } });
  if (user?.kycStatus === 'NOT_SUBMITTED') {
    await prisma.user.update({ where: { id: req.user!.id }, data: { kycStatus: 'PENDING' } });
  }

  await createAuditLog({ userId: req.user!.id, action: 'KYC_DOCUMENT_UPLOADED', entity: 'KycDocument', entityId: document.id });

  return sendSuccess(res, document, 'Document soumis, en attente de vérification', 201);
};
