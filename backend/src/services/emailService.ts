import nodemailer from "nodemailer";
import { EmailQueue } from "../models/EmailQueue";
import { EmailDailyCount } from "../models/EmailDailyCount";
import { Profile } from "../models/Profile";
import mongoose from "mongoose";

const DAILY_EMAIL_LIMIT = 450;

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
    },
  });
};

// Get today's date in YYYY-MM-DD format (reset at 6:00 AM)
const getTodayDateKey = (): string => {
  const now = new Date();
  // If before 6:00 AM, use previous day
  if (now.getHours() < 6) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split("T")[0];
};

// Get or create today's email count
const getOrCreateDailyCount = async () => {
  const dateKey = getTodayDateKey();
  let dailyCount = await EmailDailyCount.findOne({ date: dateKey });

  if (!dailyCount) {
    dailyCount = await EmailDailyCount.create({
      date: dateKey,
      count: 0,
      limit: DAILY_EMAIL_LIMIT,
    });
  }

  return dailyCount;
};

// Check if can send email (under daily limit)
export const canSendEmail = async (): Promise<boolean> => {
  const dailyCount = await getOrCreateDailyCount();
  return dailyCount.count < dailyCount.limit;
};

// Get remaining email quota
export const getRemainingEmailQuota = async (): Promise<number> => {
  const dailyCount = await getOrCreateDailyCount();
  return Math.max(0, dailyCount.limit - dailyCount.count);
};

// Increment daily email count
const incrementDailyCount = async () => {
  const dateKey = getTodayDateKey();
  await EmailDailyCount.findOneAndUpdate(
    { date: dateKey },
    { $inc: { count: 1 } },
    { upsert: true }
  );
};

// Check if user has email notifications enabled
export const isEmailNotificationEnabled = async (
  userId: mongoose.Types.ObjectId | string
): Promise<boolean> => {
  const profile = await Profile.findOne({ userId });
  return profile?.emailNotificationsEnabled ?? true;
};

// Send email directly
export const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<{ success: boolean; reason?: string }> => {
  try {
    // Check daily limit
    if (!(await canSendEmail())) {
      // Add to queue for later
      await EmailQueue.create({
        to,
        subject,
        body,
        html,
        status: "daily_limit_reached",
      });
      return { success: false, reason: "daily_limit_reached" };
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: body,
      html: html || body,
    });

    // Increment count after successful send
    await incrementDailyCount();

    // Log to queue as sent
    await EmailQueue.create({
      to,
      subject,
      body,
      html,
      status: "sent",
      sentAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    // Log failed email
    await EmailQueue.create({
      to,
      subject,
      body,
      html,
      status: "failed",
      failedAt: new Date(),
      failReason: error.message,
    });

    console.error("Email send error:", error.message);
    return { success: false, reason: error.message };
  }
};

// Queue email for later sending
export const queueEmail = async (
  to: string,
  subject: string,
  body: string,
  html?: string,
  scheduledAt?: Date
) => {
  return await EmailQueue.create({
    to,
    subject,
    body,
    html,
    status: "pending",
    scheduledAt,
  });
};

// Process pending emails (called by cron job)
export const processPendingEmails = async () => {
  const now = new Date();

  // Get pending emails that are ready to send
  const pendingEmails = await EmailQueue.find({
    status: { $in: ["pending", "daily_limit_reached"] },
    $or: [{ scheduledAt: { $lte: now } }, { scheduledAt: null }],
  })
    .sort({ createdAt: 1 })
    .limit(50); // Process 50 at a time

  let sentCount = 0;

  for (const email of pendingEmails) {
    // Check if we can still send
    if (!(await canSendEmail())) {
      console.log("Daily email limit reached, stopping processing");
      break;
    }

    try {
      const transporter = createTransporter();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email.to,
        subject: email.subject,
        text: email.body,
        html: email.html || email.body,
      });

      // Update status
      email.status = "sent";
      email.sentAt = new Date();
      await email.save();

      await incrementDailyCount();
      sentCount++;
    } catch (error: any) {
      email.status = "failed";
      email.failedAt = new Date();
      email.failReason = error.message;
      email.retryCount += 1;
      await email.save();
    }
  }

  console.log(`Processed ${sentCount} pending emails`);
  return sentCount;
};

// Reset daily count (called at 6:00 AM by cron)
export const resetDailyCount = async () => {
  const dateKey = getTodayDateKey();
  await EmailDailyCount.findOneAndUpdate(
    { date: dateKey },
    { count: 0 },
    { upsert: true }
  );
  console.log(`Daily email count reset for ${dateKey}`);
};

// Base email wrapper template
const emailWrapper = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Agentbuy.mn</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              ${content}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                Энэ мэйл автоматаар илгээгдсэн болно.<br>
                <a href="https://agentbuy.mn" style="color: #3b82f6; text-decoration: none;">agentbuy.mn</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Email templates
export const emailTemplates = {
  agentReportSent: (_orderId: string, productName: string) => ({
    subject: "Taны захиалгад тайлан ирлээ - Agentbuy",
    body: `Сайн байна уу,\n\nТаны "${productName}" захиалгад agent тайлан илгээлээ.\n\nДэлгэрэнгүйг agentbuy.mn сайтаас харна уу.`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #111827; font-size: 22px;">Таны захиалгад тайлан ирлээ</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Таны захиалгад agent тайлан илгээлээ.</p>
      <table style="width: 100%; background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Бараа</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${productName}</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/user/dashboard" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Захиалга харах</a>
    `, "Тайлан ирлээ"),
  }),

  agentCancelledOrder: (_orderId: string, productName: string) => ({
    subject: "Захиалга цуцлагдлаа - Agentbuy",
    body: `Сайн байна уу,\n\nТаны "${productName}" захиалгыг agent цуцаллаа.\n\nДэлгэрэнгүйг agentbuy.mn сайтаас харна уу.`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #dc2626; font-size: 22px;">Захиалга цуцлагдлаа</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Уучлаарай, таны захиалгыг agent цуцаллаа.</p>
      <table style="width: 100%; background-color: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">Цуцлагдсан бараа</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${productName}</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/user/dashboard" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Захиалга харах</a>
      <p style="margin: 15px 0 0; color: #6b7280; font-size: 14px;">Та шинэ захиалга үүсгэх боломжтой.</p>
    `, "Захиалга цуцлагдлаа"),
  }),

  adminCancelledOrder: (_orderId: string, productName: string) => ({
    subject: "Захиалга цуцлагдлаа (Админ) - Agentbuy",
    body: `Сайн байна уу,\n\nТаны "${productName}" захиалгыг админ цуцаллаа.\n\nДэлгэрэнгүйг agentbuy.mn сайтаас харна уу.`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #dc2626; font-size: 22px;">Захиалга цуцлагдлаа</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Уучлаарай, таны захиалгыг админ цуцаллаа.</p>
      <table style="width: 100%; background-color: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #fecaca;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">Цуцлагдсан бараа</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${productName}</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/user/dashboard" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Захиалга харах</a>
      <p style="margin: 15px 0 0; color: #6b7280; font-size: 14px;">Асуудал байвал бидэнтэй холбогдоно уу.</p>
    `, "Захиалга цуцлагдлаа"),
  }),

  trackCodeAdded: (_orderId: string, productName: string, trackCode: string) => ({
    subject: "Track код оруулагдлаа - Agentbuy",
    body: `Сайн байна уу,\n\nТаны "${productName}" захиалгад track код оруулагдлаа.\n\nTrack код: ${trackCode}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #059669; font-size: 22px;">Track код оруулагдлаа</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Таны захиалгад track код оруулагдлаа. Ачааны байршлыг хянах боломжтой.</p>
      <table style="width: 100%; background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #a7f3d0;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #047857; font-size: 14px;">Бараа</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${productName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #047857; font-size: 14px;">Track код</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 20px; font-weight: 700; font-family: monospace; background: #d1fae5; padding: 8px 12px; border-radius: 6px; display: inline-block;">${trackCode}</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/user/dashboard" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Захиалга харах</a>
    `, "Track код"),
  }),

  newOrderAvailable: (_orderId: string, productName: string, _amount: number, _expiresInMinutes: number) => ({
    subject: "Шинэ захиалга байна! - Agentbuy",
    body: `Сайн байна уу,\n\nШинэ захиалга байна!\n\nБараа: ${productName}\n\nСистемд нэвтэрч захиалгыг авна уу.`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #f59e0b; font-size: 22px;">Шинэ захиалга байна!</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Шинэ захиалга ирлээ. Одоо авах боломжтой!</p>
      <table style="width: 100%; background-color: #fffbeb; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #fcd34d;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #b45309; font-size: 14px;">Бараа</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 18px; font-weight: 600;">${productName}</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/agent/dashboard" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Захиалга авах</a>
    `, "Шинэ захиалга"),
  }),

  paymentVerified: (_orderId: string, productName: string, amount: number) => ({
    subject: "Төлбөр баталгаажлаа - Agentbuy",
    body: `Сайн байна уу,\n\n"${productName}" захиалгын төлбөр баталгаажлаа.\n\nДүн: ¥${amount}`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #059669; font-size: 22px;">Төлбөр баталгаажлаа</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Захиалгын төлбөр амжилттай баталгаажлаа.</p>
      <table style="width: 100%; background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #a7f3d0;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #047857; font-size: 14px;">Бараа</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${productName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #047857; font-size: 14px;">Баталгаажсан дүн</p>
            <p style="margin: 5px 0 0; color: #059669; font-size: 24px; font-weight: 700;">¥${amount.toLocaleString()}</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/agent/dashboard" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Dashboard харах</a>
    `, "Төлбөр баталгаажлаа"),
  }),

  paymentVerificationRequest: (_orderId: string, productName: string, userName: string) => ({
    subject: "Төлбөр баталгаажуулах хүсэлт - Agentbuy",
    body: `Сайн байна уу,\n\n${userName} хэрэглэгч "${productName}" захиалгын төлбөр баталгаажуулах хүсэлт илгээлээ.\n\nСистемд нэвтэрч шалгана уу.`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #7c3aed; font-size: 22px;">Төлбөр баталгаажуулах хүсэлт</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Хэрэглэгч төлбөр баталгаажуулах хүсэлт илгээлээ.</p>
      <table style="width: 100%; background-color: #f5f3ff; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #c4b5fd;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #6d28d9; font-size: 14px;">Хэрэглэгч</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${userName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #6d28d9; font-size: 14px;">Бараа</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${productName}</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/admin/dashboard" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Админ хэсэгт очих</a>
    `, "Төлбөр хүсэлт"),
  }),

  rewardRequest: (agentName: string, amount: number) => ({
    subject: "Урамшууллын оноо татах хүсэлт - Agentbuy",
    body: `Сайн байна уу,\n\n${agentName} agent ${amount.toLocaleString()} ₮ оноо татах хүсэлт илгээлээ.\n\nСистемд нэвтэрч шалгана уу.`,
    html: emailWrapper(`
      <h2 style="margin: 0 0 20px; color: #7c3aed; font-size: 22px;">Урамшууллын оноо татах хүсэлт</h2>
      <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">Сайн байна уу,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Agent урамшууллын оноо татах хүсэлт илгээлээ.</p>
      <table style="width: 100%; background-color: #f5f3ff; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #c4b5fd;">
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #6d28d9; font-size: 14px;">Agent</p>
            <p style="margin: 5px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${agentName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px;">
            <p style="margin: 0; color: #6d28d9; font-size: 14px;">Татах дүн</p>
            <p style="margin: 5px 0 0; color: #7c3aed; font-size: 24px; font-weight: 700;">${amount.toLocaleString()} ₮</p>
          </td>
        </tr>
      </table>
      <a href="https://agentbuy.mn/admin/dashboard" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Админ хэсэгт очих</a>
    `, "Урамшуулал хүсэлт"),
  }),
};
