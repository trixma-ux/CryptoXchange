import { Router } from "express";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import * as ctrl from "./kyc.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const uploadDir = "./uploads/kyc";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

router.get("/status", ctrl.getKycStatus);
router.get("/documents", ctrl.getKycDocuments);
router.get("/documents/:filename", ctrl.serveKycDocument);
router.post("/upload", upload.single("file"), ctrl.uploadKycDocument);

export default router;
