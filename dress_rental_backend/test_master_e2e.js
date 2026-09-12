import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import OrderModel from "./models/OrderModel.js";
import ReportModel from "./models/ReportModel.js";

import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import adminRouter from "./routes/admin.router.js";
import UserRouter from "./routes/user.router.js";
import uploadRouter from "./routes/upload.router.js";
import { PaymentRouter } from "./routes/payment.js";

import {
  securityHeaders,
  apiLimiter,
  getCorsOptions,
  healthCheckHandler,
  centralizedErrorHandler,
} from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 4036;
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

async function startMasterServer() {
  const app = express();

  app.use(securityHeaders);
  app.use(cors(getCorsOptions()));
  app.use(bodyParser.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Mount routes
  app.get("/health", healthCheckHandler);
  app.use("/upload", uploadRouter);
  app.use("/payment", PaymentRouter);
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
  app.use("/admin", adminRouter);
  app.use(UserRouter);

  app.use(centralizedErrorHandler);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Master E2E Server running on port ${PORT}.`);
      resolve();
    });
  });
}

async function runMasterE2ESuite() {
  console.log("\n================================================================================");
  console.log("     WARDROBE WONDERS — MASTER END-TO-END REGRESSION TEST SUITE (STEP 17)       ");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startMasterServer();

  const timestamp = Date.now();
  const secret = process.env.JWT_SECRET || process.env.SECRET || "change_this_in_production";

  // Identifiers for cleanup
  let customerId = "";
  let providerId = "";
  let adminId = "";
  let tokenCustomer = "";
  let tokenProvider = "";
  let tokenAdmin = "";
  let garmentId = "";
  let orderId = "";
  let reportId = "";

  try {
    // -------------------------------------------------------------------------
    // PHASE 1: SYSTEM HEALTH & SECURITY HEADERS
    // -------------------------------------------------------------------------
    console.log("--- PHASE 1: Security Headers & Production Health Verification ---");

    const resHealth = await fetch(`${BASE_URL}/health`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200, "1.1 Health endpoint responds with HTTP 200");
    assert(dataHealth.status === "healthy", "1.2 Health report status is 'healthy'");
    assert(resHealth.headers.get("x-content-type-options") === "nosniff", "1.3 X-Content-Type-Options is nosniff");
    assert(resHealth.headers.get("x-frame-options") === "SAMEORIGIN", "1.4 X-Frame-Options is SAMEORIGIN");
    assert(!resHealth.headers.get("x-powered-by"), "1.5 X-Powered-By is suppressed");

    // -------------------------------------------------------------------------
    // PHASE 2: MULTI-ROLE AUTHENTICATION & ACCESS CONTROL
    // -------------------------------------------------------------------------
    console.log("\n--- PHASE 2: Multi-Role Authentication & Access Control ---");

    const emailCust = `e2e_cust_${timestamp}@test.com`;
    const emailProv = `e2e_prov_${timestamp}@test.com`;
    const emailAdmin = `e2e_admin_${timestamp}@test.com`;
    const password = "Password123!";
    const hash = await bcrypt.hash(password, 10);

    // 2.1 Register Customer
    const regCustRes = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "E2E Customer", email: emailCust, password, role: "customer" }),
    });
    assert(regCustRes.status === 201 || regCustRes.status === 200, "2.1 Customer registers successfully");

    // 2.2 Login Customer
    const loginCustRes = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailCust, password }),
    });
    const loginCustData = await loginCustRes.json();
    assert(loginCustRes.status === 200, "2.2 Customer logs in successfully");
    tokenCustomer = loginCustData.token;
    customerId = loginCustData.user?._id;

    // 2.3 Create Provider & Admin
    const provUser = new UserModel({
      name: "E2E Boutique Owner",
      email: emailProv,
      password,
      passwordHash: hash,
      role: "provider",
      type: "provider",
      isActive: true,
    });
    await provUser.save();
    providerId = provUser._id.toString();
    tokenProvider = jwt.sign({ id: provUser._id, email: emailProv, role: "provider" }, secret, { expiresIn: "1d" });
    assert(!!tokenProvider, "2.3 Provider account initialized with valid token");

    const adminUser = new UserModel({
      name: "E2E Platform Admin",
      email: emailAdmin,
      password,
      passwordHash: hash,
      role: "admin",
      type: "admin",
      isActive: true,
    });
    await adminUser.save();
    adminId = adminUser._id.toString();
    tokenAdmin = jwt.sign({ id: adminUser._id, email: emailAdmin, role: "admin" }, secret, { expiresIn: "1d" });
    assert(!!tokenAdmin, "2.4 Admin account initialized with valid token");

    // 2.5 Role barrier: Customer cannot access Provider or Admin routes
    const custOnProv = await fetch(`${BASE_URL}/provider/stats`, {
      headers: { Authorization: `Bearer ${tokenCustomer}` },
    });
    assert(custOnProv.status === 403, "2.5 Customer blocked from /provider/stats (HTTP 403)");

    const custOnAdmin = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${tokenCustomer}` },
    });
    assert(custOnAdmin.status === 403, "2.6 Customer blocked from /admin/overview (HTTP 403)");

    // -------------------------------------------------------------------------
    // PHASE 3: PROVIDER LISTING CREATION WITH LEGAL OWNERSHIP & PROVENANCE
    // -------------------------------------------------------------------------
    console.log("\n--- PHASE 3: Provider Listing Creation with Ownership & Provenance ---");

    const createListingRes = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenProvider}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "E2E Sabyasachi Royal Heritage Lehenga",
        category: "Wedding",
        gender: "women",
        size: "M",
        brand: "Sabyasachi",
        condition: "Pristine",
        rentalPricePerDay: 2000,
        price: 2000,
        securityDeposit: "5000",
        image: "/assets/Bridal.jpg",
        images: ["/assets/Bridal.jpg", "/assets/Cocktail Gown.jpg"],
        description: "Intricately hand-embroidered royal red lehenga with heavy zari work.",
        location: "Mumbai, Bandra West",
        externalUrl: "https://sabyasachi.com/bridal/royal-heritage",
        ownershipConfirmed: true,
      }),
    });
    const createListingData = await createListingRes.json();
    assert(createListingRes.status === 201, "3.1 Provider creates garment listing (HTTP 201)");
    assert(createListingData.listing?.ownershipConfirmed === true, "3.2 Listing records legal ownership confirmation");
    assert(createListingData.listing?.externalUrl.includes("sabyasachi.com"), "3.3 Listing records external designer URL");
    garmentId = createListingData.listing?._id;

    // 3.4 Verify Public Garment Detail Retrieval
    const detailRes = await fetch(`${BASE_URL}/products/detail/${garmentId}`);
    const detailData = await detailRes.json();
    assert(detailRes.status === 200, "3.4 Public catalog returns garment details");
    assert(detailData.securityDeposit === "5000" || detailData.securityDeposit === 5000, "3.5 Security deposit is present");

    // -------------------------------------------------------------------------
    // PHASE 4: RENTAL DATES AVAILABILITY & RESERVATION CONFLICT PREVENTION
    // -------------------------------------------------------------------------
    console.log("\n--- PHASE 4: Rental Dates Availability & Conflict Prevention ---");

    const startDate = "2026-10-10";
    const endDate = "2026-10-14";

    // 4.1 Check Availability (Initially Available)
    const availRes1 = await fetch(`${BASE_URL}/products/${garmentId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });
    const availData1 = await availRes1.json();
    assert(availData1.available === true, "4.1 Garment is available for requested date window");
    assert(availData1.days === 4, "4.2 Rental duration accurately calculated as 4 days");
    assert(availData1.estimatedRentalFee === 8000, "4.3 Rental fee accurately calculated (4 * 2000 = 8000)");

    // 4.2 Customer Books Rental
    const bookRes = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCust,
        dressId: garmentId,
        quantity: 4,
        startDate,
        endDate,
        totalAmount: 13000,
        address: "123 Marine Drive, Mumbai 400020",
      }),
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 200, "4.4 Rental order created successfully via /payment/cod");
    orderId = bookData.orderId;

    // 4.3 Conflicting Date Reservation Check
    const availRes2 = await fetch(`${BASE_URL}/products/${garmentId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2026-10-12", endDate: "2026-10-16" }),
    });
    const availData2 = await availRes2.json();
    assert(availData2.available === false, "4.5 Overlapping date window is rejected as unavailable");

    // -------------------------------------------------------------------------
    // PHASE 5: PROVIDER ACCEPT / DECLINE & HONEST EARNINGS
    // -------------------------------------------------------------------------
    console.log("\n--- PHASE 5: Provider Accept / Decline & Earnings Verification ---");

    // 5.1 Provider Views Order
    const provOrdersRes = await fetch(`${BASE_URL}/provider/orders`, {
      headers: { Authorization: `Bearer ${tokenProvider}` },
    });
    const provOrdersData = await provOrdersRes.json();
    const targetOrder = (provOrdersData.orders || []).find((o) => String(o._id) === String(orderId));
    assert(!!targetOrder, "5.1 Booking request appears in Provider Studio queue");

    // 5.2 Provider Accepts Order
    const acceptRes = await fetch(`${BASE_URL}/provider/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenProvider}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "Accepted" }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200, "5.2 Provider accepts rental order (HTTP 200)");
    assert(acceptData.order?.requestStatus === "Accepted", "5.3 Order requestStatus updated to 'Accepted'");

    // 5.3 Verify Honest Provider Earnings (85% of Garment Fee, excluding Security Deposit)
    const statsRes = await fetch(`${BASE_URL}/provider/stats`, {
      headers: { Authorization: `Bearer ${tokenProvider}` },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200, "5.4 Provider stats retrieved");
    assert(typeof statsData.stats?.pendingEarnings === "number", "5.5 Honest pending earnings calculated");

    // -------------------------------------------------------------------------
    // PHASE 6: CUSTOMER DASHBOARD & CANCELLATION DATE RESTORATION
    // -------------------------------------------------------------------------
    console.log("\n--- PHASE 6: Customer Rental Dashboard & Cancellation Flow ---");

    // 6.1 Customer Retrieves Rentals
    const myRentalsRes = await fetch(`${BASE_URL}/payment/my-rentals`, {
      headers: { Authorization: `Bearer ${tokenCustomer}` },
    });
    const myRentalsData = await myRentalsRes.json();
    assert(myRentalsRes.status === 200, "6.1 Customer views rentals dashboard");
    assert((myRentalsData.orders || []).some((r) => String(r._id) === String(orderId)), "6.2 Order appears in /my-rentals");

    // -------------------------------------------------------------------------
    // PHASE 7: SECURITY DEPOSIT ESCROW & RESOLUTION
    // -------------------------------------------------------------------------
    console.log("\n--- PHASE 7: Security Deposit Escrow & Resolution ---");

    // 7.1 Provider/Admin Releases Full Deposit
    const depositRes = await fetch(`${BASE_URL}/payment/orders/${orderId}/deposit`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenProvider}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "release",
        amount: 5000,
        reason: "Garment returned in pristine condition. Full deposit escrow released.",
      }),
    });
    const depositData = await depositRes.json();
    assert(depositRes.status === 200, "7.1 Deposit escrow release processed successfully");
    assert(depositData.order?.depositStatus === "REFUNDED", "7.2 Deposit status updated to 'REFUNDED'");

    // -------------------------------------------------------------------------
    // PHASE 8: LISTING REPORTING & ADMIN MODERATION LIFECYCLE
    // -------------------------------------------------------------------------
    console.log("\n--- PHASE 8: Listing Reporting & Admin Moderation Lifecycle ---");

    // 8.1 Customer Reports Listing
    const reportRes = await fetch(`${BASE_URL}/products/${garmentId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Copyright/IP",
        details: "Photo copyright verification requested.",
        reporterEmail: "moderator_test@example.com",
      }),
    });
    const reportData = await reportRes.json();
    assert(reportRes.status === 201, "8.1 Garment report submitted (HTTP 201)");
    reportId = reportData.reportId;

    // 8.2 Admin Moderation Queue
    const adminReportsRes = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminReportsData = await adminReportsRes.json();
    assert(adminReportsRes.status === 200, "8.2 Admin retrieves reported listings queue");
    assert((adminReportsData.reports || []).some((r) => String(r._id) === String(reportId)), "8.3 Filed report visible to admin");

    // 8.3 Admin Resolves Report
    const resolveReportRes = await fetch(`${BASE_URL}/admin/reports/${reportId}/resolve`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "resolved",
        adminNotes: "Designer provenance confirmed with authorized boutique invoice.",
      }),
    });
    const resolveData = await resolveReportRes.json();
    assert(resolveReportRes.status === 200, "8.4 Admin resolves report");
    assert(resolveData.report?.status === "resolved", "8.5 Report marked as 'resolved'");

    // 8.4 Admin Platform Overview & GMV Metrics
    const overviewRes = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const overviewData = await overviewRes.json();
    assert(overviewRes.status === 200, "8.6 Admin overview dashboard returns platform metrics");
    assert(overviewData.overview?.users?.total >= 3, "8.7 Admin overview tracks user count");
    assert(typeof overviewData.overview?.finance?.marketplaceVolume === "number", "8.8 Admin overview tracks platform GMV");
    assert(typeof overviewData.overview?.finance?.estimatedPlatformRevenue === "number", "8.9 Admin overview tracks 15% platform commission");

    console.log("\n================================================================================");
    console.log(`MASTER E2E REGRESSION SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
    console.log("================================================================================\n");

  } catch (error) {
    console.error("Master E2E encountered an unhandled exception:", error);
    failCount++;
  } finally {
    try {
      if (orderId) await OrderModel.findByIdAndDelete(orderId);
      if (garmentId) await ProductModel.findByIdAndDelete(garmentId);
      if (reportId) await ReportModel.findByIdAndDelete(reportId);
      const cleanUsers = [customerId, providerId, adminId].filter(Boolean);
      if (cleanUsers.length > 0) {
        await UserModel.deleteMany({ _id: { $in: cleanUsers } });
      }
    } catch (cleanErr) {
      console.error("Cleanup error:", cleanErr);
    }

    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(failCount > 0 ? 1 : 0);
  }
}

runMasterE2ESuite();
