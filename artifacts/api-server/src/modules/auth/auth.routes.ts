import { Router } from "express";
import * as ctrl from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/refresh", ctrl.refreshToken);
router.post("/refresh-token", ctrl.refreshToken);
router.post("/logout", ctrl.logout);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);

router.get("/me", authenticate, ctrl.getMe);
router.patch("/me", authenticate, ctrl.updateProfile);
router.post("/change-password", authenticate, ctrl.changePassword);
router.post("/2fa/setup", authenticate, ctrl.setup2FA);
router.post("/2fa/enable", authenticate, ctrl.enable2FA);
router.post("/2fa/disable", authenticate, ctrl.disable2FA);

export default router;
