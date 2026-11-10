import { Schema, model } from "mongoose";

const StoreReviewSchema = new Schema(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "StoreProduct",
      required: [true, "Product reference is required."],
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreOrder",
      required: true,
    },
    fulfilmentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreFulfilmentOrder",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating between 1 and 5 is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
    images: [{ type: String, trim: true }],
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["PUBLISHED", "PENDING_MODERATION", "HIDDEN", "REJECTED"],
      default: "PUBLISHED",
      index: true,
    },
    moderationNotes: {
      type: String,
      default: "",
      trim: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One review per customer per product per completed fulfillment order
StoreReviewSchema.index(
  { customerId: 1, productId: 1, fulfilmentOrderId: 1 },
  { unique: true }
);

StoreReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

export default model("StoreReview", StoreReviewSchema);
