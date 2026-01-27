import { BundleOrder } from "../models/BundleOrder";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { checkOrderLimits } from "../utils/orderLimits";
import { OrderStatus } from "../models/Order";
import mongoose from "mongoose";

interface BundleOrderResult {
  order?: any;
  orders?: any[];
  error?: string;
  status?: number;
}

interface DeleteResult {
  success?: boolean;
  error?: string;
  status?: number;
}

interface BundleItemData {
  productName: string;
  description?: string;
  imageUrls?: string[];
}

interface ItemReportData {
  itemId: string;
  userAmount: number;
  paymentLink?: string;
  additionalImages?: string[];
  additionalDescription?: string;
  quantity?: number;
}

interface BundleReportData {
  totalUserAmount: number;
  paymentLink?: string;
  additionalImages?: string[];
  additionalDescription?: string;
}

// Format order for response
const formatOrder = (order: any) => ({
  id: order._id,
  userId: order.userId,
  agentId: order.agentId,
  userSnapshot: order.userSnapshot,
  items: order.items.map((item: any) => ({
    id: item._id,
    productName: item.productName,
    description: item.description,
    imageUrls: item.imageUrls,
    status: item.status,
    agentReport: item.report,
  })),
  status: order.status,
  userPaymentVerified: order.userPaymentVerified,
  agentPaymentPaid: order.agentPaymentPaid,
  trackCode: order.trackCode,
  reportMode: order.reportMode,
  bundleReport: order.bundleReport,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

class BundleOrderService {
  /**
   * Get all bundle orders based on user role
   */
  async getOrders(userId: string, role: string): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      let query = {};

      if (role === "user") {
        query = { userId: user._id };
      } else if (role === "agent") {
        query = {
          $or: [
            { agentId: user._id },
            { agentId: null, status: "niitlegdsen" },
          ],
        };
      }
      // Admin sees all orders

      const orders = await BundleOrder.find(query)
        .populate("userId", "email")
        .populate("agentId", "email")
        .sort({ createdAt: -1 });

      const formattedOrders = orders.map(formatOrder);

      return { orders: formattedOrders };
    } catch (error) {
      console.error("Error getting bundle orders:", error);
      return { error: "Failed to get bundle orders", status: 500 };
    }
  }

  /**
   * Get single bundle order by ID
   */
  async getOrder(orderId: string): Promise<BundleOrderResult> {
    try {
      const order = await BundleOrder.findById(orderId)
        .populate("userId", "email")
        .populate("agentId", "email");

      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      return { order: formatOrder(order) };
    } catch (error) {
      console.error("Error getting bundle order:", error);
      return { error: "Failed to get bundle order", status: 500 };
    }
  }

  /**
   * Create new bundle order
   */
  async createOrder(
    userId: string,
    role: string,
    items: BundleItemData[]
  ): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      // Check order limits for users only
      if (role === "user") {
        const limitCheck = await checkOrderLimits(userId);
        if (!limitCheck.allowed) {
          return { error: limitCheck.reason, status: 429 };
        }
      }

      // Get user profile for snapshot
      const profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        return { error: "Profile not found. Please create a profile first.", status: 400 };
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return { error: "At least one item is required", status: 400 };
      }

      // Validate each item
      for (const item of items) {
        if (!item.productName || typeof item.productName !== "string" || item.productName.trim().length === 0) {
          return { error: "Бараа бүр нэртэй байх ёстой", status: 400 };
        }
      }

      const order = await BundleOrder.create({
        userId: user._id,
        userSnapshot: {
          name: profile.name,
          phone: profile.phone,
          cargo: profile.cargo || "",
        },
        items: items.map((item) => ({
          productName: item.productName,
          description: item.description,
          imageUrls: item.imageUrls || [],
          status: "niitlegdsen",
        })),
        status: "niitlegdsen",
      });

      return {
        order: {
          id: order._id,
          userId: order.userId,
          userSnapshot: order.userSnapshot,
          items: order.items.map((item: any) => ({
            id: item._id,
            productName: item.productName,
            description: item.description,
            imageUrls: item.imageUrls,
            status: item.status,
          })),
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      };
    } catch (error) {
      console.error("Error creating bundle order:", error);
      return { error: "Failed to create bundle order", status: 500 };
    }
  }

  /**
   * Update bundle order status
   */
  async updateOrderStatus(
    orderId: string,
    userId: string,
    role: string,
    status: OrderStatus
  ): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Assign agent if status is being changed by agent
      if (role === "agent" && !order.agentId) {
        order.agentId = user._id as mongoose.Types.ObjectId;
      }

      order.status = status;
      await order.save();

      return {
        order: {
          id: order._id,
          status: order.status,
          agentId: order.agentId,
        },
      };
    } catch (error) {
      console.error("Error updating bundle order status:", error);
      return { error: "Failed to update bundle order status", status: 500 };
    }
  }

  /**
   * Update bundle item status
   */
  async updateItemStatus(
    orderId: string,
    itemId: string,
    userId: string,
    role: string,
    status: OrderStatus
  ): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      const item = order.items.id(itemId);
      if (!item) {
        return { error: "Item not found", status: 404 };
      }

      // Assign agent if not assigned
      if (role === "agent" && !order.agentId) {
        order.agentId = user._id as mongoose.Types.ObjectId;
      }

      item.status = status;
      await order.save();

      return {
        order: {
          id: order._id,
          items: order.items.map((i: any) => ({
            id: i._id,
            status: i.status,
          })),
        },
      };
    } catch (error) {
      console.error("Error updating bundle item status:", error);
      return { error: "Failed to update item status", status: 500 };
    }
  }

  /**
   * Create bundle item report
   */
  async createItemReport(
    orderId: string,
    itemId: string,
    userId: string,
    reportData: {
      userAmount: number;
      paymentLink?: string;
      additionalImages?: string[];
      additionalDescription?: string;
      quantity?: number;
    }
  ): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      const item = order.items.id(itemId);
      if (!item) {
        return { error: "Item not found", status: 404 };
      }

      item.report = {
        userAmount: reportData.userAmount,
        paymentLink: reportData.paymentLink,
        additionalImages: reportData.additionalImages,
        additionalDescription: reportData.additionalDescription,
        quantity: reportData.quantity,
      };
      item.status = "tolbor_huleej_bn";

      // Check if all items have reports, update bundle status
      const allItemsHaveReports = order.items.every((i: any) => i.report);
      if (allItemsHaveReports) {
        order.status = "tolbor_huleej_bn";
      }

      await order.save();

      return {
        order: {
          id: order._id,
          status: order.status,
          items: order.items.map((i: any) => ({
            id: i._id,
            status: i.status,
            report: i.report,
          })),
        },
      };
    } catch (error) {
      console.error("Error creating bundle item report:", error);
      return { error: "Failed to create item report", status: 500 };
    }
  }

  /**
   * Create bundle report (single or per-item mode)
   */
  async createBundleReport(
    orderId: string,
    userId: string,
    role: string,
    reportMode: "single" | "per_item",
    bundleReport?: BundleReportData,
    itemReports?: ItemReportData[]
  ): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      // Only agents and admins can create reports
      if (role !== "agent" && role !== "admin") {
        return { error: "Not authorized", status: 403 };
      }

      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Assign agent if not assigned
      if (role === "agent" && !order.agentId) {
        order.agentId = user._id as mongoose.Types.ObjectId;
      }

      if (reportMode === "single") {
        // Single report for whole bundle
        if (!bundleReport || typeof bundleReport.totalUserAmount !== "number") {
          return { error: "totalUserAmount is required for single mode", status: 400 };
        }

        order.reportMode = "single";
        order.bundleReport = {
          totalUserAmount: bundleReport.totalUserAmount,
          paymentLink: bundleReport.paymentLink,
          additionalImages: bundleReport.additionalImages || [],
          additionalDescription: bundleReport.additionalDescription,
        };

        // Update all items status to tolbor_huleej_bn
        order.items.forEach((item: any) => {
          item.status = "tolbor_huleej_bn";
        });
        order.status = "tolbor_huleej_bn";

      } else if (reportMode === "per_item") {
        // Per-item reports
        if (!itemReports || !Array.isArray(itemReports) || itemReports.length === 0) {
          return { error: "itemReports is required for per_item mode", status: 400 };
        }

        order.reportMode = "per_item";
        order.bundleReport = undefined;

        // Update each item's report
        for (const itemReport of itemReports) {
          const item = order.items.id(itemReport.itemId);
          if (item) {
            item.report = {
              userAmount: itemReport.userAmount,
              paymentLink: itemReport.paymentLink,
              additionalImages: itemReport.additionalImages || [],
              additionalDescription: itemReport.additionalDescription,
              quantity: itemReport.quantity,
            };
            item.status = "tolbor_huleej_bn";
          }
        }

        // Check if all items have reports
        const allItemsHaveReports = order.items.every((i: any) => i.report);
        if (allItemsHaveReports) {
          order.status = "tolbor_huleej_bn";
        }

      } else {
        return { error: "reportMode must be 'single' or 'per_item'", status: 400 };
      }

      await order.save();

      return {
        order: {
          id: order._id,
          status: order.status,
          reportMode: order.reportMode,
          bundleReport: order.bundleReport,
          items: order.items.map((item: any) => ({
            id: item._id,
            productName: item.productName,
            status: item.status,
            report: item.report,
          })),
        },
      };
    } catch (error) {
      console.error("Error creating bundle report:", error);
      return { error: "Failed to create bundle report", status: 500 };
    }
  }

  /**
   * Update track code
   */
  async updateTrackCode(orderId: string, trackCode: string): Promise<BundleOrderResult> {
    try {
      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      order.trackCode = trackCode;
      await order.save();

      return {
        order: {
          id: order._id,
          trackCode: order.trackCode,
        },
      };
    } catch (error) {
      console.error("Error updating track code:", error);
      return { error: "Failed to update track code", status: 500 };
    }
  }

  /**
   * User confirms payment for bundle order
   */
  async confirmPayment(orderId: string, userId: string): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Only allow the order owner to confirm payment
      if (order.userId.toString() !== user._id.toString()) {
        return { error: "Not authorized to confirm payment for this order", status: 403 };
      }

      // Only allow confirmation when status is "tolbor_huleej_bn"
      if (order.status !== "tolbor_huleej_bn") {
        return { error: "Order is not awaiting payment", status: 400 };
      }

      order.userPaymentVerified = true;
      await order.save();

      return {
        order: {
          id: order._id,
          userPaymentVerified: order.userPaymentVerified,
          status: order.status,
        },
      };
    } catch (error) {
      console.error("Error confirming payment:", error);
      return { error: "Failed to confirm payment", status: 500 };
    }
  }

  /**
   * User cancels bundle order
   */
  async cancelOrder(orderId: string, userId: string): Promise<BundleOrderResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Only allow the order owner to cancel
      if (order.userId.toString() !== user._id.toString()) {
        return { error: "Not authorized to cancel this order", status: 403 };
      }

      // Only allow cancellation when status is "tolbor_huleej_bn" and payment not verified
      if (order.status !== "tolbor_huleej_bn" || order.userPaymentVerified) {
        return { error: "Order cannot be cancelled at this stage", status: 400 };
      }

      order.status = "tsutsalsan_zahialga";
      // Update all items status too
      order.items.forEach((item: any) => {
        item.status = "tsutsalsan_zahialga";
      });
      await order.save();

      return {
        order: {
          id: order._id,
          status: order.status,
        },
      };
    } catch (error) {
      console.error("Error cancelling order:", error);
      return { error: "Failed to cancel order", status: 500 };
    }
  }

  /**
   * Delete bundle order
   */
  async deleteOrder(orderId: string, userId: string, role: string): Promise<DeleteResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Only allow deletion by owner or admin
      if (role !== "admin" && order.userId.toString() !== user._id.toString()) {
        return { error: "Not authorized to delete this order", status: 403 };
      }

      await BundleOrder.findByIdAndDelete(orderId);

      return { success: true };
    } catch (error) {
      console.error("Error deleting bundle order:", error);
      return { error: "Failed to delete bundle order", status: 500 };
    }
  }
}

export const bundleOrderService = new BundleOrderService();
