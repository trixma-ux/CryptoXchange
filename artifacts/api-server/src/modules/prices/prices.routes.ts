import { Router } from "express";
import * as ctrl from "./prices.controller.js";

const router = Router();

router.get("/", ctrl.getPrices);
router.get("/:currency", ctrl.getPrice);
router.get("/:currency/chart", ctrl.getChartData);

export default router;
