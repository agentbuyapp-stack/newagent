import { Request, Response } from "express";
import { Message, Order } from "../models";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";

export const getMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Check if user has access to this order
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // User can only see messages for their own orders, agents/admins can see all
    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const messages = await Message.find({
      orderId: new mongoose.Types.ObjectId(orderId)
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages.map(msg => ({
      ...msg,
      id: msg._id.toString(),
      orderId: msg.orderId.toString(),
    })));
  } catch (error: any) {
    console.error("Error in GET /orders/:id/messages:", error);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    let { text, imageUrl } = req.body;

    if (!text && !imageUrl) {
      return res.status(400).json({ error: "Text or image is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Check if user has access to this order
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // User can only send messages for their own orders
    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      // Extract userId from order - handle both ObjectId and populated object
      let orderUserId: string = '';
      if (typeof order.userId === 'string') {
        orderUserId = order.userId;
      } else if (order.userId._id) {
        orderUserId = order.userId._id.toString();
      } else if (order.userId.id) {
        orderUserId = order.userId.id.toString();
      } else {
        orderUserId = order.userId.toString();
      }

      if (orderUserId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    // If agent is sending message, ensure they can access this order
    if (req.user.role === "agent") {
      // Extract agentId from order - handle both ObjectId and populated object
      let orderAgentId: string | null = null;
      if (order.agentId) {
        if (typeof order.agentId === 'string') {
          orderAgentId = order.agentId;
        } else if (order.agentId._id) {
          orderAgentId = order.agentId._id.toString();
        } else if (order.agentId.id) {
          orderAgentId = order.agentId.id.toString();
        } else if (order.agentId.toString) {
          orderAgentId = order.agentId.toString();
        } else {
          orderAgentId = String(order.agentId);
        }
      }

      // Agent can send message if:
      // 1. Order has no agent assigned (open order - status = "niitlegdsen")
      // 2. Order is assigned to this agent
      if (orderAgentId && orderAgentId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: You can only send messages to orders assigned to you" });
      }
    }

    // Upload image if provided as base64
    if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImageToCloudinary(imageUrl);
        imageUrl = uploadResult.url;
      } catch (uploadError: any) {
        console.error("Image upload error:", uploadError.message);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    // senderId is stored as String in Message schema
    const senderId = String(req.user.id);

    const message = await Message.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      senderId: senderId,
      text: text || undefined,
      imageUrl: imageUrl || undefined,
    });

    res.status(201).json({
      ...message.toObject(),
      id: message._id.toString(),
      orderId: message.orderId.toString(),
      senderId: message.senderId,
    });
  } catch (error: any) {
    console.error("Error in POST /orders/:id/messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

