import { Router } from "express";
import * as ctrl from "./admin.controller.js";
import { authenticate, requireAdmin } from "../../middlewares/auth.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/stats", ctrl.getDashboardStats);
router.get("/users", ctrl.getAllUsers);
router.get("/users/:userId", ctrl.getUser);
router.patch("/users/:userId/status", ctrl.updateUserStatus);
router.get("/kyc", ctrl.getKycRequests);
router.post("/kyc/:documentId/review", ctrl.reviewKyc);
router.get("/transactions", ctrl.getAllTransactions);
router.post("/transactions/:txId/approve", ctrl.approveTransaction);
router.post("/transactions/:txId/reject", ctrl.rejectTransaction);
router.get("/fees", ctrl.getFees);
router.put("/fees/:type", ctrl.updateFee);
router.get("/support/tickets", ctrl.getSupportTickets);
router.post("/support/tickets/:ticketId/reply", ctrl.adminReplyTicket);
router.patch("/support/tickets/:ticketId/resolve", ctrl.resolveTicket);

export default router;
