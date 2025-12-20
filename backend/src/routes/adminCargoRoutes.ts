import { Router } from "express";
import {
  getAdminCargos,
  createCargo,
  updateCargo,
  deleteCargo,
} from "../controllers/cargoController";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Admin cargo management routes
router.get("/", requireRole("admin"), getAdminCargos);
router.post("/", requireRole("admin"), createCargo);
router.put("/:id", requireRole("admin"), updateCargo);
router.delete("/:id", requireRole("admin"), deleteCargo);

export default router;

