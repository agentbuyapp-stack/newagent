import { Router } from "express";
import { registerAsAgent, createRewardRequest, getMyRewardRequests } from "../controllers/agentController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Agent registration - DISABLED: Only admin can assign agent role
// router.post("/register", requireRole("user"), registerAsAgent);

// Reward request endpoints
router.get("/reward-requests", requireRole("agent"), getMyRewardRequests);
router.post("/reward-request", requireRole("agent"), createRewardRequest);

export default router;

