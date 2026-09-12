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

const PORT = 4032;
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

async function runPaymentDepositSuite() {
  console.log("\n=======================================================");
  console.log("   DRESSR STEP 12: PAYMENT & DEPOSIT LIFECYCLE SUITE   ");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startTestServer();

  let tokenProv = "";
  let tokenCust = "";
  let tokenOther = "";
  let listingId = "";
  let order1Id = "";
  let order2Id = "";

  try {
    const timestamp = Date.now();
    const emailProv = `prov_step12_${timestamp}@test.com`;
    const emailCust = `cust_step12_${timestamp}@test.com`;
    const emailOther = `other_step12_${timestamp}@test.com`;

    // 1. Setup Accounts
    const regProv = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Heritage Couturiers", email: emailProv, password: "Password123!", role: "provider" }),
    });
    tokenProv = (await regProv.json()).token;

    const regCust = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Meera Sen", email: emailCust, password: "Password123!", role: "customer" }),
    });
    tokenCust = (await regCust.json()).token;

    const regOther = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauthorized User", email: emailOther, password: "Password123!", role: "customer" }),
    });
    tokenOther = (await regOther.json()).token;

    assert(Boolean(tokenProv && tokenCust && tokenOther), "Setup: Registered Provider and Customers");

    // 2. Create Dress Listing
    const listRes = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenProv}` },
      body: JSON.stringify({
        title: "Regal Gold Embroidered Sherwani",
        category: "Traditional",
        rentalPricePerDay: 4000,
        securityDeposit: 6000,
        images: ["/assets/Men/men1.jpg"],
        condition: "Brand New",
      }),
    });
    const listData = await listRes.json();
    listingId = listData.listing._id;
    assert(listRes.status === 201, "Provider created listing with ₹4,000/day and ₹6,000 deposit");

    // ==========================================
    // TEST 1: Pricing Separation on Rental Booking
    // ==========================================
    console.log("\n--- TEST 1: Pricing Separation (Fee vs Deposit vs Total) ---");
    const codRes = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCust,
        dressId: listingId,
        quantity: 4,
        startDate: "2026-12-15",
        endDate: "2026-12-19",
        totalAmount: 22000,
        address: { street: "Church Street", city: "Bangalore", zip: "560001" },
      }),
    });
    const codData = await codRes.json();
    order1Id = codData.orderId;
    assert(codRes.status === 200 && Boolean(order1Id), "Placed 4-day rental booking");

    const order1 = await OrderModel.findById(order1Id);
    assert(order1.rentalFee === 16000, "Rental fee explicitly computed as 4 x ₹4,000 = ₹16,000");
    assert(order1.securityDeposit === 6000, "Security deposit isolated as ₹6,000");
    assert(order1.totalAmount === 22000, "Total amount payable is ₹22,000 (Fee + Deposit)");
    assert(order1.paymentStatus === "PENDING", "COD paymentStatus is 'PENDING'");
    assert(order1.depositStatus === "HELD", "Security depositStatus is 'HELD' in escrow");

    // ==========================================
    // TEST 2: Online Payment Gateway Lifecycle
    // ==========================================
    console.log("\n--- TEST 2: Online Payment Gateway Lifecycle ---");
    const onlineTxId = `TX_${Date.now()}`;
    const checkStatusRes = await fetch(`${BASE_URL}/payment/check-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: onlineTxId,
        dressId: listingId,
        quantity: 2,
        startDate: "2026-12-22",
        endDate: "2026-12-24",
        totalAmount: 14000, // 2 x 4000 + 6000
        email: emailCust,
        address: { street: "Indiranagar", city: "Bangalore", zip: "560038" },
      }),
    });
    const checkData = await checkStatusRes.json();
    assert(checkData.code === "PAYMENT_SUCCESS", "Payment gateway verification succeeded");

    const onlineOrder = await OrderModel.findOne({ transactionId: onlineTxId });
    order2Id = onlineOrder._id.toString();
    assert(onlineOrder.paymentStatus === "PAID", "Online order paymentStatus set to 'PAID'");
    assert(onlineOrder.depositStatus === "HELD", "Online order depositStatus set to 'HELD'");
    assert(onlineOrder.rentalFee === 8000, "Online order rentalFee isolated (2 x 4000 = ₹8,000)");

    // ==========================================
    // TEST 3: Provider Deposit Release (Refunded)
    // ==========================================
    console.log("\n--- TEST 3: Security Deposit Release (Full Refund) ---");
    const releaseRes = await fetch(`${BASE_URL}/payment/orders/${order1Id}/deposit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenProv}` },
      body: JSON.stringify({ action: "release" }),
    });
    const releaseData = await releaseRes.json();
    assert(releaseRes.status === 200 && releaseData.success === true, "Deposit release returns HTTP 200");
    assert(releaseData.order.depositStatus === "REFUNDED", "depositStatus updated to 'REFUNDED'");
    assert(Boolean(releaseData.order.depositRefundedAt), "depositRefundedAt timestamp recorded");

    // ==========================================
    // TEST 4: Provider Deposit Deduction (Damages)
    // ==========================================
    console.log("\n--- TEST 4: Security Deposit Deduction (Damages) ---");
    const deductRes = await fetch(`${BASE_URL}/payment/orders/${order2Id}/deposit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenProv}` },
      body: JSON.stringify({
        action: "deduct",
        deductionAmount: 2500,
        reason: "Embroidery thread pulled on sleeve cuff",
      }),
    });
    const deductData = await deductRes.json();
    assert(deductRes.status === 200 && deductData.success === true, "Deposit deduction returns HTTP 200");
    assert(deductData.order.depositStatus === "PARTIALLY_DEDUCTED", "depositStatus set to 'PARTIALLY_DEDUCTED'");
    assert(deductData.order.depositDeductionAmount === 2500, "Deduction amount of ₹2,500 recorded");
    assert(deductData.order.depositDeductionReason.includes("Embroidery"), "Deduction reason saved");

    // ==========================================
    // TEST 5: Honest Provider Earnings Reporting
    // ==========================================
    console.log("\n--- TEST 5: Honest Provider Earnings Architecture ---");
    // Mark order 1 completed so its earnings become payable
    await OrderModel.findByIdAndUpdate(order1Id, { requestStatus: "Completed" });

    const statsRes = await fetch(`${BASE_URL}/provider/stats`, {
      headers: { Authorization: `Bearer ${tokenProv}` },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.status === true, "Provider stats returns HTTP 200");
    
    // Order 1 rentalFee = 16,000 -> Provider 85% = 13,600 (Payable)
    // Order 2 rentalFee = 8,000 -> Provider 85% = 6,800 (Pending/Estimated)
    assert(statsData.stats.payableEarnings === 13600, "Payable earnings calculated accurately (85% of completed rental fee: ₹13,600)");
    assert(statsData.stats.pendingEarnings === 6800, "Pending earnings calculated accurately (85% of ongoing rental fee: ₹6,800)");
    assert(statsData.stats.totalEarnings === 20400, "Total earnings sum to ₹20,400 (excluding customer deposits)");

    // ==========================================
    // TEST 6: Unauthorized Deposit Tampering Guard
    // ==========================================
    console.log("\n--- TEST 6: Unauthorized Deposit Modification Guard ---");
    const unauthDeduct = await fetch(`${BASE_URL}/payment/orders/${order1Id}/deposit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenOther}` },
      body: JSON.stringify({ action: "deduct", deductionAmount: 5000 }),
    });
    assert(unauthDeduct.status === 403, "Unrelated customer blocked from modifying deposit (HTTP 403)");

    const invalidAction = await fetch(`${BASE_URL}/payment/orders/${order1Id}/deposit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenProv}` },
      body: JSON.stringify({ action: "steal_money" }),
    });
    assert(invalidAction.status === 400, "Invalid action rejected (HTTP 400)");

  } catch (err) {
    console.error("Test execution error:", err.message);
    failCount++;
  } finally {
    // Cleanup
    if (listingId) await ProductModel.deleteMany({ _id: listingId });
    const orderIds = [order1Id, order2Id].filter(Boolean);
    if (orderIds.length > 0) await OrderModel.deleteMany({ _id: { $in: orderIds } });
    await UserModel.deleteMany({ email: { $regex: /step12/ } });
    console.log("\nCleaned up test data.");

    if (server) server.close();
    await mongoose.disconnect();

    console.log("\n=======================================================");
    console.log(`  TOTAL: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("=======================================================\n");

    process.exit(failCount > 0 ? 1 : 0);
  }
}

runPaymentDepositSuite();
