import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus =
  | "niitlegdsen"
  | "agent_sudlaj_bn"
  | "tolbor_huleej_bn"
  | "amjilttai_zahialga"
  | "tsutsalsan_zahialga";

export interface IBundleItemReport {
  userAmount: number;
  paymentLink?: string;
  additionalImages?: string[];
  additionalDescription?: string;
  quantity?: number;
}

export interface IBundleItem {
  productName: string;
  description: string;
  imageUrls: string[];
  status: OrderStatus;
  report?: IBundleItemReport;
}

export interface IBundleOrder extends Document {
  userId: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  userSnapshot: {
    name: string;
    phone: string;
    cargo: string;
  };
  items: IBundleItem[];
  status: OrderStatus;
  userPaymentVerified: boolean;
  agentPaymentPaid: boolean;
  trackCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BundleItemReportSchema = new Schema<IBundleItemReport>(
  {
    userAmount: { type: Number, required: true },
    paymentLink: { type: String },
    additionalImages: { type: [String], default: [] },
    additionalDescription: { type: String },
    quantity: { type: Number },
  },
  { _id: false }
);

const BundleItemSchema = new Schema<IBundleItem>(
  {
    productName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga", "tsutsalsan_zahialga"],
      default: "niitlegdsen",
    },
    report: { type: BundleItemReportSchema },
  },
  { _id: true }
);

const BundleOrderSchema = new Schema<IBundleOrder>(
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
    userSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      cargo: { type: String, required: true },
    },
    items: {
      type: [BundleItemSchema],
      required: true,
      validate: {
        validator: function(v: IBundleItem[]) {
          return v && v.length > 0;
        },
        message: "Bundle order must have at least one item",
      },
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
    collection: "bundleOrders",
  }
);

BundleOrderSchema.index({ userId: 1 });
BundleOrderSchema.index({ agentId: 1 });
BundleOrderSchema.index({ status: 1 });

export const BundleOrder = mongoose.models.BundleOrder || mongoose.model<IBundleOrder>("BundleOrder", BundleOrderSchema);
