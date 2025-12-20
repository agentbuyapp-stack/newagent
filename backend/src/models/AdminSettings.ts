import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSettings extends Document {
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  exchangeRate?: number;
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
  },
  {
    timestamps: true,
    collection: "admin_settings",
  }
);

export const AdminSettings = mongoose.models.AdminSettings || mongoose.model<IAdminSettings>("AdminSettings", AdminSettingsSchema);

