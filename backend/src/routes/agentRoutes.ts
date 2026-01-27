import { Router } from "express";
import { createRewardRequest, getMyRewardRequests, getPublicAgents } from "../controllers/agentController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Public endpoint - get all approved agents with stats (no auth required)
router.get("/public", getPublicAgents);

// Agent registration - DISABLED: Only admin can assign agent role
// router.post("/register", requireRole("user"), registerAsAgent);

// Reward request endpoints
router.get("/reward-requests", requireRole("agent"), getMyRewardRequests);
router.post("/reward-request", requireRole("agent"), createRewardRequest);

export default router;
