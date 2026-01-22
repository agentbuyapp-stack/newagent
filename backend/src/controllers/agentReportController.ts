import { Request, Response } from "express";
import { AgentReport, Order, Profile } from "../models";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";
import { notifyUserAgentReportSent } from "../services/notificationService";

export const getAgentReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Check if user has access to this order
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // User can only see reports for their own orders, agents/admins can see all
    if (req.user.role === "user") {
      if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const report = await AgentReport.findOne({
      orderId: new mongoose.Types.ObjectId(orderId)
    }).lean();

    if (!report) {
      return res.json(null);
    }

    res.json({
      ...report,
      id: report._id.toString(),
      orderId: report.orderId.toString(),
    });
  } catch (error: any) {
    console.error("Error in GET /orders/:id/report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAgentReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    const { userAmount, paymentLink, additionalImages, additionalDescription, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    if (!userAmount || typeof userAmount !== "number") {
      return res.status(400).json({ error: "User amount is required" });
    }

    // Check if user has access to this order
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only agents assigned to the order can create reports
    if (req.user.role === "agent") {
      if (!order.agentId || order.agentId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Upload additional images if provided
    let finalAdditionalImages: string[] = [];
    if (additionalImages && Array.isArray(additionalImages)) {
      for (const img of additionalImages) {
        if (typeof img === "string" && img.startsWith("data:image")) {
          try {
            const uploadResult = await uploadImageToCloudinary(img);
            finalAdditionalImages.push(uploadResult.url);
          } catch (uploadError: any) {
            console.error("Image upload error:", uploadError.message);
          }
        } else if (typeof img === "string") {
          finalAdditionalImages.push(img);
        }
      }
    }

    // Check if report already exists
    const existingReport = await AgentReport.findOne({
      orderId: new mongoose.Types.ObjectId(orderId)
    }).lean();

    let report;
    if (existingReport) {
      // Update existing report
      report = await AgentReport.findByIdAndUpdate(
        existingReport._id,
        {
          userAmount,
          paymentLink: paymentLink || undefined,
          additionalImages: finalAdditionalImages,
          additionalDescription: additionalDescription || undefined,
          quantity: quantity || undefined,
        },
        { new: true }
      ).lean();
    } else {
      // Create new report
      const newReport = await AgentReport.create({
        orderId: new mongoose.Types.ObjectId(orderId),
        userAmount,
        paymentLink: paymentLink || undefined,
        additionalImages: finalAdditionalImages,
        additionalDescription: additionalDescription || undefined,
        quantity: quantity || undefined,
      });
      report = newReport.toObject();
    }

    // Update order status to "tolbor_huleej_bn" when agent submits report
    // This allows user to see the report and proceed with payment
    await Order.findByIdAndUpdate(
      orderId,
      { status: "tolbor_huleej_bn" },
      { new: true }
    );

    // Notify user about the report
    const agentProfile = await Profile.findOne({ userId: req.user.id }).lean();
    const agentName = agentProfile?.name || "Agent";
    notifyUserAgentReportSent(
      order.userId,
      new mongoose.Types.ObjectId(orderId),
      order.productName,
      agentName
    ).catch((err) => console.error("Failed to notify user about report:", err));

    res.status(existingReport ? 200 : 201).json({
      ...report,
      id: report!._id.toString(),
      orderId: report!.orderId.toString(),
    });
  } catch (error: any) {
    console.error("Error in POST /orders/:id/report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAgentReport = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const orderId = req.params.id;
    const { userAmount, paymentLink, additionalDescription, quantity, editReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Check if user has access to this order
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow editing before user payment (status must be tolbor_huleej_bn or agent_sudlaj_bn)
    if (order.status !== "tolbor_huleej_bn" && order.status !== "agent_sudlaj_bn") {
      return res.status(400).json({ error: "Хэрэглэгч төлбөр төлсний дараа тайлан засах боломжгүй" });
    }

    // Check if user paid already
    if (order.userPaymentVerified) {
      return res.status(400).json({ error: "Хэрэглэгч төлбөр төлсний дараа тайлан засах боломжгүй" });
    }

    // Only agents assigned to the order or admins can edit reports
    if (req.user.role === "agent") {
      if (!order.agentId || order.agentId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get existing report
    const existingReport = await AgentReport.findOne({
      orderId: new mongoose.Types.ObjectId(orderId)
    });

    if (!existingReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Track edit history if amount changed
    const updateData: Record<string, unknown> = {};

    if (userAmount !== undefined && userAmount !== existingReport.userAmount) {
      // Add to edit history
      const editEntry = {
        editedAt: new Date(),
        previousAmount: existingReport.userAmount,
        newAmount: Math.round(userAmount),
        reason: editReason || undefined,
      };

      updateData.userAmount = Math.round(userAmount);
      updateData.$push = { editHistory: editEntry };
    }

    if (paymentLink !== undefined) {
      updateData.paymentLink = paymentLink || undefined;
    }
    if (additionalDescription !== undefined) {
      updateData.additionalDescription = additionalDescription || undefined;
    }
    if (quantity !== undefined) {
      updateData.quantity = quantity || undefined;
    }

    const report = await AgentReport.findByIdAndUpdate(
      existingReport._id,
      updateData,
      { new: true }
    ).lean();

    res.json({
      ...report,
      id: report!._id.toString(),
      orderId: report!.orderId.toString(),
    });
  } catch (error: any) {
    console.error("Error in PUT /orders/:id/report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

