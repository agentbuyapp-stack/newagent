"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
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

interface SocketContextValue {
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
  newVoiceMessages: Map<string, VoiceMessageEvent>;
  clearNewVoiceMessage: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function SocketProvider({ children, userId }: SocketProviderProps) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newVoiceMessages, setNewVoiceMessages] = useState<Map<string, VoiceMessageEvent>>(new Map());

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
      console.log("Received new voice message for order:", event.orderId);
      setNewVoiceMessages((prev) => {
        const updated = new Map(prev);
        updated.set(event.orderId, event);
        return updated;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

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

  const clearNewVoiceMessage = useCallback((orderId: string) => {
    setNewVoiceMessages((prev) => {
      const updated = new Map(prev);
      updated.delete(orderId);
      return updated;
    });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        joinOrder,
        leaveOrder,
        newVoiceMessages,
        clearNewVoiceMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    // Return a dummy context if not inside provider
    return {
      isConnected: false,
      joinOrder: () => {},
      leaveOrder: () => {},
      newVoiceMessages: new Map(),
      clearNewVoiceMessage: () => {},
    };
  }
  return context;
}
