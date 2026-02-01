import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";

interface VoiceMessageEvent {
  orderId: string;
  voiceMessage: {
    audioUrl: string;
    audioDuration?: number;
    senderId: string;
    createdAt: string;
  };
}

interface UseSocketOptions {
  userId?: string;
  onNewVoiceMessage?: (event: VoiceMessageEvent) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
}

export function useSocket(options: UseSocketOptions): UseSocketReturn {
  const { userId, onNewVoiceMessage } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);

      // Join user's personal room
      socket.emit("join", userId);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Listen for new voice messages
    socket.on("new-voice-message", (event: VoiceMessageEvent) => {
      console.log("Received new voice message:", event);
      onNewVoiceMessage?.(event);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, onNewVoiceMessage]);

  const joinOrder = useCallback((orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-order", orderId);
    }
  }, []);

  const leaveOrder = useCallback((orderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave-order", orderId);
    }
  }, []);

  return {
    isConnected,
    joinOrder,
    leaveOrder,
  };
}
