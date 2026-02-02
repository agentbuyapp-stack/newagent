import { Request, Response } from "express";
import { ProductShowcase } from "../models";

// Helper to transform showcase for JSON response
const transformShowcase = (doc: any) => ({
  ...doc,
  id: doc._id?.toString() || doc.id,
});

// Get all showcases (admin)
export const getAllShowcases = async (_req: Request, res: Response) => {
  try {
    const showcases = await ProductShowcase.find().sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ success: true, data: showcases.map(transformShowcase) });
  } catch (error) {
    console.error("Get all showcases error:", error);
    return res.status(500).json({ error: "Failed to fetch showcases" });
  }
};

// Get active showcases for users
export const getActiveShowcases = async (_req: Request, res: Response) => {
  try {
    const showcases = await ProductShowcase.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return res.json({ success: true, data: showcases.map(transformShowcase) });
  } catch (error) {
    console.error("Get active showcases error:", error);
    return res.status(500).json({ error: "Failed to fetch showcases" });
  }
};

// Create showcase (admin)
export const createShowcase = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { title, products, isActive, order } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Гарчиг шаардлагатай" });
    }

    const showcase = await ProductShowcase.create({
      title,
      products: products || [],
      isActive: isActive !== false,
      order: order || 0,
    });

    return res.json({ success: true, data: transformShowcase(showcase.toObject()), message: "Showcase амжилттай үүслээ" });
  } catch (error) {
    console.error("Create showcase error:", error);
    return res.status(500).json({ error: "Failed to create showcase" });
  }
};

// Update showcase (admin)
export const updateShowcase = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { id } = req.params;
    const { title, products, isActive, order } = req.body;

    const showcase = await ProductShowcase.findByIdAndUpdate(
      id,
      { title, products, isActive, order },
      { new: true, lean: true }
    );

    if (!showcase) {
      return res.status(404).json({ error: "Showcase олдсонгүй" });
    }

    return res.json({ success: true, data: transformShowcase(showcase), message: "Showcase амжилттай шинэчлэгдлээ" });
  } catch (error) {
    console.error("Update showcase error:", error);
    return res.status(500).json({ error: "Failed to update showcase" });
  }
};

// Delete showcase (admin)
export const deleteShowcase = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { id } = req.params;
    const showcase = await ProductShowcase.findByIdAndDelete(id);

    if (!showcase) {
      return res.status(404).json({ error: "Showcase олдсонгүй" });
    }

    return res.json({ success: true, message: "Showcase амжилттай устгагдлаа" });
  } catch (error) {
    console.error("Delete showcase error:", error);
    return res.status(500).json({ error: "Failed to delete showcase" });
  }
};

// Toggle showcase status (admin)
export const toggleShowcaseStatus = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { id } = req.params;
    const showcase = await ProductShowcase.findById(id);

    if (!showcase) {
      return res.status(404).json({ error: "Showcase олдсонгүй" });
    }

    showcase.isActive = !showcase.isActive;
    await showcase.save();

    return res.json({
      success: true,
      data: transformShowcase(showcase.toObject()),
      message: showcase.isActive ? "Showcase идэвхжүүллээ" : "Showcase идэвхгүй боллоо"
    });
  } catch (error) {
    console.error("Toggle showcase status error:", error);
    return res.status(500).json({ error: "Failed to toggle showcase status" });
  }
};
