import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  orderId: mongoose.Types.ObjectId;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number; // seconds
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    audioDuration: {
      type: Number,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "messages",
  }
);

MessageSchema.index({ orderId: 1 });
MessageSchema.index({ createdAt: 1 });

export const Message = (mongoose.models.Message as mongoose.Model<IMessage>) || mongoose.model<IMessage>("Message", MessageSchema);

