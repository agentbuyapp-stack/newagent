import mongoose, { Schema, Document } from "mongoose";

export type BannerType = "video" | "image" | "link";
export type BannerTarget = "all" | "user" | "agent";

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  type: BannerType;
  url: string;
  thumbnailUrl?: string;
  isActive: boolean;
  order: number;
  targetAudience: BannerTarget;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["video", "image", "link"],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    targetAudience: {
      type: String,
      enum: ["all", "user", "agent"],
      default: "all",
    },
  },
  {
    timestamps: true,
    collection: "banners",
  }
);

export const Banner = (mongoose.models.Banner as mongoose.Model<IBanner>) || mongoose.model<IBanner>("Banner", BannerSchema);
