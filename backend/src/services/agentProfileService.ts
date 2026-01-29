import { User, Order, AgentSpecialty, AgentReview, Profile } from "../models";
import mongoose from "mongoose";

interface ServiceResult {
  data?: any;
  error?: string;
  status?: number;
}

class AgentProfileService {
  /**
   * Update agent profile (admin only)
   */
  async updateAgentProfile(
    agentId: string,
    profileData: {
      avatarUrl?: string;
      displayName?: string;
      bio?: string;
      specialties?: string[];
      experienceYears?: number;
      languages?: string[];
      responseTime?: string;
      workingHours?: string;
      availabilityStatus?: "online" | "busy" | "offline";
      featured?: boolean;
    }
  ): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        return { error: "Invalid agent ID", status: 400 };
      }

      const agent = await User.findById(agentId);
      if (!agent) {
        return { error: "Agent not found", status: 404 };
      }

      if (agent.role !== "agent") {
        return { error: "User is not an agent", status: 400 };
      }

      // Initialize agentProfile if not exists
      if (!agent.agentProfile) {
        agent.agentProfile = {
          specialties: [],
          rank: 999,
          isTopAgent: false,
          totalTransactions: 0,
          successRate: 0,
          languages: [],
          featured: false,
          availabilityStatus: "offline",
        };
      }

      // Update profile fields
      if (profileData.avatarUrl !== undefined) agent.agentProfile.avatarUrl = profileData.avatarUrl;
      if (profileData.displayName !== undefined) agent.agentProfile.displayName = profileData.displayName;
      if (profileData.bio !== undefined) agent.agentProfile.bio = profileData.bio;
      if (profileData.specialties !== undefined) agent.agentProfile.specialties = profileData.specialties;
      if (profileData.experienceYears !== undefined) agent.agentProfile.experienceYears = profileData.experienceYears;
      if (profileData.languages !== undefined) agent.agentProfile.languages = profileData.languages;
      if (profileData.responseTime !== undefined) agent.agentProfile.responseTime = profileData.responseTime;
      if (profileData.workingHours !== undefined) agent.agentProfile.workingHours = profileData.workingHours;
      if (profileData.availabilityStatus !== undefined) agent.agentProfile.availabilityStatus = profileData.availabilityStatus;
      if (profileData.featured !== undefined) agent.agentProfile.featured = profileData.featured;

      await agent.save();

      // Get profile if exists
      const profile = await Profile.findOne({ userId: agentId }).lean();

      return {
        data: {
          ...agent.toObject(),
          id: agent._id.toString(),
          profile: profile || null,
        },
      };
    } catch (error: any) {
      console.error("Error updating agent profile:", error);
      return { error: "Failed to update agent profile", status: 500 };
    }
  }

  /**
   * Update agent rank (admin only)
   */
  async updateAgentRank(agentId: string, rank: number): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        return { error: "Invalid agent ID", status: 400 };
      }

      if (typeof rank !== "number" || rank < 1) {
        return { error: "Invalid rank value", status: 400 };
      }

      const agent = await User.findById(agentId);
      if (!agent) {
        return { error: "Agent not found", status: 404 };
      }

      if (!agent.agentProfile) {
        agent.agentProfile = {
          specialties: [],
          rank: rank,
          isTopAgent: rank <= 10,
          totalTransactions: 0,
          successRate: 0,
          languages: [],
          featured: false,
          availabilityStatus: "offline",
        };
      } else {
        agent.agentProfile.rank = rank;
        agent.agentProfile.isTopAgent = rank <= 10;
      }

      await agent.save();

      return {
        data: {
          id: agent._id.toString(),
          rank: agent.agentProfile.rank,
          isTopAgent: agent.agentProfile.isTopAgent,
        },
      };
    } catch (error: any) {
      console.error("Error updating agent rank:", error);
      return { error: "Failed to update agent rank", status: 500 };
    }
  }

  /**
   * Reorder agents (set top 10)
   */
  async reorderAgents(agentIds: string[]): Promise<ServiceResult> {
    try {
      if (!Array.isArray(agentIds)) {
        return { error: "Invalid agent IDs array", status: 400 };
      }

      // Validate all IDs
      for (const id of agentIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return { error: `Invalid agent ID: ${id}`, status: 400 };
        }
      }

      // First, reset all agents to not be in top
      await User.updateMany(
        { role: "agent" },
        {
          $set: {
            "agentProfile.isTopAgent": false,
            "agentProfile.rank": 999,
          },
        }
      );

      // Set ranks for the provided agents
      const updatePromises = agentIds.slice(0, 10).map((id, index) =>
        User.findByIdAndUpdate(id, {
          $set: {
            "agentProfile.rank": index + 1,
            "agentProfile.isTopAgent": true,
          },
        })
      );

      await Promise.all(updatePromises);

      // Get updated top agents
      const topAgents = await User.find({
        role: "agent",
        "agentProfile.isTopAgent": true,
      })
        .sort({ "agentProfile.rank": 1 })
        .lean();

      return {
        data: topAgents.map((agent) => ({
          id: agent._id.toString(),
          email: agent.email,
          rank: agent.agentProfile?.rank,
          isTopAgent: agent.agentProfile?.isTopAgent,
        })),
      };
    } catch (error: any) {
      console.error("Error reordering agents:", error);
      return { error: "Failed to reorder agents", status: 500 };
    }
  }

  /**
   * Toggle agent top status
   */
  async toggleAgentTop(agentId: string, isTop: boolean): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        return { error: "Invalid agent ID", status: 400 };
      }

      const agent = await User.findById(agentId);
      if (!agent) {
        return { error: "Agent not found", status: 404 };
      }

      if (!agent.agentProfile) {
        agent.agentProfile = {
          specialties: [],
          rank: isTop ? 10 : 999,
          isTopAgent: isTop,
          totalTransactions: 0,
          successRate: 0,
          languages: [],
          featured: false,
          availabilityStatus: "offline",
        };
      } else {
        agent.agentProfile.isTopAgent = isTop;
        if (!isTop) {
          agent.agentProfile.rank = 999;
        }
      }

      await agent.save();

      return {
        data: {
          id: agent._id.toString(),
          isTopAgent: agent.agentProfile.isTopAgent,
          rank: agent.agentProfile.rank,
        },
      };
    } catch (error: any) {
      console.error("Error toggling agent top status:", error);
      return { error: "Failed to toggle agent top status", status: 500 };
    }
  }

  // ==================== Specialties ====================

  /**
   * Get all specialties
   */
  async getSpecialties(): Promise<ServiceResult> {
    try {
      const specialties = await AgentSpecialty.find({})
        .sort({ order: 1, name: 1 })
        .lean();

      return {
        data: specialties.map((s) => ({
          ...s,
          id: s._id.toString(),
        })),
      };
    } catch (error: any) {
      console.error("Error getting specialties:", error);
      return { error: "Failed to get specialties", status: 500 };
    }
  }

  /**
   * Create specialty
   */
  async createSpecialty(data: {
    name: string;
    nameEn?: string;
    icon?: string;
    description?: string;
  }): Promise<ServiceResult> {
    try {
      if (!data.name || typeof data.name !== "string") {
        return { error: "Name is required", status: 400 };
      }

      // Get max order
      const maxOrder = await AgentSpecialty.findOne({})
        .sort({ order: -1 })
        .select("order")
        .lean();

      const specialty = await AgentSpecialty.create({
        name: data.name.trim(),
        nameEn: data.nameEn?.trim(),
        icon: data.icon,
        description: data.description?.trim(),
        order: (maxOrder?.order || 0) + 1,
      });

      return {
        data: {
          ...specialty.toObject(),
          id: specialty._id.toString(),
        },
      };
    } catch (error: any) {
      console.error("Error creating specialty:", error);
      if (error.code === 11000) {
        return { error: "Specialty already exists", status: 409 };
      }
      return { error: "Failed to create specialty", status: 500 };
    }
  }

  /**
   * Update specialty
   */
  async updateSpecialty(
    specialtyId: string,
    data: {
      name?: string;
      nameEn?: string;
      icon?: string;
      description?: string;
      isActive?: boolean;
      order?: number;
    }
  ): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
        return { error: "Invalid specialty ID", status: 400 };
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.nameEn !== undefined) updateData.nameEn = data.nameEn.trim();
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.order !== undefined) updateData.order = data.order;

      const specialty = await AgentSpecialty.findByIdAndUpdate(
        specialtyId,
        updateData,
        { new: true }
      ).lean();

      if (!specialty) {
        return { error: "Specialty not found", status: 404 };
      }

      return {
        data: {
          ...specialty,
          id: specialty._id.toString(),
        },
      };
    } catch (error: any) {
      console.error("Error updating specialty:", error);
      if (error.code === 11000) {
        return { error: "Specialty name already exists", status: 409 };
      }
      return { error: "Failed to update specialty", status: 500 };
    }
  }

  /**
   * Delete specialty
   */
  async deleteSpecialty(specialtyId: string): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
        return { error: "Invalid specialty ID", status: 400 };
      }

      const specialty = await AgentSpecialty.findByIdAndDelete(specialtyId).lean();

      if (!specialty) {
        return { error: "Specialty not found", status: 404 };
      }

      return {
        data: { message: "Specialty deleted successfully" },
      };
    } catch (error: any) {
      console.error("Error deleting specialty:", error);
      return { error: "Failed to delete specialty", status: 500 };
    }
  }

  // ==================== Reviews ====================

  /**
   * Get all reviews (admin)
   */
  async getReviews(): Promise<ServiceResult> {
    try {
      const reviews = await AgentReview.find({})
        .populate("agentId", "email agentProfile", User)
        .populate("userId", "email", User)
        .populate("orderId", "productName", Order)
        .sort({ createdAt: -1 })
        .lean();

      return {
        data: reviews.map((r) => ({
          ...r,
          id: r._id.toString(),
          agentId: r.agentId ? (r.agentId as any)._id?.toString() || r.agentId.toString() : null,
          userId: r.userId ? (r.userId as any)._id?.toString() || r.userId.toString() : null,
          orderId: r.orderId ? (r.orderId as any)._id?.toString() || r.orderId.toString() : null,
        })),
      };
    } catch (error: any) {
      console.error("Error getting reviews:", error);
      return { error: "Failed to get reviews", status: 500 };
    }
  }

  /**
   * Approve/reject review
   */
  async approveReview(reviewId: string, approved: boolean): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return { error: "Invalid review ID", status: 400 };
      }

      const review = await AgentReview.findByIdAndUpdate(
        reviewId,
        { isApproved: approved },
        { new: true }
      ).lean();

      if (!review) {
        return { error: "Review not found", status: 404 };
      }

      // Recalculate agent's success rate
      await this.recalculateAgentStats(review.agentId.toString());

      return {
        data: {
          ...review,
          id: review._id.toString(),
        },
      };
    } catch (error: any) {
      console.error("Error approving review:", error);
      return { error: "Failed to approve review", status: 500 };
    }
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return { error: "Invalid review ID", status: 400 };
      }

      const review = await AgentReview.findByIdAndDelete(reviewId).lean();

      if (!review) {
        return { error: "Review not found", status: 404 };
      }

      // Recalculate agent's stats
      await this.recalculateAgentStats(review.agentId.toString());

      return {
        data: { message: "Review deleted successfully" },
      };
    } catch (error: any) {
      console.error("Error deleting review:", error);
      return { error: "Failed to delete review", status: 500 };
    }
  }

  // ==================== Stats ====================

  /**
   * Recalculate agent statistics
   */
  async recalculateAgentStats(agentId: string): Promise<void> {
    try {
      // Get completed orders count
      const completedOrders = await Order.countDocuments({
        agentId: new mongoose.Types.ObjectId(agentId),
        status: "amjilttai_zahialga",
      });

      // Get total orders count
      const totalOrders = await Order.countDocuments({
        agentId: new mongoose.Types.ObjectId(agentId),
        status: { $in: ["amjilttai_zahialga", "tsutsalsan_zahialga"] },
      });

      // Calculate success rate
      const successRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      // Get average rating from approved reviews
      const avgRatingResult = await AgentReview.aggregate([
        {
          $match: {
            agentId: new mongoose.Types.ObjectId(agentId),
            isApproved: true,
            isVisible: true,
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
          },
        },
      ]);

      const avgRating = avgRatingResult[0]?.avgRating || 0;

      // Update agent profile
      await User.findByIdAndUpdate(agentId, {
        $set: {
          "agentProfile.totalTransactions": completedOrders,
          "agentProfile.successRate": Math.max(successRate, Math.round(avgRating * 20)), // Use higher of success rate or rating-based score
        },
      });
    } catch (error) {
      console.error("Error recalculating agent stats:", error);
    }
  }

  /**
   * Get top agents (public)
   */
  async getTopAgents(limit: number = 10): Promise<ServiceResult> {
    try {
      const agents = await User.find({
        role: "agent",
        isApproved: true,
        "agentProfile.isTopAgent": true,
      })
        .select("email agentProfile agentPoints")
        .sort({ "agentProfile.rank": 1 })
        .limit(limit)
        .lean();

      // Get profiles for agents
      const agentIds = agents.map((a) => a._id);
      const profiles = await Profile.find({ userId: { $in: agentIds } }).lean();
      const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

      // Get review counts and avg ratings
      const reviewStats = await AgentReview.aggregate([
        {
          $match: {
            agentId: { $in: agentIds },
            isApproved: true,
            isVisible: true,
          },
        },
        {
          $group: {
            _id: "$agentId",
            avgRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]);
      const reviewMap = new Map(reviewStats.map((r) => [r._id.toString(), r]));

      return {
        data: agents.map((agent) => {
          const profile = profileMap.get(agent._id.toString());
          const reviews = reviewMap.get(agent._id.toString());

          return {
            id: agent._id.toString(),
            name: agent.agentProfile?.displayName || profile?.name || agent.email.split("@")[0],
            email: agent.email,
            avatarUrl: agent.agentProfile?.avatarUrl,
            bio: agent.agentProfile?.bio,
            specialties: agent.agentProfile?.specialties || [],
            experienceYears: agent.agentProfile?.experienceYears,
            rank: agent.agentProfile?.rank || 999,
            isTopAgent: agent.agentProfile?.isTopAgent || true,
            orderCount: agent.agentProfile?.totalTransactions || 0,
            totalTransactions: agent.agentProfile?.totalTransactions || 0,
            successRate: agent.agentProfile?.successRate || 0,
            languages: agent.agentProfile?.languages || [],
            responseTime: agent.agentProfile?.responseTime,
            featured: agent.agentProfile?.featured || false,
            availabilityStatus: agent.agentProfile?.availabilityStatus || "offline",
            workingHours: agent.agentProfile?.workingHours,
            avgRating: reviews?.avgRating ? Math.round(reviews.avgRating * 10) / 10 : 0,
            reviewCount: reviews?.reviewCount || 0,
            agentPoints: agent.agentPoints || 0,
            createdAt: (agent as any).createdAt,
          };
        }),
      };
    } catch (error: any) {
      console.error("Error getting top agents:", error);
      return { error: "Failed to get top agents", status: 500 };
    }
  }

  /**
   * Create review (user only, after completed order)
   */
  async createReview(
    userId: string,
    agentId: string,
    orderId: string,
    rating: number,
    comment?: string
  ): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId) ||
          !mongoose.Types.ObjectId.isValid(agentId) ||
          !mongoose.Types.ObjectId.isValid(orderId)) {
        return { error: "Invalid ID", status: 400 };
      }

      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return { error: "Rating must be between 1 and 5", status: 400 };
      }

      // Check if order exists and is completed
      const order = await Order.findOne({
        _id: orderId,
        userId: userId,
        agentId: agentId,
        status: "amjilttai_zahialga",
      }).lean();

      if (!order) {
        return { error: "Order not found or not completed", status: 404 };
      }

      // Check if review already exists
      const existingReview = await AgentReview.findOne({ orderId }).lean();
      if (existingReview) {
        return { error: "Review already exists for this order", status: 409 };
      }

      const review = await AgentReview.create({
        agentId: new mongoose.Types.ObjectId(agentId),
        userId: new mongoose.Types.ObjectId(userId),
        orderId: new mongoose.Types.ObjectId(orderId),
        rating,
        comment: comment?.trim(),
      });

      // Recalculate agent stats
      await this.recalculateAgentStats(agentId);

      return {
        data: {
          ...review.toObject(),
          id: review._id.toString(),
        },
      };
    } catch (error: any) {
      console.error("Error creating review:", error);
      if (error.code === 11000) {
        return { error: "Review already exists", status: 409 };
      }
      return { error: "Failed to create review", status: 500 };
    }
  }

  /**
   * Get agent reviews (public)
   */
  async getAgentReviews(agentId: string, limit: number = 10): Promise<ServiceResult> {
    try {
      if (!mongoose.Types.ObjectId.isValid(agentId)) {
        return { error: "Invalid agent ID", status: 400 };
      }

      const reviews = await AgentReview.find({
        agentId: new mongoose.Types.ObjectId(agentId),
        isApproved: true,
        isVisible: true,
      })
        .populate("userId", "email", User)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      // Get profiles for users
      const userIds = reviews.map((r) => (r.userId as any)?._id || r.userId);
      const profiles = await Profile.find({ userId: { $in: userIds } }).lean();
      const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

      return {
        data: reviews.map((r) => {
          const userId = (r.userId as any)?._id?.toString() || r.userId?.toString();
          const profile = userId ? profileMap.get(userId) : null;

          return {
            id: r._id.toString(),
            rating: r.rating,
            comment: r.comment,
            userName: profile?.name || (r.userId as any)?.email?.split("@")[0] || "Anonymous",
            createdAt: r.createdAt,
          };
        }),
      };
    } catch (error: any) {
      console.error("Error getting agent reviews:", error);
      return { error: "Failed to get agent reviews", status: 500 };
    }
  }
}

export const agentProfileService = new AgentProfileService();
