import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { Role } from "@prisma/client";
import { validateEmail, validatePhone } from "./utils/validation";
import { errorHandler } from "./middleware/errorHandler";
import { clerkAuth } from "./middleware/clerkAuth";
import { uploadImageToCloudinary } from "./utils/cloudinary";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        clerkId?: string;
      };
    }
  }
}

const app = express();

// CORS configuration for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Increase body size limit for image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const parseRole = (value: string | undefined): Role | null => {
  if (!value) return "user";
  const normalized = value.toLowerCase();
  if (normalized === "user" || normalized === "agent" || normalized === "admin") {
    return normalized as Role;
  }
  return null;
};

const requireRole = (allowed: Role | Role[]) => {
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    if (!allowedList.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden for role " + req.user.role });
    }
    next();
  };
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Register new user (public endpoint) - kept for backward compatibility
// Note: With Clerk, users are automatically created via clerkAuth middleware
app.post("/auth/register", async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    const userRole = parseRole(role) || "user";
    
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        role: userRole,
      },
    });
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("Error in /auth/register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Use Clerk authentication for protected routes
app.use(clerkAuth);

app.get("/me", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    });
  } catch (error: any) {
    console.error("Error in /me:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Get user profile
app.get("/profile", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });
    
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    res.json(profile);
  } catch (error) {
    console.error("Error in GET /profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update or create user profile
app.put("/profile", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    
    const { name, phone, email, cargo } = req.body;
    
    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required and must be a non-empty string" });
    }
    
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ error: "Phone is required" });
    }
    
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }
    
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Upsert profile (create if doesn't exist, update if exists)
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      update: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        cargo: cargo ? cargo.trim() : null,
      },
      create: {
        userId: req.user.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        cargo: cargo ? cargo.trim() : null,
      },
    });
    
    res.json(profile);
  } catch (error) {
    console.error("Error in PUT /profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Order endpoints
// Get all orders for current user (or all orders for agent/admin)
app.get("/orders", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    
    // Agents and admins can see all orders, users only see their own
    const whereClause = (req.user.role === "agent" || req.user.role === "admin")
      ? {}
      : { userId: req.user.id };
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    
    res.json(orders);
  } catch (error) {
    console.error("Error in GET /orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single order
app.get("/orders/:id", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error in GET /orders/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new order
app.post("/orders", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    
    const { productName, description, imageUrl } = req.body;
    
    // Validation
    if (!productName || typeof productName !== "string" || productName.trim().length === 0) {
      return res.status(400).json({ error: "Product name is required" });
    }
    
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return res.status(400).json({ error: "Description is required" });
    }
    
    // Upload image to Cloudinary if provided
    let finalImageUrl = null;
    if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImageToCloudinary(imageUrl);
        finalImageUrl = uploadResult.url;
      } catch (uploadError: any) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload image: " + uploadError.message });
      }
    } else if (imageUrl && typeof imageUrl === "string") {
      // If it's already a URL, use it directly
      finalImageUrl = imageUrl;
    }
    
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        productName: productName.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        status: "pending",
      },
    });
    
    res.status(201).json(order);
  } catch (error: any) {
    console.error("Error in POST /orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/user", requireRole(["user", "agent", "admin"]), (req, res) => {
  res.json({ message: `Hello ${req.user?.role}, user scope accessible.` });
});

app.get("/agent", requireRole(["agent", "admin"]), (req, res) => {
  res.json({ message: "Agent and admin can see this." });
});

app.get("/admin", requireRole("admin"), (req, res) => {
  res.json({ message: "Admin only route." });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

