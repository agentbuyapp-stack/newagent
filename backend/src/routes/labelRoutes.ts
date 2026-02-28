import { Router } from "express";
import {
  getLabels,
  createLabel,
  deleteLabel,
  updateOrderLabel,
  bulkUpdateOrderLabel,
} from "../controllers/labelController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.get("/", requireRole(["user", "agent", "admin"]), getLabels);
router.post("/", requireRole(["user", "agent", "admin"]), createLabel);
router.delete("/:id", requireRole(["user", "agent", "admin"]), deleteLabel);

// Order label endpoints
router.put("/orders/:id", requireRole(["user", "agent", "admin"]), updateOrderLabel);
router.put("/orders-bulk", requireRole(["user", "agent", "admin"]), bulkUpdateOrderLabel);

export default router;
