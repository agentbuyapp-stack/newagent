import { Request, Response } from "express";
import { adminService } from "../services/adminService";

/**
 * POST /admin/agents - Add new agent
 */
export const addAgent = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { data, error, status } = await adminService.addAgent(req.body.email, req.user.id);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.status(201).json(data);
};

/**
 * GET /admin/agents - Get all agents
 */
export const getAgents = async (_req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.getAgents();

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/agents/:id/approve - Approve or reject agent
 */
export const approveAgent = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { data, error, status } = await adminService.approveAgent(
    req.params.id,
    req.body.approved,
    req.user.id
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * GET /admin/orders - Get all orders for admin
 */
export const getAdminOrders = async (_req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.getOrders();

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/orders/:id/verify-payment - Verify user payment
 */
export const verifyUserPayment = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.verifyUserPayment(req.params.id);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/orders/:id/agent-payment - Mark agent payment as paid
 */
export const markAgentPaymentPaid = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.markAgentPaymentPaid(req.params.id);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * GET /admin/settings - Get admin settings
 */
export const getAdminSettings = async (_req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.getSettings();

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/settings - Update admin settings
 */
export const updateAdminSettings = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.updateSettings(req.body);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * GET /admin/reward-requests - Get all reward requests
 */
export const getRewardRequests = async (_req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.getRewardRequests();

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/reward-requests/:id/approve - Approve reward request
 */
export const approveRewardRequest = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { data, error, status } = await adminService.approveRewardRequest(
    req.params.id,
    req.user.id
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/reward-requests/:id/reject - Reject reward request
 */
export const rejectRewardRequest = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { data, error, status } = await adminService.rejectRewardRequest(
    req.params.id,
    req.user.id
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};
