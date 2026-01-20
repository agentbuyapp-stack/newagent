import { Request, Response } from "express";
import { Cargo } from "../models";
import mongoose from "mongoose";

export const getCargos = async (req: Request, res: Response) => {
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

export const getAdminCargos = async (req: Request, res: Response) => {
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

export const createCargo = async (req: Request, res: Response) => {
  try {
    const { name, description, phone, location, website } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    const cargo = await Cargo.create({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      location: location ? location.trim() : undefined,
      website: website ? website.trim() : undefined,
    });

    res.status(201).json({
      ...cargo.toObject(),
      id: cargo._id.toString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Cargo with this name already exists" });
    }
    console.error("Error in POST /admin/cargos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCargo = async (req: Request, res: Response) => {
  try {
    const cargoId = req.params.id;
    const { name, description, phone, location, website } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cargoId)) {
      return res.status(400).json({ error: "Invalid cargo ID" });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
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

    const cargo = await Cargo.findByIdAndUpdate(
      cargoId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!cargo) {
      return res.status(404).json({ error: "Cargo not found" });
    }

    res.json({
      ...cargo,
      id: cargo._id.toString(),
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Cargo with this name already exists" });
    }
    console.error("Error in PUT /admin/cargos/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCargo = async (req: Request, res: Response) => {
  try {
    const cargoId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(cargoId)) {
      return res.status(400).json({ error: "Invalid cargo ID" });
    }

    const cargo = await Cargo.findByIdAndDelete(cargoId);

    if (!cargo) {
      return res.status(404).json({ error: "Cargo not found" });
    }

    res.json({ message: "Cargo deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /admin/cargos/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

