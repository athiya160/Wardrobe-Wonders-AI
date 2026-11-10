import Store from "../models/StoreModel.js";
import StoreApplication from "../models/StoreApplicationModel.js";

/**
 * Middleware: requireApprovedSeller
 * Verifies that the authenticated user possesses an approved, active Store.
 * Attaches the active store document to req.store.
 */
export const requireApprovedSeller = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      // Check if user has an application pending
      const application = await StoreApplication.findOne({ sellerId: req.user._id })
        .sort({ createdAt: -1 });

      if (application) {
        return res.status(403).json({
          success: false,
          code: "SELLER_NOT_APPROVED",
          applicationStatus: application.status,
          message: `Your seller application is currently ${application.status}. An approved store is required to perform this action.`,
        });
      }

      return res.status(403).json({
        success: false,
        code: "NO_SELLER_ACCOUNT",
        message: "You must apply and receive admin approval before opening a store.",
      });
    }

    if (store.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        code: "STORE_SUSPENDED",
        message: `Your store is currently ${store.status}. You cannot publish or manage products while your store is suspended.`,
      });
    }

    req.store = store;
    next();
  } catch (error) {
    console.error("Seller authorization error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error verifying seller credentials.",
    });
  }
};
