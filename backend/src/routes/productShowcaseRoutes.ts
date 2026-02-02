import { Router } from "express";
import {
  getAllShowcases,
  getActiveShowcases,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  toggleShowcaseStatus,
} from "../controllers/productShowcaseController";

const router = Router();

// Public route - get active showcases
router.get("/active", getActiveShowcases);

// Admin routes
router.get("/", getAllShowcases);
router.post("/", createShowcase);
router.put("/:id", updateShowcase);
router.delete("/:id", deleteShowcase);
router.patch("/:id/toggle", toggleShowcaseStatus);

export default router;
