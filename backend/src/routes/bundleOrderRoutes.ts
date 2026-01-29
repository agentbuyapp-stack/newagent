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
  removeItemFromBundle,
  deleteBundleOrder,
  archiveBundleOrder,
} from "../controllers/bundleOrderController";
import { requireRole } from "../middleware/requireRole";
import { validate, validateParams } from "../middleware/validate";
import { createBundleOrderSchema, mongoIdSchema } from "../schemas";
import { orderLimiter } from "../middleware/rateLimit";

const router = Router();

// All bundle order routes require authentication
router.get("/", requireRole(["user", "agent", "admin"]), getBundleOrders);
router.get("/:id", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), getBundleOrder);
router.post("/", requireRole(["user", "admin"]), orderLimiter, validate(createBundleOrderSchema), createBundleOrder);
router.put("/:id/status", requireRole(["agent", "admin"]), validateParams(mongoIdSchema), updateBundleOrderStatus);
router.put("/:id/items/:itemId/status", requireRole(["agent", "admin"]), updateBundleItemStatus);
router.post("/:id/items/:itemId/report", requireRole(["agent", "admin"]), createBundleItemReport);
router.post("/:id/report", requireRole(["agent", "admin"]), validateParams(mongoIdSchema), createBundleReport);
router.put("/:id/track-code", requireRole(["agent", "admin"]), validateParams(mongoIdSchema), updateBundleTrackCode);
router.put("/:id/user-payment-confirmed", requireRole(["user", "admin"]), validateParams(mongoIdSchema), confirmBundleUserPayment);
router.put("/:id/cancel", requireRole(["user", "admin"]), validateParams(mongoIdSchema), cancelBundleOrder);
router.put("/:id/archive", requireRole(["user", "admin"]), validateParams(mongoIdSchema), archiveBundleOrder);
router.delete("/:id/items/:itemId", requireRole(["user", "admin"]), removeItemFromBundle);
router.delete("/:id", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), deleteBundleOrder);

export default router;
