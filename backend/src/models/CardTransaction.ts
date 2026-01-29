import mongoose, { Schema, Document } from "mongoose";

export type CardTransactionType =
  | "initial_grant"
  | "admin_gift"
  | "agent_gift"
  | "user_transfer"
  | "purchase"
  | "order_deduction"
  | "order_refund"
  | "bundle_item_removal";

export interface ICardTransaction extends Document {
  fromUserId?: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  amount: number;
  type: CardTransactionType;
  recipientPhone?: string;
  orderId?: mongoose.Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CardTransactionSchema = new Schema<ICardTransaction>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: [
        "initial_grant",
        "admin_gift",
        "agent_gift",
        "user_transfer",
        "purchase",
        "order_deduction",
        "order_refund",
        "bundle_item_removal",
      ],
      required: true,
    },
    recipientPhone: {
      type: String,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    note: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
    collection: "card_transactions",
  }
);

// Index for efficient queries
CardTransactionSchema.index({ toUserId: 1, createdAt: -1 });
CardTransactionSchema.index({ fromUserId: 1, createdAt: -1 });
CardTransactionSchema.index({ type: 1 });

export const CardTransaction =
  (mongoose.models.CardTransaction as mongoose.Model<ICardTransaction>) ||
  mongoose.model<ICardTransaction>("CardTransaction", CardTransactionSchema);
