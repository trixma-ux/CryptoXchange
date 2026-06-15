import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
};
