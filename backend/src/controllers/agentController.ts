import { Request, Response } from "express";
import { User, RewardRequest, Order, Profile, AgentReview, AgentSpecialty } from "../models";
import mongoose from "mongoose";
import { notifyAdminRewardRequest } from "../services/notificationService";
import { agentProfileService } from "../services/agentProfileService";

// Public endpoint - get all approved agents with stats
export const getPublicAgents = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get all approved agents
    const agents = await User.find({ role: "agent", isApproved: true })
      .select("_id email agentPoints agentProfile createdAt")
      .lean();

    if (agents.length === 0) {
      res.json([]);
      return;
    }

    const agentIds = agents.map(a => a._id);

    // Get profiles for agents
    const profiles = await Profile.find({ userId: { $in: agentIds } }).lean();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    // Get order stats for each agent (only successful orders)
    const orderStats = await Order.aggregate([
      {
        $match: {
          agentId: { $in: agentIds },
          status: "amjilttai_zahialga"
        }
      },
      {
        $group: {
          _id: "$agentId",
          orderCount: { $sum: 1 }
        }
      }
    ]);
    const orderStatsMap = new Map(orderStats.map(s => [s._id.toString(), s.orderCount]));

    // Get review stats
    const reviewStats = await AgentReview.aggregate([
      {
        $match: {
          agentId: { $in: agentIds },
          isApproved: true,
          isVisible: true
        }
      },
      {
        $group: {
          _id: "$agentId",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 }
        }
      }
    ]);
    const reviewMap = new Map(reviewStats.map(r => [r._id.toString(), r]));

    // Format response
    const agentsWithStats = agents.map(agent => {
      const profile = profileMap.get(agent._id.toString());
      const orderCount = orderStatsMap.get(agent._id.toString()) || 0;
      const reviews = reviewMap.get(agent._id.toString());

      return {
        id: agent._id.toString(),
        name: (agent as any).agentProfile?.displayName || profile?.name || "Агент",
        email: agent.email,
        avatarUrl: (agent as any).agentProfile?.avatarUrl,
        bio: (agent as any).agentProfile?.bio,
        specialties: (agent as any).agentProfile?.specialties || [],
        experienceYears: (agent as any).agentProfile?.experienceYears,
        rank: (agent as any).agentProfile?.rank || 999,
        isTopAgent: (agent as any).agentProfile?.isTopAgent || false,
        orderCount,
        totalTransactions: (agent as any).agentProfile?.totalTransactions || orderCount,
        successRate: (agent as any).agentProfile?.successRate || 0,
        languages: (agent as any).agentProfile?.languages || [],
        responseTime: (agent as any).agentProfile?.responseTime,
        featured: (agent as any).agentProfile?.featured || false,
        availabilityStatus: (agent as any).agentProfile?.availabilityStatus || "offline",
        workingHours: (agent as any).agentProfile?.workingHours,
        avgRating: reviews?.avgRating ? Math.round(reviews.avgRating * 10) / 10 : 0,
        reviewCount: reviews?.reviewCount || 0,
        agentPoints: agent.agentPoints || 0,
        createdAt: agent.createdAt,
      };
    });

    // Sort by rank first (top agents), then by orderCount (desc), then by agentPoints (desc)
    agentsWithStats.sort((a, b) => {
      // Top agents come first
      if (a.isTopAgent && !b.isTopAgent) return -1;
      if (!a.isTopAgent && b.isTopAgent) return 1;

      // Among top agents, sort by rank
      if (a.isTopAgent && b.isTopAgent) {
        return a.rank - b.rank;
      }

      // For non-top agents, sort by orderCount then points
      if (b.orderCount !== a.orderCount) {
        return b.orderCount - a.orderCount;
      }
      return b.agentPoints - a.agentPoints;
    });

    res.json(agentsWithStats);
  } catch (error: any) {
    console.error("Error in GET /agents/public:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get top 10 agents (public)
export const getTopAgents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error, status } = await agentProfileService.getTopAgents(10);

    if (error) {
      res.status(status || 500).json({ error });
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /agents/top:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get agent reviews (public)
export const getAgentReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error, status } = await agentProfileService.getAgentReviews(
      req.params.id,
      10
    );

    if (error) {
      res.status(status || 500).json({ error });
      return;
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /agents/:id/reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create review (user only)
export const createAgentReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const { rating, comment } = req.body;
    const { agentId, orderId } = req.params;

    const { data, error, status } = await agentProfileService.createReview(
      req.user.id,
      agentId,
      orderId,
      rating,
      comment
    );

    if (error) {
      res.status(status || 500).json({ error });
      return;
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error("Error in POST /agents/:agentId/reviews/:orderId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get public specialties
export const getPublicSpecialties = async (_req: Request, res: Response): Promise<void> => {
  try {
    const specialties = await AgentSpecialty.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    res.json(specialties.map(s => ({
      id: s._id.toString(),
      name: s.name,
      nameEn: s.nameEn,
      icon: s.icon,
    })));
  } catch (error: any) {
    console.error("Error in GET /agents/specialties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const registerAsAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { role: "agent" },
      { new: true }
    ).lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      ...user,
      id: user._id.toString(),
    });
  } catch (error: any) {
    console.error("Error in POST /agents/register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyRewardRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Get all reward requests for this agent
    const requests = await RewardRequest.find({
      agentId: new mongoose.Types.ObjectId(req.user.id)
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests.map(request => ({
      ...request,
      id: request._id.toString(),
      agentId: request.agentId.toString(),
    })));
  } catch (error: any) {
    console.error("Error in GET /agents/reward-requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createRewardRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Get user's current points
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const agentPoints = user.agentPoints || 0;

    if (agentPoints <= 0) {
      res.status(400).json({ error: "Insufficient points" });
      return;
    }

    // Create reward request with all available points
    const request = await RewardRequest.create({
      agentId: new mongoose.Types.ObjectId(req.user.id),
      amount: agentPoints,
      status: "pending",
    });

    // Deduct points from user (they will be returned if request is rejected)
    await User.findByIdAndUpdate(
      req.user.id,
      { agentPoints: 0 }
    );

    // Notify admins about reward request
    const profile = await Profile.findOne({ userId: req.user.id }).lean();
    const agentName = profile?.name || "Agent";
    notifyAdminRewardRequest(
      new mongoose.Types.ObjectId(req.user.id),
      agentName,
      agentPoints
    ).catch((err) => console.error("Failed to notify admins:", err));

    res.status(201).json({
      ...request.toObject(),
      id: request._id.toString(),
      agentId: request.agentId.toString(),
    });
  } catch (error: any) {
    console.error("Error in POST /agents/reward-request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
