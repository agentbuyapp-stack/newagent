import { Request, Response } from "express";
import { orderService } from "../services/orderService";

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
