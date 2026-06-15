import { Router } from "express";
import * as ctrl from "./transactions.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.getTransactions);
router.get("/:id", ctrl.getTransaction);
router.post("/deposit/crypto", ctrl.createCryptoDeposit);
router.post("/withdraw/crypto", ctrl.createCryptoWithdrawal);

export default router;
