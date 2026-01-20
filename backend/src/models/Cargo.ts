import mongoose, { Schema, Document } from "mongoose";

export interface ICargo extends Document {
  name: string;
  description?: string;
  phone?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CargoSchema = new Schema<ICargo>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "cargos",
  }
);

export const Cargo = mongoose.models.Cargo || mongoose.model<ICargo>("Cargo", CargoSchema);

