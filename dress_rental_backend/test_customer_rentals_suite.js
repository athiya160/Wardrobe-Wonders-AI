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

const PORT = 4031;
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

async function runCustomerRentalsSuite() {
  console.log("\n=======================================================");
  console.log("   DRESSR STEP 11: CUSTOMER RENTALS DASHBOARD SUITE   ");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startTestServer();

  let tokenProv = "";
  let tokenCustA = "";
  let tokenCustB = "";
  let listingId = "";
  let order1Id = "";
  let order2Id = "";

  try {
    const timestamp = Date.now();
    const emailProv = `prov_step11_${timestamp}@test.com`;
    const emailCustA = `cust_a_step11_${timestamp}@test.com`;
    const emailCustB = `cust_b_step11_${timestamp}@test.com`;

    // 1. Provision Provider and Two Customers
    const regProv = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Couture House", email: emailProv, password: "Password123!", role: "provider" }),
    });
    tokenProv = (await regProv.json()).token;

    const regCustA = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ananya Sharma", email: emailCustA, password: "Password123!", role: "customer" }),
    });
    tokenCustA = (await regCustA.json()).token;

    const regCustB = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rohan Kapoor", email: emailCustB, password: "Password123!", role: "customer" }),
    });
    tokenCustB = (await regCustB.json()).token;

    assert(Boolean(tokenProv && tokenCustA && tokenCustB), "Setup: Registered Provider and Customers A & B");

    // 2. Create Dress Listing
    const listRes = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenProv}` },
      body: JSON.stringify({
        title: "Crimson Silk Bridal Lehenga",
        category: "Bridal",
        rentalPricePerDay: 4500,
        securityDeposit: 8000,
        images: ["/assets/Bride.jpg"],
        condition: "Pristine",
      }),
    });
    const listData = await listRes.json();
    listingId = listData.listing._id;
    assert(listRes.status === 201 && Boolean(listingId), "Provider listed garment");

    // ==========================================
    // TEST 1: Customer A Places Rental Request
    // ==========================================
    console.log("\n--- TEST 1: Customer A Places Rental Request ---");
    const orderRes = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCustA,
        dressId: listingId,
        quantity: 3,
        startDate: "2026-12-10",
        endDate: "2026-12-13",
        totalAmount: 21500,
        address: { street: "MG Road", city: "Bangalore", zip: "560001" },
      }),
    });
    const orderData = await orderRes.json();
    order1Id = orderData.orderId;
    assert(orderRes.status === 200 && Boolean(order1Id), "Customer A booked dress for Dec 10-13");

    // Check dates are blocked on product
    const checkBlocked = await fetch(`${BASE_URL}/products/${listingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2026-12-11", endDate: "2026-12-12" }),
    });
    const blockedData = await checkBlocked.json();
    assert(blockedData.available === false, "Dec 10-13 dates confirmed blocked on product calendar");

    // ==========================================
    // TEST 2: Customer A Fetches /payment/my-rentals
    // ==========================================
    console.log("\n--- TEST 2: Authenticated /payment/my-rentals Retrieval ---");
    const myRentalsRes = await fetch(`${BASE_URL}/payment/my-rentals`, {
      headers: { Authorization: `Bearer ${tokenCustA}` },
    });
    const myRentalsData = await myRentalsRes.json();
    assert(myRentalsRes.status === 200 && myRentalsData.success === true, "GET /payment/my-rentals returns HTTP 200");
    assert(Array.isArray(myRentalsData.orders) && myRentalsData.orders.length === 1, "Customer A has exactly 1 rental in list");

    const fetchedOrder = myRentalsData.orders[0];
    assert(fetchedOrder._id === order1Id, "Fetched rental order ID matches placed order");
    assert(fetchedOrder.requestStatus === "Pending", "Initial requestStatus is 'Pending'");
    assert(Boolean(fetchedOrder.product && fetchedOrder.product.title === "Crimson Silk Bridal Lehenga"), "Product details populated on rental");
    assert(Boolean(fetchedOrder.providerId), "Provider details populated on rental");
    assert(fetchedOrder.rentalDays === 3, "Rental duration is 3 days");
    assert(fetchedOrder.securityDeposit === 8000, "Security deposit recorded as ₹8,000");

    // ==========================================
    // TEST 3: Unauthorized Access Prevention
    // ==========================================
    console.log("\n--- TEST 3: Auth Protection on /my-rentals ---");
    const unauthRes = await fetch(`${BASE_URL}/payment/my-rentals`);
    assert(unauthRes.status === 401, "Unauthenticated access to /my-rentals rejected (HTTP 401)");

    // Customer B's list should be empty
    const custBRes = await fetch(`${BASE_URL}/payment/my-rentals`, {
      headers: { Authorization: `Bearer ${tokenCustB}` },
    });
    const custBData = await custBRes.json();
    assert(custBData.orders.length === 0, "Customer B dashboard is completely isolated from Customer A (0 rentals)");

    // ==========================================
    // TEST 4: Customer Tampering Protection
    // ==========================================
    console.log("\n--- TEST 4: Cross-Customer Tampering Protection ---");
    const tamperedCancel = await fetch(`${BASE_URL}/payment/orders/${order1Id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenCustB}` },
    });
    assert(tamperedCancel.status === 403, "Customer B blocked from cancelling Customer A's order (HTTP 403)");

    // ==========================================
    // TEST 5: Customer A Cancels Pending Rental Request
    // ==========================================
    console.log("\n--- TEST 5: Customer A Cancels Pending Rental Request ---");
    const cancelRes = await fetch(`${BASE_URL}/payment/orders/${order1Id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenCustA}` },
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.success === true, "Cancel request returns HTTP 200");
    assert(cancelData.order.requestStatus === "Cancelled", "Order requestStatus changed to 'Cancelled'");
    assert(cancelData.order.status === "Cancelled", "Order status synchronized to 'Cancelled'");
    assert(cancelData.order.cancelledBy === "customer", "cancelledBy recorded as 'customer'");
    assert(Boolean(cancelData.order.cancelledAt), "cancelledAt timestamp recorded");

    // ==========================================
    // TEST 6: Immediate Calendar Restoration
    // ==========================================
    console.log("\n--- TEST 6: Calendar Restoration After Cancellation ---");
    const checkRestored = await fetch(`${BASE_URL}/products/${listingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2026-12-10", endDate: "2026-12-13" }),
    });
    const restoredData = await checkRestored.json();
    assert(restoredData.available === true, "Dec 10-13 dates are immediately available again on calendar!");

    // Customer B can now book the newly freed dates
    const order2Res = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCustB,
        dressId: listingId,
        quantity: 3,
        startDate: "2026-12-10",
        endDate: "2026-12-13",
        totalAmount: 21500,
        address: { street: "Brigade Road", city: "Bangalore", zip: "560025" },
      }),
    });
    const order2Data = await order2Res.json();
    order2Id = order2Data.orderId;
    assert(order2Res.status === 200 && Boolean(order2Id), "Customer B successfully booked the released dates!");

    // ==========================================
    // TEST 7: Duplicate Cancellation Guard
    // ==========================================
    console.log("\n--- TEST 7: Duplicate Cancellation Guard ---");
    const dupCancel = await fetch(`${BASE_URL}/payment/orders/${order1Id}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenCustA}` },
    });
    assert(dupCancel.status === 400, "Duplicate cancellation returns HTTP 400");

  } catch (err) {
    console.error("Test execution error:", err.message);
    failCount++;
  } finally {
    // Cleanup
    if (listingId) await ProductModel.deleteMany({ _id: listingId });
    const orderIds = [order1Id, order2Id].filter(Boolean);
    if (orderIds.length > 0) await OrderModel.deleteMany({ _id: { $in: orderIds } });
    await UserModel.deleteMany({ email: { $regex: /step11/ } });
    console.log("\nCleaned up test data.");

    if (server) server.close();
    await mongoose.disconnect();

    console.log("\n=======================================================");
    console.log(`  TOTAL: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("=======================================================\n");

    process.exit(failCount > 0 ? 1 : 0);
  }
}

runCustomerRentalsSuite();
