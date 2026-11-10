import { Schema, model } from "mongoose";

const CancellationHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
    role: { type: String, enum: ["customer", "seller", "admin", "system"], default: "customer" },
    note: { type: String, default: "" },
  },
  { _id: true }
);

const StoreCancellationSchema = new Schema(
  {
    cancellationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreOrder",
      required: true,
      index: true,
    },
    parentOrderNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    fulfilmentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreFulfilmentOrder",
      required: true,
      index: true,
    },
    fulfilmentOrderNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
      default: "REQUESTED",
      index: true,
    },
    adminReview: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
      reviewedAt: { type: Date, default: null },
      decision: { type: String, enum: ["APPROVED", "REJECTED", null], default: null },
      reason: { type: String, default: "", trim: true },
    },
    refundId: {
      type: Schema.Types.ObjectId,
      ref: "StoreRefund",
      default: null,
    },
    history: [CancellationHistorySchema],
  },
  {
    timestamps: true,
  }
);

StoreCancellationSchema.index({ customerId: 1, createdAt: -1 });
StoreCancellationSchema.index({ fulfilmentOrderId: 1, status: 1 });

export default model("StoreCancellation", StoreCancellationSchema);
