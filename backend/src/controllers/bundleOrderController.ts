import { Request, Response, NextFunction } from "express";
import { BundleOrder } from "../models/BundleOrder";
import { User } from "../models/User";
import { Profile } from "../models/Profile";

// Get all bundle orders (filtered by role)
export const getBundleOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let query = {};

    if (user.role === "user") {
      query = { userId: user._id };
    } else if (user.role === "agent") {
      // Agents see orders assigned to them or unassigned orders
      query = {
        $or: [
          { agentId: user._id },
          { agentId: null, status: "niitlegdsen" },
        ],
      };
    }
    // Admin sees all orders

    const orders = await BundleOrder.find(query)
      .populate("userId", "email")
      .populate("agentId", "email")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => ({
      id: order._id,
      userId: order.userId,
      agentId: order.agentId,
      userSnapshot: order.userSnapshot,
      items: order.items.map((item: any) => ({
        id: item._id,
        productName: item.productName,
        description: item.description,
        imageUrls: item.imageUrls,
        status: item.status,
        report: item.report,
      })),
      status: order.status,
      userPaymentVerified: order.userPaymentVerified,
      agentPaymentPaid: order.agentPaymentPaid,
      trackCode: order.trackCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    res.json(formattedOrders);
  } catch (error) {
    next(error);
  }
};

// Get single bundle order
export const getBundleOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await BundleOrder.findById(req.params.id)
      .populate("userId", "email")
      .populate("agentId", "email");

    if (!order) {
      return res.status(404).json({ error: "Bundle order not found" });
    }

    res.json({
      id: order._id,
      userId: order.userId,
      agentId: order.agentId,
      userSnapshot: order.userSnapshot,
      items: order.items.map((item: any) => ({
        id: item._id,
        productName: item.productName,
        description: item.description,
        imageUrls: item.imageUrls,
        status: item.status,
        report: item.report,
      })),
      status: order.status,
      userPaymentVerified: order.userPaymentVerified,
      agentPaymentPaid: order.agentPaymentPaid,
      trackCode: order.trackCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// Create bundle order
export const createBundleOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user profile for snapshot
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(400).json({ error: "Profile not found. Please create a profile first." });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    const order = await BundleOrder.create({
      userId: user._id,
      userSnapshot: {
        name: profile.name,
        phone: profile.phone,
        cargo: profile.cargo || "",
      },
      items: items.map((item: any) => ({
        productName: item.productName,
        description: item.description,
        imageUrls: item.imageUrls || [],
        status: "niitlegdsen",
      })),
      status: "niitlegdsen",
    });

    res.status(201).json({
      id: order._id,
      userId: order.userId,
      userSnapshot: order.userSnapshot,
      items: order.items.map((item: any) => ({
        id: item._id,
        productName: item.productName,
        description: item.description,
        imageUrls: item.imageUrls,
        status: item.status,
      })),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// Update bundle order status
export const updateBundleOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { status } = req.body;
    const order = await BundleOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Bundle order not found" });
    }

    // Assign agent if status is being changed by agent
    if (user.role === "agent" && !order.agentId) {
      order.agentId = user._id;
    }

    order.status = status;
    await order.save();

    res.json({
      id: order._id,
      status: order.status,
      agentId: order.agentId,
    });
  } catch (error) {
    next(error);
  }
};

// Update bundle item status
export const updateBundleItemStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { status } = req.body;
    const order = await BundleOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Bundle order not found" });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Assign agent if not assigned
    if (user.role === "agent" && !order.agentId) {
      order.agentId = user._id;
    }

    item.status = status;
    await order.save();

    res.json({
      id: order._id,
      items: order.items.map((item: any) => ({
        id: item._id,
        status: item.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Create bundle item report
export const createBundleItemReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const order = await BundleOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Bundle order not found" });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const { userAmount, paymentLink, additionalImages, additionalDescription, quantity } = req.body;

    item.report = {
      userAmount,
      paymentLink,
      additionalImages,
      additionalDescription,
      quantity,
    };
    item.status = "tolbor_huleej_bn";

    // Check if all items have reports, update bundle status
    const allItemsHaveReports = order.items.every((i: any) => i.report);
    if (allItemsHaveReports) {
      order.status = "tolbor_huleej_bn";
    }

    await order.save();

    res.json({
      id: order._id,
      status: order.status,
      items: order.items.map((item: any) => ({
        id: item._id,
        status: item.status,
        report: item.report,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Update track code
export const updateBundleTrackCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackCode } = req.body;
    const order = await BundleOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Bundle order not found" });
    }

    order.trackCode = trackCode;
    await order.save();

    res.json({
      id: order._id,
      trackCode: order.trackCode,
    });
  } catch (error) {
    next(error);
  }
};

// Delete bundle order
export const deleteBundleOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const order = await BundleOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Bundle order not found" });
    }

    // Only allow deletion by owner or admin
    if (user.role !== "admin" && order.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this order" });
    }

    await BundleOrder.findByIdAndDelete(req.params.id);

    res.json({ message: "Bundle order deleted successfully" });
  } catch (error) {
    next(error);
  }
};
