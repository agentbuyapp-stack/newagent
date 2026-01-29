import mongoose, { Schema, Document } from "mongoose";

export type Role = "user" | "agent" | "admin";

export interface IAgentProfile {
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
  specialties: string[];
  experienceYears?: number;
  rank: number;
  isTopAgent: boolean;
  totalTransactions: number;
  successRate: number;
  languages: string[];
  responseTime?: string;
  featured: boolean;
  availabilityStatus: "online" | "busy" | "offline";
  workingHours?: string;
  verifiedAt?: Date;
}

export interface IUser extends Document {
  email: string;
  role: Role;
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  agentPoints: number;
  researchCards: number;
  agentProfile?: IAgentProfile;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "agent", "admin"],
      default: "user",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: String,
    },
    agentPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    researchCards: {
      type: Number,
      default: 0,
      min: 0,
    },
    agentProfile: {
      avatarUrl: { type: String },
      displayName: { type: String },
      bio: { type: String, maxlength: 500 },
      specialties: [{ type: String }],
      experienceYears: { type: Number, min: 0 },
      rank: { type: Number, default: 999, min: 1 },
      isTopAgent: { type: Boolean, default: false },
      totalTransactions: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 },
      languages: [{ type: String }],
      responseTime: { type: String },
      featured: { type: Boolean, default: false },
      availabilityStatus: {
        type: String,
        enum: ["online", "busy", "offline"],
        default: "offline",
      },
      workingHours: { type: String },
      verifiedAt: { type: Date },
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

export const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

