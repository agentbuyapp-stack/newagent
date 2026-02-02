import { Router } from "express";
import {
  getAllBanners,
  getActiveBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from "../controllers/bannerController";

const router = Router();

// Public route - get active banners for users/agents
router.get("/active", getActiveBanners);

// Admin routes
router.get("/", getAllBanners);
router.post("/", createBanner);
router.put("/:id", updateBanner);
router.delete("/:id", deleteBanner);
router.patch("/:id/toggle", toggleBannerStatus);

export default router;
