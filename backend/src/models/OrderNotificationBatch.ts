import mongoose, { Schema, Document } from "mongoose";

export type BatchStatus = "active" | "assigned" | "expired";

export interface IOrderNotificationBatch extends Document {
  orderId: mongoose.Types.ObjectId;
  batchNumber: number; // 1 = Top 5, 2 = Top 6-10
  notifiedAgentIds: mongoose.Types.ObjectId[];
  status: BatchStatus;
  expiresAt: Date;
  assignedToAgentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderNotificationBatchSchema = new Schema<IOrderNotificationBatch>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    batchNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 2,
    },
    notifiedAgentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "assigned", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    assignedToAgentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "order_notification_batches",
  }
);

// Indexes
OrderNotificationBatchSchema.index({ orderId: 1, batchNumber: 1 }, { unique: true });
OrderNotificationBatchSchema.index({ status: 1, expiresAt: 1 });

export const OrderNotificationBatch =
  (mongoose.models.OrderNotificationBatch as mongoose.Model<IOrderNotificationBatch>) ||
  mongoose.model<IOrderNotificationBatch>("OrderNotificationBatch", OrderNotificationBatchSchema);
