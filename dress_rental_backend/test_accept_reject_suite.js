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

const PORT = 4030;
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

async function runAcceptRejectSuite() {
  console.log("\n=======================================================");
  console.log("   DRESSR STEP 10: PROVIDER ACCEPT / REJECT SUITE      ");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startTestServer();

  let tokenA = "";
  let tokenB = "";
  let tokenCust = "";
  let listingId = "";
  let order1Id = "";
  let order2Id = "";

  try {
    const timestamp = Date.now();
    const emailA = `prov_step10_a_${timestamp}@test.com`;
    const emailB = `prov_step10_b_${timestamp}@test.com`;
    const emailCust = `cust_step10_${timestamp}@test.com`;

    // 1. Provision Provider A, Provider B, Customer
    const regA = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Atelier A", email: emailA, password: "Password123!", role: "provider" }),
    });
    tokenA = (await regA.json()).token;

    const regB = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Boutique B", email: emailB, password: "Password123!", role: "provider" }),
    });
    tokenB = (await regB.json()).token;

    const regCust = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tara Singh", email: emailCust, password: "Password123!", role: "customer" }),
    });
    tokenCust = (await regCust.json()).token;

    assert(Boolean(tokenA && tokenB && tokenCust), "Setup: Registered Provider A, Provider B, and Customer");

    // 2. Create Dress Listing for Provider A
    const listRes = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: "Emerald Velvet Cocktail Dress",
        category: "Party",
        rentalPricePerDay: 3000,
        securityDeposit: 5000,
        images: ["/assets/Cocktail Gown.jpg"],
        condition: "Brand New with Tags",
      }),
    });
    const listData = await listRes.json();
    listingId = listData.listing._id;
    assert(listRes.status === 201, "Provider A created dress listing");

    // ==========================================
    // TEST 1: Customer Places Rental Request 1
    // ==========================================
    console.log("\n--- TEST 1: Customer Places Rental Request ---");
    const order1Res = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCust,
        dressId: listingId,
        quantity: 4,
        startDate: "2026-11-01",
        endDate: "2026-11-05",
        totalAmount: 17000,
        address: { street: "Park Street", city: "Kolkata", zip: "700016" },
      }),
    });
    const order1Data = await order1Res.json();
    order1Id = order1Data.orderId;
    assert(order1Res.status === 200 && Boolean(order1Id), "Customer placed rental request (order1)");

    // ==========================================
    // TEST 2: Filter Orders by Status (Pending)
    // ==========================================
    console.log("\n--- TEST 2: Filter Orders by Status (Pending) ---");
    const pendingRes = await fetch(`${BASE_URL}/provider/orders?status=Pending`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const pendingData = await pendingRes.json();
    assert(pendingRes.status === 200, "Fetch pending orders returns HTTP 200");
    assert(pendingData.orders.some((o) => o._id === order1Id), "Order 1 found in Pending filter");

    // ==========================================
    // TEST 3: Provider A Accepts Rental Request
    // ==========================================
    console.log("\n--- TEST 3: Provider A Accepts Rental Request ---");
    const acceptRes = await fetch(`${BASE_URL}/provider/orders/${order1Id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: "Accepted" }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200, "Accept order returns HTTP 200");
    assert(acceptData.order.requestStatus === "Accepted", "Order requestStatus set to 'Accepted'");
    assert(acceptData.order.status === "Confirmed", "Order status synchronized to 'Confirmed'");
    assert(Boolean(acceptData.order.acceptedAt), "acceptedAt timestamp recorded");

    // ==========================================
    // TEST 4: Provider A Dispatches Dress (Active)
    // ==========================================
    console.log("\n--- TEST 4: Provider A Dispatches Dress (Active) ---");
    const dispatchRes = await fetch(`${BASE_URL}/provider/orders/${order1Id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: "Active" }),
    });
    const dispatchData = await dispatchRes.json();
    assert(dispatchRes.status === 200, "Dispatch order returns HTTP 200");
    assert(dispatchData.order.requestStatus === "Active", "Order requestStatus set to 'Active'");
    assert(Boolean(dispatchData.order.dispatchedAt), "dispatchedAt timestamp recorded");

    // ==========================================
    // TEST 5: Provider A Marks Returned & Complete
    // ==========================================
    console.log("\n--- TEST 5: Provider A Marks Returned & Complete ---");
    const completeRes = await fetch(`${BASE_URL}/provider/orders/${order1Id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        status: "Completed",
        inspectionNotes: "Garment returned in pristine boutique condition.",
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200, "Complete order returns HTTP 200");
    assert(completeData.order.requestStatus === "Completed", "Order requestStatus set to 'Completed'");
    assert(Boolean(completeData.order.completedAt), "completedAt timestamp recorded");
    assert(
      completeData.order.inspectionNotes.includes("pristine"),
      "Inspection notes persisted on order"
    );

    // ==========================================
    // TEST 6: Customer Places Second Rental Request
    // ==========================================
    console.log("\n--- TEST 6: Customer Places Second Rental Request ---");
    const order2Res = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCust,
        dressId: listingId,
        quantity: 3,
        startDate: "2026-11-10",
        endDate: "2026-11-13",
        totalAmount: 14000,
        address: { street: "MG Road", city: "Bengaluru", zip: "560001" },
      }),
    });
    const order2Data = await order2Res.json();
    order2Id = order2Data.orderId;

    // Check calendar blocks 2026-11-10 to 2026-11-13 before decline
    const checkBeforeDecline = await fetch(`${BASE_URL}/products/${listingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2026-11-11", endDate: "2026-11-12" }),
    });
    const beforeDeclineData = await checkBeforeDecline.json();
    assert(beforeDeclineData.available === false, "Dates 2026-11-10 to 2026-11-13 currently reserved");

    // ==========================================
    // TEST 7: Provider A Declines Order with Reason
    // ==========================================
    console.log("\n--- TEST 7: Provider A Declines Order with Reason ---");
    const declineRes = await fetch(`${BASE_URL}/provider/orders/${order2Id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        status: "Declined",
        declineReason: "Garment undergoing scheduled couture dry cleaning.",
      }),
    });
    const declineData = await declineRes.json();
    assert(declineRes.status === 200, "Decline order returns HTTP 200");
    assert(declineData.order.requestStatus === "Declined", "Order requestStatus set to 'Declined'");
    assert(declineData.order.status === "Cancelled", "Order status set to 'Cancelled'");
    assert(
      declineData.order.declineReason.includes("dry cleaning"),
      "Decline reason recorded accurately"
    );
    assert(Boolean(declineData.order.declinedAt), "declinedAt timestamp recorded");

    // ==========================================
    // TEST 8: Automatic Calendar Restoration
    // ==========================================
    console.log("\n--- TEST 8: Calendar Dates Automatically Restored After Decline ---");
    const checkAfterDecline = await fetch(`${BASE_URL}/products/${listingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2026-11-10", endDate: "2026-11-13" }),
    });
    const afterDeclineData = await checkAfterDecline.json();
    assert(afterDeclineData.available === true, "Dates 2026-11-10 to 2026-11-13 are confirmed available again!");

    // ==========================================
    // TEST 9: Cross-Provider Security
    // ==========================================
    console.log("\n--- TEST 9: Cross-Provider Tampering Protection ---");
    const unauthorizedRes = await fetch(`${BASE_URL}/provider/orders/${order1Id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ status: "Declined" }),
    });
    assert(unauthorizedRes.status === 403, "Provider B blocked from modifying Provider A's order (HTTP 403)");

  } catch (err) {
    console.error("Test execution error:", err);
    failCount++;
  } finally {
    // Cleanup
    await ProductModel.deleteMany({ _id: listingId });
    await OrderModel.deleteMany({ _id: { $in: [order1Id, order2Id] } });
    await UserModel.deleteMany({ email: { $regex: /step10/ } });
    console.log("\nCleaned up test data.");

    if (server) server.close();
    await mongoose.disconnect();

    console.log("\n=======================================================");
    console.log(`  TOTAL: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log("=======================================================\n");

    process.exit(failCount > 0 ? 1 : 0);
  }
}

runAcceptRejectSuite();
