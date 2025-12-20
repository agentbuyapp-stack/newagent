import { Router } from "express";
import { uploadImage } from "../controllers/uploadController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.post("/", requireRole(["user", "agent", "admin"]), uploadImage);

export default router;

