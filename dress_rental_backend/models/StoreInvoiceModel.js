import { Schema, model } from "mongoose";

const InvoiceSellerShipmentSchema = new Schema(
  {
    fulfilmentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreFulfilmentOrder",
      required: true,
    },
    fulfilmentOrderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    storeSlug: {
      type: String,
      default: "",
      trim: true,
    },
    originCity: {
      type: String,
      default: "Jaipur",
      trim: true,
    },
    originState: {
      type: String,
      default: "Rajasthan",
      trim: true,
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "StoreProduct" },
        title: { type: String, required: true },
        brand: { type: String, default: "" },
        size: { type: String, default: "" },
        color: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StoreInvoiceSchema = new Schema(
  {
    invoiceNumber: {
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
      unique: true,
      index: true,
    },
    orderNumber: {
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
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    billingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      houseNo: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "StorePayment",
      default: null,
    },
    merchantTransactionId: {
      type: String,
      default: "",
      trim: true,
    },
    paymentProvider: {
      type: String,
      default: "PHONEPE",
      trim: true,
    },
    paymentStatus: {
      type: String,
      default: "PAID",
      trim: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    sellerBreakdown: [InvoiceSellerShipmentSchema],
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
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

StoreInvoiceSchema.index({ customerId: 1, createdAt: -1 });

export default model("StoreInvoice", StoreInvoiceSchema);
