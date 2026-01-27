import { Router } from "express";
import {
  getCargos,
} from "../controllers/cargoController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Public cargo routes (for users/agents to select)
router.get("/", requireRole(["user", "agent", "admin"]), getCargos);

export default router;
