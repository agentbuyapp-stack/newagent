import { Request, Response } from "express";
import { User, Profile } from "../models";
import { validateEmail } from "../utils/validation";
import { parseRole } from "../middleware/requireRole";
import { cardService } from "../services/cardService";

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    let user;
    try {
      user = await User.findById(req.user.id).lean();

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Get profile if exists
      const profile = await Profile.findOne({ userId: user._id }).lean();

      res.json({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        isApproved: user.isApproved || false,
        approvedAt: user.approvedAt,
        approvedBy: user.approvedBy,
        agentPoints: user.agentPoints || 0,
        researchCards: user.researchCards || 0,
        profile: profile ? {
          ...profile,
          id: profile._id.toString(),
          userId: profile.userId.toString(),
        } : null,
      });
    } catch (dbError: any) {
      console.error("Database error in /me:", dbError);
      res.status(500).json({
        error: "Database connection error",
        message: process.env.NODE_ENV === "development" ? dbError.message : undefined
      });
    }
  } catch (error: any) {
    console.error("Error in /me:", error);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    const userRole = parseRole(role) || "user";

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (existingUser) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    const user = await User.create({
      email: email.trim().toLowerCase(),
      role: userRole,
    });

    // Grant initial research cards to new users (5 cards)
    if (userRole === "user") {
      await cardService.grantInitialCards(user._id.toString());
    }

    res.status(201).json({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      researchCards: userRole === "user" ? 5 : 0,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    console.error("Error in /auth/register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
