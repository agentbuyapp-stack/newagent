import { Router } from "express";
import {
  getNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendTestEmail,
} from "../controllers/notificationController";

const router = Router();

// Get all notifications (paginated)
router.get("/", getNotifications);

// Get unread count
router.get("/count", getNotificationCount);

// Mark single notification as read
router.put("/:notificationId/read", markAsRead);

// Mark all as read
router.put("/read-all", markAllAsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

// Send test email
router.post("/test-email", sendTestEmail);

export default router;
