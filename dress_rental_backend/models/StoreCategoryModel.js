import { Schema, model } from "mongoose";

const SubcategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const StoreCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    subcategories: [SubcategorySchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("StoreCategory", StoreCategorySchema);
