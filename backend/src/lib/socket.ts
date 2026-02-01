import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "../utils/logger";

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // User joins their personal room (based on their user ID)
    socket.on("join", (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`User ${userId} joined room user:${userId}`);
      }
    });

    // User joins an order room (for order-specific updates)
    socket.on("join-order", (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        logger.info(`Socket ${socket.id} joined order room order:${orderId}`);
      }
    });

    // User leaves an order room
    socket.on("leave-order", (orderId: string) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
        logger.info(`Socket ${socket.id} left order room order:${orderId}`);
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  logger.info("Socket.io initialized");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Emit new voice message to specific user
export function emitNewVoiceMessage(
  recipientUserId: string,
  orderId: string,
  voiceMessage: {
    audioUrl: string;
    audioDuration?: number;
    senderId: string;
    createdAt: string;
  }
) {
  if (io) {
    // Emit to the recipient's personal room
    io.to(`user:${recipientUserId}`).emit("new-voice-message", {
      orderId,
      voiceMessage,
    });

    // Also emit to the order room
    io.to(`order:${orderId}`).emit("voice-message", {
      orderId,
      voiceMessage,
    });

    logger.info(`Emitted voice message to user:${recipientUserId} for order:${orderId}`);
  }
}

// Emit order update
export function emitOrderUpdate(orderId: string, update: Record<string, unknown>) {
  if (io) {
    io.to(`order:${orderId}`).emit("order-update", {
      orderId,
      ...update,
    });
  }
}
