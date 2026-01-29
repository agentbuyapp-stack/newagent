import mongoose from "mongoose";
import { User, Profile, CardTransaction, CardTransactionType } from "../models";

const INITIAL_CARDS = 5;

export interface CardHistoryItem {
  id: string;
  fromUserId?: string;
  toUserId: string;
  amount: number;
  type: CardTransactionType;
  recipientPhone?: string;
  orderId?: string;
  note?: string;
  createdAt: Date;
  fromUserName?: string;
  toUserName?: string;
}

export interface CardHistoryResponse {
  transactions: CardHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CardService {
  /**
   * Get user's card balance
   */
  async getCardBalance(userId: string): Promise<{ balance: number; error?: string }> {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        return { balance: 0, error: "User not found" };
      }
      return { balance: user.researchCards || 0 };
    } catch (error: any) {
      console.error("CardService.getCardBalance error:", error);
      return { balance: 0, error: error.message };
    }
  }

  /**
   * Grant initial cards to new user (5 cards)
   */
  async grantInitialCards(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Only grant if user has 0 cards and is a regular user
      if (user.role !== "user") {
        return { success: true }; // Agents/admins don't need cards
      }

      // Update user's card balance
      user.researchCards = INITIAL_CARDS;
      await user.save();

      // Create transaction record
      await CardTransaction.create({
        toUserId: new mongoose.Types.ObjectId(userId),
        amount: INITIAL_CARDS,
        type: "initial_grant",
        note: "Шинэ хэрэглэгчийн урамшуулал",
      });

      return { success: true };
    } catch (error: any) {
      console.error("CardService.grantInitialCards error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gift cards from user/agent to another user (by phone number)
   */
  async giftCards(
    fromUserId: string,
    fromRole: string,
    recipientPhone: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount < 1) {
        return { success: false, error: "Хамгийн багадаа 1 карт илгээх боломжтой" };
      }

      // Find sender
      const sender = await User.findById(fromUserId).session(session);
      if (!sender) {
        await session.abortTransaction();
        return { success: false, error: "Илгээгч олдсонгүй" };
      }

      // Check sender has enough cards (users and agents both need cards)
      if ((fromRole === "user" || fromRole === "agent") && (sender.researchCards || 0) < amount) {
        await session.abortTransaction();
        return { success: false, error: "Таны картын үлдэгдэл хүрэлцэхгүй байна" };
      }

      // Find recipient by phone
      const recipientProfile = await Profile.findOne({ phone: recipientPhone }).session(session);
      if (!recipientProfile) {
        await session.abortTransaction();
        return { success: false, error: "Хүлээн авагч олдсонгүй. Утасны дугаараа шалгана уу." };
      }

      const recipient = await User.findById(recipientProfile.userId).session(session);
      if (!recipient) {
        await session.abortTransaction();
        return { success: false, error: "Хүлээн авагчийн хэрэглэгч олдсонгүй" };
      }

      // Can't send to self
      if (recipient._id.toString() === fromUserId) {
        await session.abortTransaction();
        return { success: false, error: "Өөртөө карт илгээх боломжгүй" };
      }

      // Deduct from sender (users and agents both have their own cards)
      if (fromRole === "user" || fromRole === "agent") {
        sender.researchCards = (sender.researchCards || 0) - amount;
        await sender.save({ session });
      }

      // Add to recipient
      recipient.researchCards = (recipient.researchCards || 0) + amount;
      await recipient.save({ session });

      // Create transaction record
      const transactionType: CardTransactionType = fromRole === "agent" ? "agent_gift" : "user_transfer";
      await CardTransaction.create(
        [
          {
            fromUserId: new mongoose.Types.ObjectId(fromUserId),
            toUserId: recipient._id,
            amount,
            type: transactionType,
            recipientPhone,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("CardService.giftCards error:", error);
      return { success: false, error: error.message };
    } finally {
      session.endSession();
    }
  }

  /**
   * Admin gift cards (unlimited source)
   */
  async adminGiftCards(
    adminId: string,
    recipientPhone: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (amount < 1) {
        return { success: false, error: "Хамгийн багадаа 1 карт илгээх боломжтой" };
      }

      // Find recipient by phone
      const recipientProfile = await Profile.findOne({ phone: recipientPhone }).session(session);
      if (!recipientProfile) {
        await session.abortTransaction();
        return { success: false, error: "Хүлээн авагч олдсонгүй. Утасны дугаараа шалгана уу." };
      }

      const recipient = await User.findById(recipientProfile.userId).session(session);
      if (!recipient) {
        await session.abortTransaction();
        return { success: false, error: "Хүлээн авагчийн хэрэглэгч олдсонгүй" };
      }

      // Add to recipient
      recipient.researchCards = (recipient.researchCards || 0) + amount;
      await recipient.save({ session });

      // Create transaction record
      await CardTransaction.create(
        [
          {
            fromUserId: new mongoose.Types.ObjectId(adminId),
            toUserId: recipient._id,
            amount,
            type: "admin_gift",
            recipientPhone,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("CardService.adminGiftCards error:", error);
      return { success: false, error: error.message };
    } finally {
      session.endSession();
    }
  }

  /**
   * Deduct 1 card for order creation
   */
  async deductCardForOrder(
    userId: string,
    orderId: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        return { success: false, error: "Хэрэглэгч олдсонгүй" };
      }

      // Check if user has cards
      if ((user.researchCards || 0) < 1) {
        await session.abortTransaction();
        return { success: false, error: "Судалгааны карт хүрэлцэхгүй байна" };
      }

      // Deduct 1 card
      user.researchCards = (user.researchCards || 0) - 1;
      await user.save({ session });

      // Create transaction record
      await CardTransaction.create(
        [
          {
            toUserId: new mongoose.Types.ObjectId(userId),
            amount: 1,
            type: "order_deduction",
            orderId: new mongoose.Types.ObjectId(orderId),
            note: "Захиалга үүсгэхэд зарцуулагдсан",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("CardService.deductCardForOrder error:", error);
      return { success: false, error: error.message };
    } finally {
      session.endSession();
    }
  }

  /**
   * Check if user has enough cards for order
   */
  async hasCardsForOrder(userId: string, role: string): Promise<boolean> {
    // Agents and admins don't need cards
    if (role !== "user") {
      return true;
    }

    const { balance } = await this.getCardBalance(userId);
    return balance >= 1;
  }

  /**
   * Check if user has enough cards for N items (bundle order)
   */
  async hasEnoughCards(userId: string, role: string, amount: number): Promise<boolean> {
    // Agents and admins don't need cards
    if (role !== "user") {
      return true;
    }

    const { balance } = await this.getCardBalance(userId);
    return balance >= amount;
  }

  /**
   * Deduct multiple cards for bundle order (1 card per item)
   */
  async deductCardsForBundleOrder(
    userId: string,
    orderId: string,
    itemCount: number
  ): Promise<{ success: boolean; error?: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        return { success: false, error: "Хэрэглэгч олдсонгүй" };
      }

      // Check if user has enough cards
      if ((user.researchCards || 0) < itemCount) {
        await session.abortTransaction();
        return { success: false, error: "Судалгааны карт хүрэлцэхгүй байна" };
      }

      // Deduct cards
      user.researchCards = (user.researchCards || 0) - itemCount;
      await user.save({ session });

      // Create transaction record
      await CardTransaction.create(
        [
          {
            toUserId: new mongoose.Types.ObjectId(userId),
            amount: itemCount,
            type: "order_deduction",
            orderId: new mongoose.Types.ObjectId(orderId),
            note: `Багц захиалга үүсгэхэд зарцуулагдсан (${itemCount} бараа)`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("CardService.deductCardsForBundleOrder error:", error);
      return { success: false, error: error.message };
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund cards for successful order (when agentPaymentPaid is true)
   */
  async refundCardsForOrder(
    userId: string,
    orderId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        return { success: false, error: "Хэрэглэгч олдсонгүй" };
      }

      // Add cards back to user
      user.researchCards = (user.researchCards || 0) + amount;
      await user.save({ session });

      // Create transaction record
      await CardTransaction.create(
        [
          {
            toUserId: new mongoose.Types.ObjectId(userId),
            amount,
            type: "order_refund",
            orderId: new mongoose.Types.ObjectId(orderId),
            note: `Амжилттай захиалгын карт буцаалт (${amount} карт)`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("CardService.refundCardsForOrder error:", error);
      return { success: false, error: error.message };
    } finally {
      session.endSession();
    }
  }

  /**
   * Burn card when item is removed from bundle (card is NOT refunded)
   * This creates a transaction record for tracking but doesn't return the card
   */
  async burnCardForRemovedItem(
    userId: string,
    orderId: string,
    itemId: string,
    itemName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create transaction record (card is already deducted, just record the removal)
      await CardTransaction.create({
        toUserId: new mongoose.Types.ObjectId(userId),
        amount: 1,
        type: "bundle_item_removal",
        orderId: new mongoose.Types.ObjectId(orderId),
        note: `Багцаас хасагдсан: ${itemName} (item: ${itemId})`,
      });

      return { success: true };
    } catch (error: any) {
      console.error("CardService.burnCardForRemovedItem error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get card transaction history
   */
  async getCardHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<CardHistoryResponse> {
    try {
      const skip = (page - 1) * limit;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const [transactionsRaw, total] = await Promise.all([
        CardTransaction.find({
          $or: [{ fromUserId: userObjectId }, { toUserId: userObjectId }],
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CardTransaction.countDocuments({
          $or: [{ fromUserId: userObjectId }, { toUserId: userObjectId }],
        }),
      ]);

      // Get user names for transactions
      const userIds = new Set<string>();
      transactionsRaw.forEach((t: any) => {
        if (t.fromUserId) userIds.add(t.fromUserId.toString());
        if (t.toUserId) userIds.add(t.toUserId.toString());
      });

      const profiles = await Profile.find({
        userId: { $in: Array.from(userIds).map((id) => new mongoose.Types.ObjectId(id)) },
      }).lean();
      const profileMap = new Map(profiles.map((p: any) => [p.userId.toString(), p.name]));

      // Format transactions
      const transactions: CardHistoryItem[] = transactionsRaw.map((t: any) => ({
        id: t._id.toString(),
        fromUserId: t.fromUserId?.toString(),
        toUserId: t.toUserId.toString(),
        amount: t.amount,
        type: t.type,
        recipientPhone: t.recipientPhone,
        orderId: t.orderId?.toString(),
        note: t.note,
        createdAt: t.createdAt,
        fromUserName: t.fromUserId ? profileMap.get(t.fromUserId.toString()) : undefined,
        toUserName: profileMap.get(t.toUserId.toString()),
      }));

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error("CardService.getCardHistory error:", error);
      return {
        transactions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
  }

  /**
   * Grant cards to all existing users (admin action)
   * Adds the specified amount to each user's existing balance
   */
  async grantCardsToAllUsers(adminId: string, amount: number = INITIAL_CARDS): Promise<{
    success: boolean;
    usersUpdated: number;
    error?: string
  }> {
    try {
      // Find all users with role "user"
      const usersToUpdate = await User.find({ role: "user" });

      if (usersToUpdate.length === 0) {
        return { success: true, usersUpdated: 0 };
      }

      // Update all users - ADD cards to existing balance
      const updatePromises = usersToUpdate.map(async (user) => {
        user.researchCards = (user.researchCards || 0) + amount;
        await user.save();

        // Create transaction record
        await CardTransaction.create({
          fromUserId: new mongoose.Types.ObjectId(adminId),
          toUserId: user._id,
          amount,
          type: "admin_gift",
          note: "Бүх хэрэглэгчдэд урамшуулал",
        });
      });

      await Promise.all(updatePromises);

      return { success: true, usersUpdated: usersToUpdate.length };
    } catch (error: any) {
      console.error("CardService.grantCardsToAllUsers error:", error);
      return { success: false, usersUpdated: 0, error: error.message };
    }
  }
}

// Export singleton instance
export const cardService = new CardService();
