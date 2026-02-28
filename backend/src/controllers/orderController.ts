import { Request, Response } from "express";
import { orderService } from "../services/orderService";
import { PackageRequest } from "../models";
import { checkOrderLimits } from "../utils/orderLimits";

/**
 * GET /orders - Get all orders based on user role
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { orders, error } = await orderService.getOrders(req.user.id, req.user.role);

  if (error) {
    res.status(500).json({ error });
    return;
  }

  res.json(orders);
};

/**
 * GET /orders/archived - Get archived orders (lazy-loaded)
 */
export const getArchivedOrders = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { orders, error } = await orderService.getArchivedOrders(req.user.id, req.user.role);

  if (error) {
    res.status(500).json({ error });
    return;
  }

  res.json(orders);
};

/**
 * GET /orders/:id - Get single order by ID
 */
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await orderService.getOrder(
    req.params.id,
    req.user.id,
    req.user.role
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * GET /orders/daily-limit - Get daily order limit info
 */
export const getDailyLimit = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const result = await checkOrderLimits(req.user.id);
  const maxPerDay = result.maxPerDay ?? 10;
  const todayCount = result.todayCount ?? 0;
  res.json({
    todayCount,
    maxPerDay,
    remaining: maxPerDay - todayCount,
  });
};

/**
 * POST /orders - Create new order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await orderService.createOrder(
    req.user.id,
    req.user.role,
    req.body
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.status(201).json(order);
};

/**
 * PUT /orders/:id/status - Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { status, cancelReason } = req.body;

  const result = await orderService.updateStatus(
    req.params.id,
    req.user.id,
    req.user.role,
    status,
    cancelReason
  );

  if (result.error) {
    res.status(result.status || 500).json({ error: result.error });
    return;
  }

  res.json(result.order);
};

/**
 * PUT /orders/:id/track-code - Update track code
 */
export const updateTrackCode = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await orderService.updateTrackCode(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body.trackCode
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * DELETE /orders/:id - Delete order
 */
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { success, error, status } = await orderService.deleteOrder(
    req.params.id,
    req.user.id,
    req.user.role
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json({ message: "Order deleted successfully", success });
};

/**
 * PUT /orders/:id/archive - Archive order
 */
export const archiveOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await orderService.archiveOrder(
    req.params.id,
    req.user.id,
    req.user.role
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * PUT /orders/:id/user-payment-confirmed - Confirm user payment
 */
export const confirmUserPayment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await orderService.confirmPayment(
    req.params.id,
    req.user.id
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * POST /orders/purchase-package - Request to purchase a package of order credits
 */
export const purchasePackage = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { packageType } = req.body;
  const validTypes = ["5", "10", "20"];

  if (!packageType || !validTypes.includes(String(packageType))) {
    res.status(400).json({ error: "Багцын төрөл буруу байна (5, 10, 20)" });
    return;
  }

  try {
    // Check if user already has a pending request
    const existingPending = await PackageRequest.findOne({
      userId: req.user.id,
      status: "pending",
    }).lean();

    if (existingPending) {
      res.status(400).json({ error: "Танд хүлээгдэж буй багцын хүсэлт байна. Админ баталгаажуулахыг хүлээнэ үү." });
      return;
    }

    const request = await PackageRequest.create({
      userId: req.user.id,
      packageType: String(packageType),
    });

    res.status(201).json({
      id: request._id.toString(),
      packageType: request.packageType,
      status: request.status,
      message: "Багц авах хүсэлт илгээгдлээ. Админ баталгаажуулсны дараа картууд нэмэгдэнэ.",
    });
  } catch (error) {
    console.error("Purchase package error:", error);
    res.status(500).json({ error: "Серверийн алдаа" });
  }
};
