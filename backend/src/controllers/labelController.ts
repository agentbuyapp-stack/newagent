import { Request, Response } from "express";
import { Label, Order } from "../models";
import mongoose from "mongoose";

/**
 * GET /labels — Get user's labels
 */
export const getLabels = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  const labels = await Label.find({ userId: req.user.id }).sort({ createdAt: 1 }).lean();
  res.json(labels.map((l) => ({ id: l._id.toString(), name: l.name, color: l.color })));
};

/**
 * POST /labels — Create a new label
 */
export const createLabel = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { name, color } = req.body;

  // Check limit (max 10 labels per user)
  const count = await Label.countDocuments({ userId: req.user.id });
  if (count >= 10) {
    res.status(400).json({ error: "Хамгийн ихдээ 10 лэйбл үүсгэх боломжтой" });
    return;
  }

  try {
    const label = await Label.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      name: name.trim(),
      color: color || "blue",
    });
    res.status(201).json({ id: label._id.toString(), name: label.name, color: label.color });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Энэ нэртэй лэйбл аль хэдийн байна" });
      return;
    }
    res.status(500).json({ error: "Лэйбл үүсгэхэд алдаа гарлаа" });
  }
};

/**
 * DELETE /labels/:id — Delete a label (also removes from orders)
 */
export const deleteLabel = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const label = await Label.findOne({ _id: req.params.id, userId: req.user.id });
  if (!label) {
    res.status(404).json({ error: "Лэйбл олдсонгүй" });
    return;
  }

  // Remove label from all orders that have it
  await Order.updateMany(
    { userId: new mongoose.Types.ObjectId(req.user.id), label: label.name },
    { $unset: { label: "" } }
  );

  await label.deleteOne();
  res.json({ success: true });
};

/**
 * PUT /orders/:id/label — Set label on a single order
 */
export const updateOrderLabel = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { label } = req.body;
  const orderId = req.params.id;

  const update = label ? { label } : { $unset: { label: "" } };
  const order = await Order.findOneAndUpdate(
    { _id: orderId, userId: new mongoose.Types.ObjectId(req.user.id) },
    update,
    { new: true }
  );

  if (!order) {
    res.status(404).json({ error: "Захиалга олдсонгүй" });
    return;
  }

  res.json({ success: true, label: order.label || null });
};

/**
 * PUT /orders/bulk-label — Set label on multiple orders
 */
export const bulkUpdateOrderLabel = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { orderIds, label } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400).json({ error: "Захиалгын ID шаардлагатай" });
    return;
  }

  const update = label ? { label } : { $unset: { label: "" } };
  const result = await Order.updateMany(
    {
      _id: { $in: orderIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      userId: new mongoose.Types.ObjectId(req.user.id),
    },
    update
  );

  res.json({ success: true, modifiedCount: result.modifiedCount });
};
