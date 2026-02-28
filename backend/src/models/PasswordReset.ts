import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordReset extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "password_resets",
  }
);

PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset =
  (mongoose.models.PasswordReset as mongoose.Model<IPasswordReset>) ||
  mongoose.model<IPasswordReset>("PasswordReset", PasswordResetSchema);
