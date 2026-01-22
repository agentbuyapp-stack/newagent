import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSettings extends Document {
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  exchangeRate?: number;
  orderLimitEnabled?: boolean;
  maxOrdersPerDay?: number;
  maxActiveOrders?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>(
  {
    accountNumber: {
      type: String,
      trim: true,
    },
    accountName: {
      type: String,
      trim: true,
    },
    bank: {
      type: String,
      trim: true,
    },
    exchangeRate: {
      type: Number,
    },
    orderLimitEnabled: {
      type: Boolean,
      default: true,
    },
    maxOrdersPerDay: {
      type: Number,
      default: 10,
    },
    maxActiveOrders: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
    collection: "admin_settings",
  }
);

export const AdminSettings = (mongoose.models.AdminSettings as mongoose.Model<IAdminSettings>) || mongoose.model<IAdminSettings>("AdminSettings", AdminSettingsSchema);

