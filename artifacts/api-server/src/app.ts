import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import walletsRoutes from "./modules/wallets/wallets.routes.js";
import transactionsRoutes from "./modules/transactions/transactions.routes.js";
import tradingRoutes from "./modules/trading/trading.routes.js";
import swapRoutes from "./modules/swap/swap.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import kycRoutes from "./modules/kyc/kyc.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import supportRoutes from "./modules/support/support.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import pricesRoutes from "./modules/prices/prices.routes.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

app.use(cors({ origin: "*", credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Public static (non-sensitive) uploads only — KYC documents served via authenticated endpoint
app.use("/uploads/public", express.static("./uploads/public"));

const API = "/api/v1";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, usersRoutes);
app.use(`${API}/wallets`, walletsRoutes);
app.use(`${API}/transactions`, transactionsRoutes);
app.use(`${API}/trading`, tradingRoutes);
app.use(`${API}/swap`, swapRoutes);
app.use(`${API}/payments`, paymentsRoutes);
app.use(`${API}/kyc`, kycRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/support`, supportRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/prices`, pricesRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

app.get(`${API}/healthz`, (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route introuvable" });
});

app.use(errorHandler);

export default app;
