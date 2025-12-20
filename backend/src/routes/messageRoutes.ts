import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/messageController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Message routes are nested under orders
router.get("/:id/messages", requireRole(["user", "agent", "admin"]), getMessages);
router.post("/:id/messages", requireRole(["user", "agent", "admin"]), sendMessage);

export default router;

