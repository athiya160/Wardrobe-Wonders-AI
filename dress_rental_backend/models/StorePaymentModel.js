import { Schema, model } from "mongoose";

const StorePaymentSchema = new Schema(
  {
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreOrder",
      required: [true, "Parent Store order reference is required."],
      index: true,
    },
    orderNumber: {
      type: String,
      required: [true, "Order number is required."],
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Customer reference is required."],
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ["PHONEPE", "COD", "MOCK"],
      default: "PHONEPE",
      trim: true,
    },
    internalPaymentId: {
      type: String,
      required: [true, "Internal payment ID is required."],
      unique: true,
      trim: true,
      index: true,
    },
    merchantTransactionId: {
      type: String,
      required: [true, "Merchant transaction ID is required."],
      unique: true,
      trim: true,
      index: true,
    },
    providerReferenceId: {
      type: String,
      default: null,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required."],
      min: [0, "Payment amount cannot be negative."],
    },
    amountInPaise: {
      type: Number,
      required: [true, "Payment amount in paise is required."],
      min: [0, "Payment amount in paise cannot be negative."],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "INITIATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "REFUND_PENDING",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
      ],
      default: "INITIATED",
      index: true,
    },
    idempotencyKey: {
      type: String,
      default: null,
      trim: true,
      index: true,
      sparse: true,
    },
    failureReason: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
StorePaymentSchema.index({ customerId: 1, createdAt: -1 });
StorePaymentSchema.index({ parentOrderId: 1, status: 1 });

export default model("StorePayment", StorePaymentSchema);
