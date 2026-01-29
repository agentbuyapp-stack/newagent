import { Router } from "express";
import {
  getCardBalance,
  getCardHistory,
  giftCards,
  adminGiftCards,
  grantCardsToAllUsers,
} from "../controllers/cardController";

const router = Router();

// Get card balance
router.get("/balance", getCardBalance);

// Get card transaction history
router.get("/history", getCardHistory);

// Gift cards (user/agent to user via phone)
router.post("/gift", giftCards);

// Admin gift cards (unlimited source)
router.post("/admin/gift", adminGiftCards);

// Admin: Grant cards to all existing users who have 0 cards
router.post("/admin/grant-all", grantCardsToAllUsers);

export default router;
