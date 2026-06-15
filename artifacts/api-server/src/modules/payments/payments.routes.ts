import { Router } from "express";
import * as ctrl from "./payments.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.post("/mobile-money/deposit", ctrl.mobileMoneyDeposit);
router.post("/mobile-money/withdrawal", ctrl.mobileMoneyWithdrawal);
router.post("/bank-transfer/deposit", ctrl.bankTransferDeposit);
router.post("/bank-transfer/withdrawal", ctrl.bankTransferWithdrawal);

export default router;
