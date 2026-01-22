import { Request, Response } from "express";
import { User, Profile, Order, AdminSettings, RewardRequest, AgentReport } from "../models";
import mongoose from "mongoose";
import {
  notifyAgentPaymentVerified,
} from "../services/notificationService";

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

export const addAgent = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
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
        approvedBy: req.user.id,
      });
    } else {
      // Update existing user to agent role
      user = await User.findByIdAndUpdate(
        user._id,
        {
          role: "agent",
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: req.user.id,
        },
        { new: true }
      );
    }

    if (!user) {
      return res.status(500).json({ error: "Failed to create/update user" });
    }

    // Get profile if exists
    const profile = await Profile.findOne({ userId: user._id }).lean();

    res.status(201).json(formatUser({ ...user.toObject(), profile: profile || null }));
  } catch (error: any) {
    console.error("Error in POST /admin/agents:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAgents = async (req: Request, res: Response) => {
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

    res.json(agentsWithProfiles.map(formatUser));
  } catch (error) {
    console.error("Error in GET /admin/agents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const approveAgent = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const agentId = req.params.id;
    const { approved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Invalid agent ID" });
    }

    const updateData: any = {
      isApproved: approved === true,
    };

    if (approved === true) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = req.user.id;
    } else {
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    const agent = await User.findByIdAndUpdate(
      agentId,
      updateData,
      { new: true }
    ).lean();

    // Get profile if exists
    const profile = await Profile.findOne({ userId: agentId }).lean();

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json(formatUser({ ...agent, profile: profile || null }));
  } catch (error) {
    console.error("Error in PUT /admin/agents/:id/approve:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAdminOrders = async (req: Request, res: Response) => {
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
        return typeof o.userId === 'object' && o.userId._id ? o.userId._id.toString() : o.userId.toString();
      })
      .filter(Boolean) as string[])];

    const agentIds = [...new Set(orders
      .map(o => {
        if (!o.agentId) return null;
        return typeof o.agentId === 'object' && o.agentId._id ? o.agentId._id.toString() : o.agentId.toString();
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
        if (typeof order.userId === 'object' && order.userId._id) {
          userIdStr = order.userId._id.toString();
        } else if (typeof order.userId === 'string') {
          userIdStr = order.userId;
        } else {
          userIdStr = order.userId.toString();
        }
      }

      // Extract agentId safely
      let agentIdStr: string | null = null;
      if (order.agentId) {
        if (typeof order.agentId === 'object' && order.agentId._id) {
          agentIdStr = order.agentId._id.toString();
        } else if (typeof order.agentId === 'string') {
          agentIdStr = order.agentId;
        } else {
          agentIdStr = order.agentId.toString();
        }
      }

      const user = userIdStr ? {
        ...(typeof order.userId === 'object' ? order.userId : { _id: new mongoose.Types.ObjectId(userIdStr) }),
        _id: typeof order.userId === 'object' && order.userId._id
          ? order.userId._id
          : new mongoose.Types.ObjectId(userIdStr),
        profile: profileMap.get(userIdStr) || null,
      } : null;

      const agent = agentIdStr ? {
        ...(typeof order.agentId === 'object' ? order.agentId : { _id: new mongoose.Types.ObjectId(agentIdStr) }),
        _id: typeof order.agentId === 'object' && order.agentId._id
          ? order.agentId._id
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

    res.json(formattedOrders);
  } catch (error: any) {
    console.error("Error in GET /admin/orders:", error);
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const verifyUserPayment = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
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
      return res.status(404).json({ error: "Order not found" });
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

    res.json({
      ...order,
      id: order._id.toString(),
      userId: order.userId.toString(),
      agentId: order.agentId?.toString(),
    });
  } catch (error) {
    console.error("Error in PUT /admin/orders/:id/verify-payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markAgentPaymentPaid = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Get order first to check if it has an agent
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!order.agentId) {
      return res.status(400).json({ error: "Order has no assigned agent" });
    }

    // Get agent report to calculate points
    const agentReport = await AgentReport.findOne({
      orderId: new mongoose.Types.ObjectId(orderId)
    }).lean();

    if (!agentReport) {
      return res.status(400).json({ error: "Agent report not found" });
    }

    // Get admin settings for exchange rate
    const settings = await AdminSettings.findOne().lean();
    const exchangeRate = settings?.exchangeRate || 1;

    // Calculate agent points: userAmount * exchangeRate * 0.05 (5% of user payment)
    // User payment = userAmount * exchangeRate * 1.05
    // Agent points = userAmount * exchangeRate * 0.05
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
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`[DEBUG] Agent points added: ${agentPoints} to agent ${agentId.toString()}`);

    res.json({
      ...updatedOrder,
      id: updatedOrder._id.toString(),
      userId: updatedOrder.userId.toString(),
      agentId: updatedOrder.agentId?.toString(),
    });
  } catch (error: any) {
    console.error("Error in PUT /admin/orders/:id/agent-payment:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    let settings = await AdminSettings.findOne().lean();

    // If no settings exist, create default one
    if (!settings) {
      const newSettings = await AdminSettings.create({});
      settings = newSettings.toObject();
    }

    res.json({
      ...settings,
      id: settings._id.toString(),
    });
  } catch (error: any) {
    console.error("Error in GET /admin/settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAdminSettings = async (req: Request, res: Response) => {
  try {
    const { accountNumber, accountName, bank, exchangeRate } = req.body;

    let settings = await AdminSettings.findOne().lean();

    if (!settings) {
      // Create new settings
      const newSettings = await AdminSettings.create({
        accountNumber: accountNumber || undefined,
        accountName: accountName || undefined,
        bank: bank || undefined,
        exchangeRate: exchangeRate || undefined,
      });
      settings = newSettings.toObject();
    } else {
      // Update existing settings
      const updatedSettings = await AdminSettings.findByIdAndUpdate(
        settings._id,
        {
          accountNumber: accountNumber !== undefined ? accountNumber : settings.accountNumber,
          accountName: accountName !== undefined ? accountName : settings.accountName,
          bank: bank !== undefined ? bank : settings.bank,
          exchangeRate: exchangeRate !== undefined ? exchangeRate : settings.exchangeRate,
        },
        { new: true }
      ).lean();
      settings = updatedSettings!;
    }

    res.json({
      ...settings,
      id: settings._id.toString(),
    });
  } catch (error: any) {
    console.error("Error in PUT /admin/settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRewardRequests = async (req: Request, res: Response) => {
  try {
    const requests = await RewardRequest.find({})
      .populate("agentId", null, User)
      .sort({ createdAt: -1 })
      .lean();

    // Get all agent IDs (handle both populated and unpopulated cases)
    const agentIds: string[] = [];
    requests.forEach(r => {
      if (r.agentId) {
        if (typeof r.agentId === 'object' && r.agentId._id) {
          agentIds.push(r.agentId._id.toString());
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
        if (typeof request.agentId === 'object' && request.agentId._id) {
          // Populated agent
          agentIdStr = request.agentId._id.toString();
          agent = {
            ...request.agentId,
            _id: request.agentId._id,
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

    res.json(formattedRequests);
  } catch (error: any) {
    console.error("Error in GET /admin/reward-requests:", error);
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const approveRewardRequest = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const requestId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const request = await RewardRequest.findById(requestId).lean();

    if (!request) {
      return res.status(404).json({ error: "Reward request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
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
          approvedBy: req.user.id,
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

    res.json({
      ...updatedRequest!,
      id: updatedRequest!._id.toString(),
      agentId: updatedRequest!.agentId.toString(),
      agent: agentWithProfile ? formatUser(agentWithProfile) : null,
    });
  } catch (error: any) {
    console.error("Error in PUT /admin/reward-requests/:id/approve:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectRewardRequest = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const requestId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const request = await RewardRequest.findById(requestId)
      .populate("agentId", null, User)
      .lean();

    if (!request) {
      return res.status(404).json({ error: "Reward request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }

    // Update request status to rejected (points remain with agent)
    const updatedRequest = await RewardRequest.findByIdAndUpdate(
      requestId,
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
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

    res.json({
      ...updatedRequest!,
      id: updatedRequest!._id.toString(),
      agentId: updatedRequest!.agentId.toString(),
      agent: agent ? formatUser(agent) : null,
    });
  } catch (error: any) {
    console.error("Error in PUT /admin/reward-requests/:id/reject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
