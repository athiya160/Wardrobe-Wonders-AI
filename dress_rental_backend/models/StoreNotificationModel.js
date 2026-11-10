import { Schema, model } from "mongoose";

const StoreNotificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
      index: true,
    },
    parentOrderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreOrder",
      default: null,
      index: true,
    },
    parentOrderNumber: {
      type: String,
      default: "",
      trim: true,
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
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "ORDER_CONFIRMED",
        "PROCESSING_STARTED",
        "ORDER_SHIPPED",
        "DELIVERY_UPDATED",
        "ORDER_DELIVERED",
        "ORDER_CANCELLED",
        "CANCELLATION_REQUESTED",
        "CANCELLATION_APPROVED",
        "CANCELLATION_REJECTED",
        "RETURN_REQUESTED",
        "RETURN_APPROVED",
        "RETURN_REJECTED",
        "RETURN_ITEM_RECEIVED",
        "REFUND_UPDATED",
        "INVOICE_GENERATED",
        "REVIEW_SUBMITTED",
        "REVIEW_MODERATED",
        "SYSTEM",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    channel: {
      type: String,
      default: "IN_APP",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

StoreNotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default model("StoreNotification", StoreNotificationSchema);
