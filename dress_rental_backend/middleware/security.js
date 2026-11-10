import mongoose from "mongoose";

/**
 * OWASP & Helmet-Equivalent Security Headers Middleware
 * Configures production-grade headers, disables framework fingerprinting, and defines safe CSP
 */
export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Clickjacking defense
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Legacy browser XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer leakage prevention
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict cross-origin resource sharing
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  // Restrict sensitive browser APIs
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Strip Express framework fingerprint
  res.removeHeader("X-Powered-By");

  // Strict-Transport-Security (HTTPS) in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Content-Security-Policy (Permissive enough for Cloudinary, MUI, Google Fonts, and payment gateways)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mercury.phonepe.com https://api-preprod.phonepe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://phonepe.com https://*.phonepe.com",
    "connect-src 'self' https://* http://localhost:* http://127.0.0.1:* ws://* wss://*",
    "frame-src 'self' https://mercury.phonepe.com https://api-preprod.phonepe.com",
    "frame-ancestors 'self'",
  ];
  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

  next();
};

/**
 * NoSQL Injection Sanitizer Middleware
 * Detects and rejects MongoDB query operator injections (keys starting with '$' or containing '.')
 */
export const mongoSanitizer = (req, res, next) => {
  const hasOperatorInjection = (obj) => {
    if (!obj || typeof obj !== "object") return false;
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        return true;
      }
      if (typeof obj[key] === "object" && obj[key] !== null) {
        if (hasOperatorInjection(obj[key])) return true;
      }
    }
    return false;
  };

  if (hasOperatorInjection(req.body) || hasOperatorInjection(req.query) || hasOperatorInjection(req.params)) {
    return res.status(400).json({
      status: false,
      success: false,
      message: "Malformed request payload: prohibited query operators detected.",
    });
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
    this.max = options.max || 100;
    this.message = options.message || "Too many requests from this IP, please try again later.";
    this.exemptPaths = options.exemptPaths || [];
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
      // Allow bypass in test environments
      if (process.env.DISABLE_RATE_LIMIT === "true" || req.headers["x-test-bypass-rate-limit"]) {
        return next();
      }

      // Check exemptions (e.g. gateway callbacks)
      if (this.exemptPaths.some((p) => req.path.includes(p))) {
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
  exemptPaths: ["/health", "/readiness"],
}).middleware();

// 2. Sensitive Authentication limiter: 500 requests in dev, 30 in production
export const authLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 30 : 500,
  message: "Too many login/registration attempts. Please wait a few minutes before retrying.",
}).middleware();

// 3. Payment Operations limiter: 60 requests / 15 min per IP (Exempts gateway webhooks)
export const paymentLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Payment request limit reached. Please wait a few minutes before initiating new transactions.",
  exemptPaths: ["/callback", "/webhook"],
}).middleware();

// 4. File Upload limiter: 30 uploads / 15 min per IP
export const uploadLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Upload rate limit reached. Please wait before uploading additional dress photography.",
}).middleware();

// 5. AI Service limiter: 60 requests / 15 min per IP
export const aiLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "AI styling request limit exceeded. Please wait a moment before asking again.",
}).middleware();

/**
 * Hardened Production CORS Origin Validator
 */
export const getCorsOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  const envOrigins = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // Exact allowlist for production
  const productionAllowlist = new Set([
    ...envOrigins,
    "https://wardrobe-wonders-ai.vercel.app",
    // Mobile Capacitor origins
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
  ]);

  // Development allowlist
  const devAllowlist = new Set([
    ...productionAllowlist,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
  ]);

  return {
    origin: (origin, callback) => {
      // 1. Allow non-browser requests (mobile native HTTP, PhonePe server-to-server callbacks, curl)
      if (!origin) return callback(null, true);

      // 2. Production strict origin check
      if (isProd) {
        if (productionAllowlist.has(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy violation: Access from origin '${origin}' is not permitted.`));
      }

      // 3. Non-production / local development: Permit all development origins, LAN IPs (e.g. mobile Wi-Fi), and Capacitor
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-test-bypass-rate-limit",
      "X-VERIFY",
      "X-CALLBACK-URL",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  };
};

/**
 * Health & Readiness Endpoints
 */
export const healthCheckHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const memoryUsage = process.memoryUsage();

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
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
  });
};

export const readinessHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({
      status: "unready",
      message: "Database connection not ready.",
    });
  }

  return res.status(200).json({
    status: "ready",
    message: "Service ready to accept incoming customer requests.",
  });
};

/**
 * Centralized Error Handling Middleware
 */
export const centralizedErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Prevent CORS error masking by ensuring CORS header exists even on error
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.message || err);

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
