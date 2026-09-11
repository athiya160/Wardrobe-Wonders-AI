import { Router } from "express";
import ProductModel from "../models/productModel.js";
import OrderModel from "../models/OrderModel.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const providerRouter = new Router();

// All provider routes require authentication and either 'provider' or 'admin' role
providerRouter.use(authenticateToken, requireRole("provider", "admin"));

/**
 * POST /provider/listings
 * Create a new dress listing
 */
providerRouter.post("/listings", async (req, res) => {
  try {
    const { body, user } = req;
    if (!body) {
      return res.status(400).json({ status: false, message: "Request body is required." });
    }

    const title = body.title || body.name;
    const price = body.rentalPricePerDay != null ? body.rentalPricePerDay : body.price;
    const deposit = body.securityDeposit != null ? body.securityDeposit : body.advance;
    const image = (Array.isArray(body.images) && body.images[0]) || body.image;
    const category = body.category;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: false, message: "Dress title or name is required." });
    }
    if (price == null || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ status: false, message: "Valid rental price per day is required." });
    }
    if (!deposit) {
      return res.status(400).json({ status: false, message: "Security deposit is required." });
    }
    if (!image) {
      return res.status(400).json({ status: false, message: "At least one product image is required." });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ status: false, message: "Category is required." });
    }

    const newListing = new ProductModel({
      providerId: user._id,
      title: title.trim(),
      name: title.trim(),
      description: body.description || "",
      category: category.trim(),
      gender: body.gender || "women",
      size: body.size || "M",
      brand: body.brand || "Independent / Boutique",
      condition: body.condition || "Like New",
      color: body.color || "",
      pattern: body.pattern || "",
      style: body.style || "",
      season: body.season || "",
      occasion: body.occasion || category.trim(),
      tags: Array.isArray(body.tags) ? body.tags : [],
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : [image],
      image: image,
      rentalPricePerDay: Number(price),
      price: Number(price),
      securityDeposit: deposit,
      advance: String(deposit),
      location: body.location || "Available Nationwide",
      externalUrl: body.externalUrl || "",
      stock: body.stock ? String(body.stock) : "1",
      availability: body.availability !== false,
      status: body.status || "active",
    });

    await newListing.save();

    return res.status(201).json({
      status: true,
      message: "Listing created successfully.",
      listing: newListing,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    return res.status(400).json({
      status: false,
      message: error.message || "Failed to create listing.",
    });
  }
});

/**
 * GET /provider/listings
 * Fetch all listings belonging to the authenticated provider
 */
providerRouter.get("/listings", async (req, res) => {
  try {
    const filter = { providerId: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const listings = await ProductModel.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Fetch provider listings error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to retrieve listings.",
    });
  }
});

/**
 * GET /provider/listings/:id
 * Fetch a single listing by ID with ownership verification
 */
providerRouter.get("/listings/:id", async (req, res) => {
  try {
    const listing = await ProductModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ status: false, message: "Listing not found." });
    }

    const isOwner = req.user.role === "admin" || String(listing.providerId) === String(req.user._id);
    if (!isOwner) {
      return res.status(403).json({
        status: false,
        message: "Access denied. You do not own this listing.",
      });
    }

    return res.status(200).json({
      status: true,
      listing,
    });
  } catch (error) {
    console.error("Get listing error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to retrieve listing.",
    });
  }
});

/**
 * PUT /provider/listings/:id
 * Update listing details with ownership verification
 */
providerRouter.put("/listings/:id", async (req, res) => {
  try {
    const listing = await ProductModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ status: false, message: "Listing not found." });
    }

    const isOwner = req.user.role === "admin" || String(listing.providerId) === String(req.user._id);
    if (!isOwner) {
      return res.status(403).json({
        status: false,
        message: "Access denied. You do not have permission to modify this listing.",
      });
    }

    const updatableFields = [
      "title",
      "name",
      "description",
      "category",
      "gender",
      "size",
      "brand",
      "condition",
      "rentalPricePerDay",
      "price",
      "securityDeposit",
      "advance",
      "images",
      "image",
      "tags",
      "occasion",
      "color",
      "pattern",
      "style",
      "season",
      "location",
      "externalUrl",
      "availability",
      "status",
      "stock",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    await listing.save();

    return res.status(200).json({
      status: true,
      message: "Listing updated successfully.",
      listing,
    });
  } catch (error) {
    console.error("Update listing error:", error);
    return res.status(400).json({
      status: false,
      message: error.message || "Failed to update listing.",
    });
  }
});

/**
 * DELETE /provider/listings/:id
 * Delete a listing with ownership verification
 */
providerRouter.delete("/listings/:id", async (req, res) => {
  try {
    const listing = await ProductModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ status: false, message: "Listing not found." });
    }

    const isOwner = req.user.role === "admin" || String(listing.providerId) === String(req.user._id);
    if (!isOwner) {
      return res.status(403).json({
        status: false,
        message: "Access denied. You do not have permission to delete this listing.",
      });
    }

    await ProductModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      status: true,
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    console.error("Delete listing error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to delete listing.",
    });
  }
});

/**
 * GET /provider/stats
 * Aggregate dashboard metrics for the authenticated provider
 */
providerRouter.get("/stats", async (req, res) => {
  try {
    const providerId = req.user._id;

    const listings = await ProductModel.find({ providerId });
    const listingIds = listings.map((l) => l._id);

    const totalListings = listings.length;
    const activeListings = listings.filter((l) => l.status === "active").length;

    // Query orders placed for provider's dresses
    const orders = await OrderModel.find({ product: { $in: listingIds } });
    const totalOrders = orders.length;

    const totalEarnings = orders.reduce((sum, order) => {
      return sum + (Number(order.totalAmount) || 0);
    }, 0);

    const recentListings = listings.slice(0, 5);

    return res.status(200).json({
      status: true,
      stats: {
        totalListings,
        activeListings,
        totalOrders,
        totalEarnings,
        recentListings,
      },
    });
  } catch (error) {
    console.error("Provider stats error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to calculate provider statistics.",
    });
  }
});

/**
 * GET /provider/orders
 * Step 8 & 9: List all customer rental requests for provider's dresses
 */
providerRouter.get("/orders", async (req, res) => {
  try {
    const providerId = req.user._id;
    const providerListings = await ProductModel.find({ providerId }).select("_id");
    const listingIds = providerListings.map((l) => l._id);

    const orders = await OrderModel.find({
      $or: [{ providerId: providerId }, { product: { $in: listingIds } }],
    })
      .populate("product")
      .sort({ orderDate: -1 });

    return res.status(200).json({
      status: true,
      total: orders.length,
      orders: orders,
    });
  } catch (error) {
    console.error("Provider orders error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to retrieve provider rental orders.",
    });
  }
});

/**
 * PUT /provider/orders/:id/status
 * Step 9 & 10: Provider accepts, declines, or updates customer rental request
 */
providerRouter.put("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, requestStatus } = req.body;
    const providerId = req.user._id;

    const order = await OrderModel.findById(id).populate("product");
    if (!order) {
      return res.status(404).json({ status: false, message: "Rental order not found." });
    }

    // Verify ownership
    const isOwner =
      String(order.providerId) === String(providerId) ||
      (order.product && String(order.product.providerId) === String(providerId));

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Forbidden: You do not own the dress for this rental order.",
      });
    }

    const newStatus = requestStatus || status;
    if (newStatus) {
      order.requestStatus = newStatus;
      if (newStatus === "Accepted") order.status = "Confirmed";
      if (newStatus === "Declined") order.status = "Cancelled";
      if (newStatus === "Active") order.status = "Delivered";
      if (newStatus === "Completed") order.status = "Completed";
    }

    await order.save();

    // If order was declined or cancelled, release booked date range from product
    if (newStatus === "Declined" || newStatus === "Cancelled") {
      await ProductModel.findByIdAndUpdate(order.product._id, {
        $pull: { bookedDates: { orderId: order._id } },
      });
    }

    return res.status(200).json({
      status: true,
      message: `Rental request updated to ${newStatus}`,
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to update rental order status.",
    });
  }
});

/**
 * POST /provider/ai/generate-description
 * Step 7: AI fashion copywriter for dress listings with smart fallback
 */
providerRouter.post("/ai/generate-description", async (req, res) => {
  const { productName, category, price, brand } = req.body;
  const cleanName = (productName || "Luxury Dress").trim();
  const cleanCategory = (category || "Occasion Wear").trim();
  const numPrice = Number(price) || 2500;

  // 1. Try FastAPI Microservice if accessible
  const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8001";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${fastApiUrl}/ai/generate-description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: cleanName,
        category: cleanCategory,
        price: numPrice,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        status: true,
        source: "fastapi_groq",
        data: data,
      });
    }
  } catch (aiErr) {
    // FastAPI unavailable or timed out; continue to intelligent fallback
  }

  // 2. High-converting editorial fashion heuristic fallback
  const brandPrefix = brand && brand.trim() ? `${brand.trim()} ` : "";
  const title = `${brandPrefix}${cleanName} - Premium ${cleanCategory} Collection`;

  const occasionMap = {
    wedding: "Bridal Receptions, Sangeet & Traditional Weddings",
    bridal: "Bridal Receptions, Sangeet & Traditional Weddings",
    party: "Cocktail Galas, Black-Tie Soirées & Red Carpet Events",
    cocktail: "Cocktail Galas, Black-Tie Soirées & Red Carpet Events",
    formal: "Black-Tie Galas, Award Banquets & Formal Evenings",
    traditional: "Royal Festive Celebrations, Diwali & Traditional Pujas",
    casual: "Weekend Brunches, Sunset Dinners & Garden Parties",
  };

  const lowerCat = cleanCategory.toLowerCase();
  const matchedOccasion =
    Object.entries(occasionMap).find(([key]) => lowerCat.includes(key))?.[1] ||
    "Special Celebrations & High-Fashion Events";

  const description =
    `Turn heads in this exquisite ${cleanName}. Masterfully designed for ${matchedOccasion.toLowerCase()}, ` +
    `this piece balances couture aesthetics with flattering comfort. Tailored with premium luxury fabric, ` +
    `intricate finishing, and unforgettable movement, it ensures you make a breathtaking entrance without the commitment of ownership.`;

  const defaultTags = [
    cleanCategory,
    "Designer Rental",
    "Luxury Fashion",
    "Wardrobe Wonders",
    "Couture",
    "Boutique Collection",
  ];

  return res.status(200).json({
    status: true,
    source: "editorial_fashion_ai",
    data: {
      title,
      description,
      tags: defaultTags,
      occasion: matchedOccasion,
    },
  });
});

/**
 * POST /provider/ai/generate-tags
 * Step 7: AI garment attribute extractor with smart fallback
 */
providerRouter.post("/ai/generate-tags", async (req, res) => {
  const { productName, category, description } = req.body;
  const text = `${productName || ""} ${category || ""} ${description || ""}`.toLowerCase();

  // 1. Try FastAPI
  const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8001";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${fastApiUrl}/ai/generate-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: productName || "Dress",
        category: category || "Fashion",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        status: true,
        source: "fastapi_groq",
        data: data,
      });
    }
  } catch (aiErr) {
    // FastAPI unavailable or timed out; continue to intelligent fallback
  }

  // 2. Intelligent attribute detection fallback
  const colorMap = [
    ["gold", "Imperial Gold"],
    ["red", "Crimson Red"],
    ["maroon", "Royal Maroon"],
    ["emerald", "Emerald Green"],
    ["green", "Forest Green"],
    ["blue", "Sapphire Blue"],
    ["navy", "Midnight Navy"],
    ["black", "Obsidian Black"],
    ["white", "Pearl White"],
    ["ivory", "Ivory Cream"],
    ["pink", "Blush Pink"],
    ["rose", "Rose Gold"],
    ["silver", "Metallic Silver"],
    ["yellow", "Mustard Yellow"],
    ["purple", "Royal Purple"],
  ];
  const detectedColor = colorMap.find(([k]) => text.includes(k))?.[1] || "Artisanal Jewel Tone";

  const patternMap = [
    ["sequin", "Hand-embroidered Sequins"],
    ["zari", "Intricate Zari & Zardozi"],
    ["floral", "Bespoke Floral Motif"],
    ["embroider", "Artisanal Hand Embroidery"],
    ["print", "Designer Printed Silk"],
    ["velvet", "Rich Velvet Texture"],
    ["lace", "French Chantilly Lace"],
    ["solid", "Minimalist Solid Silk"],
  ];
  const detectedPattern = patternMap.find(([k]) => text.includes(k))?.[1] || "Artisanal Embroidery";

  const styleMap = [
    ["lehenga", "Royal Indo-Western Bridal"],
    ["saree", "Contemporary Draped Saree"],
    ["gown", "Red Carpet Evening Silhouette"],
    ["anarkali", "Flared Heritage Anarkali"],
    ["suit", "Tailored Luxury Power Dressing"],
    ["kurti", "Sophisticated Festive Ensemble"],
    ["western", "Modern Haute Couture"],
  ];
  const detectedStyle = styleMap.find(([k]) => text.includes(k))?.[1] || "Contemporary Couture";

  const seasonMap = [
    ["summer", "Summer Soirée"],
    ["winter", "Winter Velvet & Regal Evenings"],
    ["spring", "Spring Bloom"],
    ["autumn", "Festive Autumn"],
  ];
  const detectedSeason = seasonMap.find(([k]) => text.includes(k))?.[1] || "All-Season Luxury";

  return res.status(200).json({
    status: true,
    source: "fashion_attributes_ai",
    data: {
      color: detectedColor,
      pattern: detectedPattern,
      style: detectedStyle,
      season: detectedSeason,
    },
  });
});

export default providerRouter;
