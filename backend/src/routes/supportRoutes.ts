import { Router } from "express";
import {
  chat,
  getSession,
  requestHandoff,
  getAdminChats,
  adminReply,
  resolveChat,
  getKnowledge,
  addKnowledge,
  deleteKnowledge,
  getSystemPromptController,
  updateSystemPromptController,
} from "../controllers/supportController";
import { optionalClerkAuth, requireClerkAuth } from "../middleware/clerkAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Public routes (with optional auth for logged-in users)
router.post("/chat", optionalClerkAuth, chat);
router.get("/session/:sessionId", optionalClerkAuth, getSession);
router.post("/handoff", optionalClerkAuth, requestHandoff);

// Knowledge base (public read)
router.get("/knowledge", getKnowledge);

// Admin routes
router.get("/admin/chats", requireClerkAuth, requireRole(["admin"]), getAdminChats);
router.post("/admin/reply", requireClerkAuth, requireRole(["admin"]), adminReply);
router.put("/admin/resolve/:sessionId", requireClerkAuth, requireRole(["admin"]), resolveChat);
router.post("/knowledge", requireClerkAuth, requireRole(["admin"]), addKnowledge);
router.delete("/knowledge/:id", requireClerkAuth, requireRole(["admin"]), deleteKnowledge);

// System prompt routes (admin only)
router.get("/system-prompt", requireClerkAuth, requireRole(["admin"]), getSystemPromptController);
router.put("/system-prompt", requireClerkAuth, requireRole(["admin"]), updateSystemPromptController);

export default router;
