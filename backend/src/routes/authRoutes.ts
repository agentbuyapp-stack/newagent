import { Router } from "express";
import { register } from "../controllers/authController";

const router = Router();

// Public routes only
router.post("/register", register);

export default router;

