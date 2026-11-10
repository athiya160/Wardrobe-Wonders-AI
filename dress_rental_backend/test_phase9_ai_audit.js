process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import productModel from "./models/productModel.js";
import StoreProduct from "./models/StoreProductModel.js";
import Store from "./models/StoreModel.js";
import OrderModel from "./models/OrderModel.js";
import StoreOrder from "./models/StoreOrderModel.js";
import StorePayment from "./models/StorePaymentModel.js";
import StoreLedger from "./models/StoreLedgerModel.js";

import {
  classifyShoppingIntent,
  aiRentalRecommendations,
  aiStoreBuyRecommendations,
  aiStylistChat,
  aiOutfitRecommendation,
} from "./services/ai.service.js";

import { findDateConflict, calculateServerPricing } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 9: AI RENT/BUY INTEGRATION & AUDIT SUITE      ");
console.log("==========================================================================\n");

let passCount = 0;
let failCount = 0;

function assert(condition, testName, detail = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? " -> " + detail : ""}`);
    failCount++;
  }
}

async function runPhase9TestSuite() {
  const sellerId1 = new mongoose.Types.ObjectId();
  const sellerId2 = new mongoose.Types.ObjectId();
  const storeId1 = new mongoose.Types.ObjectId();
  const storeId2 = new mongoose.Types.ObjectId();
  const suspendedStoreId = new mongoose.Types.ObjectId();

  const rentalProdId1 = new mongoose.Types.ObjectId();
  const rentalProdId2 = new mongoose.Types.ObjectId();
  const storeProdId1 = new mongoose.Types.ObjectId();
  const storeProdId2 = new mongoose.Types.ObjectId();
  const preOwnedProdId = new mongoose.Types.ObjectId();
  const draftProdId = new mongoose.Types.ObjectId();
  const outOfStockProdId = new mongoose.Types.ObjectId();

  // -------------------------------------------------------------------------
  // SECTION 1: Intent Classification Engine
  // -------------------------------------------------------------------------
  console.log("--- 1. Shopping Intent Classification Engine ---");

  const r1 = classifyShoppingIntent("I want to rent a bridal lehenga for my sangeet this weekend");
  assert(r1.intent === "RENT", "Intent classified as RENT for 'rent ... this weekend'");
  assert(r1.hasRent === true && r1.hasBuy === false, "Rent flag true and Buy flag false");

  const r2 = classifyShoppingIntent("Looking to buy a pre-owned designer sherwani to keep forever");
  assert(r2.intent === "BUY", "Intent classified as BUY for 'buy ... to keep forever'");
  assert(r2.hasBuy === true && r2.hasPreOwned === true, "Buy flag true and PreOwned flag true");

  const r3 = classifyShoppingIntent("What is the best bridal jewelry for a royal reception?");
  assert(r3.hasJewellery === true, "Jewellery flag detected for 'jewelry'");
  assert(r3.intent === "HYBRID", "Generic query defaults to HYBRID intent");

  const r4 = classifyShoppingIntent("Can I rent or buy a cocktail gown?");
  assert(r4.intent === "HYBRID", "Query mentioning both rent and buy classifies as HYBRID");

  const r5 = classifyShoppingIntent("1-gram gold choker necklace for sangeet");
  assert(r5.hasJewellery === true, "Jewellery flag detected for '1-gram gold choker necklace'");

  const r6 = classifyShoppingIntent("Gently used second hand luxury handbag");
  assert(r6.hasPreOwned === true, "Pre-owned flag detected for 'second hand luxury handbag'");

  // -------------------------------------------------------------------------
  // SECTION 2: Store Recommendations Invariant Validation (Mocks & Logic)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Store Buy Recommendations & Invariants ---");

  // Mock StoreProduct & Store for controlled testing
  const mockStoreActive = {
    _id: storeId1,
    storeName: "Royal Heritage Silks",
    storeSlug: "royal-heritage-silks",
    status: "ACTIVE",
  };

  const mockStoreSuspended = {
    _id: suspendedStoreId,
    storeName: "Suspended Boutique",
    storeSlug: "suspended-boutique",
    status: "SUSPENDED",
  };

  const sampleApprovedStoreProduct = {
    _id: storeProdId1,
    sellerId: sellerId1,
    storeId: mockStoreActive,
    title: "Embroidered Banarasi Silk Saree",
    description: "Authentic handwoven Banarasi silk saree in vermillion red.",
    category: "Clothing",
    condition: "NEW",
    price: 8500,
    stockQuantity: 4,
    images: ["/assets/Store/banarasi.png"],
    status: "APPROVED",
    rating: 4.9,
    reviewsCount: 12,
  };

  const samplePreOwnedStoreProduct = {
    _id: preOwnedProdId,
    sellerId: sellerId2,
    storeId: mockStoreActive,
    title: "Pre-Owned Sabyasachi Velvet Shawl",
    description: "Authenticated pre-owned velvet shawl in mint condition.",
    category: "Accessories",
    condition: "PRE_OWNED",
    conditionDescription: "Worn once for a photoshoot, dry cleaned, flawless.",
    price: 15000,
    stockQuantity: 1,
    images: ["/assets/Store/shawl.png"],
    status: "APPROVED",
    rating: 5.0,
    reviewsCount: 3,
  };

  const sampleSuspendedStoreProduct = {
    _id: storeProdId2,
    sellerId: sellerId2,
    storeId: mockStoreSuspended,
    title: "Suspended Store Dress",
    category: "Dresses",
    condition: "NEW",
    price: 4000,
    stockQuantity: 10,
    status: "APPROVED",
  };

  const sampleDraftStoreProduct = {
    _id: draftProdId,
    sellerId: sellerId1,
    storeId: mockStoreActive,
    title: "Draft Unapproved Outfit",
    category: "Clothing",
    condition: "NEW",
    price: 3000,
    stockQuantity: 5,
    status: "DRAFT",
  };

  const sampleOutOfStockStoreProduct = {
    _id: outOfStockProdId,
    sellerId: sellerId1,
    storeId: mockStoreActive,
    title: "Sold Out Designer Sherwani",
    category: "Clothing",
    condition: "NEW",
    price: 12000,
    stockQuantity: 0,
    status: "APPROVED",
  };

  // Mock StoreProduct.find for the test environment
  const originalStoreFind = StoreProduct.find;
  StoreProduct.find = function (query) {
    let results = [
      sampleApprovedStoreProduct,
      samplePreOwnedStoreProduct,
      sampleSuspendedStoreProduct,
      sampleDraftStoreProduct,
      sampleOutOfStockStoreProduct,
    ];

    // Filter by status if specified
    if (query?.status) {
      results = results.filter((p) => p.status === query.status);
    }
    // Filter by stockQuantity if specified
    if (query?.stockQuantity?.$gt !== undefined) {
      results = results.filter((p) => p.stockQuantity > query.stockQuantity.$gt);
    }
    // Filter by condition if specified
    if (query?.condition) {
      results = results.filter((p) => p.condition === query.condition);
    }
    // Filter by max price if specified
    if (query?.price?.$lte !== undefined) {
      results = results.filter((p) => p.price <= query.price.$lte);
    }

    const chain = {
      populate: () => chain,
      sort: () => chain,
      limit: () => chain,
      lean: async () => results,
    };
    return chain;
  };

  // Test Store Buy recommendation invariants
  const storeRecsAll = await aiStoreBuyRecommendations();
  assert(Array.isArray(storeRecsAll), "aiStoreBuyRecommendations returns an array");
  assert(storeRecsAll.length > 0, "Returns eligible approved products");

  // Invariant 1: No draft or unapproved items
  const hasDraft = storeRecsAll.some((p) => String(p._id) === String(draftProdId));
  assert(!hasDraft, "CRITICAL: Draft/unapproved products are strictly excluded");

  // Invariant 2: No out-of-stock items
  const hasOutOfStock = storeRecsAll.some((p) => String(p._id) === String(outOfStockProdId));
  assert(!hasOutOfStock, "CRITICAL: Out-of-stock products are strictly excluded");

  // Invariant 3: No products from suspended stores
  const hasSuspendedStore = storeRecsAll.some((p) => String(p._id) === String(storeProdId2));
  assert(!hasSuspendedStore, "CRITICAL: Products from suspended stores are strictly excluded");

  // Invariant 4: Correct URL routing and domain tagging
  const allHaveStoreUrl = storeRecsAll.every((p) => p.url.startsWith("/store/product/"));
  assert(allHaveStoreUrl, "All store products have URL starting with '/store/product/'");

  const allHaveStoreType = storeRecsAll.every((p) => p.type === "STORE");
  assert(allHaveStoreType, "All store products have type 'STORE'");

  // Invariant 5: Condition filtering
  const preOwnedRecs = await aiStoreBuyRecommendations({ condition: "PRE_OWNED" });
  assert(
    preOwnedRecs.every((p) => p.condition === "PRE_OWNED"),
    "Condition filter 'PRE_OWNED' returns only pre-owned listings"
  );

  // Invariant 6: Budget filtering
  const budgetRecs = await aiStoreBuyRecommendations({ maxBudget: 10000 });
  assert(
    budgetRecs.every((p) => p.price <= 10000),
    "Budget filter strictly constrains store prices to <= maxBudget"
  );

  // -------------------------------------------------------------------------
  // SECTION 3: Rental Recommendations Invariants Validation
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Rental Recommendations & Invariants ---");

  const sampleRentalProduct1 = {
    _id: rentalProdId1,
    name: "Royal Zari Bridal Lehenga",
    category: "Bridal",
    gender: "women",
    price: 3500,
    rentalPricePerDay: 3500,
    securityDeposit: 5000,
    availability: true,
    stock: 2,
    image: "/assets/Women/bridal_01.png",
  };

  const sampleRentalProduct2 = {
    _id: rentalProdId2,
    name: "Imperial Raw Silk Sherwani",
    category: "Sherwani",
    gender: "men",
    price: 4200,
    rentalPricePerDay: 4200,
    securityDeposit: 6000,
    availability: true,
    stock: 1,
    image: "/assets/Men/sherwani_01.png",
  };

  const sampleUnavailableRental = {
    _id: new mongoose.Types.ObjectId(),
    name: "Unavailable Rental Dress",
    availability: false,
    price: 2000,
  };

  // Mock productModel.find for test
  const originalRentalFind = productModel.find;
  productModel.find = function (query) {
    let results = [sampleRentalProduct1, sampleRentalProduct2, sampleUnavailableRental];
    if (query?.availability?.$ne !== undefined) {
      results = results.filter((p) => p.availability !== query.availability.$ne);
    }
    if (query?.price?.$lte !== undefined) {
      results = results.filter((p) => p.price <= query.price.$lte);
    }
    const chain = {
      sort: () => chain,
      limit: () => chain,
      lean: async () => results,
    };
    return chain;
  };

  const rentalRecs = await aiRentalRecommendations();
  assert(Array.isArray(rentalRecs), "aiRentalRecommendations returns an array");
  assert(rentalRecs.length > 0, "Returns eligible rental products");

  // Invariant 1: No unavailable rental items
  const hasUnavailable = rentalRecs.some((p) => p.availability === false);
  assert(!hasUnavailable, "CRITICAL: Unavailable rental items are strictly excluded");

  // Invariant 2: Correct URL routing and domain tagging
  const allHaveRentalUrl = rentalRecs.every(
    (p) => p.url.startsWith("/product/") && !p.url.startsWith("/store/product/")
  );
  assert(allHaveRentalUrl, "All rental products have URL starting with '/product/' (never '/store/product/')");

  const allHaveRentalType = rentalRecs.every((p) => p.type === "RENTAL");
  assert(allHaveRentalType, "All rental products have type 'RENTAL'");

  // -------------------------------------------------------------------------
  // SECTION 4: Dual-Domain AI Chat Orchestration
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Dual-Domain AI Chat Orchestration ---");

  // Test 4A: Rent intent chat
  const chatRentResponse = await aiStylistChat("I want to rent a bridal lehenga for 3 days");
  assert(chatRentResponse.intent === "RENT", "aiStylistChat detects RENT intent");
  assert(
    Array.isArray(chatRentResponse.rentalProducts) && chatRentResponse.rentalProducts.length > 0,
    "aiStylistChat populates rentalProducts for RENT intent"
  );
  assert(
    chatRentResponse.rentalProducts.every((p) => p.type === "RENTAL"),
    "All rentalProducts are of type 'RENTAL'"
  );
  assert(
    Array.isArray(chatRentResponse.products),
    "aiStylistChat provides backward compatible 'products' array"
  );

  // Test 4B: Buy intent chat
  const chatBuyResponse = await aiStylistChat("I want to buy a new designer banarasi saree");
  assert(chatBuyResponse.intent === "BUY", "aiStylistChat detects BUY intent");
  assert(
    Array.isArray(chatBuyResponse.storeProducts) && chatBuyResponse.storeProducts.length > 0,
    "aiStylistChat populates storeProducts for BUY intent"
  );
  assert(
    chatBuyResponse.storeProducts.every((p) => p.type === "STORE"),
    "All storeProducts are of type 'STORE'"
  );

  // Test 4C: Hybrid intent chat
  const chatHybridResponse = await aiStylistChat("Show me options for a royal wedding reception");
  assert(chatHybridResponse.intent === "HYBRID", "aiStylistChat detects HYBRID intent for open-ended queries");
  assert(
    chatHybridResponse.rentalProducts.length > 0 && chatHybridResponse.storeProducts.length > 0,
    "HYBRID chat returns BOTH rentalProducts and storeProducts"
  );

  // Test 4D: Domain ID Isolation - Verify no ID collisions or domain mixing
  const rentalIds = new Set(chatHybridResponse.rentalProducts.map((p) => String(p._id)));
  const storeIds = new Set(chatHybridResponse.storeProducts.map((p) => String(p._id)));
  let hasIntersection = false;
  for (const rId of rentalIds) {
    if (storeIds.has(rId)) hasIntersection = true;
  }
  assert(!hasIntersection, "CRITICAL: Zero domain ID mixing between Rental and Store recommendations");

  // Test 4E: Resilient fallback when message is empty
  const emptyChatResponse = await aiStylistChat("");
  assert(typeof emptyChatResponse.text === "string" && emptyChatResponse.text.length > 0, "Graceful empty query greeting");
  assert(Array.isArray(emptyChatResponse.products), "Empty query returns safe empty products array");

  // -------------------------------------------------------------------------
  // SECTION 5: Rental Isolation Invariant Check (Safety Service & Payout Split)
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Rental Isolation & Booking Safety Invariants ---");

  // Invariant 1: Booking date conflict logic untouched
  const existingBookings = [
    { startDate: new Date("2026-12-01"), endDate: new Date("2026-12-05") },
    { startDate: new Date("2026-12-10"), endDate: new Date("2026-12-15") },
  ];
  const conflict = findDateConflict(existingBookings, new Date("2026-12-03"), new Date("2026-12-07"));
  assert(conflict !== null, "Rental booking conflict engine detects overlapping dates");

  const noConflict = findDateConflict(existingBookings, new Date("2026-12-06"), new Date("2026-12-09"));
  assert(noConflict === null, "Rental booking conflict engine allows clean non-overlapping dates");

  // Invariant 2: Rental pricing calculation and security deposit
  const mockRentalProduct = {
    price: 2000,
    rentalPricePerDay: 2000,
    securityDeposit: 3000,
  };
  const pricing = calculateServerPricing(
    mockRentalProduct,
    new Date("2026-12-01"),
    new Date("2026-12-04") // 3 days
  );
  assert(pricing.rentalFee === 6000, "Rental price per day * days calculated accurately (₹6000)");
  assert(pricing.securityDeposit === 3000, "Refundable security deposit preserved (₹3000)");
  assert(pricing.totalAmount === 9000, "Grand total matches rental + deposit (₹9000)");

  // -------------------------------------------------------------------------
  // SECTION 6: Store Schema Invariants & Multi-Seller Ledger Preservation
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Store Multi-Seller Ledger & Financial Separation ---");

  // Invariant: StorePayment and StoreLedger remain isolated from Rental OrderModel
  assert(StorePayment.modelName === "StorePayment", "StorePayment model exists and is distinct from Rental payment");
  assert(StoreLedger.modelName === "StoreLedger", "StoreLedger model exists for double-entry financial separation");
  assert(StoreOrder.modelName === "StoreOrder", "StoreOrder model exists and is distinct from Rental OrderModel");

  // Cleanup mocks
  StoreProduct.find = originalStoreFind;
  productModel.find = originalRentalFind;

  console.log("\n==========================================================================");
  console.log(`   PHASE 9 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase9TestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
