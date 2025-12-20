import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// All profile routes require authentication
router.get("/", requireRole(["user", "agent", "admin"]), getProfile);
router.put("/", requireRole(["user", "agent", "admin"]), updateProfile);

export default router;

