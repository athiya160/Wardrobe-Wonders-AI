import { Schema, model } from "mongoose";

const FulfilmentOrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "StoreProduct",
      required: [true, "Product reference is required."],
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

const FulfilmentDeliveryAddressSchema = new Schema(
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

const DispatchDetailsSchema = new Schema(
  {
    courierName: { type: String, default: "", trim: true },
    trackingNumber: { type: String, default: "", trim: true },
    trackingUrl: { type: String, default: "", trim: true },
    dispatchedAt: { type: Date, default: null },
    estimatedDelivery: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    deliveryConfirmationNote: { type: String, default: "", trim: true },
    cancellationReason: { type: String, default: "", trim: true },
    cancelledBy: { type: String, default: "", trim: true },
    cancelledAt: { type: Date, default: null },
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
      default: "seller",
    },
    note: { type: String, default: "" },
  },
  { _id: true }
);

const StoreFulfilmentOrderSchema = new Schema(
  {
    fulfilmentOrderNumber: {
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
      index: true,
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
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeSlug: {
      type: String,
      required: true,
      trim: true,
    },
    items: [FulfilmentOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
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
        "SHIPPED",
        "DISPATCHED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },
    deliveryAddress: {
      type: FulfilmentDeliveryAddressSchema,
      required: true,
    },
    dispatchDetails: {
      type: DispatchDetailsSchema,
      default: () => ({}),
    },
    statusHistory: [StatusHistoryItemSchema],
  },
  {
    timestamps: true,
  }
);

export default model("StoreFulfilmentOrder", StoreFulfilmentOrderSchema);
