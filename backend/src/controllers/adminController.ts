import { Request, Response } from "express";
import { adminService } from "../services/adminService";
import { agentProfileService } from "../services/agentProfileService";

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
 * PUT /admin/bundle-orders/:id/agent-payment - Mark bundle order agent payment as paid
 */
export const markBundleAgentPaymentPaid = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.markBundleAgentPaymentPaid(req.params.id);

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

/**
 * PUT /admin/orders/:id/cancel-payment - Cancel user payment
 */
export const cancelPayment = async (req: Request, res: Response): Promise<void> => {
  const { reason, orderType } = req.body;

  const { data, error, status } = await adminService.cancelPayment(
    req.params.id,
    reason || "",
    orderType || "order"
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

// ==================== Agent Profile Management ====================

/**
 * PUT /admin/agents/:id/profile - Update agent profile
 */
export const updateAgentProfile = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await agentProfileService.updateAgentProfile(
    req.params.id,
    req.body
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/agents/:id/rank - Update agent rank
 */
export const updateAgentRank = async (req: Request, res: Response): Promise<void> => {
  const { rank } = req.body;

  const { data, error, status } = await agentProfileService.updateAgentRank(
    req.params.id,
    rank
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * POST /admin/agents/reorder - Reorder agents (set top 10)
 */
export const reorderAgents = async (req: Request, res: Response): Promise<void> => {
  const { agentIds } = req.body;

  const { data, error, status } = await agentProfileService.reorderAgents(agentIds);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/agents/:id/toggle-top - Toggle agent top status
 */
export const toggleAgentTop = async (req: Request, res: Response): Promise<void> => {
  const { isTop } = req.body;

  const { data, error, status } = await agentProfileService.toggleAgentTop(
    req.params.id,
    isTop
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

// ==================== Agent Specialties Management ====================

/**
 * GET /admin/specialties - Get all specialties
 */
export const getSpecialties = async (_req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await agentProfileService.getSpecialties();

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * POST /admin/specialties - Create specialty
 */
export const createSpecialty = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await agentProfileService.createSpecialty(req.body);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.status(201).json(data);
};

/**
 * PUT /admin/specialties/:id - Update specialty
 */
export const updateSpecialty = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await agentProfileService.updateSpecialty(
    req.params.id,
    req.body
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * DELETE /admin/specialties/:id - Delete specialty
 */
export const deleteSpecialty = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await agentProfileService.deleteSpecialty(req.params.id);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

// ==================== Agent Reviews Management ====================

/**
 * GET /admin/reviews - Get all reviews
 */
export const getReviews = async (_req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await agentProfileService.getReviews();

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * PUT /admin/reviews/:id/approve - Approve/reject review
 */
export const approveReview = async (req: Request, res: Response): Promise<void> => {
  const { approved } = req.body;

  const { data, error, status } = await agentProfileService.approveReview(
    req.params.id,
    approved
  );

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * DELETE /admin/reviews/:id - Delete review
 */
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await agentProfileService.deleteReview(req.params.id);

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};

/**
 * POST /admin/recalculate-stats - Recalculate all agent statistics
 */
export const recalculateAgentStats = async (_req: Request, res: Response): Promise<void> => {
  const { data, error, status } = await adminService.recalculateAgentStats();

  if (error) {
    res.status(status || 500).json({ error });
    return;
  }

  res.json(data);
};
