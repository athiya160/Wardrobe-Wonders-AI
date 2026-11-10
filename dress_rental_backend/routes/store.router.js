import { Router } from "express";
import StoreApplication from "../models/StoreApplicationModel.js";
import Store from "../models/StoreModel.js";
import StoreProduct from "../models/StoreProductModel.js";
import StoreCategory from "../models/StoreCategoryModel.js";
import StoreCart from "../models/StoreCartModel.js";
import StoreOrder from "../models/StoreOrderModel.js";
import StoreFulfilmentOrder from "../models/StoreFulfilmentOrderModel.js";
import StorePayment from "../models/StorePaymentModel.js";
import StoreLedger from "../models/StoreLedgerModel.js";
import StoreRefund from "../models/StoreRefundModel.js";
import StoreNotification from "../models/StoreNotificationModel.js";
import StoreInvoice from "../models/StoreInvoiceModel.js";
import StoreCancellation from "../models/StoreCancellationModel.js";
import StoreReturn from "../models/StoreReturnModel.js";
import StoreReview from "../models/StoreReviewModel.js";
import {
  initiateStorePayment,
  verifyStorePayment,
  processStoreWebhook,
  getSellerFinancesOverview,
} from "../services/storePaymentService.js";
import {
  transitionFulfilmentStatus,
  resolveCourierTrackingUrl,
} from "../services/storeFulfillmentService.js";
import {
  getOrCreateStoreInvoice,
  requestStoreCancellation,
  requestStoreReturn,
  createStoreReview,
  getProductReviews,
} from "../services/storePostPurchaseService.js";
import { aiStoreBuyRecommendations } from "../services/ai.service.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireApprovedSeller } from "../middleware/storeAuth.js";

const storeRouter = Router();

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

const DEFAULT_CATEGORIES = [
  {
    name: "Clothing",
    slug: "clothing",
    description: "Couture, ethnic ensembles, designer sherwanis, and luxury shirts.",
    subcategories: [
      { name: "Sarees & Lehengas", slug: "sarees-lehengas" },
      { name: "Kurtas & Sherwanis", slug: "kurtas-sherwanis" },
      { name: "Tuxedos & Suits", slug: "tuxedos-suits" },
      { name: "Shirts & Tops", slug: "shirts-tops" },
    ],
  },
  {
    name: "Dresses",
    slug: "dresses",
    description: "Evening gowns, bridal wear, cocktail dresses, and runway silhouettes.",
    subcategories: [
      { name: "Bridal & Wedding", slug: "bridal-wedding" },
      { name: "Evening Gowns", slug: "evening-gowns" },
      { name: "Cocktail Dresses", slug: "cocktail-dresses" },
    ],
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    description: "1-gram gold, artisanal kundan, polki bridal chokers, and fine gems.",
    subcategories: [
      { name: "Bridal Sets", slug: "bridal-sets" },
      { name: "Chokers & Necklaces", slug: "chokers-necklaces" },
      { name: "Earrings & Jhumkas", slug: "earrings-jhumkas" },
      { name: "Bangles & Kadas", slug: "bangles-kadas" },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Handcrafted potlis, luxury clutches, belts, and dupattas.",
    subcategories: [
      { name: "Potlis & Clutches", slug: "potlis-clutches" },
      { name: "Embroidered Dupattas", slug: "embroidered-dupattas" },
      { name: "Stoles & Shawls", slug: "stoles-shawls" },
    ],
  },
  {
    name: "Footwear",
    slug: "footwear",
    description: "Zari mojris, handcrafted juttis, and artisanal wedding heels.",
    subcategories: [
      { name: "Bridal Juttis", slug: "bridal-juttis" },
      { name: "Mojris & Nagras", slug: "mojris-nagras" },
      { name: "Luxury Heels", slug: "luxury-heels" },
    ],
  },
  {
    name: "Pre-loved Vintage",
    slug: "pre-loved-vintage",
    description: "Curated heirloom garments, vintage silks, and archival fashion.",
    subcategories: [
      { name: "Archival Couture", slug: "archival-couture" },
      { name: "Vintage Silks", slug: "vintage-silks" },
      { name: "Designer Resale", slug: "designer-resale" },
    ],
  },
];

/* ==========================================================================
   PUBLIC STOREFRONT ENDPOINTS (No Auth Required)
   ========================================================================== */

/**
 * GET /store/categories
 * Returns active categories with subcategories for store filtering
 */
storeRouter.get("/categories", async (req, res) => {
  try {
    const categories = await StoreCategory.find({ isActive: true }).sort({ name: 1 }).lean();
    if (categories && categories.length > 0) {
      return res.status(200).json({ success: true, categories });
    }
    return res.status(200).json({ success: true, categories: DEFAULT_CATEGORIES });
  } catch (error) {
    console.error("Error fetching store categories:", error);
    return res.status(200).json({ success: true, categories: DEFAULT_CATEGORIES });
  }
});

/**
 * GET /store/recommendations/ai
 * Public: Retrieve AI-curated "Recommended to Buy" store products
 * Excludes draft, unapproved, suspended, and out-of-stock items.
 */
storeRouter.get("/recommendations/ai", async (req, res) => {
  try {
    const { query, category, condition, maxBudget, limit } = req.query;
    const products = await aiStoreBuyRecommendations({
      query,
      category,
      condition,
      maxBudget: maxBudget ? Number(maxBudget) : null,
      limit: limit ? Number(limit) : 6,
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Store AI recommendation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve store recommendations.",
      products: [],
    });
  }
});

/**
 * GET /store/products
 * Public Store marketplace feed
 * CRITICAL RULE: NEVER returns unapproved, draft, rejected, or suspended products.
 * Only returns APPROVED products from ACTIVE stores.
 */
storeRouter.get("/products", async (req, res) => {
  try {
    const {
      category,
      subcategory,
      condition,
      minPrice,
      maxPrice,
      size,
      color,
      inStock,
      storeSlug,
      q,
      sort,
      page = 1,
      limit = 24,
    } = req.query;

    // First find active stores
    const storeQuery = { status: "ACTIVE" };
    if (storeSlug) {
      storeQuery.storeSlug = storeSlug;
    }
    const activeStores = await Store.find(storeQuery).select("_id storeName storeSlug").lean();
    const activeStoreIds = activeStores.map((s) => s._id);

    if (activeStoreIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        totalCount: 0,
        totalPages: 0,
        currentPage: Number(page) || 1,
        products: [],
      });
    }

    // Build filter strictly restricting to APPROVED status and ACTIVE stores
    const filter = {
      status: "APPROVED",
      storeId: { $in: activeStoreIds },
    };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (subcategory && subcategory !== "all") {
      filter.subcategory = subcategory;
    }

    if (condition && ["NEW", "PRE_OWNED"].includes(condition)) {
      filter.condition = condition;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== "") {
        const minP = Number(minPrice);
        if (!isNaN(minP)) filter.price.$gte = minP;
      }
      if (maxPrice !== undefined && maxPrice !== "") {
        const maxP = Number(maxPrice);
        if (!isNaN(maxP)) filter.price.$lte = maxP;
      }
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    if (size && size !== "all") {
      filter["variants.size"] = new RegExp(`^${size.trim()}$`, "i");
    }

    if (color && color !== "all") {
      filter["variants.color"] = new RegExp(`^${color.trim()}$`, "i");
    }

    if (inStock === "true") {
      filter.stockQuantity = { $gt: 0 };
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      const matchingStores = activeStores.filter((s) => searchRegex.test(s.storeName));
      const matchingStoreIds = matchingStores.map((s) => s._id);

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
        ...(matchingStoreIds.length > 0 ? [{ storeId: { $in: matchingStoreIds } }] : []),
      ];
    }

    const sortOption = {};
    if (sort === "price_asc") sortOption.price = 1;
    else if (sort === "price_desc") sortOption.price = -1;
    else sortOption.createdAt = -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 24));
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      StoreProduct.find(filter)
        .populate("storeId", "storeName storeSlug logo banner location.city location.state shippingPolicy")
        .sort(sortOption)
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
    console.error("Public store browse error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve store products." });
  }
});

/**
 * GET /store/products/:id
 * Retrieve single approved product detail with related products
 */
storeRouter.get("/products/:id", async (req, res) => {
  try {
    const product = await StoreProduct.findById(req.params.id)
      .populate("storeId", "storeName storeSlug logo banner description location shippingPolicy status")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Public detail must strictly be APPROVED and Store ACTIVE
    if (product.status !== "APPROVED" || product.storeId?.status !== "ACTIVE") {
      return res.status(404).json({
        success: false,
        message: "This product listing is not publicly available or pending moderation.",
      });
    }

    // Fetch up to 4 related approved products from the same category or store
    const relatedProducts = await StoreProduct.find({
      _id: { $ne: product._id },
      category: product.category,
      status: "APPROVED",
      storeId: { $in: await Store.find({ status: "ACTIVE" }).distinct("_id") },
    })
      .populate("storeId", "storeName storeSlug logo location.city")
      .limit(4)
      .lean();

    return res.status(200).json({ success: true, product, relatedProducts });
  } catch (error) {
    console.error("Fetch product detail error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch product details." });
  }
});

/**
 * GET /store/storefront/:slug
 * View public storefront and its approved products
 */
storeRouter.get("/storefront/:slug", async (req, res) => {
  try {
    const store = await Store.findOne({ storeSlug: req.params.slug, status: "ACTIVE" })
      .select("-__v")
      .lean();

    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found or inactive." });
    }

    const products = await StoreProduct.find({
      storeId: store._id,
      status: "APPROVED",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      store,
      products,
      productCount: products.length,
    });
  } catch (error) {
    console.error("Storefront error:", error);
    return res.status(500).json({ success: false, message: "Failed to load storefront." });
  }
});

/* ==========================================================================
   SELLER ONBOARDING & APPLICATION ENDPOINTS (Requires Auth)
   ========================================================================== */

/**
 * POST /store/seller/apply
 * Customer applies to become a Store seller
 */
storeRouter.post("/seller/apply", authenticateToken, async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Check if the user already has an active Store
    const existingStore = await Store.findOne({ sellerId });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: "You already have an established Store.",
        storeSlug: existingStore.storeSlug,
      });
    }

    // Check if there is an existing application in review
    const existingApp = await StoreApplication.findOne({
      sellerId,
      status: { $in: ["PENDING_REVIEW", "APPROVED"] },
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message:
          existingApp.status === "APPROVED"
            ? "Your seller application is already approved."
            : "You already have an application under review. Please wait for admin approval.",
        applicationId: existingApp._id,
        status: existingApp.status,
      });
    }

    const {
      sellerType,
      storeName,
      storeDescription,
      logo,
      banner,
      location,
      contact,
      verificationMetadata,
    } = req.body;

    if (!sellerType || !storeName || !location?.city || !location?.state || !location?.pincode) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields (seller type, store name, city, state, PIN code).",
      });
    }

    // Contact fallback to user details if not explicitly provided
    const contactInfo = {
      email: contact?.email || req.user.email,
      phone: contact?.phone || req.user.phone || "",
      website: contact?.website || "",
      instagram: contact?.instagram || "",
    };

    if (!contactInfo.email || !contactInfo.phone) {
      return res.status(400).json({
        success: false,
        message: "Contact email and phone number are required.",
      });
    }

    // Safe sanitized verification metadata — NO passwords or banking credentials
    const safeVerification = {
      businessRegNumber: verificationMetadata?.businessRegNumber || "",
      idProofType: verificationMetadata?.idProofType || "",
      idProofDocUrl: verificationMetadata?.idProofDocUrl || "",
      taxId: verificationMetadata?.taxId || "",
      notes: verificationMetadata?.notes || "",
    };

    const application = new StoreApplication({
      sellerId,
      sellerType,
      storeName: storeName.trim(),
      storeDescription: storeDescription?.trim() || "",
      logo: logo || "",
      banner: banner || "",
      location: {
        address: location.address || "",
        city: location.city.trim(),
        state: location.state.trim(),
        pincode: location.pincode.trim(),
        country: location.country || "India",
      },
      contact: contactInfo,
      verificationMetadata: safeVerification,
      status: "PENDING_REVIEW",
    });

    await application.save();

    return res.status(201).json({
      success: true,
      message: "Seller application submitted successfully. It will be reviewed by an administrator.",
      application,
    });
  } catch (error) {
    console.error("Seller application error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit seller application.",
    });
  }
});

/**
 * GET /store/seller/application
 * Get authenticated user's seller application status and history
 */
storeRouter.get("/seller/application", authenticateToken, async (req, res) => {
  try {
    const application = await StoreApplication.findOne({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const store = await Store.findOne({ sellerId: req.user._id }).lean();

    return res.status(200).json({
      success: true,
      hasApplication: Boolean(application),
      application,
      store,
      isApprovedSeller: Boolean(store && store.status === "ACTIVE"),
    });
  } catch (error) {
    console.error("Get application status error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve application status." });
  }
});

/**
 * PUT /store/seller/application
 * Resubmit / update details if application was REJECTED or MORE_INFORMATION_REQUIRED
 */
storeRouter.put("/seller/application", authenticateToken, async (req, res) => {
  try {
    const application = await StoreApplication.findOne({ sellerId: req.user._id }).sort({
      createdAt: -1,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: "No application found to update." });
    }

    if (application.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Application is already approved. Update your store profile directly.",
      });
    }

    const {
      sellerType,
      storeName,
      storeDescription,
      logo,
      banner,
      location,
      contact,
      verificationMetadata,
    } = req.body;

    if (sellerType) application.sellerType = sellerType;
    if (storeName) application.storeName = storeName.trim();
    if (storeDescription !== undefined) application.storeDescription = storeDescription.trim();
    if (logo !== undefined) application.logo = logo;
    if (banner !== undefined) application.banner = banner;
    if (location) {
      application.location = {
        ...application.location.toObject(),
        ...location,
      };
    }
    if (contact) {
      application.contact = {
        ...application.contact.toObject(),
        ...contact,
      };
    }
    if (verificationMetadata) {
      application.verificationMetadata = {
        ...application.verificationMetadata.toObject(),
        ...verificationMetadata,
      };
    }

    // Reset status back to PENDING_REVIEW for admin review
    application.status = "PENDING_REVIEW";
    await application.save();

    return res.status(200).json({
      success: true,
      message: "Application updated and resubmitted for admin review.",
      application,
    });
  } catch (error) {
    console.error("Update application error:", error);
    return res.status(500).json({ success: false, message: "Failed to update application." });
  }
});

/* ==========================================================================
   APPROVED SELLER STORE PROFILE & INVENTORY (Requires Approved Store)
   ========================================================================== */

/**
 * GET /store/seller/store
 * Retrieve the seller's own store details
 */
storeRouter.get("/seller/store", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      store: req.store,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /store/seller/store
 * Update seller's own store profile
 */
storeRouter.put("/seller/store", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const { storeName, description, logo, banner, location, contact, shippingPolicy } = req.body;
    const store = req.store;

    if (storeName && typeof storeName === "string" && storeName.trim().length >= 2) {
      store.storeName = storeName.trim().slice(0, 100);
    }
    if (description !== undefined) store.description = description.trim();
    if (logo !== undefined) store.logo = logo;
    if (banner !== undefined) store.banner = banner;
    if (location) {
      store.location = { ...store.location.toObject(), ...location };
    }
    if (contact) {
      store.contact = { ...store.contact.toObject(), ...contact };
    }
    if (shippingPolicy) {
      store.shippingPolicy = { ...store.shippingPolicy.toObject(), ...shippingPolicy };
    }

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Store profile updated successfully.",
      store,
    });
  } catch (error) {
    console.error("Update store profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update store profile." });
  }
});

/**
 * GET /store/seller/overview
 * Executive metrics and summary for seller dashboard
 */
storeRouter.get("/seller/overview", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Fetch all seller's products (excluding ARCHIVED)
    const products = await StoreProduct.find({
      sellerId,
      status: { $ne: "ARCHIVED" },
    }).lean();

    const totalProducts = products.length;
    let approvedProducts = 0;
    let pendingProducts = 0;
    let rejectedProducts = 0;
    let draftProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    for (const p of products) {
      if (p.status === "APPROVED") approvedProducts++;
      else if (p.status === "PENDING_REVIEW") pendingProducts++;
      else if (p.status === "REJECTED") rejectedProducts++;
      else if (p.status === "DRAFT") draftProducts++;

      const stock = Number(p.stockQuantity) || 0;
      if (stock === 0) {
        outOfStockProducts++;
      } else if (stock <= 3) {
        lowStockProducts++;
      }
    }

    return res.status(200).json({
      success: true,
      metrics: {
        totalProducts,
        approvedProducts,
        pendingProducts,
        rejectedProducts,
        draftProducts,
        lowStockProducts,
        outOfStockProducts,
      },
      store: {
        _id: req.store._id,
        storeName: req.store.storeName,
        storeSlug: req.store.storeSlug,
        storeType: req.store.storeType,
        status: req.store.status,
        logo: req.store.logo,
        banner: req.store.banner,
        location: req.store.location,
        contact: req.store.contact,
        shippingPolicy: req.store.shippingPolicy,
      },
    });
  } catch (error) {
    console.error("Seller overview error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load seller overview." });
  }
});

/**
 * POST /store/seller/products
 * Approved seller creates a product (DRAFT or PENDING_REVIEW)
 * CRITICAL RULE: Seller cannot approve their own product.
 */
storeRouter.post("/seller/products", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const {
      title,
      brand,
      description,
      category,
      subcategory,
      condition,
      conditionDescription,
      defectImages,
      price,
      originalRetailPrice,
      currency,
      stockQuantity,
      images,
      variants,
      shippingInformation,
      asDraft = false,
    } = req.body;

    if (!title || !description || !category || price === undefined || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, description, category, price, and at least one image are required.",
      });
    }

    if (Number(price) < 0 || isNaN(Number(price))) {
      return res.status(400).json({
        success: false,
        message: "Product purchase price must be a non-negative number.",
      });
    }

    if (originalRetailPrice !== undefined && originalRetailPrice !== null && originalRetailPrice !== "") {
      if (Number(originalRetailPrice) < 0 || isNaN(Number(originalRetailPrice))) {
        return res.status(400).json({
          success: false,
          message: "Original retail price (MRP) must be a non-negative number.",
        });
      }
    }

    const parsedStock = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : 1;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity cannot be negative.",
      });
    }

    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.stockQuantity !== undefined && (parseInt(v.stockQuantity, 10) < 0 || isNaN(parseInt(v.stockQuantity, 10)))) {
          return res.status(400).json({
            success: false,
            message: "Variant stock quantity cannot be negative.",
          });
        }
      }
    }

    if (condition === "PRE_OWNED" && (!conditionDescription || !conditionDescription.trim())) {
      return res.status(400).json({
        success: false,
        message: "Pre-owned products require condition descriptions disclosing wear, flaws, or defects.",
      });
    }

    const product = new StoreProduct({
      sellerId: req.user._id,
      storeId: req.store._id,
      title: title.trim(),
      brand: (brand || "").trim(),
      description: description.trim(),
      category: category.trim(),
      subcategory: (subcategory || "").trim(),
      condition: condition === "PRE_OWNED" ? "PRE_OWNED" : "NEW",
      conditionDescription: (conditionDescription || "").trim(),
      defectImages: Array.isArray(defectImages) ? defectImages : [],
      price: Number(price),
      originalRetailPrice: originalRetailPrice ? Number(originalRetailPrice) : null,
      currency: currency || "INR",
      stockQuantity: parsedStock,
      images,
      variants: Array.isArray(variants) ? variants : [],
      shippingInformation: shippingInformation || {},
      status: asDraft ? "DRAFT" : "PENDING_REVIEW",
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: asDraft
        ? "Product draft saved successfully."
        : "Product submitted for admin review. It will become visible once approved.",
      product,
    });
  } catch (error) {
    console.error("Create store product error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create store product.",
    });
  }
});

/**
 * GET /store/seller/products
 * Retrieve all products belonging to the authenticated seller (all moderation statuses)
 */
storeRouter.get("/seller/products", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = { sellerId: req.user._id };

    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const products = await StoreProduct.find(filter).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Seller list products error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch seller products." });
  }
});

/**
 * GET /store/seller/products/:id
 * Retrieve a specific product belonging to the authenticated seller
 */
storeRouter.get("/seller/products/:id", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const product = await StoreProduct.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    }).lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or access denied." });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /store/seller/products/:id
 * Update seller's own product.
 * Enforces ownership: a seller cannot edit another seller's product.
 * Enforces moderation: seller cannot set status to APPROVED.
 * If product was REJECTED, updates status to PENDING_REVIEW for re-evaluation.
 * If product was APPROVED, editing important details triggers moderation again.
 */
storeRouter.put("/seller/products/:id", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const product = await StoreProduct.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you do not have permission to modify it.",
      });
    }

    const {
      title,
      brand,
      description,
      category,
      subcategory,
      condition,
      conditionDescription,
      defectImages,
      price,
      originalRetailPrice,
      currency,
      stockQuantity,
      images,
      variants,
      shippingInformation,
      resubmit = false,
      submitForReview = false,
      asDraft = false,
    } = req.body;

    // Validate non-negative price
    if (price !== undefined) {
      if (Number(price) < 0 || isNaN(Number(price))) {
        return res.status(400).json({
          success: false,
          message: "Product purchase price must be a non-negative number.",
        });
      }
    }

    // Validate originalRetailPrice if present
    if (originalRetailPrice !== undefined && originalRetailPrice !== null && originalRetailPrice !== "") {
      if (Number(originalRetailPrice) < 0 || isNaN(Number(originalRetailPrice))) {
        return res.status(400).json({
          success: false,
          message: "Original retail price (MRP) must be a non-negative number.",
        });
      }
    }

    // Validate non-negative stock
    if (stockQuantity !== undefined) {
      const parsedStock = parseInt(stockQuantity, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock quantity cannot be negative.",
        });
      }
    }

    // Validate variants
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.stockQuantity !== undefined && (parseInt(v.stockQuantity, 10) < 0 || isNaN(parseInt(v.stockQuantity, 10)))) {
          return res.status(400).json({
            success: false,
            message: "Variant stock quantity cannot be negative.",
          });
        }
      }
    }

    // Validate pre-owned requirements
    const effectiveCondition = condition || product.condition;
    const effectiveConditionDesc = conditionDescription !== undefined ? conditionDescription : product.conditionDescription;
    if (effectiveCondition === "PRE_OWNED" && (!effectiveConditionDesc || !effectiveConditionDesc.trim())) {
      return res.status(400).json({
        success: false,
        message: "Pre-owned products require condition descriptions disclosing wear, flaws, or defects.",
      });
    }

    // Track if critical fields were modified on an already-approved product
    let criticalChange = false;

    if (title && title.trim() !== product.title) {
      product.title = title.trim();
      criticalChange = true;
    }
    if (brand !== undefined && brand.trim() !== (product.brand || "")) {
      product.brand = brand.trim();
      criticalChange = true;
    }
    if (description && description.trim() !== product.description) {
      product.description = description.trim();
    }
    if (category && category !== product.category) {
      product.category = category;
      criticalChange = true;
    }
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (condition && condition !== product.condition) {
      product.condition = condition;
      criticalChange = true;
    }
    if (conditionDescription !== undefined) product.conditionDescription = conditionDescription;
    if (defectImages !== undefined) product.defectImages = defectImages;
    if (price !== undefined && Number(price) !== product.price) {
      product.price = Number(price);
      criticalChange = true;
    }
    if (originalRetailPrice !== undefined) {
      product.originalRetailPrice = originalRetailPrice ? Number(originalRetailPrice) : null;
    }
    if (currency) product.currency = currency;
    if (stockQuantity !== undefined) product.stockQuantity = parseInt(stockQuantity, 10);
    if (images && images.length > 0) {
      product.images = images;
      criticalChange = true;
    }
    if (variants !== undefined) product.variants = variants;
    if (shippingInformation) product.shippingInformation = shippingInformation;

    // Status transition handling (Strict: seller cannot set status to APPROVED)
    if (product.status === "DRAFT") {
      if (submitForReview || resubmit) {
        product.status = "PENDING_REVIEW";
        product.reviewHistory.push({
          status: "PENDING_REVIEW",
          notes: "Product draft submitted by seller for administrator review.",
          reviewedBy: null,
          reviewedAt: new Date(),
        });
      }
    } else if (product.status === "REJECTED") {
      if (resubmit || submitForReview) {
        product.status = "PENDING_REVIEW";
        product.reviewHistory.push({
          status: "PENDING_REVIEW",
          notes: "Seller resolved issues and resubmitted product for re-evaluation.",
          reviewedBy: null,
          reviewedAt: new Date(),
        });
      }
    } else if (product.status === "APPROVED" && criticalChange) {
      // Re-trigger moderation on approved product modifications
      product.status = "PENDING_REVIEW";
      product.reviewHistory.push({
        status: "PENDING_REVIEW",
        notes: "Automatic status update: critical product attributes were modified by the seller.",
        reviewedBy: null,
        reviewedAt: new Date(),
      });
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        product.status === "PENDING_REVIEW"
          ? "Product updated and queued for administrator review."
          : "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Seller update product error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update product." });
  }
});

/**
 * PATCH /store/seller/products/:id/inventory
 * Quick inline inventory update for seller's own product
 * Validates non-negative stock for main product and all variants
 */
storeRouter.patch("/seller/products/:id/inventory", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const product = await StoreProduct.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you do not have permission to modify its inventory.",
      });
    }

    const { stockQuantity, variants } = req.body;

    if (stockQuantity !== undefined) {
      const parsedStock = parseInt(stockQuantity, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock quantity must be a non-negative number.",
        });
      }
      product.stockQuantity = parsedStock;
    }

    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.stockQuantity !== undefined) {
          const vStock = parseInt(v.stockQuantity, 10);
          if (isNaN(vStock) || vStock < 0) {
            return res.status(400).json({
              success: false,
              message: "Variant stock quantity must be a non-negative number.",
            });
          }
        }
      }
      product.variants = variants;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Inventory stock updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Seller inventory update error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update inventory stock.",
    });
  }
});

/**
 * DELETE /store/seller/products/:id
 * Archive seller's own product
 */
storeRouter.delete("/seller/products/:id", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const product = await StoreProduct.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or access denied." });
    }

    product.status = "ARCHIVED";
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product archived successfully.",
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// PHASE 5: STORE CART, MULTI-SELLER CHECKOUT & ORDER SPLITTING
// =========================================================================

export function calculateSellerShipping(store, subtotal) {
  if (!store || subtotal <= 0) return 0;
  const policy = store.shippingPolicy || {};
  const standardFee = Number(policy.standardShippingFee) || 0;
  const freeAbove = Number(policy.freeShippingAbove) || 0;
  if (freeAbove > 0 && subtotal >= freeAbove) {
    return 0;
  }
  return standardFee;
}

export async function enrichCart(cart) {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return {
      items: [],
      sellerGroups: [],
      cartSubtotal: 0,
      totalShippingFee: 0,
      grandTotal: 0,
      hasUnavailableItems: false,
      itemCount: 0,
    };
  }

  const enrichedItems = [];
  let hasUnavailable = false;

  for (const item of cart.items) {
    const product = await StoreProduct.findById(item.productId).lean();
    const store = item.storeId
      ? await Store.findById(item.storeId).lean()
      : product?.storeId
      ? await Store.findById(product.storeId).lean()
      : null;

    let isAvailable = true;
    let warning = null;
    let availableStock = 0;
    let effectivePrice = 0;
    let variantObj = null;

    if (!product || product.status !== "APPROVED") {
      isAvailable = false;
      warning = "This product is no longer available.";
      hasUnavailable = true;
    } else if (!store || store.status !== "ACTIVE") {
      isAvailable = false;
      warning = "This store is currently not active.";
      hasUnavailable = true;
    } else {
      if (item.variantId) {
        variantObj = (product.variants || []).find(
          (v) => String(v._id) === String(item.variantId)
        );
      } else if (item.size || item.color) {
        variantObj = (product.variants || []).find(
          (v) =>
            (!item.size || v.size === item.size) &&
            (!item.color || v.color === item.color)
        );
      }

      if (item.variantId && !variantObj) {
        isAvailable = false;
        warning = "Selected variant is no longer available.";
        hasUnavailable = true;
      } else {
        availableStock = variantObj ? variantObj.stockQuantity : product.stockQuantity;
        if (availableStock <= 0) {
          isAvailable = false;
          warning = "Item is out of stock.";
          hasUnavailable = true;
        } else if (availableStock < item.quantity) {
          isAvailable = false;
          warning = `Only ${availableStock} available in stock.`;
          hasUnavailable = true;
        }

        if (variantObj && typeof variantObj.priceOverride === "number" && variantObj.priceOverride >= 0) {
          effectivePrice = variantObj.priceOverride;
        } else {
          effectivePrice = product.price || 0;
        }
      }
    }

    const lineTotal = isAvailable ? effectivePrice * item.quantity : 0;

    enrichedItems.push({
      _id: item._id,
      productId: item.productId,
      storeId: store?._id || item.storeId,
      storeName: store?.storeName || "Unknown Boutique",
      storeSlug: store?.storeSlug || "",
      variantId: item.variantId || variantObj?._id || null,
      title: product?.title || "Product unavailable",
      brand: product?.brand || "",
      image: (product?.images && product.images[0]) || "",
      size: item.size || variantObj?.size || "",
      color: item.color || variantObj?.color || "",
      quantity: item.quantity,
      unitPrice: effectivePrice,
      lineTotal,
      isAvailable,
      availableStock,
      warning,
      productStatus: product?.status || "NOT_FOUND",
      storeStatus: store?.status || "NOT_FOUND",
    });
  }

  // Group enriched items by store
  const storeMap = new Map();
  for (const item of enrichedItems) {
    const sId = String(item.storeId);
    if (!storeMap.has(sId)) {
      storeMap.set(sId, {
        storeId: item.storeId,
        storeName: item.storeName,
        storeSlug: item.storeSlug,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        total: 0,
      });
    }
    const group = storeMap.get(sId);
    group.items.push(item);
    if (item.isAvailable) {
      group.subtotal += item.lineTotal;
    }
  }

  let cartSubtotal = 0;
  let totalShippingFee = 0;
  const sellerGroups = [];

  for (const group of storeMap.values()) {
    const storeDoc = await Store.findById(group.storeId).lean();
    group.shippingFee = calculateSellerShipping(storeDoc, group.subtotal);
    group.total = group.subtotal + group.shippingFee;
    cartSubtotal += group.subtotal;
    totalShippingFee += group.shippingFee;
    sellerGroups.push(group);
  }

  const grandTotal = cartSubtotal + totalShippingFee;
  const totalItemCount = enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return {
    items: enrichedItems,
    sellerGroups,
    cartSubtotal,
    totalShippingFee,
    grandTotal,
    hasUnavailableItems: hasUnavailable,
    itemCount: totalItemCount,
  };
}

/**
 * GET /store/cart
 * Customer: Retrieve current user's cart with live stock/price validation & seller breakdown
 */
storeRouter.get("/cart", authenticateToken, async (req, res) => {
  try {
    let cart = await StoreCart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = new StoreCart({ customerId: req.user._id, items: [] });
      await cart.save();
    }

    const enriched = await enrichCart(cart);

    return res.status(200).json({
      success: true,
      cart: enriched,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve cart.",
    });
  }
});

/**
 * POST /store/cart/items
 * Customer: Add product/variant to cart with server-side stock and approval validation
 */
storeRouter.post("/cart/items", authenticateToken, async (req, res) => {
  try {
    const { productId, variantId, size, color, quantity } = req.body || {};

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be a positive integer." });
    }

    const product = await StoreProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Store product not found. Rental items cannot be added to Store cart.",
      });
    }

    if (product.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Only approved and published Store products can be added to your cart.",
      });
    }

    const store = await Store.findById(product.storeId);
    if (!store || store.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "This seller's store is currently not active or suspended.",
      });
    }

    let selectedVariant = null;
    if (variantId) {
      selectedVariant = product.variants.id(variantId);
      if (!selectedVariant) {
        return res.status(400).json({ success: false, message: "Selected product variant was not found." });
      }
    } else if (size || color) {
      selectedVariant = (product.variants || []).find(
        (v) => (!size || v.size === size) && (!color || v.color === color)
      );
    }

    const availableStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
    if (availableStock <= 0) {
      return res.status(400).json({ success: false, message: "This item is currently out of stock." });
    }

    let cart = await StoreCart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = new StoreCart({ customerId: req.user._id, items: [] });
    }

    // Check if item already exists in cart (matching product, variant, size and color)
    const existingIndex = cart.items.findIndex((item) => {
      const matchProd = String(item.productId) === String(product._id);
      if (selectedVariant?._id) {
        return matchProd && String(item.variantId) === String(selectedVariant._id);
      }
      return (
        matchProd &&
        (item.size || "") === (size || "") &&
        (item.color || "") === (color || "")
      );
    });

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${qty} more. Available stock is ${availableStock} (already ${cart.items[existingIndex].quantity} in cart).`,
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      if (qty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock (${availableStock}).`,
        });
      }
      cart.items.push({
        productId: product._id,
        storeId: product.storeId,
        variantId: selectedVariant?._id || null,
        size: selectedVariant ? selectedVariant.size : (size || ""),
        color: selectedVariant ? selectedVariant.color : (color || ""),
        quantity: qty,
      });
    }

    await cart.save();
    const enriched = await enrichCart(cart);

    return res.status(200).json({
      success: true,
      message: "Item added to cart.",
      cart: enriched,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add item to cart.",
    });
  }
});

/**
 * PUT /store/cart/items/:itemId
 * Customer: Update cart item quantity
 */
storeRouter.put("/cart/items/:itemId", authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body || {};
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
    }

    const cart = await StoreCart.findOne({ customerId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Cart line item not found." });
    }

    const product = await StoreProduct.findById(item.productId);
    if (!product || product.status !== "APPROVED") {
      return res.status(400).json({ success: false, message: "Product is no longer available." });
    }

    let availableStock = product.stockQuantity;
    if (item.variantId) {
      const v = product.variants.id(item.variantId);
      if (v) availableStock = v.stockQuantity;
    }

    if (qty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${availableStock}).`,
      });
    }

    item.quantity = qty;
    await cart.save();

    const enriched = await enrichCart(cart);

    return res.status(200).json({
      success: true,
      message: "Cart updated.",
      cart: enriched,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update cart item.",
    });
  }
});

/**
 * DELETE /store/cart/items/:itemId
 * Customer: Remove line item from cart
 */
storeRouter.delete("/cart/items/:itemId", authenticateToken, async (req, res) => {
  try {
    const cart = await StoreCart.findOne({ customerId: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    cart.items.pull(req.params.itemId);
    await cart.save();

    const enriched = await enrichCart(cart);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      cart: enriched,
    });
  } catch (error) {
    console.error("Delete cart item error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove item from cart.",
    });
  }
});

/**
 * DELETE /store/cart
 * Customer: Clear all items from cart
 */
storeRouter.delete("/cart", authenticateToken, async (req, res) => {
  try {
    const cart = await StoreCart.findOne({ customerId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      cart: {
        items: [],
        sellerGroups: [],
        cartSubtotal: 0,
        totalShippingFee: 0,
        grandTotal: 0,
        hasUnavailableItems: false,
        itemCount: 0,
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear cart.",
    });
  }
});

/**
 * POST /store/checkout/validate
 * Checkout pre-validation: Live pricing, seller groupings, stock availability, and grand totals
 */
storeRouter.post("/checkout/validate", authenticateToken, async (req, res) => {
  try {
    const cart = await StoreCart.findOne({ customerId: req.user._id });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Your shopping cart is empty.",
      });
    }

    const enriched = await enrichCart(cart);
    const errors = [];

    for (const item of enriched.items) {
      if (!item.isAvailable) {
        errors.push(`${item.title}: ${item.warning || "Unavailable"}`);
      }
    }

    return res.status(200).json({
      success: true,
      valid: errors.length === 0,
      errors,
      cart: enriched,
    });
  } catch (error) {
    console.error("Validate checkout error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Checkout validation failed.",
    });
  }
});

/**
 * POST /store/checkout/create-order
 * Customer: Multi-seller atomic checkout with stock decrements, order splitting & rollback safety
 */
storeRouter.post("/checkout/create-order", authenticateToken, async (req, res) => {
  const { shippingAddress, notes } = req.body || {};

  if (!shippingAddress) {
    return res.status(400).json({ success: false, message: "Shipping address is required." });
  }

  const { name, phone, street, city, state, pincode, houseNo, landmark, label } = shippingAddress;
  if (!name || !phone || !street || !city || !state || !pincode) {
    return res.status(400).json({
      success: false,
      message: "Complete delivery address (name, phone, street, city, state, PIN code) is required.",
    });
  }

  const cleanPin = String(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid 6-digit Indian PIN code.",
    });
  }

  const normalizedAddress = {
    name: String(name).trim(),
    phone: String(phone).trim(),
    street: String(street).trim(),
    houseNo: houseNo ? String(houseNo).trim() : "",
    landmark: landmark ? String(landmark).trim() : "",
    city: String(city).trim(),
    state: String(state).trim(),
    pincode: cleanPin,
    label: label ? String(label).trim() : "Home",
  };

  const cart = await StoreCart.findOne({ customerId: req.user._id });
  if (!cart || !cart.items || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Your shopping cart is empty." });
  }

  const decrementedItems = [];
  const itemDetails = [];

  try {
    for (const item of cart.items) {
      const product = await StoreProduct.findById(item.productId);
      if (!product || product.status !== "APPROVED") {
        throw new Error(`Product "${product?.title || "item"}" is no longer available.`);
      }

      const store = await Store.findById(product.storeId);
      if (!store || store.status !== "ACTIVE") {
        throw new Error(`Store "${store?.storeName || "seller"}" is currently inactive.`);
      }

      let unitPrice = product.price;
      let variantObj = null;

      if (item.variantId) {
        variantObj = product.variants.id(item.variantId);
        if (!variantObj) {
          throw new Error(`Selected variant for "${product.title}" not found.`);
        }
        if (typeof variantObj.priceOverride === "number" && variantObj.priceOverride >= 0) {
          unitPrice = variantObj.priceOverride;
        }
      }

      // Atomic stock decrement with concurrency protection
      let updated = null;
      if (item.variantId) {
        updated = await StoreProduct.findOneAndUpdate(
          {
            _id: product._id,
            status: "APPROVED",
            "variants._id": item.variantId,
            "variants.stockQuantity": { $gte: item.quantity },
            stockQuantity: { $gte: item.quantity },
          },
          {
            $inc: {
              "variants.$.stockQuantity": -item.quantity,
              stockQuantity: -item.quantity,
            },
          },
          { new: true }
        );
      } else {
        updated = await StoreProduct.findOneAndUpdate(
          {
            _id: product._id,
            status: "APPROVED",
            stockQuantity: { $gte: item.quantity },
          },
          {
            $inc: { stockQuantity: -item.quantity },
          },
          { new: true }
        );
      }

      if (!updated) {
        throw new Error(`Insufficient stock for "${product.title}". It may have just sold out.`);
      }

      decrementedItems.push({
        productId: product._id,
        variantId: item.variantId || null,
        quantity: item.quantity,
      });

      itemDetails.push({
        productId: product._id,
        storeId: store._id,
        sellerId: store.sellerId,
        storeName: store.storeName,
        storeSlug: store.storeSlug,
        shippingPolicy: store.shippingPolicy,
        title: product.title,
        brand: product.brand || "",
        image: (product.images && product.images[0]) || "",
        variantId: item.variantId || null,
        size: item.size || variantObj?.size || "",
        color: item.color || variantObj?.color || "",
        unitPrice,
        quantity: item.quantity,
        totalPrice: unitPrice * item.quantity,
      });
    }
  } catch (err) {
    // Rollback decremented items
    for (const dec of decrementedItems) {
      try {
        if (dec.variantId) {
          await StoreProduct.updateOne(
            { _id: dec.productId, "variants._id": dec.variantId },
            { $inc: { "variants.$.stockQuantity": dec.quantity, stockQuantity: dec.quantity } }
          );
        } else {
          await StoreProduct.updateOne(
            { _id: dec.productId },
            { $inc: { stockQuantity: dec.quantity } }
          );
        }
      } catch (rollbackErr) {
        console.error("Rollback error for product:", dec.productId, rollbackErr);
      }
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Order checkout failed due to stock availability.",
    });
  }

  try {
    // Group items by seller
    const sellerMap = new Map();
    for (const detail of itemDetails) {
      const sKey = String(detail.storeId);
      if (!sellerMap.has(sKey)) {
        sellerMap.set(sKey, {
          storeId: detail.storeId,
          sellerId: detail.sellerId,
          storeName: detail.storeName,
          storeSlug: detail.storeSlug,
          shippingPolicy: detail.shippingPolicy,
          items: [],
          subtotal: 0,
          shippingFee: 0,
          totalAmount: 0,
        });
      }
      const group = sellerMap.get(sKey);
      group.items.push({
        productId: detail.productId,
        title: detail.title,
        brand: detail.brand,
        image: detail.image,
        variantId: detail.variantId,
        size: detail.size,
        color: detail.color,
        unitPrice: detail.unitPrice,
        quantity: detail.quantity,
        totalPrice: detail.totalPrice,
      });
      group.subtotal += detail.totalPrice;
    }

    let parentSubtotal = 0;
    let parentTotalShipping = 0;

    for (const group of sellerMap.values()) {
      group.shippingFee = calculateSellerShipping({ shippingPolicy: group.shippingPolicy }, group.subtotal);
      group.totalAmount = group.subtotal + group.shippingFee;
      parentSubtotal += group.subtotal;
      parentTotalShipping += group.shippingFee;
    }

    const parentGrandTotal = parentSubtotal + parentTotalShipping;
    const now = Date.now();
    const parentOrderNumber = `SO-${now}-${Math.floor(1000 + Math.random() * 9000)}`;

    const parentOrder = new StoreOrder({
      orderNumber: parentOrderNumber,
      customerId: req.user._id,
      customerEmail: req.user.email,
      customerPhone: normalizedAddress.phone || req.user.phone || "",
      shippingAddress: normalizedAddress,
      items: itemDetails.map((d) => ({
        productId: d.productId,
        storeId: d.storeId,
        sellerId: d.sellerId,
        storeName: d.storeName,
        title: d.title,
        brand: d.brand,
        image: d.image,
        variantId: d.variantId,
        size: d.size,
        color: d.color,
        unitPrice: d.unitPrice,
        quantity: d.quantity,
        totalPrice: d.totalPrice,
      })),
      subtotal: parentSubtotal,
      totalShippingFee: parentTotalShipping,
      grandTotal: parentGrandTotal,
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      paymentMethod: "PHONEPE",
      notes: (notes || "").trim(),
      fulfilmentOrderIds: [],
    });

    await parentOrder.save();

    const fulfilmentOrders = [];
    let fIdx = 1;
    for (const group of sellerMap.values()) {
      const fulfilmentOrderNumber = `SFO-${now}-${fIdx++}-${Math.floor(1000 + Math.random() * 9000)}`;
      const fulfilmentOrder = new StoreFulfilmentOrder({
        fulfilmentOrderNumber,
        parentOrderId: parentOrder._id,
        parentOrderNumber: parentOrder.orderNumber,
        customerId: req.user._id,
        sellerId: group.sellerId,
        storeId: group.storeId,
        storeName: group.storeName,
        storeSlug: group.storeSlug,
        items: group.items,
        subtotal: group.subtotal,
        shippingFee: group.shippingFee,
        totalAmount: group.totalAmount,
        status: "PENDING_PAYMENT",
        deliveryAddress: normalizedAddress,
      });
      await fulfilmentOrder.save();
      fulfilmentOrders.push(fulfilmentOrder);
    }

    // Link fulfillment IDs to parent
    parentOrder.fulfilmentOrderIds = fulfilmentOrders.map((f) => f._id);
    await parentOrder.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully. Pending payment.",
      order: parentOrder,
      fulfilmentOrders,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to finalize order creation.",
    });
  }
});

/**
 * GET /store/orders
 * Customer: Order history across all Store purchases
 */
storeRouter.get("/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await StoreOrder.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("fulfilmentOrderIds")
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get customer orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve order history.",
    });
  }
});

/**
 * GET /store/orders/:id
 * Customer: Detailed order view with fulfillment breakdown
 */
storeRouter.get("/orders/:id", authenticateToken, async (req, res) => {
  try {
    const order = await StoreOrder.findOne({
      _id: req.params.id,
      customerId: req.user._id,
    })
      .populate("fulfilmentOrderIds")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied.",
      });
    }

    const [cancellations, returns, invoice, reviews] = await Promise.all([
      StoreCancellation.find({ parentOrderId: order._id }).lean(),
      StoreReturn.find({ parentOrderId: order._id }).lean(),
      StoreInvoice.findOne({ parentOrderId: order._id }).select("invoiceNumber invoiceDate totalAmount billingAddress sellerBreakdown paymentMethod").lean(),
      StoreReview.find({ customerId: req.user._id, parentOrderId: order._id }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      order,
      cancellations: cancellations || [],
      returns: returns || [],
      invoice: invoice || null,
      reviews: reviews || [],
    });
  } catch (error) {
    console.error("Get order details error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve order details.",
    });
  }
});

/**
 * =========================================================================
 * PHASE 7: SELLER FULFILMENT, DELIVERY & ORDER TRACKING
 * =========================================================================
 */

/**
 * GET /store/seller/orders
 * Seller: View fulfillment orders assigned strictly to this seller with filters & status metrics
 */
storeRouter.get("/seller/orders", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const query = { sellerId: req.user._id };

    if (status && status !== "ALL") {
      if (status === "SHIPPED") {
        query.status = { $in: ["SHIPPED", "DISPATCHED"] };
      } else {
        query.status = status;
      }
    }

    if (search && String(search).trim()) {
      const s = String(search).trim();
      query.$or = [
        { fulfilmentOrderNumber: { $regex: s, $options: "i" } },
        { parentOrderNumber: { $regex: s, $options: "i" } },
        { "dispatchDetails.trackingNumber": { $regex: s, $options: "i" } },
        { "deliveryAddress.name": { $regex: s, $options: "i" } },
        { "deliveryAddress.phone": { $regex: s, $options: "i" } },
      ];
    }

    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [orders, total, countsAgg] = await Promise.all([
      StoreFulfilmentOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      StoreFulfilmentOrder.countDocuments(query),
      StoreFulfilmentOrder.aggregate([
        { $match: { sellerId: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const countsByStatus = {
      ALL: 0,
      ORDER_PLACED: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    countsAgg.forEach((item) => {
      countsByStatus.ALL += item.count;
      const st = item._id === "DISPATCHED" ? "SHIPPED" : item._id;
      if (countsByStatus[st] !== undefined) {
        countsByStatus[st] += item.count;
      }
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: take,
      countsByStatus,
      orders,
    });
  } catch (error) {
    console.error("Seller orders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve seller orders.",
    });
  }
});

/**
 * GET /store/seller/orders/:id
 * Seller: View single fulfillment order belonging strictly to this seller
 */
storeRouter.get("/seller/orders/:id", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const fulfilmentOrder = await StoreFulfilmentOrder.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    })
      .populate("parentOrderId", "orderNumber paymentStatus grandTotal createdAt")
      .lean();

    if (!fulfilmentOrder) {
      return res.status(404).json({
        success: false,
        message: "Fulfilment order not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      order: fulfilmentOrder,
    });
  } catch (error) {
    console.error("Seller order detail error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve fulfilment order.",
    });
  }
});

/**
 * PUT /store/seller/orders/:id/confirm
 * Seller: Confirm an order in ORDER_PLACED status
 */
storeRouter.put("/seller/orders/:id/confirm", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const result = await transitionFulfilmentStatus({
      fulfilmentOrderId: req.params.id,
      targetStatus: "CONFIRMED",
      actorId: req.user._id,
      actorRole: "seller",
      actorName: req.user.name,
      note: req.body?.note || "Order confirmed by boutique.",
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to confirm order.",
    });
  }
});

/**
 * PUT /store/seller/orders/:id/processing
 * Seller: Mark order as packaging / in processing
 */
storeRouter.put("/seller/orders/:id/processing", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const result = await transitionFulfilmentStatus({
      fulfilmentOrderId: req.params.id,
      targetStatus: "PROCESSING",
      actorId: req.user._id,
      actorRole: "seller",
      actorName: req.user.name,
      note: req.body?.note || "Packaging items for shipment.",
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update order to processing.",
    });
  }
});

/**
 * PUT /store/seller/orders/:id/ship
 * Seller: Dispatch and mark order as shipped with courier and tracking details
 */
storeRouter.put("/seller/orders/:id/ship", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const { courierName, trackingNumber, trackingUrl, dispatchedAt, estimatedDelivery, note } = req.body || {};

    const result = await transitionFulfilmentStatus({
      fulfilmentOrderId: req.params.id,
      targetStatus: "SHIPPED",
      actorId: req.user._id,
      actorRole: "seller",
      actorName: req.user.name,
      dispatchData: {
        courierName,
        trackingNumber,
        trackingUrl,
        dispatchedAt,
        estimatedDelivery,
      },
      note: note || `Dispatched via ${courierName} (AWB: ${trackingNumber})`,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to mark order as shipped.",
    });
  }
});

/**
 * PUT /store/seller/orders/:id/deliver
 * Seller: Confirm manual delivery
 */
storeRouter.put("/seller/orders/:id/deliver", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const { deliveryConfirmationNote, note } = req.body || {};

    const result = await transitionFulfilmentStatus({
      fulfilmentOrderId: req.params.id,
      targetStatus: "DELIVERED",
      actorId: req.user._id,
      actorRole: "seller",
      actorName: req.user.name,
      dispatchData: { deliveryConfirmationNote },
      note: note || deliveryConfirmationNote || "Marked delivered by seller.",
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to mark order as delivered.",
    });
  }
});

/**
 * PUT /store/seller/orders/:id/cancel
 * Seller: Cancel fulfillment order with required reason
 */
storeRouter.put("/seller/orders/:id/cancel", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const { reason, note } = req.body || {};

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required to cancel a shipment.",
      });
    }

    const result = await transitionFulfilmentStatus({
      fulfilmentOrderId: req.params.id,
      targetStatus: "CANCELLED",
      actorId: req.user._id,
      actorRole: "seller",
      actorName: req.user.name,
      dispatchData: { cancellationReason: reason },
      note: note || reason,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to cancel fulfilment order.",
    });
  }
});

/**
 * PUT /store/seller/orders/:id/status
 * Seller: Generic state machine transition endpoint
 */
storeRouter.put("/seller/orders/:id/status", authenticateToken, requireApprovedSeller, async (req, res) => {
  try {
    const { status, courierName, trackingNumber, trackingUrl, dispatchedAt, estimatedDelivery, reason, note } =
      req.body || {};

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Target status is required.",
      });
    }

    const result = await transitionFulfilmentStatus({
      fulfilmentOrderId: req.params.id,
      targetStatus: status,
      actorId: req.user._id,
      actorRole: "seller",
      actorName: req.user.name,
      dispatchData: {
        courierName,
        trackingNumber,
        trackingUrl,
        dispatchedAt,
        estimatedDelivery,
        cancellationReason: reason,
      },
      note: note || `Transition to ${status} by seller.`,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update order status.",
    });
  }
});

/**
 * PUT /store/orders/:id/fulfilment/:fulfilmentId/confirm-delivery
 * Customer: Confirm delivery of a specific seller's shipment
 */
storeRouter.put(
  "/orders/:id/fulfilment/:fulfilmentId/confirm-delivery",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await transitionFulfilmentStatus({
        fulfilmentOrderId: req.params.fulfilmentId,
        targetStatus: "DELIVERED",
        actorId: req.user._id,
        actorRole: "customer",
        actorName: req.user.name,
        dispatchData: { deliveryConfirmationNote: req.body?.note || "Confirmed delivered by customer." },
        note: req.body?.note || "Delivery receipt confirmed by customer.",
      });

      return res.status(200).json(result);
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Failed to confirm shipment delivery.",
      });
    }
  }
);

/**
 * GET /store/notifications
 * In-app notifications for customer or seller
 */
storeRouter.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const { unreadOnly, limit = 30, page = 1 } = req.query;
    const query = { recipientId: req.user._id };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [notifications, total, unreadCount] = await Promise.all([
      StoreNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      StoreNotification.countDocuments(query),
      StoreNotification.countDocuments({ recipientId: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      unreadCount,
      page: Number(page),
      limit: take,
      notifications,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve notifications.",
    });
  }
});

/**
 * PUT /store/notifications/:id/read
 * Mark notification as read
 */
storeRouter.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const notif = await StoreNotification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      notification: notif,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark notification as read.",
    });
  }
});

/**
 * PUT /store/notifications/read-all
 * Mark all notifications as read for current user
 */
storeRouter.put("/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    await StoreNotification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark all notifications as read.",
    });
  }
});

/**
 * =========================================================================
 * PHASE 6: STORE PAYMENTS, PHONEPE SANDBOX, WEBHOOKS & SELLER FINANCES
 * =========================================================================
 */

/**
 * POST /store/payment/initiate
 * Customer: Initiate payment for a pending Store order via PhonePe Sandbox
 */
storeRouter.post("/payment/initiate", authenticateToken, async (req, res) => {
  try {
    const { orderId, orderNumber, idempotencyKey, simulateMock } = req.body || {};

    if (!orderId && !orderNumber) {
      return res.status(400).json({
        success: false,
        message: "orderId or orderNumber is required to initiate payment.",
      });
    }

    const result = await initiateStorePayment({
      orderId,
      orderNumber,
      customerId: req.user._id,
      customerEmail: req.user.email,
      idempotencyKey,
      simulateMock,
    });

    return res.status(200).json({
      success: true,
      message: "Payment session initiated.",
      payment: result.payment,
      redirectUrl: result.redirectUrl,
      isIdempotent: result.isIdempotent || false,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to initiate payment session.",
      details: error.details || null,
    });
  }
});

/**
 * POST /store/payment/verify
 * Customer / Admin: Verify PhonePe payment status and finalize order + fulfillment orders
 */
storeRouter.post("/payment/verify", authenticateToken, async (req, res) => {
  try {
    const { merchantTransactionId, simulateMock } = req.body || {};

    if (!merchantTransactionId) {
      return res.status(400).json({
        success: false,
        message: "merchantTransactionId is required for payment verification.",
      });
    }

    const result = await verifyStorePayment({
      merchantTransactionId,
      customerId: req.user._id,
      isAdmin: req.user.role === "admin",
      simulateMock,
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Error verifying payment status.",
      retryable: error.retryable || false,
    });
  }
});

/**
 * POST /store/payment/callback & POST /store/payment/webhook
 * PhonePe Sandbox Server-to-Server Webhook for Store Orders
 * Signed with SHA-256 checksum, idempotent, anti-tamper protected
 */
const handleStorePhonePeWebhook = async (req, res) => {
  try {
    const rawVerify =
      req.headers["x-verify"] || req.headers["X-Verify"] || req.headers["X-VERIFY"];
    const { response: base64Response } = req.body || {};

    const result = await processStoreWebhook({
      rawVerify,
      base64Response,
      isMock: req.headers["x-mock-test"] === "true",
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Webhook processing failed.",
    });
  }
};

storeRouter.post("/payment/callback", handleStorePhonePeWebhook);
storeRouter.post("/payment/webhook", handleStorePhonePeWebhook);

/**
 * GET /store/seller/finances/overview
 * Seller: View own financial summary (gross sales, commissions, shipping, refunds, net payable)
 * Strictly isolated to req.user._id. Labeled as internal ledger balance.
 */
storeRouter.get(
  "/seller/finances/overview",
  authenticateToken,
  requireApprovedSeller,
  async (req, res) => {
    try {
      const finances = await getSellerFinancesOverview(req.user._id);
      return res.status(200).json({
        success: true,
        finances,
      });
    } catch (error) {
      console.error("Seller finances overview error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve seller finances overview.",
      });
    }
  }
);

/**
 * GET /store/seller/finances/ledger
 * Seller: View own immutable financial audit trail entries
 * Strictly isolated to req.user._id
 */
storeRouter.get(
  "/seller/finances/ledger",
  authenticateToken,
  requireApprovedSeller,
  async (req, res) => {
    try {
      const { type, limit = 50, page = 1 } = req.query;
      const query = { sellerId: req.user._id };

      if (type) {
        query.type = type;
      }

      const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
      const take = Math.min(100, Math.max(1, Number(limit)));

      const [entries, total] = await Promise.all([
        StoreLedger.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
        StoreLedger.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        total,
        page: Number(page),
        count: entries.length,
        entries,
        disclaimer:
          "Internal ledger balances only. Bank payouts and live transfers are disabled.",
      });
    } catch (error) {
      console.error("Seller ledger error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve seller ledger entries.",
      });
    }
  }
);

/**
 * =========================================================================
 * PHASE 8: POST-PURCHASE EXPERIENCE (INVOICES, CANCELLATIONS, RETURNS, REVIEWS)
 * =========================================================================
 */

/**
 * GET /store/orders/:id/invoice
 * Customer: Retrieve or generate immutable purchase invoice snapshot
 */
storeRouter.get("/orders/:id/invoice", authenticateToken, async (req, res) => {
  try {
    const result = await getOrCreateStoreInvoice({
      parentOrderId: req.params.id,
      customerId: req.user._id,
      isAdmin: req.user.role === "admin",
    });

    return res.status(200).json({
      success: true,
      invoice: result.invoice,
      isExisting: result.isExisting,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to generate or retrieve Store invoice.",
    });
  }
});

/**
 * POST /store/orders/:id/cancellations
 * Customer: Submit cancellation request for a fulfillment order prior to dispatch
 */
storeRouter.post("/orders/:id/cancellations", authenticateToken, async (req, res) => {
  try {
    const { fulfilmentOrderId, reason } = req.body || {};
    const result = await requestStoreCancellation({
      parentOrderId: req.params.id,
      fulfilmentOrderId,
      customerId: req.user._id,
      reason,
    });

    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to submit cancellation request.",
    });
  }
});

/**
 * POST /store/orders/:id/returns
 * Customer: Submit return request for a delivered fulfillment order within return policy window
 */
storeRouter.post("/orders/:id/returns", authenticateToken, async (req, res) => {
  try {
    const { fulfilmentOrderId, items, reason, description, images, customerBankDetails } = req.body || {};
    const result = await requestStoreReturn({
      parentOrderId: req.params.id,
      fulfilmentOrderId,
      customerId: req.user._id,
      items,
      reason,
      description,
      images,
      customerBankDetails,
    });

    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to submit return request.",
    });
  }
});

/**
 * POST /store/products/:productId/reviews
 * Customer: Submit verified purchase review for an item in a delivered fulfillment order
 */
storeRouter.post("/products/:productId/reviews", authenticateToken, async (req, res) => {
  try {
    const { fulfilmentOrderId, rating, title, comment } = req.body || {};
    const result = await createStoreReview({
      customerId: req.user._id,
      customerName: req.user.name || "Verified Customer",
      productId: req.params.productId,
      fulfilmentOrderId,
      rating,
      title,
      comment,
    });

    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to submit product review.",
    });
  }
});

/**
 * GET /store/products/:productId/reviews
 * Public: Retrieve published product reviews with rating breakdown
 */
storeRouter.get("/products/:productId/reviews", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await getProductReviews({
      productId: req.params.productId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve product reviews.",
    });
  }
});

/**
 * GET /store/customer/cancellations
 * Customer: Retrieve own cancellation requests
 */
storeRouter.get("/customer/cancellations", authenticateToken, async (req, res) => {
  try {
    const cancellations = await StoreCancellation.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: cancellations.length,
      cancellations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve cancellation requests.",
    });
  }
});

/**
 * GET /store/customer/returns
 * Customer: Retrieve own return requests
 */
storeRouter.get("/customer/returns", authenticateToken, async (req, res) => {
  try {
    const returns = await StoreReturn.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: returns.length,
      returns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve return requests.",
    });
  }
});

/**
 * GET /store/customer/reviews
 * Customer: Retrieve own submitted reviews
 */
storeRouter.get("/customer/reviews", authenticateToken, async (req, res) => {
  try {
    const reviews = await StoreReview.find({ customerId: req.user._id })
      .populate("productId", "title images price category")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve customer reviews.",
    });
  }
});

export default storeRouter;
