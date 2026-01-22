import { Request, Response, NextFunction } from "express";
import { BundleOrder } from "../models/BundleOrder";
import { User } from "../models/User";
import { Profile } from "../models/Profile";
import { checkOrderLimits } from "../utils/orderLimits";

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
        agentReport: item.report, // Map 'report' to 'agentReport' for frontend compatibility
      })),
      status: order.status,
      userPaymentVerified: order.userPaymentVerified,
      agentPaymentPaid: order.agentPaymentPaid,
      trackCode: order.trackCode,
      reportMode: order.reportMode,
      bundleReport: order.bundleReport,
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
        agentReport: item.report, // Map 'report' to 'agentReport' for frontend compatibility
      })),
      status: order.status,
      userPaymentVerified: order.userPaymentVerified,
      agentPaymentPaid: order.agentPaymentPaid,
      trackCode: order.trackCode,
      reportMode: order.reportMode,
      bundleReport: order.bundleReport,
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

    // Check order limits for users only
    if (user.role === "user") {
      const limitCheck = await checkOrderLimits(req.user.id);
      if (!limitCheck.allowed) {
        return res.status(429).json({ error: limitCheck.reason });
      }
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

    // Validate each item
    for (const item of items) {
      if (!item.productName || typeof item.productName !== "string" || item.productName.trim().length === 0) {
        return res.status(400).json({ error: "Бараа бүр нэртэй байх ёстой" });
      }
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

// Create bundle report (single or per-item mode)
export const createBundleReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only agents and admins can create reports
    if (user.role !== "agent" && user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const order = await BundleOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Bundle order not found" });
    }

    // Assign agent if not assigned
    if (user.role === "agent" && !order.agentId) {
      order.agentId = user._id;
    }

    const { reportMode, bundleReport, itemReports } = req.body;

    if (reportMode === "single") {
      // Single report for whole bundle
      if (!bundleReport || typeof bundleReport.totalUserAmount !== "number") {
        return res.status(400).json({ error: "totalUserAmount is required for single mode" });
      }

      order.reportMode = "single";
      order.bundleReport = {
        totalUserAmount: bundleReport.totalUserAmount,
        paymentLink: bundleReport.paymentLink,
        additionalImages: bundleReport.additionalImages || [],
        additionalDescription: bundleReport.additionalDescription,
      };

      // Update all items status to tolbor_huleej_bn
      order.items.forEach((item: any) => {
        item.status = "tolbor_huleej_bn";
      });
      order.status = "tolbor_huleej_bn";

    } else if (reportMode === "per_item") {
      // Per-item reports
      if (!itemReports || !Array.isArray(itemReports) || itemReports.length === 0) {
        return res.status(400).json({ error: "itemReports is required for per_item mode" });
      }

      order.reportMode = "per_item";
      order.bundleReport = undefined; // Clear bundle-level report

      // Update each item's report
      for (const itemReport of itemReports) {
        const item = order.items.id(itemReport.itemId);
        if (item) {
          item.report = {
            userAmount: itemReport.userAmount,
            paymentLink: itemReport.paymentLink,
            additionalImages: itemReport.additionalImages || [],
            additionalDescription: itemReport.additionalDescription,
            quantity: itemReport.quantity,
          };
          item.status = "tolbor_huleej_bn";
        }
      }

      // Check if all items have reports
      const allItemsHaveReports = order.items.every((i: any) => i.report);
      if (allItemsHaveReports) {
        order.status = "tolbor_huleej_bn";
      }

    } else {
      return res.status(400).json({ error: "reportMode must be 'single' or 'per_item'" });
    }

    await order.save();

    res.json({
      id: order._id,
      status: order.status,
      reportMode: order.reportMode,
      bundleReport: order.bundleReport,
      items: order.items.map((item: any) => ({
        id: item._id,
        productName: item.productName,
        status: item.status,
        report: item.report,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// User confirms payment for bundle order
export const confirmBundleUserPayment = async (req: Request, res: Response, next: NextFunction) => {
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

    // Only allow the order owner to confirm payment
    if (order.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to confirm payment for this order" });
    }

    // Only allow confirmation when status is "tolbor_huleej_bn"
    if (order.status !== "tolbor_huleej_bn") {
      return res.status(400).json({ error: "Order is not awaiting payment" });
    }

    order.userPaymentVerified = true;
    await order.save();

    res.json({
      id: order._id,
      userPaymentVerified: order.userPaymentVerified,
      status: order.status,
    });
  } catch (error) {
    next(error);
  }
};

// User cancels bundle order
export const cancelBundleOrder = async (req: Request, res: Response, next: NextFunction) => {
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

    // Only allow the order owner to cancel
    if (order.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to cancel this order" });
    }

    // Only allow cancellation when status is "tolbor_huleej_bn" and payment not verified
    if (order.status !== "tolbor_huleej_bn" || order.userPaymentVerified) {
      return res.status(400).json({ error: "Order cannot be cancelled at this stage" });
    }

    order.status = "tsutsalsan_zahialga";
    // Update all items status too
    order.items.forEach((item: any) => {
      item.status = "tsutsalsan_zahialga";
    });
    await order.save();

    res.json({
      id: order._id,
      status: order.status,
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
