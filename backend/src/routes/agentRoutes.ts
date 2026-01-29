import { Router } from "express";
import {
  createRewardRequest,
  getMyRewardRequests,
  getPublicAgents,
  getTopAgents,
  getAgentReviews,
  createAgentReview,
  getPublicSpecialties,
} from "../controllers/agentController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Public endpoints (no auth required)
router.get("/public", getPublicAgents);
router.get("/top", getTopAgents);
router.get("/specialties", getPublicSpecialties);
router.get("/:id/reviews", getAgentReviews);

// User endpoints (auth required)
router.post("/:agentId/reviews/:orderId", requireRole("user"), createAgentReview);

// Agent registration - DISABLED: Only admin can assign agent role
// router.post("/register", requireRole("user"), registerAsAgent);

// Reward request endpoints
router.get("/reward-requests", requireRole("agent"), getMyRewardRequests);
router.post("/reward-request", requireRole("agent"), createRewardRequest);

export default router;
