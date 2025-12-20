import { Request, Response } from "express";
import { Profile } from "../models";
import { validateEmail, validatePhone } from "../utils/validation";
import mongoose from "mongoose";

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const profile = await Profile.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id)
    }).lean();

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({
      ...profile,
      id: profile._id.toString(),
      userId: profile.userId.toString(),
    });
  } catch (error) {
    console.error("Error in GET /profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const { name, phone, email, cargo, accountNumber } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required and must be a non-empty string" });
    }

    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ error: "Phone is required" });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Upsert profile (create if doesn't exist, update if exists)
    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        cargo: cargo ? cargo.trim() : undefined,
        accountNumber: accountNumber ? accountNumber.trim() : undefined,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).lean();

    res.json({
      ...profile,
      id: profile!._id.toString(),
      userId: profile!.userId.toString(),
    });
  } catch (error) {
    console.error("Error in PUT /profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

