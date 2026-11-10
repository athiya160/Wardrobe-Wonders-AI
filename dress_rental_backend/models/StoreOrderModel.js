import { Schema, model } from "mongoose";

const StoreOrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "StoreProduct",
      required: [true, "Product reference is required."],
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required."],
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Seller reference is required."],
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    variantId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    size: {
      type: String,
      default: "",
      trim: true,
    },
    color: {
      type: String,
      default: "",
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const ShippingAddressSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    houseNo: { type: String, default: "", trim: true },
    landmark: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    label: { type: String, default: "Home", trim: true },
  },
  { _id: false }
);

const StatusHistoryItemSchema = new Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
    changedByName: { type: String, default: "" },
    role: {
      type: String,
      enum: ["customer", "seller", "admin", "system"],
      default: "system",
    },
    note: { type: String, default: "" },
  },
  { _id: true }
);

const StoreOrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    shippingAddress: {
      type: ShippingAddressSnapshotSchema,
      required: true,
    },
    items: [StoreOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalShippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "ORDER_PLACED",
        "CONFIRMED",
        "PROCESSING",
        "PARTIALLY_SHIPPED",
        "PARTIALLY_DISPATCHED",
        "SHIPPED",
        "PARTIALLY_DELIVERED",
        "DELIVERED",
        "PARTIALLY_CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
        "COMPLETED",
        "CANCELLED",
        "FAILED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "PHONEPE",
      trim: true,
    },
    fulfilmentOrderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "StoreFulfilmentOrder",
      },
    ],
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    statusHistory: [StatusHistoryItemSchema],
  },
  {
    timestamps: true,
  }
);

export default model("StoreOrder", StoreOrderSchema);
