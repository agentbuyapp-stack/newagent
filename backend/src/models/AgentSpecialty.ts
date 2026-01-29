import mongoose, { Schema, Document } from "mongoose";

export interface IAgentSpecialty extends Document {
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSpecialtySchema = new Schema<IAgentSpecialty>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nameEn: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "agent_specialties",
  }
);

AgentSpecialtySchema.index({ order: 1 });
AgentSpecialtySchema.index({ isActive: 1 });

export const AgentSpecialty =
  (mongoose.models.AgentSpecialty as mongoose.Model<IAgentSpecialty>) ||
  mongoose.model<IAgentSpecialty>("AgentSpecialty", AgentSpecialtySchema);
