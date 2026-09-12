import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import productRouter from "./routes/product.router.js";
import UserRouter from "./routes/user.router.js";
import { PaymentRouter } from "./routes/payment.js";
import providerRouter from "./routes/provider.router.js";
import uploadRouter from "./routes/upload.router.js";
import adminRouter from "./routes/admin.router.js";

import {
  securityHeaders,
  apiLimiter,
  authLimiter,
  getCorsOptions,
  healthCheckHandler,
  centralizedErrorHandler,
} from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();

// Step 15 & 16: Security Hardening & CORS
app.use(securityHeaders);
app.use(cors(getCorsOptions()));
app.use(bodyParser.json());
app.use(apiLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Step 16: Production Health Check Endpoint
app.get("/health", healthCheckHandler);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Step 15: Auth Brute-Force Rate Limiting
app.use("/login", authLimiter);
app.use("/register", authLimiter);

app.use("/upload", uploadRouter);
app.use("/provider/upload", (req, res, next) => {
  req.url = "/provider";
  uploadRouter(req, res, next);
});
app.use("/payment", PaymentRouter);
app.use("/products", productRouter);
app.use("/provider", providerRouter);
app.use("/admin", adminRouter);
app.use(UserRouter);

// Centralized Error Handling Middleware
app.use(centralizedErrorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  await mongoose
    .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental")
    .then(() => {
      console.log(`DB connected. Server running on port ${PORT}`);
    })
    .catch((err) => {
      console.log("DB connection error:", err);
    });
});
