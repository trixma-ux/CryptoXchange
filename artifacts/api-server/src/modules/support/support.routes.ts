import { Router } from "express";
import * as ctrl from "./support.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.getTickets);
router.post("/", ctrl.createTicket);
router.get("/tickets", ctrl.getTickets);
router.post("/tickets", ctrl.createTicket);
router.get("/:id", ctrl.getTicket);
router.get("/tickets/:id", ctrl.getTicket);
router.post("/:id/reply", ctrl.replyToTicket);
router.post("/tickets/:id/reply", ctrl.replyToTicket);
router.patch("/:id/close", ctrl.closeTicket);
router.patch("/tickets/:id/close", ctrl.closeTicket);

export default router;
