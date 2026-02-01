import { Request, Response } from "express";
import { Message, Order, BundleOrder, Profile } from "../models";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";
import { emitNewVoiceMessage } from "../lib/socket";
import { sendChatNotificationEmail } from "../services/emailService";

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    // Check if user has access to this order (try Order first, then BundleOrder)
    let order: { userId: mongoose.Types.ObjectId; agentId?: mongoose.Types.ObjectId } | null = await Order.findById(orderId).lean();

    if (!order) {
      // Try finding as BundleOrder
      order = await BundleOrder.findById(orderId).lean();
    }

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // User can only see messages for their own orders, agents/admins can see all
    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      if (order.userId.toString() !== req.user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
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

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const orderId = req.params.id;
    let { text, imageUrl, audioUrl, audioDuration } = req.body;

    if (!text && !imageUrl && !audioUrl) {
      res.status(400).json({ error: "Text, image, or audio is required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    // Check if user has access to this order (try Order first, then BundleOrder)
    let order: { userId: any; agentId?: any; status?: string } | null = await Order.findById(orderId).lean();

    if (!order) {
      // Try finding as BundleOrder
      order = await BundleOrder.findById(orderId).lean();
    }

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // User can only send messages for their own orders
    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
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
        res.status(403).json({ error: "Forbidden" });
        return;
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
        res.status(403).json({ error: "Forbidden: You can only send messages to orders assigned to you" });
        return;
      }
    }

    // Upload image if provided as base64
    if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImageToCloudinary(imageUrl);
        imageUrl = uploadResult.url;
      } catch (uploadError: any) {
        console.error("Image upload error:", uploadError.message);
        res.status(500).json({ error: "Failed to upload image" });
        return;
      }
    }

    // senderId is stored as String in Message schema
    const senderId = String(req.user.id);

    const message = await Message.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      senderId: senderId,
      text: text || undefined,
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      audioDuration: audioDuration || undefined,
    });

    // Emit socket event for voice messages
    if (audioUrl) {
      // Determine recipient: if sender is user -> agent, if sender is agent/admin -> user
      let recipientId: string | null = null;

      // Extract userId from order
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

      // Extract agentId from order
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

      if (req.user!.role === "user") {
        // User sent voice -> notify agent
        recipientId = orderAgentId;
      } else {
        // Agent/Admin sent voice -> notify user
        recipientId = orderUserId;
      }

      if (recipientId) {
        emitNewVoiceMessage(recipientId, orderId, {
          audioUrl: audioUrl,
          audioDuration: audioDuration,
          senderId: senderId,
          createdAt: message.createdAt.toISOString(),
        });
      }
    }

    // Send email notification for chat messages (text/image) with 30-min rate limiting
    // Run async, don't wait for response
    (async () => {
      try {
        // Extract userId from order
        let orderUserId: string = '';
        if (typeof order!.userId === 'string') {
          orderUserId = order!.userId;
        } else if (order!.userId._id) {
          orderUserId = order!.userId._id.toString();
        } else if (order!.userId.id) {
          orderUserId = order!.userId.id.toString();
        } else {
          orderUserId = order!.userId.toString();
        }

        // Extract agentId from order
        let orderAgentId: string | null = null;
        if (order!.agentId) {
          if (typeof order!.agentId === 'string') {
            orderAgentId = order!.agentId;
          } else if (order!.agentId._id) {
            orderAgentId = order!.agentId._id.toString();
          } else if (order!.agentId.id) {
            orderAgentId = order!.agentId.id.toString();
          } else if (order!.agentId.toString) {
            orderAgentId = order!.agentId.toString();
          } else {
            orderAgentId = String(order!.agentId);
          }
        }

        // Determine recipient
        let recipientId: string | null = null;
        if (req.user!.role === "user") {
          // User sent message -> notify agent
          recipientId = orderAgentId;
        } else {
          // Agent/Admin sent message -> notify user
          recipientId = orderUserId;
        }

        if (!recipientId) {
          return; // No recipient to notify
        }

        // Get sender's name from Profile
        const senderProfile = await Profile.findOne({ userId: senderId }).lean();
        const senderName = senderProfile?.name || "Хэрэглэгч";

        // Get product name from order
        const fullOrder = await Order.findById(orderId).lean() || await BundleOrder.findById(orderId).lean();
        const productName = (fullOrder as any)?.productName || (fullOrder as any)?.items?.[0]?.productName || "Захиалга";

        // Send email notification with 30-min rate limiting
        await sendChatNotificationEmail(
          orderId,
          recipientId,
          req.user!.role as "user" | "agent" | "admin",
          senderName,
          productName
        );
      } catch (emailError) {
        console.error("Chat notification email error:", emailError);
      }
    })();

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

export const getLatestVoiceMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    // Check if user has access to this order (try Order first, then BundleOrder)
    let order: { userId: any; agentId?: any } | null = await Order.findById(orderId).lean();

    if (!order) {
      order = await BundleOrder.findById(orderId).lean();
    }

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Extract userId and agentId from order
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

    // Check access
    if (req.user.role === "user") {
      if (orderUserId !== req.user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    } else if (req.user.role === "agent") {
      // Agent can access if they are assigned or it's an open order
      if (orderAgentId && orderAgentId !== req.user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    // Determine the other party's ID
    // If current user is the order owner -> get agent's voice
    // If current user is agent -> get user's voice
    let otherPartyId: string | null = null;

    if (req.user.id === orderUserId) {
      // Current user is the order owner, get agent's latest voice
      otherPartyId = orderAgentId;
    } else if (req.user.role === "agent" || req.user.role === "admin") {
      // Current user is agent/admin, get user's latest voice
      otherPartyId = orderUserId;
    }

    if (!otherPartyId) {
      // No other party (e.g., no agent assigned yet)
      res.json(null);
      return;
    }

    // Find the latest voice message from the other party
    const latestVoice = await Message.findOne({
      orderId: new mongoose.Types.ObjectId(orderId),
      senderId: otherPartyId,
      audioUrl: { $exists: true, $ne: null }
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestVoice) {
      res.json(null);
      return;
    }

    res.json({
      audioUrl: latestVoice.audioUrl,
      audioDuration: latestVoice.audioDuration,
      senderId: latestVoice.senderId,
      createdAt: latestVoice.createdAt,
    });
  } catch (error: any) {
    console.error("Error in GET /orders/:id/latest-voice:", error);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
