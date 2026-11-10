import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { validateEnvironment } from "./config/envValidator.js";
import productRouter from "./routes/product.router.js";
import UserRouter from "./routes/user.router.js";
import { PaymentRouter } from "./routes/payment.js";
import providerRouter from "./routes/provider.router.js";
import uploadRouter from "./routes/upload.router.js";
import adminRouter from "./routes/admin.router.js";
import storeRouter from "./routes/store.router.js";
import adminStoreRouter from "./routes/adminStore.router.js";

import {
  securityHeaders,
  mongoSanitizer,
  apiLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  getCorsOptions,
  healthCheckHandler,
  readinessHandler,
  centralizedErrorHandler,
} from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Step 2: Validate production invariants and secrets before proceeding
try {
  validateEnvironment();
} catch (envErr) {
  console.error(envErr.message);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const app = express();

// Trust reverse proxy headers (Cloud Run, Render, Railway, Nginx, Vercel)
app.set("trust proxy", 1);

// Step 3: OWASP & Helmet-Equivalent Security Headers & CORS
app.use(securityHeaders);
app.use(cors(getCorsOptions()));

// Step 6: Body Parser with strict payload limits (1MB max to mitigate DoS)
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));

// Step 6: NoSQL Injection Defense (rejects '$' and '.' key injections)
app.use(mongoSanitizer);

// Step 4: General API Rate Limiting
app.use(apiLimiter);

// Secure static delivery of local uploaded garment photography
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
    },
  })
);

// Step 7: Liveness & Readiness Probes
app.get("/health", healthCheckHandler);
app.get("/health/ready", readinessHandler);
app.get("/readiness", readinessHandler);

app.get("/", (req, res) => {
  res.send("Wardrobe Wonders API Service Running");
});

// Step 4: Endpoint-Specific Rate Limiters
app.use("/login", authLimiter);
app.use("/register", authLimiter);
app.use("/user/login", authLimiter);
app.use("/user/register", authLimiter);

app.use("/upload", uploadLimiter, uploadRouter);
app.use("/provider/upload", uploadLimiter, (req, res, next) => {
  req.url = "/provider";
  uploadRouter(req, res, next);
});

app.use("/payment", paymentLimiter, PaymentRouter);
app.use("/products", productRouter);
app.use("/provider", providerRouter);
app.use("/admin", adminRouter);
app.use("/admin/store", adminStoreRouter);
app.use("/store", storeRouter);
app.use("/user", UserRouter);
app.use(UserRouter);

// Centralized Error Handling Middleware
app.use(centralizedErrorHandler);

const PORT = process.env.PORT || 4000;
let serverInstance = null;

// Graceful connection and startup
const startServer = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/dress_rental";

  try {
    await mongoose.connect(mongoUri);
    console.log(`Database connected successfully. Initializing HTTP server on port ${PORT}...`);
    serverInstance = app.listen(PORT, () => {
      console.log(`Wardrobe Wonders API server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failure on startup:", err.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      // In development, still listen so health check can report degraded state
      serverInstance = app.listen(PORT, () => {
        console.warn(`Server started in degraded mode (DB disconnected) on port ${PORT}`);
      });
    }
  }
};

// Graceful shutdown handling (SIGTERM, SIGINT)
const gracefulShutdown = async (signal) => {
  console.log(`[Lifecycle] Received ${signal}. Gracefully closing connections...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      try {
        await mongoose.disconnect();
        console.log("[Lifecycle] Database disconnected. Process exiting cleanly.");
      } catch (err) {
        console.error("[Lifecycle] Error during disconnect:", err);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
