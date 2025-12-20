import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus = 
  | "niitlegdsen" 
  | "agent_sudlaj_bn" 
  | "tolbor_huleej_bn" 
  | "amjilttai_zahialga" 
  | "tsutsalsan_zahialga";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  productName: string;
  description: string;
  imageUrl?: string;
  imageUrls: string[];
  status: OrderStatus;
  userPaymentVerified: boolean;
  agentPaymentPaid: boolean;
  trackCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga", "tsutsalsan_zahialga"],
      default: "niitlegdsen",
    },
    userPaymentVerified: {
      type: Boolean,
      default: false,
    },
    agentPaymentPaid: {
      type: Boolean,
      default: false,
    },
    trackCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "orders",
  }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ agentId: 1 });
OrderSchema.index({ status: 1 });

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

