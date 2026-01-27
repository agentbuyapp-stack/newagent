import mongoose from "mongoose";
import { Order, User, Profile } from "../models";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import { checkOrderLimits } from "../utils/orderLimits";
import {
  notifyAgentsNewOrder,
  markOrderAssigned,
  notifyUserAgentCancelled,
  notifyUserAdminCancelled,
  notifyUserTrackCodeAdded,
  notifyAdminPaymentRequest,
} from "./notificationService";

// Types
export interface OrderUser {
  _id: mongoose.Types.ObjectId;
  id: string;
  email: string;
  role: string;
  isApproved: boolean;
  agentPoints: number;
  profile: OrderProfile | null;
}

export interface OrderProfile {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  cargo?: string;
}

export interface FormattedOrder {
  id: string;
  userId: string;
  agentId?: string;
  productName: string;
  description: string;
  status: string;
  imageUrl?: string;
  imageUrls?: string[];
  trackCode?: string;
  cancelReason?: string;
  userPaymentVerified?: boolean;
  archivedByUser?: boolean;
  archivedByAgent?: boolean;
  user: OrderUser | null;
  agent: OrderUser | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  productName?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  products?: Array<{
    productName: string;
    description: string;
    imageUrls?: string[];
  }>;
}

// Helper: Extract user ID from populated or ObjectId
const extractUserId = (userId: any): string | null => {
  if (!userId) return null;
  if (typeof userId === "string") return userId;
  if (userId._id) return userId._id.toString();
  if (userId.toString) return userId.toString();
  return null;
};

// Helper: Format order with user/agent data
export const formatOrder = (order: any): FormattedOrder => {
  try {
    let agentId: string | undefined = undefined;
    if (order.agentId) {
      if (typeof order.agentId === "string") {
        agentId = order.agentId;
      } else if (order.agentId._id) {
        agentId = order.agentId._id.toString();
      } else if (order.agentId.toString) {
        agentId = order.agentId.toString();
      }
    }

    let userId: string | undefined = undefined;
    if (order.userId) {
      if (typeof order.userId === "string") {
        userId = order.userId;
      } else if (order.userId._id) {
        userId = order.userId._id.toString();
      } else if (order.userId.toString) {
        userId = order.userId.toString();
      }
    }

    return {
      ...order,
      id: order._id?.toString() || order.id,
      userId: userId || order.userId,
      agentId: agentId || order.agentId,
      user: order.user
        ? {
            ...order.user,
            id: order.user._id?.toString() || order.user.id,
            profile: order.user.profile
              ? {
                  ...order.user.profile,
                  id: order.user.profile._id?.toString(),
                  userId: order.user.profile.userId?.toString(),
                }
              : null,
          }
        : null,
      agent: order.agent
        ? {
            ...order.agent,
            id: order.agent._id?.toString() || order.agent.id,
            profile: order.agent.profile
              ? {
                  ...order.agent.profile,
                  id: order.agent.profile._id?.toString(),
                  userId: order.agent.profile.userId?.toString(),
                }
              : null,
          }
        : null,
    };
  } catch (error) {
    console.error("Error formatting order:", error);
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

// Build user/agent objects with profiles
const buildUserObject = (
  userId: string,
  populatedUser: any,
  profile: any
): OrderUser => {
  if (populatedUser && populatedUser._id) {
    return {
      _id: populatedUser._id,
      id: populatedUser._id.toString(),
      email: populatedUser.email || "",
      role: populatedUser.role || "user",
      isApproved: populatedUser.isApproved || false,
      agentPoints: populatedUser.agentPoints || 0,
      profile: profile
        ? {
            ...profile,
            id: profile._id.toString(),
            userId: profile.userId.toString(),
          }
        : null,
    };
  }
  return {
    _id: new mongoose.Types.ObjectId(userId),
    id: userId,
    email: "",
    role: "user",
    isApproved: false,
    agentPoints: 0,
    profile: profile
      ? {
          ...profile,
          id: profile._id.toString(),
          userId: profile.userId.toString(),
        }
      : null,
  };
};

export class OrderService {
  /**
   * Get orders based on user role
   */
  async getOrders(
    userId: string,
    role: string
  ): Promise<{ orders: FormattedOrder[]; error?: string }> {
    try {
      let query: any = {};

      if (role === "user") {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return { orders: [], error: "Invalid user ID" };
        }
        query.userId = new mongoose.Types.ObjectId(userId);
      } else if (role === "agent") {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return { orders: [], error: "Invalid user ID" };
        }
        const agentObjectId = new mongoose.Types.ObjectId(userId);
        query.$or = [
          { status: "niitlegdsen", agentId: null },
          { status: "niitlegdsen", agentId: { $exists: false } },
          { agentId: agentObjectId },
        ];
      }
      // Admins see all orders

      const orders = await Order.find(query)
        .populate("userId", null, User)
        .populate("agentId", null, User)
        .sort({ createdAt: -1 })
        .lean();

      // Get profiles
      const userIds = [
        ...new Set(orders.map((o) => extractUserId(o.userId)).filter(Boolean)),
      ] as string[];
      const agentIds = [
        ...new Set(orders.map((o) => extractUserId(o.agentId)).filter(Boolean)),
      ] as string[];
      const allUserIds = [...new Set([...userIds, ...agentIds])];

      const profiles =
        allUserIds.length > 0
          ? await Profile.find({
              userId: {
                $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)),
              },
            }).lean()
          : [];
      const profileMap = new Map(
        profiles.map((p) => [p.userId.toString(), p])
      );

      // Format orders
      const formattedOrders = orders.map((order) => {
        const userIdStr = extractUserId(order.userId);
        const agentIdStr = extractUserId(order.agentId);

        const user = userIdStr
          ? buildUserObject(
              userIdStr,
              typeof order.userId === "object" ? order.userId : null,
              profileMap.get(userIdStr)
            )
          : null;

        const agent = agentIdStr
          ? buildUserObject(
              agentIdStr,
              typeof order.agentId === "object" ? order.agentId : null,
              profileMap.get(agentIdStr)
            )
          : null;

        return formatOrder({ ...order, user, agent });
      });

      return { orders: formattedOrders };
    } catch (error: any) {
      console.error("OrderService.getOrders error:", error);
      return { orders: [], error: error.message };
    }
  }

  /**
   * Get single order by ID
   */
  async getOrder(
    orderId: string,
    userId: string,
    role: string
  ): Promise<{ order?: FormattedOrder; error?: string; status?: number }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      let query: any = { _id: new mongoose.Types.ObjectId(orderId) };

      if (role === "user") {
        query.userId = new mongoose.Types.ObjectId(userId);
      } else if (role === "agent") {
        const agentObjectId = new mongoose.Types.ObjectId(userId);
        const orderObjectId = new mongoose.Types.ObjectId(orderId);
        query.$or = [
          { _id: orderObjectId, status: "niitlegdsen", agentId: null },
          {
            _id: orderObjectId,
            status: "niitlegdsen",
            agentId: { $exists: false },
          },
          { _id: orderObjectId, agentId: agentObjectId },
        ];
      }

      const order = await Order.findOne(query)
        .populate("userId", null, User)
        .populate("agentId", null, User)
        .lean();

      if (!order) {
        return { error: "Order not found", status: 404 };
      }

      // Get profiles
      const orderUserId = extractUserId(order.userId);
      const orderAgentId = extractUserId(order.agentId);
      const allUserIds = [orderUserId, orderAgentId].filter(Boolean) as string[];

      const profiles = await Profile.find({
        userId: { $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)) },
      }).lean();
      const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

      const user = orderUserId
        ? buildUserObject(
            orderUserId,
            typeof order.userId === "object" ? order.userId : null,
            profileMap.get(orderUserId)
          )
        : null;

      const agent = orderAgentId
        ? buildUserObject(
            orderAgentId,
            typeof order.agentId === "object" ? order.agentId : null,
            profileMap.get(orderAgentId)
          )
        : null;

      return { order: formatOrder({ ...order, user, agent }) };
    } catch (error: any) {
      console.error("OrderService.getOrder error:", error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Create new order
   */
  async createOrder(
    userId: string,
    role: string,
    input: CreateOrderInput
  ): Promise<{ order?: FormattedOrder; error?: string; status?: number }> {
    try {
      // Check order limits for users
      if (role === "user") {
        const limitCheck = await checkOrderLimits(userId);
        if (!limitCheck.allowed) {
          return { error: limitCheck.reason, status: 429 };
        }
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return { error: "Invalid user ID", status: 400 };
      }

      const { productName, description, imageUrl, imageUrls, products } = input;

      // Handle multiple products
      if (products && Array.isArray(products) && products.length > 0) {
        return await this.createMultiProductOrder(userId, products);
      }

      // Single product order
      if (!productName?.trim()) {
        return { error: "Product name is required", status: 400 };
      }
      if (!description?.trim()) {
        return { error: "Description is required", status: 400 };
      }

      // Upload images
      const finalImageUrls = await this.processImages(imageUrls || [], imageUrl);

      const order = await Order.create({
        userId: new mongoose.Types.ObjectId(userId),
        productName: productName.trim(),
        description: description.trim(),
        imageUrl: finalImageUrls[0],
        imageUrls: finalImageUrls,
        status: "niitlegdsen",
      });

      // Notify agents
      notifyAgentsNewOrder(order._id, order.productName, 0, 1).catch((err) =>
        console.error("Failed to notify agents:", err)
      );

      return {
        order: formatOrder({
          ...order.toObject(),
          user: null,
          agent: null,
        }),
      };
    } catch (error: any) {
      console.error("OrderService.createOrder error:", error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Create order with multiple products
   */
  private async createMultiProductOrder(
    userId: string,
    products: Array<{ productName: string; description: string; imageUrls?: string[] }>
  ): Promise<{ order?: FormattedOrder; error?: string; status?: number }> {
    // Validate products
    for (const product of products) {
      if (!product.productName?.trim()) {
        return { error: "Бараа бүр нэртэй байх ёстой", status: 400 };
      }
      if (!product.description?.trim()) {
        return { error: "Бараа бүр тайлбартай байх ёстой", status: 400 };
      }
    }

    // Collect all images
    let allImageUrls: string[] = [];
    const productDescriptions: string[] = [];

    for (const product of products) {
      productDescriptions.push(`${product.productName}: ${product.description}`);
      if (product.imageUrls) {
        allImageUrls = [...allImageUrls, ...product.imageUrls.slice(0, 3)];
      }
    }

    allImageUrls = allImageUrls.slice(0, 9);
    const finalImageUrls = await this.processImages(allImageUrls);

    const combinedProductName = products.map((p) => p.productName).join(", ");
    const combinedDescription = productDescriptions.join("\n\n");

    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(userId),
      productName: combinedProductName || "Олон бараа",
      description: combinedDescription,
      imageUrl: finalImageUrls[0],
      imageUrls: finalImageUrls,
      status: "niitlegdsen",
    });

    notifyAgentsNewOrder(order._id, order.productName, 0, 1).catch((err) =>
      console.error("Failed to notify agents:", err)
    );

    return {
      order: formatOrder({
        ...order.toObject(),
        user: null,
        agent: null,
      }),
    };
  }

  /**
   * Process and upload images
   */
  private async processImages(
    imageUrls: string[],
    singleImageUrl?: string
  ): Promise<string[]> {
    const finalUrls: string[] = [];

    for (const img of imageUrls.slice(0, 3)) {
      if (typeof img === "string" && img.startsWith("data:image")) {
        try {
          const result = await uploadImageToCloudinary(img);
          finalUrls.push(result.url);
        } catch (error) {
          console.error("Image upload error:", error);
        }
      } else if (typeof img === "string") {
        finalUrls.push(img);
      }
    }

    if (singleImageUrl) {
      if (singleImageUrl.startsWith("data:image")) {
        try {
          const result = await uploadImageToCloudinary(singleImageUrl);
          if (!finalUrls.includes(result.url)) {
            finalUrls.push(result.url);
          }
        } catch (error) {
          console.error("Single image upload error:", error);
        }
      } else if (!finalUrls.includes(singleImageUrl)) {
        finalUrls.push(singleImageUrl);
      }
    }

    return finalUrls;
  }

  /**
   * Update order status
   */
  async updateStatus(
    orderId: string,
    userId: string,
    role: string,
    status: string,
    cancelReason?: string
  ): Promise<{ order?: FormattedOrder; error?: string; status?: number }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      const validStatuses = [
        "niitlegdsen",
        "agent_sudlaj_bn",
        "tolbor_huleej_bn",
        "amjilttai_zahialga",
        "tsutsalsan_zahialga",
      ];
      if (!validStatuses.includes(status)) {
        return { error: "Invalid status", status: 400 };
      }

      // Require cancel reason for agents
      if (status === "tsutsalsan_zahialga" && role === "agent") {
        if (!cancelReason || cancelReason.trim().length < 5) {
          return { error: "Cancel reason is required (minimum 5 characters)", status: 400 };
        }
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return { error: "Order not found", status: 404 };
      }

      const updateData: any = { status };

      // Assign agent if picking up
      if (status === "agent_sudlaj_bn" && role === "agent" && !order.agentId) {
        updateData.agentId = new mongoose.Types.ObjectId(userId);
      }

      if (status === "tsutsalsan_zahialga" && cancelReason) {
        updateData.cancelReason = cancelReason.trim();
      }

      const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
        new: true,
      }).lean();

      // Handle notifications
      if (status === "agent_sudlaj_bn" && updateData.agentId) {
        markOrderAssigned(
          new mongoose.Types.ObjectId(orderId),
          updateData.agentId
        ).catch((err) => console.error("Failed to mark order assigned:", err));
      }

      if (status === "tsutsalsan_zahialga" && role === "agent") {
        notifyUserAgentCancelled(
          order.userId,
          new mongoose.Types.ObjectId(orderId),
          order.productName,
          cancelReason
        ).catch((err) => console.error("Failed to notify user:", err));
      }

      if (status === "tsutsalsan_zahialga" && role === "admin") {
        notifyUserAdminCancelled(
          order.userId,
          new mongoose.Types.ObjectId(orderId),
          order.productName
        ).catch((err) => console.error("Failed to notify user:", err));
      }

      return {
        order: formatOrder({
          ...updatedOrder,
          user: null,
          agent: null,
        }),
      };
    } catch (error: any) {
      console.error("OrderService.updateStatus error:", error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Update track code
   */
  async updateTrackCode(
    orderId: string,
    trackCode: string
  ): Promise<{ order?: FormattedOrder; error?: string; status?: number }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      const existingOrder = await Order.findById(orderId).lean();
      if (!existingOrder) {
        return { error: "Order not found", status: 404 };
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { trackCode: trackCode || undefined },
        { new: true }
      ).lean();

      if (trackCode && order) {
        notifyUserTrackCodeAdded(
          existingOrder.userId,
          new mongoose.Types.ObjectId(orderId),
          existingOrder.productName,
          trackCode
        ).catch((err) => console.error("Failed to notify user:", err));
      }

      return {
        order: formatOrder({
          ...order,
          user: null,
          agent: null,
        }),
      };
    } catch (error: any) {
      console.error("OrderService.updateTrackCode error:", error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(
    orderId: string,
    userId: string,
    role: string
  ): Promise<{ success?: boolean; error?: string; status?: number }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return { error: "Order not found", status: 404 };
      }

      // Users can only delete their own orders
      if (role === "user" && order.userId.toString() !== userId) {
        return { error: "Forbidden", status: 403 };
      }

      await Order.findByIdAndDelete(orderId);
      return { success: true };
    } catch (error: any) {
      console.error("OrderService.deleteOrder error:", error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Archive order
   */
  async archiveOrder(
    orderId: string,
    userId: string,
    role: string
  ): Promise<{ order?: FormattedOrder; error?: string; status?: number }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return { error: "Order not found", status: 404 };
      }

      const updateData: any = {};

      if (role === "user") {
        if (order.userId.toString() !== userId) {
          return { error: "Forbidden", status: 403 };
        }
        updateData.archivedByUser = true;
      }

      if (role === "agent") {
        if (!order.agentId || order.agentId.toString() !== userId) {
          return { error: "Forbidden", status: 403 };
        }
        updateData.archivedByAgent = true;
      }

      if (role === "admin") {
        updateData.archivedByUser = true;
        updateData.archivedByAgent = true;
      }

      const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
        new: true,
      }).lean();

      return {
        order: formatOrder({
          ...updatedOrder,
          user: null,
          agent: null,
        }),
      };
    } catch (error: any) {
      console.error("OrderService.archiveOrder error:", error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Confirm user payment
   */
  async confirmPayment(
    orderId: string,
    userId: string
  ): Promise<{ order?: FormattedOrder; error?: string; status?: number }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return { error: "Order not found", status: 404 };
      }

      if (order.userId.toString() !== userId) {
        return { error: "Forbidden", status: 403 };
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { userPaymentVerified: true },
        { new: true }
      ).lean();

      // Notify admin
      const profile = await Profile.findOne({ userId }).lean();
      const userName = profile?.name || "Хэрэглэгч";
      notifyAdminPaymentRequest(
        new mongoose.Types.ObjectId(orderId),
        order.productName,
        userName
      ).catch((err) => console.error("Failed to notify admin:", err));

      return {
        order: formatOrder({
          ...updatedOrder,
          user: null,
          agent: null,
        }),
      };
    } catch (error: any) {
      console.error("OrderService.confirmPayment error:", error);
      return { error: error.message, status: 500 };
    }
  }
}

// Export singleton instance
export const orderService = new OrderService();
