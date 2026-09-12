import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import {
  securityHeaders,
  apiLimiter,
  authLimiter,
  getCorsOptions,
  healthCheckHandler,
  centralizedErrorHandler,
} from "./middleware/security.js";

dotenv.config();

const PORT = 4035;
const BASE_URL = `http://localhost:${PORT}`;

let server;
let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failCount++;
  }
}

async function startTestServer() {
  const app = express();

  // Apply security middleware stack
  app.use(securityHeaders);
  app.use(cors(getCorsOptions()));
  app.use(bodyParser.json());

  // Mount test endpoints
  app.get("/health", healthCheckHandler);

  // Test route protected by auth rate limiter (windowMs: 5000, max: 3)
  const testLimiterApp = express();
  app.use("/test-auth-limited", authLimiter, (req, res) => {
    res.json({ success: true, message: "Auth endpoint accessed." });
  });

  // Test error trigger route
  app.get("/test-error", (req, res, next) => {
    const error = new Error("Simulated database timeout failure");
    error.status = 500;
    next(error);
  });

  // Centralized error handler
  app.use(centralizedErrorHandler);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Security Hardening Test Server running on port ${PORT}.`);
      resolve();
    });
  });
}

async function runSecuritySuite() {
  console.log("\n=======================================================");
  console.log("   DRESSR STEP 15 & 16: SECURITY HARDENING & HEALTH   ");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startTestServer();

  try {
    console.log("--- Section A: Security Headers Verification ---");

    const resHeaders = await fetch(`${BASE_URL}/health`);
    assert(resHeaders.headers.get("x-content-type-options") === "nosniff", "Header X-Content-Type-Options is 'nosniff'");
    assert(resHeaders.headers.get("x-frame-options") === "SAMEORIGIN", "Header X-Frame-Options is 'SAMEORIGIN'");
    assert(resHeaders.headers.get("x-xss-protection") === "1; mode=block", "Header X-XSS-Protection is '1; mode=block'");
    assert(resHeaders.headers.get("referrer-policy") === "strict-origin-when-cross-origin", "Header Referrer-Policy is 'strict-origin-when-cross-origin'");
    assert(resHeaders.headers.get("cross-origin-resource-policy") === "cross-origin", "Header Cross-Origin-Resource-Policy is 'cross-origin'");
    assert(!resHeaders.headers.get("x-powered-by"), "X-Powered-By header is successfully suppressed");

    console.log("\n--- Section B: Production Health Check Endpoint (`GET /health`) ---");

    const healthData = await resHeaders.json();
    assert(resHeaders.status === 200, "Health endpoint returns HTTP 200");
    assert(healthData.status === "healthy", "Health report reports status: 'healthy'");
    assert(healthData.service.includes("Wardrobe Wonders"), "Health report identifies Wardrobe Wonders service");
    assert(typeof healthData.uptimeSeconds === "number", "Health report includes numeric uptimeSeconds");
    assert(healthData.database?.connected === true, "Health report confirms database connection");

    console.log("\n--- Section C: Centralized Error Handling & Secret Leak Prevention ---");

    const resError = await fetch(`${BASE_URL}/test-error`);
    const errorData = await resError.json();
    assert(resError.status === 500, "Simulated unhandled error triggers HTTP 500");
    assert(errorData.success === false, "Error response returns success: false");
    assert(typeof errorData.message === "string", "Error response returns sanitized message string");
    assert(!errorData.stack, "Stack trace is not exposed in client JSON response");

    console.log("\n--- Section D: Rate Limiting & Brute-Force Throttling ---");

    // Send requests up to limit and beyond
    let rateLimitExceeded = false;
    let limitHeaderFound = false;
    let retryAfterHeader = null;

    for (let i = 0; i < 35; i++) {
      const resRate = await fetch(`${BASE_URL}/test-auth-limited`);
      if (resRate.headers.get("ratelimit-limit")) {
        limitHeaderFound = true;
      }
      if (resRate.status === 429) {
        rateLimitExceeded = true;
        retryAfterHeader = resRate.headers.get("retry-after");
        const rateData = await resRate.json();
        assert(rateData.status === false, "429 response body includes status: false");
        assert(rateData.message.includes("wait 15 minutes before retrying"), "429 response body contains clear lockout notice");
        break;
      }
    }

    assert(limitHeaderFound, "Rate limit headers (RateLimit-Limit) are included in responses");
    assert(rateLimitExceeded, "Exceeding auth request threshold triggers HTTP 429 Too Many Requests");
    assert(!!retryAfterHeader, "HTTP 429 response includes standard Retry-After header");

    console.log("\n=======================================================");
    console.log(`   TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("=======================================================\n");

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failCount++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(failCount > 0 ? 1 : 0);
  }
}

runSecuritySuite();
