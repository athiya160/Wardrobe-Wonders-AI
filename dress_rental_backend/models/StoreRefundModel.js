import { Schema, model } from "mongoose";

const StoreRefundSchema = new Schema(
  {
    refundId: {
      type: String,
      required: [true, "Unique refund ID is required."],
      unique: true,
      trim: true,
      index: true,
    },
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreOrder",
      required: [true, "Parent Store order reference is required."],
      index: true,
    },
    parentOrderNumber: {
      type: String,
      required: [true, "Parent order number is required."],
      uppercase: true,
      trim: true,
      index: true,
    },
    fulfilmentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreFulfilmentOrder",
      default: null,
      index: true,
    },
    fulfilmentOrderNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "StorePayment",
      required: [true, "Original payment reference is required."],
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Admin user initiating refund is required."],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Refund amount is required."],
      min: [0.01, "Refund amount must be greater than zero."],
    },
    amountInPaise: {
      type: Number,
      required: [true, "Refund amount in paise is required."],
      min: [1, "Refund amount in paise must be at least 1."],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    reason: {
      type: String,
      required: [true, "Refund reason is required."],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "PENDING_PROVIDER",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
      ],
      default: "REQUESTED",
      index: true,
    },
    providerRefundReference: {
      type: String,
      default: null,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      default: null,
      trim: true,
      index: true,
      sparse: true,
    },
    compensatingLedgerEntryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "StoreLedger",
      },
    ],
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

StoreRefundSchema.index({ parentOrderId: 1, createdAt: -1 });

export default model("StoreRefund", StoreRefundSchema);
