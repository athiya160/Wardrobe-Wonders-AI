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

export default providerRouter;
