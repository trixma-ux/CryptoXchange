import { Router } from "express";
import * as ctrl from "./swap.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/quote", ctrl.getSwapQuote);
router.post("/execute", ctrl.executeSwap);

export default router;
