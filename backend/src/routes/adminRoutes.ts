import { Router } from "express";
import {
  addAgent,
  getAgents,
  approveAgent,
  getAdminOrders,
  verifyUserPayment,
  markAgentPaymentPaid,
  getAdminSettings,
  updateAdminSettings,
  getRewardRequests,
  approveRewardRequest,
  rejectRewardRequest,
  cancelPayment,
} from "../controllers/adminController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// All admin routes require admin role
router.post("/agents", requireRole("admin"), addAgent);
router.get("/agents", requireRole("admin"), getAgents);
router.put("/agents/:id/approve", requireRole("admin"), approveAgent);
router.get("/orders", requireRole("admin"), getAdminOrders);
router.put("/orders/:id/verify-payment", requireRole("admin"), verifyUserPayment);
router.put("/orders/:id/cancel-payment", requireRole("admin"), cancelPayment);
router.put("/orders/:id/agent-payment", requireRole("admin"), markAgentPaymentPaid);
router.get("/settings", requireRole(["user", "agent", "admin"]), getAdminSettings);
router.put("/settings", requireRole("admin"), updateAdminSettings);
router.get("/reward-requests", requireRole("admin"), getRewardRequests);
router.put("/reward-requests/:id/approve", requireRole("admin"), approveRewardRequest);
router.put("/reward-requests/:id/reject", requireRole("admin"), rejectRewardRequest);

export default router;

