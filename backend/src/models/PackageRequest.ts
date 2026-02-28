import mongoose, { Schema, Document } from "mongoose";

export type PackageType = "5" | "10" | "20";

export interface IPackageRequest extends Document {
  userId: mongoose.Types.ObjectId;
  packageType: PackageType;
  status: "pending" | "approved" | "rejected";
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PackageRequestSchema = new Schema<IPackageRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageType: {
      type: String,
      enum: ["5", "10", "20"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    processedBy: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "package_requests",
  }
);

export const PackageRequest =
  (mongoose.models.PackageRequest as mongoose.Model<IPackageRequest>) ||
  mongoose.model<IPackageRequest>("PackageRequest", PackageRequestSchema);
