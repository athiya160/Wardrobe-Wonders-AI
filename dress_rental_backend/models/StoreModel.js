import { Schema, model } from "mongoose";

const StoreSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },
    storeApplicationId: {
      type: Schema.Types.ObjectId,
      ref: "StoreApplication",
      required: true,
    },
    storeName: {
      type: String,
      required: [true, "Store name is required."],
      trim: true,
      minlength: [2, "Store name must be at least 2 characters."],
      maxlength: [100, "Store name cannot exceed 100 characters."],
    },
    storeSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    storeType: {
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
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
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
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
    },
    contact: {
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
    },
    shippingPolicy: {
      standardShippingFee: { type: Number, default: 0, min: 0 },
      estimatedDaysMin: { type: Number, default: 2, min: 1 },
      estimatedDaysMax: { type: Number, default: 7, min: 1 },
      freeShippingAbove: { type: Number, default: 0, min: 0 },
      policyDetails: {
        type: String,
        trim: true,
        default: "Dispatched within 2-3 business days via verified courier with live tracking.",
      },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Store", StoreSchema);
