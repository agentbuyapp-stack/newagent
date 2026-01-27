import { Request, Response } from "express";
import { Profile } from "../models";
import { validateEmail, validatePhone } from "../utils/validation";
import mongoose from "mongoose";

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const profile = await Profile.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id)
    }).lean();

    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
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

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const { name, phone, email, cargo, accountNumber } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Name is required and must be a non-empty string" });
      return;
    }

    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "Phone is required" });
      return;
    }

    if (!validatePhone(phone)) {
      res.status(400).json({ error: "Invalid phone number format" });
      return;
    }

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
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
