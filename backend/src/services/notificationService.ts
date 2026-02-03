import mongoose from "mongoose";
import { Notification, NotificationType } from "../models/Notification";
import { Profile } from "../models/Profile";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { OrderNotificationBatch } from "../models/OrderNotificationBatch";
import {
  sendEmail,
  emailTemplates,
  isEmailNotificationEnabled,
} from "./emailService";

// Create notification and optionally send email
export const createNotification = async (
  userId: mongoose.Types.ObjectId | string,
  type: NotificationType,
  title: string,
  message: string,
  orderId?: mongoose.Types.ObjectId | string,
  sendEmailNotification: boolean = true
) => {
  // Create in-app notification
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    orderId,
  });

  // Send email if enabled
  if (sendEmailNotification) {
    const emailEnabled = await isEmailNotificationEnabled(userId);
    if (emailEnabled) {
      const profile = await Profile.findOne({ userId });
      if (profile?.email) {
        await sendEmail(profile.email, title, message);
      }
    }
  }

  return notification;
};

// Get user notifications
export const getUserNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [notificationsRaw, total] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
  ]);

  // Transform _id to id for frontend compatibility
  const notifications = notificationsRaw.map((n: any) => ({
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

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get unread count
export const getUnreadCount = async (userId: string): Promise<number> => {
  return await Notification.countDocuments({ userId, isRead: false });
};

// Mark notification as read
export const markAsRead = async (notificationId: string, userId: string) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }
  return await Notification.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(notificationId), userId },
    { isRead: true },
    { new: true }
  );
};

// Mark all as read
export const markAllAsRead = async (userId: string) => {
  return await Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

// Delete notification
export const deleteNotification = async (notificationId: string, userId: string) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }
  return await Notification.findOneAndDelete({ _id: new mongoose.Types.ObjectId(notificationId), userId });
};

// ============ Specific notification functions ============

// Notify user: Agent sent report
export const notifyUserAgentReportSent = async (
  userId: mongoose.Types.ObjectId,
  orderId: mongoose.Types.ObjectId,
  productName: string,
  agentName: string
) => {
  const template = emailTemplates.agentReportSent(orderId.toString(), productName);

  return await createNotification(
    userId,
    "agent_report_sent",
    template.subject,
    `${agentName} agent таны "${productName}" захиалгад тайлан илгээлээ.`,
    orderId
  );
};

// Notify user: Agent cancelled order
export const notifyUserAgentCancelled = async (
  userId: mongoose.Types.ObjectId,
  orderId: mongoose.Types.ObjectId,
  productName: string,
  cancelReason?: string
) => {
  const template = emailTemplates.agentCancelledOrder(orderId.toString(), productName);

  const message = cancelReason
    ? `Таны "${productName}" захиалгыг agent цуцаллаа. Шалтгаан: ${cancelReason}`
    : `Таны "${productName}" захиалгыг agent цуцаллаа.`;

  return await createNotification(
    userId,
    "agent_cancelled_order",
    template.subject,
    message,
    orderId
  );
};

// Notify user: Admin cancelled order
export const notifyUserAdminCancelled = async (
  userId: mongoose.Types.ObjectId,
  orderId: mongoose.Types.ObjectId,
  productName: string
) => {
  const template = emailTemplates.adminCancelledOrder(orderId.toString(), productName);

  return await createNotification(
    userId,
    "admin_cancelled_order",
    template.subject,
    `Таны "${productName}" захиалгыг админ цуцаллаа.`,
    orderId
  );
};

// Notify user: Track code added
export const notifyUserTrackCodeAdded = async (
  userId: mongoose.Types.ObjectId,
  orderId: mongoose.Types.ObjectId,
  productName: string,
  trackCode: string
) => {
  const template = emailTemplates.trackCodeAdded(orderId.toString(), productName, trackCode);

  return await createNotification(
    userId,
    "agent_added_track_code",
    template.subject,
    `Таны "${productName}" захиалгад track код оруулагдлаа: ${trackCode}`,
    orderId
  );
};

// Notify agent: Payment verified
export const notifyAgentPaymentVerified = async (
  agentId: mongoose.Types.ObjectId,
  orderId: mongoose.Types.ObjectId,
  productName: string,
  amount: number
) => {
  const template = emailTemplates.paymentVerified(orderId.toString(), productName, amount);

  return await createNotification(
    agentId,
    "payment_verified",
    template.subject,
    `"${productName}" захиалгын ¥${amount} төлбөр баталгаажлаа.`,
    orderId
  );
};

// Notify admin: Payment verification request
export const notifyAdminPaymentRequest = async (
  orderId: mongoose.Types.ObjectId,
  productName: string,
  userName: string
) => {
  // Get all admins
  const admins = await User.find({ role: "admin" }).lean();

  if (admins.length === 0) return;

  const template = emailTemplates.paymentVerificationRequest(
    orderId.toString(),
    productName,
    userName
  );

  const message = `${userName} хэрэглэгч "${productName}" захиалгын төлбөр баталгаажуулах хүсэлт илгээлээ.`;

  // Bulk insert notifications (avoid N+1)
  const notifications = admins.map((admin) => ({
    userId: admin._id,
    type: "payment_verification_request" as const,
    title: template.subject,
    message,
    orderId,
  }));
  await Notification.insertMany(notifications);

  // Send emails in parallel
  await Promise.all(
    admins.map(async (admin) => {
      const emailEnabled = await isEmailNotificationEnabled(admin._id);
      if (emailEnabled) {
        const profile = await Profile.findOne({ userId: admin._id }).lean();
        if (profile?.email) {
          await sendEmail(profile.email, template.subject, message);
        }
      }
    })
  );
};

// Notify admin: Reward request
export const notifyAdminRewardRequest = async (
  _agentId: mongoose.Types.ObjectId,
  agentName: string,
  amount: number
) => {
  // Get all admins
  const admins = await User.find({ role: "admin" }).lean();

  if (admins.length === 0) return;

  const template = emailTemplates.rewardRequest(agentName, amount);
  const message = `${agentName} agent ${amount} оноо татах хүсэлт илгээлээ.`;

  // Bulk insert notifications (avoid N+1)
  const notifications = admins.map((admin) => ({
    userId: admin._id,
    type: "reward_request" as const,
    title: template.subject,
    message,
  }));
  await Notification.insertMany(notifications);

  // Send emails in parallel
  await Promise.all(
    admins.map(async (admin) => {
      const emailEnabled = await isEmailNotificationEnabled(admin._id);
      if (emailEnabled) {
        const profile = await Profile.findOne({ userId: admin._id }).lean();
        if (profile?.email) {
          await sendEmail(profile.email, template.subject, message);
        }
      }
    })
  );
};

// ============ New order notification to agents (Top 5 -> Top 6-10 logic) ============

// Get top agents by order total amount (for new order notification)
export const getTopAgentsByOrderAmount = async (
  skip: number = 0,
  limit: number = 5
): Promise<mongoose.Types.ObjectId[]> => {
  // Get approved agents sorted by total order amounts they've handled
  const agents = await User.aggregate([
    { $match: { role: "agent", isApproved: true } },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "agentId",
        as: "orders",
      },
    },
    {
      $lookup: {
        from: "agent_reports",
        localField: "orders._id",
        foreignField: "orderId",
        as: "reports",
      },
    },
    {
      $addFields: {
        totalOrderAmount: { $sum: "$reports.userAmount" },
      },
    },
    { $sort: { totalOrderAmount: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);

  return agents.map((a) => a._id);
};

// Notify top agents about new order
export const notifyAgentsNewOrder = async (
  orderId: mongoose.Types.ObjectId,
  productName: string,
  estimatedAmount: number,
  batchNumber: 1 | 2 = 1
) => {
  console.log(`[NotifyAgents] Starting notification for order ${orderId}, batch ${batchNumber}`);

  const skip = batchNumber === 1 ? 0 : 5;
  const limit = 5;
  const expiresInMinutes = 10;

  // Get top agents
  const agentIds = await getTopAgentsByOrderAmount(skip, limit);
  console.log(`[NotifyAgents] Found ${agentIds.length} agents:`, agentIds.map(id => id.toString()));

  if (agentIds.length === 0) {
    console.log(`[NotifyAgents] No approved agents found for batch ${batchNumber}`);
    return null;
  }

  // Create batch record
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const batch = await OrderNotificationBatch.create({
    orderId,
    batchNumber,
    notifiedAgentIds: agentIds,
    status: "active",
    expiresAt,
  });

  // Get agent profiles for email - first check ALL profiles for these agents
  const allProfiles = await Profile.find({
    userId: { $in: agentIds },
  });
  console.log(`[NotifyAgents] All profiles for agents:`,
    allProfiles.map(p => ({
      userId: p.userId.toString(),
      email: p.email,
      emailEnabled: p.emailNotificationsEnabled
    })));

  // Filter by email enabled
  const profiles = allProfiles.filter(p => p.emailNotificationsEnabled !== false);
  console.log(`[NotifyAgents] Found ${profiles.length} profiles with email enabled`);

  const template = emailTemplates.newOrderAvailable(
    orderId.toString(),
    productName,
    estimatedAmount,
    expiresInMinutes
  );

  // Send notifications to each agent
  for (const agentId of agentIds) {
    // In-app notification
    await Notification.create({
      userId: agentId,
      type: "new_order_available",
      title: template.subject,
      message: `Шинэ захиалга: "${productName}" - ¥${estimatedAmount}. ${expiresInMinutes} минутын дотор авна уу.`,
      orderId,
    });
    console.log(`[NotifyAgents] Created in-app notification for agent ${agentId}`);

    // Email notification
    const profile = profiles.find(
      (p) => p.userId.toString() === agentId.toString()
    );
    if (profile?.email) {
      console.log(`[NotifyAgents] Sending email to ${profile.email}`);
      const result = await sendEmail(profile.email, template.subject, template.body, template.html);
      console.log(`[NotifyAgents] Email result:`, result);
    } else {
      console.log(`[NotifyAgents] No email found for agent ${agentId} or email notifications disabled`);
    }
  }

  console.log(
    `[NotifyAgents] Completed - Notified ${agentIds.length} agents (batch ${batchNumber}) for order ${orderId}`
  );

  return batch;
};

// Mark order as assigned (stops further notifications)
export const markOrderAssigned = async (
  orderId: mongoose.Types.ObjectId,
  agentId: mongoose.Types.ObjectId
) => {
  await OrderNotificationBatch.updateMany(
    { orderId, status: "active" },
    { status: "assigned", assignedToAgentId: agentId }
  );
};

// Check and process expired batches (called by cron)
export const processExpiredBatches = async () => {
  const now = new Date();

  // Find expired batch 1 that hasn't been assigned
  const expiredBatch1 = await OrderNotificationBatch.find({
    batchNumber: 1,
    status: "active",
    expiresAt: { $lte: now },
  });

  for (const batch of expiredBatch1) {
    // Mark as expired
    batch.status = "expired";
    await batch.save();

    // Check if order is still available (status = niitlegdsen)
    const order = await Order.findById(batch.orderId);
    if (order && order.status === "niitlegdsen") {
      // Check if batch 2 already exists
      const batch2Exists = await OrderNotificationBatch.findOne({
        orderId: batch.orderId,
        batchNumber: 2,
      });

      if (!batch2Exists) {
        // Notify next batch (Top 6-10)
        await notifyAgentsNewOrder(
          batch.orderId,
          order.productName,
          0, // Amount will be determined by agent
          2
        );
      }
    }
  }

  // Mark expired batch 2 as expired (order stays pending)
  await OrderNotificationBatch.updateMany(
    {
      batchNumber: 2,
      status: "active",
      expiresAt: { $lte: now },
    },
    { status: "expired" }
  );

  console.log(`Processed ${expiredBatch1.length} expired batches`);
};

// ============ Support Chat Notifications ============

// Notify admins: Support handoff requested
export const notifyAdminSupportHandoff = async (
  sessionId: string,
  visitorInfo?: string
) => {
  // Get all admins
  const admins = await User.find({ role: "admin" }).lean();

  if (admins.length === 0) return;

  const title = "Дэмжлэг хүсэлт ирлээ";
  const message = visitorInfo
    ? `${visitorInfo} хэрэглэгч дэмжлэг хүсэж байна. Session: ${sessionId}`
    : `Хэрэглэгч дэмжлэг хүсэж байна. Session: ${sessionId}`;

  // Bulk insert notifications
  const notifications = admins.map((admin) => ({
    userId: admin._id,
    type: "support_handoff" as NotificationType,
    title,
    message,
  }));
  await Notification.insertMany(notifications);

  // Send emails in parallel
  await Promise.all(
    admins.map(async (admin) => {
      const emailEnabled = await isEmailNotificationEnabled(admin._id);
      if (emailEnabled) {
        const profile = await Profile.findOne({ userId: admin._id }).lean();
        if (profile?.email) {
          await sendEmail(
            profile.email,
            title,
            message,
            `<h2>Дэмжлэг хүсэлт</h2><p>${message}</p><a href="https://agentbuy.mn/admin/dashboard">Админ хэсэгт очих</a>`
          );
        }
      }
    })
  );

  console.log(`[Support] Notified ${admins.length} admins about support handoff`);
};
