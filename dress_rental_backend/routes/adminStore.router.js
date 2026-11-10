import { Router } from "express";
import mongoose from "mongoose";
import StoreApplication from "../models/StoreApplicationModel.js";
import Store from "../models/StoreModel.js";
import StoreProduct from "../models/StoreProductModel.js";
import StoreCategory from "../models/StoreCategoryModel.js";
import StoreOrder from "../models/StoreOrderModel.js";
import StoreFulfilmentOrder from "../models/StoreFulfilmentOrderModel.js";
import StorePayment from "../models/StorePaymentModel.js";
import StoreLedger from "../models/StoreLedgerModel.js";
import StoreRefund from "../models/StoreRefundModel.js";
import StoreInvoice from "../models/StoreInvoiceModel.js";
import StoreCancellation from "../models/StoreCancellationModel.js";
import StoreReturn from "../models/StoreReturnModel.js";
import StoreReview from "../models/StoreReviewModel.js";
import {
  getAdminFinancesOverview,
  initiateStoreRefund,
} from "../services/storePaymentService.js";
import {
  getAdminFulfilmentOrdersOverview,
  getAdminFulfilmentMetrics,
  transitionFulfilmentStatus,
} from "../services/storeFulfillmentService.js";
import {
  getOrCreateStoreInvoice,
  reviewStoreCancellation,
  reviewStoreReturn,
  recordReturnItemReceived,
  moderateStoreReview,
} from "../services/storePostPurchaseService.js";
import UserModel from "../models/UserModel.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const adminStoreRouter = Router();

// Protect ALL admin store routes: strictly requires valid JWT and admin role
adminStoreRouter.use(authenticateToken, requireRole("admin"));

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function generateUniqueStoreSlug(storeName) {
  let baseSlug = slugify(storeName) || "store";
  let candidateSlug = baseSlug;
  let counter = 1;
  while (await Store.findOne({ storeSlug: candidateSlug })) {
    candidateSlug = `${baseSlug}-${counter++}`;
  }
  return candidateSlug;
}

/**
 * GET /admin/store/overview
 * Store-specific dashboard overview: applications, active stores, products by status
 */
adminStoreRouter.get("/overview", async (req, res) => {
  try {
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      moreInfoApplications,
      suspendedApplications,
      activeStores,
      suspendedStores,
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      changesRequestedProducts,
      suspendedProducts,
      archivedProducts,
      pendingCancellations,
      pendingReturns,
      pendingReviews,
    ] = await Promise.all([
      StoreApplication.countDocuments(),
      StoreApplication.countDocuments({ status: "PENDING_REVIEW" }),
      StoreApplication.countDocuments({ status: "APPROVED" }),
      StoreApplication.countDocuments({ status: "REJECTED" }),
      StoreApplication.countDocuments({ status: "MORE_INFORMATION_REQUIRED" }),
      StoreApplication.countDocuments({ status: "SUSPENDED" }),
      Store.countDocuments({ status: "ACTIVE" }),
      Store.countDocuments({ status: "SUSPENDED" }),
      StoreProduct.countDocuments(),
      StoreProduct.countDocuments({ status: "APPROVED" }),
      StoreProduct.countDocuments({ status: "PENDING_REVIEW" }),
      StoreProduct.countDocuments({ status: "REJECTED" }),
      StoreProduct.countDocuments({ status: "CHANGES_REQUESTED" }),
      StoreProduct.countDocuments({ status: "SUSPENDED" }),
      StoreProduct.countDocuments({ status: "ARCHIVED" }),
      StoreCancellation.countDocuments({ status: { $in: ["REQUESTED", "UNDER_REVIEW"] } }),
      StoreReturn.countDocuments({ status: { $in: ["REQUESTED", "UNDER_REVIEW", "ITEM_RETURNED"] } }),
      StoreReview.countDocuments({ status: "PENDING_MODERATION" }),
    ]);

    return res.status(200).json({
      success: true,
      metrics: {
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          moreInfoRequired: moreInfoApplications,
          suspended: suspendedApplications,
        },
        stores: {
          active: activeStores,
          suspended: suspendedStores,
          total: activeStores + suspendedStores,
        },
        products: {
          total: totalProducts,
          approved: approvedProducts,
          pending: pendingProducts,
          rejected: rejectedProducts,
          changesRequested: changesRequestedProducts,
          suspended: suspendedProducts,
          archived: archivedProducts,
        },
        postPurchase: {
          pendingCancellations,
          pendingReturns,
          pendingReviews,
        },
      },
    });
  } catch (error) {
    console.error("Admin store overview error:", error);
    return res.status(500).json({ success: false, message: "Failed to calculate store metrics." });
  }
});

/**
 * GET /admin/store/applications
 * List seller applications with filters and server-side pagination
 */
adminStoreRouter.get("/applications", async (req, res) => {
  try {
    const { status, sellerType, q, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }
    if (sellerType && sellerType !== "all") {
      filter.sellerType = sellerType;
    }
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [
        { storeName: searchRegex },
        { "contact.email": searchRegex },
        { "contact.phone": searchRegex },
        { "location.city": searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [applications, totalCount] = await Promise.all([
      StoreApplication.find(filter)
        .populate("sellerId", "name email phone role firstname lastname")
        .populate("reviewedBy", "name email")
        .populate("reviewHistory.reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StoreApplication.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      applications,
    });
  } catch (error) {
    console.error("Admin list applications error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch seller applications." });
  }
});

/**
 * GET /admin/store/applications/:id
 * Retrieve details for a single application
 */
adminStoreRouter.get("/applications/:id", async (req, res) => {
  try {
    const application = await StoreApplication.findById(req.params.id)
      .populate("sellerId", "name email phone role firstname lastname")
      .populate("reviewedBy", "name email")
      .lean();

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    const store = await Store.findOne({ sellerId: application.sellerId?._id }).lean();

    return res.status(200).json({
      success: true,
      application,
      store,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /admin/store/applications/:id/review
 * Approve, reject, request info, or suspend a seller application
 * Records audit trail in reviewHistory
 */
adminStoreRouter.put("/applications/:id/review", async (req, res) => {
  try {
    const { action, notes } = req.body;

    const allowedActions = [
      "APPROVED",
      "REJECTED",
      "MORE_INFORMATION_REQUIRED",
      "SUSPENDED",
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid review action. Allowed actions: ${allowedActions.join(", ")}.`,
      });
    }

    if (action === "REJECTED" && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: "A clear rejection reason in the review notes is required when rejecting an application.",
      });
    }

    if (action === "SUSPENDED" && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: "A mandatory suspension reason in the review notes is required when suspending a seller.",
      });
    }

    if (action === "MORE_INFORMATION_REQUIRED" && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: "Detailed instructions in the review notes are required when requesting more information.",
      });
    }

    const application = await StoreApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    const previousStatus = application.status;
    application.status = action;
    application.adminReviewNotes = notes ? notes.trim() : "";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    if (!application.reviewHistory) {
      application.reviewHistory = [];
    }

    application.reviewHistory.push({
      action,
      previousStatus,
      newStatus: action,
      notes: notes ? notes.trim() : "",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });

    await application.save();

    let store = null;

    if (action === "APPROVED") {
      // Find or create Store document
      store = await Store.findOne({ sellerId: application.sellerId });
      if (!store) {
        const slug = await generateUniqueStoreSlug(application.storeName);
        store = new Store({
          sellerId: application.sellerId,
          storeApplicationId: application._id,
          storeName: application.storeName,
          storeSlug: slug,
          storeType: application.sellerType,
          description: application.storeDescription,
          logo: application.logo,
          banner: application.banner,
          location: application.location,
          contact: application.contact,
          status: "ACTIVE",
        });
        await store.save();
      } else {
        store.status = "ACTIVE";
        store.storeName = application.storeName;
        store.storeType = application.sellerType;
        await store.save();
      }
    } else if (action === "SUSPENDED") {
      // If suspended, deactivate Store and all store products so they cannot remain publicly purchasable
      await Store.updateOne({ sellerId: application.sellerId }, { status: "SUSPENDED" });
      await StoreProduct.updateMany(
        { sellerId: application.sellerId, status: { $in: ["APPROVED", "PENDING_REVIEW"] } },
        { status: "SUSPENDED" }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Seller application marked as ${action}.`,
      application,
      store,
    });
  } catch (error) {
    console.error("Admin review application error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to review application." });
  }
});

/**
 * GET /admin/store/products
 * List products for moderation with search, filters, and server-side pagination
 */
adminStoreRouter.get("/products", async (req, res) => {
  try {
    const { status, category, condition, q, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (condition && condition !== "all") {
      filter.condition = condition;
    }
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { brand: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      StoreProduct.find(filter)
        .populate("sellerId", "name email phone firstname lastname")
        .populate("storeId", "storeName storeSlug status location contact")
        .populate("reviewedBy", "name email")
        .populate("reviewHistory.reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StoreProduct.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      products,
    });
  } catch (error) {
    console.error("Admin list products error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch products for moderation." });
  }
});

/**
 * GET /admin/store/products/:id
 * Retrieve product detail for moderation with full seller, store, and review history
 */
adminStoreRouter.get("/products/:id", async (req, res) => {
  try {
    const product = await StoreProduct.findById(req.params.id)
      .populate("sellerId", "name email phone firstname lastname")
      .populate("storeId", "storeName storeSlug status location contact")
      .populate("reviewedBy", "name email")
      .populate("reviewHistory.reviewedBy", "name email")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /admin/store/products/:id/moderate
 * Admin moderation: approve, reject, request changes, or suspend a product
 * CRITICAL RULE: Only products from approved, active stores can be approved.
 */
adminStoreRouter.put("/products/:id/moderate", async (req, res) => {
  try {
    const { action, notes } = req.body;

    const allowedActions = ["APPROVED", "REJECTED", "SUSPENDED", "CHANGES_REQUESTED"];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid moderation action. Allowed actions: ${allowedActions.join(", ")}.`,
      });
    }

    if (action === "REJECTED" && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason (review notes) is required when rejecting a product.",
      });
    }

    if (action === "SUSPENDED" && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: "Suspension reason (review notes) is required when suspending a product.",
      });
    }

    if (action === "CHANGES_REQUESTED" && (!notes || !notes.trim())) {
      return res.status(400).json({
        success: false,
        message: "Change request instructions (review notes) are required when requesting modifications.",
      });
    }

    const product = await StoreProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // STRICT INVARIANT: Only products from active, approved stores can be approved
    if (action === "APPROVED") {
      const store = await Store.findById(product.storeId);
      if (!store || store.status !== "ACTIVE") {
        return res.status(400).json({
          success: false,
          code: "STORE_NOT_ACTIVE",
          message: "Cannot approve product: The seller's store is suspended or not active.",
        });
      }
    }

    product.status = action;
    product.adminReviewNotes = notes ? notes.trim() : "";
    product.reviewedBy = req.user._id;
    product.reviewedAt = new Date();

    if (!product.reviewHistory) {
      product.reviewHistory = [];
    }

    product.reviewHistory.push({
      status: action,
      notes: notes ? notes.trim() : "",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });

    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product ${product.title} has been ${action}.`,
      product,
    });
  } catch (error) {
    console.error("Admin moderate product error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to moderate product." });
  }
});

/**
 * GET & POST /admin/store/categories
 * Seed & manage store categories
 */
adminStoreRouter.get("/categories", async (req, res) => {
  try {
    const categories = await StoreCategory.find().sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminStoreRouter.post("/categories", async (req, res) => {
  try {
    const { name, description, subcategories } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }

    const slug = slugify(name);
    const existing = await StoreCategory.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists." });
    }

    const formattedSubcats = (subcategories || []).map((sub) => ({
      name: sub.name?.trim() || sub,
      slug: slugify(sub.name || sub),
      description: sub.description || "",
    }));

    const category = new StoreCategory({
      name: name.trim(),
      slug,
      description: description || "",
      subcategories: formattedSubcats,
    });

    await category.save();
    return res.status(201).json({ success: true, category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * PHASE 6: ADMIN STORE FINANCIAL OVERVIEW, PAYMENTS, LEDGER & REFUNDS
 * =========================================================================
 */

/**
 * GET /admin/store/finances/overview
 * Platform-wide Store financial health overview:
 * Gross sales, net sales, platform commission earned, shipping fees, seller payable ledger balances.
 */
adminStoreRouter.get("/finances/overview", async (req, res) => {
  try {
    const overview = await getAdminFinancesOverview();
    return res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    console.error("Admin finances overview error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve financial overview.",
    });
  }
});

/**
 * GET /admin/store/finances/payments
 * Audit log of Store payments with filtering and pagination
 */
adminStoreRouter.get("/finances/payments", async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search && String(search).trim()) {
      const s = String(search).trim();
      query.$or = [
        { orderNumber: { $regex: s, $options: "i" } },
        { merchantTransactionId: { $regex: s, $options: "i" } },
        { internalPaymentId: { $regex: s, $options: "i" } },
      ];
    }

    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [payments, total] = await Promise.all([
      StorePayment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate("customerId", "name email phone")
        .populate("parentOrderId")
        .lean(),
      StorePayment.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Admin payments list error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve payments list.",
    });
  }
});

/**
 * GET /admin/store/finances/ledger
 * Complete immutable financial audit trail across all sellers and orders
 */
adminStoreRouter.get("/finances/ledger", async (req, res) => {
  try {
    const { sellerId, type, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (sellerId) {
      query.sellerId = sellerId;
    }

    if (type) {
      query.type = type;
    }

    if (search && String(search).trim()) {
      const s = String(search).trim();
      query.$or = [
        { parentOrderNumber: { $regex: s, $options: "i" } },
        { fulfilmentOrderNumber: { $regex: s, $options: "i" } },
        { entryId: { $regex: s, $options: "i" } },
      ];
    }

    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [entries, total] = await Promise.all([
      StoreLedger.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate("sellerId", "name email")
        .populate("storeId", "storeName storeSlug")
        .lean(),
      StoreLedger.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      count: entries.length,
      entries,
      disclaimer:
        "All seller payable balances represent internal ledger records. Live bank settlement is disabled.",
    });
  } catch (error) {
    console.error("Admin ledger audit error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve financial ledger.",
    });
  }
});

/**
 * GET /admin/store/finances/refunds
 * List all refund records with status and compensating ledger associations
 */
adminStoreRouter.get("/finances/refunds", async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [refunds, total] = await Promise.all([
      StoreRefund.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate("requestedBy", "name email")
        .populate("sellerId", "name email")
        .populate("compensatingLedgerEntryIds")
        .lean(),
      StoreRefund.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      count: refunds.length,
      refunds,
    });
  } catch (error) {
    console.error("Admin refunds list error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve refunds list.",
    });
  }
});

/**
 * POST /admin/store/refunds/initiate
 * Admin: Authorize and initiate a partial or full Store refund.
 * Generates compensating ledger entries and tracks provider refund execution status.
 */
adminStoreRouter.post("/refunds/initiate", async (req, res) => {
  try {
    const { parentOrderId, fulfilmentOrderId, amount, reason, idempotencyKey } = req.body || {};

    if (!parentOrderId) {
      return res.status(400).json({
        success: false,
        message: "parentOrderId is required to initiate a refund.",
      });
    }

    const result = await initiateStoreRefund({
      parentOrderId,
      fulfilmentOrderId,
      amount,
      reason,
      adminUser: req.user,
      idempotencyKey,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to initiate refund.",
    });
  }
});

/**
 * =========================================================================
 * PHASE 7: ADMIN FULFILMENT OVERSIGHT & DELIVERY MANAGEMENT
 * =========================================================================
 */

/**
 * GET /admin/store/fulfilments/metrics
 * Aggregated fulfillment metrics for admin dashboard
 */
adminStoreRouter.get("/fulfilments/metrics", async (req, res) => {
  try {
    const metrics = await getAdminFulfilmentMetrics();
    return res.status(200).json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error("Admin fulfilment metrics error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve fulfilment metrics.",
    });
  }
});

/**
 * GET /admin/store/fulfilments
 * List all fulfillment orders across all stores with filters (status, delayedOnly, search, pagination)
 */
adminStoreRouter.get("/fulfilments", async (req, res) => {
  try {
    const { status, sellerId, storeId, delayedOnly, search, limit = 50, page = 1 } = req.query;

    const data = await getAdminFulfilmentOrdersOverview({
      status,
      sellerId,
      storeId,
      delayedOnly,
      search,
      limit,
      page,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Admin fulfilment orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve fulfilment orders.",
    });
  }
});

/**
 * GET /admin/store/fulfilments/:id
 * Retrieve single fulfillment order with complete timeline, items, and audit history
 */
adminStoreRouter.get("/fulfilments/:id", async (req, res) => {
  try {
    const order = await StoreFulfilmentOrder.findById(req.params.id)
      .populate("sellerId", "name email phone")
      .populate("customerId", "name email phone")
      .populate("parentOrderId")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Fulfilment order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Admin fulfilment detail error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve fulfilment order details.",
    });
  }
});

/**
 * PUT /admin/store/fulfilments/:id/status
 * Admin: Intervene and update fulfillment order status with mandatory audit reason
 */
adminStoreRouter.put("/fulfilments/:id/status", async (req, res) => {
  try {
    const {
      status,
      reason,
      courierName,
      trackingNumber,
      trackingUrl,
      dispatchedAt,
      estimatedDelivery,
      deliveryConfirmationNote,
    } = req.body || {};

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Target status is required.",
      });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "Audit reason is required for administrative status modification.",
      });
    }

    const result = await transitionFulfilmentStatus({
      fulfilmentOrderId: req.params.id,
      targetStatus: status,
      actorId: req.user._id,
      actorRole: "admin",
      actorName: req.user.name || "Administrator",
      dispatchData: {
        courierName,
        trackingNumber,
        trackingUrl,
        dispatchedAt,
        estimatedDelivery,
        deliveryConfirmationNote,
        cancellationReason: reason,
      },
      note: `[Admin Override] ${reason.trim()}`,
      isAdmin: true,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update fulfilment order status.",
    });
  }
});

/**
 * =========================================================================
 * PHASE 8: ADMIN STORE POST-PURCHASE MANAGEMENT
 * (CANCELLATIONS, RETURNS, INVOICES, REVIEWS)
 * =========================================================================
 */

/**
 * GET /admin/store/cancellations
 * Admin: List customer cancellation requests with optional status filter & pagination
 */
adminStoreRouter.get("/cancellations", async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const take = Math.min(100, Math.max(1, Number(limit)));

    const [cancellations, total] = await Promise.all([
      StoreCancellation.find(query)
        .populate("customerId", "name email phone")
        .populate("sellerId", "name email phone")
        .populate("parentOrderId")
        .populate("fulfilmentOrderId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      StoreCancellation.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      count: cancellations.length,
      cancellations,
    });
  } catch (error) {
    console.error("Admin list cancellations error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve cancellation requests.",
    });
  }
});

/**
 * PUT /admin/store/cancellations/:id/review
 * Admin: Approve or reject customer cancellation request with mandatory audit justification
 */
adminStoreRouter.put("/cancellations/:id/review", async (req, res) => {
  try {
    const { decision, reason } = req.body || {};
    const result = await reviewStoreCancellation({
      cancellationId: req.params.id,
      adminId: req.user._id,
      adminName: req.user.name || "Administrator",
      decision,
      reason,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to review cancellation request.",
    });
  }
});

/**
 * GET /admin/store/returns
 * Admin: List customer return requests with optional status filter & pagination
 */
adminStoreRouter.get("/returns", async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const take = Math.min(100, Math.max(1, Number(limit)));

    const [returns, total] = await Promise.all([
      StoreReturn.find(query)
        .populate("customerId", "name email phone")
        .populate("sellerId", "name email phone")
        .populate("parentOrderId")
        .populate("fulfilmentOrderId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      StoreReturn.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      count: returns.length,
      returns,
    });
  } catch (error) {
    console.error("Admin list returns error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve return requests.",
    });
  }
});

/**
 * PUT /admin/store/returns/:id/review
 * Admin: Approve or reject return request with mandatory audit justification
 */
adminStoreRouter.put("/returns/:id/review", async (req, res) => {
  try {
    const { decision, reason } = req.body || {};
    const result = await reviewStoreReturn({
      returnId: req.params.id,
      adminId: req.user._id,
      adminName: req.user.name || "Administrator",
      decision,
      reason,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to review return request.",
    });
  }
});

/**
 * PUT /admin/store/returns/:id/receive
 * Admin: Confirm warehouse inspection and item return receipt, transitioning to ITEM_RETURNED & initiating refund
 */
adminStoreRouter.put("/returns/:id/receive", async (req, res) => {
  try {
    const { returnTracking, note } = req.body || {};
    const result = await recordReturnItemReceived({
      returnId: req.params.id,
      adminId: req.user._id,
      adminName: req.user.name || "Administrator",
      returnTracking: returnTracking || {},
      note,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to record return item receipt.",
    });
  }
});

/**
 * GET /admin/store/reviews
 * Admin: List reviews for moderation with optional status filter & pagination
 */
adminStoreRouter.get("/reviews", async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const take = Math.min(100, Math.max(1, Number(limit)));

    const [reviews, total] = await Promise.all([
      StoreReview.find(query)
        .populate("productId", "title images price category")
        .populate("customerId", "name email")
        .populate("sellerId", "name email")
        .populate("storeId", "storeName storeSlug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      StoreReview.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Admin list reviews error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve store reviews.",
    });
  }
});

/**
 * PUT /admin/store/reviews/:id/moderate
 * Admin: Moderate review status (PUBLISHED, HIDDEN, REJECTED) and update product rating
 */
adminStoreRouter.put("/reviews/:id/moderate", async (req, res) => {
  try {
    const { status, moderationNotes } = req.body || {};
    const result = await moderateStoreReview({
      reviewId: req.params.id,
      adminId: req.user._id,
      status,
      moderationNotes,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to moderate store review.",
    });
  }
});

/**
 * GET /admin/store/invoices/:idOrNumber
 * Admin: Retrieve immutable invoice snapshot by invoiceNumber, _id, or parentOrderId
 */
adminStoreRouter.get("/invoices/:idOrNumber", async (req, res) => {
  try {
    const identifier = req.params.idOrNumber;
    let query = { invoiceNumber: identifier };
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = {
        $or: [
          { _id: identifier },
          { parentOrderId: identifier },
          { invoiceNumber: identifier },
        ],
      };
    }

    const invoice = await StoreInvoice.findOne(query).lean();
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Admin invoice lookup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve invoice.",
    });
  }
});

export default adminStoreRouter;
