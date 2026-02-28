import { Order, BundleOrder, AdminSettings } from "../models";
import mongoose from "mongoose";

interface OrderLimitResult {
  allowed: boolean;
  reason?: string;
  todayCount?: number;
  maxPerDay?: number;
}

function getMongoliaToday(): Date {
  const now = new Date();
  // Mongolia is UTC+8
  const mongoliaOffset = 8 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const mongoliaMs = utcMs + mongoliaOffset * 60000;
  const mongoliaDate = new Date(mongoliaMs);
  // Start of day in Mongolia
  mongoliaDate.setHours(0, 0, 0, 0);
  // Convert back to UTC for MongoDB query
  return new Date(mongoliaDate.getTime() - mongoliaOffset * 60000);
}

export async function checkOrderLimits(userId: string): Promise<OrderLimitResult> {
  const settings = await AdminSettings.findOne().lean();
  const orderLimitEnabled = settings?.orderLimitEnabled ?? true;
  const maxPerDay = settings?.maxOrdersPerDay ?? 10;

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const todayStart = getMongoliaToday();

  // Count today's orders (Order + BundleOrder)
  const [ordersToday, bundleOrdersToday] = await Promise.all([
    Order.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: todayStart },
    }),
    BundleOrder.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: todayStart },
    }),
  ]);

  const totalOrdersToday = ordersToday + bundleOrdersToday;

  if (!orderLimitEnabled) {
    return {
      allowed: true,
      todayCount: totalOrdersToday,
      maxPerDay,
    };
  }

  if (totalOrdersToday >= maxPerDay) {
    return {
      allowed: false,
      reason: `Та өнөөдөр хамгийн ихдээ ${maxPerDay} захиалга үүсгэж болно. Маргааш дахин оролдоно уу.`,
      todayCount: totalOrdersToday,
      maxPerDay,
    };
  }

  return {
    allowed: true,
    todayCount: totalOrdersToday,
    maxPerDay,
  };
}
