import { Order, BundleOrder, AdminSettings } from "../models";
import mongoose from "mongoose";

interface OrderLimitResult {
  allowed: boolean;
  reason?: string;
}

export async function checkOrderLimits(userId: string): Promise<OrderLimitResult> {
  // Get admin settings
  const settings = await AdminSettings.findOne().lean();

  // If order limits are disabled, allow all
  if (!settings?.orderLimitEnabled) {
    return { allowed: true };
  }

  const maxOrdersPerDay = settings.maxOrdersPerDay ?? 10;
  const maxActiveOrders = settings.maxActiveOrders ?? 10;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Get start of today (Mongolia timezone UTC+8)
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Count today's orders (Order + BundleOrder)
  const [ordersToday, bundleOrdersToday] = await Promise.all([
    Order.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: todayStart }
    }),
    BundleOrder.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: todayStart }
    })
  ]);

  const totalOrdersToday = ordersToday + bundleOrdersToday;

  if (totalOrdersToday >= maxOrdersPerDay) {
    return {
      allowed: false,
      reason: `Та өнөөдөр хамгийн ихдээ ${maxOrdersPerDay} захиалга үүсгэж болно`
    };
  }

  // Count active orders
  // Active statuses: niitlegdsen, agent_sudlaj_bn, tolbor_huleej_bn
  const activeStatuses = ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn"];

  const [activeOrders, activeBundleOrders] = await Promise.all([
    Order.countDocuments({
      userId: userObjectId,
      status: { $in: activeStatuses }
    }),
    BundleOrder.countDocuments({
      userId: userObjectId,
      status: { $in: activeStatuses }
    })
  ]);

  const totalActiveOrders = activeOrders + activeBundleOrders;

  if (totalActiveOrders >= maxActiveOrders) {
    return {
      allowed: false,
      reason: `Таны идэвхтэй захиалгын тоо хязгаарт хүрлээ (${maxActiveOrders}). Өмнөх захиалга дуусахыг хүлээнэ үү.`
    };
  }

  return { allowed: true };
}
