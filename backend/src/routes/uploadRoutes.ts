import { Router } from "express";
import { uploadImage, uploadAudio } from "../controllers/uploadController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.post("/", requireRole(["user", "agent", "admin"]), uploadImage);
router.post("/audio", requireRole(["user", "agent", "admin"]), uploadAudio);

export default router;

