import { Request, Response } from "express";
import { Notification, User, Profile } from "../models";
import mongoose from "mongoose";

// Get notifications for current user with pagination
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
    ]);

    const formattedNotifications = notifications.map((n: any) => ({
      id: n._id.toString(),
      userId: n.userId.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      orderId: n.orderId?.toString(),
      isRead: n.isRead,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    return res.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get unread notification count
export const getNotificationCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Get notification count error:", error);
    return res.status(500).json({ error: "Failed to fetch notification count" });
  }
};

// Mark single notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json({
      success: true,
      data: {
        id: (notification as any)._id.toString(),
        userId: (notification as any).userId.toString(),
        type: (notification as any).type,
        title: (notification as any).title,
        message: (notification as any).message,
        orderId: (notification as any).orderId?.toString(),
        isRead: (notification as any).isRead,
        createdAt: (notification as any).createdAt,
        updatedAt: (notification as any).updatedAt,
      },
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Helper function to create notification (used by other controllers)
export const createNotification = async (
  userId: string | mongoose.Types.ObjectId,
  type: string,
  title: string,
  message: string,
  orderId?: string | mongoose.Types.ObjectId
) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      orderId,
    });
    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

// Send test email notification (placeholder)
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get user profile for email
    const user = await User.findById(userId).lean();
    const profile = await Profile.findOne({ userId }).lean();

    if (!user || !profile) {
      return res.status(404).json({ error: "User or profile not found" });
    }

    // TODO: Implement actual email sending with nodemailer
    // For now, just return success
    return res.json({
      success: true,
      message: `Test email would be sent to ${(profile as any).email || (user as any).email}`,
    });
  } catch (error) {
    console.error("Send test email error:", error);
    return res.status(500).json({ error: "Failed to send test email" });
  }
};
