import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/messageController";
import { requireRole } from "../middleware/requireRole";
import { validate, validateParams } from "../middleware/validate";
import { sendMessageSchema, mongoIdSchema } from "../schemas";
import { messageLimiter } from "../middleware/rateLimit";

const router = Router();

// Message routes are nested under orders
router.get("/:id/messages", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), getMessages);
router.post("/:id/messages", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), messageLimiter, validate(sendMessageSchema), sendMessage);

export default router;

