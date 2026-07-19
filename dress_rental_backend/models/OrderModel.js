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
  }
});

export default model("order", OrderSchema);
