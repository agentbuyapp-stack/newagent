import { Request, Response } from "express";
import { User, Profile } from "../models";
import { validateEmail } from "../utils/validation";
import { parseRole } from "../middleware/requireRole";
import mongoose from "mongoose";

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    let user;
    try {
      user = await User.findById(req.user.id).lean();
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
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
        profile: profile ? {
          ...profile,
          id: profile._id.toString(),
          userId: profile.userId.toString(),
        } : null,
      });
    } catch (dbError: any) {
      console.error("Database error in /me:", dbError);
      return res.status(500).json({
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

export const register = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const userRole = parseRole(role) || "user";

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const user = await User.create({
      email: email.trim().toLowerCase(),
      role: userRole,
    });

    res.status(201).json({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("Error in /auth/register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

