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
});

export default model("order", OrderSchema);
