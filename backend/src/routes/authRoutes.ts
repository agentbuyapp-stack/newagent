import { Router } from "express";
import { register, login, adminLogin, forgotPassword, verifyOtp, resetPassword, claimAccount, setupAdmin } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/claim-account", claimAccount);
router.post("/setup-admin", setupAdmin);

export default router;
