import { Router } from "express";
import * as ctrl from "./trading.controller.js";
import { authenticate, requireKyc } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/quote/buy", ctrl.getBuyQuote);
router.get("/quote/sell", ctrl.getSellQuote);
router.get("/quote", ctrl.getUnifiedQuote);
router.post("/buy", requireKyc, ctrl.buyCrypto);
router.post("/sell", requireKyc, ctrl.sellCrypto);
router.get("/history", ctrl.getHistory);

export default router;
