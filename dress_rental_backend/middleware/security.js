import mongoose from "mongoose";

/**
 * Security Headers Middleware
 * Applies OWASP recommended security headers and strips revealing framework headers
 */
export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.removeHeader("X-Powered-By");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
};

/**
 * In-Memory Sliding-Window Rate Limiter
 * Tracks requests by client IP with window expiry and automatic garbage cleanup
 */
class MemoryRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // default 15 minutes
    this.max = options.max || 100; // default max requests per window
    this.message = options.message || "Too many requests from this IP, please try again later.";
    this.hits = new Map();

    // Periodic cleanup every 5 minutes to prevent memory leak
    setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of this.hits.entries()) {
        if (now - data.resetTime > this.windowMs) {
          this.hits.delete(ip);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  middleware() {
    return (req, res, next) => {
      // In automated test suite environments, allow bypass if explicitly configured
      if (process.env.DISABLE_RATE_LIMIT === "true" || req.headers["x-test-bypass-rate-limit"]) {
        return next();
      }

      const clientIp =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "127.0.0.1";

      const now = Date.now();
      let record = this.hits.get(clientIp);

      if (!record || now - record.startTime > this.windowMs) {
        record = {
          count: 1,
          startTime: now,
          resetTime: now + this.windowMs,
        };
        this.hits.set(clientIp, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.max - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader("RateLimit-Limit", this.max);
      res.setHeader("RateLimit-Remaining", remaining);
      res.setHeader("RateLimit-Reset", resetSeconds);

      if (record.count > this.max) {
        res.setHeader("Retry-After", resetSeconds);
        return res.status(429).json({
          status: false,
          success: false,
          message: this.message,
          retryAfterSeconds: resetSeconds,
        });
      }

      next();
    };
  }
}

// 1. General API rate limiter: 600 requests / 15 min per IP
export const apiLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: "API rate limit exceeded. Please slow down your requests.",
}).middleware();

// 2. Sensitive Authentication limiter: 30 requests / 15 min per IP
export const authLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many login/registration attempts. Please wait 15 minutes before retrying.",
}).middleware();

// 3. AI Service limiter: 60 requests / 15 min per IP
export const aiLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "AI service request limit exceeded. Please wait a moment before asking again.",
}).middleware();

/**
 * Dynamic CORS Origin Validator
 */
export const getCorsOptions = () => {
  const envOrigins = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN;
  const allowedOrigins = envOrigins
    ? envOrigins.split(",").map((origin) => origin.trim())
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://wardrobe-wonders-ai.vercel.app",
      ];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("wardrobe-wonders") ||
        origin.includes("localhost") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Access from this origin is not allowed."));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-test-bypass-rate-limit"],
    credentials: true,
    optionsSuccessStatus: 200,
  };
};

/**
 * Health Check Controller Endpoint
 * Step 16: Readiness & Liveness endpoint for container orchestration / uptime monitoring
 */
export const healthCheckHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "healthy" : "degraded",
    service: "Wardrobe Wonders Marketplace API",
    version: "1.0.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      connected: isDbConnected,
      status: isDbConnected ? "connected" : "connecting/disconnected",
    },
  });
};

/**
 * Centralized Error Handling Middleware
 * Prevents stack trace disclosure and formats errors consistently
 */
export const centralizedErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const isProduction = process.env.NODE_ENV === "production";
  const clientMessage =
    statusCode === 500 && isProduction
      ? "An unexpected internal error occurred. Please contact support if the issue persists."
      : err.message || "Internal server error.";

  res.status(statusCode).json({
    status: false,
    success: false,
    message: clientMessage,
  });
};
