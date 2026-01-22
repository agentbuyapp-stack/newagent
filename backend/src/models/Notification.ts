import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
  | "order_created"
  | "order_status_changed"
  | "order_assigned"
  | "payment_verified"
  | "track_code_added"
  | "order_cancelled"
  | "system"
  | "agent_report_sent"
  | "agent_cancelled_order"
  | "admin_cancelled_order"
  | "agent_added_track_code"
  | "payment_verification_request"
  | "reward_request"
  | "new_order_available";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["order_created", "order_status_changed", "order_assigned", "payment_verified", "track_code_added", "order_cancelled", "system", "agent_report_sent", "agent_cancelled_order", "admin_cancelled_order", "agent_added_track_code", "payment_verification_request", "reward_request", "new_order_available"],
      default: "system",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = (mongoose.models.Notification as mongoose.Model<INotification>) || mongoose.model<INotification>("Notification", NotificationSchema);
