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
    houseNo: String,
    landmark: String,
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
  // Step 12: Payment & Security Deposit Lifecycle
  paymentStatus: {
    type: String,
    enum: ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUND_PENDING", "REFUNDED"],
    default: "PAID",
  },
  depositStatus: {
    type: String,
    enum: ["HELD", "RELEASE_PENDING", "REFUNDED", "PARTIALLY_DEDUCTED", "DEDUCTED"],
    default: "HELD",
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

export default model("order", OrderSchema);
