import { Router } from "express";
import {
  addAgent,
  getAgents,
  approveAgent,
  getAdminOrders,
  verifyUserPayment,
  markAgentPaymentPaid,
  markBundleAgentPaymentPaid,
  getAdminSettings,
  updateAdminSettings,
  getRewardRequests,
  approveRewardRequest,
  rejectRewardRequest,
  cancelPayment,
  // Agent Profile Management
  updateAgentProfile,
  updateAgentRank,
  reorderAgents,
  toggleAgentTop,
  // Specialties Management
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  // Reviews Management
  getReviews,
  approveReview,
  deleteReview,
  // Stats
  recalculateAgentStats,
} from "../controllers/adminController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// All admin routes require admin role
router.post("/agents", requireRole("admin"), addAgent);
router.get("/agents", requireRole("admin"), getAgents);
router.put("/agents/:id/approve", requireRole("admin"), approveAgent);
router.put("/agents/:id/profile", requireRole("admin"), updateAgentProfile);
router.put("/agents/:id/rank", requireRole("admin"), updateAgentRank);
router.put("/agents/:id/toggle-top", requireRole("admin"), toggleAgentTop);
router.post("/agents/reorder", requireRole("admin"), reorderAgents);

router.get("/orders", requireRole("admin"), getAdminOrders);
router.put("/orders/:id/verify-payment", requireRole("admin"), verifyUserPayment);
router.put("/orders/:id/cancel-payment", requireRole("admin"), cancelPayment);
router.put("/orders/:id/agent-payment", requireRole("admin"), markAgentPaymentPaid);
router.put("/bundle-orders/:id/agent-payment", requireRole("admin"), markBundleAgentPaymentPaid);

router.get("/settings", requireRole(["user", "agent", "admin"]), getAdminSettings);
router.put("/settings", requireRole("admin"), updateAdminSettings);

router.get("/reward-requests", requireRole("admin"), getRewardRequests);
router.put("/reward-requests/:id/approve", requireRole("admin"), approveRewardRequest);
router.put("/reward-requests/:id/reject", requireRole("admin"), rejectRewardRequest);

// Specialties management
router.get("/specialties", requireRole("admin"), getSpecialties);
router.post("/specialties", requireRole("admin"), createSpecialty);
router.put("/specialties/:id", requireRole("admin"), updateSpecialty);
router.delete("/specialties/:id", requireRole("admin"), deleteSpecialty);

// Reviews management
router.get("/reviews", requireRole("admin"), getReviews);
router.put("/reviews/:id/approve", requireRole("admin"), approveReview);
router.delete("/reviews/:id", requireRole("admin"), deleteReview);

// Stats management
router.post("/recalculate-stats", requireRole("admin"), recalculateAgentStats);

export default router;

