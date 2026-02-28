import { Router, Request, Response, NextFunction } from "express";
import {
  getOrders,
  getArchivedOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  updateTrackCode,
  confirmUserPayment,
  archiveOrder,
  purchasePackage,
  getDailyLimit,
} from "../controllers/orderController";
import { getAgentReport, createAgentReport, updateAgentReport, deleteAgentReport } from "../controllers/agentReportController";
import { requireRole } from "../middleware/requireRole";
import { validate, validateParams } from "../middleware/validate";
import { createOrderSchema, updateOrderStatusSchema, mongoIdSchema, agentReportSchema } from "../schemas";
import { orderLimiter } from "../middleware/rateLimit";

const router = Router();

// Rate limiter only for users, agents/admins bypass
const conditionalOrderLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === "agent" || req.user?.role === "admin") {
    return next();
  }
  return orderLimiter(req, res, next);
};

// Daily order limit info
router.get("/daily-limit", requireRole(["user", "agent", "admin"]), getDailyLimit);

// All order routes require authentication
router.get("/", requireRole(["user", "agent", "admin"]), getOrders);
router.get("/archived", requireRole(["user", "agent", "admin"]), getArchivedOrders);
router.get("/:id", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), getOrder);
router.post("/", requireRole(["user", "agent", "admin"]), conditionalOrderLimiter, validate(createOrderSchema), createOrder);
router.put("/:id/status", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), validate(updateOrderStatusSchema), updateOrderStatus);
router.put("/:id/track-code", requireRole(["agent", "admin"]), validateParams(mongoIdSchema), updateTrackCode);
router.put("/:id/user-payment-confirmed", requireRole("user"), validateParams(mongoIdSchema), confirmUserPayment);
router.get("/:id/report", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), getAgentReport);
router.post("/:id/report", requireRole(["agent", "admin"]), validateParams(mongoIdSchema), validate(agentReportSchema), createAgentReport);
router.put("/:id/report", requireRole(["agent", "admin"]), validateParams(mongoIdSchema), validate(agentReportSchema), updateAgentReport);
router.delete("/:id/report", requireRole(["agent", "admin"]), validateParams(mongoIdSchema), deleteAgentReport);
router.delete("/:id", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), deleteOrder);
router.put("/:id/archive", requireRole(["user", "agent", "admin"]), validateParams(mongoIdSchema), archiveOrder);

// Package purchase
router.post("/purchase-package", requireRole("user"), purchasePackage);

export default router;

