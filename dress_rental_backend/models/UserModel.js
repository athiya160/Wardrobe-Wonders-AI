import { Schema, model } from "mongoose";

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
