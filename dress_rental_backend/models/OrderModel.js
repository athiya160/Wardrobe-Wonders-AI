import { Schema, model } from "mongoose";

const OrderSchema = Schema({
  userEmail: {
    type: String,
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  address: {
    street: String,
    city: String,
    zip: String,
    pincode: String,
    houseNo: String,
    landmark: String,
    state: String,
    phone: String,
    name: String,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Processing", // can be Processing, Shipped, Delivered
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  // Step 8 & 9 Rental Lifecycle Fields
  providerId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    index: true,
  },
  rentalStartDate: {
    type: Date,
  },
  rentalEndDate: {
    type: Date,
  },
  rentalDays: {
    type: Number,
  },
  securityDeposit: {
    type: Number,
    default: 0,
  },
  rentalFee: {
    type: Number,
  },
  customerNotes: {
    type: String,
  },
  requestStatus: {
    type: String,
    enum: ["Pending", "Accepted", "Declined", "Active", "Completed", "Cancelled"],
    default: "Pending",
  },
  // Step 10: Decision tracking, reasons & audit timestamps
  declineReason: {
    type: String,
    default: "",
  },
  acceptedAt: {
    type: Date,
  },
  declinedAt: {
    type: Date,
  },
  dispatchedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  inspectionNotes: {
    type: String,
    default: "",
  },
  cancelledAt: {
    type: Date,
  },
  cancelledBy: {
    type: String,
    enum: ["customer", "provider", "admin"],
  },
  // Step 12: Payment, Security Deposit & Refund Lifecycle
  paymentStatus: {
    type: String,
    enum: [
      "PENDING",
      "PROCESSING",
      "PAID",
      "FAILED",
      "CANCELLED",
      "REFUND_PENDING",
      "REFUNDED",
      "REFUND_REQUIRED",
      "PAYMENT_AMOUNT_MISMATCH",
    ],
    default: "PENDING",
  },
  depositStatus: {
    type: String,
    enum: [
      "NOT_APPLICABLE",
      "HELD",
      "RELEASE_PENDING",
      "REFUND_PROCESSING",
      "REFUNDED",
      "PARTIALLY_DEDUCTED",
      "DEDUCTED",
      "MANUAL_REFUND_REQUIRED",
    ],
    default: "HELD",
  },
  refundStatus: {
    type: String,
    enum: [
      "NOT_REQUESTED",
      "PENDING",
      "PROCESSING",
      "SUCCEEDED",
      "FAILED",
      "MANUAL_REFUND_REQUIRED",
    ],
    default: "NOT_REQUESTED",
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundReason: {
    type: String,
    default: "",
  },
  refundTransactionId: {
    type: String,
  },
  refundInitiatedAt: {
    type: Date,
  },
  refundCompletedAt: {
    type: Date,
  },
  refundFailureReason: {
    type: String,
    default: "",
  },
  manualRefundNotes: {
    type: String,
    default: "",
  },
  manualRefundProcessedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  manualRefundProcessedAt: {
    type: Date,
  },
  failureReason: {
    type: String,
    default: "",
  },
  depositRefundedAt: {
    type: Date,
  },
  depositDeductionReason: {
    type: String,
    default: "",
  },
  depositDeductionAmount: {
    type: Number,
    default: 0,
  },
});

OrderSchema.index({ userEmail: 1, orderDate: -1 });
OrderSchema.index({ providerId: 1, requestStatus: 1 });

export default model("order", OrderSchema);
