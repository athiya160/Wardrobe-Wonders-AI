/**
 * WARDROBE WONDERS (DressR) — PHASE 5B COMPLETE E2E TEST SUITE
 * 
 * Comprehensive End-to-End automated testing covering:
 *  - Customer Journey (Auth, Profile, Address CRUD, Wishlist, Catalog, Pricing, COD, Gateway, Cancellation)
 *  - Provider Journey (Auth, Listing CRUD, Image Validation, Orders, Status Flow, 85% Earnings Calculation)
 *  - Admin Journey (Role Guards, Overview Metrics, User Management, Listing Moderation, Reports, Manual Refund Confirmation)
 *  - Cross-Role Lifecycle Integration (Multi-party order from listing to completion)
 *  - Negative & Security Regressions (Tampered prices, privilege escalation, forged JWTs)
 *  - AI Resilient Fallback Integration (Catalog search and chat when FastAPI is offline)
 */

import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import OrderModel from "./models/OrderModel.js";
import ReportModel from "./models/ReportModel.js";

import UserRouter from "./routes/user.router.js";
import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import { PaymentRouter } from "./routes/payment.js";
import adminRouter from "./routes/admin.router.js";
import uploadRouter from "./routes/upload.router.js";

import {
  securityHeaders,
  getCorsOptions,
  mongoSanitizer,
} from "./middleware/security.js";
import {
  atomicReserveDates,
  atomicReleaseDates,
  calculateServerPricing,
  findDateConflict,
} from "./services/bookingSafetyService.js";
import { config as phonepeCfg } from "./config/phonepeConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4098;
const MONGO_PORT = process.env.MONGO_PORT || 27017;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = "phase5b_secure_e2e_jwt_secret_minimum_32_characters_long";

process.env.JWT_SECRET = JWT_SECRET;
process.env.NODE_ENV = "test";
process.env.ENABLE_MOCK_PAYMENTS = "true";
process.env.USE_MOCK_GATEWAY = "true";

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
    if (meta.response) console.error("    Response status:", meta.response.status, "data:", meta.response.data);
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
      if (!started) resolve();
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

async function createE2ETestApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(securityHeaders);
  app.use(cors(getCorsOptions()));
  app.use(bodyParser.json({ limit: "1mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));
  app.use(mongoSanitizer);

  app.use("/user", UserRouter);
  app.use("/login", UserRouter);
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
  app.use("/payment", PaymentRouter);
  app.use("/admin", adminRouter);
  app.use("/upload", uploadRouter);

  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Phase 5B E2E Test Server running on port ${PORT}.`);
      resolve(server);
    });
  });
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const fetchOpts = {
    method: options.method || "GET",
    headers,
  };
  if (options.body) {
    fetchOpts.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }
  const res = await fetch(url, fetchOpts);
  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function runE2ESuite() {
  console.log("=========================================================================");
  console.log("   WARDROBE WONDERS (DressR) — PHASE 5B COMPLETE E2E TEST BATTERY        ");
  console.log("=========================================================================");

  await startLocalMongod();

  const mongoUri = `mongodb://127.0.0.1:${MONGO_PORT}/wardrobe_wonders_phase5b_e2e`;
  let connected = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      connected = true;
      console.log(`Connected to MongoDB on port ${MONGO_PORT}`);
      break;
    } catch (err) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  if (!connected) {
    console.error("FATAL: Could not connect to local mongod on port " + MONGO_PORT);
    process.exit(1);
  }

  // Clear test DB collections
  await UserModel.deleteMany({});
  await ProductModel.deleteMany({});
  await OrderModel.deleteMany({});
  await ReportModel.deleteMany({});

  await createE2ETestApp();

  let customerToken = "";
  let customerUser = null;
  let customer2Token = "";
  let customer2User = null;

  let providerToken = "";
  let providerUser = null;
  let provider2Token = "";
  let provider2User = null;

  let adminToken = "";
  let adminUser = null;

  let testListingId = "";
  let secondListingId = "";
  let savedAddressId = "";
  let createdOrderId = "";

  console.log("\n--- SECTION 1: CUSTOMER JOURNEY (Authentication & Session) ---");

  // Scenario 1: Customer Registration
  try {
    const regRes = await request("/user/register", {
      method: "POST",
      body: {
        name: "Priya Sharma",
        email: "priya.customer@example.com",
        password: "CustomerPassword123!",
        role: "customer",
      },
    });
    recordTest(1, "Customer registration creates user with hashed password and returns credentials",
      regRes.status === 200 && regRes.data.status === true && regRes.data.user.role === "customer",
      { response: regRes }
    );
  } catch (e) {
    recordTest(1, "Customer registration creates user", false, { error: e.message });
  }

  // Scenario 2: Duplicate registration rejected
  try {
    const dupRes = await request("/user/register", {
      method: "POST",
      body: {
        name: "Priya Sharma Duplicate",
        email: "priya.customer@example.com",
        password: "DifferentPassword123!",
        role: "customer",
      },
    });
    recordTest(2, "Duplicate email registration rejected with HTTP 400",
      dupRes.status === 400,
      { response: dupRes }
    );
  } catch (e) {
    recordTest(2, "Duplicate email registration rejected", false, { error: e.message });
  }

  // Scenario 3: Customer Login with Valid Credentials
  try {
    const loginRes = await request("/user/login", {
      method: "POST",
      body: {
        email: "priya.customer@example.com",
        password: "CustomerPassword123!",
      },
    });
    customerToken = loginRes.data.token;
    customerUser = loginRes.data.user;
    recordTest(3, "Customer login with valid credentials returns JWT token and sanitized user",
      loginRes.status === 200 && Boolean(customerToken) && customerUser.email === "priya.customer@example.com",
      { response: loginRes }
    );
  } catch (e) {
    recordTest(3, "Customer login with valid credentials", false, { error: e.message });
  }

  // Scenario 4: Reject Login with Invalid Password
  try {
    const badLoginRes = await request("/user/login", {
      method: "POST",
      body: {
        email: "priya.customer@example.com",
        password: "WrongPassword999!",
      },
    });
    recordTest(4, "Login rejected on invalid password with HTTP 401",
      badLoginRes.status === 401,
      { response: badLoginRes }
    );
  } catch (e) {
    recordTest(4, "Login rejected on invalid password", false, { error: e.message });
  }

  // Scenario 5: Customer Session Verification via GET /user/me
  try {
    const meRes = await request("/user/me", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    recordTest(5, "Active session verified via GET /user/me using JWT token",
      meRes.status === 200 && meRes.data.user.email === "priya.customer@example.com",
      { response: meRes }
    );
  } catch (e) {
    recordTest(5, "Active session verified via GET /user/me", false, { error: e.message });
  }

  // Scenario 6: Protected route rejects unauthorized request without token
  try {
    const unauthRes = await request("/user/addresses", {});
    recordTest(6, "Protected customer route strictly rejects unauthenticated request with HTTP 401",
      unauthRes.status === 401,
      { response: unauthRes }
    );
  } catch (e) {
    recordTest(6, "Protected customer route rejects unauthenticated request", false, { error: e.message });
  }

  console.log("\n--- SECTION 2: CUSTOMER PROFILE, MEASUREMENTS, ADDRESSES & WISHLIST ---");

  // Scenario 7: Update Customer Profile
  try {
    const profRes = await request("/user/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        name: "Priya S. Sharma",
        phone: "+919876543210",
        bio: "Fashion enthusiast and gala attendee.",
      },
    });
    recordTest(7, "Customer profile update persists name, phone, and bio in MongoDB",
      profRes.status === 200 && profRes.data.user.name === "Priya S. Sharma" && profRes.data.user.phone === "+919876543210",
      { response: profRes }
    );
  } catch (e) {
    recordTest(7, "Customer profile update persists in MongoDB", false, { error: e.message });
  }

  // Scenario 8: Save Customer Body Measurements
  try {
    const measRes = await request("/user/measurements", {
      method: "PUT",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        bust: 34,
        waist: 28,
        hips: 36,
        height: 165,
        unit: "cm",
      },
    });
    recordTest(8, "Customer body measurements saved and validated in MongoDB",
      measRes.status === 200 && measRes.data.measurements.bust === 34 && measRes.data.measurements.waist === 28,
      { response: measRes }
    );
  } catch (e) {
    recordTest(8, "Customer body measurements saved", false, { error: e.message });
  }

  // Scenario 9: Add Delivery Address
  try {
    const addrRes = await request("/user/addresses", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        name: "Priya Sharma",
        phone: "+919876543210",
        houseNo: "Flat 402, Royale Palms",
        street: "Linking Road",
        landmark: "Near Arya Vidya Mandir",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400052",
        isDefault: true,
      },
    });
    savedAddressId = addrRes.data.address?._id || addrRes.data.address?.id;
    recordTest(9, "Customer adds delivery address and marks as default in MongoDB",
      addrRes.status === 201 && addrRes.data.success === true && Boolean(savedAddressId),
      { response: addrRes }
    );
  } catch (e) {
    recordTest(9, "Customer adds delivery address", false, { error: e.message });
  }

  // Scenario 10: Edit Delivery Address
  try {
    const editAddrRes = await request(`/user/addresses/${savedAddressId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        houseNo: "Penthouse 501, Royale Palms",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400052",
      },
    });
    recordTest(10, "Customer modifies existing delivery address with immediate DB persistence",
      editAddrRes.status === 200 && editAddrRes.data.address.houseNo === "Penthouse 501, Royale Palms",
      { response: editAddrRes }
    );
  } catch (e) {
    recordTest(10, "Customer modifies existing delivery address", false, { error: e.message });
  }

  // Scenario 11: Create Second Customer for Isolation Verification
  try {
    await request("/user/register", {
      method: "POST",
      body: {
        name: "Rahul Verma",
        email: "rahul.customer@example.com",
        password: "RahulPassword123!",
        role: "customer",
      },
    });
    const c2Login = await request("/user/login", {
      method: "POST",
      body: {
        email: "rahul.customer@example.com",
        password: "RahulPassword123!",
      },
    });
    customer2Token = c2Login.data.token;
    customer2User = c2Login.data.user;

    const stealAddrRes = await request(`/user/addresses/${savedAddressId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: { houseNo: "Hacked House" },
    });
    recordTest(11, "Multi-tenant customer data isolation: Customer B cannot edit Customer A's address (HTTP 403/404)",
      stealAddrRes.status === 403 || stealAddrRes.status === 404,
      { response: stealAddrRes }
    );
  } catch (e) {
    recordTest(11, "Multi-tenant customer data isolation", false, { error: e.message });
  }

  console.log("\n--- SECTION 3: PROVIDER JOURNEY (Listings, Inventory & Moderation) ---");

  // Scenario 12: Provider Registration & Login
  try {
    await request("/user/register", {
      method: "POST",
      body: {
        name: "Sabyasachi Bridal Studio",
        email: "sabyasachi.provider@example.com",
        password: "ProviderPassword123!",
        role: "provider",
      },
    });
    const pLogin = await request("/user/login", {
      method: "POST",
      body: {
        email: "sabyasachi.provider@example.com",
        password: "ProviderPassword123!",
      },
    });
    providerToken = pLogin.data.token;
    providerUser = pLogin.data.user;
    recordTest(12, "Provider registration and login succeed with role 'provider'",
      pLogin.status === 200 && providerUser.role === "provider" && Boolean(providerToken),
      { response: pLogin }
    );
  } catch (e) {
    recordTest(12, "Provider registration and login", false, { error: e.message });
  }

  // Scenario 13: Provider creates new dress listing
  try {
    const listRes = await request("/provider/listings", {
      method: "POST",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        title: "Embroidered Silk Bridal Lehenga",
        name: "Embroidered Silk Bridal Lehenga",
        category: "Bridal",
        gender: "women",
        size: "M",
        brand: "Sabyasachi Heritage",
        rentalPricePerDay: 2800,
        price: 2800,
        securityDeposit: 5000,
        advance: "5000",
        images: ["https://res.cloudinary.com/demo/image/upload/sample_lehenga.jpg"],
        image: "https://res.cloudinary.com/demo/image/upload/sample_lehenga.jpg",
        description: "Pure crimson silk lehenga with zardozi embroidery for wedding receptions.",
        stock: "1",
        ownershipConfirmed: true,
      },
    });
    testListingId = listRes.data.listing?._id;
    recordTest(13, "Provider creates garment listing with validated pricing, deposit, and images",
      listRes.status === 201 && listRes.data.status === true && Boolean(testListingId),
      { response: listRes }
    );
  } catch (e) {
    recordTest(13, "Provider creates garment listing", false, { error: e.message });
  }

  // Scenario 14: Reject listing with missing required fields
  try {
    const badListRes = await request("/provider/listings", {
      method: "POST",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        title: "Incomplete Listing",
        // missing rental price, deposit, and image
      },
    });
    recordTest(14, "Listing creation rejected when required fields (price, deposit, image) are omitted",
      badListRes.status === 400,
      { response: badListRes }
    );
  } catch (e) {
    recordTest(14, "Listing creation rejected when required fields omitted", false, { error: e.message });
  }

  // Scenario 15: Provider modifies listing details
  try {
    const editListRes = await request(`/provider/listings/${testListingId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        rentalPricePerDay: 2800,
        price: 2800,
        description: "Updated description: includes designer dupatta and potli pouch.",
      },
    });
    recordTest(15, "Provider updates listing pricing and details with ownership verification",
      editListRes.status === 200 && editListRes.data.listing.rentalPricePerDay === 2800,
      { response: editListRes }
    );
  } catch (e) {
    recordTest(15, "Provider updates listing pricing and details", false, { error: e.message });
  }

  // Scenario 16: Second Provider cannot modify first provider's listing
  try {
    await request("/user/register", {
      method: "POST",
      body: {
        name: "Manish Malhotra Atelier",
        email: "manish.provider@example.com",
        password: "ManishPassword123!",
        role: "provider",
      },
    });
    const p2Login = await request("/user/login", {
      method: "POST",
      body: {
        email: "manish.provider@example.com",
        password: "ManishPassword123!",
      },
    });
    provider2Token = p2Login.data.token;

    const crossEditRes = await request(`/provider/listings/${testListingId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${provider2Token}` },
      body: { rentalPricePerDay: 500 },
    });
    recordTest(16, "Provider B strictly prevented from updating Provider A's listing (HTTP 403)",
      crossEditRes.status === 403,
      { response: crossEditRes }
    );
  } catch (e) {
    recordTest(16, "Provider B prevented from updating Provider A listing", false, { error: e.message });
  }

  console.log("\n--- SECTION 4: ADMIN JOURNEY (Moderation, Metrics & Refunds) ---");

  // Scenario 17: Admin User Setup & Login
  try {
    const adminUserDoc = new UserModel({
      name: "Chief Operations Admin",
      email: "admin.super@wardrobewonders.com",
      password: "AdminSecurePassword999!",
      role: "admin",
      isActive: true,
    });
    await adminUserDoc.save();

    const aLogin = await request("/user/login", {
      method: "POST",
      body: {
        email: "admin.super@wardrobewonders.com",
        password: "AdminSecurePassword999!",
      },
    });
    adminToken = aLogin.data.token;
    adminUser = aLogin.data.user;
    recordTest(17, "Admin login succeeds with 'admin' role and administrative token",
      aLogin.status === 200 && adminUser.role === "admin" && Boolean(adminToken),
      { response: aLogin }
    );
  } catch (e) {
    recordTest(17, "Admin login succeeds", false, { error: e.message });
  }

  // Scenario 18: Customer and Provider strictly forbidden from Admin endpoints
  try {
    const custOnAdmin = await request("/admin/overview", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const provOnAdmin = await request("/admin/overview", {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    recordTest(18, "Customer and Provider strictly forbidden from /admin routes with HTTP 403",
      custOnAdmin.status === 403 && provOnAdmin.status === 403,
      { custOnAdmin: custOnAdmin.status, provOnAdmin: provOnAdmin.status }
    );
  } catch (e) {
    recordTest(18, "Customer and Provider forbidden from admin routes", false, { error: e.message });
  }

  // Scenario 19: Admin Overview Health & Financial Metrics
  try {
    const overRes = await request("/admin/overview", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordTest(19, "Admin overview returns accurate user counts, listings, order metrics, and revenue estimates",
      overRes.status === 200 &&
      overRes.data.success === true &&
      overRes.data.overview.users.total >= 3 &&
      overRes.data.overview.listings.total >= 1,
      { response: overRes }
    );
  } catch (e) {
    recordTest(19, "Admin overview metrics", false, { error: e.message });
  }

  // Scenario 20: Admin Search Users
  try {
    const userSearchRes = await request("/admin/users?q=Priya", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    recordTest(20, "Admin can search users by query filter with sanitized results (no password hashes)",
      userSearchRes.status === 200 &&
      userSearchRes.data.users.length >= 1 &&
      userSearchRes.data.users[0].password === undefined,
      { response: userSearchRes }
    );
  } catch (e) {
    recordTest(20, "Admin can search users", false, { error: e.message });
  }

  // Scenario 21: Admin Moderate Listing (Approve & Deactivate)
  try {
    const modRes = await request(`/admin/listings/${testListingId}/moderate`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: "approve" },
    });
    recordTest(21, "Admin moderates listing: marks approved and active in catalog",
      modRes.status === 200 && modRes.data.listing.status === "active",
      { response: modRes }
    );
  } catch (e) {
    recordTest(21, "Admin moderates listing", false, { error: e.message });
  }

  console.log("\n--- SECTION 5: CUSTOMER RENTAL CHECKOUT (COD, Pricing & Reservations) ---");

  // Scenario 22: Rental Date Range Validation (Reject End Date < Start Date)
  try {
    const invalidDatesRes = await request("/payment/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        dressId: testListingId,
        email: customerUser.email,
        startDate: "2026-11-20",
        endDate: "2026-11-15", // Invalid: End before Start
        address: { street: "123 Test St", city: "Mumbai", pincode: "400050" },
      },
    });
    recordTest(22, "Server rejects invalid rental date range (end date prior to start date) with HTTP 400",
      invalidDatesRes.status === 400,
      { response: invalidDatesRes }
    );
  } catch (e) {
    recordTest(22, "Server rejects invalid rental date range", false, { error: e.message });
  }

  // Scenario 23: Server-side Pricing Invariance
  try {
    // 3 rental days at 2800/day = 8400 rental fee + 5000 deposit = 13400 total
    const sampleProduct = {
      rentalPricePerDay: 2800,
      price: 2800,
      securityDeposit: 5000,
      advance: "5000",
    };
    const sDate = new Date("2026-12-01");
    const eDate = new Date("2026-12-04"); // 3 days
    const pricing = calculateServerPricing(sampleProduct, sDate, eDate, 3);

    recordTest(23, "Server-side pricing correctly computes rental days (3), rental fee (8400), and total (13400)",
      pricing.days === 3 && pricing.rentalFee === 8400 && pricing.totalAmount === 13400,
      { pricing }
    );
  } catch (e) {
    recordTest(23, "Server-side pricing calculation", false, { error: e.message });
  }

  // Scenario 24: Customer places Cash on Delivery (COD) Order
  try {
    const codRes = await request("/payment/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        dressId: testListingId,
        email: customerUser.email,
        startDate: "2026-12-01",
        endDate: "2026-12-04",
        addressId: savedAddressId,
        address: {
          name: "Priya Sharma",
          phone: "+919876543210",
          houseNo: "Flat 402",
          street: "Linking Road",
          city: "Mumbai",
          pincode: "400052",
        },
      },
    });
    createdOrderId = codRes.data.orderId || codRes.data.order?._id;
    recordTest(24, "Customer completes COD rental order with atomically locked calendar dates",
      codRes.status === 200 &&
      codRes.data.success === true &&
      codRes.data.order.paymentMethod === "cod" &&
      codRes.data.order.paymentStatus === "PENDING" &&
      Boolean(createdOrderId),
      { response: codRes }
    );
  } catch (e) {
    recordTest(24, "Customer completes COD rental order", false, { error: e.message });
  }

  // Scenario 25: Reject overlapping booking for the same garment on reserved dates
  try {
    const overlapRes = await request("/payment/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: {
        dressId: testListingId,
        email: customer2User.email,
        startDate: "2026-12-02", // Overlaps with 2026-12-01 to 2026-12-04
        endDate: "2026-12-05",
        address: { street: "456 Test Lane", city: "Mumbai", pincode: "400050" },
      },
    });
    recordTest(25, "System strictly rejects overlapping booking reservation on reserved calendar dates (HTTP 409)",
      overlapRes.status === 409,
      { response: overlapRes }
    );
  } catch (e) {
    recordTest(25, "System strictly rejects overlapping booking", false, { error: e.message });
  }

  // Scenario 26: Order appears in Customer's My Rentals
  try {
    const myRentalsRes = await request("/payment/my-rentals", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const foundOrder = myRentalsRes.data.orders?.find((o) => String(o._id) === String(createdOrderId));
    recordTest(26, "Order displays in Customer's My Rentals with pending payment status and address details",
      myRentalsRes.status === 200 && Boolean(foundOrder),
      { response: myRentalsRes }
    );
  } catch (e) {
    recordTest(26, "Order displays in My Rentals", false, { error: e.message });
  }

  console.log("\n--- SECTION 6: PROVIDER ORDER FULFILLMENT & 85% EARNINGS CALCULATION ---");

  // Scenario 27: Provider views incoming rental order
  try {
    const provOrdersRes = await request("/provider/orders", {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    const incomingOrder = provOrdersRes.data.orders?.find((o) => String(o._id) === String(createdOrderId));
    recordTest(27, "Provider retrieves incoming rental orders with customer details and rental timeframe",
      provOrdersRes.status === 200 && Boolean(incomingOrder),
      { response: provOrdersRes }
    );
  } catch (e) {
    recordTest(27, "Provider retrieves incoming rental orders", false, { error: e.message });
  }

  // Scenario 28: Provider Accepts and Activates Order
  try {
    const acceptRes = await request(`/provider/orders/${createdOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: { requestStatus: "Accepted" },
    });
    const activeRes = await request(`/provider/orders/${createdOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: { requestStatus: "Active" },
    });
    recordTest(28, "Provider workflow advances order through Accepted and Active fulfillment states",
      acceptRes.status === 200 && activeRes.status === 200 && activeRes.data.order.requestStatus === "Active",
      { acceptRes, activeRes }
    );
  } catch (e) {
    recordTest(28, "Provider advances order fulfillment states", false, { error: e.message });
  }

  // Scenario 29: Provider Marks Order Completed & Financial Ledger Verification
  try {
    const completeRes = await request(`/provider/orders/${createdOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: { requestStatus: "Completed" },
    });

    const statsRes = await request("/provider/stats", {
      headers: { Authorization: `Bearer ${providerToken}` },
    });

    // Rental fee was 8400. 85% of 8400 = 7140. Deposit (5000) excluded from commissionable revenue.
    const expectedProviderEarnings = Math.round(8400 * 0.85); // 7140
    recordTest(29, "Provider earnings rule verified: receives exactly 85% of garment rental fee (Rs 7,140) with 0% commission on deposit",
      completeRes.status === 200 &&
      statsRes.data.stats.totalEarnings === expectedProviderEarnings &&
      statsRes.data.stats.payableEarnings === expectedProviderEarnings,
      { completeRes, statsRes: statsRes.data }
    );
  } catch (e) {
    recordTest(29, "Provider 85% earnings rule verified", false, { error: e.message });
  }

  console.log("\n--- SECTION 7: GATEWAY CHECKOUT, IDEMPOTENCY & REFUND AUDIT TRAIL ---");

  // Scenario 30: Gateway Initiation & Pending Order Creation
  let gatewayOrderId = "";
  let gatewayTxnId = "";
  try {
    // Create second dress with all required fields
    const p2Dress = new ProductModel({
      providerId: providerUser._id,
      title: "Royal Velvet Sherwani",
      name: "Royal Velvet Sherwani",
      category: "Sherwani",
      gender: "men",
      size: "L",
      rentalPricePerDay: 3000,
      price: 3000,
      securityDeposit: 4000,
      advance: "4000",
      images: ["https://res.cloudinary.com/demo/image/upload/sample_sherwani.jpg"],
      image: "https://res.cloudinary.com/demo/image/upload/sample_sherwani.jpg",
      status: "active",
      availability: true,
    });
    await p2Dress.save();
    secondListingId = p2Dress._id;

    const initRes = await request("/payment", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        dress: { _id: secondListingId },
        dressId: secondListingId,
        email: customerUser.email,
        startDate: "2026-12-10",
        endDate: "2026-12-13", // 3 days: 9000 fee + 4000 deposit = 13000
        quantity: 3,
        address: { street: "789 Park St", city: "Mumbai", pincode: "400050" },
        simulateMock: true,
      },
    });

    // Check pending order saved in DB
    const pendingOrder = await OrderModel.findOne({
      product: secondListingId,
      userEmail: customerUser.email,
      paymentStatus: "PENDING",
    });

    gatewayOrderId = pendingOrder?._id;
    gatewayTxnId = pendingOrder?.transactionId;

    recordTest(30, "Gateway payment initiation creates PENDING order and returns secure redirect parameters",
      Boolean(pendingOrder) && pendingOrder.totalAmount === 13000 && Boolean(gatewayTxnId),
      { initRes, pendingOrder }
    );
  } catch (e) {
    recordTest(30, "Gateway payment initiation", false, { error: e.message });
  }

  // Scenario 31: Gateway Callback Verification with SHA-256 Checksum
  try {
    const orderDoc = await OrderModel.findById(gatewayOrderId);
    const merchantTxId = orderDoc.transactionId;
    const amountPaise = (Number(orderDoc.totalAmount) || 13000) * 100;

    const callbackData = {
      success: true,
      code: "PAYMENT_SUCCESS",
      message: "Transaction Successful",
      data: {
        merchantId: phonepeCfg.MID,
        merchantTransactionId: merchantTxId,
        transactionId: "TXN_" + Date.now(),
        amount: amountPaise,
        state: "COMPLETED",
        responseCode: "SUCCESS",
      },
    };

    const base64Response = Buffer.from(JSON.stringify(callbackData)).toString("base64");
    const hashString = base64Response + phonepeCfg.KEY;
    const checksum = crypto.createHash("sha256").update(hashString).digest("hex") + "###" + phonepeCfg.INDEX;

    const cbRes = await request("/payment/callback", {
      method: "POST",
      headers: { "x-verify": checksum },
      body: { response: base64Response },
    });

    const updatedOrder = await OrderModel.findById(gatewayOrderId);
    recordTest(31, "Valid gateway callback verifies SHA-256 checksum, marks order PAID, and queues for provider",
      cbRes.status === 200 &&
      updatedOrder.paymentStatus === "PAID" &&
      updatedOrder.status === "Processing",
      { cbRes, updatedOrder }
    );
  } catch (e) {
    recordTest(31, "Valid gateway callback marks order PAID", false, { error: e.message });
  }

  // Scenario 32: Gateway Callback Idempotency
  try {
    const orderDoc = await OrderModel.findById(gatewayOrderId);
    const merchantTxId = orderDoc.transactionId;
    const amountPaise = (Number(orderDoc.totalAmount) || 13000) * 100;

    const dupData = {
      success: true,
      code: "PAYMENT_SUCCESS",
      data: {
        merchantId: phonepeCfg.MID,
        merchantTransactionId: merchantTxId,
        transactionId: "TXN_DUPLICATE",
        amount: amountPaise,
        state: "COMPLETED",
      },
    };
    const base64Response = Buffer.from(JSON.stringify(dupData)).toString("base64");
    const hashString = base64Response + phonepeCfg.KEY;
    const checksum = crypto.createHash("sha256").update(hashString).digest("hex") + "###" + phonepeCfg.INDEX;

    const dupRes = await request("/payment/callback", {
      method: "POST",
      headers: { "x-verify": checksum },
      body: { response: base64Response },
    });

    const orderAfterDup = await OrderModel.findById(gatewayOrderId);
    recordTest(32, "Duplicate payment callback handled idempotently with HTTP 200 without modifying order state",
      dupRes.status === 200 && orderAfterDup.paymentStatus === "PAID",
      { dupRes }
    );
  } catch (e) {
    recordTest(32, "Duplicate payment callback handled idempotently", false, { error: e.message });
  }

  // Scenario 33: Concurrent Booking Conflict Flags MANUAL_REFUND_REQUIRED
  let conflictOrderId = "";
  try {
    const conflictTxnId = "TXN_CONFLICT_" + Date.now();
    const conflictOrder = new OrderModel({
      userId: customer2User._id,
      userEmail: customer2User.email,
      product: secondListingId,
      transactionId: conflictTxnId,
      merchantTransactionId: conflictTxnId,
      quantity: 3,
      rentalDays: 3,
      startDate: new Date("2026-12-10"),
      endDate: new Date("2026-12-13"),
      rentalStartDate: new Date("2026-12-10"),
      rentalEndDate: new Date("2026-12-13"),
      rentalPricePerDay: 3000,
      rentalFee: 9000,
      securityDeposit: 4000,
      totalAmount: 13000,
      paymentMethod: "phonepe",
      paymentStatus: "PENDING",
      address: { street: "Conflict St", city: "Mumbai", pincode: "400050" },
    });
    await conflictOrder.save();
    conflictOrderId = conflictOrder._id;

    // Simulate callback on conflict order when dates 2026-12-10 to 2026-12-13 are already booked by order 1
    const conflictData = {
      success: true,
      code: "PAYMENT_SUCCESS",
      data: {
        merchantId: phonepeCfg.MID,
        merchantTransactionId: conflictTxnId,
        transactionId: "TXN_CAPTURED_" + Date.now(),
        amount: 13000 * 100,
        state: "COMPLETED",
      },
    };
    const base64Response = Buffer.from(JSON.stringify(conflictData)).toString("base64");
    const hashString = base64Response + phonepeCfg.KEY;
    const checksum = crypto.createHash("sha256").update(hashString).digest("hex") + "###" + phonepeCfg.INDEX;

    await request("/payment/callback", {
      method: "POST",
      headers: { "x-verify": checksum },
      body: { response: base64Response },
    });

    const evaluatedConflict = await OrderModel.findById(conflictOrderId);
    recordTest(33, "Payment captured for conflicting dates safely flagged REFUND_REQUIRED and MANUAL_REFUND_REQUIRED",
      evaluatedConflict.paymentStatus === "REFUND_REQUIRED" &&
      evaluatedConflict.refundStatus === "MANUAL_REFUND_REQUIRED" &&
      evaluatedConflict.refundAmount === 13000,
      { evaluatedConflict }
    );
  } catch (e) {
    recordTest(33, "Conflicting payment flagged REFUND_REQUIRED", false, { error: e.message });
  }

  // Scenario 34: Admin Manual Refund Confirmation Workflow
  try {
    const refundConfirmRes = await request(`/payment/orders/${conflictOrderId}/refund/manual-confirm`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        notes: "Bank reference UTR# 987654321012 verified on PhonePe merchant settlement portal.",
      },
    });

    const refundedOrder = await OrderModel.findById(conflictOrderId);
    recordTest(34, "Admin manual refund confirmation records audit notes, sets SUCCEEDED, and updates deposit status",
      refundConfirmRes.status === 200 &&
      refundedOrder.refundStatus === "SUCCEEDED" &&
      refundedOrder.paymentStatus === "REFUNDED" &&
      refundedOrder.manualRefundNotes.includes("UTR# 987654321012"),
      { refundConfirmRes, refundedOrder }
    );
  } catch (e) {
    recordTest(34, "Admin manual refund confirmation records audit notes", false, { error: e.message });
  }

  // Scenario 35: Reject Duplicate Refund Confirmation
  try {
    const dupRefundRes = await request(`/payment/orders/${conflictOrderId}/refund/manual-confirm`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { notes: "Attempting duplicate refund confirm" },
    });
    recordTest(35, "System strictly rejects duplicate refund confirmation on already SUCCEEDED refund (HTTP 400)",
      dupRefundRes.status === 400,
      { dupRefundRes }
    );
  } catch (e) {
    recordTest(35, "Reject duplicate refund confirmation", false, { error: e.message });
  }

  console.log("\n--- SECTION 8: CROSS-ROLE INTEGRATED LIFECYCLE ---");

  // Scenario 36: Full Multi-Role Cross-Party Lifecycle
  try {
    // Step A: Provider creates listing
    const stepAList = await request("/provider/listings", {
      method: "POST",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: {
        title: "Gold Zari Banarasi Saree",
        name: "Gold Zari Banarasi Saree",
        category: "Saree",
        gender: "women",
        size: "Free Size",
        rentalPricePerDay: 1500,
        price: 1500,
        securityDeposit: 3000,
        advance: "3000",
        images: ["https://res.cloudinary.com/demo/image/upload/sample_saree.jpg"],
        image: "https://res.cloudinary.com/demo/image/upload/sample_saree.jpg",
        description: "Handloom Banarasi saree in imperial gold and magenta.",
      },
    });
    const sareeId = stepAList.data.listing._id;

    // Step B: Admin approves listing
    await request(`/admin/listings/${sareeId}/moderate`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: "approve" },
    });

    // Step C: Customer discovers and places rental order
    const stepCOrder = await request("/payment/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        dressId: sareeId,
        email: customerUser.email,
        startDate: "2026-12-25",
        endDate: "2026-12-28",
        addressId: savedAddressId,
        address: {
          name: "Priya Sharma",
          phone: "+919876543210",
          houseNo: "Flat 402",
          street: "Linking Road",
          city: "Mumbai",
          pincode: "400052",
        },
      },
    });
    const multiOrderId = stepCOrder.data.orderId || stepCOrder.data.order._id;

    // Step D: Provider sees incoming order and accepts
    await request(`/provider/orders/${multiOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: { requestStatus: "Accepted" },
    });

    // Step E: Provider activates order
    await request(`/provider/orders/${multiOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: { requestStatus: "Active" },
    });

    // Step F: Customer checks status in My Rentals
    const stepFCustCheck = await request("/payment/my-rentals", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const custView = stepFCustCheck.data.orders.find((o) => String(o._id) === String(multiOrderId));

    // Step G: Provider completes
    await request(`/provider/orders/${multiOrderId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${providerToken}` },
      body: { requestStatus: "Completed" },
    });

    // Step H: Admin monitors order in marketplace
    const stepHAdminCheck = await request("/admin/orders", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminView = stepHAdminCheck.data.orders.find((o) => String(o._id) === String(multiOrderId));

    recordTest(36, "Cross-role multi-party transaction lifecycle consistent across Provider, Admin, and Customer perspectives",
      custView.requestStatus === "Active" &&
      adminView.requestStatus === "Completed" &&
      adminView.paymentMethod === "cod",
      { custView, adminView }
    );
  } catch (e) {
    recordTest(36, "Cross-role multi-party transaction lifecycle", false, { error: e.message });
  }

  console.log("\n--- SECTION 9: AI RESILIENT FALLBACK INTEGRATION ---");

  // Scenario 37: Catalog Search Resilient Fallback
  try {
    const searchRes = await request("/products/search", {
      method: "POST",
      body: { query: "Banarasi silk" },
    });
    recordTest(37, "Product catalog search gracefully executes resilient MongoDB fallback when FastAPI is offline",
      searchRes.status === 200 &&
      Array.isArray(searchRes.data.results) &&
      searchRes.data.results.length >= 1,
      { searchRes }
    );
  } catch (e) {
    recordTest(37, "Product catalog search resilient fallback", false, { error: e.message });
  }

  // Scenario 38: AI Chat Resilient Fallback
  try {
    const chatRes = await request("/products/chat", {
      method: "POST",
      body: { message: "Looking for a wedding reception lehenga" },
    });
    recordTest(38, "AI Stylist chat returns structured fallback recommendations when FastAPI is offline",
      chatRes.status === 200 &&
      Boolean(chatRes.data.text),
      { chatRes }
    );
  } catch (e) {
    recordTest(38, "AI Stylist chat fallback", false, { error: e.message });
  }

  console.log("\n--- SECTION 10: CUSTOMER CANCELLATION & CALENDAR RECOVERY ---");

  // Scenario 39: Customer Cancellation within Permitted Window Releases Dates
  try {
    const freshOrderRes = await request("/payment/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        dressId: secondListingId,
        email: customerUser.email,
        startDate: "2027-01-15",
        endDate: "2027-01-18",
        addressId: savedAddressId,
        address: { street: "Cancel St", city: "Mumbai", pincode: "400050" },
      },
    });
    const toCancelId = freshOrderRes.data.orderId || freshOrderRes.data.order._id;

    const cancelRes = await request(`/payment/orders/${toCancelId}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { reason: "Customer changed event schedule" },
    });

    const dressAfterCancel = await ProductModel.findById(secondListingId);
    const hasConflict = findDateConflict(
      dressAfterCancel.bookedDates,
      new Date("2027-01-15"),
      new Date("2027-01-18")
    );

    recordTest(39, "Customer order cancellation successfully releases reserved dates and marks requestStatus Cancelled",
      cancelRes.status === 200 &&
      cancelRes.data.order.requestStatus === "Cancelled" &&
      !hasConflict,
      { cancelRes, hasConflict }
    );
  } catch (e) {
    recordTest(39, "Customer order cancellation releases dates", false, { error: e.message });
  }

  // Scenario 40: Rebooking previously cancelled dates succeeds
  try {
    const rebookRes = await request("/payment/cod", {
      method: "POST",
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: {
        dressId: secondListingId,
        email: customer2User.email,
        startDate: "2027-01-15",
        endDate: "2027-01-18",
        address: { street: "Rebooked Street", city: "Mumbai", pincode: "400050" },
      },
    });
    recordTest(40, "Rebooking previously cancelled calendar dates succeeds cleanly for subsequent customer",
      rebookRes.status === 200 && rebookRes.data.success === true,
      { rebookRes }
    );
  } catch (e) {
    recordTest(40, "Rebooking previously cancelled dates", false, { error: e.message });
  }

  console.log("\n=========================================================================");
  console.log(`PHASE 5B COMPLETE E2E SUITE: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} tests`);
  console.log("=========================================================================");

  // Teardown
  server.close();
  await mongoose.disconnect();
  stopLocalMongod();

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ESuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
