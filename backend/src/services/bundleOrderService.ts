import { BundleOrder } from "../models/BundleOrder";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { checkOrderLimits } from "../utils/orderLimits";
import { OrderStatus } from "../models/Order";
import mongoose from "mongoose";
import { cardService } from "./cardService";

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
  async getOrder(orderId: string, userId: string, role: string): Promise<BundleOrderResult> {
    try {
      const order = await BundleOrder.findById(orderId)
        .populate("userId", "email")
        .populate("agentId", "email");

      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Check authorization based on role
      if (role === "user") {
        // Users can only view their own orders
        if (order.userId._id.toString() !== userId) {
          return { error: "Bundle order not found", status: 404 };
        }
      } else if (role === "agent") {
        // Agents can view: their assigned orders OR unassigned orders with status "niitlegdsen"
        const isAssigned = order.agentId && order.agentId._id.toString() === userId;
        const isAvailable = !order.agentId && order.status === "niitlegdsen";
        if (!isAssigned && !isAvailable) {
          return { error: "Bundle order not found", status: 404 };
        }
      }
      // Admins can view all orders

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

        // Check if user has enough cards for all items (1 card per item)
        const hasEnoughCards = await cardService.hasEnoughCards(userId, role, items.length);
        if (!hasEnoughCards) {
          return { error: `Судалгааны карт хүрэлцэхгүй байна. ${items.length} бараанд ${items.length} карт шаардлагатай.`, status: 400 };
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

      // Deduct cards for users after successful order creation (1 card per item)
      if (role === "user") {
        await cardService.deductCardsForBundleOrder(userId, order._id.toString(), items.length);
      }

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
    status: OrderStatus,
    cancelReason?: string
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

      const currentStatus = order.status;
      const orderUserId = order.userId?.toString();
      const orderAgentId = order.agentId?.toString();

      // ========== ROLE-SPECIFIC CANCELLATION RULES ==========
      if (status === "tsutsalsan_zahialga") {
        // User cancellation rules
        if (role === "user") {
          // User must own the order
          if (orderUserId !== userId) {
            return { error: "Зөвхөн өөрийн захиалгыг цуцлах боломжтой", status: 403 };
          }
          // User can cancel from: niitlegdsen (before agent takes) OR tolbor_huleej_bn (after seeing report)
          if (currentStatus !== "niitlegdsen" && currentStatus !== "tolbor_huleej_bn") {
            return {
              error: "Хэрэглэгч зөвхөн agent авахаас өмнө эсвэл тайлан хараад цуцлах боломжтой",
              status: 400
            };
          }
          // Cannot cancel if payment already verified
          if (order.userPaymentVerified) {
            return { error: "Төлбөр баталгаажсан тул цуцлах боломжгүй", status: 400 };
          }
        }
        // Agent cancellation rules
        else if (role === "agent") {
          // Agent must be assigned to order
          if (orderAgentId !== userId) {
            return { error: "Зөвхөн өөрт оноогдсон захиалгыг цуцлах боломжтой", status: 403 };
          }
          // Agent can only cancel from agent_sudlaj_bn (before sending report)
          if (currentStatus !== "agent_sudlaj_bn") {
            return {
              error: "Agent зөвхөн тайлан илгээхээс өмнө цуцлах боломжтой",
              status: 400
            };
          }
          // Agent requires cancel reason
          if (!cancelReason || cancelReason.trim().length < 5) {
            return { error: "Цуцлах шалтгаан шаардлагатай (хамгийн багадаа 5 тэмдэгт)", status: 400 };
          }
        }
        // Admin cancellation rules
        else if (role === "admin") {
          // Admin can cancel from amjilttai_zahialga (if user falsely confirmed payment)
          // Admin can also cancel from any other status
          if (currentStatus === "tsutsalsan_zahialga") {
            return { error: "Захиалга аль хэдийн цуцлагдсан", status: 400 };
          }
        }

        // Update order status to cancelled
        order.status = status;
        if (cancelReason) {
          (order as any).cancelReason = cancelReason.trim();
        }
        // Update all items status too
        order.items.forEach((item: any) => {
          item.status = "tsutsalsan_zahialga";
        });
        await order.save();

        return {
          order: {
            id: order._id,
            status: order.status,
            agentId: order.agentId,
          },
        };
      }

      // ========== OTHER STATUS TRANSITION RULES ==========
      // Define valid transitions for non-cancel status changes
      const validTransitions: Record<string, Record<string, string[]>> = {
        agent: {
          "niitlegdsen": ["agent_sudlaj_bn"],
          "agent_sudlaj_bn": ["tolbor_huleej_bn"],
          "tolbor_huleej_bn": [],
          "amjilttai_zahialga": [],
          "tsutsalsan_zahialga": [],
        },
        admin: {
          "niitlegdsen": ["agent_sudlaj_bn"],
          "agent_sudlaj_bn": ["tolbor_huleej_bn"],
          "tolbor_huleej_bn": ["amjilttai_zahialga"],
          "amjilttai_zahialga": [],
          "tsutsalsan_zahialga": [],
        },
        user: {
          // Users can't change to other statuses (only cancel handled above)
          "niitlegdsen": [],
          "agent_sudlaj_bn": [],
          "tolbor_huleej_bn": [],
          "amjilttai_zahialga": [],
          "tsutsalsan_zahialga": [],
        },
      };

      const roleTransitions = validTransitions[role] || validTransitions.user;
      const allowedNextStatuses = roleTransitions[currentStatus] || [];

      if (!allowedNextStatuses.includes(status)) {
        return {
          error: `"${currentStatus}" статусаас "${status}" статус руу шилжих боломжгүй`,
          status: 400
        };
      }

      // Agent can only take orders that aren't assigned
      if (status === "agent_sudlaj_bn" && role === "agent" && order.agentId) {
        return { error: "Энэ захиалга аль хэдийн agent авсан байна", status: 400 };
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
  async updateTrackCode(
    orderId: string,
    userId: string,
    role: string,
    trackCode: string
  ): Promise<BundleOrderResult> {
    try {
      const order = await BundleOrder.findById(orderId);
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Check authorization: only assigned agent or admin can update track code
      if (role === "agent") {
        if (!order.agentId || order.agentId.toString() !== userId) {
          return { error: "Зөвхөн өөрт оноогдсон захиалгын track code оруулах боломжтой", status: 403 };
        }
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

      // User can cancel from: niitlegdsen (before agent takes) OR tolbor_huleej_bn (after seeing report)
      if (order.status !== "niitlegdsen" && order.status !== "tolbor_huleej_bn") {
        return {
          error: "Хэрэглэгч зөвхөн agent авахаас өмнө эсвэл тайлан хараад цуцлах боломжтой",
          status: 400
        };
      }

      // Cannot cancel if payment already verified
      if (order.userPaymentVerified) {
        return { error: "Төлбөр баталгаажсан тул цуцлах боломжгүй", status: 400 };
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
   * Remove item from bundle order (only when status is "tolbor_huleej_bn")
   * Card is burned (not refunded) when item is removed
   */
  async removeItemFromBundle(
    orderId: string,
    itemId: string,
    userId: string,
    role: string
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

      // Only allow the order owner to remove items (or admin)
      if (role !== "admin" && order.userId.toString() !== user._id.toString()) {
        return { error: "Not authorized to modify this order", status: 403 };
      }

      // Only allow removal when status is "tolbor_huleej_bn" (before payment)
      if (order.status !== "tolbor_huleej_bn") {
        return { error: "Зөвхөн төлбөр хүлээж байгаа үед бараа хасах боломжтой", status: 400 };
      }

      // Find the item
      const item = order.items.id(itemId);
      if (!item) {
        return { error: "Item not found", status: 404 };
      }

      // Cannot remove if payment already verified
      if (order.userPaymentVerified) {
        return { error: "Төлбөр баталгаажсан тул бараа хасах боломжгүй", status: 400 };
      }

      // Must have at least 2 items to remove one (can't remove last item - should cancel instead)
      if (order.items.length <= 1) {
        return { error: "Сүүлийн барааг хасах боломжгүй. Захиалга цуцлах уу?", status: 400 };
      }

      const itemName = item.productName;

      // Remove the item
      order.items.pull(itemId);
      await order.save();

      // Burn the card for the removed item (record the transaction but don't refund)
      // Only burn card if the order was created by a user (not agent/admin)
      const orderUser = await User.findById(order.userId);
      if (orderUser && orderUser.role === "user") {
        await cardService.burnCardForRemovedItem(
          order.userId.toString(),
          orderId,
          itemId,
          itemName
        );
      }

      // Reload the order to get the full data
      const updatedOrder = await BundleOrder.findById(orderId).lean();
      if (!updatedOrder) {
        return { error: "Order not found after update", status: 500 };
      }

      return {
        order: {
          id: updatedOrder._id.toString(),
          userId: updatedOrder.userId.toString(),
          agentId: updatedOrder.agentId?.toString(),
          userSnapshot: updatedOrder.userSnapshot,
          items: updatedOrder.items.map((i: any) => ({
            id: i._id.toString(),
            productName: i.productName,
            description: i.description,
            imageUrls: i.imageUrls,
            status: i.status,
            agentReport: i.report ? {
              userAmount: i.report.userAmount,
              paymentLink: i.report.paymentLink,
              additionalImages: i.report.additionalImages,
              additionalDescription: i.report.additionalDescription,
              quantity: i.report.quantity,
              createdAt: i.report.createdAt,
            } : undefined,
          })),
          status: updatedOrder.status,
          userPaymentVerified: updatedOrder.userPaymentVerified,
          agentPaymentPaid: updatedOrder.agentPaymentPaid,
          trackCode: updatedOrder.trackCode,
          reportMode: updatedOrder.reportMode,
          bundleReport: updatedOrder.bundleReport,
          createdAt: updatedOrder.createdAt,
          updatedAt: updatedOrder.updatedAt,
        },
      };
    } catch (error) {
      console.error("Error removing item from bundle:", error);
      return { error: "Failed to remove item from bundle", status: 500 };
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

  /**
   * Archive bundle order
   */
  async archiveOrder(
    orderId: string,
    userId: string,
    role: string
  ): Promise<BundleOrderResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      const order = await BundleOrder.findById(orderId).lean();
      if (!order) {
        return { error: "Bundle order not found", status: 404 };
      }

      // Only user can archive their own orders
      if (role === "user" && order.userId.toString() !== userId) {
        return { error: "Forbidden", status: 403 };
      }

      // Admin can archive any order
      if (role !== "user" && role !== "admin") {
        return { error: "Forbidden", status: 403 };
      }

      const updatedOrder = await BundleOrder.findByIdAndUpdate(
        orderId,
        { archivedByUser: true },
        { new: true }
      ).lean();

      if (!updatedOrder) {
        return { error: "Bundle order not found", status: 404 };
      }

      return {
        order: {
          id: updatedOrder._id.toString(),
          userId: updatedOrder.userId.toString(),
          agentId: updatedOrder.agentId?.toString(),
          userSnapshot: updatedOrder.userSnapshot,
          items: updatedOrder.items.map((i: any) => ({
            id: i._id.toString(),
            productName: i.productName,
            description: i.description,
            imageUrls: i.imageUrls,
            status: i.status,
            agentReport: i.report ? {
              userAmount: i.report.userAmount,
              paymentLink: i.report.paymentLink,
              additionalImages: i.report.additionalImages,
              additionalDescription: i.report.additionalDescription,
              quantity: i.report.quantity,
            } : undefined,
          })),
          status: updatedOrder.status,
          userPaymentVerified: updatedOrder.userPaymentVerified,
          agentPaymentPaid: updatedOrder.agentPaymentPaid,
          trackCode: updatedOrder.trackCode,
          reportMode: updatedOrder.reportMode,
          bundleReport: updatedOrder.bundleReport,
          archivedByUser: updatedOrder.archivedByUser,
          createdAt: updatedOrder.createdAt,
          updatedAt: updatedOrder.updatedAt,
        },
      };
    } catch (error) {
      console.error("Error archiving bundle order:", error);
      return { error: "Failed to archive bundle order", status: 500 };
    }
  }
}

export const bundleOrderService = new BundleOrderService();
