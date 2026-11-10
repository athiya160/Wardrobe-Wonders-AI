import { Schema, model } from "mongoose";

const ReturnHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
    role: { type: String, enum: ["customer", "seller", "admin", "system"], default: "customer" },
    note: { type: String, default: "" },
  },
  { _id: true }
);

const ReturnItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "StoreProduct",
      required: true,
    },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const StoreReturnSchema = new Schema(
  {
    returnId: {
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
    items: [ReturnItemSchema],
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    images: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "ITEM_RETURNED",
        "REFUND_PENDING",
        "REFUNDED",
        "CLOSED",
      ],
      default: "REQUESTED",
      index: true,
    },
    requestedRefundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    requestedRefundAmountInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    actualRefundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualRefundAmountInPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminDecision: {
      decision: { type: String, enum: ["APPROVED", "REJECTED", null], default: null },
      decidedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
      decidedAt: { type: Date, default: null },
      reason: { type: String, default: "", trim: true },
    },
    returnTracking: {
      courierName: { type: String, default: "", trim: true },
      trackingNumber: { type: String, default: "", trim: true },
      trackingUrl: { type: String, default: "", trim: true },
      shippedBackAt: { type: Date, default: null },
      receivedAt: { type: Date, default: null },
    },
    refundId: {
      type: Schema.Types.ObjectId,
      ref: "StoreRefund",
      default: null,
    },
    history: [ReturnHistorySchema],
  },
  {
    timestamps: true,
  }
);

StoreReturnSchema.index({ customerId: 1, createdAt: -1 });
StoreReturnSchema.index({ fulfilmentOrderId: 1, status: 1 });

export default model("StoreReturn", StoreReturnSchema);
