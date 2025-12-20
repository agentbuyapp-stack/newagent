import { Router } from "express";
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  updateTrackCode,
  confirmUserPayment,
} from "../controllers/orderController";
import { getAgentReport, createAgentReport } from "../controllers/agentReportController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// All order routes require authentication
router.get("/", requireRole(["user", "agent", "admin"]), getOrders);
router.get("/:id", requireRole(["user", "agent", "admin"]), getOrder);
router.post("/", requireRole(["user", "agent", "admin"]), createOrder);
router.put("/:id/status", requireRole(["agent", "admin"]), updateOrderStatus);
router.put("/:id/track-code", requireRole(["agent", "admin"]), updateTrackCode);
router.put("/:id/user-payment-confirmed", requireRole("user"), confirmUserPayment);
router.get("/:id/report", requireRole(["user", "agent", "admin"]), getAgentReport);
router.post("/:id/report", requireRole(["agent", "admin"]), createAgentReport);
router.delete("/:id", requireRole(["user", "agent", "admin"]), deleteOrder);

export default router;

