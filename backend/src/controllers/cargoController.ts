import { Request, Response } from "express";
import { Cargo } from "../models";
import mongoose from "mongoose";

export const getCargos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cargos = await Cargo.find({})
      .sort({ name: 1 })
      .lean();

    res.json(cargos.map(cargo => ({
      ...cargo,
      id: cargo._id.toString(),
    })));
  } catch (error: any) {
    console.error("Error in GET /cargos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAdminCargos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cargos = await Cargo.find({})
      .sort({ name: 1 })
      .lean();

    res.json(cargos.map(cargo => ({
      ...cargo,
      id: cargo._id.toString(),
    })));
  } catch (error: any) {
    console.error("Error in GET /admin/cargos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createCargo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, phone, location, website, imageUrl } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const cargo = await Cargo.create({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      location: location ? location.trim() : undefined,
      website: website ? website.trim() : undefined,
      imageUrl: imageUrl ? imageUrl.trim() : undefined,
    });

    res.status(201).json({
      ...cargo.toObject(),
      id: cargo._id.toString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: "Cargo with this name already exists" });
      return;
    }
    console.error("Error in POST /admin/cargos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCargo = async (req: Request, res: Response): Promise<void> => {
  try {
    const cargoId = req.params.id;
    const { name, description, phone, location, website, imageUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cargoId)) {
      res.status(400).json({ error: "Invalid cargo ID" });
      return;
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const updateData: Record<string, string | undefined> = {
      name: name.trim(),
    };

    // Only update fields that were provided in the request
    if (description !== undefined) {
      updateData.description = description ? description.trim() : undefined;
    }
    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : undefined;
    }
    if (location !== undefined) {
      updateData.location = location ? location.trim() : undefined;
    }
    if (website !== undefined) {
      updateData.website = website ? website.trim() : undefined;
    }
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl ? imageUrl.trim() : undefined;
    }

    const cargo = await Cargo.findByIdAndUpdate(
      cargoId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!cargo) {
      res.status(404).json({ error: "Cargo not found" });
      return;
    }

    res.json({
      ...cargo,
      id: cargo._id.toString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: "Cargo with this name already exists" });
      return;
    }
    console.error("Error in PUT /admin/cargos/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCargo = async (req: Request, res: Response): Promise<void> => {
  try {
    const cargoId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(cargoId)) {
      res.status(400).json({ error: "Invalid cargo ID" });
      return;
    }

    const cargo = await Cargo.findByIdAndDelete(cargoId);

    if (!cargo) {
      res.status(404).json({ error: "Cargo not found" });
      return;
    }

    res.json({ message: "Cargo deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /admin/cargos/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
