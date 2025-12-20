import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  cargo?: string;
  accountNumber?: string; // For agents
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    cargo: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "profiles",
  }
);

// Index is already created by unique: true on userId field, so we don't need to add it again

export const Profile = mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

