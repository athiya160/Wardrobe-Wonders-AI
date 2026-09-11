import { Router } from "express";
import productModel from "../models/productModel.js";
import mongoose from "mongoose";
const productRouter = new Router();

productRouter.get("/gender/:gender", async (req, res) => {
  const { gender } = req.params;
  const products = await productModel.find({ gender: gender });
  res.send(products);
});

productRouter.get("/category/:category", async (req, res) => {
  const { category } = req.params;
  const products = await productModel.find({ category: category });
  res.send(products);
});
productRouter.get("/", async (_, res) => {
  const products = await productModel.find();
  res.send(products);
});
productRouter.post("/create", async (req, res) => {
  const { body } = req;
  if (!body) res.send("body required");
  console.log("product body", body);
  const product = new productModel(body);
  await product.save();
  res.send(product);
});
productRouter.post("/delete", async (req, res) => {
  const { body } = req;
  if (!body) res.send("body required");
  console.log("product body", body);
  const product = await productModel.findByIdAndDelete(body._id);
  res.send(product);
});

productRouter.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).send("query is required");
  }
  
  try {
    const fastApiUrl = process.env.FASTAPI_URL || "http://127.0.0.1:8001";
    const response = await fetch(`${fastApiUrl}/ai/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    res.send(data);
  } catch (err) {
    console.error("Error communicating with AI service:", err);
    res.status(500).send("AI Search Failed");
  }
});

productRouter.post("/recommend-outfit", async (req, res) => {
  try {
    const { budget, gender, occasion, color, season, style } = req.body;
    let query = {};
    if (gender) query.gender = gender;
    if (occasion) query.category = occasion;
    if (budget) query.price = { $lte: Number(budget) };
    
    // Find some matching products
    const products = await productModel.find(query).limit(5);
    
    // Fallback if no exact match
    const finalProducts = products.length > 0 ? products : await productModel.find().limit(5);
    
    // Format to match the Stylist.jsx expectation
    const formattedOutfit = finalProducts.map(p => ({
      product: p,
      reason: `This ${p.name} perfectly matches your ${style || "preferred"} style for a ${occasion || "event"}.`
    }));
    
    res.json({ outfit: formattedOutfit });
  } catch (err) {
    console.error("Error with mock AI Stylist:", err);
    res.status(500).send("AI Stylist Failed");
  }
});

productRouter.post("/personalized-home", async (req, res) => {
  try {
    // Fetch products and categorize them for the homepage
    const women = await productModel.find({ gender: "women" }).limit(4);
    const men = await productModel.find({ gender: "men" }).limit(4);
    const recommended = [...women, ...men];
    
    const trending = await productModel.find().sort({ price: -1 }).limit(6);
    const ai_picks = await productModel.find().limit(5).then(docs => docs.map(d => ({ product: d })));
    
    res.json({ recommended, trending, ai_picks });
  } catch (err) {
    console.error("Error communicating with mock AI service:", err);
    res.status(500).send("AI Personalized Home Failed");
  }
});

productRouter.get("/detail/:id", async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    res.send(product);
  } catch (err) {
    console.error("Error fetching product details:", err);
    res.status(500).send("Server Error");
  }
});

productRouter.post("/:id/review", async (req, res) => {
  try {
    const { rating, comment, username } = req.body;
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    
    product.reviews.push({ rating, comment, username });
    await product.save();
    res.send(product);
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).send("Server Error");
  }
});

productRouter.post("/similar", async (req, res) => {
  try {
    const { productId } = req.body;
    const currentProduct = await productModel.findById(productId);
    if (!currentProduct) return res.json([]);
    
    const similar = await productModel.find({
      _id: { $ne: productId },
      category: currentProduct.category,
      gender: currentProduct.gender
    }).limit(4);
    
    res.json(similar);
  } catch (err) {
    console.error("Error fetching mock similar products:", err);
    res.status(500).send("Similar Products Failed");
  }
});

productRouter.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const msgLower = message.toLowerCase();
    let query = {};
    
    if (msgLower.includes("wedding") || msgLower.includes("bridal") || msgLower.includes("groom")) {
      query = { category: "Wedding" };
    } else if (msgLower.includes("party")) {
      query = { category: "Party" };
    } else if (msgLower.includes("under 3000")) {
      query = { price: { $lt: 3000 } };
    } else if (msgLower.includes("men")) {
      query = { gender: "men" };
    } else if (msgLower.includes("women")) {
      query = { gender: "women" };
    }

    const products = await productModel.find(query).limit(3);
    
    res.json({
      text: `I found some great options for you based on "${message}". Take a look at these!`,
      products: products
    });
  } catch (err) {
    console.error("Error communicating with AI chat service:", err);
    res.status(500).send("AI Chat Failed");
  }
});

/**
 * GET /products/:id/availability
 * Step 8: Return booked date intervals for rental calendar
 */
productRouter.get("/:id/availability", async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id).select("bookedDates availability stock");
    if (!product) {
      return res.status(404).json({ status: false, message: "Dress not found." });
    }

    // Filter out past bookings to keep response lightweight
    const now = new Date();
    const activeBookings = (product.bookedDates || []).filter(
      (b) => new Date(b.endDate) >= now
    );

    return res.status(200).json({
      status: true,
      available: product.availability !== false,
      stock: product.stock,
      bookedDates: activeBookings.map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
      })),
    });
  } catch (err) {
    console.error("Error fetching availability:", err);
    res.status(500).json({ status: false, message: "Error fetching availability." });
  }
});

/**
 * POST /products/:id/check-availability
 * Step 8: Validate requested rental dates against existing reservations
 */
productRouter.post("/:id/check-availability", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ status: false, message: "Start date and end date are required." });
    }

    const reqStart = new Date(startDate);
    const reqEnd = new Date(endDate);

    if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime()) || reqEnd < reqStart) {
      return res.status(400).json({ status: false, message: "Invalid date range provided." });
    }

    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: false, message: "Dress not found." });
    }

    if (product.availability === false) {
      return res.status(200).json({
        status: true,
        available: false,
        reason: "Dress is currently paused by the provider.",
      });
    }

    // Check for overlap: s1 <= e2 && s2 <= e1
    const conflict = (product.bookedDates || []).find((booking) => {
      const bStart = new Date(booking.startDate);
      const bEnd = new Date(booking.endDate);
      return reqStart <= bEnd && bStart <= reqEnd;
    });

    if (conflict) {
      return res.status(200).json({
        status: true,
        available: false,
        reason: "Requested dates conflict with an existing confirmed rental reservation.",
        conflict: {
          startDate: conflict.startDate,
          endDate: conflict.endDate,
        },
      });
    }

    // Calculate rental duration in days
    const diffTime = Math.abs(reqEnd - reqStart);
    const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    const pricePerDay = Number(product.rentalPricePerDay || product.price) || 0;
    const estimatedRentalFee = pricePerDay * days;
    const securityDeposit = product.securityDeposit || product.advance || 0;

    return res.status(200).json({
      status: true,
      available: true,
      days,
      pricePerDay,
      estimatedRentalFee,
      securityDeposit,
      totalEstimated: estimatedRentalFee + (Number(securityDeposit) || 0),
    });
  } catch (err) {
    console.error("Error checking date availability:", err);
    res.status(500).json({ status: false, message: "Error checking date availability." });
  }
});

export default productRouter;
