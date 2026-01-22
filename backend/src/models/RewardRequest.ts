import mongoose, { Schema, Document } from "mongoose";

export type RewardRequestStatus = "pending" | "approved" | "rejected";

export interface IRewardRequest extends Document {
  agentId: mongoose.Types.ObjectId;
  amount: number;
  status: RewardRequestStatus;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RewardRequestSchema = new Schema<IRewardRequest>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: String,
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "reward_requests",
  }
);

RewardRequestSchema.index({ agentId: 1 });
RewardRequestSchema.index({ status: 1 });

export const RewardRequest = (mongoose.models.RewardRequest as mongoose.Model<IRewardRequest>) || mongoose.model<IRewardRequest>("RewardRequest", RewardRequestSchema);

