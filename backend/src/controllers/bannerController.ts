import { Request, Response } from "express";
import { Banner, BannerType, BannerTarget } from "../models";

// Get all banners (admin)
export const getAllBanners = async (_req: Request, res: Response) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ success: true, data: banners });
  } catch (error) {
    console.error("Get all banners error:", error);
    return res.status(500).json({ error: "Failed to fetch banners" });
  }
};

// Get active banners for users/agents
export const getActiveBanners = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role || "user";

    const banners = await Banner.find({
      isActive: true,
      $or: [
        { targetAudience: "all" },
        { targetAudience: userRole },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({ success: true, data: banners });
  } catch (error) {
    console.error("Get active banners error:", error);
    return res.status(500).json({ error: "Failed to fetch banners" });
  }
};

// Create banner (admin)
export const createBanner = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { title, subtitle, type, url, thumbnailUrl, isActive, order, targetAudience } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({ error: "Гарчиг, төрөл, URL шаардлагатай" });
    }

    const banner = await Banner.create({
      title,
      subtitle,
      type: type as BannerType,
      url,
      thumbnailUrl,
      isActive: isActive !== false,
      order: order || 0,
      targetAudience: (targetAudience as BannerTarget) || "all",
    });

    return res.json({ success: true, data: banner, message: "Баннер амжилттай үүслээ" });
  } catch (error) {
    console.error("Create banner error:", error);
    return res.status(500).json({ error: "Failed to create banner" });
  }
};

// Update banner (admin)
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { id } = req.params;
    const { title, subtitle, type, url, thumbnailUrl, isActive, order, targetAudience } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      id,
      {
        title,
        subtitle,
        type,
        url,
        thumbnailUrl,
        isActive,
        order,
        targetAudience,
      },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ error: "Баннер олдсонгүй" });
    }

    return res.json({ success: true, data: banner, message: "Баннер амжилттай шинэчлэгдлээ" });
  } catch (error) {
    console.error("Update banner error:", error);
    return res.status(500).json({ error: "Failed to update banner" });
  }
};

// Delete banner (admin)
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ error: "Баннер олдсонгүй" });
    }

    return res.json({ success: true, message: "Баннер амжилттай устгагдлаа" });
  } catch (error) {
    console.error("Delete banner error:", error);
    return res.status(500).json({ error: "Failed to delete banner" });
  }
};

// Toggle banner active status (admin)
export const toggleBannerStatus = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ" });
    }

    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ error: "Баннер олдсонгүй" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.json({
      success: true,
      data: banner,
      message: banner.isActive ? "Баннер идэвхжүүллээ" : "Баннер идэвхгүй боллоо"
    });
  } catch (error) {
    console.error("Toggle banner status error:", error);
    return res.status(500).json({ error: "Failed to toggle banner status" });
  }
};
