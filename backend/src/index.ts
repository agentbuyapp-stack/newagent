import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./lib/mongodb";
import { errorHandler } from "./middleware/errorHandler";
import { clerkAuth } from "./middleware/clerkAuth";
import { corsOptions } from "./config/cors";
import mongoose from "mongoose";

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

const app = express();

// CORS configuration
app.use(cors(corsOptions));

// Increase body size limit for image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    console.error("Health check error:", error);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Public routes (before authentication)
app.use("/auth", authRoutes);

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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});
