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
import UserRouter from "./routes/user.router.js";
import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import uploadRouter from "./routes/upload.router.js";
import { PaymentRouter } from "./routes/payment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 4020;
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
  app.use("/provider/upload", (req, res, next) => {
    req.url = "/provider";
    uploadRouter(req, res, next);
  });
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
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

async function runRentalLifecycleSuite() {
  console.log("\n=======================================================");
  console.log("   DRESSR STEPS 6-9: UPLOAD, AI & RENTAL LIFECYCLE    ");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startTestServer();

  let providerToken = "";
  let customerToken = "";
  let providerUser = null;
  let customerUser = null;
  let testListingId = "";
  let testOrderId = "";

  try {
    // Clean prior test artifacts
    await UserModel.deleteMany({ email: { $in: ["step69_prov@test.com", "step69_cust@test.com"] } });

    // Setup Provider & Customer
    const provReg = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Boutique Aurora",
        email: "step69_prov@test.com",
        password: "Password123!",
        role: "provider",
      }),
    });
    const provData = await provReg.json();
    providerToken = provData.token;
    providerUser = provData.user;

    const custReg = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Priya Sharma",
        email: "step69_cust@test.com",
        password: "Password123!",
        role: "customer",
      }),
    });
    const custData = await custReg.json();
    customerToken = custData.token;
    customerUser = custData.user;

    assert(Boolean(providerToken && customerToken), "Provider and Customer test accounts registered with JWT");

    // ==========================================
    // STEP 6 TESTS: Cloud Image Upload
    // ==========================================
    console.log("\n--- STEP 6: Cloud Image Upload & Storage ---");

    // Test 1: Multipart image upload via FormData
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const dummyImageContent = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const bodyParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="images"; filename="test_bridal_dress.png"\r\n`,
      `Content-Type: image/png\r\n\r\n`,
    ];
    const headerBuffer = Buffer.from(bodyParts.join(""));
    const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([headerBuffer, dummyImageContent, footerBuffer]);

    const uploadRes = await fetch(`${BASE_URL}/upload/provider`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${providerToken}`,
      },
      body: multipartBody,
    });
    const uploadData = await uploadRes.json();

    assert(uploadRes.status === 200, "Provider image upload returns HTTP 200");
    assert(uploadData.status === true, "Upload response status is true");
    assert(Array.isArray(uploadData.urls) && uploadData.urls.length > 0, "Uploaded URLs array returned");
    assert(typeof uploadData.primaryUrl === "string", "Primary image URL identified");
    assert(["cloudinary", "local_disk"].includes(uploadData.storage), `Storage mode confirmed: ${uploadData.storage}`);

    const uploadedImageUrl = uploadData.primaryUrl;

    // Test 2: Reject non-image file
    const txtParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="images"; filename="malicious.txt"\r\n`,
      `Content-Type: text/plain\r\n\r\n`,
      `Plain text file`,
      `\r\n--${boundary}--\r\n`,
    ];
    const badUploadRes = await fetch(`${BASE_URL}/upload/provider`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${providerToken}`,
      },
      body: txtParts.join(""),
    });
    assert(badUploadRes.status === 400, "Non-image upload rejected with HTTP 400");

    // ==========================================
    // STEP 7 TESTS: AI Description & Auto-Tags
    // ==========================================
    console.log("\n--- STEP 7: AI Description & Auto-Tags ---");

    const aiDescRes = await fetch(`${BASE_URL}/provider/ai/generate-description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        productName: "Crimson Velvet Royal Lehenga",
        category: "Wedding",
        price: 3500,
        brand: "Sabyasachi Heritage",
      }),
    });
    const aiDescData = await aiDescRes.json();

    assert(aiDescRes.status === 200, "AI generate-description returns HTTP 200");
    assert(aiDescData.status === true, "AI description response status is true");
    assert(typeof aiDescData.data.title === "string" && aiDescData.data.title.length > 5, "AI generated compelling title");
    assert(typeof aiDescData.data.description === "string" && aiDescData.data.description.length > 20, "AI generated rich editorial description");
    assert(Array.isArray(aiDescData.data.tags) && aiDescData.data.tags.length > 0, "AI generated search tags array");
    assert(typeof aiDescData.data.occasion === "string", "AI identified recommended occasion");

    const aiTagsRes = await fetch(`${BASE_URL}/provider/ai/generate-tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        productName: "Crimson Velvet Royal Lehenga",
        category: "Wedding",
        description: "Intricate zari embroidery with royal maroon velvet drape for winter wedding.",
      }),
    });
    const aiTagsData = await aiTagsRes.json();

    assert(aiTagsRes.status === 200, "AI generate-tags returns HTTP 200");
    assert(aiTagsData.status === true, "AI tags response status is true");
    assert(Boolean(aiTagsData.data.color), `AI extracted garment color: ${aiTagsData.data.color}`);
    assert(Boolean(aiTagsData.data.pattern), `AI extracted garment pattern: ${aiTagsData.data.pattern}`);
    assert(Boolean(aiTagsData.data.style), `AI extracted garment style: ${aiTagsData.data.style}`);
    assert(Boolean(aiTagsData.data.season), `AI extracted garment season: ${aiTagsData.data.season}`);

    // Create a listing using the uploaded image and AI-generated content
    const createListingRes = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        title: aiDescData.data.title,
        category: "Wedding",
        rentalPricePerDay: 2500,
        securityDeposit: 5000,
        images: [uploadedImageUrl],
        description: aiDescData.data.description,
        tags: aiDescData.data.tags,
        occasion: aiDescData.data.occasion,
        color: aiTagsData.data.color,
        pattern: aiTagsData.data.pattern,
        style: aiTagsData.data.style,
        season: aiTagsData.data.season,
      }),
    });
    const createdListing = await createListingRes.json();
    testListingId = createdListing.listing._id;

    assert(createListingRes.status === 201, "Provider dress listing created with uploaded image and AI attributes");

    // ==========================================
    // STEP 8 TESTS: Rental Dates & Availability Calendar
    // ==========================================
    console.log("\n--- STEP 8: Rental Dates & Availability Calendar ---");

    // Check availability for open dates
    const checkOpenRes = await fetch(`${BASE_URL}/products/${testListingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: "2026-10-15",
        endDate: "2026-10-19",
      }),
    });
    const checkOpenData = await checkOpenRes.json();

    assert(checkOpenRes.status === 200, "Check availability returns HTTP 200");
    assert(checkOpenData.available === true, "Dates 2026-10-15 to 2026-10-19 are confirmed available");
    assert(checkOpenData.days === 4, "Rental duration accurately calculated as 4 days");
    assert(checkOpenData.estimatedRentalFee === 2500 * 4, "Rental fee accurately calculated (₹10,000)");
    assert(checkOpenData.totalEstimated === 10000 + 5000, "Total accurately includes security deposit (₹15,000)");

    // ==========================================
    // STEP 9 TESTS: Customer Rental Request Pipeline
    // ==========================================
    console.log("\n--- STEP 9: Customer Rental Request Pipeline ---");

    // Customer places rental request via COD
    const orderRes = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "step69_cust@test.com",
        dressId: testListingId,
        quantity: 4,
        startDate: "2026-10-15",
        endDate: "2026-10-19",
        totalAmount: 15000,
        address: {
          street: "12 Marine Drive",
          city: "Mumbai",
          zip: "400020",
          houseNo: "Flat 4B",
          landmark: "Opposite Promenade",
        },
      }),
    });
    const orderData = await orderRes.json();

    assert(orderRes.status === 200, "Customer rental request placed successfully");
    assert(orderData.success === true, "Rental order returned success true");
    testOrderId = orderData.orderId;

    // Verify product availability calendar now reflects the reservation
    const calendarRes = await fetch(`${BASE_URL}/products/${testListingId}/availability`);
    const calendarData = await calendarRes.json();

    assert(calendarRes.status === 200, "Product availability calendar returns HTTP 200");
    assert(calendarData.bookedDates.length >= 1, "Calendar contains booked date range");

    // Verify date conflict detection blocks overlapping rental request
    const conflictRes = await fetch(`${BASE_URL}/products/${testListingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: "2026-10-17", // overlaps with 10-15 to 10-19
        endDate: "2026-10-21",
      }),
    });
    const conflictData = await conflictRes.json();

    assert(conflictData.available === false, "Overlapping rental dates rejected (conflict detected)");
    assert(Boolean(conflictData.conflict), "Conflicting booked interval identified in response");

    // Verify Provider can view incoming rental requests in Studio
    const provOrdersRes = await fetch(`${BASE_URL}/provider/orders`, {
      method: "GET",
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    const provOrdersData = await provOrdersRes.json();

    assert(provOrdersRes.status === 200, "Provider orders endpoint returns HTTP 200");
    assert(provOrdersData.orders.length >= 1, "Incoming rental request visible to provider");
    assert(provOrdersData.orders[0].requestStatus === "Pending", "Rental request status initialized as 'Pending'");
    assert(provOrdersData.orders[0].rentalDays === 4, "Order stores accurate rental duration in days");

    // Provider accepts the rental request
    const acceptRes = await fetch(`${BASE_URL}/provider/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({ status: "Accepted" }),
    });
    const acceptData = await acceptRes.json();

    assert(acceptRes.status === 200, "Provider accepts rental request with HTTP 200");
    assert(acceptData.order.requestStatus === "Accepted", "Order requestStatus successfully updated to 'Accepted'");
    assert(acceptData.order.status === "Confirmed", "Order main status synchronized to 'Confirmed'");

  } catch (err) {
    console.error("Test execution error:", err);
    failCount++;
  } finally {
    // Cleanup
    await ProductModel.deleteMany({ _id: testListingId });
    await OrderModel.deleteMany({ userEmail: "step69_cust@test.com" });
    await UserModel.deleteMany({ email: { $in: ["step69_prov@test.com", "step69_cust@test.com"] } });
    console.log("\nCleaned up test data.");

    if (server) {
      server.close();
    }
    await mongoose.disconnect();

    console.log("\n=======================================================");
    console.log(`  TOTAL: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("=======================================================\n");

    process.exit(failCount > 0 ? 1 : 0);
  }
}

runRentalLifecycleSuite();
