import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";
import { authenticateToken } from "../middleware/auth.js";

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
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Helper to sign JWT
const signUserToken = (user) => {
  const secret = process.env.JWT_SECRET || process.env.SECRET || "change_this_in_production";
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
      // Check if legacy password is already a bcrypt hash
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

    const email = body.email ? body.email.trim().toLowerCase() : "";
    const password = body.password ? String(body.password) : "";

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

    // Role validation: safely default to customer, forbid admin creation via public signup
    let role = "customer";
    const requestedRole = (body.role || body.type || "").toLowerCase().trim();
    if (requestedRole === "admin") {
      return res.status(400).json({
        status: false,
        message: "Admin accounts cannot be registered through public signup.",
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
    const username = body.username || email.split("@")[0];

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
  return res.status(200).json({
    status: true,
    user: toSafeUser(req.user),
  });
});

// GET /me alias
UserRouter.get("/me", authenticateToken, async (req, res) => {
  return res.status(200).json({
    status: true,
    user: toSafeUser(req.user),
  });
});

export default UserRouter;
