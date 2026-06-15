import { Router } from "express";
import * as ctrl from "./support.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate);

router.get("/tickets", ctrl.getTickets);
router.post("/tickets", ctrl.createTicket);
router.get("/tickets/:id", ctrl.getTicket);
router.post("/tickets/:id/reply", ctrl.replyToTicket);
router.patch("/tickets/:id/close", ctrl.closeTicket);

export default router;
