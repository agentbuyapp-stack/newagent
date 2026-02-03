import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Message {
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  sessionId: string;
  messages: Message[];
  status: "active" | "waiting_human" | "resolved";
}

interface UseSupportChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  status: "active" | "waiting_human" | "resolved";
  sendMessage: (message: string) => Promise<void>;
  requestHumanSupport: () => Promise<void>;
  clearChat: () => void;
}

// Generate a unique visitor ID for anonymous users
const getVisitorId = (): string => {
  if (typeof window === "undefined") return "";

  let visitorId = localStorage.getItem("support_visitor_id");
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("support_visitor_id", visitorId);
  }
  return visitorId;
};

// Get saved session ID
const getSavedSessionId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("support_session_id");
};

// Save session ID
const saveSessionId = (sessionId: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("support_session_id", sessionId);
};

export const useSupportChat = (): UseSupportChatReturn => {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<"active" | "waiting_human" | "resolved">("active");

  // Load existing session on mount
  useEffect(() => {
    const savedSessionId = getSavedSessionId();
    if (savedSessionId) {
      loadSession(savedSessionId);
    }
  }, []);

  const loadSession = async (sid: string) => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/support/session/${sid}`, {
        headers,
      });

      if (response.ok) {
        const session: ChatSession = await response.json();
        setSessionId(session.sessionId);
        setMessages(session.messages);
        setStatus(session.status);
      }
    } catch (err) {
      // Session not found or expired, start fresh
      localStorage.removeItem("support_session_id");
    }
  };

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately for better UX
      const userMessage: Message = {
        role: "user",
        content: message.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const token = await getToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/support/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: message.trim(),
            sessionId,
            visitorId: getVisitorId(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Алдаа гарлаа");
        }

        const data = await response.json();

        // Save session ID
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
          saveSessionId(data.sessionId);
        }

        // Add AI response
        const aiMessage: Message = {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Update status
        setStatus(data.status);
      } catch (err: any) {
        setError(err.message || "Алдаа гарлаа. Дахин оролдоно уу.");
        // Remove the user message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, getToken]
  );

  const requestHumanSupport = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/support/handoff`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Алдаа гарлаа");
      }

      const data = await response.json();

      // Add system message
      const systemMessage: Message = {
        role: "assistant",
        content: "Таны хүсэлтийг хүлээн авлаа. Манай ажилтан удахгүй холбогдох болно.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
      setStatus("waiting_human");
    } catch (err: any) {
      setError(err.message || "Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, getToken]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setStatus("active");
    setError(null);
    localStorage.removeItem("support_session_id");
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    status,
    sendMessage,
    requestHumanSupport,
    clearChat,
  };
};
