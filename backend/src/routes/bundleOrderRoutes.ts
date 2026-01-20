import { Router } from "express";
import {
  getBundleOrders,
  getBundleOrder,
  createBundleOrder,
  updateBundleOrderStatus,
  updateBundleItemStatus,
  createBundleItemReport,
  updateBundleTrackCode,
  deleteBundleOrder,
} from "../controllers/bundleOrderController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// All bundle order routes require authentication
router.get("/", requireRole(["user", "agent", "admin"]), getBundleOrders);
router.get("/:id", requireRole(["user", "agent", "admin"]), getBundleOrder);
router.post("/", requireRole(["user", "admin"]), createBundleOrder);
router.put("/:id/status", requireRole(["agent", "admin"]), updateBundleOrderStatus);
router.put("/:id/items/:itemId/status", requireRole(["agent", "admin"]), updateBundleItemStatus);
router.post("/:id/items/:itemId/report", requireRole(["agent", "admin"]), createBundleItemReport);
router.put("/:id/track-code", requireRole(["agent", "admin"]), updateBundleTrackCode);
router.delete("/:id", requireRole(["user", "agent", "admin"]), deleteBundleOrder);

export default router;
