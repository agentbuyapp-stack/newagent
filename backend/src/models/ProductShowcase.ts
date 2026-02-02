import mongoose, { Schema, Document } from "mongoose";

export interface IShowcaseProduct {
  name: string;
  image: string;
  price?: number;
  link?: string;
  badge?: "belen" | "zahialgaar";  // Бэлэн эсвэл Захиалгаар
}

export interface IProductShowcase extends Document {
  title: string;
  products: IShowcaseProduct[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShowcaseProductSchema = new Schema<IShowcaseProduct>({
  name: { type: String, default: "" },
  image: { type: String, default: "" },
  price: { type: Number },
  link: { type: String },
  badge: { type: String, enum: ["belen", "zahialgaar"], default: "belen" },
});

const ProductShowcaseSchema = new Schema<IProductShowcase>(
  {
    title: { type: String, required: true },
    products: { type: [ShowcaseProductSchema], default: [] },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(_doc, ret) {
        ret.id = ret._id.toString();
        return ret;
      }
    }
  }
);

export const ProductShowcase = mongoose.model<IProductShowcase>("ProductShowcase", ProductShowcaseSchema);
