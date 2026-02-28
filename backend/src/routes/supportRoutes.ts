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
import { optionalAuth, auth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Public routes (with optional auth for logged-in users)
router.post("/chat", optionalAuth, chat);
router.get("/session/:sessionId", optionalAuth, getSession);
router.post("/handoff", optionalAuth, requestHandoff);

// Knowledge base (public read)
router.get("/knowledge", getKnowledge);

// Admin routes
router.get("/admin/chats", auth, requireRole(["admin"]), getAdminChats);
router.post("/admin/reply", auth, requireRole(["admin"]), adminReply);
router.put("/admin/resolve/:sessionId", auth, requireRole(["admin"]), resolveChat);
router.post("/knowledge", auth, requireRole(["admin"]), addKnowledge);
router.delete("/knowledge/:id", auth, requireRole(["admin"]), deleteKnowledge);

// System prompt routes (admin only)
router.get("/system-prompt", auth, requireRole(["admin"]), getSystemPromptController);
router.put("/system-prompt", auth, requireRole(["admin"]), updateSystemPromptController);

export default router;
