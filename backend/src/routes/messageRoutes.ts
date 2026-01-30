import { Router, Request, Response, NextFunction } from "express";
import { getMessages, sendMessage, getLatestVoiceMessage } from "../controllers/messageController";
import { requireRole } from "../middleware/requireRole";
import { validate, validateParams } from "../middleware/validate";
import { sendMessageSchema, mongoIdSchema } from "../schemas";
import { messageLimiter } from "../middleware/rateLimit";

const router = Router();

// Rate limiter only for users, agents/admins bypass
const conditionalMessageLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === "agent" || req.user?.role === "admin") {
    return next(); // Skip rate limit for agents and admins
  }
  return messageLimiter(req, res, next);
};

// Message routes are nested under orders
router.get("/:id/messages", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), getMessages);
router.get("/:id/latest-voice", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), getLatestVoiceMessage);
router.post("/:id/messages", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), conditionalMessageLimiter, validate(sendMessageSchema), sendMessage);

export default router;

