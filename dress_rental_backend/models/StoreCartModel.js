import { Schema, model } from "mongoose";

const CartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "StoreProduct",
      required: [true, "Product reference is required."],
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required."],
    },
    variantId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    size: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [1, "Quantity must be at least 1."],
      default: 1,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const StoreCartSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

export default model("StoreCart", StoreCartSchema);
