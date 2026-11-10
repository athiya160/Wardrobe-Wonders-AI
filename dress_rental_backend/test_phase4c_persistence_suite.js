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

import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import OrderModel from "./models/OrderModel.js";
import UserRouter from "./routes/user.router.js";
import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";
import { PaymentRouter } from "./routes/payment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4096;
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
    // Remove stale lock if any
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

    mongodProcess.stderr.on("data", (data) => {
      // console.error("mongod stderr:", data.toString());
    });

    mongodProcess.on("error", (err) => {
      if (!started) reject(err);
    });

    setTimeout(() => {
      if (!started) {
        resolve(); // proceed to attempt connection
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

async function startTestApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use("/products", productRouter);
  app.use("/provider", providerRouter);
  app.use("/payment", PaymentRouter);
  app.use("/user", UserRouter);
  app.use(UserRouter);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`Test server running on port ${PORT}.`);
      resolve();
    });
  });
}

async function run18ScenarioBattery() {
  console.log("\n=========================================================================");
  console.log("   WARDROBE WONDERS — PHASE 4C: 18-SCENARIO PERSISTENCE INTEGRATION SUITE   ");
  console.log("=========================================================================\n");

  process.env.NODE_ENV = "test";
  process.env.ENABLE_MOCK_PAYMENTS = "true";
  process.env.JWT_SECRET = "phase4c_test_jwt_secret_key_2026";

  await startLocalMongod();

  const mongoUri = `mongodb://127.0.0.1:${MONGO_PORT}/wardrobe_wonders_phase4c_test`;
  let connected = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      connected = true;
      break;
    } catch (e) {
      if (attempt === 10) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.log("Connected to MongoDB on port " + MONGO_PORT);

  await OrderModel.syncIndexes();
  await ProductModel.syncIndexes();
  await UserModel.syncIndexes();

  await startTestApp();

  try {
    // 0. Clean test collections
    await UserModel.deleteMany({});
    await ProductModel.deleteMany({});
    await OrderModel.deleteMany({});

    // Setup Actors
    const userA = await UserModel.create({
      name: "Ananya Roy",
      email: "ananya@test.com",
      role: "customer",
      isActive: true,
      addresses: [],
      wishlist: [],
    });
    const tokenUserA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    const userB = await UserModel.create({
      name: "Pooja Hegde",
      email: "pooja@test.com",
      role: "customer",
      isActive: true,
      addresses: [],
      wishlist: [],
    });
    const tokenUserB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    const providerUser = await UserModel.create({
      name: "Sabyasachi Atelier",
      email: "provider@atelier.com",
      role: "provider",
      isActive: true,
    });

    const testGarment = await ProductModel.create({
      name: "Raw Silk Crimson Lehenga",
      title: "Raw Silk Crimson Lehenga",
      category: "Bridal",
      price: 3500,
      rentalPricePerDay: 3500,
      securityDeposit: 5000,
      advance: "5000",
      image: "https://example.com/lehenga.jpg",
      providerId: providerUser._id,
      availability: true,
      status: "active",
      bookedDates: [],
    });

    // -------------------------------------------------------------------------
    // Scenario 1: Create & retrieve customer profile
    // -------------------------------------------------------------------------
    const resProfile = await fetch(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const dataProfile = await resProfile.json();
    const s1Passed =
      resProfile.status === 200 &&
      dataProfile.success === true &&
      dataProfile.user?.email === "ananya@test.com" &&
      dataProfile.user?.name === "Ananya Roy" &&
      Array.isArray(dataProfile.user?.addresses);
    recordTest(1, "Create & retrieve customer profile", s1Passed, { status: resProfile.status, email: dataProfile.user?.email });

    // -------------------------------------------------------------------------
    // Scenario 2: Update profile (name, phone, avatar)
    // -------------------------------------------------------------------------
    const resUpdateProf = await fetch(`${BASE_URL}/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        name: "Ananya Roy-Kapoor",
        phone: "9876543210",
        avatar: "https://example.com/ananya.jpg",
      }),
    });
    const dataUpdateProf = await resUpdateProf.json();
    const updatedUserInDb = await UserModel.findById(userA._id);
    const s2Passed =
      resUpdateProf.status === 200 &&
      updatedUserInDb.name === "Ananya Roy-Kapoor" &&
      updatedUserInDb.phone === "9876543210" &&
      updatedUserInDb.avatar === "https://example.com/ananya.jpg";
    recordTest(2, "Update customer profile (name, phone, avatar)", s2Passed, {
      name: updatedUserInDb?.name,
      phone: updatedUserInDb?.phone,
    });

    // -------------------------------------------------------------------------
    // Scenario 3: Save & edit body measurements (bust, waist, hips, height)
    // -------------------------------------------------------------------------
    const resSaveMeas = await fetch(`${BASE_URL}/user/measurements`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        bust: 34,
        waist: 28,
        hips: 38,
        height: 165,
        unit: "in",
        notes: "Prefers relaxed waistline",
      }),
    });
    const dataSaveMeas = await resSaveMeas.json();
    const userWithMeas = await UserModel.findById(userA._id);
    const s3Passed =
      resSaveMeas.status === 200 &&
      userWithMeas.measurements?.bust === 34 &&
      userWithMeas.measurements?.waist === 28 &&
      userWithMeas.measurements?.hips === 38 &&
      userWithMeas.measurements?.height === 165 &&
      userWithMeas.measurements?.unit === "in";
    recordTest(3, "Save & edit body measurements (bust, waist, hips, height)", s3Passed, {
      measurements: userWithMeas?.measurements,
    });

    // -------------------------------------------------------------------------
    // Scenario 4: Clear body measurements (DELETE /user/measurements)
    // -------------------------------------------------------------------------
    const resClearMeas = await fetch(`${BASE_URL}/user/measurements`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const dataClearMeas = await resClearMeas.json();
    const userClearedMeas = await UserModel.findById(userA._id);
    const s4Passed =
      resClearMeas.status === 200 &&
      dataClearMeas.success === true &&
      (!userClearedMeas.measurements || !userClearedMeas.measurements.bust);
    recordTest(4, "Clear measurements (DELETE /user/measurements)", s4Passed, {
      cleared: !userClearedMeas?.measurements?.bust,
    });

    // -------------------------------------------------------------------------
    // Scenario 5: Add multiple addresses with PIN code validation (POST /user/addresses)
    // -------------------------------------------------------------------------
    // 5a. Invalid PIN code rejection
    const resBadPin = await fetch(`${BASE_URL}/user/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        street: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "123", // invalid < 6 digits
      }),
    });
    const badPinRejected = resBadPin.status === 400;

    // 5b. Add valid Primary address
    const resAddAddr1 = await fetch(`${BASE_URL}/user/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        name: "Ananya Home",
        phone: "9876543210",
        houseNo: "Flat 4B, Silver Oak",
        street: "100ft Indiranagar",
        landmark: "Opp Metro Pillar 42",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
        label: "Home",
        isDefault: true,
      }),
    });
    const dataAddr1 = await resAddAddr1.json();
    const addr1Id = dataAddr1.address?._id;

    // 5c. Add second Work address
    const resAddAddr2 = await fetch(`${BASE_URL}/user/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        name: "Ananya Studio",
        phone: "9876543210",
        houseNo: "Suite 300",
        street: "Outer Ring Road, Bellandur",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560103",
        label: "Work",
        isDefault: false,
      }),
    });
    const dataAddr2 = await resAddAddr2.json();
    const addr2Id = dataAddr2.address?._id;

    const userWithAddrs = await UserModel.findById(userA._id);
    const s5Passed =
      badPinRejected &&
      resAddAddr1.status === 201 &&
      resAddAddr2.status === 201 &&
      userWithAddrs.addresses.length === 2 &&
      addr1Id &&
      addr2Id;
    recordTest(5, "Add multiple addresses (POST /user/addresses) with 6-digit PIN validation", s5Passed, {
      count: userWithAddrs?.addresses?.length,
      badPinRejected,
    });

    // -------------------------------------------------------------------------
    // Scenario 6: Set & change default address (PATCH /user/addresses/:id/default)
    // -------------------------------------------------------------------------
    const resPatchDefault = await fetch(`${BASE_URL}/user/addresses/${addr2Id}/default`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const userDefaultCheck = await UserModel.findById(userA._id);
    const addr1Updated = userDefaultCheck.addresses.id(addr1Id);
    const addr2Updated = userDefaultCheck.addresses.id(addr2Id);
    const s6Passed =
      resPatchDefault.status === 200 &&
      addr2Updated.isDefault === true &&
      addr1Updated.isDefault === false;
    recordTest(6, "Set & change default address (PATCH /user/addresses/:id/default)", s6Passed, {
      addr1IsDefault: addr1Updated?.isDefault,
      addr2IsDefault: addr2Updated?.isDefault,
    });

    // -------------------------------------------------------------------------
    // Scenario 7: Edit & delete address (PUT /user/addresses/:id, DELETE)
    // -------------------------------------------------------------------------
    // Edit addr2
    const resEditAddr = await fetch(`${BASE_URL}/user/addresses/${addr2Id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        street: "Embassy TechVillage, Tower 2",
        houseNo: "Suite 500",
      }),
    });
    const userAfterEdit = await UserModel.findById(userA._id);
    const editedAddr = userAfterEdit.addresses.id(addr2Id);
    const editPassed = resEditAddr.status === 200 && editedAddr.street === "Embassy TechVillage, Tower 2";

    // Delete addr2
    const resDeleteAddr = await fetch(`${BASE_URL}/user/addresses/${addr2Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const userAfterDelete = await UserModel.findById(userA._id);
    const deletePassed = resDeleteAddr.status === 200 && userAfterDelete.addresses.length === 1 && !userAfterDelete.addresses.id(addr2Id);

    const s7Passed = editPassed && deletePassed;
    recordTest(7, "Edit & delete addresses (PUT /user/addresses/:id, DELETE /user/addresses/:id)", s7Passed, {
      editPassed,
      deletePassed,
      finalCount: userAfterDelete?.addresses?.length,
    });

    // -------------------------------------------------------------------------
    // Scenario 8: Cross-account address access rejection
    // -------------------------------------------------------------------------
    // User B creates an address
    const resBAddr = await fetch(`${BASE_URL}/user/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserB}`,
      },
      body: JSON.stringify({
        name: "Pooja Hegde",
        phone: "9876543210",
        street: "Juhu Tara Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400049",
      }),
    });
    const dataBAddr = await resBAddr.json();
    const userBAddrId = dataBAddr.address?._id;

    // User A tries to edit User B's address
    const resCrossEdit = await fetch(`${BASE_URL}/user/addresses/${userBAddrId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ street: "HACKED STREET" }),
    });

    // User A tries to delete User B's address
    const resCrossDelete = await fetch(`${BASE_URL}/user/addresses/${userBAddrId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });

    const userBAfterAttack = await UserModel.findById(userB._id);
    const userBAddrStillIntact = userBAfterAttack.addresses.id(userBAddrId)?.street === "Juhu Tara Road";
    const s8Passed =
      (resCrossEdit.status === 404 || resCrossEdit.status === 403) &&
      (resCrossDelete.status === 404 || resCrossDelete.status === 403) &&
      userBAddrStillIntact;
    recordTest(8, "Cross-account address access rejection (strict user isolation)", s8Passed, {
      crossEditStatus: resCrossEdit.status,
      crossDeleteStatus: resCrossDelete.status,
      intact: userBAddrStillIntact,
    });

    // -------------------------------------------------------------------------
    // Scenario 9: Add wishlist item (POST /user/wishlist/:id)
    // -------------------------------------------------------------------------
    const resWishAdd = await fetch(`${BASE_URL}/user/wishlist/${testGarment._id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const userWithWish = await UserModel.findById(userA._id);
    const s9Passed =
      resWishAdd.status === 200 &&
      userWithWish.wishlist.some((id) => String(id) === String(testGarment._id));
    recordTest(9, "Add wishlist item (POST /user/wishlist/:id)", s9Passed, {
      wishlistCount: userWithWish?.wishlist?.length,
    });

    // -------------------------------------------------------------------------
    // Scenario 10: Duplicate wishlist prevention (idempotent check)
    // -------------------------------------------------------------------------
    const resWishDup = await fetch(`${BASE_URL}/user/wishlist/${testGarment._id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const userWithDupWish = await UserModel.findById(userA._id);
    const matchingCount = userWithDupWish.wishlist.filter(
      (id) => String(id) === String(testGarment._id)
    ).length;
    const s10Passed = resWishDup.status === 200 && matchingCount === 1;
    recordTest(10, "Duplicate wishlist prevention (idempotent check, no duplicates)", s10Passed, {
      matchingCount,
    });

    // -------------------------------------------------------------------------
    // Scenario 11: Remove wishlist item (DELETE /user/wishlist/:id)
    // -------------------------------------------------------------------------
    const resWishDel = await fetch(`${BASE_URL}/user/wishlist/${testGarment._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const userWishRemoved = await UserModel.findById(userA._id);
    const s11Passed =
      resWishDel.status === 200 &&
      !userWishRemoved.wishlist.some((id) => String(id) === String(testGarment._id));
    recordTest(11, "Remove wishlist item (DELETE /user/wishlist/:id)", s11Passed, {
      remaining: userWishRemoved?.wishlist?.length,
    });

    // -------------------------------------------------------------------------
    // Scenario 12: Cross-account wishlist access rejection
    // -------------------------------------------------------------------------
    // User B adds garment to wishlist
    await fetch(`${BASE_URL}/user/wishlist/${testGarment._id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenUserB}` },
    });

    // User A calls DELETE on their own token
    await fetch(`${BASE_URL}/user/wishlist/${testGarment._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });

    // Verify User B's wishlist still has testGarment
    const userBWishCheck = await UserModel.findById(userB._id);
    const userBStillHasItem = userBWishCheck.wishlist.some(
      (id) => String(id) === String(testGarment._id)
    );
    const s12Passed = userBStillHasItem === true;
    recordTest(12, "Cross-account wishlist access rejection & state isolation", s12Passed, {
      userBHasItem: userBStillHasItem,
    });

    // -------------------------------------------------------------------------
    // Scenario 13: Expired / invalid / missing JWT rejection (401/403)
    // -------------------------------------------------------------------------
    const expiredToken = jwt.sign({ id: userA._id }, process.env.JWT_SECRET, { expiresIn: "-10s" });

    const resNoToken = await fetch(`${BASE_URL}/user/profile`);
    const resBadToken = await fetch(`${BASE_URL}/user/profile`, {
      headers: { Authorization: "Bearer bogus_invalid_jwt_string" },
    });
    const resExpToken = await fetch(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    const s13Passed =
      resNoToken.status === 401 &&
      resBadToken.status === 401 &&
      resExpToken.status === 401;
    recordTest(13, "Expired, invalid, and missing JWT rejection (401 Unauthorized)", s13Passed, {
      noToken: resNoToken.status,
      badToken: resBadToken.status,
      expToken: resExpToken.status,
    });

    // -------------------------------------------------------------------------
    // Scenario 14: Mass-assignment attack rejection
    // -------------------------------------------------------------------------
    const resMassAttack = await fetch(`${BASE_URL}/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        role: "admin",
        isSuperAdmin: true,
        isActive: false,
        balance: 999999,
        isAdmin: true,
      }),
    });
    const userAfterAttack = await UserModel.findById(userA._id);
    const s14Passed =
      userAfterAttack.role === "customer" &&
      userAfterAttack.isActive === true &&
      !userAfterAttack.isSuperAdmin &&
      !userAfterAttack.isAdmin;
    recordTest(14, "Mass-assignment attack rejection (cannot elevate role or alter privileges)", s14Passed, {
      role: userAfterAttack?.role,
      isActive: userAfterAttack?.isActive,
    });

    // -------------------------------------------------------------------------
    // Scenario 15: Cross-device data persistence verification
    // -------------------------------------------------------------------------
    // Update measurements & add address on "Device 1"
    await fetch(`${BASE_URL}/user/measurements`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ bust: 36, waist: 30, hips: 40, height: 168, unit: "in" }),
    });

    // Create a new independent session token for "Device 2"
    const tokenDevice2 = jwt.sign({ id: userA._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Device 2 fetches profile and addresses
    const resDev2Prof = await fetch(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${tokenDevice2}` },
    });
    const dataDev2Prof = await resDev2Prof.json();

    const resDev2Addrs = await fetch(`${BASE_URL}/user/addresses`, {
      headers: { Authorization: `Bearer ${tokenDevice2}` },
    });
    const dataDev2Addrs = await resDev2Addrs.json();

    const s15Passed =
      resDev2Prof.status === 200 &&
      dataDev2Prof.user?.measurements?.bust === 36 &&
      dataDev2Prof.user?.measurements?.height === 168 &&
      resDev2Addrs.status === 200 &&
      dataDev2Addrs.addresses?.length === 1 &&
      dataDev2Addrs.addresses[0]?.city === "Bengaluru";
    recordTest(15, "Cross-device data persistence verification (fresh session fetches server data)", s15Passed, {
      bust: dataDev2Prof.user?.measurements?.bust,
      addressCity: dataDev2Addrs.addresses?.[0]?.city,
    });

    // -------------------------------------------------------------------------
    // Scenario 16: Existing localStorage safe migration
    // -------------------------------------------------------------------------
    const legacyAddresses = [
      {
        name: "Migrated Vacation",
        street: "Calangute Beach Road",
        city: "Goa",
        state: "Goa",
        pincode: "403516",
        label: "Other",
      },
    ];

    const resMigrateAddr = await fetch(`${BASE_URL}/user/addresses/migrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ addresses: legacyAddresses }),
    });

    // Migrate wishlist items
    const resMigrateWish = await fetch(`${BASE_URL}/user/wishlist/migrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ wishlist: [testGarment._id] }),
    });
    const dataMigrateWish = await resMigrateWish.json();

    const userPostMigrate = await UserModel.findById(userA._id);
    const hasOriginal = userPostMigrate.addresses.some((a) => a.city === "Bengaluru");
    const hasMigrated = userPostMigrate.addresses.some((a) => a.city === "Goa");
    const hasMigratedWish = userPostMigrate.wishlist.some(
      (id) => String(id) === String(testGarment._id)
    );

    const s16Passed =
      resMigrateAddr.status === 200 &&
      resMigrateWish.status === 200 &&
      hasOriginal &&
      hasMigrated &&
      hasMigratedWish;
    recordTest(16, "Safe localStorage migration (/user/addresses/migrate, /user/wishlist/migrate)", s16Passed, {
      totalAddresses: userPostMigrate?.addresses?.length,
      hasOriginal,
      hasMigrated,
      hasMigratedWish,
    });

    // -------------------------------------------------------------------------
    // Scenario 17: Saved address checkout integration (POST /payment/cod using addressId)
    // -------------------------------------------------------------------------
    const savedAddr = userPostMigrate.addresses[0];
    const orderStartDate = new Date("2026-11-10T10:00:00Z");
    const orderEndDate = new Date("2026-11-13T10:00:00Z");

    const resCheckoutCod = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        dressId: testGarment._id,
        quantity: 3,
        startDate: orderStartDate,
        endDate: orderEndDate,
        rentalFee: 10500,
        securityDeposit: 5000,
        totalAmount: 15500,
        email: userA.email,
        addressId: savedAddr._id,
      }),
    });
    const dataCheckoutCod = await resCheckoutCod.json();
    const createdOrderId = dataCheckoutCod.orderId || dataCheckoutCod.order?._id;
    const createdOrder = await OrderModel.findById(createdOrderId);

    const s17Passed =
      resCheckoutCod.status === 200 &&
      dataCheckoutCod.success === true &&
      createdOrder &&
      createdOrder.address?.city === savedAddr.city &&
      createdOrder.address?.pincode === savedAddr.pincode &&
      createdOrder.paymentStatus === "PENDING";
    recordTest(17, "Saved address checkout integration (POST /payment/cod using addressId)", s17Passed, {
      orderId: createdOrderId,
      orderCity: createdOrder?.address?.city,
      orderPincode: createdOrder?.address?.pincode,
    });

    // -------------------------------------------------------------------------
    // Scenario 18: Historical order address immutability
    // -------------------------------------------------------------------------
    // Customer edits saved address in their profile to a new city
    await fetch(`${BASE_URL}/user/addresses/${savedAddr._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        street: "New Relocated Street 99",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
      }),
    });

    // Re-query historical order from Scenario 17
    const historicalOrder = await OrderModel.findById(createdOrderId);
    const s18Passed =
      historicalOrder.address?.city === savedAddr.city &&
      historicalOrder.address?.city !== "Hyderabad" &&
      historicalOrder.address?.pincode === savedAddr.pincode;
    recordTest(18, "Historical order address immutability (modifying saved address does not mutate past order)", s18Passed, {
      historicalCity: historicalOrder?.address?.city,
      historicalPincode: historicalOrder?.address?.pincode,
      originalExpectedCity: savedAddr.city,
    });

    console.log("\n=========================================================================");
    console.log(`FULL PERSISTENCE BATTERY SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${testRecords.length} tests`);
    console.log("=========================================================================\n");

    if (failCount > 0) {
      process.exit(1);
    }

  } catch (err) {
    console.error("Execution error in 18-scenario persistence battery:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    stopLocalMongod();
  }
}

run18ScenarioBattery();
