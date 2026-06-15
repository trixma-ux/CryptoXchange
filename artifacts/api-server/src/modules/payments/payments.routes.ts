import { Router } from "express";
import * as ctrl from "./payments.controller.js";
import { authenticate, requireKyc } from "../../middlewares/auth.js";

const router = Router();

router.post("/webhook/cinetpay", ctrl.cinetpayWebhook);

router.use(authenticate);

router.post("/mobile-money/deposit", requireKyc, ctrl.mobileMoneyDeposit);
router.post("/mobile-money/withdrawal", requireKyc, ctrl.mobileMoneyWithdrawal);
router.post("/bank-transfer/deposit", requireKyc, ctrl.bankTransferDeposit);
router.post("/bank-transfer/withdrawal", requireKyc, ctrl.bankTransferWithdrawal);

export default router;
