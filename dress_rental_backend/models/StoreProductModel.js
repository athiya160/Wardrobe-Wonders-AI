import { Schema, model } from "mongoose";

const ProductVariantSchema = new Schema(
  {
    size: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
    stockQuantity: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true, default: "" },
    priceOverride: { type: Number, min: 0, default: null },
  },
  { _id: true }
);

const ReviewHistorySchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "ARCHIVED", "CHANGES_REQUESTED"],
    },
    notes: { type: String, trim: true, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const StoreProductSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Seller identity is required."],
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store reference is required."],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required."],
      trim: true,
      minlength: [3, "Title must be at least 3 characters."],
      maxlength: [150, "Title cannot exceed 150 characters."],
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters."],
    },
    category: {
      type: String,
      required: [true, "Store category is required."],
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: "",
    },
    condition: {
      type: String,
      enum: ["NEW", "PRE_OWNED"],
      required: [true, "Condition (NEW or PRE_OWNED) is required."],
      default: "NEW",
      index: true,
    },
    conditionDescription: {
      type: String,
      trim: true,
      default: "",
    },
    defectImages: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Product purchase price is required."],
      min: [0, "Price must be non-negative."],
    },
    originalRetailPrice: {
      type: Number,
      min: [0, "Original retail price must be non-negative."],
      default: null,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required."],
      min: [0, "Stock quantity cannot be negative."],
      default: 1,
    },
    images: {
      type: [String],
      required: [true, "At least one product image is required."],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one product image is required.",
      },
    },
    variants: [ProductVariantSchema],
    shippingInformation: {
      shippingFee: { type: Number, default: 0, min: 0 },
      dispatchDays: { type: Number, default: 2, min: 1 },
      shippingMethod: { type: String, default: "Standard Domestic" },
      returnPolicyDays: { type: Number, default: 7, min: 0 },
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "ARCHIVED", "CHANGES_REQUESTED"],
      default: "PENDING_REVIEW",
      index: true,
    },
    adminReviewNotes: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewHistory: [ReviewHistorySchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation: pre-owned items must disclose condition details
StoreProductSchema.pre("validate", function (next) {
  if (this.condition === "PRE_OWNED") {
    if (!this.conditionDescription || this.conditionDescription.trim().length === 0) {
      this.invalidate(
        "conditionDescription",
        "Pre-owned listings require a condition description disclosing wear, usage, or any flaws."
      );
    }
  }
  next();
});

StoreProductSchema.index({ status: 1, category: 1 });
StoreProductSchema.index({ sellerId: 1, status: 1 });
StoreProductSchema.index({ storeId: 1, status: 1 });

export default model("StoreProduct", StoreProductSchema);
