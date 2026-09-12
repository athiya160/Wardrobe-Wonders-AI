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

import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import UserRouter from "./routes/user.router.js";
import uploadRouter from "./routes/upload.router.js";
import { PaymentRouter } from "./routes/payment.js";

import {
  securityHeaders,
  apiLimiter,
  getCorsOptions,
} from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 4037;
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

async function startGroupAServer() {
  const app = express();
  app.use(securityHeaders);
  app.use(cors(getCorsOptions()));
  app.use(bodyParser.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.use("/upload", uploadRouter);
  app.use("/payment", PaymentRouter);
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
  app.use(UserRouter);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Group A Test Server running on port ${PORT}.`);
      resolve();
    });
  });
}

async function runGroupASuite() {
  console.log("\n================================================================================");
  console.log("   GROUP A INTEGRATED SUITE: STEP 10 (PROVIDER DECISIONS) + STEP 11 (MY RENTALS) ");
  console.log("================================================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await startGroupAServer();

  const timestamp = Date.now();
  const secret = process.env.JWT_SECRET || process.env.SECRET || "change_this_in_production";

  let provId = "";
  let custAId = "";
  let custBId = "";
  let tokenProv = "";
  let tokenCustA = "";
  let tokenCustB = "";
  let listingId = "";
  let order1Id = "";
  let order2Id = "";
  let order3Id = "";

  try {
    const emailProv = `ga_prov_${timestamp}@test.com`;
    const emailCustA = `ga_custa_${timestamp}@test.com`;
    const emailCustB = `ga_custb_${timestamp}@test.com`;
    const password = "Password123!";
    const hash = await bcrypt.hash(password, 10);

    // 1. Setup Provider & Customers
    const provUser = new UserModel({
      name: "GroupA Boutique",
      email: emailProv,
      password,
      passwordHash: hash,
      role: "provider",
      type: "provider",
      isActive: true,
    });
    await provUser.save();
    provId = provUser._id.toString();
    tokenProv = jwt.sign({ id: provUser._id, email: emailProv, role: "provider" }, secret, { expiresIn: "1d" });

    const custAUser = new UserModel({
      name: "Customer Alice",
      email: emailCustA,
      password,
      passwordHash: hash,
      role: "customer",
      type: "customer",
      isActive: true,
    });
    await custAUser.save();
    custAId = custAUser._id.toString();
    tokenCustA = jwt.sign({ id: custAUser._id, email: emailCustA, role: "customer" }, secret, { expiresIn: "1d" });

    const custBUser = new UserModel({
      name: "Customer Bob",
      email: emailCustB,
      password,
      passwordHash: hash,
      role: "customer",
      type: "customer",
      isActive: true,
    });
    await custBUser.save();
    custBId = custBUser._id.toString();
    tokenCustB = jwt.sign({ id: custBUser._id, email: emailCustB, role: "customer" }, secret, { expiresIn: "1d" });

    assert(Boolean(tokenProv && tokenCustA && tokenCustB), "1.1 Provisioned Provider and Customer accounts");

    // 2. Provider creates luxury dress listing
    const listRes = await fetch(`${BASE_URL}/provider/listings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenProv}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Group A Couture Silk Gown",
        category: "Party",
        gender: "women",
        size: "S",
        brand: "Manish Malhotra",
        condition: "Pristine",
        rentalPricePerDay: 2500,
        price: 2500,
        securityDeposit: "5000",
        image: "/assets/Cocktail Gown.jpg",
        images: ["/assets/Cocktail Gown.jpg"],
        description: "Exquisite couture silk evening gown.",
        ownershipConfirmed: true,
      }),
    });
    const listData = await listRes.json();
    assert(listRes.status === 201, "2.1 Provider created couture dress listing (HTTP 201)");
    listingId = listData.listing._id;

    // -------------------------------------------------------------------------
    // STEP 10 & 11 WORKFLOW 1: Customer Booking & Dashboard Inspection
    // -------------------------------------------------------------------------
    console.log("\n--- PART 1: Customer A Books Rental & Inspects /my-rentals ---");

    const startDate1 = "2026-11-01";
    const endDate1 = "2026-11-04";

    const book1Res = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCustA,
        dressId: listingId,
        quantity: 3,
        startDate: startDate1,
        endDate: endDate1,
        totalAmount: 12500,
        address: "742 Evergreen Terrace, Mumbai",
      }),
    });
    const book1Data = await book1Res.json();
    assert(book1Res.status === 200, "3.1 Customer A places 3-day booking via /payment/cod");
    order1Id = book1Data.orderId;

    // 3.2 Customer A views /my-rentals
    const myRentalsA1 = await fetch(`${BASE_URL}/payment/my-rentals`, {
      headers: { Authorization: `Bearer ${tokenCustA}` },
    });
    const myRentalsA1Data = await myRentalsA1.json();
    assert(myRentalsA1.status === 200, "3.2 Customer A accesses /payment/my-rentals (HTTP 200)");
    assert(myRentalsA1Data.orders?.length === 1, "3.3 Customer A has exactly 1 order in dashboard");
    assert(myRentalsA1Data.orders[0]._id === order1Id, "3.4 Order ID matches Customer A's booking");
    assert(myRentalsA1Data.orders[0].requestStatus === "Pending", "3.5 Order initial requestStatus is 'Pending'");
    assert(Boolean(myRentalsA1Data.orders[0].product?.title), "3.6 Product details are populated");
    assert(Boolean(myRentalsA1Data.orders[0].providerId?.name), "3.7 Provider details are populated");

    // 3.8 Customer B's dashboard is strictly isolated
    const myRentalsB1 = await fetch(`${BASE_URL}/payment/my-rentals`, {
      headers: { Authorization: `Bearer ${tokenCustB}` },
    });
    const myRentalsB1Data = await myRentalsB1.json();
    assert(myRentalsB1Data.orders?.length === 0, "3.8 Customer B dashboard is completely isolated (0 orders)");

    // 3.9 Calendar Conflict Check: Customer B cannot book overlapping dates
    const availConflict = await fetch(`${BASE_URL}/products/${listingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2026-11-02", endDate: "2026-11-05" }),
    });
    const availConflictData = await availConflict.json();
    assert(availConflictData.available === false, "3.9 Overlapping dates are blocked on product calendar");

    // -------------------------------------------------------------------------
    // STEP 10 WORKFLOW 2: Provider Declines Order & Calendar Restores
    // -------------------------------------------------------------------------
    console.log("\n--- PART 2: Provider Decline Workflow & Automatic Date Restoration ---");

    // 4.1 Provider checks incoming pending requests
    const provOrdersRes = await fetch(`${BASE_URL}/provider/orders?status=Pending`, {
      headers: { Authorization: `Bearer ${tokenProv}` },
    });
    const provOrdersData = await provOrdersRes.json();
    assert(provOrdersRes.status === 200, "4.1 Provider queries /provider/orders?status=Pending");
    assert((provOrdersData.orders || []).some((o) => o._id === order1Id), "4.2 Customer A's order found in pending queue");

    // 4.3 Customer B tries to decline or cancel Customer A's order -> blocked
    const tamperDecline = await fetch(`${BASE_URL}/provider/orders/${order1Id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenCustB}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "Declined" }),
    });
    assert(tamperDecline.status === 403, "4.3 Unauthorized user blocked from modifying order status (HTTP 403)");

    // 4.4 Provider Declines with structured reason
    const declineRes = await fetch(`${BASE_URL}/provider/orders/${order1Id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenProv}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "Declined",
        declineReason: "Garment undergoing maintenance or dry cleaning",
      }),
    });
    const declineData = await declineRes.json();
    assert(declineRes.status === 200, "4.4 Provider declines order (HTTP 200)");
    assert(declineData.order?.requestStatus === "Declined", "4.5 Order requestStatus set to 'Declined'");
    assert(declineData.order?.status === "Cancelled", "4.6 Order status synchronized to 'Cancelled'");
    assert(declineData.order?.declineReason.includes("maintenance"), "4.7 Decline reason persisted on order");

    // 4.8 Calendar dates are immediately released!
    const availRestored = await fetch(`${BASE_URL}/products/${listingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: startDate1, endDate: endDate1 }),
    });
    const availRestoredData = await availRestored.json();
    assert(availRestoredData.available === true, "4.8 Previously reserved dates are immediately available again!");

    // -------------------------------------------------------------------------
    // STEP 10 & 11 WORKFLOW 3: Customer B Books Released Dates, Provider Accepts, Dispatches & Completes
    // -------------------------------------------------------------------------
    console.log("\n--- PART 3: Customer B Booking, Acceptance, Dispatch & Return Completion ---");

    // 5.1 Customer B books the freed date window
    const book2Res = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCustB,
        dressId: listingId,
        quantity: 3,
        startDate: startDate1,
        endDate: endDate1,
        totalAmount: 12500,
        address: "10 Downing Street, Mumbai",
      }),
    });
    const book2Data = await book2Res.json();
    assert(book2Res.status === 200, "5.1 Customer B books released dates successfully");
    order2Id = book2Data.orderId;

    // 5.2 Provider Accepts Customer B's order
    const acceptRes = await fetch(`${BASE_URL}/provider/orders/${order2Id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenProv}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "Accepted" }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200, "5.2 Provider accepts rental order (HTTP 200)");
    assert(acceptData.order?.requestStatus === "Accepted", "5.3 Order requestStatus set to 'Accepted'");
    assert(acceptData.order?.status === "Confirmed", "5.4 Order status synchronized to 'Confirmed'");
    assert(Boolean(acceptData.order?.acceptedAt), "5.5 acceptedAt timestamp recorded");

    // 5.6 Customer B dashboard reflects Confirmed status
    const myRentalsB2 = await fetch(`${BASE_URL}/payment/my-rentals`, {
      headers: { Authorization: `Bearer ${tokenCustB}` },
    });
    const myRentalsB2Data = await myRentalsB2.json();
    const custBOrder = myRentalsB2Data.orders?.find((o) => o._id === order2Id);
    assert(custBOrder?.requestStatus === "Accepted", "5.6 Customer B sees 'Accepted' status in /my-rentals");

    // 5.7 Provider Marks as Dispatched (Active on Rent)
    const dispatchRes = await fetch(`${BASE_URL}/provider/orders/${order2Id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenProv}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "Active" }),
    });
    const dispatchData = await dispatchRes.json();
    assert(dispatchRes.status === 200, "5.7 Provider marks order as Dispatched / Active (HTTP 200)");
    assert(dispatchData.order?.requestStatus === "Active", "5.8 Order requestStatus is 'Active'");
    assert(Boolean(dispatchData.order?.dispatchedAt), "5.9 dispatchedAt timestamp recorded");

    // 5.10 Customer cannot cancel an Active rental
    const cancelActiveRes = await fetch(`${BASE_URL}/payment/orders/${order2Id}/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenCustB}`,
        "Content-Type": "application/json",
      },
    });
    assert(cancelActiveRes.status === 400, "5.10 Customer blocked from cancelling an active rental (HTTP 400)");

    // 5.11 Provider Marks Returned & Inspected (Completed)
    const completeRes = await fetch(`${BASE_URL}/provider/orders/${order2Id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenProv}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "Completed",
        inspectionNotes: "Garment returned in immaculate condition. Minor sanitization only.",
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200, "5.11 Provider marks order Completed with inspection notes (HTTP 200)");
    assert(completeData.order?.requestStatus === "Completed", "5.12 Order requestStatus is 'Completed'");
    assert(completeData.order?.inspectionNotes.includes("immaculate"), "5.13 Inspection notes saved on order");

    // -------------------------------------------------------------------------
    // STEP 11 WORKFLOW 4: Customer Self-Cancellation & Calendar Restoration
    // -------------------------------------------------------------------------
    console.log("\n--- PART 4: Customer Self-Service Cancellation Lifecycle ---");

    const startDate3 = "2026-11-20";
    const endDate3 = "2026-11-23";

    // 6.1 Customer A places a fresh booking for later dates
    const book3Res = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailCustA,
        dressId: listingId,
        quantity: 3,
        startDate: startDate3,
        endDate: endDate3,
        totalAmount: 12500,
        address: "742 Evergreen Terrace, Mumbai",
      }),
    });
    const book3Data = await book3Res.json();
    order3Id = book3Data.orderId;
    assert(Boolean(order3Id), "6.1 Customer A places fresh rental order");

    // 6.2 Customer B tries to cancel Customer A's order -> blocked
    const tamperCancelRes = await fetch(`${BASE_URL}/payment/orders/${order3Id}/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenCustB}`,
        "Content-Type": "application/json",
      },
    });
    assert(tamperCancelRes.status === 403, "6.2 Cross-customer cancellation blocked with HTTP 403");

    // 6.3 Customer A cancels own pending order
    const cancelA3Res = await fetch(`${BASE_URL}/payment/orders/${order3Id}/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokenCustA}`,
        "Content-Type": "application/json",
      },
    });
    const cancelA3Data = await cancelA3Res.json();
    assert(cancelA3Res.status === 200, "6.3 Customer A successfully cancels own rental order (HTTP 200)");
    assert(cancelA3Data.order?.requestStatus === "Cancelled", "6.4 Order requestStatus set to 'Cancelled'");
    assert(cancelA3Data.order?.cancelledBy === "customer", "6.5 cancelledBy recorded as 'customer'");

    // 6.6 Calendar dates are restored immediately
    const availRestored3 = await fetch(`${BASE_URL}/products/${listingId}/check-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: startDate3, endDate: endDate3 }),
    });
    const availRestored3Data = await availRestored3.json();
    assert(availRestored3Data.available === true, "6.6 Calendar dates instantly restored upon customer cancellation");

    console.log("\n================================================================================");
    console.log(`GROUP A TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
    console.log("================================================================================\n");

  } catch (error) {
    console.error("Group A test encountered an unhandled exception:", error);
    failCount++;
  } finally {
    try {
      const cleanOrders = [order1Id, order2Id, order3Id].filter(Boolean);
      if (cleanOrders.length > 0) await OrderModel.deleteMany({ _id: { $in: cleanOrders } });
      if (listingId) await ProductModel.findByIdAndDelete(listingId);
      const cleanUsers = [provId, custAId, custBId].filter(Boolean);
      if (cleanUsers.length > 0) await UserModel.deleteMany({ _id: { $in: cleanUsers } });
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

runGroupASuite();
