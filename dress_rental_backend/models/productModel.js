import { Schema, model } from "mongoose";

const ProductModel = new Schema(
  {
    // Provider identity
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: false, // optional for existing seed catalog items
      index: true,
    },
    // Title / Name
    title: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Pricing
    rentalPricePerDay: {
      type: Number,
    },
    price: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Schema.Types.Mixed,
    },
    advance: {
      type: String,
      required: true,
    },
    // Imagery
    image: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    // Taxonomy & Specifications
    category: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: false,
    },
    size: {
      type: String,
      required: false,
      trim: true,
    },
    brand: {
      type: String,
      required: false,
      trim: true,
    },
    condition: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    tags: {
      type: [String],
      required: false,
    },
    occasion: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      required: false,
    },
    pattern: {
      type: String,
      required: false,
    },
    style: {
      type: String,
      required: false,
    },
    season: {
      type: String,
      required: false,
    },
    location: {
      type: Schema.Types.Mixed,
      required: false,
    },
    externalUrl: {
      type: String,
      required: false,
    },
    ownershipConfirmed: {
      type: Boolean,
      default: true,
    },
    // Availability & Inventory
    stock: {
      type: String,
      default: "1",
    },
    availability: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "pending_approval", "rented", "inactive"],
      default: "active",
      index: true,
    },
    // Step 8 & 9: Booked dates for rental calendar and reservation conflict prevention
    bookedDates: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        orderId: { type: Schema.Types.ObjectId, ref: "order" },
      },
    ],
    reviews: [
      {
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        username: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Bi-directional synchronization between legacy and provider fields
ProductModel.pre("save", function (next) {
  if (this.title && (!this.name || this.isModified("title"))) {
    this.name = this.title;
  } else if (this.name && (!this.title || this.isModified("name"))) {
    this.title = this.name;
  }

  if (this.rentalPricePerDay != null && (this.price == null || this.isModified("rentalPricePerDay"))) {
    this.price = this.rentalPricePerDay;
  } else if (this.price != null && (this.rentalPricePerDay == null || this.isModified("price"))) {
    this.rentalPricePerDay = this.price;
  }

  if (this.securityDeposit != null && (!this.advance || this.isModified("securityDeposit"))) {
    this.advance = String(this.securityDeposit);
  } else if (this.advance != null && (this.securityDeposit == null || this.isModified("advance"))) {
    this.securityDeposit = this.advance;
  }

  if (Array.isArray(this.images) && this.images.length > 0 && (!this.image || this.isModified("images"))) {
    this.image = this.images[0];
  } else if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }

  if (!this.stock) {
    this.stock = "1";
  }

  next();
});

export default model("Product", ProductModel);
