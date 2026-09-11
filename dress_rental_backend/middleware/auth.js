import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";

/**
 * Authentication Middleware
 * Reads Bearer token, verifies JWT, attaches authenticated user to req.user
 * Returns 401 for missing or invalid token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (req.query?.token || null);

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Access denied. Authentication token required.",
      });
    }

    const secret = process.env.JWT_SECRET || process.env.SECRET || "change_this_in_production";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        status: false,
        message: "Invalid or expired token.",
      });
    }

    const user = await UserModel.findById(decoded.id).select("-password -passwordHash");
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User not found or account no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: false,
        message: "Account is deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server authentication error.",
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Usage: requireRole("provider") or requireRole("admin") or requireRole("admin", "provider")
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Authentication required.",
      });
    }

    const userRole = req.user.role || req.user.type;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: false,
        message: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}.`,
      });
    }

    next();
  };
};
