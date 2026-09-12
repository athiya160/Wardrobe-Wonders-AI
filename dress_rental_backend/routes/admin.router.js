import { Router } from "express";
import UserModel from "../models/UserModel.js";
import ProductModel from "../models/productModel.js";
import OrderModel from "../models/OrderModel.js";
import ReportModel from "../models/ReportModel.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const adminRouter = Router();

// Protect ALL admin routes with token authentication and admin role check
adminRouter.use(authenticateToken, requireRole("admin"));

/**
 * GET /admin/overview
 * High-level marketplace health metrics, user ratios, and platform commission estimates
 */
adminRouter.get("/overview", async (req, res) => {
  try {
    const [
      totalUsers,
      customersCount,
      providersCount,
      totalListings,
      activeListings,
      inactiveListings,
      totalOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalReports,
      pendingReports,
      completedOrderDocs,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: { $in: ["customer", "user"] } }),
      UserModel.countDocuments({ role: "provider" }),
      ProductModel.countDocuments(),
      ProductModel.countDocuments({ status: "active" }),
      ProductModel.countDocuments({ status: "inactive" }),
      OrderModel.countDocuments(),
      OrderModel.countDocuments({ requestStatus: "Pending" }),
      OrderModel.countDocuments({ requestStatus: "Active" }),
      OrderModel.countDocuments({ requestStatus: "Completed" }),
      OrderModel.countDocuments({ requestStatus: { $in: ["Cancelled", "Declined"] } }),
      ReportModel.countDocuments(),
      ReportModel.countDocuments({ status: "pending" }),
      OrderModel.find({ requestStatus: "Completed" }),
    ]);

    // Financial calculations: marketplace transaction volume & platform 15% revenue
    const marketplaceVolume = completedOrderDocs.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
    const rentalFeesVolume = completedOrderDocs.reduce(
      (sum, o) =>
        sum +
        (Number(o.rentalFee) ||
          Math.max(0, (Number(o.totalAmount) || 0) - (Number(o.securityDeposit) || 0))),
      0
    );
    const estimatedPlatformRevenue = Math.round(rentalFeesVolume * 0.15);

    return res.status(200).json({
      success: true,
      overview: {
        users: {
          total: totalUsers,
          customers: customersCount,
          providers: providersCount,
        },
        listings: {
          total: totalListings,
          active: activeListings,
          inactive: inactiveListings,
        },
        rentals: {
          total: totalOrders,
          pending: pendingOrders,
          active: activeOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
        },
        finance: {
          marketplaceVolume,
          rentalFeesVolume,
          estimatedPlatformRevenue,
        },
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate admin overview statistics.",
    });
  }
});

/**
 * GET /admin/users
 * Search and filter users by role, active status, and query term
 */
adminRouter.get("/users", async (req, res) => {
  try {
    const { role, status, q } = req.query;
    const filter = {};

    if (role && role !== "all") {
      filter.role = role === "customer" ? { $in: ["customer", "user"] } : role;
    }

    if (status && status !== "all") {
      filter.isActive = status === "active";
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { firstname: searchRegex },
        { lastname: searchRegex },
      ];
    }

    const users = await UserModel.find(filter)
      .select("-password -passwordHash")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin list users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
});

/**
 * PUT /admin/users/:id/status
 * Activate or deactivate a user account with self-protection guard
 */
adminRouter.get("/users/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password -passwordHash");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.put("/users/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    const targetUserId = req.params.id;

    // Safety guard: Admin cannot deactivate their own account
    if (String(req.user._id) === String(targetUserId) && isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Action rejected: You cannot deactivate your own administrative account.",
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      targetUserId,
      { isActive: Boolean(isActive) },
      { new: true }
    ).select("-password -passwordHash");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? "activated" : "deactivated"} successfully.`,
      user,
    });
  } catch (error) {
    console.error("Admin user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status.",
    });
  }
});

/**
 * GET /admin/listings
 * View all inventory with provider details, category filters, and status flags
 */
adminRouter.get("/listings", async (req, res) => {
  try {
    const { status, category, q } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [{ title: searchRegex }, { name: searchRegex }, { brand: searchRegex }];
    }

    const listings = await ProductModel.find(filter)
      .populate("providerId", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Admin listings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve listings.",
    });
  }
});

/**
 * PUT /admin/listings/:id/moderate
 * Moderate listings: approve, deactivate/reject, or restore
 */
adminRouter.put("/listings/:id/moderate", async (req, res) => {
  try {
    const { action } = req.body;
    const listing = await ProductModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found." });
    }

    if (action === "approve" || action === "restore") {
      listing.status = "active";
      listing.availability = true;
    } else if (action === "deactivate" || action === "reject") {
      listing.status = "inactive";
      listing.availability = false;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Supported: approve, deactivate, reject, restore.",
      });
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      message: `Listing status updated to ${listing.status}`,
      listing,
    });
  } catch (error) {
    console.error("Admin moderate listing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to moderate listing.",
    });
  }
});

/**
 * GET /admin/orders
 * Marketplace-wide rental requests overview with status filtering
 */
adminRouter.get("/orders", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.requestStatus = status;
    }

    const orders = await OrderModel.find(filter)
      .populate("product")
      .populate("providerId", "name email phone")
      .sort({ orderDate: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve marketplace rental orders.",
    });
  }
});

/**
 * GET /admin/reports
 * List reported garments submitted by customers
 */
adminRouter.get("/reports", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const reports = await ReportModel.find(filter)
      .populate("listingId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reported listings.",
    });
  }
});

/**
 * PUT /admin/reports/:id/resolve
 * Resolve or dismiss reports with resolution notes and optional listing deactivation
 */
adminRouter.put("/reports/:id/resolve", async (req, res) => {
  try {
    const { status, adminNotes, deactivateListing } = req.body;
    const report = await ReportModel.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    report.status = status === "dismissed" ? "dismissed" : "resolved";
    report.adminNotes = adminNotes || "";
    report.resolvedAt = new Date();
    await report.save();

    if (deactivateListing && report.listingId) {
      await ProductModel.findByIdAndUpdate(report.listingId, {
        status: "inactive",
        availability: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Report marked as ${report.status}`,
      report,
    });
  } catch (error) {
    console.error("Admin resolve report error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve report.",
    });
  }
});

export default adminRouter;
