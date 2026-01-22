import mongoose, { Schema, Document } from "mongoose";

export interface IEditHistory {
  editedAt: Date;
  previousAmount: number;
  newAmount: number;
  reason?: string;
}

export interface IAgentReport extends Document {
  orderId: mongoose.Types.ObjectId;
  userAmount: number;
  paymentLink?: string;
  additionalImages: string[];
  additionalDescription?: string;
  quantity?: number;
  editHistory: IEditHistory[];
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
    editHistory: {
      type: [{
        editedAt: { type: Date, default: Date.now },
        previousAmount: { type: Number, required: true },
        newAmount: { type: Number, required: true },
        reason: { type: String },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "agent_reports",
  }
);

export const AgentReport = (mongoose.models.AgentReport as mongoose.Model<IAgentReport>) || mongoose.model<IAgentReport>("AgentReport", AgentReportSchema);

