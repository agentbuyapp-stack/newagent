import mongoose, { Schema, Document } from "mongoose";

export type EmailStatus = "pending" | "sent" | "failed" | "daily_limit_reached";

export interface IEmailQueue extends Document {
  to: string;
  subject: string;
  body: string;
  html?: string;
  status: EmailStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  failedAt?: Date;
  failReason?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmailQueueSchema = new Schema<IEmailQueue>(
  {
    to: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    html: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "daily_limit_reached"],
      default: "pending",
    },
    scheduledAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    failReason: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "email_queue",
  }
);

// Indexes
EmailQueueSchema.index({ status: 1, scheduledAt: 1 });
EmailQueueSchema.index({ createdAt: 1 });

export const EmailQueue =
  (mongoose.models.EmailQueue as mongoose.Model<IEmailQueue>) ||
  mongoose.model<IEmailQueue>("EmailQueue", EmailQueueSchema);
