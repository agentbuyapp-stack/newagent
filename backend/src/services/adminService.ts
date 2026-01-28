import { User, Profile, Order, BundleOrder, AdminSettings, RewardRequest, AgentReport } from "../models";
import mongoose from "mongoose";
import { notifyAgentPaymentVerified } from "./notificationService";

interface AdminResult {
  data?: any;
  error?: string;
  status?: number;
}

// Format user with profile
const formatUser = (user: any) => {
  return {
    ...user,
    id: user._id.toString(),
    profile: user.profile ? {
      ...user.profile,
      id: user.profile._id.toString(),
      userId: user.profile.userId.toString(),
    } : null,
  };
};

class AdminService {
  /**
   * Add new agent
   */
  async addAgent(email: string, adminId: string): Promise<AdminResult> {
    try {
      if (!email || typeof email !== "string") {
        return { error: "Email is required", status: 400 };
      }

      // Check if user exists
      let user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        // Create new user with agent role
        user = await User.create({
          email: email.toLowerCase().trim(),
          role: "agent",
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: adminId,
        });
      } else {
        // Update existing user to agent role
        user = await User.findByIdAndUpdate(
          user._id,
          {
            role: "agent",
            isApproved: true,
            approvedAt: new Date(),
            approvedBy: adminId,
          },
          { new: true }
        );
      }

      if (!user) {
        return { error: "Failed to create/update user", status: 500 };
      }

      // Get profile if exists
      const profile = await Profile.findOne({ userId: user._id }).lean();

      return { data: formatUser({ ...user.toObject(), profile: profile || null }) };
    } catch (error: any) {
      console.error("Error adding agent:", error);
      if (error.code === 11000) {
        return { error: "Email already exists", status: 409 };
      }
      return { error: "Failed to add agent", status: 500 };
    }
  }

  /**
   * Get all agents
   */
  async getAgents(): Promise<AdminResult> {
    try {
      const agents = await User.find({ role: "agent" })
        .sort({ createdAt: -1 })
        .lean();

      // Get profiles for all agents
      const agentIds = agents.map(a => a._id);
      const profiles = await Profile.find({ userId: { $in: agentIds } }).lean();
      const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

      // Attach profiles to agents
      const agentsWithProfiles = agents.map(agent => ({
        ...agent,
        profile: profileMap.get(agent._id.toString()) || null,
      }));

      return { data: agentsWithProfiles.map(formatUser) };
    } catch (error) {
      console.error("Error getting agents:", error);
      return { error: "Failed to get agents", status: 500 };
    }
  }

  /**
   * Approve or reject agent
   */
  async approveAgent(agentId: string, approved: boolean, adminId: string): Promise<AdminResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        return { error: "Invalid agent ID", status: 400 };
      }

      const updateData: any = {
        isApproved: approved === true,
      };

      if (approved === true) {
        updateData.approvedAt = new Date();
        updateData.approvedBy = adminId;
      } else {
        updateData.approvedAt = null;
        updateData.approvedBy = null;
      }

      const agent = await User.findByIdAndUpdate(
        agentId,
        updateData,
        { new: true }
      ).lean();

      if (!agent) {
        return { error: "Agent not found", status: 404 };
      }

      // Get profile if exists
      const profile = await Profile.findOne({ userId: agentId }).lean();

      return { data: formatUser({ ...agent, profile: profile || null }) };
    } catch (error) {
      console.error("Error approving agent:", error);
      return { error: "Failed to approve agent", status: 500 };
    }
  }

  /**
   * Get all orders for admin
   */
  async getOrders(): Promise<AdminResult> {
    try {
      const orders = await Order.find({})
        .populate("userId", null, User)
        .populate("agentId", null, User)
        .sort({ createdAt: -1 })
        .lean();

      // Get all user IDs and agent IDs (with proper null checks)
      const userIds = [...new Set(orders
        .map(o => {
          if (!o.userId) return null;
          return typeof o.userId === 'object' && (o.userId as any)._id ? (o.userId as any)._id.toString() : o.userId.toString();
        })
        .filter(Boolean) as string[])];

      const agentIds = [...new Set(orders
        .map(o => {
          if (!o.agentId) return null;
          return typeof o.agentId === 'object' && (o.agentId as any)._id ? (o.agentId as any)._id.toString() : o.agentId.toString();
        })
        .filter(Boolean) as string[])];

      const allUserIds = [...new Set([...userIds, ...agentIds])];

      // Get profiles for all users
      const profiles = allUserIds.length > 0
        ? await Profile.find({ userId: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) } }).lean()
        : [];
      const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

      // Format orders with user/agent data
      const formattedOrders = orders.map(order => {
        // Extract userId safely
        let userIdStr: string | null = null;
        if (order.userId) {
          if (typeof order.userId === 'object' && (order.userId as any)._id) {
            userIdStr = (order.userId as any)._id.toString();
          } else if (typeof order.userId === 'string') {
            userIdStr = order.userId;
          } else {
            userIdStr = order.userId.toString();
          }
        }

        // Extract agentId safely
        let agentIdStr: string | null = null;
        if (order.agentId) {
          if (typeof order.agentId === 'object' && (order.agentId as any)._id) {
            agentIdStr = (order.agentId as any)._id.toString();
          } else if (typeof order.agentId === 'string') {
            agentIdStr = order.agentId;
          } else {
            agentIdStr = order.agentId.toString();
          }
        }

        const user = userIdStr ? {
          ...(typeof order.userId === 'object' ? order.userId : { _id: new mongoose.Types.ObjectId(userIdStr) }),
          _id: typeof order.userId === 'object' && (order.userId as any)._id
            ? (order.userId as any)._id
            : new mongoose.Types.ObjectId(userIdStr),
          profile: profileMap.get(userIdStr) || null,
        } : null;

        const agent = agentIdStr ? {
          ...(typeof order.agentId === 'object' ? order.agentId : { _id: new mongoose.Types.ObjectId(agentIdStr) }),
          _id: typeof order.agentId === 'object' && (order.agentId as any)._id
            ? (order.agentId as any)._id
            : new mongoose.Types.ObjectId(agentIdStr),
          profile: profileMap.get(agentIdStr) || null,
        } : null;

        return {
          ...order,
          id: order._id.toString(),
          userId: userIdStr || "",
          agentId: agentIdStr || undefined,
          user: user ? formatUser(user) : null,
          agent: agent ? formatUser(agent) : null,
        };
      });

      return { data: formattedOrders };
    } catch (error: any) {
      console.error("Error getting admin orders:", error);
      return { error: "Failed to get orders", status: 500 };
    }
  }

  /**
   * Verify user payment
   */
  async verifyUserPayment(orderId: string): Promise<AdminResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      // Update order status to "amjilttai_zahialga" and set userPaymentVerified to true
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          userPaymentVerified: true,
          status: "amjilttai_zahialga"
        },
        { new: true }
      ).lean();

      if (!order) {
        return { error: "Order not found", status: 404 };
      }

      // Notify agent about payment verified
      if (order.agentId) {
        const agentReport = await AgentReport.findOne({
          orderId: new mongoose.Types.ObjectId(orderId)
        }).lean();
        const amount = agentReport?.userAmount || 0;

        const agentIdObj = typeof order.agentId === 'object' && order.agentId !== null
          ? (order.agentId as any)._id || order.agentId
          : new mongoose.Types.ObjectId(String(order.agentId));
        notifyAgentPaymentVerified(
          agentIdObj,
          new mongoose.Types.ObjectId(orderId),
          order.productName,
          amount
        ).catch((err) => console.error("Failed to notify agent:", err));
      }

      return {
        data: {
          ...order,
          id: order._id.toString(),
          userId: order.userId.toString(),
          agentId: order.agentId?.toString(),
        }
      };
    } catch (error) {
      console.error("Error verifying user payment:", error);
      return { error: "Failed to verify payment", status: 500 };
    }
  }

  /**
   * Mark agent payment as paid
   */
  async markAgentPaymentPaid(orderId: string): Promise<AdminResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      // Get order first to check if it has an agent
      const order = await Order.findById(orderId).lean();
      if (!order) {
        return { error: "Order not found", status: 404 };
      }

      if (!order.agentId) {
        return { error: "Order has no assigned agent", status: 400 };
      }

      // Get agent report to calculate points
      const agentReport = await AgentReport.findOne({
        orderId: new mongoose.Types.ObjectId(orderId)
      }).lean();

      if (!agentReport) {
        return { error: "Agent report not found", status: 400 };
      }

      // Get admin settings for exchange rate
      const settings = await AdminSettings.findOne().lean();
      const exchangeRate = settings?.exchangeRate || 1;

      // Calculate agent points: userAmount * exchangeRate * 0.05 (5% of user payment)
      const agentPoints = agentReport.userAmount * exchangeRate * 0.05;

      // Update order and add points to agent
      const agentId = typeof order.agentId === 'object' && order.agentId !== null
        ? (order.agentId as any)._id || order.agentId
        : new mongoose.Types.ObjectId(String(order.agentId));

      const [updatedOrder] = await Promise.all([
        Order.findByIdAndUpdate(
          orderId,
          { agentPaymentPaid: true },
          { new: true }
        ).lean(),
        User.findByIdAndUpdate(
          agentId,
          [
            {
              $set: {
                agentPoints: {
                  $max: [0, { $add: ["$agentPoints", agentPoints] }]
                }
              }
            }
          ],
          { new: true }
        ).lean()
      ]);

      if (!updatedOrder) {
        return { error: "Order not found", status: 404 };
      }

      console.log(`[DEBUG] Agent points added: ${agentPoints} to agent ${agentId.toString()}`);

      return {
        data: {
          ...updatedOrder,
          id: updatedOrder._id.toString(),
          userId: updatedOrder.userId.toString(),
          agentId: updatedOrder.agentId?.toString(),
        }
      };
    } catch (error: any) {
      console.error("Error marking agent payment:", error);
      return { error: "Failed to mark agent payment", status: 500 };
    }
  }

  /**
   * Get admin settings
   */
  async getSettings(): Promise<AdminResult> {
    try {
      let settings = await AdminSettings.findOne().lean();

      // If no settings exist, create default one
      if (!settings) {
        const newSettings = await AdminSettings.create({});
        settings = await AdminSettings.findById(newSettings._id).lean();
      }

      if (!settings) {
        return { error: "Failed to create or retrieve settings", status: 500 };
      }

      return {
        data: {
          ...settings,
          id: settings._id.toString(),
        }
      };
    } catch (error: any) {
      console.error("Error getting admin settings:", error);
      return { error: "Failed to get settings", status: 500 };
    }
  }

  /**
   * Update admin settings
   */
  async updateSettings(data: {
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    exchangeRate?: number;
  }): Promise<AdminResult> {
    try {
      const { accountNumber, accountName, bank, exchangeRate } = data;

      let settings = await AdminSettings.findOne().lean();

      if (!settings) {
        // Create new settings
        const newSettings = await AdminSettings.create({
          accountNumber: accountNumber || undefined,
          accountName: accountName || undefined,
          bank: bank || undefined,
          exchangeRate: exchangeRate || undefined,
        });
        settings = await AdminSettings.findById(newSettings._id).lean();
      } else {
        // Update existing settings
        settings = await AdminSettings.findByIdAndUpdate(
          settings._id,
          {
            accountNumber: accountNumber !== undefined ? accountNumber : settings.accountNumber,
            accountName: accountName !== undefined ? accountName : settings.accountName,
            bank: bank !== undefined ? bank : settings.bank,
            exchangeRate: exchangeRate !== undefined ? exchangeRate : settings.exchangeRate,
          },
          { new: true }
        ).lean();
      }

      if (!settings) {
        return { error: "Failed to create or update settings", status: 500 };
      }

      return {
        data: {
          ...settings,
          id: settings._id.toString(),
        }
      };
    } catch (error: any) {
      console.error("Error updating admin settings:", error);
      return { error: "Failed to update settings", status: 500 };
    }
  }

  /**
   * Get all reward requests
   */
  async getRewardRequests(): Promise<AdminResult> {
    try {
      const requests = await RewardRequest.find({})
        .populate("agentId", null, User)
        .sort({ createdAt: -1 })
        .lean();

      // Get all agent IDs (handle both populated and unpopulated cases)
      const agentIds: string[] = [];
      requests.forEach(r => {
        if (r.agentId) {
          if (typeof r.agentId === 'object' && (r.agentId as any)._id) {
            agentIds.push((r.agentId as any)._id.toString());
          } else if (typeof r.agentId === 'string') {
            agentIds.push(r.agentId);
          } else {
            agentIds.push(String(r.agentId));
          }
        }
      });

      // Get profiles for all agents
      const profileMap = new Map();
      if (agentIds.length > 0) {
        const profiles = await Profile.find({
          userId: { $in: agentIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).lean();
        profiles.forEach(p => {
          profileMap.set(p.userId.toString(), p);
        });
      }

      // Format requests with agent data
      const formattedRequests = requests.map(request => {
        let agent = null;
        let agentIdStr = '';

        if (request.agentId) {
          if (typeof request.agentId === 'object' && (request.agentId as any)._id) {
            // Populated agent
            agentIdStr = (request.agentId as any)._id.toString();
            agent = {
              ...request.agentId,
              _id: (request.agentId as any)._id,
              profile: profileMap.get(agentIdStr) || null,
            };
          } else {
            // Unpopulated agent (just ID)
            agentIdStr = String(request.agentId);
            agent = {
              _id: new mongoose.Types.ObjectId(agentIdStr),
              id: agentIdStr,
              email: '',
              role: 'agent',
              isApproved: false,
              agentPoints: 0,
              profile: profileMap.get(agentIdStr) || null,
            };
          }
        }

        return {
          ...request,
          id: request._id.toString(),
          agentId: agentIdStr || (request.agentId ? String(request.agentId) : ''),
          agent: agent ? formatUser(agent) : null,
        };
      });

      return { data: formattedRequests };
    } catch (error: any) {
      console.error("Error getting reward requests:", error);
      return { error: "Failed to get reward requests", status: 500 };
    }
  }

  /**
   * Approve reward request
   */
  async approveRewardRequest(requestId: string, adminId: string): Promise<AdminResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return { error: "Invalid request ID", status: 400 };
      }

      const request = await RewardRequest.findById(requestId).lean();

      if (!request) {
        return { error: "Reward request not found", status: 404 };
      }

      if (request.status !== "pending") {
        return { error: "Request is not pending", status: 400 };
      }

      const agentId = typeof request.agentId === 'object' && request.agentId !== null
        ? (request.agentId as any)._id || request.agentId
        : new mongoose.Types.ObjectId(String(request.agentId));

      // Update request status and deduct points from agent
      const [updatedRequest, agent] = await Promise.all([
        RewardRequest.findByIdAndUpdate(
          requestId,
          {
            status: "approved",
            approvedAt: new Date(),
            approvedBy: adminId,
          },
          { new: true }
        )
          .populate("agentId", null, User)
          .lean(),
        User.findByIdAndUpdate(
          agentId,
          [
            {
              $set: {
                agentPoints: {
                  $max: [0, { $subtract: ["$agentPoints", request.amount] }]
                }
              }
            }
          ]
        ).lean(),
      ]);

      // Get profile for agent
      const profile = await Profile.findOne({ userId: agentId }).lean();
      const agentWithProfile = agent ? {
        ...agent,
        profile: profile || null,
      } : null;

      return {
        data: {
          ...updatedRequest!,
          id: updatedRequest!._id.toString(),
          agentId: updatedRequest!.agentId.toString(),
          agent: agentWithProfile ? formatUser(agentWithProfile) : null,
        }
      };
    } catch (error: any) {
      console.error("Error approving reward request:", error);
      return { error: "Failed to approve reward request", status: 500 };
    }
  }

  /**
   * Reject reward request
   */
  async rejectRewardRequest(requestId: string, adminId: string): Promise<AdminResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return { error: "Invalid request ID", status: 400 };
      }

      const request = await RewardRequest.findById(requestId)
        .populate("agentId", null, User)
        .lean();

      if (!request) {
        return { error: "Reward request not found", status: 404 };
      }

      if (request.status !== "pending") {
        return { error: "Request is not pending", status: 400 };
      }

      // Update request status to rejected (points remain with agent)
      const updatedRequest = await RewardRequest.findByIdAndUpdate(
        requestId,
        {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: adminId,
        },
        { new: true }
      )
        .populate("agentId", null, User)
        .lean();

      // Get profile for agent
      const agentId = typeof request.agentId === 'object' && request.agentId !== null
        ? (request.agentId as any)._id || request.agentId
        : new mongoose.Types.ObjectId(String(request.agentId));
      const profile = await Profile.findOne({ userId: agentId }).lean();
      const agent = updatedRequest!.agentId ? {
        ...(typeof updatedRequest!.agentId === 'object' ? updatedRequest!.agentId : {}),
        _id: typeof updatedRequest!.agentId === 'object' ? (updatedRequest!.agentId as any)._id : new mongoose.Types.ObjectId(String(updatedRequest!.agentId)),
        profile: profile || null,
      } : null;

      return {
        data: {
          ...updatedRequest!,
          id: updatedRequest!._id.toString(),
          agentId: updatedRequest!.agentId.toString(),
          agent: agent ? formatUser(agent) : null,
        }
      };
    } catch (error: any) {
      console.error("Error rejecting reward request:", error);
      return { error: "Failed to reject reward request", status: 500 };
    }
  }

  /**
   * Cancel user payment - Admin cancels payment when money not received
   * Works for both Order and BundleOrder
   */
  async cancelPayment(orderId: string, reason: string, orderType: "order" | "bundle" = "order"): Promise<AdminResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid order ID", status: 400 };
      }

      const cancelReason = reason || "Админ төлбөрийг цуцалсан";

      if (orderType === "bundle") {
        // Handle BundleOrder
        const bundleOrder = await BundleOrder.findById(orderId).lean();

        if (!bundleOrder) {
          return { error: "Bundle order not found", status: 404 };
        }

        const updatedOrder = await BundleOrder.findByIdAndUpdate(
          orderId,
          {
            status: "tsutsalsan_zahialga",
            userPaymentVerified: false,
          },
          { new: true }
        ).lean();

        if (!updatedOrder) {
          return { error: "Failed to cancel payment", status: 500 };
        }

        return {
          data: {
            ...updatedOrder,
            id: updatedOrder._id.toString(),
            userId: updatedOrder.userId.toString(),
            agentId: updatedOrder.agentId?.toString(),
            cancelReason: cancelReason,
          }
        };
      } else {
        // Handle regular Order
        const order = await Order.findById(orderId).lean();

        if (!order) {
          return { error: "Order not found", status: 404 };
        }

        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          {
            status: "tsutsalsan_zahialga",
            userPaymentVerified: false,
            cancelReason: cancelReason,
          },
          { new: true }
        ).lean();

        if (!updatedOrder) {
          return { error: "Failed to cancel payment", status: 500 };
        }

        return {
          data: {
            ...updatedOrder,
            id: updatedOrder._id.toString(),
            userId: updatedOrder.userId.toString(),
            agentId: updatedOrder.agentId?.toString(),
          }
        };
      }
    } catch (error: any) {
      console.error("Error cancelling payment:", error);
      return { error: "Failed to cancel payment", status: 500 };
    }
  }
}

export const adminService = new AdminService();
