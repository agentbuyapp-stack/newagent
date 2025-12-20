import { Request, Response } from "express";
import { Order, User, Profile } from "../models";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";

// Helper to format order with populated user/agent
const formatOrder = (order: any) => {
  try {
    // Extract agentId - handle both ObjectId and populated object
    let agentId: string | undefined = undefined;
    if (order.agentId) {
      if (typeof order.agentId === 'string') {
        agentId = order.agentId;
      } else if (order.agentId._id) {
        agentId = order.agentId._id.toString();
      } else if (order.agentId.id) {
        agentId = order.agentId.id.toString();
      } else if (order.agentId.toString) {
        agentId = order.agentId.toString();
      } else {
        agentId = String(order.agentId);
      }
    }

    // Extract userId - handle both ObjectId and populated object
    let userId: string | undefined = undefined;
    if (order.userId) {
      if (typeof order.userId === 'string') {
        userId = order.userId;
      } else if (order.userId._id) {
        userId = order.userId._id.toString();
      } else if (order.userId.id) {
        userId = order.userId.id.toString();
      } else if (order.userId.toString) {
        userId = order.userId.toString();
      } else {
        userId = String(order.userId);
      }
    }

    return {
      ...order,
      id: order._id?.toString() || order.id,
      userId: userId || order.userId,
      agentId: agentId || order.agentId,
      user: order.user && order.user._id ? {
        ...order.user,
        id: order.user._id.toString(),
        profile: order.user.profile && order.user.profile._id ? {
          ...order.user.profile,
          id: order.user.profile._id.toString(),
          userId: order.user.profile.userId?.toString() || order.user.profile.userId,
        } : null,
      } : null,
      agent: order.agent && order.agent._id ? {
        ...order.agent,
        id: order.agent._id.toString(),
        profile: order.agent.profile && order.agent.profile._id ? {
          ...order.agent.profile,
          id: order.agent.profile._id.toString(),
          userId: order.agent.profile.userId?.toString() || order.agent.profile.userId,
        } : null,
      } : null,
    };
  } catch (formatError: any) {
    console.error("Error formatting order:", formatError);
    // Return basic order data if formatting fails
    return {
      ...order,
      id: order._id?.toString() || order.id,
      userId: order.userId?.toString() || order.userId,
      agentId: order.agentId?.toString() || order.agentId,
      user: null,
      agent: null,
    };
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    // Get user to check if agent is approved
    const currentUser = await User.findById(req.user.id).lean();

    // Build query based on role
    let query: any = {};

    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      query.userId = new mongoose.Types.ObjectId(req.user.id);
    } else if (req.user.role === "agent") {
      // Agents can see:
      // 1. Open orders (status = "niitlegdsen" and no agentId assigned)
      // 2. Orders where they are the agent (agentId matches their ID)
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const agentObjectId = new mongoose.Types.ObjectId(req.user.id);
      query.$or = [
        // Open orders (published but not assigned to any agent)
        { status: "niitlegdsen", agentId: null },
        { status: "niitlegdsen", agentId: { $exists: false } },
        // Orders assigned to this agent
        { agentId: agentObjectId }
      ];
    }
    // Admins can see all orders (empty query)

    const orders = await Order.find(query)
      .populate("userId", null, User)
      .populate("agentId", null, User)
      .sort({ createdAt: -1 })
      .lean();

    // Debug logging for agents
    if (req.user.role === "agent" && process.env.NODE_ENV === "development") {
      console.log("Agent orders query result:", {
        agentId: req.user.id,
        query: query,
        ordersCount: orders.length,
        ordersWithAgentId: orders.filter(o => o.agentId).length,
        sampleOrders: orders.slice(0, 3).map(o => ({
          id: o._id.toString(),
          agentId: o.agentId?.toString(),
          status: o.status
        }))
      });
    }

    // Get all user IDs and agent IDs (handle both ObjectId and populated objects)
    const extractUserId = (userId: any): string | null => {
      if (!userId) return null;
      if (typeof userId === 'string') return userId;
      if (userId._id) return userId._id.toString();
      if (userId.toString) return userId.toString();
      return null;
    };

    const userIds = [...new Set(orders.map(o => extractUserId(o.userId)).filter(Boolean))] as string[];
    const agentIds = [...new Set(orders.map(o => extractUserId(o.agentId)).filter(Boolean))] as string[];
    const allUserIds = [...new Set([...userIds, ...agentIds])];

    // Get profiles for all users
    const profiles = allUserIds.length > 0
      ? await Profile.find({ userId: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) } }).lean()
      : [];
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    // Format orders with user/agent data
    const formattedOrders = orders.map(order => {
      const userIdStr = extractUserId(order.userId);
      const agentIdStr = extractUserId(order.agentId);

      // Build user object from populated data or just ID
      let user = null;
      if (userIdStr) {
        const userProfile = profileMap.get(userIdStr) || null;
        if (order.userId && typeof order.userId === 'object' && order.userId._id) {
          // User was populated
          user = {
            _id: order.userId._id,
            id: order.userId._id.toString(),
            email: order.userId.email || '',
            role: order.userId.role || 'user',
            isApproved: order.userId.isApproved || false,
            agentPoints: order.userId.agentPoints || 0,
            profile: userProfile ? {
              ...userProfile,
              id: userProfile._id.toString(),
              userId: userProfile.userId.toString(),
            } : null,
          };
        } else {
          // User was not populated, create minimal object
          user = {
            _id: new mongoose.Types.ObjectId(userIdStr),
            id: userIdStr,
            email: '',
            role: 'user',
            isApproved: false,
            agentPoints: 0,
            profile: userProfile ? {
              ...userProfile,
              id: userProfile._id.toString(),
              userId: userProfile.userId.toString(),
            } : null,
          };
        }
      }

      // Build agent object from populated data or just ID
      let agent = null;
      if (agentIdStr) {
        const agentProfile = profileMap.get(agentIdStr) || null;
        if (order.agentId && typeof order.agentId === 'object' && order.agentId._id) {
          // Agent was populated
          agent = {
            _id: order.agentId._id,
            id: order.agentId._id.toString(),
            email: order.agentId.email || '',
            role: order.agentId.role || 'agent',
            isApproved: order.agentId.isApproved || false,
            agentPoints: order.agentId.agentPoints || 0,
            profile: agentProfile ? {
              ...agentProfile,
              id: agentProfile._id.toString(),
              userId: agentProfile.userId.toString(),
            } : null,
          };
        } else {
          // Agent was not populated, create minimal object
          agent = {
            _id: new mongoose.Types.ObjectId(agentIdStr),
            id: agentIdStr,
            email: '',
            role: 'agent',
            isApproved: false,
            agentPoints: 0,
            profile: agentProfile ? {
              ...agentProfile,
              id: agentProfile._id.toString(),
              userId: agentProfile.userId.toString(),
            } : null,
          };
        }
      }

      return formatOrder({
        ...order,
        user,
        agent,
      });
    });

    res.json(formattedOrders);
  } catch (error: any) {
    console.error("Error in GET /orders:", error);
    console.error("Error details:", {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      name: error.name,
      code: error.code,
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
    });
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
      details: process.env.NODE_ENV === "development" ? {
        name: error.name,
        code: error.code,
      } : undefined,
    });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Get user to check role
    const currentUser = await User.findById(req.user.id).lean();

    // Build query
    let query: any = { _id: new mongoose.Types.ObjectId(orderId) };

    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      query.userId = new mongoose.Types.ObjectId(req.user.id);
    } else if (req.user.role === "agent") {
      // Agents can see:
      // 1. Open orders (status = "niitlegdsen" and no agentId assigned)
      // 2. Orders where they are the agent (agentId matches their ID)
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const agentObjectId = new mongoose.Types.ObjectId(req.user.id);
      const orderObjectId = new mongoose.Types.ObjectId(orderId);
      query.$or = [
        // Open orders (published but not assigned to any agent)
        { _id: orderObjectId, status: "niitlegdsen", agentId: null },
        { _id: orderObjectId, status: "niitlegdsen", agentId: { $exists: false } },
        // Orders assigned to this agent
        { _id: orderObjectId, agentId: agentObjectId }
      ];
    }
    // Admins can see all orders

    const order = await Order.findOne(query)
      .populate("userId", null, User)
      .populate("agentId", null, User)
      .lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get profiles for user and agent
    const userId = order.userId?.toString();
    const agentId = order.agentId?.toString();
    const allUserIds = [userId, agentId].filter(Boolean) as string[];

    const profiles = await Profile.find({ userId: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) } }).lean();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const user = order.userId ? {
      ...(typeof order.userId === 'object' ? order.userId : {}),
      _id: typeof order.userId === 'object' ? order.userId._id : new mongoose.Types.ObjectId(order.userId.toString()),
      profile: profileMap.get(order.userId.toString()) || null,
    } : null;

    const agent = order.agentId ? {
      ...(typeof order.agentId === 'object' ? order.agentId : {}),
      _id: typeof order.agentId === 'object' ? order.agentId._id : new mongoose.Types.ObjectId(order.agentId.toString()),
      profile: profileMap.get(order.agentId.toString()) || null,
    } : null;

    res.json(formatOrder({
      ...order,
      user: user ? {
        ...user,
        id: user._id.toString(),
        profile: user.profile ? {
          ...user.profile,
          id: user.profile._id.toString(),
          userId: user.profile.userId.toString(),
        } : null,
      } : null,
      agent: agent ? {
        ...agent,
        id: agent._id.toString(),
        profile: agent.profile ? {
          ...agent.profile,
          id: agent.profile._id.toString(),
          userId: agent.profile.userId.toString(),
        } : null,
      } : null,
    }));
  } catch (error) {
    console.error("Error in GET /orders/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { productName, description, imageUrl, imageUrls, products } = req.body;

    // Support for multiple products in one order
    if (products && Array.isArray(products) && products.length > 0) {
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

      allImageUrls = allImageUrls.slice(0, 9);

      // Upload images to Cloudinary
      const finalImageUrls: string[] = [];
      for (let i = 0; i < allImageUrls.length; i++) {
        const img = allImageUrls[i];
        if (typeof img === "string" && img.startsWith("data:image")) {
          try {
            const uploadResult = await uploadImageToCloudinary(img);
            finalImageUrls.push(uploadResult.url);
          } catch (uploadError: any) {
            console.error(`Image ${i + 1} upload error:`, uploadError.message);
          }
        } else if (typeof img === "string") {
          finalImageUrls.push(img);
        }
      }

      const combinedProductName = products.map((p: any) => p.productName).filter(Boolean).join(", ");
      const combinedDescription = productDescriptions.join("\n\n");

      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        console.error("Invalid user ID:", req.user.id);
        return res.status(400).json({ error: "Invalid user ID" });
      }

      try {
        const order = await Order.create({
          userId: new mongoose.Types.ObjectId(req.user.id),
          productName: combinedProductName || "Олон бараа",
          description: combinedDescription,
          imageUrl: finalImageUrls[0] || undefined,
          imageUrls: finalImageUrls,
          status: "niitlegdsen",
        });

        return res.status(201).json({
          ...order.toObject(),
          id: order._id.toString(),
          userId: order.userId.toString(),
        });
      } catch (createError: any) {
        console.error("Order creation error:", createError);
        throw createError;
      }

      return res.status(201).json({
        ...order.toObject(),
        id: order._id.toString(),
        userId: order.userId.toString(),
      });
    }

    // Single product order
    if (!productName || typeof productName !== "string" || productName.trim().length === 0) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return res.status(400).json({ error: "Description is required" });
    }

    // Handle multiple images (imageUrls array) - max 3 images
    let finalImageUrls: string[] = [];
    if (imageUrls && Array.isArray(imageUrls)) {
      const imagesToProcess = imageUrls.slice(0, 3);
      for (let i = 0; i < imagesToProcess.length; i++) {
        const img = imagesToProcess[i];
        if (typeof img === "string" && img.startsWith("data:image")) {
          try {
            const uploadResult = await uploadImageToCloudinary(img);
            finalImageUrls.push(uploadResult.url);
          } catch (uploadError: any) {
            console.error(`Image ${i + 1} upload error:`, uploadError.message);
          }
        } else if (typeof img === "string") {
          finalImageUrls.push(img);
        }
      }
    }

    // Handle single image (backward compatibility)
    let finalImageUrl: string | undefined = undefined;
    if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImageToCloudinary(imageUrl);
        finalImageUrl = uploadResult.url;
        if (!finalImageUrls.includes(finalImageUrl)) {
          finalImageUrls.push(finalImageUrl);
        }
      } catch (uploadError: any) {
        console.error("Single image upload error:", uploadError.message);
      }
    } else if (imageUrl && typeof imageUrl === "string") {
      finalImageUrl = imageUrl;
      if (!finalImageUrls.includes(finalImageUrl)) {
        finalImageUrls.push(finalImageUrl);
      }
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.error("Invalid user ID:", req.user.id);
      return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
      const order = await Order.create({
        userId: new mongoose.Types.ObjectId(req.user.id),
        productName: productName.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls,
        status: "niitlegdsen",
      });

      res.status(201).json({
        ...order.toObject(),
        id: order._id.toString(),
        userId: order.userId.toString(),
      });
    } catch (createError: any) {
      console.error("Order creation error:", createError);
      throw createError;
    }
  } catch (error: any) {
    console.error("Error in POST /orders:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    const errorMessage = process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ? {
        stack: error.stack,
        code: error.code,
      } : undefined
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga", "tsutsalsan_zahialga"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If agent is picking up the order, set agentId
    const updateData: any = { status };
    if (status === "agent_sudlaj_bn" && req.user.role === "agent" && !order.agentId) {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      updateData.agentId = new mongoose.Types.ObjectId(req.user.id);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).lean();

    res.json({
      ...updatedOrder,
      id: updatedOrder!._id.toString(),
      userId: updatedOrder!.userId.toString(),
      agentId: updatedOrder!.agentId?.toString(),
    });
  } catch (error: any) {
    console.error("Error in PUT /orders/:id/status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Users can only delete their own orders, agents/admins can delete any
    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    await Order.findByIdAndDelete(orderId);

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /orders/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTrackCode = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    const { trackCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { trackCode: trackCode || undefined },
      { new: true }
    ).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      ...order,
      id: order._id.toString(),
      userId: order.userId.toString(),
      agentId: order.agentId?.toString(),
    });
  } catch (error: any) {
    console.error("Error in PUT /orders/:id/track-code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const confirmUserPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Users can only confirm payment for their own orders
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { userPaymentVerified: true },
      { new: true }
    ).lean();

    res.json({
      ...updatedOrder,
      id: updatedOrder!._id.toString(),
      userId: updatedOrder!.userId.toString(),
      agentId: updatedOrder!.agentId?.toString(),
    });
  } catch (error: any) {
    console.error("Error in PUT /orders/:id/user-payment-confirmed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

