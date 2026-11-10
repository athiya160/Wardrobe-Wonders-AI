import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import { validateEnvironment, getJwtSecret } from "./config/envValidator.js";
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

import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import OrderModel from "./models/OrderModel.js";
import UserRouter from "./routes/user.router.js";
import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import { PaymentRouter } from "./routes/payment.js";
import adminRouter from "./routes/admin.router.js";
import uploadRouter from "./routes/upload.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4097;
const MONGO_PORT = process.env.MONGO_PORT || 27017;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;
let mongodProcess;
let passCount = 0;
let failCount = 0;
const testRecords = [];

function recordTest(num, name, passed, meta = {}) {
  if (passed) {
    console.log(`  [PASS] Scenario ${num}: ${name}`);
    passCount++;
  } else {
    console.error(`  [FAIL] Scenario ${num}: ${name}`);
    if (meta.error) console.error("    Error detail:", meta.error);
    failCount++;
  }
  testRecords.push({ num, name, passed, meta });
}

async function startLocalMongod() {
  const dbDir = path.join(__dirname, "test_temp_db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  } else {
    const lockFile = path.join(dbDir, "mongod.lock");
    if (fs.existsSync(lockFile)) {
      try { fs.unlinkSync(lockFile); } catch (e) { /* ignore */ }
    }
  }

  const mongodPath = "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe";
  console.log(`Starting isolated test mongod on port ${MONGO_PORT}...`);

  return new Promise((resolve, reject) => {
    mongodProcess = spawn(
      mongodPath,
      ["--port", String(MONGO_PORT), "--dbpath", dbDir, "--bind_ip", "127.0.0.1", "--noauth"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let started = false;
    mongodProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("Waiting for connections") || msg.includes("Listening on")) {
        if (!started) {
          started = true;
          console.log("Local test MongoDB started successfully.");
          resolve();
        }
      }
    });

    mongodProcess.on("error", (err) => {
      if (!started) reject(err);
    });

    setTimeout(() => {
      if (!started) {
        resolve();
      }
    }, 5000);
  });
}

function stopLocalMongod() {
  if (mongodProcess) {
    console.log("Stopping test mongod...");
    try {
      mongodProcess.kill("SIGINT");
    } catch (e) {
      // ignore
    }
  }
}

async function createSecurityTestApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(securityHeaders);
  app.use(cors(getCorsOptions()));
  app.use(bodyParser.json({ limit: "1mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));
  app.use(mongoSanitizer);

  app.use(apiLimiter);

  app.get("/health", healthCheckHandler);
  app.get("/readiness", readinessHandler);

  app.use("/upload", uploadLimiter, uploadRouter);
  app.use("/payment", paymentLimiter, PaymentRouter);
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
  app.use("/admin", adminRouter);
  app.use("/user", UserRouter);
  app.use(UserRouter);

  app.use(centralizedErrorHandler);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`Security Test server running on port ${PORT}.`);
      resolve();
    });
  });
}

async function runSecuritySuite() {
  console.log("\n=========================================================================");
  console.log("   WARDROBE WONDERS — PHASE 5A: PRODUCTION SECURITY & HARDENING SUITE    ");
  console.log("=========================================================================\n");

  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "phase5a_super_secure_jwt_secret_key_minimum_32_characters_long_2026";
  process.env.FRONTEND_URL = "https://wardrobe-wonders-ai.vercel.app";

  // ---------------------------------------------------------------------------
  // 1. Environment & Production Invariant Unit Tests
  // ---------------------------------------------------------------------------
  console.log("--- Testing Environment & Secrets Validation Invariants ---");

  // 1a. Production refuses missing JWT_SECRET
  let missingSecretBlocked = false;
  try {
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    delete process.env.SECRET;
    validateEnvironment();
    process.env.NODE_ENV = prevEnv;
    process.env.JWT_SECRET = prevSecret;
  } catch (err) {
    missingSecretBlocked = err.message.includes("Missing JWT_SECRET");
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "phase5a_super_secure_jwt_secret_key_minimum_32_characters_long_2026";
  }
  recordTest(1, "Production startup strictly rejects missing JWT_SECRET", missingSecretBlocked);

  // 1b. Production refuses known insecure default secret
  let defaultSecretBlocked = false;
  try {
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "change_this_in_production";
    validateEnvironment();
    process.env.NODE_ENV = prevEnv;
    process.env.JWT_SECRET = prevSecret;
  } catch (err) {
    defaultSecretBlocked = err.message.includes("Insecure or short JWT_SECRET");
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "phase5a_super_secure_jwt_secret_key_minimum_32_characters_long_2026";
  }
  recordTest(2, "Production startup strictly rejects insecure default JWT secret ('change_this_in_production')", defaultSecretBlocked);

  // 1c. Production refuses mock payments
  let mockPaymentsBlocked = false;
  try {
    const prevEnv = process.env.NODE_ENV;
    const prevMock = process.env.ENABLE_MOCK_PAYMENTS;
    process.env.NODE_ENV = "production";
    process.env.ENABLE_MOCK_PAYMENTS = "true";
    validateEnvironment();
    process.env.NODE_ENV = prevEnv;
    process.env.ENABLE_MOCK_PAYMENTS = prevMock;
  } catch (err) {
    mockPaymentsBlocked = err.message.includes("ENABLE_MOCK_PAYMENTS cannot be active");
    process.env.NODE_ENV = "test";
    delete process.env.ENABLE_MOCK_PAYMENTS;
  }
  recordTest(3, "Production startup strictly forbids mock payments (ENABLE_MOCK_PAYMENTS=true)", mockPaymentsBlocked);

  // 1d. Production succeeds with valid configuration
  let validProdSucceeded = false;
  try {
    const prevEnv = process.env.NODE_ENV;
    const prevMock = process.env.ENABLE_MOCK_PAYMENTS;
    delete process.env.ENABLE_MOCK_PAYMENTS;
    process.env.NODE_ENV = "production";
    process.env.MONGO_URI = "mongodb+srv://atlas_user:atlas_pass@cluster.mongodb.net/prod_db";
    const result = validateEnvironment();
    validProdSucceeded = result.isProduction && result.hasSecureJwt;
    process.env.NODE_ENV = prevEnv;
    delete process.env.MONGO_URI;
  } catch (err) {
    console.error("Valid prod failed unexpectedly:", err);
    process.env.NODE_ENV = "test";
  }
  recordTest(4, "Production startup succeeds when valid 32+ char secret and Atlas URI are provided", validProdSucceeded);

  // ---------------------------------------------------------------------------
  // 2. Connect Database & Start HTTP Security Test Server
  // ---------------------------------------------------------------------------
  await startLocalMongod();

  const mongoUri = `mongodb://127.0.0.1:${MONGO_PORT}/wardrobe_wonders_phase5a_test`;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      break;
    } catch (e) {
      if (attempt === 10) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.log("Connected to MongoDB on port " + MONGO_PORT);

  await UserModel.deleteMany({});
  await ProductModel.deleteMany({});
  await OrderModel.deleteMany({});

  await createSecurityTestApp();

  // Create Test Actors
  const customerUser = await UserModel.create({
    name: "Aanya Sen",
    email: "aanya_sec@test.com",
    role: "customer",
    isActive: true,
  });
  const tokenCust = jwt.sign({ id: customerUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  const adminUser = await UserModel.create({
    name: "System Administrator",
    email: "admin_sec@test.com",
    role: "admin",
    isActive: true,
  });
  const tokenAdmin = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // ---------------------------------------------------------------------------
  // 3. OWASP Security Headers (Helmet Equivalents)
  // ---------------------------------------------------------------------------
  const resHeaders = await fetch(`${BASE_URL}/health`, {
    headers: { "x-test-bypass-rate-limit": "1" },
  });
  const hNoSniff = resHeaders.headers.get("x-content-type-options") === "nosniff";
  const hFrame = resHeaders.headers.get("x-frame-options") === "SAMEORIGIN";
  const hReferrer = resHeaders.headers.get("referrer-policy") === "strict-origin-when-cross-origin";
  const hNoPower = resHeaders.headers.get("x-powered-by") === null;
  const hCsp = Boolean(resHeaders.headers.get("content-security-policy"));

  const headersPassed = hNoSniff && hFrame && hReferrer && hNoPower && hCsp;
  recordTest(5, "OWASP / Helmet-equivalent HTTP security headers and CSP enforced", headersPassed, {
    noSniff: hNoSniff,
    frame: hFrame,
    noPoweredBy: hNoPower,
    hasCsp: hCsp,
  });

  // ---------------------------------------------------------------------------
  // 4. Strict CORS Policy Validation
  // ---------------------------------------------------------------------------
  // 4a. Production Authorized Origin Accepted
  const resCorsAllowed = await fetch(`${BASE_URL}/health`, {
    headers: {
      Origin: "https://wardrobe-wonders-ai.vercel.app",
      "x-test-bypass-rate-limit": "1",
    },
  });
  const corsAllowedHeader = resCorsAllowed.headers.get("access-control-allow-origin");
  const corsAllowedPassed = resCorsAllowed.status === 200 && corsAllowedHeader === "https://wardrobe-wonders-ai.vercel.app";
  recordTest(6, "Authorized production CORS origin permitted with exact header match", corsAllowedPassed, {
    allowOrigin: corsAllowedHeader,
  });

  // 4b. Non-browser request (no Origin header, e.g. PhonePe webhook / mobile HTTP) permitted
  const resNoOrigin = await fetch(`${BASE_URL}/health`, {
    headers: { "x-test-bypass-rate-limit": "1" },
  });
  const noOriginPassed = resNoOrigin.status === 200;
  recordTest(7, "Non-browser requests (no Origin header) permitted for webhooks and mobile clients", noOriginPassed);

  // ---------------------------------------------------------------------------
  // 5. NoSQL / MongoDB Operator Injection Defense
  // ---------------------------------------------------------------------------
  const resInjection = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-bypass-rate-limit": "1",
    },
    body: JSON.stringify({
      email: { "$ne": null },
      password: { "$gt": "" },
    }),
  });
  const dataInjection = await resInjection.json();
  const injectionBlocked = resInjection.status === 400 && dataInjection.status === false;
  recordTest(8, "NoSQL query operator injection ($ne, $gt) strictly blocked by mongoSanitizer", injectionBlocked, {
    status: resInjection.status,
    message: dataInjection.message,
  });

  // ---------------------------------------------------------------------------
  // 6. Body Parser Payload Size Limits (1MB DoS Mitigation)
  // ---------------------------------------------------------------------------
  const oversizedData = "X".repeat(1.2 * 1024 * 1024); // 1.2MB payload
  const resOversized = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-bypass-rate-limit": "1",
    },
    body: JSON.stringify({ hugeField: oversizedData }),
  });
  const payloadLimitEnforced = resOversized.status === 413;
  recordTest(9, "Oversized request body (>1MB) rejected with HTTP 413 Payload Too Large", payloadLimitEnforced, {
    status: resOversized.status,
  });

  // ---------------------------------------------------------------------------
  // 7. Privileged Account Public Signup Protection
  // ---------------------------------------------------------------------------
  const resPrivAdmin = await fetch(`${BASE_URL}/user/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-bypass-rate-limit": "1",
    },
    body: JSON.stringify({
      email: "hacker_admin@test.com",
      password: "password123",
      role: "admin",
    }),
  });
  const resPrivSuper = await fetch(`${BASE_URL}/user/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-bypass-rate-limit": "1",
    },
    body: JSON.stringify({
      email: "hacker_super@test.com",
      password: "password123",
      role: "superadmin",
    }),
  });
  const adminCreationBlocked = resPrivAdmin.status === 400 && resPrivSuper.status === 400;
  recordTest(10, "Public registration attempts for 'admin' or 'superadmin' roles strictly rejected (HTTP 400)", adminCreationBlocked, {
    adminStatus: resPrivAdmin.status,
    superStatus: resPrivSuper.status,
  });

  // ---------------------------------------------------------------------------
  // 8. Role-Based Authorization Enforcement
  // ---------------------------------------------------------------------------
  // Customer attempts to access Admin Overview
  const resCustomerAdminAccess = await fetch(`${BASE_URL}/admin/overview`, {
    headers: {
      Authorization: `Bearer ${tokenCust}`,
      "x-test-bypass-rate-limit": "1",
    },
  });

  // Customer attempts to create listing on Provider route
  const resCustomerProviderAccess = await fetch(`${BASE_URL}/provider/listings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenCust}`,
      "Content-Type": "application/json",
      "x-test-bypass-rate-limit": "1",
    },
    body: JSON.stringify({ title: "Unauthorized Dress" }),
  });

  // Admin access succeeds
  const resAdminAccess = await fetch(`${BASE_URL}/admin/overview`, {
    headers: {
      Authorization: `Bearer ${tokenAdmin}`,
      "x-test-bypass-rate-limit": "1",
    },
  });

  const rbacPassed =
    resCustomerAdminAccess.status === 403 &&
    resCustomerProviderAccess.status === 403 &&
    resAdminAccess.status === 200;
  recordTest(11, "Role-based access control strictly enforced (Customer blocked from /admin & /provider with HTTP 403)", rbacPassed, {
    customerAdminStatus: resCustomerAdminAccess.status,
    customerProviderStatus: resCustomerProviderAccess.status,
    adminStatus: resAdminAccess.status,
  });

  // ---------------------------------------------------------------------------
  // 9. JWT Tampering & Insecure Default Secret Defense
  // ---------------------------------------------------------------------------
  // Token signed with insecure default secret ("change_this_in_production")
  const forgedDefaultToken = jwt.sign({ id: customerUser._id }, "change_this_in_production", { expiresIn: "1h" });
  const resForgedToken = await fetch(`${BASE_URL}/user/profile`, {
    headers: {
      Authorization: `Bearer ${forgedDefaultToken}`,
      "x-test-bypass-rate-limit": "1",
    },
  });

  // Tampered payload token
  const tamperedToken = tokenCust.slice(0, -6) + "xxxxxx";
  const resTamperedToken = await fetch(`${BASE_URL}/user/profile`, {
    headers: {
      Authorization: `Bearer ${tamperedToken}`,
      "x-test-bypass-rate-limit": "1",
    },
  });

  const tokenSecurityPassed = resForgedToken.status === 401 && resTamperedToken.status === 401;
  recordTest(12, "Forged tokens and tokens signed with insecure default secrets rejected (HTTP 401)", tokenSecurityPassed, {
    forgedStatus: resForgedToken.status,
    tamperedStatus: resTamperedToken.status,
  });

  // ---------------------------------------------------------------------------
  // 10. Rate Limiting Abuse Prevention & HTTP 429
  // ---------------------------------------------------------------------------
  // Send 35 rapid requests to trigger the 30-request authLimiter threshold
  let rateLimitHit = false;
  let retryAfterHeader = null;
  const testIpHeaders = {
    "X-Forwarded-For": "198.51.100.42",
    "Content-Type": "application/json",
  };

  for (let i = 0; i < 35; i++) {
    const resRate = await fetch(`${BASE_URL}/user/login`, {
      method: "POST",
      headers: testIpHeaders,
      body: JSON.stringify({ email: "rate_test@test.com", password: "wrong_password" }),
    });

    if (resRate.status === 429) {
      rateLimitHit = true;
      retryAfterHeader = resRate.headers.get("retry-after");
      break;
    }
  }

  const rateLimitingPassed = rateLimitHit && Boolean(retryAfterHeader);
  recordTest(13, "Rate limiting triggers HTTP 429 and returns Retry-After header on brute-force attempts", rateLimitingPassed, {
    rateLimitHit,
    retryAfterHeader,
  });

  // ---------------------------------------------------------------------------
  // 11. Unauthenticated Upload Access Rejection
  // ---------------------------------------------------------------------------
  const resUnauthUpload = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { "x-test-bypass-rate-limit": "1" },
  });
  const uploadAuthPassed = resUnauthUpload.status === 401;
  recordTest(14, "Unauthenticated image upload attempts strictly rejected with HTTP 401", uploadAuthPassed, {
    status: resUnauthUpload.status,
  });

  // ---------------------------------------------------------------------------
  // 12. Health & Readiness Observability Endpoints
  // ---------------------------------------------------------------------------
  const resHealth = await fetch(`${BASE_URL}/health`, { headers: { "x-test-bypass-rate-limit": "1" } });
  const dataHealth = await resHealth.json();

  const resReady = await fetch(`${BASE_URL}/readiness`, { headers: { "x-test-bypass-rate-limit": "1" } });
  const dataReady = await resReady.json();

  const observabilityPassed =
    resHealth.status === 200 &&
    dataHealth.status === "healthy" &&
    dataHealth.database?.connected === true &&
    resReady.status === 200 &&
    dataReady.status === "ready";
  recordTest(15, "Health liveness (/health) and readiness (/readiness) observability endpoints operational", observabilityPassed, {
    healthStatus: dataHealth.status,
    readyStatus: dataReady.status,
  });

  console.log("\n=========================================================================");
  console.log(`FULL SECURITY SUITE SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${testRecords.length} tests`);
  console.log("=========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

try {
  await runSecuritySuite();
} catch (suiteErr) {
  console.error("Execution error in security suite:", suiteErr);
  process.exit(1);
} finally {
  if (server) server.close();
  await mongoose.disconnect();
  stopLocalMongod();
}
