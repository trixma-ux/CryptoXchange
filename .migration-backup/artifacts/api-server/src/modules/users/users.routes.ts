import { Router } from "express";
import * as ctrl from "./users.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/profile", ctrl.getProfile);
router.patch("/profile", ctrl.updateProfile);
router.post("/change-password", ctrl.changePassword);
router.get("/mobile-money-accounts", ctrl.getMobileMoneyAccounts);
router.post("/mobile-money-accounts", ctrl.addMobileMoneyAccount);
router.get("/bank-accounts", ctrl.getBankAccounts);
router.post("/bank-accounts", ctrl.addBankAccount);

export default router;
