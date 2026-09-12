import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import OrderModel from "./models/OrderModel.js";
import ReportModel from "./models/ReportModel.js";
import UserRouter from "./routes/user.router.js";
import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import uploadRouter from "./routes/upload.router.js";
import adminRouter from "./routes/admin.router.js";
import { PaymentRouter } from "./routes/payment.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 4033;
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
  app.use(cors());
  app.use(bodyParser.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use("/upload", uploadRouter);
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
  app.use("/admin", adminRouter);
  app.use("/payment", PaymentRouter);
  app.use(UserRouter);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}.`);
      resolve();
    });
  });
}

async function runAdminModerationSuite() {
  console.log("\n=======================================================");
  console.log("   DRESSR STEP 13: ADMIN MODERATION & GOVERNANCE SUITE ");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startTestServer();

  let tokenAdmin = "";
  let tokenCust = "";
  let tokenProv = "";
  let adminId = "";
  let custId = "";
  let listingId = "";
  let reportId = "";

  try {
    const timestamp = Date.now();
    const emailAdmin = `admin_step13_${timestamp}@test.com`;
    const emailCust = `cust_step13_${timestamp}@test.com`;
    const emailProv = `prov_step13_${timestamp}@test.com`;

    const hash = await bcrypt.hash("Password123!", 10);
    const adminUser = new UserModel({
      name: "Platform SuperAdmin",
      email: emailAdmin,
      password: "Password123!",
      passwordHash: hash,
      role: "admin",
      type: "admin",
      isActive: true,
    });
    await adminUser.save();
    adminId = adminUser._id.toString();

    const secret = process.env.JWT_SECRET || process.env.SECRET || "change_this_in_production";
    tokenAdmin = jwt.sign({ id: adminUser._id, email: emailAdmin, role: "admin" }, secret, { expiresIn: "1d" });

    // Register Customer and Provider
    const regCust = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kareena Kapoor", email: emailCust, password: "Password123!", role: "customer" }),
    });
    const custData = await regCust.json();
    tokenCust = custData.token;
    custId = custData.user._id;

    const regProv = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Manish Malhotra Atelier", email: emailProv, password: "Password123!", role: "provider" }),
    });
    tokenProv = (await regProv.json()).token;

    assert(Boolean(tokenAdmin && tokenCust && tokenProv), "Setup: Provisioned Admin, Customer, and Provider");

    // Create a dress listing
    const listRes = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenProv}` },
      body: JSON.stringify({
        title: "Crystal Embellished Evening Gown",
        category: "Party",
        rentalPricePerDay: 5000,
        securityDeposit: 7500,
        images: ["/assets/Cocktail Gown.jpg"],
        condition: "Pristine",
      }),
    });
    const listData = await listRes.json();
    listingId = listData.listing._id;
    assert(listRes.status === 201 && Boolean(listingId), "Provider listed garment");

    // ==========================================
    // TEST 1: Strict Admin Role-Gate Authorization
    // ==========================================
    console.log("\n--- TEST 1: Strict Role Gate & Access Barriers ---");
    const unauthRes = await fetch(`${BASE_URL}/admin/overview`);
    assert(unauthRes.status === 401, "Unauthenticated access rejected (HTTP 401)");

    const custBlocked = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${tokenCust}` },
    });
    assert(custBlocked.status === 403, "Customer access to /admin blocked with HTTP 403");

    const provBlocked = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${tokenProv}` },
    });
    assert(provBlocked.status === 403, "Provider access to /admin blocked with HTTP 403");

    const adminOk = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const overviewData = await adminOk.json();
    assert(adminOk.status === 200 && overviewData.success === true, "Admin successfully accessed /admin/overview (HTTP 200)");
    assert(overviewData.overview.users.total >= 3, "Overview counts total registered users");
    assert(overviewData.overview.listings.total >= 1, "Overview counts catalog listings");
    assert(overviewData.overview.finance.estimatedPlatformRevenue >= 0, "Overview tracks platform revenue metrics");

    // ==========================================
    // TEST 2: User Governance & Deactivation
    // ==========================================
    console.log("\n--- TEST 2: User Governance & Deactivation ---");
    const usersListRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const usersListData = await usersListRes.json();
    assert(usersListRes.status === 200 && Array.isArray(usersListData.users), "Admin lists users (HTTP 200)");

    // Deactivate Customer account
    const deactRes = await fetch(`${BASE_URL}/admin/users/${custId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ isActive: false }),
    });
    const deactData = await deactRes.json();
    assert(deactRes.status === 200 && deactData.user.isActive === false, "Customer account deactivated by Admin");

    // Deactivated customer is blocked from authenticated routes
    const blockedCustCall = await fetch(`${BASE_URL}/payment/my-rentals`, {
      headers: { Authorization: `Bearer ${tokenCust}` },
    });
    assert(blockedCustCall.status === 403, "Deactivated customer blocked by auth middleware (HTTP 403)");

    // Reactivate Customer account
    const reactRes = await fetch(`${BASE_URL}/admin/users/${custId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ isActive: true }),
    });
    assert(reactRes.status === 200 && (await reactRes.json()).user.isActive === true, "Customer account reactivated");

    // Admin self-deactivation guard
    const selfDeact = await fetch(`${BASE_URL}/admin/users/${adminId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ isActive: false }),
    });
    assert(selfDeact.status === 400, "Admin prevented from self-deactivation (HTTP 400)");

    // ==========================================
    // TEST 3: Inventory Moderation
    // ==========================================
    console.log("\n--- TEST 3: Inventory Moderation Actions ---");
    const listingsRes = await fetch(`${BASE_URL}/admin/listings`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const listingsData = await listingsRes.json();
    assert(listingsRes.status === 200 && listingsData.listings.length >= 1, "Admin retrieves all marketplace listings");

    // Deactivate listing
    const modDeact = await fetch(`${BASE_URL}/admin/listings/${listingId}/moderate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ action: "deactivate" }),
    });
    const modDeactData = await modDeact.json();
    assert(modDeact.status === 200 && modDeactData.listing.status === "inactive", "Admin deactivated garment listing");

    // Restore listing
    const modRestore = await fetch(`${BASE_URL}/admin/listings/${listingId}/moderate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ action: "restore" }),
    });
    const modRestoreData = await modRestore.json();
    assert(modRestore.status === 200 && modRestoreData.listing.status === "active", "Admin restored garment listing");

    // ==========================================
    // TEST 4: Orders & Rentals Oversight
    // ==========================================
    console.log("\n--- TEST 4: Orders Oversight ---");
    const adminOrdersRes = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminOrdersData = await adminOrdersRes.json();
    assert(adminOrdersRes.status === 200 && Array.isArray(adminOrdersData.orders), "Admin views all marketplace orders");

    // ==========================================
    // TEST 5: Compliance Reports Management
    // ==========================================
    console.log("\n--- TEST 5: Compliance Reports Resolution ---");
    const newReport = new ReportModel({
      listingId: listingId,
      reporterEmail: emailCust,
      reason: "Copyright/IP",
      details: "Image appears to be copyrighted designer catalog photography without attribution",
      status: "pending",
    });
    await newReport.save();
    reportId = newReport._id.toString();

    const reportsRes = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const reportsData = await reportsRes.json();
    assert(reportsRes.status === 200 && reportsData.reports.some((r) => r._id === reportId), "Admin retrieves compliance reports");

    const resolveRes = await fetch(`${BASE_URL}/admin/reports/${reportId}/resolve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        status: "resolved",
        adminNotes: "Contacted provider; original photography verified",
        deactivateListing: false,
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200 && resolveData.report.status === "resolved", "Admin resolved compliance report");
    assert(Boolean(resolveData.report.resolvedAt), "resolvedAt timestamp recorded on report");

  } catch (err) {
    console.error("Test execution error:", err.message);
    failCount++;
  } finally {
    // Cleanup
    if (listingId) await ProductModel.deleteMany({ _id: listingId });
    if (reportId) await ReportModel.deleteMany({ _id: reportId });
    await UserModel.deleteMany({ email: { $regex: /step13/ } });
    console.log("\nCleaned up test data.");

    if (server) server.close();
    await mongoose.disconnect();

    console.log("\n=======================================================");
    console.log(`  TOTAL: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("=======================================================\n");

    process.exit(failCount > 0 ? 1 : 0);
  }
}

runAdminModerationSuite();
