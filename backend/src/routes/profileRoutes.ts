import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../schemas";

const router = Router();

// All profile routes require authentication
router.get("/", requireRole(["user", "agent", "admin"]), getProfile);
router.put("/", requireRole(["user", "agent", "admin"]), validate(updateProfileSchema), updateProfile);

export default router;

