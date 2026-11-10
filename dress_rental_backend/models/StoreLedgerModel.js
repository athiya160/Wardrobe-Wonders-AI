import { Schema, model } from "mongoose";

const StoreLedgerSchema = new Schema(
  {
    entryId: {
      type: String,
      required: [true, "Unique ledger entry ID is required."],
      unique: true,
      trim: true,
      index: true,
    },
    storeOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreOrder",
      required: [true, "Store order reference is required."],
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
      required: [true, "Fulfilment order reference is required."],
      index: true,
    },
    fulfilmentOrderNumber: {
      type: String,
      required: [true, "Fulfilment order number is required."],
      uppercase: true,
      trim: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Seller user reference is required."],
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required."],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Ledger entry type is required."],
      enum: [
        "SALE",
        "COMMISSION",
        "SHIPPING",
        "REFUND",
        "COMMISSION_REVERSAL",
        "ADJUSTMENT",
      ],
      index: true,
    },
    direction: {
      type: String,
      required: [true, "Ledger entry direction is required."],
      enum: ["CREDIT", "DEBIT"],
    },
    amount: {
      type: Number,
      required: [true, "Ledger entry amount is required."],
      min: [0, "Amount cannot be negative."],
    },
    amountInPaise: {
      type: Number,
      required: [true, "Ledger entry amount in paise is required."],
      min: [0, "Amount in paise cannot be negative."],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    netSellerImpact: {
      type: Number,
      required: [true, "Net seller impact is required."],
      // Positive for credit to seller (increases payable balance),
      // Negative for debit from seller (decreases payable balance)
    },
    description: {
      type: String,
      required: [true, "Entry description is required."],
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Prevents tampering with historical financial audit logs
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: false }, // Enforces strict ledger immutability
  }
);

// Compound indexes for multi-tenant isolation and fast balance calculation
StoreLedgerSchema.index({ sellerId: 1, createdAt: -1 });
StoreLedgerSchema.index({ sellerId: 1, type: 1 });
StoreLedgerSchema.index({ storeOrderId: 1, fulfilmentOrderId: 1 });

export default model("StoreLedger", StoreLedgerSchema);
