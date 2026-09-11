import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import UserRouter from "./routes/user.router.js";
import productRouter from "./routes/product.router.js";
import providerRouter from "./routes/provider.router.js";

dotenv.config();

const PORT = 4010;
const BASE_URL = `http://localhost:${PORT}`;
const MONGO_URI = "mongodb://127.0.0.1:27017/dress_rental";

const app = express();
app.use(bodyParser.json());
app.use(UserRouter);
app.use("/products", productRouter);
app.use("/provider", providerRouter);

let server;

async function runProviderTestSuite() {
  console.log("\n==========================================");
  console.log("   DRESSR PROVIDER LISTINGS TEST SUITE    ");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    server = app.listen(PORT);
    console.log(`Test server running on port ${PORT}.\n`);

    const timestamp = Date.now();
    const providerAEmail = `prov_a_${timestamp}@example.com`;
    const providerBEmail = `prov_b_${timestamp}@example.com`;
    const customerEmail = `cust_${timestamp}@example.com`;
    const password = "Password@123";

    // Clean prior tests
    await UserModel.deleteMany({
      email: { $in: [providerAEmail, providerBEmail, customerEmail] },
    });

    // 1. Setup accounts
    console.log("--- SETUP: Registering test users ---");
    const regProvA = await axios.post(`${BASE_URL}/register`, {
      name: "Aanya Provider",
      email: providerAEmail,
      phone: "9123456780",
      password,
      role: "provider",
    });
    const provAToken = regProvA.data.token;
    const provAId = regProvA.data.user.id || regProvA.data.user._id;

    const regProvB = await axios.post(`${BASE_URL}/register`, {
      name: "Bhavna Provider",
      email: providerBEmail,
      phone: "9123456781",
      password,
      role: "provider",
    });
    const provBToken = regProvB.data.token;

    const regCust = await axios.post(`${BASE_URL}/register`, {
      name: "Chirag Customer",
      email: customerEmail,
      phone: "9123456782",
      password,
      role: "customer",
    });
    const custToken = regCust.data.token;

    assert(!!provAToken && !!provBToken && !!custToken, "Test accounts successfully provisioned with JWT tokens");

    // TEST 1: Provider creates a dress listing
    console.log("\n--- TEST 1: Provider Creates Dress Listing ---");
    const createRes = await axios.post(
      `${BASE_URL}/provider/listings`,
      {
        title: "Royal Embroidered Anarkali",
        description: "Pure georgette Anarkali gown with zardozi embroidery. Perfect for sangeet.",
        category: "Traditional",
        gender: "women",
        size: "L",
        brand: "Sabyasachi Heritage",
        condition: "Like New",
        rentalPricePerDay: 4500,
        securityDeposit: "1500",
        images: ["/assets/Anarkali.jpg"],
        color: "Emerald Green",
        pattern: "Embroidered",
        style: "Royal",
        season: "Wedding",
        location: "Mumbai, Bandra West",
      },
      {
        headers: { Authorization: `Bearer ${provAToken}` },
      }
    );

    assert(createRes.status === 201, "Create listing returns HTTP 201");
    assert(createRes.data.status === true, "Response status is true");
    const createdDress = createRes.data.listing;
    assert(String(createdDress.providerId) === String(provAId), "Listing providerId matches Provider A");
    assert(createdDress.title === "Royal Embroidered Anarkali", "Title saved accurately");
    assert(createdDress.name === "Royal Embroidered Anarkali", "Name field automatically synchronized");
    assert(createdDress.price === 4500 && createdDress.rentalPricePerDay === 4500, "Rental price synchronized with price");
    assert(createdDress.image === "/assets/Anarkali.jpg", "Primary image synchronized from images array");
    assert(createdDress.status === "active", "Default listing status is active");
    assert(createdDress.condition === "Like New", "Listing condition stored accurately");
    const listingId = createdDress._id;

    // TEST 2: Customer blocked from creating listing
    console.log("\n--- TEST 2: Customer Blocked from Creating Listing ---");
    try {
      await axios.post(
        `${BASE_URL}/provider/listings`,
        {
          title: "Unauthorized Dress",
          category: "Casual",
          rentalPricePerDay: 1000,
          securityDeposit: "500",
          images: ["/assets/Crop.jpg"],
        },
        {
          headers: { Authorization: `Bearer ${custToken}` },
        }
      );
      assert(false, "Customer should be blocked from creating listings");
    } catch (err) {
      assert(err.response.status === 403, "Customer creation blocked with HTTP 403 Forbidden");
    }

    // TEST 3: Unauthenticated access rejected
    console.log("\n--- TEST 3: Unauthenticated Access Rejected ---");
    try {
      await axios.get(`${BASE_URL}/provider/listings`);
      assert(false, "Unauthenticated request should fail");
    } catch (err) {
      assert(err.response.status === 401, "Missing token returns HTTP 401 Unauthorized");
    }

    // TEST 4: Provider A retrieves their listings
    console.log("\n--- TEST 4: Provider A Fetches Own Listings ---");
    const listARes = await axios.get(`${BASE_URL}/provider/listings`, {
      headers: { Authorization: `Bearer ${provAToken}` },
    });
    assert(listARes.status === 200, "Fetch listings returns HTTP 200");
    assert(listARes.data.listings.length >= 1, "Provider A has at least 1 listing");
    assert(
      listARes.data.listings.some((l) => l._id === listingId),
      "Created listing exists in Provider A's listings"
    );

    // TEST 5: Provider isolation (Provider B has separate inventory)
    console.log("\n--- TEST 5: Provider Inventory Isolation ---");
    const listBRes = await axios.get(`${BASE_URL}/provider/listings`, {
      headers: { Authorization: `Bearer ${provBToken}` },
    });
    assert(listBRes.status === 200, "Provider B fetches own inventory");
    assert(
      !listBRes.data.listings.some((l) => l._id === listingId),
      "Provider A's listing is NOT present in Provider B's inventory"
    );

    // TEST 6: Prevent cross-provider tampering
    console.log("\n--- TEST 6: Prevent Cross-Provider Tampering ---");
    try {
      await axios.put(
        `${BASE_URL}/provider/listings/${listingId}`,
        {
          rentalPricePerDay: 9999,
        },
        {
          headers: { Authorization: `Bearer ${provBToken}` },
        }
      );
      assert(false, "Provider B should NOT be able to modify Provider A's listing");
    } catch (err) {
      assert(err.response.status === 403, "Tampering blocked with HTTP 403 Forbidden");
    }

    // TEST 7: Provider A updates their listing
    console.log("\n--- TEST 7: Provider A Updates Listing ---");
    const updateRes = await axios.put(
      `${BASE_URL}/provider/listings/${listingId}`,
      {
        rentalPricePerDay: 4800,
        size: "XL",
        condition: "Pristine",
      },
      {
        headers: { Authorization: `Bearer ${provAToken}` },
      }
    );
    assert(updateRes.status === 200, "Update returns HTTP 200");
    assert(updateRes.data.listing.rentalPricePerDay === 4800, "Updated rentalPricePerDay reflected");
    assert(updateRes.data.listing.price === 4800, "Updated price synchronized");
    assert(updateRes.data.listing.size === "XL", "Updated size reflected");

    // TEST 8: Provider Stats
    console.log("\n--- TEST 8: Provider Dashboard Stats ---");
    const statsRes = await axios.get(`${BASE_URL}/provider/stats`, {
      headers: { Authorization: `Bearer ${provAToken}` },
    });
    assert(statsRes.status === 200, "Provider stats returns HTTP 200");
    assert(statsRes.data.stats.totalListings >= 1, "Total listings metric is accurate");
    assert(statsRes.data.stats.activeListings >= 1, "Active listings metric is accurate");

    // TEST 9: Marketplace Integration (Public customer visibility)
    console.log("\n--- TEST 9: Public Marketplace Catalog Integration ---");
    const publicProductsRes = await axios.get(`${BASE_URL}/products`);
    assert(publicProductsRes.status === 200, "Public products catalog returns HTTP 200");
    const foundInMarketplace = publicProductsRes.data.find((p) => p._id === listingId);
    assert(!!foundInMarketplace, "Provider listing is visible in public marketplace for customer browsing");
    assert(foundInMarketplace.price === 4800, "Public listing displays provider's updated price");

    // TEST 10: Provider A deletes listing
    console.log("\n--- TEST 10: Provider Deletes Listing ---");
    const deleteRes = await axios.delete(`${BASE_URL}/provider/listings/${listingId}`, {
      headers: { Authorization: `Bearer ${provAToken}` },
    });
    assert(deleteRes.status === 200, "Delete listing returns HTTP 200");

    try {
      await axios.get(`${BASE_URL}/provider/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${provAToken}` },
      });
      assert(false, "Deleted listing should not be found");
    } catch (err) {
      assert(err.response.status === 404, "Subsequent query returns HTTP 404 Not Found");
    }

    // Clean up test records
    await UserModel.deleteMany({
      email: { $in: [providerAEmail, providerBEmail, customerEmail] },
    });
    await ProductModel.deleteMany({ _id: listingId });
    console.log("\nCleaned up test users and listings.");
  } catch (suiteErr) {
    console.error("Provider test suite runtime error:", suiteErr);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log("\n==========================================");
    console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("==========================================\n");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runProviderTestSuite();
