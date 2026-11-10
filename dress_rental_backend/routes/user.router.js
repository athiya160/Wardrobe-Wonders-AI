import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import UserModel from "../models/UserModel.js";
import ProductModel from "../models/productModel.js";
import { authenticateToken } from "../middleware/auth.js";
import { getJwtSecret } from "../config/envValidator.js";
import { authLimiter } from "../middleware/security.js";

const UserRouter = new Router();

// Helper to format safe user object without exposing passwords
const toSafeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name || `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username,
  firstname: user.firstname,
  lastname: user.lastname,
  username: user.username,
  email: user.email,
  phone: user.phone,
  role: user.role || user.type || "customer",
  type: user.role || user.type || "customer",
  avatar: user.avatar || "",
  isActive: user.isActive !== false,
  measurements: user.measurements || {},
  addresses: user.addresses || [],
  wishlist: user.wishlist || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Helper to sign JWT
const signUserToken = (user) => {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      id: user._id,
      role: user.role || user.type || "customer",
      email: user.email,
    },
    secret,
    { expiresIn: "7d" }
  );
};

// PIN code validator for Indian postal codes (6 digits, non-zero start)
const isValidPinCode = (pin) => typeof pin === "string" && /^[1-9][0-9]{5}$/.test(pin.trim());

// =========================================================================
// AUTHENTICATION ROUTES
// =========================================================================

// POST /login
UserRouter.post("/login", async (req, res) => {
  try {
    const { body } = req;
    if (!body || !body.email || !body.password) {
      return res.status(400).json({
        status: false,
        message: "Please enter both email and password.",
        token: null,
      });
    }

    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return res.status(400).json({
        status: false,
        message: "Email and password must be valid strings.",
        token: null,
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: false,
        message: "Database service is temporarily unavailable. Please verify MongoDB is running.",
        token: null,
      });
    }

    const email = body.email.trim().toLowerCase();
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password.",
        token: null,
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        status: false,
        message: "Your account is deactivated.",
        token: null,
      });
    }

    // Password verification with backward-compatibility support
    let isMatch = false;

    if (user.passwordHash) {
      isMatch = await bcrypt.compare(body.password, user.passwordHash);
    } else if (user.password) {
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
        isMatch = await bcrypt.compare(body.password, user.password);
      } else if (body.password === user.password) {
        // Plaintext match: auto-migrate to bcrypt hash
        isMatch = true;
        try {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(body.password, salt);
          user.password = undefined;
          await user.save();
          console.log(`[Auth Migration] Auto-migrated legacy plaintext password for: ${user.email}`);
        } catch (migErr) {
          console.error("[Auth Migration] Migration save error:", migErr);
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password.",
        token: null,
      });
    }

    const token = signUserToken(user);
    const safeUser = toSafeUser(user);

    return res.status(200).json({
      status: true,
      message: "Login successful.",
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error("Login route error:", error);
    return res.status(500).json({
      status: false,
      message: "An internal server error occurred during login.",
      token: null,
    });
  }
});

// POST /register
UserRouter.post("/register", async (req, res) => {
  try {
    const { body } = req;
    if (!body) {
      return res.status(400).json({ status: false, message: "Request body is required." });
    }

    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return res.status(400).json({
        status: false,
        message: "Email and password must be valid strings.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: false,
        message: "Database service is temporarily unavailable. Please verify MongoDB is running.",
      });
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email) {
      return res.status(400).json({ status: false, message: "Email is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: false, message: "Invalid email format." });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Role validation: safely default to customer, forbid privileged creation via public signup
    let role = "customer";
    const requestedRole = (body.role || body.type || "").toLowerCase().trim();
    if (["admin", "superadmin", "administrator", "root", "moderator"].includes(requestedRole)) {
      return res.status(400).json({
        status: false,
        message: "Admin and privileged accounts cannot be registered through public signup.",
      });
    } else if (requestedRole === "provider") {
      role = "provider";
    }

    // Duplicate email check
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User with this email already exists.",
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Resolve name fields
    const firstname = body.firstname || (body.name ? body.name.split(" ")[0] : "");
    const lastname = body.lastname || (body.name ? body.name.split(" ").slice(1).join(" ") : "");
    const name = body.name || `${firstname} ${lastname}`.trim() || body.username || "User";
    const username = body.username || (email.split("@")[0] + "_" + Math.floor(100 + Math.random() * 900));

    const newUser = new UserModel({
      name,
      firstname,
      lastname,
      username,
      email,
      phone: body.phone || body.mobileNumber || "",
      passwordHash,
      role,
      type: role,
      avatar: body.avatar || "",
      isActive: true,
      measurements: {},
      addresses: [],
      wishlist: [],
    });

    await newUser.save();

    const token = signUserToken(newUser);
    const safeUser = toSafeUser(newUser);

    return res.status(200).json({
      status: true,
      message: "Registration successful.",
      user: safeUser,
      token,
      ...safeUser,
    });
  } catch (error) {
    console.error("Register route error:", error);
    return res.status(400).json({
      status: false,
      message: error.message || "Failed to register user.",
    });
  }
});

// GET /auth/me - Current authenticated user
UserRouter.get("/auth/me", authenticateToken, async (req, res) => {
  const user = await UserModel.findById(req.user._id);
  if (!user) return res.status(404).json({ status: false, message: "User not found." });
  return res.status(200).json({
    status: true,
    user: toSafeUser(user),
  });
});

// GET /me alias
UserRouter.get("/me", authenticateToken, async (req, res) => {
  const user = await UserModel.findById(req.user._id);
  if (!user) return res.status(404).json({ status: false, message: "User not found." });
  return res.status(200).json({
    status: true,
    user: toSafeUser(user),
  });
});

// =========================================================================
// CUSTOMER PROFILE & MEASUREMENTS APIS (Step 2 & Step 3)
// =========================================================================

// Handler to get profile
const getProfileHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }
    return res.status(200).json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve user profile." });
  }
};

UserRouter.get("/user/profile", authenticateToken, getProfileHandler);
UserRouter.get("/profile", authenticateToken, getProfileHandler);

// Handler to update profile (with strict mass-assignment protection)
const updateProfileHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    const { body } = req;
    if (!body) {
      return res.status(400).json({ success: false, message: "Update payload required." });
    }

    // Mass-assignment protection: explicitly ignore role, type, isActive, password, passwordHash, email changes
    if (body.firstname !== undefined) user.firstname = String(body.firstname).trim();
    if (body.lastname !== undefined) user.lastname = String(body.lastname).trim();
    if (body.name !== undefined) user.name = String(body.name).trim();
    if (body.phone !== undefined) user.phone = String(body.phone).trim();
    if (body.avatar !== undefined) user.avatar = String(body.avatar).trim();

    // Re-synchronize name if either firstname or lastname was supplied
    if (body.firstname !== undefined || body.lastname !== undefined) {
      user.name = `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.name;
    }

    // Also support updating measurements directly in profile payload
    if (body.measurements && typeof body.measurements === "object") {
      const m = body.measurements;
      const currentM = user.measurements || {};
      const newM = {
        bust: m.bust !== undefined && m.bust !== "" && m.bust !== null ? Number(m.bust) : currentM.bust ?? null,
        waist: m.waist !== undefined && m.waist !== "" && m.waist !== null ? Number(m.waist) : currentM.waist ?? null,
        hips: m.hips !== undefined && m.hips !== "" && m.hips !== null ? Number(m.hips) : currentM.hips ?? null,
        height: m.height !== undefined && m.height !== "" && m.height !== null ? Number(m.height) : currentM.height ?? null,
        unit: m.unit === "cm" ? "cm" : "in",
        notes: m.notes !== undefined ? String(m.notes).trim() : currentM.notes || "",
      };

      // Range validations
      if (newM.bust !== null && (newM.bust < 15 || newM.bust > 80)) {
        return res.status(400).json({ success: false, message: "Bust measurement must be between 15 and 80." });
      }
      if (newM.waist !== null && (newM.waist < 15 || newM.waist > 80)) {
        return res.status(400).json({ success: false, message: "Waist measurement must be between 15 and 80." });
      }
      if (newM.hips !== null && (newM.hips < 15 || newM.hips > 90)) {
        return res.status(400).json({ success: false, message: "Hips measurement must be between 15 and 90." });
      }
      if (newM.height !== null && (newM.height < 36 || newM.height > 260)) {
        return res.status(400).json({ success: false, message: "Height measurement must be between 36 and 260." });
      }

      user.measurements = newM;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

UserRouter.put("/user/profile", authenticateToken, updateProfileHandler);
UserRouter.put("/profile", authenticateToken, updateProfileHandler);

// Handler to update body measurements exclusively
const updateMeasurementsHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const m = req.body || {};
    const currentM = user.measurements || {};

    const newM = {
      bust: m.bust !== undefined && m.bust !== "" && m.bust !== null ? Number(m.bust) : currentM.bust ?? null,
      waist: m.waist !== undefined && m.waist !== "" && m.waist !== null ? Number(m.waist) : currentM.waist ?? null,
      hips: m.hips !== undefined && m.hips !== "" && m.hips !== null ? Number(m.hips) : currentM.hips ?? null,
      height: m.height !== undefined && m.height !== "" && m.height !== null ? Number(m.height) : currentM.height ?? null,
      unit: m.unit === "cm" ? "cm" : "in",
      notes: m.notes !== undefined ? String(m.notes).trim() : currentM.notes || "",
    };

    // Range validations
    if (newM.bust !== null && (newM.bust < 15 || newM.bust > 80)) {
      return res.status(400).json({ success: false, message: "Bust measurement must be between 15 and 80." });
    }
    if (newM.waist !== null && (newM.waist < 15 || newM.waist > 80)) {
      return res.status(400).json({ success: false, message: "Waist measurement must be between 15 and 80." });
    }
    if (newM.hips !== null && (newM.hips < 15 || newM.hips > 90)) {
      return res.status(400).json({ success: false, message: "Hips measurement must be between 15 and 90." });
    }
    if (newM.height !== null && (newM.height < 36 || newM.height > 260)) {
      return res.status(400).json({ success: false, message: "Height measurement must be between 36 and 260." });
    }

    user.measurements = newM;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Measurements saved successfully.",
      measurements: user.measurements,
    });
  } catch (error) {
    console.error("Update measurements error:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to update measurements." });
  }
};

UserRouter.put("/user/measurements", authenticateToken, updateMeasurementsHandler);
UserRouter.put("/measurements", authenticateToken, updateMeasurementsHandler);

// Handler to clear body measurements
const clearMeasurementsHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.measurements = {};
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Measurements cleared successfully.",
      measurements: {},
    });
  } catch (error) {
    console.error("Clear measurements error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear measurements." });
  }
};

UserRouter.delete("/user/measurements", authenticateToken, clearMeasurementsHandler);
UserRouter.delete("/measurements", authenticateToken, clearMeasurementsHandler);

// =========================================================================
// DELIVERY ADDRESSES APIS (Step 4 & Step 8)
// =========================================================================

// GET /user/addresses
const getAddressesHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Sort addresses with default address placed first
    const sortedAddresses = [...(user.addresses || [])].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    return res.status(200).json({
      success: true,
      count: sortedAddresses.length,
      addresses: sortedAddresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve delivery addresses." });
  }
};

UserRouter.get("/user/addresses", authenticateToken, getAddressesHandler);
UserRouter.get("/addresses", authenticateToken, getAddressesHandler);

// POST /user/addresses
const addAddressHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const { name, phone, street, houseNo, landmark, city, state, pincode, zip, label, isDefault } = req.body || {};
    const pin = (pincode || zip || "").trim();

    const recipientName = (name || user.name || "Customer").trim();
    const recipientPhone = (phone || user.phone || "9999999999").trim();

    if (!street || !street.trim()) return res.status(400).json({ success: false, message: "Street address is required." });
    if (!city || !city.trim()) return res.status(400).json({ success: false, message: "City is required." });
    if (!state || !state.trim()) return res.status(400).json({ success: false, message: "State is required." });

    if (!isValidPinCode(pin)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit Indian PIN code (e.g. 560001).",
      });
    }

    const shouldBeDefault = Boolean(isDefault) || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      name: recipientName,
      phone: recipientPhone,
      street: street.trim(),
      houseNo: (houseNo || "").trim(),
      landmark: (landmark || "").trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pin,
      label: label === "Work" || label === "Other" ? label : "Home",
      isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    const created = user.addresses[user.addresses.length - 1];

    return res.status(201).json({
      success: true,
      message: "Delivery address added successfully.",
      address: created,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Add address error:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to add delivery address." });
  }
};

UserRouter.post("/user/addresses", authenticateToken, addAddressHandler);
UserRouter.post("/addresses", authenticateToken, addAddressHandler);

// PUT /user/addresses/:addressId
const updateAddressHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const addr = user.addresses.id(req.params.addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found under your account." });
    }

    const { name, phone, street, houseNo, landmark, city, state, pincode, zip, label, isDefault } = req.body || {};

    if (name !== undefined) addr.name = String(name).trim();
    if (phone !== undefined) addr.phone = String(phone).trim();
    if (street !== undefined) addr.street = String(street).trim();
    if (houseNo !== undefined) addr.houseNo = String(houseNo).trim();
    if (landmark !== undefined) addr.landmark = String(landmark).trim();
    if (city !== undefined) addr.city = String(city).trim();
    if (state !== undefined) addr.state = String(state).trim();
    if (label !== undefined && (label === "Home" || label === "Work" || label === "Other")) {
      addr.label = label;
    }

    const pin = pincode || zip;
    if (pin !== undefined) {
      if (!isValidPinCode(String(pin))) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 6-digit Indian PIN code.",
        });
      }
      addr.pincode = String(pin).trim();
    }

    if (isDefault === true) {
      user.addresses.forEach((a) => {
        a.isDefault = String(a._id) === String(addr._id);
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Delivery address updated successfully.",
      address: addr,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Update address error:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to update address." });
  }
};

UserRouter.put("/user/addresses/:addressId", authenticateToken, updateAddressHandler);
UserRouter.put("/addresses/:addressId", authenticateToken, updateAddressHandler);

// DELETE /user/addresses/:addressId
const deleteAddressHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const addr = user.addresses.id(req.params.addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found under your account." });
    }

    const wasDefault = addr.isDefault;
    user.addresses.pull({ _id: req.params.addressId });

    // If the deleted address was default, re-assign default to the first remaining address
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address removed successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Delete address error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete address." });
  }
};

UserRouter.delete("/user/addresses/:addressId", authenticateToken, deleteAddressHandler);
UserRouter.delete("/addresses/:addressId", authenticateToken, deleteAddressHandler);

// PATCH /user/addresses/:addressId/default
const setDefaultAddressHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const addr = user.addresses.id(req.params.addressId);
    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found under your account." });
    }

    user.addresses.forEach((a) => {
      a.isDefault = String(a._id) === String(addr._id);
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Default delivery address updated.",
      address: addr,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Set default address error:", error);
    return res.status(500).json({ success: false, message: "Failed to update default address." });
  }
};

UserRouter.patch("/user/addresses/:addressId/default", authenticateToken, setDefaultAddressHandler);
UserRouter.patch("/addresses/:addressId/default", authenticateToken, setDefaultAddressHandler);

// POST /user/addresses/migrate (Safe one-time localStorage migration)
const migrateAddressesHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const { addresses } = req.body || {};
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No addresses supplied for migration.",
        migratedCount: 0,
        addresses: user.addresses,
      });
    }

    let migratedCount = 0;

    for (const item of addresses) {
      const pin = (item.pincode || item.zip || "").trim();
      const street = (item.street || item.address || "").trim();
      const name = (item.name || user.name || "Recipient").trim();
      const phone = (item.phone || user.phone || "9999999999").trim();
      const city = (item.city || "Mumbai").trim();
      const state = (item.state || "Maharashtra").trim();

      // Check if this address already exists to prevent duplicate migration
      const exists = user.addresses.some(
        (a) => a.street === street && a.city === city && a.pincode === pin
      );

      if (!exists && street && isValidPinCode(pin)) {
        user.addresses.push({
          name,
          phone,
          street,
          houseNo: (item.houseNo || "").trim(),
          landmark: (item.landmark || "").trim(),
          city,
          state,
          pincode: pin,
          label: item.label === "Work" || item.label === "Other" ? item.label : "Home",
          isDefault: user.addresses.length === 0 || Boolean(item.isDefault),
        });
        migratedCount++;
      }
    }

    // Ensure at least one address is default if any exist
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `Successfully migrated ${migratedCount} local address(es).`,
      migratedCount,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Migrate addresses error:", error);
    return res.status(400).json({ success: false, message: "Address migration failed." });
  }
};

UserRouter.post("/user/addresses/migrate", authenticateToken, migrateAddressesHandler);
UserRouter.post("/addresses/migrate", authenticateToken, migrateAddressesHandler);

// =========================================================================
// WISHLIST APIS (Step 5)
// =========================================================================

// GET /user/wishlist
const getWishlistHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).populate({
      path: "wishlist",
      match: { status: { $ne: "deleted" } },
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Filter out null entries (where garment was removed/deleted from MongoDB)
    const validWishlist = (user.wishlist || []).filter((item) => item !== null && typeof item === "object");

    // Clean up any orphan IDs if needed
    if (validWishlist.length !== user.wishlist.length) {
      user.wishlist = validWishlist.map((item) => item._id);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      count: validWishlist.length,
      wishlist: validWishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve wishlist." });
  }
};

UserRouter.get("/user/wishlist", authenticateToken, getWishlistHandler);
UserRouter.get("/wishlist", authenticateToken, getWishlistHandler);

// POST /user/wishlist/migrate (Safe one-time migration of local wishlist items)
const migrateWishlistHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const rawList = req.body?.productIds || req.body?.wishlist || [];
    const productIds = Array.isArray(rawList) ? rawList : [];
    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No wishlist items supplied for migration.",
        migratedCount: 0,
        count: user.wishlist.length,
      });
    }

    let migratedCount = 0;
    const existingSet = new Set((user.wishlist || []).map((id) => String(id)));

    for (const rawId of productIds) {
      const id = typeof rawId === "object" && rawId?._id ? String(rawId._id) : String(rawId);
      if (mongoose.Types.ObjectId.isValid(id) && !existingSet.has(id)) {
        const productExists = await ProductModel.exists({ _id: id });
        if (productExists) {
          user.wishlist.push(new mongoose.Types.ObjectId(id));
          existingSet.add(id);
          migratedCount++;
        }
      }
    }

    if (migratedCount > 0) {
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: `Successfully migrated ${migratedCount} local wishlist item(s).`,
      migratedCount,
      count: user.wishlist.length,
    });
  } catch (error) {
    console.error("Migrate wishlist error:", error);
    return res.status(400).json({ success: false, message: error.message || "Wishlist migration failed." });
  }
};

UserRouter.post("/user/wishlist/migrate", authenticateToken, migrateWishlistHandler);
UserRouter.post("/wishlist/migrate", authenticateToken, migrateWishlistHandler);

// POST /user/wishlist/:productId
const addWishlistHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product identifier." });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Garment listing not found." });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Idempotent duplicate check
    const isAlreadyWishlisted = (user.wishlist || []).some((id) => String(id) === String(productId));

    if (!isAlreadyWishlisted) {
      user.wishlist.push(product._id);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: isAlreadyWishlisted ? "Item already in wishlist." : "Saved to your Wishlist.",
      isWishlisted: true,
      count: user.wishlist.length,
    });
  } catch (error) {
    console.error("Add wishlist error:", error);
    return res.status(500).json({ success: false, message: "Failed to save to wishlist." });
  }
};

UserRouter.post("/user/wishlist/:productId", authenticateToken, addWishlistHandler);
UserRouter.post("/wishlist/:productId", authenticateToken, addWishlistHandler);

// DELETE /user/wishlist/:productId
const removeWishlistHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product identifier." });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.wishlist = (user.wishlist || []).filter((id) => String(id) !== String(productId));
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Removed from your Wishlist.",
      isWishlisted: false,
      count: user.wishlist.length,
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove from wishlist." });
  }
};

UserRouter.delete("/user/wishlist/:productId", authenticateToken, removeWishlistHandler);
UserRouter.delete("/wishlist/:productId", authenticateToken, removeWishlistHandler);

export default UserRouter;
