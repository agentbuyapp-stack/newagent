import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAgentReview extends Document {
  agentId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment?: string;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AgentReviewSchema = new Schema<IAgentReview>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "agent_reviews",
  }
);

AgentReviewSchema.index({ agentId: 1, createdAt: -1 });
AgentReviewSchema.index({ userId: 1 });

export const AgentReview =
  (mongoose.models.AgentReview as mongoose.Model<IAgentReview>) ||
  mongoose.model<IAgentReview>("AgentReview", AgentReviewSchema);
