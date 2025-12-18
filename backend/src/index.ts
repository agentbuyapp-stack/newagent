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
// Support multiple domains from CLIENT_URL or FRONTEND_URL
const getAllowedOrigins = (): string[] => {
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";
  // If CLIENT_URL contains multiple URLs (comma-separated), split them
  if (clientUrl.includes(",")) {
    return clientUrl.split(",").map(url => url.trim().replace(/\/$/, ""));
  }
  return [clientUrl.replace(/\/$/, "")];
};

// Normalize origin for comparison (remove trailing slash)
const normalizeOrigin = (origin: string): string => {
  return origin.replace(/\/$/, "");
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      const normalizedOrigin = normalizeOrigin(origin);
      
      // Check if origin matches any allowed origin
      const isAllowed = allowedOrigins.some(allowed => {
        const normalizedAllowed = normalizeOrigin(allowed);
        return normalizedOrigin === normalizedAllowed || 
               normalizedOrigin.startsWith(normalizedAllowed);
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        // In development, allow localhost
        if (process.env.NODE_ENV === "development" && origin.includes("localhost")) {
          callback(null, true);
        } else {
          // Log for debugging
          console.log("CORS blocked origin:", origin);
          console.log("Allowed origins:", allowedOrigins);
          callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

app.get("/health", async (_req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
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
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true },
      });
    } catch (dbError: any) {
      console.error("Database error in /me:", dbError);
      console.error("Database error details:", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      });
      return res.status(500).json({ 
        error: "Database connection error",
        message: process.env.NODE_ENV === "development" ? dbError.message : undefined
      });
    }
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved || false,
      approvedAt: user.approvedAt,
      approvedBy: user.approvedBy,
      agentPoints: user.agentPoints || 0,
      profile: user.profile,
    });
  } catch (error: any) {
    console.error("Error in /me:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
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
    
    // Get user to check if agent is approved
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Agents can only see "niitlegdsen" orders if they are approved
    // Approved agents and admins can see all orders, users only see their own
    let whereClause: any = {};
    
    if (req.user.role === "user") {
      whereClause = { userId: req.user.id };
    } else if (req.user.role === "agent") {
      // If agent is not approved, they can only see their own orders
      if (!currentUser?.isApproved) {
        whereClause = { userId: req.user.id };
      } else {
        // Approved agents can see all orders
        whereClause = {};
      }
    } else if (req.user.role === "admin") {
      // Admins can see all orders
      whereClause = {};
    }
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        agent: {
          include: {
            profile: true,
          },
        },
      },
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
    
    // Get user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    
    // Build where clause: users can only see their own orders, agents/admins can see all
    let whereClause: any = {
      id: req.params.id,
    };
    
    if (req.user.role === "user") {
      whereClause.userId = req.user.id;
    } else if (req.user.role === "agent") {
      // Approved agents can see all orders, unapproved can only see their own
      if (!currentUser?.isApproved) {
        whereClause.userId = req.user.id;
      }
    }
    // Admins can see all orders, no additional where clause needed
    
    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        agent: {
          include: {
            profile: true,
          },
        },
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
    
    const { productName, description, imageUrl, imageUrls, products } = req.body;
    
    // Support for multiple products in one order
    if (products && Array.isArray(products) && products.length > 0) {
      // Create order with combined product information
      let allImageUrls: string[] = [];
      const productDescriptions: string[] = [];
      
      for (const product of products) {
        if (product.productName && product.description) {
          productDescriptions.push(`${product.productName}: ${product.description}`);
        }
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          allImageUrls = [...allImageUrls, ...product.imageUrls.slice(0, 3)];
        }
      }
      
      // Limit total images to 9 (3 per product * 3 products max)
      allImageUrls = allImageUrls.slice(0, 9);
      
      // Upload images to Cloudinary
      const finalImageUrls: string[] = [];
      for (let i = 0; i < allImageUrls.length; i++) {
        const img = allImageUrls[i];
        if (typeof img === "string" && img.startsWith("data:image")) {
          try {
            console.log(`[DEBUG] POST /orders: Uploading image ${i + 1} to Cloudinary`);
            const uploadResult = await uploadImageToCloudinary(img);
            finalImageUrls.push(uploadResult.url);
          } catch (uploadError: any) {
            console.error(`[DEBUG] POST /orders: Image ${i + 1} upload error:`, uploadError.message);
          }
        } else if (typeof img === "string") {
          finalImageUrls.push(img);
        }
      }
      
      const combinedProductName = products.map((p: any) => p.productName).filter(Boolean).join(", ");
      const combinedDescription = productDescriptions.join("\n\n");
      
      console.log(`[DEBUG] POST /orders: Creating order with ${products.length} products`);
      
      const order = await prisma.order.create({
        data: {
          userId: req.user.id,
          productName: combinedProductName || "Олон бараа",
          description: combinedDescription,
          imageUrl: finalImageUrls[0] || null,
          imageUrls: finalImageUrls,
          status: "niitlegdsen",
        },
      });
      
      console.log(`[DEBUG] POST /orders: Order created successfully: ${order.id}`);
      return res.status(201).json(order);
    }
    
    // Single product order (existing logic)
    console.log(`[DEBUG] POST /orders: User ${req.user.id} creating order`, {
      productName,
      description: description?.substring(0, 50),
      hasImageUrl: !!imageUrl,
      hasImageUrls: Array.isArray(imageUrls),
      imageUrlsCount: Array.isArray(imageUrls) ? imageUrls.length : 0,
    });
    
    // Validation
    if (!productName || typeof productName !== "string" || productName.trim().length === 0) {
      return res.status(400).json({ error: "Product name is required" });
    }
    
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return res.status(400).json({ error: "Description is required" });
    }
    
    // Handle multiple images (imageUrls array) - max 3 images
    let finalImageUrls: string[] = [];
    if (imageUrls && Array.isArray(imageUrls)) {
      // Limit to 3 images
      const imagesToProcess = imageUrls.slice(0, 3);
      console.log(`[DEBUG] POST /orders: Processing ${imagesToProcess.length} images`);
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const img = imagesToProcess[i];
        if (typeof img === "string" && img.startsWith("data:image")) {
          try {
            console.log(`[DEBUG] POST /orders: Uploading image ${i + 1} to Cloudinary`);
            const uploadResult = await uploadImageToCloudinary(img);
            finalImageUrls.push(uploadResult.url);
            console.log(`[DEBUG] POST /orders: Image ${i + 1} uploaded successfully: ${uploadResult.url}`);
          } catch (uploadError: any) {
            console.error(`[DEBUG] POST /orders: Image ${i + 1} upload error:`, {
              message: uploadError.message,
              stack: uploadError.stack,
              name: uploadError.name,
            });
            // Continue with other images even if one fails
          }
        } else if (typeof img === "string") {
          // If it's already a URL, use it directly
          console.log(`[DEBUG] POST /orders: Image ${i + 1} is already a URL: ${img.substring(0, 50)}`);
          finalImageUrls.push(img);
        }
      }
    }
    
    // Handle single image (backward compatibility)
    let finalImageUrl = null;
    if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
      try {
        console.log(`[DEBUG] POST /orders: Uploading single image to Cloudinary`);
        const uploadResult = await uploadImageToCloudinary(imageUrl);
        finalImageUrl = uploadResult.url;
        // Add to array if not already there
        if (!finalImageUrls.includes(finalImageUrl)) {
          finalImageUrls.push(finalImageUrl);
        }
        console.log(`[DEBUG] POST /orders: Single image uploaded successfully: ${finalImageUrl}`);
      } catch (uploadError: any) {
        console.error(`[DEBUG] POST /orders: Single image upload error:`, {
          message: uploadError.message,
          stack: uploadError.stack,
          name: uploadError.name,
        });
      }
    } else if (imageUrl && typeof imageUrl === "string") {
      finalImageUrl = imageUrl;
      if (!finalImageUrls.includes(finalImageUrl)) {
        finalImageUrls.push(finalImageUrl);
      }
    }
    
    console.log(`[DEBUG] POST /orders: Creating order in database`, {
      userId: req.user.id,
      productName: productName.trim(),
      description: description.trim().substring(0, 50),
      finalImageUrl,
      finalImageUrlsCount: finalImageUrls.length,
      finalImageUrls: finalImageUrls.map(url => url.substring(0, 50)),
    });
    
    try {
      const order = await prisma.order.create({
        data: {
          userId: req.user.id,
          productName: productName.trim(),
          description: description.trim(),
          imageUrl: finalImageUrl, // Keep for backward compatibility
          imageUrls: finalImageUrls, // Array of image URLs
          status: "niitlegdsen", // Default: Нийтэлсэн
        },
      });
      
      console.log(`[DEBUG] POST /orders: Order created successfully: ${order.id}`);
      
      res.status(201).json(order);
    } catch (dbError: any) {
      console.error("[DEBUG] POST /orders: Database error creating order:", {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name,
        code: dbError.code,
        meta: dbError.meta,
      });
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error("[DEBUG] POST /orders: Error creating order:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      meta: error.meta,
    });
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message 
      : "Internal server error";
    
    res.status(500).json({ 
      error: "Internal server error",
      message: errorMessage
    });
  }
});

// Update order status (for agents/admins)
app.put("/orders/:id/status", requireRole(["agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate status
    const validStatuses = ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga", "tsutsalsan_zahialga"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If agent is picking up the order, set agentId
    const updateData: any = { status: status as any };
    if (status === "agent_sudlaj_bn" && req.user.role === "agent" && !order.agentId) {
      updateData.agentId = req.user.id;
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    res.json(updatedOrder);
  } catch (error: any) {
    console.error("Error in PUT /orders/:id/status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Chat endpoints
// Get messages for an order
app.get("/orders/:id/messages", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;

    // Check if user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // User can only see messages for their own orders, agents/admins can see all
    if (req.user.role === "user" && order.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const messages = await prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (error: any) {
    console.error("Error in GET /orders/:id/messages:", error);
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

// Send a message
app.post("/orders/:id/messages", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    const { text, imageUrl } = req.body;

    if (!text && !imageUrl) {
      return res.status(400).json({ error: "Text or image is required" });
    }

    // Check if user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // User can only send messages for their own orders, agents/admins can send for all
    if (req.user.role === "user" && order.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // If agent is sending message, ensure they are assigned to the order
    if (req.user.role === "agent" && order.agentId && order.agentId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: req.user.id,
        text: text || null,
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json(message);
  } catch (error: any) {
    console.error("Error in POST /orders/:id/messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Agent report endpoints
// Get agent report for an order
app.get("/orders/:id/report", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;

    // Check if user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // User can only see reports for their own orders, agents/admins can see all
    if (req.user.role === "user" && order.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const report = await prisma.agentReport.findUnique({
      where: { orderId },
    });

    res.json(report);
  } catch (error: any) {
    console.error("Error in GET /orders/:id/report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create or update agent report
app.post("/orders/:id/report", requireRole(["agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    const { userAmount, paymentLink, additionalImages, additionalDescription, quantity } = req.body;

    if (!userAmount || typeof userAmount !== "number") {
      return res.status(400).json({ error: "userAmount is required and must be a number" });
    }

    // Check if order exists and agent is assigned
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only assigned agent or admin can create report
    if (req.user.role === "agent" && order.agentId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Check if report already exists
    const existingReport = await prisma.agentReport.findUnique({
      where: { orderId },
    });

    let report;
    if (existingReport) {
      // Update existing report
      report = await prisma.agentReport.update({
        where: { orderId },
        data: {
          userAmount,
          paymentLink: paymentLink || null,
          additionalImages: additionalImages || [],
          additionalDescription: additionalDescription || null,
          quantity: quantity || null,
        },
      });
    } else {
      // Create new report
      report = await prisma.agentReport.create({
        data: {
          orderId,
          userAmount,
          paymentLink: paymentLink || null,
          additionalImages: additionalImages || [],
          additionalDescription: additionalDescription || null,
          quantity: quantity || null,
        },
      });

      // Update order status to "tolbor_huleej_bn" when report is created
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "tolbor_huleej_bn" },
      });
    }

    res.status(201).json(report);
  } catch (error: any) {
    console.error("Error in POST /orders/:id/report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User payment confirmation endpoint
app.put("/orders/:id/user-payment-confirmed", requireRole("user"), async (req, res) => {
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

    // Only allow confirmation if order is in "tolbor_huleej_bn" status
    if (order.status !== "tolbor_huleej_bn") {
      return res.status(400).json({ error: "Order is not in payment pending status" });
    }

    // Update order to mark user payment as confirmed
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        userPaymentVerified: true,
      },
    });

    res.json(updatedOrder);
  } catch (error: any) {
    console.error("Error in PUT /orders/:id/user-payment-confirmed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update track code for order (agent/admin only, for successful orders)
app.put("/orders/:id/track-code", requireRole(["agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { trackCode } = req.body;

    if (!trackCode || typeof trackCode !== "string" || trackCode.trim() === "") {
      return res.status(400).json({ error: "Track code is required" });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow track code for successful orders
    if (order.status !== "amjilttai_zahialga") {
      return res.status(400).json({ error: "Track code can only be added to successful orders" });
    }

    // Check if user is the agent assigned to this order or is admin
    if (req.user.role !== "admin" && order.agentId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You can only add track code to your own orders" });
    }

    // Update order with track code
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        trackCode: trackCode.trim(),
      },
    });

    res.json(updatedOrder);
  } catch (error: any) {
    console.error("Error in PUT /orders/:id/track-code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload image endpoint (for chat messages)
app.post("/upload-image", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required" });
    }

    const uploadResult = await uploadImageToCloudinary(image);
    res.json({ url: uploadResult.url });
  } catch (error: any) {
    console.error("Error in POST /upload-image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Cancel/Delete order
app.delete("/orders/:id", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    
    // Get user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    
    // Build where clause: users can only delete their own orders, agents/admins can delete orders they have access to
    let whereClause: any = {
      id: req.params.id,
    };
    
    if (req.user.role === "user") {
      whereClause.userId = req.user.id;
    } else if (req.user.role === "agent") {
      // Approved agents can delete orders assigned to them or their own orders
      if (currentUser?.isApproved) {
        whereClause = {
          id: req.params.id,
          OR: [
            { userId: req.user.id },
            { agentId: req.user.id },
          ],
        };
      } else {
        // Unapproved agents can only delete their own orders
        whereClause.userId = req.user.id;
      }
    }
    // Admins can delete any order, no additional where clause needed
    
    const order = await prisma.order.findFirst({
      where: whereClause,
    });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Зөвхөн цуцлагдсан захиалга устгах боломжтой
    if (order.status !== "tsutsalsan_zahialga") {
      return res.status(400).json({ error: "Зөвхөн цуцлагдсан захиалга устгах боломжтой." });
    }
    
    // Delete images from Cloudinary if needed
    if (order.imageUrls && order.imageUrls.length > 0) {
      // TODO: Delete images from Cloudinary if needed
    }
    
    await prisma.order.delete({
      where: { id: order.id },
    });
    
    res.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /orders/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/user", requireRole(["user", "agent", "admin"]), (req, res) => {
  res.json({ message: `Hello ${req.user?.role}, user scope accessible.` });
});

app.get("/agent", requireRole(["agent", "admin"]), (req, res) => {
  res.json({ message: "Agent and admin can see this." });
});

// Admin endpoints
app.get("/admin", requireRole("admin"), (req, res) => {
  res.json({ message: "Admin only route." });
});

// Request to become an agent (user can request to become agent)
app.post("/agents/register", requireRole("user"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    console.log(`[DEBUG] POST /agents/register: User ${req.user.id} requesting to become agent`);

    // Update user role to "agent" (pending approval)
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        role: "agent",
        isApproved: false, // Needs admin approval
      },
      include: { profile: true },
    });
    
    console.log(`[DEBUG] POST /agents/register: User ${req.user.id} is now agent:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      isApproved: updatedUser.isApproved,
    });
    
    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error in POST /agents/register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all agents (pending and approved)
app.get("/admin/agents", requireRole("admin"), async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: "agent" },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });
    
    // Debug: Log agents for production debugging
    console.log(`[DEBUG] GET /admin/agents: Found ${agents.length} agents`);
    agents.forEach((agent, index) => {
      console.log(`[DEBUG] Agent ${index + 1}:`, {
        id: agent.id,
        email: agent.email,
        role: agent.role,
        isApproved: agent.isApproved,
        approvedAt: agent.approvedAt,
        approvedBy: agent.approvedBy,
        hasProfile: !!agent.profile,
        profileName: agent.profile?.name,
      });
    });
    
    res.json(agents);
  } catch (error: any) {
    console.error("Error in GET /admin/agents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve or reject agent
app.put("/admin/agents/:id/approve", requireRole("admin"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { approved } = req.body; // true or false

    console.log(`[DEBUG] PUT /admin/agents/:id/approve: Admin ${req.user.id} ${approved ? "approving" : "rejecting"} agent ${req.params.id}`);

    if (typeof approved !== "boolean") {
      return res.status(400).json({ error: "approved must be a boolean" });
    }

    const agent = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!agent || agent.role !== "agent") {
      console.log(`[DEBUG] PUT /admin/agents/:id/approve: Agent not found or not an agent:`, {
        id: req.params.id,
        found: !!agent,
        role: agent?.role,
      });
      return res.status(404).json({ error: "Agent not found" });
    }

    const updatedAgent = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        isApproved: approved,
        approvedAt: approved ? new Date() : null,
        approvedBy: approved ? req.user.id : null,
      },
      include: { profile: true },
    });

    console.log(`[DEBUG] PUT /admin/agents/:id/approve: Agent updated:`, {
      id: updatedAgent.id,
      email: updatedAgent.email,
      role: updatedAgent.role,
      isApproved: updatedAgent.isApproved,
      approvedAt: updatedAgent.approvedAt,
      approvedBy: updatedAgent.approvedBy,
    });

    res.json(updatedAgent);
  } catch (error: any) {
    console.error("Error in PUT /admin/agents/:id/approve:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all cargos (public endpoint for users/agents to select cargo in profile)
app.get("/cargos", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    const cargos = await prisma.cargo.findMany({
      orderBy: { name: "asc" },
    });
    res.json(cargos);
  } catch (error: any) {
    console.error("Error in GET /cargos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all cargos (admin only - for management)
app.get("/admin/cargos", requireRole("admin"), async (req, res) => {
  try {
    const cargos = await prisma.cargo.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(cargos);
  } catch (error: any) {
    console.error("Error in GET /admin/cargos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create cargo
app.post("/admin/cargos", requireRole("admin"), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Cargo name is required" });
    }

    const cargo = await prisma.cargo.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    res.status(201).json(cargo);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Cargo name already exists" });
    }
    console.error("Error in POST /admin/cargos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update cargo
app.put("/admin/cargos/:id", requireRole("admin"), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Cargo name is required" });
    }

    const cargo = await prisma.cargo.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    res.json(cargo);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Cargo not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Cargo name already exists" });
    }
    console.error("Error in PUT /admin/cargos/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete cargo
app.delete("/admin/cargos/:id", requireRole("admin"), async (req, res) => {
  try {
    await prisma.cargo.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Cargo deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Cargo not found" });
    }
    console.error("Error in DELETE /admin/cargos/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get orders with payment status (for admin)
app.get("/admin/orders", requireRole("admin"), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    // Also include agent profile for orders with agentId
    const ordersWithAgent = await Promise.all(
      orders.map(async (order) => {
        if (order.agentId) {
          const agent = await prisma.user.findUnique({
            where: { id: order.agentId },
            include: { profile: true },
          });
          return { ...order, agent };
        }
        return order;
      })
    );
    
    res.json(ordersWithAgent);
  } catch (error: any) {
    console.error("Error in GET /admin/orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify user payment
app.put("/admin/orders/:id/verify-payment", requireRole("admin"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If user payment is verified, update order status to "amjilttai_zahialga"
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        userPaymentVerified: true,
        status: order.status === "tolbor_huleej_bn" ? "amjilttai_zahialga" : order.status,
      },
    });

    res.json(updatedOrder);
  } catch (error: any) {
    console.error("Error in PUT /admin/orders/:id/verify-payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark agent payment as paid
app.put("/admin/orders/:id/agent-payment", requireRole("admin"), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        agentReport: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!order.userPaymentVerified) {
      return res.status(400).json({ error: "User payment must be verified first" });
    }

    if (!order.agentId) {
      return res.status(400).json({ error: "Order has no assigned agent" });
    }

    if (!order.agentReport) {
      return res.status(400).json({ error: "Order has no agent report" });
    }

    // Calculate agent points: user payment amount * 0.05 (5%)
    // User payment amount = agent report userAmount * exchangeRate * 1.05
    const adminSettings = await prisma.adminSettings.findFirst();
    const exchangeRate = adminSettings?.exchangeRate || 1;
    const userPaymentAmount = order.agentReport.userAmount * exchangeRate * 1.05;
    const agentPointsToAdd = userPaymentAmount * 0.05; // 5% of user payment

    // Get agent before updating
    const agent = await prisma.user.findUnique({
      where: { id: order.agentId },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Update order and add points to agent in a transaction
    const [updatedOrder] = await Promise.all([
      prisma.order.update({
        where: { id: req.params.id },
        data: {
          agentPaymentPaid: true,
        },
      }),
      prisma.user.update({
        where: { id: order.agentId },
        data: {
          agentPoints: (agent.agentPoints || 0) + agentPointsToAdd,
        },
      }),
    ]);

    res.json({
      ...updatedOrder,
      agentPointsAdded: agentPointsToAdd,
      newAgentPoints: (agent.agentPoints || 0) + agentPointsToAdd,
    });
  } catch (error: any) {
    console.error("Error in PUT /admin/orders/:id/agent-payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Agent reward request endpoints
// Create reward request (agent зарах)
app.post("/agents/reward-request", requireRole("agent"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const agent = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (!agent.agentPoints || agent.agentPoints <= 0) {
      return res.status(400).json({ error: "Оноо байхгүй байна" });
    }

    // Create reward request and set agent points to 0 in a transaction
    const [rewardRequest] = await Promise.all([
      prisma.rewardRequest.create({
        data: {
          agentId: agent.id,
          amount: agent.agentPoints,
          status: "pending",
        },
      }),
      prisma.user.update({
        where: { id: agent.id },
        data: {
          agentPoints: 0,
        },
      }),
    ]);

    res.json(rewardRequest);
  } catch (error: any) {
    console.error("Error in POST /agents/reward-request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reward requests (admin only)
app.get("/admin/reward-requests", requireRole("admin"), async (req, res) => {
  try {
    const requests = await prisma.rewardRequest.findMany({
      where: {
        status: "pending",
      },
      include: {
        agent: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(requests);
  } catch (error: any) {
    console.error("Error in GET /admin/reward-requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve reward request (admin only)
app.put("/admin/reward-requests/:id/approve", requireRole("admin"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const request = await prisma.rewardRequest.findUnique({
      where: { id: req.params.id },
      include: {
        agent: true,
      },
    });

    if (!request) {
      return res.status(404).json({ error: "Reward request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }

    // Update request status to approved
    const updatedRequest = await prisma.rewardRequest.update({
      where: { id: req.params.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: req.user.id,
      },
      include: {
        agent: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json(updatedRequest);
  } catch (error: any) {
    console.error("Error in PUT /admin/reward-requests/:id/approve:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reject reward request (admin only)
app.put("/admin/reward-requests/:id/reject", requireRole("admin"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const request = await prisma.rewardRequest.findUnique({
      where: { id: req.params.id },
      include: {
        agent: true,
      },
    });

    if (!request) {
      return res.status(404).json({ error: "Reward request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }

    // Update request status to rejected and return points to agent
    const [updatedRequest] = await Promise.all([
      prisma.rewardRequest.update({
        where: { id: req.params.id },
        data: {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: req.user.id,
        },
        include: {
          agent: {
            include: {
              profile: true,
            },
          },
        },
      }),
      prisma.user.update({
        where: { id: request.agentId },
        data: {
          agentPoints: (request.agent.agentPoints || 0) + request.amount,
        },
      }),
    ]);

    res.json(updatedRequest);
  } catch (error: any) {
    console.error("Error in PUT /admin/reward-requests/:id/reject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Settings endpoints
// Get admin settings (accessible to all users for payment info, but only admins can update)
app.get("/admin/settings", requireRole(["user", "agent", "admin"]), async (req, res) => {
  try {
    let settings = await prisma.adminSettings.findFirst();
    
    // If no settings exist, create default one
    if (!settings) {
      settings = await prisma.adminSettings.create({
        data: {},
      });
    }
    
    res.json(settings);
  } catch (error: any) {
    console.error("Error in GET /admin/settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update admin settings
app.put("/admin/settings", requireRole("admin"), async (req, res) => {
  try {
    const { accountNumber, accountName, bank, exchangeRate } = req.body;

    let settings = await prisma.adminSettings.findFirst();
    
    if (!settings) {
      // Create new settings
      settings = await prisma.adminSettings.create({
        data: {
          accountNumber: accountNumber || null,
          accountName: accountName || null,
          bank: bank || null,
          exchangeRate: exchangeRate || null,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.adminSettings.update({
        where: { id: settings.id },
        data: {
          accountNumber: accountNumber !== undefined ? accountNumber : settings.accountNumber,
          accountName: accountName !== undefined ? accountName : settings.accountName,
          bank: bank !== undefined ? bank : settings.bank,
          exchangeRate: exchangeRate !== undefined ? exchangeRate : settings.exchangeRate,
        },
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error("Error in PUT /admin/settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

