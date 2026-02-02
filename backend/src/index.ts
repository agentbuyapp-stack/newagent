import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import connectDB from "./lib/mongodb";
import { errorHandler } from "./middleware/errorHandler";
import { clerkAuth } from "./middleware/clerkAuth";
import { corsOptions } from "./config/cors";
import { swaggerSpec } from "./config/swagger";
import mongoose from "mongoose";
import { generalLimiter, authLimiter } from "./middleware/rateLimit";
import logger from "./utils/logger";
import { initializeSocket } from "./lib/socket";

// Import routes
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import orderRoutes from "./routes/orderRoutes";
import messageRoutes from "./routes/messageRoutes";
import adminRoutes from "./routes/adminRoutes";
import cargoRoutes from "./routes/cargoRoutes";
import adminCargoRoutes from "./routes/adminCargoRoutes";
import agentRoutes from "./routes/agentRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import bundleOrderRoutes from "./routes/bundleOrderRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import cardRoutes from "./routes/cardRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import productShowcaseRoutes from "./routes/productShowcaseRoutes";
import { initCronJobs } from "./services/cronService";

const app = express();

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}));

// Response compression
app.use(compression());

// CORS configuration
app.use(cors(corsOptions));

// Increase body size limit for image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting - бүх API endpoint-д хэрэглэнэ
app.use(generalLimiter);

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "AgentBuy API Docs",
}));

// Health check endpoint (public)
app.get("/health", async (_req, res) => {
  try {
    // Test database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB not connected");
    }
    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error: any) {
    logger.error("Health check failed", { error: error.message });
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Public routes (before authentication)
app.use("/auth", authLimiter, authRoutes);

// Use Clerk authentication for protected routes
app.use(clerkAuth);

// Protected routes
// Note: authRoutes contains both /register (public) and /me (protected)
// We mount /me separately since it should be at root level
import { getMe } from "./controllers/authController";
app.get("/me", getMe);

app.use("/profile", profileRoutes);
app.use("/orders", orderRoutes);
app.use("/orders", messageRoutes); // Nested message routes under orders
app.use("/admin", adminRoutes);
app.use("/admin/cargos", adminCargoRoutes);
app.use("/cargos", cargoRoutes);
app.use("/agents", agentRoutes);
app.use("/upload-image", uploadRoutes);
app.use("/bundle-orders", bundleOrderRoutes);
app.use("/notifications", notificationRoutes);
app.use("/cards", cardRoutes);
app.use("/banners", bannerRoutes);
app.use("/showcases", productShowcaseRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info("MongoDB connected successfully");

    // Initialize cron jobs for email processing and notifications
    initCronJobs();
  })
  .catch((err) => {
    logger.error("MongoDB connection failed", { error: err.message });
    process.exit(1);
  });

const port = process.env.PORT || 4000;

// Create HTTP server and initialize Socket.io
const httpServer = createServer(app);
initializeSocket(httpServer);

const server = httpServer.listen(port, () => {
  logger.info(`Server started on port ${port}`);
  logger.info(`API Docs available at http://localhost:${port}/api-docs`);
  logger.info(`Health check: http://localhost:${port}/health`);
  logger.info(`Socket.io enabled for real-time messaging`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info("HTTP server closed");

    mongoose.connection.close(false).then(() => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    }).catch((err) => {
      logger.error("Error closing MongoDB connection", { error: err.message });
      process.exit(1);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
