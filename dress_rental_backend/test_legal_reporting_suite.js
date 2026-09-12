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
import ReportModel from "./models/ReportModel.js";
import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import adminRouter from "./routes/admin.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 4034;
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
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
  app.use("/admin", adminRouter);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Step 14 Test server running on port ${PORT}.`);
      resolve();
    });
  });
}

async function runLegalReportingSuite() {
  console.log("\n=======================================================");
  console.log("   DRESSR STEP 14: LEGAL, TRUST & REPORTING SUITE     ");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startTestServer();

  let tokenAdmin = "";
  let tokenProv = "";
  let adminId = "";
  let provId = "";
  let testProductId = "";
  let reportId = "";
  let newListingId = "";

  try {
    const timestamp = Date.now();
    const emailAdmin = `admin_trust_${timestamp}@test.com`;
    const emailProv = `prov_trust_${timestamp}@test.com`;
    const hash = await bcrypt.hash("Password123!", 10);
    const secret = process.env.JWT_SECRET || process.env.SECRET || "change_this_in_production";

    // 1. Create Admin User
    const adminUser = new UserModel({
      name: "Trust Safety Admin",
      email: emailAdmin,
      password: "Password123!",
      passwordHash: hash,
      role: "admin",
      type: "admin",
      isActive: true,
    });
    await adminUser.save();
    adminId = adminUser._id.toString();
    tokenAdmin = jwt.sign({ id: adminUser._id, email: emailAdmin, role: "admin" }, secret, { expiresIn: "1d" });

    // 2. Create Provider User
    const provUser = new UserModel({
      name: "Trust Safety Provider",
      email: emailProv,
      password: "Password123!",
      passwordHash: hash,
      role: "provider",
      type: "provider",
      isActive: true,
    });
    await provUser.save();
    provId = provUser._id.toString();
    tokenProv = jwt.sign({ id: provUser._id, email: emailProv, role: "provider" }, secret, { expiresIn: "1d" });

    // 3. Create a test garment listing
    const garment = new ProductModel({
      providerId: provUser._id,
      title: "Step 14 Designer Velvet Anarkali",
      name: "Step 14 Designer Velvet Anarkali",
      price: 1800,
      rentalPricePerDay: 1800,
      securityDeposit: 3500,
      advance: "3500",
      image: "/assets/Anarkali.jpg",
      images: ["/assets/Anarkali.jpg"],
      category: "Traditional",
      gender: "women",
      condition: "Pristine",
      externalUrl: "https://designerbrand.com/anarkali-velvet",
      ownershipConfirmed: true,
      status: "active",
    });
    await garment.save();
    testProductId = garment._id.toString();

    console.log("--- Section A: Garment Reporting Endpoint (`POST /products/:id/report`) ---");

    // Test 1: Submit report with valid data
    const res1 = await fetch(`${BASE_URL}/products/${testProductId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Copyright/IP",
        details: "Garment photo appears to be taken directly from high-fashion magazine editorial.",
        reporterEmail: "reporter@example.com",
      }),
    });
    const data1 = await res1.json();
    assert(res1.status === 201, "Valid report submission returns HTTP 201");
    assert(data1.success === true, "Report response returns success: true");
    assert(!!data1.reportId, "Report response returns valid reportId");
    reportId = data1.reportId;

    // Test 2: Reject report with invalid reason
    const res2 = await fetch(`${BASE_URL}/products/${testProductId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Completely Bogus Reason Not In Taxonomy",
        details: "Some text",
        reporterEmail: "reporter@example.com",
      }),
    });
    const data2 = await res2.json();
    assert(res2.status === 400, "Invalid report reason is rejected with HTTP 400");
    assert(data2.success === false, "Invalid report response returns success: false");

    // Test 3: Reject report with missing or invalid reporter email
    const res3 = await fetch(`${BASE_URL}/products/${testProductId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Misleading listing",
        details: "Condition was listed as new but looks worn",
        reporterEmail: "invalid-email-without-at-sign",
      }),
    });
    assert(res3.status === 400, "Invalid reporter email is rejected with HTTP 400");

    // Test 4: Reject report for non-existent product ID
    const fakeId = new mongoose.Types.ObjectId();
    const res4 = await fetch(`${BASE_URL}/products/${fakeId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Misleading listing",
        details: "Ghost product",
        reporterEmail: "reporter@example.com",
      }),
    });
    assert(res4.status === 404, "Report for non-existent garment returns HTTP 404");

    console.log("\n--- Section B: Admin Moderation Queue Verification ---");

    // Test 5: Admin can view newly filed report in moderation queue
    const res5 = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const data5 = await res5.json();
    assert(res5.status === 200, "Admin can retrieve reports with HTTP 200");
    const foundReport = (data5.reports || []).find((r) => String(r._id) === String(reportId));
    assert(!!foundReport, "Submitted report is present in admin moderation queue");
    assert(foundReport?.reason === "Copyright/IP", "Report preserves accurate reason code");

    // Test 6: Admin can resolve/review report
    const res6 = await fetch(`${BASE_URL}/admin/reports/${reportId}/resolve`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "resolved",
        adminNotes: "Provider provided authentic boutique purchase receipt.",
      }),
    });
    const data6 = await res6.json();
    assert(res6.status === 200, "Admin can update report status with HTTP 200");
    assert(data6.report?.status === "resolved", "Report status updated to 'resolved'");

    console.log("\n--- Section C: Provider Listing Ownership & External URL Validation ---");

    // Test 7: Reject listing with invalid external URL scheme
    const res7 = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenProv}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Garment With Malicious URL",
        category: "Traditional",
        gender: "women",
        size: "M",
        rentalPricePerDay: 1200,
        price: 1200,
        securityDeposit: "2500",
        image: "/assets/Blazer.jpg",
        externalUrl: "javascript:alert('xss')",
      }),
    });
    const data7 = await res7.json();
    assert(res7.status === 400, "Listing with invalid URL scheme is rejected with HTTP 400");
    assert(data7.message.includes("External reference URL must begin with http:// or https://"), "Rejection includes clear URL guideline message");

    // Test 8: Accept listing with valid external URL and ownership confirmation
    const res8 = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenProv}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Authentic Designer Tuxedo",
        category: "Formal",
        gender: "men",
        size: "42R",
        rentalPricePerDay: 2500,
        price: 2500,
        securityDeposit: "5000",
        image: "/assets/Men/men1.jpg",
        externalUrl: "https://armani.com/collection/classic-tuxedo",
        ownershipConfirmed: true,
      }),
    });
    const data8 = await res8.json();
    assert(res8.status === 201, "Listing with valid URL and ownership confirmation is accepted (HTTP 201)");
    assert(data8.listing?.externalUrl === "https://armani.com/collection/classic-tuxedo", "externalUrl persisted accurately");
    assert(data8.listing?.ownershipConfirmed === true, "ownershipConfirmed persisted as true");
    if (data8.listing?._id) newListingId = data8.listing._id.toString();

    console.log("\n--- Section D: Product Details Model Retrieval ---");

    // Test 9: Public detail endpoint returns externalUrl and ownership status
    const res9 = await fetch(`${BASE_URL}/products/detail/${testProductId}`);
    const data9 = await res9.json();
    assert(res9.status === 200, "Garment detail retrieved with HTTP 200");
    assert(data9.externalUrl === "https://designerbrand.com/anarkali-velvet", "Garment detail returns externalUrl for provenance display");
    assert(data9.ownershipConfirmed === true, "Garment detail returns ownershipConfirmed");

    console.log("\n=======================================================");
    console.log(`   TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("=======================================================\n");

  } catch (error) {
    console.error("Test execution encountered an error:", error);
    failCount++;
  } finally {
    try {
      const cleanIds = [testProductId, newListingId].filter(Boolean);
      if (cleanIds.length > 0) {
        await ProductModel.deleteMany({ _id: { $in: cleanIds } });
      }
      if (reportId) {
        await ReportModel.findByIdAndDelete(reportId);
      }
      const userIds = [adminId, provId].filter(Boolean);
      if (userIds.length > 0) {
        await UserModel.deleteMany({ _id: { $in: userIds } });
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

runLegalReportingSuite();
