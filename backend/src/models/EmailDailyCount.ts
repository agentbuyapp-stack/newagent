import mongoose, { Schema, Document } from "mongoose";

export interface IEmailDailyCount extends Document {
  date: string; // YYYY-MM-DD format
  count: number;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmailDailyCountSchema = new Schema<IEmailDailyCount>(
  {
    date: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    limit: {
      type: Number,
      default: 450,
    },
  },
  {
    timestamps: true,
    collection: "email_daily_counts",
  }
);

export const EmailDailyCount =
  (mongoose.models.EmailDailyCount as mongoose.Model<IEmailDailyCount>) ||
  mongoose.model<IEmailDailyCount>("EmailDailyCount", EmailDailyCountSchema);
