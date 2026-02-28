import mongoose, { Schema, Document } from "mongoose";

export interface ILabel extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema = new Schema<ILabel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    color: {
      type: String,
      required: true,
      enum: ["blue", "red", "green", "purple", "orange", "pink"],
      default: "blue",
    },
  },
  {
    timestamps: true,
    collection: "labels",
  }
);

LabelSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Label =
  (mongoose.models.Label as mongoose.Model<ILabel>) ||
  mongoose.model<ILabel>("Label", LabelSchema);
