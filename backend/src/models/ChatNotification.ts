import mongoose, { Schema, Document } from "mongoose";

export interface IChatNotification extends Document {
  orderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  lastEmailSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatNotificationSchema = new Schema<IChatNotification>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastEmailSentAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "chat_notifications",
  }
);

// Compound index for quick lookups
ChatNotificationSchema.index({ orderId: 1, recipientId: 1 }, { unique: true });

export const ChatNotification =
  (mongoose.models.ChatNotification as mongoose.Model<IChatNotification>) ||
  mongoose.model<IChatNotification>("ChatNotification", ChatNotificationSchema);
