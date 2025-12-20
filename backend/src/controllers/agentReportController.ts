import { Request, Response } from "express";
import { AgentReport, Order } from "../models";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import mongoose from "mongoose";

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

