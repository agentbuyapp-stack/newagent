import Anthropic from "@anthropic-ai/sdk";
import { KnowledgeBase } from "../models/KnowledgeBase";
import { getSystemPrompt } from "../models/SupportConfig";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get knowledge base content for system prompt
const getKnowledgeBaseContent = async (): Promise<string> => {
  const knowledge = await KnowledgeBase.find({ isActive: true }).lean();

  if (knowledge.length === 0) {
    return "Одоогоор knowledge base хоосон байна.";
  }

  return knowledge
    .map((k) => `Асуулт: ${k.question}\nХариулт: ${k.answer}`)
    .join("\n\n");
};

// Build system prompt with knowledge base
const buildSystemPrompt = async (): Promise<string> => {
  const [knowledgeContent, systemPromptTemplate] = await Promise.all([
    getKnowledgeBaseContent(),
    getSystemPrompt(),
  ]);

  // Replace {{knowledge_base}} placeholder with actual content
  return systemPromptTemplate.replace("{{knowledge_base}}", knowledgeContent);
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  message: string;
  handoffRequested: boolean;
}

// Chat with Claude
export const chatWithAI = async (
  messages: ChatMessage[]
): Promise<ChatResponse> => {
  try {
    const systemPrompt = await buildSystemPrompt();

    // Convert messages to Anthropic format (filter out system messages)
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 150,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // Extract text from response
    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Check if handoff was requested
    const handoffRequested = assistantMessage.includes("HANDOFF_REQUESTED");

    // Clean the message (remove HANDOFF_REQUESTED marker)
    const cleanMessage = assistantMessage
      .replace("HANDOFF_REQUESTED", "")
      .trim();

    return {
      message: cleanMessage,
      handoffRequested,
    };
  } catch (error: any) {
    console.error("Claude API error:", error.message);
    throw new Error("AI хариу өгөхөд алдаа гарлаа. Дахин оролдоно уу.");
  }
};

// Simple single message chat (for quick responses)
export const quickChat = async (userMessage: string): Promise<ChatResponse> => {
  return chatWithAI([{ role: "user", content: userMessage }]);
};
