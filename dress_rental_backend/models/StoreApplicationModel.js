import { Schema, model } from "mongoose";

const ApplicationReviewHistorySchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ["APPROVED", "REJECTED", "MORE_INFORMATION_REQUIRED", "SUSPENDED"],
    },
    previousStatus: { type: String, default: "" },
    newStatus: { type: String, required: true },
    notes: { type: String, trim: true, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "user", default: null },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const StoreApplicationSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    sellerType: {
      type: String,
      enum: [
        "boutique",
        "jewellery",
        "designer",
        "home_business",
        "individual",
        "reseller",
        "creator",
      ],
      required: [true, "Seller type is required."],
    },
    storeName: {
      type: String,
      required: [true, "Store name is required."],
      trim: true,
      minlength: [2, "Store name must be at least 2 characters."],
      maxlength: [100, "Store name cannot exceed 100 characters."],
    },
    storeDescription: {
      type: String,
      trim: true,
      maxlength: [1000, "Store description cannot exceed 1000 characters."],
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    location: {
      address: { type: String, trim: true, default: "" },
      city: { type: String, required: [true, "City is required."], trim: true },
      state: { type: String, required: [true, "State is required."], trim: true },
      pincode: { type: String, required: [true, "PIN code is required."], trim: true },
      country: { type: String, default: "India", trim: true },
    },
    contact: {
      email: {
        type: String,
        required: [true, "Contact email is required."],
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: [true, "Contact phone is required."],
        trim: true,
      },
      website: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
    },
    verificationMetadata: {
      businessRegNumber: { type: String, trim: true, default: "" },
      idProofType: {
        type: String,
        enum: ["AADHAAR", "PAN", "PASSPORT", "GSTIN", "OTHER", ""],
        default: "",
      },
      idProofDocUrl: { type: String, trim: true, default: "" },
      taxId: { type: String, trim: true, default: "" },
      notes: { type: String, trim: true, default: "" },
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_REVIEW",
        "APPROVED",
        "REJECTED",
        "MORE_INFORMATION_REQUIRED",
        "SUSPENDED",
      ],
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
    reviewHistory: [ApplicationReviewHistorySchema],
  },
  {
    timestamps: true,
  }
);

StoreApplicationSchema.index({ sellerId: 1, status: 1 });

export default model("StoreApplication", StoreApplicationSchema);
