import mongoose, { Schema, Document } from "mongoose";

export interface IAgentReport extends Document {
  orderId: mongoose.Types.ObjectId;
  userAmount: number;
  paymentLink?: string;
  additionalImages: string[];
  additionalDescription?: string;
  quantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AgentReportSchema = new Schema<IAgentReport>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    userAmount: {
      type: Number,
      required: true,
    },
    paymentLink: {
      type: String,
      trim: true,
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    additionalDescription: {
      type: String,
    },
    quantity: {
      type: Number,
    },
  },
  {
    timestamps: true,
    collection: "agent_reports",
  }
);

export const AgentReport = mongoose.models.AgentReport || mongoose.model<IAgentReport>("AgentReport", AgentReportSchema);

