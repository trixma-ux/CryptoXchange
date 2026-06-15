import { Router } from "express";
import * as ctrl from "./wallets.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.getWallets);
router.get("/portfolio", ctrl.getPortfolioSummary);
router.get("/:currency", ctrl.getWallet);
router.get("/:currency/qrcode", ctrl.getWalletQRCode);

export default router;
