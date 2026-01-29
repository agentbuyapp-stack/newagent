import { Request, Response } from "express";
import { bundleOrderService } from "../services/bundleOrderService";

/**
 * GET /bundle-orders - Get all bundle orders based on user role
 */
export const getBundleOrders = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { orders, error, status } = await bundleOrderService.getOrders(req.user.id, req.user.role);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(orders);
};

/**
 * GET /bundle-orders/:id - Get single bundle order
 */
export const getBundleOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.getOrder(
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
 * POST /bundle-orders - Create bundle order
 */
export const createBundleOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.createOrder(
    req.user.id,
    req.user.role,
    req.body.items
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.status(201).json(order);
};

/**
 * PUT /bundle-orders/:id/status - Update bundle order status
 */
export const updateBundleOrderStatus = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.updateOrderStatus(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body.status
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * PUT /bundle-orders/:id/items/:itemId/status - Update bundle item status
 */
export const updateBundleItemStatus = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.updateItemStatus(
    req.params.id,
    req.params.itemId,
    req.user.id,
    req.user.role,
    req.body.status
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * POST /bundle-orders/:id/items/:itemId/report - Create bundle item report
 */
export const createBundleItemReport = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.createItemReport(
    req.params.id,
    req.params.itemId,
    req.user.id,
    req.body
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * POST /bundle-orders/:id/report - Create bundle report (single or per-item mode)
 */
export const createBundleReport = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { reportMode, bundleReport, itemReports } = req.body;

  const { order, error, status } = await bundleOrderService.createBundleReport(
    req.params.id,
    req.user.id,
    req.user.role,
    reportMode,
    bundleReport,
    itemReports
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(order);
};

/**
 * PUT /bundle-orders/:id/track-code - Update track code
 */
export const updateBundleTrackCode = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.updateTrackCode(
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
 * PUT /bundle-orders/:id/user-payment-confirmed - User confirms payment
 */
export const confirmBundleUserPayment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.confirmPayment(
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
 * PUT /bundle-orders/:id/cancel - User cancels bundle order
 */
export const cancelBundleOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.cancelOrder(
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
 * DELETE /bundle-orders/:id/items/:itemId - Remove item from bundle order
 */
export const removeItemFromBundle = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.removeItemFromBundle(
    req.params.id,
    req.params.itemId,
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
 * DELETE /bundle-orders/:id - Delete bundle order
 */
export const deleteBundleOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { success, error, status } = await bundleOrderService.deleteOrder(
    req.params.id,
    req.user.id,
    req.user.role
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json({ message: "Bundle order deleted successfully", success });
};

/**
 * PUT /bundle-orders/:id/archive - Archive bundle order
 */
export const archiveBundleOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { order, error, status } = await bundleOrderService.archiveOrder(
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
