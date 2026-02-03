import { Request, Response } from "express";
import { SupportChat } from "../models/SupportChat";
import { KnowledgeBase } from "../models/KnowledgeBase";
import { getSystemPrompt, updateSystemPrompt } from "../models/SupportConfig";
import { chatWithAI, ChatMessage } from "../services/openaiService";
import { notifyAdminSupportHandoff } from "../services/notificationService";
import crypto from "crypto";

// Generate unique session ID
const generateSessionId = () => {
  return `support_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
};

// Generate visitor ID (for anonymous users)
const generateVisitorId = () => {
  return `visitor_${crypto.randomBytes(16).toString("hex")}`;
};

/**
 * POST /api/support/chat
 * Send message to AI and get response
 */
export const chat = async (req: Request, res: Response) => {
  try {
    const { message, sessionId, visitorId } = req.body;
    const clerkUserId = (req as any).auth?.userId;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create session
    let session = sessionId
      ? await SupportChat.findOne({ sessionId })
      : null;

    if (!session) {
      // Create new session
      session = new SupportChat({
        sessionId: generateSessionId(),
        clerkUserId,
        visitorId: visitorId || generateVisitorId(),
        messages: [],
        status: "active",
        metadata: {
          userAgent: req.headers["user-agent"],
          page: req.headers.referer,
        },
      });
    }

    // Add user message
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // If waiting for human, don't call AI
    if (session.status === "waiting_human") {
      await session.save();
      return res.json({
        sessionId: session.sessionId,
        message: "Таны мессеж хүлээн авлаа. Манай ажилтан удахгүй хариу өгөх болно.",
        status: session.status,
        waitingForHuman: true,
      });
    }

    // Build messages for AI (last 10 messages for context)
    const aiMessages: ChatMessage[] = session.messages
      .slice(-10)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Get AI response
    const aiResponse = await chatWithAI(aiMessages);

    // Add AI response to messages
    session.messages.push({
      role: "assistant",
      content: aiResponse.message,
      timestamp: new Date(),
    });

    // Handle handoff request
    if (aiResponse.handoffRequested) {
      session.status = "waiting_human";
      // Notify admins
      await notifyAdminSupportHandoff(session.sessionId, session.clerkUserId || "Зочин");
    }

    await session.save();

    res.json({
      sessionId: session.sessionId,
      message: aiResponse.message,
      status: session.status,
      handoffRequested: aiResponse.handoffRequested,
    });
  } catch (error: any) {
    console.error("Support chat error:", error);
    res.status(500).json({
      error: error.message || "Алдаа гарлаа. Дахин оролдоно уу.",
    });
  }
};

/**
 * GET /api/support/session/:sessionId
 * Get chat session by ID
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await SupportChat.findOne({ sessionId }).lean();

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  } catch (error: any) {
    console.error("Get session error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * POST /api/support/handoff
 * Request human support
 */
export const requestHandoff = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const session = await SupportChat.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.status = "waiting_human";
    session.messages.push({
      role: "assistant",
      content: "Таны хүсэлтийг хүлээн авлаа. Манай ажилтан удахгүй холбогдох болно.",
      timestamp: new Date(),
    });

    await session.save();

    // Send notification to admins
    await notifyAdminSupportHandoff(session.sessionId, session.clerkUserId || "Зочин");

    res.json({
      success: true,
      message: "Хүсэлт амжилттай илгээгдлээ",
      status: session.status,
    });
  } catch (error: any) {
    console.error("Handoff request error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * GET /api/support/admin/chats
 * Get all support chats (admin only)
 */
export const getAdminChats = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const chats = await SupportChat.find(query)
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await SupportChat.countDocuments(query);

    res.json({
      chats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Get admin chats error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * POST /api/support/admin/reply
 * Admin reply to support chat
 */
export const adminReply = async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    const adminId = (req as any).auth?.userId;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Session ID and message are required" });
    }

    const session = await SupportChat.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.messages.push({
      role: "admin",
      content: message,
      timestamp: new Date(),
    });

    session.assignedAdmin = adminId;
    session.status = "active"; // Back to active after admin responds

    await session.save();

    // TODO: Send real-time notification to user via socket.io

    res.json({
      success: true,
      message: "Хариу илгээгдлээ",
    });
  } catch (error: any) {
    console.error("Admin reply error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * PUT /api/support/admin/resolve/:sessionId
 * Resolve a support chat
 */
export const resolveChat = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await SupportChat.findOneAndUpdate(
      { sessionId },
      { status: "resolved" },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      success: true,
      message: "Чат хаагдлаа",
    });
  } catch (error: any) {
    console.error("Resolve chat error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * GET /api/support/knowledge
 * Get all knowledge base entries
 */
export const getKnowledge = async (_req: Request, res: Response) => {
  try {
    const knowledge = await KnowledgeBase.find({ isActive: true })
      .sort({ category: 1 })
      .lean();

    res.json(knowledge);
  } catch (error: any) {
    console.error("Get knowledge error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * POST /api/support/knowledge
 * Add new knowledge base entry (admin only)
 */
export const addKnowledge = async (req: Request, res: Response) => {
  try {
    const { category, question, answer, keywords } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({
        error: "Category, question, and answer are required",
      });
    }

    const knowledge = new KnowledgeBase({
      category,
      question,
      answer,
      keywords: keywords || [],
    });

    await knowledge.save();

    res.status(201).json(knowledge);
  } catch (error: any) {
    console.error("Add knowledge error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * DELETE /api/support/knowledge/:id
 * Delete knowledge base entry (admin only)
 */
export const deleteKnowledge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await KnowledgeBase.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: "Knowledge entry not found" });
    }

    res.json({ success: true, message: "Устгагдлаа" });
  } catch (error: any) {
    console.error("Delete knowledge error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * GET /api/support/system-prompt
 * Get current system prompt (admin only)
 */
export const getSystemPromptController = async (_req: Request, res: Response) => {
  try {
    const prompt = await getSystemPrompt();
    res.json({ prompt });
  } catch (error: any) {
    console.error("Get system prompt error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};

/**
 * PUT /api/support/system-prompt
 * Update system prompt (admin only)
 */
export const updateSystemPromptController = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    await updateSystemPrompt(prompt);
    res.json({ success: true, message: "System prompt шинэчлэгдлээ" });
  } catch (error: any) {
    console.error("Update system prompt error:", error);
    res.status(500).json({ error: "Алдаа гарлаа" });
  }
};
