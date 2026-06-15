import { Router } from "express";
import * as ctrl from "./trading.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/quote/buy", ctrl.getBuyQuote);
router.get("/quote/sell", ctrl.getSellQuote);
router.post("/buy", ctrl.buyCrypto);
router.post("/sell", ctrl.sellCrypto);

export default router;
