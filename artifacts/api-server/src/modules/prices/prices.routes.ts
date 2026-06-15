import { Router } from "express";
import * as ctrl from "./prices.controller.js";

const router = Router();

router.get("/", ctrl.getPrices);
router.get("/chart/:currency", ctrl.getChartData);
router.get("/:currency/chart", ctrl.getChartData);
router.get("/:currency", ctrl.getPrice);

export default router;
