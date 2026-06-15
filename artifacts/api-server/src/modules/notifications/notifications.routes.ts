import { Router } from "express";
import * as ctrl from "./notifications.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.getNotifications);
router.patch("/:id/read", ctrl.markAsRead);
router.patch("/read-all", ctrl.markAllAsRead);

export default router;
