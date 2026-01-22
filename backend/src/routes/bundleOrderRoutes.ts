import { Router } from "express";
import {
  getBundleOrders,
  getBundleOrder,
  createBundleOrder,
  updateBundleOrderStatus,
  updateBundleItemStatus,
  createBundleItemReport,
  createBundleReport,
  updateBundleTrackCode,
  confirmBundleUserPayment,
  cancelBundleOrder,
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
router.post("/:id/report", requireRole(["agent", "admin"]), createBundleReport);
router.put("/:id/track-code", requireRole(["agent", "admin"]), updateBundleTrackCode);
router.put("/:id/user-payment-confirmed", requireRole(["user", "admin"]), confirmBundleUserPayment);
router.put("/:id/cancel", requireRole(["user", "admin"]), cancelBundleOrder);
router.delete("/:id", requireRole(["user", "agent", "admin"]), deleteBundleOrder);

export default router;
