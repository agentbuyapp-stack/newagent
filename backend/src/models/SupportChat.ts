import mongoose, { Schema, Document } from "mongoose";

export interface ISupportMessage {
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: Date;
}

export interface ISupportChat extends Document {
  sessionId: string;
  clerkUserId?: string;
  visitorId: string;
  messages: ISupportMessage[];
  status: "active" | "waiting_human" | "resolved";
  assignedAdmin?: string;
  metadata: {
    userAgent?: string;
    page?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "admin"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const SupportChatSchema = new Schema<ISupportChat>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clerkUserId: {
      type: String,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    messages: [SupportMessageSchema],
    status: {
      type: String,
      enum: ["active", "waiting_human", "resolved"],
      default: "active",
    },
    assignedAdmin: {
      type: String,
    },
    metadata: {
      userAgent: String,
      page: String,
    },
  },
  {
    timestamps: true,
    collection: "support_chats",
  }
);

// Indexes for efficient queries
SupportChatSchema.index({ status: 1, createdAt: -1 });
SupportChatSchema.index({ clerkUserId: 1, createdAt: -1 });

export const SupportChat =
  (mongoose.models.SupportChat as mongoose.Model<ISupportChat>) ||
  mongoose.model<ISupportChat>("SupportChat", SupportChatSchema);
