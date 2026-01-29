import { Request, Response } from "express";
import { cardService } from "../services/cardService";

// Get card balance
export const getCardBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { balance, error } = await cardService.getCardBalance(userId);
    if (error) {
      return res.status(400).json({ error });
    }

    return res.json({ success: true, data: { balance } });
  } catch (error) {
    console.error("Get card balance error:", error);
    return res.status(500).json({ error: "Failed to fetch card balance" });
  }
};

// Get card transaction history
export const getCardHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await cardService.getCardHistory(userId, page, limit);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get card history error:", error);
    return res.status(500).json({ error: "Failed to fetch card history" });
  }
};

// Gift cards (user/agent to user via phone)
export const giftCards = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { recipientPhone, amount } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!recipientPhone || !amount) {
      return res.status(400).json({ error: "Утасны дугаар болон карт тоо шаардлагатай" });
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: "Картын тоо буруу байна" });
    }

    const { success, error } = await cardService.giftCards(
      userId,
      role || "user",
      recipientPhone,
      parsedAmount
    );

    if (!success) {
      return res.status(400).json({ error });
    }

    return res.json({
      success: true,
      message: `${parsedAmount} карт амжилттай илгээгдлээ`,
    });
  } catch (error) {
    console.error("Gift cards error:", error);
    return res.status(500).json({ error: "Failed to gift cards" });
  }
};

// Admin gift cards (unlimited source)
export const adminGiftCards = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const role = req.user?.role;
    const { recipientPhone, amount } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ карт бэлэглэх боломжтой" });
    }

    if (!recipientPhone || !amount) {
      return res.status(400).json({ error: "Утасны дугаар болон карт тоо шаардлагатай" });
    }

    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: "Картын тоо буруу байна" });
    }

    const { success, error } = await cardService.adminGiftCards(
      adminId,
      recipientPhone,
      parsedAmount
    );

    if (!success) {
      return res.status(400).json({ error });
    }

    return res.json({
      success: true,
      message: `${parsedAmount} карт амжилттай бэлэглэгдлээ`,
    });
  } catch (error) {
    console.error("Admin gift cards error:", error);
    return res.status(500).json({ error: "Failed to gift cards" });
  }
};

// Admin: Grant cards to all existing users who have 0 cards
export const grantCardsToAllUsers = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const role = req.user?.role;
    const { amount } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (role !== "admin") {
      return res.status(403).json({ error: "Зөвхөн админ энэ үйлдлийг хийх боломжтой" });
    }

    const parsedAmount = amount ? parseInt(amount) : 5;
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: "Картын тоо буруу байна" });
    }

    const { success, usersUpdated, error } = await cardService.grantCardsToAllUsers(
      adminId,
      parsedAmount
    );

    if (!success) {
      return res.status(400).json({ error });
    }

    return res.json({
      success: true,
      message: `${usersUpdated} хэрэглэгчид ${parsedAmount} карт бэлэглэгдлээ`,
      data: { usersUpdated },
    });
  } catch (error) {
    console.error("Grant cards to all users error:", error);
    return res.status(500).json({ error: "Failed to grant cards" });
  }
};
