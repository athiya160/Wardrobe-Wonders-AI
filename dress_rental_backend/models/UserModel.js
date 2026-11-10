import { Schema, model } from "mongoose";

// Body & Fit Measurements sub-schema
const MeasurementSchema = new Schema(
  {
    bust: {
      type: Number,
      min: [15, "Bust measurement must be at least 15."],
      max: [80, "Bust measurement cannot exceed 80."],
      default: null,
    },
    waist: {
      type: Number,
      min: [15, "Waist measurement must be at least 15."],
      max: [80, "Waist measurement cannot exceed 80."],
      default: null,
    },
    hips: {
      type: Number,
      min: [15, "Hips measurement must be at least 15."],
      max: [90, "Hips measurement cannot exceed 90."],
      default: null,
    },
    height: {
      type: Number,
      min: [36, "Height measurement must be at least 36."],
      max: [260, "Height measurement cannot exceed 260."],
      default: null,
    },
    unit: {
      type: String,
      enum: ["in", "cm"],
      default: "in",
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Delivery Address sub-schema
const AddressSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Recipient name is required."],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Contact phone is required."],
      trim: true,
    },
    street: {
      type: String,
      required: [true, "Street address is required."],
      trim: true,
    },
    houseNo: {
      type: String,
      trim: true,
      default: "",
    },
    landmark: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required."],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "PIN code is required."],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code."],
    },
    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual zip compatibility for checkout forms
AddressSchema.virtual("zip").get(function () {
  return this.pincode;
});
AddressSchema.set("toJSON", { virtuals: true });
AddressSchema.set("toObject", { virtuals: true });

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    firstname: {
      type: String,
      trim: true,
    },
    lastname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    // Legacy password field retained for backward compatibility with existing databases
    password: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      default: "customer",
    },
    // Legacy type field kept synchronized with role
    type: {
      type: String,
      default: "customer",
    },
    avatar: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Phase 4C: Persistent customer data
    measurements: {
      type: MeasurementSchema,
      default: () => ({}),
    },
    addresses: [AddressSchema],
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Synchronize names and role/type before saving
UserSchema.pre("save", function (next) {
  if (this.role) {
    this.type = this.role;
  } else if (this.type) {
    this.role = this.type === "user" ? "customer" : this.type;
  }

  if (this.firstname && !this.name) {
    this.name = `${this.firstname} ${this.lastname || ""}`.trim();
  } else if (this.name && !this.firstname) {
    const parts = this.name.split(" ");
    this.firstname = parts[0];
    this.lastname = parts.slice(1).join(" ") || "";
  }

  if (!this.username && this.email) {
    this.username = this.email.split("@")[0];
  }

  next();
});

export default model("user", UserSchema);
