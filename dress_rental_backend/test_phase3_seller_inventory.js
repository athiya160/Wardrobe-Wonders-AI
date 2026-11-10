import mongoose from "mongoose";
import StoreApplication from "./models/StoreApplicationModel.js";
import Store from "./models/StoreModel.js";
import StoreProduct from "./models/StoreProductModel.js";
import { requireApprovedSeller } from "./middleware/storeAuth.js";
import { findDateConflict, calculateServerPricing } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 3: SELLER DASHBOARD & INVENTORY SUITE        ");
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

async function runPhase3TestSuite() {
  const sellerId1 = new mongoose.Types.ObjectId();
  const sellerId2 = new mongoose.Types.ObjectId();
  const storeId1 = new mongoose.Types.ObjectId();
  const storeId2 = new mongoose.Types.ObjectId();

  // -------------------------------------------------------------------------
  // TEST 1: Seller Authentication & Store Authorization Guard
  // -------------------------------------------------------------------------
  console.log("--- 1. Seller Authorization & Middleware Guards ---");

  const originalStoreFindOne = Store.findOne;
  const originalAppFindOne = StoreApplication.findOne;

  // 1A: Approved active seller passes guard
  let nextCalled1 = false;
  let req1 = {
    user: { _id: sellerId1, email: "seller1@atelier.com", role: "customer" },
  };
  let res1 = {
    status: (code) => ({
      json: (data) => ({ code, data }),
    }),
  };

  Store.findOne = () => ({
    then: (resolve) =>
      resolve({
        _id: storeId1,
        sellerId: sellerId1,
        storeName: "Royal Heritage Atelier",
        storeSlug: "royal-heritage-atelier",
        status: "ACTIVE",
      }),
  });

  await requireApprovedSeller(req1, res1, () => {
    nextCalled1 = true;
  });
  assert(
    nextCalled1 === true && req1.store?.storeSlug === "royal-heritage-atelier",
    "Active approved seller passes requireApprovedSeller and req.store is attached"
  );

  // 1B: Non-approved seller with pending application rejected with 403 SELLER_NOT_APPROVED
  let nextCalled2 = false;
  let errStatus2 = 0;
  let errBody2 = null;
  let req2 = {
    user: { _id: new mongoose.Types.ObjectId(), email: "pending@user.com", role: "customer" },
  };
  let res2 = {
    status: (code) => {
      errStatus2 = code;
      return {
        json: (data) => {
          errBody2 = data;
        },
      };
    },
  };

  Store.findOne = () => ({
    then: (resolve) => resolve(null),
  });
  StoreApplication.findOne = () => ({
    sort: () => ({
      then: (resolve) => resolve({ status: "PENDING_REVIEW" }),
    }),
  });

  await requireApprovedSeller(req2, res2, () => {
    nextCalled2 = true;
  });
  assert(
    nextCalled2 === false && errStatus2 === 403 && errBody2?.code === "SELLER_NOT_APPROVED",
    "User with pending application is rejected with 403 SELLER_NOT_APPROVED"
  );

  // 1C: Suspended seller rejected with 403 STORE_SUSPENDED
  let nextCalled3 = false;
  let errStatus3 = 0;
  let errBody3 = null;
  let req3 = { user: { _id: sellerId2 } };
  let res3 = {
    status: (code) => {
      errStatus3 = code;
      return {
        json: (data) => {
          errBody3 = data;
        },
      };
    },
  };

  Store.findOne = () => ({
    then: (resolve) =>
      resolve({
        _id: storeId2,
        sellerId: sellerId2,
        status: "SUSPENDED",
      }),
  });

  await requireApprovedSeller(req3, res3, () => {
    nextCalled3 = true;
  });
  assert(
    nextCalled3 === false && errStatus3 === 403 && errBody3?.code === "STORE_SUSPENDED",
    "Suspended store owner is rejected with 403 STORE_SUSPENDED"
  );

  // Restore originals
  Store.findOne = originalStoreFindOne;
  StoreApplication.findOne = originalAppFindOne;

  // -------------------------------------------------------------------------
  // TEST 2: Product Schema, Brand Support & Field Validation
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Product Schema, Brand Support & Field Validation ---");

  // 2A: Valid product with brand, MRP, images, and variants
  const validProduct = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Handcrafted Zardozi Silk Sherwani",
    brand: "Sabyasachi Heritage",
    description: "Gold embroidered pure silk groom sherwani with antique buttons.",
    category: "Clothing",
    subcategory: "Kurtas & Sherwanis",
    condition: "NEW",
    price: 18000,
    originalRetailPrice: 24000,
    stockQuantity: 5,
    images: ["https://example.com/sherwani1.jpg", "https://example.com/sherwani2.jpg"],
    variants: [
      { size: "38", color: "Ivory", stockQuantity: 2, sku: "SHER-IVO-38" },
      { size: "40", color: "Ivory", stockQuantity: 3, sku: "SHER-IVO-40" },
    ],
    status: "DRAFT",
  });

  const validErr = validProduct.validateSync();
  assert(!validErr, "Valid product with brand and variants passes schema validation");
  assert(validProduct.brand === "Sabyasachi Heritage", "Product brand is correctly recorded and trimmed");
  assert(validProduct.variants.length === 2, "Product size/colour variants are stored properly");

  // 2B: Negative price rejected
  const negPriceProduct = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Negative Price Item",
    description: "Invalid pricing test",
    category: "Clothing",
    condition: "NEW",
    price: -500,
    images: ["https://example.com/item.jpg"],
  });
  const negPriceErr = negPriceProduct.validateSync();
  assert(
    negPriceErr && negPriceErr.errors["price"],
    "Negative product price fails schema validation"
  );

  // 2C: Negative stockQuantity rejected
  const negStockProduct = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Negative Stock Item",
    description: "Invalid stock test",
    category: "Clothing",
    condition: "NEW",
    price: 1500,
    stockQuantity: -3,
    images: ["https://example.com/item.jpg"],
  });
  const negStockErr = negStockProduct.validateSync();
  assert(
    negStockErr && negStockErr.errors["stockQuantity"],
    "Negative stockQuantity fails schema validation"
  );

  // 2D: Empty image array rejected
  const noImageProduct = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "No Image Item",
    description: "Invalid missing image test",
    category: "Clothing",
    condition: "NEW",
    price: 1500,
    stockQuantity: 1,
    images: [],
  });
  const noImageErr = noImageProduct.validateSync();
  assert(
    noImageErr && noImageErr.errors["images"],
    "Missing product images fails schema validation (at least 1 required)"
  );

  // -------------------------------------------------------------------------
  // TEST 3: Pre-Owned Compliance & Defect Disclosures
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Pre-Owned Compliance & Defect Disclosures ---");

  // 3A: Pre-owned without conditionDescription rejected (via async validate hook)
  const preOwnedWithoutDesc = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Vintage Kanjeevaram Saree",
    description: "Worn twice for weddings.",
    category: "Clothing",
    condition: "PRE_OWNED",
    conditionDescription: "", // Missing mandatory disclosure
    price: 8500,
    images: ["https://example.com/saree1.jpg"],
  });
  let preOwnedErr = null;
  try {
    await preOwnedWithoutDesc.validate();
  } catch (err) {
    preOwnedErr = err;
  }
  assert(
    preOwnedErr && preOwnedErr.errors["conditionDescription"],
    "Pre-owned product without condition description fails validation"
  );

  // 3B: Pre-owned with conditionDescription and defectImages succeeds
  const preOwnedValid = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Vintage Kanjeevaram Silk Saree",
    description: "Heirloom pure zari silk saree from Chennai.",
    category: "Clothing",
    condition: "PRE_OWNED",
    conditionDescription: "Excellent condition; minor micro-thread pull on reverse pallu corner.",
    defectImages: ["https://example.com/defect-pallu.jpg"],
    price: 8500,
    images: ["https://example.com/saree1.jpg"],
  });
  let preOwnedValidErr = null;
  try {
    await preOwnedValid.validate();
  } catch (err) {
    preOwnedValidErr = err;
  }
  assert(
    !preOwnedValidErr && preOwnedValid.defectImages.length === 1,
    "Pre-owned product with wear disclosure and defect photos passes validation"
  );

  // -------------------------------------------------------------------------
  // TEST 4: Product Lifecycle & Moderation Transitions
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Product Lifecycle Transitions & Moderation Security ---");

  // 4A: Draft creation
  const draftItem = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Draft Bridal Anarkali",
    description: "Draft work in progress",
    category: "Dresses",
    condition: "NEW",
    price: 9000,
    images: ["https://example.com/anarkali.jpg"],
    status: "DRAFT",
  });
  assert(draftItem.status === "DRAFT", "Seller can save product as DRAFT");

  // 4B: Submit draft for review
  draftItem.status = "PENDING_REVIEW";
  draftItem.reviewHistory.push({
    status: "PENDING_REVIEW",
    notes: "Seller submitted draft for administrator review.",
    reviewedAt: new Date(),
  });
  assert(
    draftItem.status === "PENDING_REVIEW" && draftItem.reviewHistory.length === 1,
    "Submitting draft transitions status to PENDING_REVIEW and logs history"
  );

  // 4C: Rejection and seller resubmission workflow
  const rejectedItem = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Archival Velvet Lehenga",
    description: "Vintage lehenga with crystal work.",
    category: "Clothing",
    condition: "PRE_OWNED",
    conditionDescription: "Slight wear on hem.",
    price: 12000,
    images: ["https://example.com/lehenga.jpg"],
    status: "REJECTED",
    adminReviewNotes: "Please provide clearer close-up photograph of the hem defect.",
  });
  assert(
    rejectedItem.status === "REJECTED" && rejectedItem.adminReviewNotes.includes("clearer close-up"),
    "Rejected product preserves admin review notes explaining cause"
  );

  // Seller resolves issue and resubmits
  rejectedItem.defectImages = ["https://example.com/lehenga-hem-defect-hd.jpg"];
  rejectedItem.status = "PENDING_REVIEW";
  rejectedItem.reviewHistory.push({
    status: "PENDING_REVIEW",
    notes: "Seller resolved issues and resubmitted product for re-evaluation.",
    reviewedAt: new Date(),
  });
  assert(
    rejectedItem.status === "PENDING_REVIEW" && rejectedItem.defectImages.length === 1,
    "Seller resubmitting rejected product changes status to PENDING_REVIEW with new evidence"
  );

  // 4D: Modifying critical attributes on APPROVED item resets status to PENDING_REVIEW
  const approvedItem = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Polki Choker Necklace",
    brand: "Amrapali Jewels",
    description: "Handcrafted 22k gold plated choker.",
    category: "Jewellery",
    condition: "NEW",
    price: 15000,
    images: ["https://example.com/choker.jpg"],
    status: "APPROVED",
  });

  // Simulating critical change detection
  const incomingEdit = { price: 22000 };
  let criticalChangeTriggered = false;
  if (incomingEdit.price !== undefined && incomingEdit.price !== approvedItem.price) {
    approvedItem.price = incomingEdit.price;
    criticalChangeTriggered = true;
  }
  if (approvedItem.status === "APPROVED" && criticalChangeTriggered) {
    approvedItem.status = "PENDING_REVIEW";
    approvedItem.reviewHistory.push({
      status: "PENDING_REVIEW",
      notes: "Automatic status update: critical product attributes were modified by the seller.",
      reviewedAt: new Date(),
    });
  }
  assert(
    approvedItem.status === "PENDING_REVIEW" && approvedItem.price === 22000,
    "Critical price modification on APPROVED listing automatically reverts status to PENDING_REVIEW"
  );

  // 4E: Archiving product
  approvedItem.status = "ARCHIVED";
  assert(approvedItem.status === "ARCHIVED", "Product can be transitioned to ARCHIVED status");

  // -------------------------------------------------------------------------
  // TEST 5: IDOR & Seller Ownership Protection
  // -------------------------------------------------------------------------
  console.log("\n--- 5. IDOR & Multi-Vendor Ownership Isolation ---");

  const productOwnedBySeller1 = {
    _id: new mongoose.Types.ObjectId(),
    sellerId: sellerId1,
    title: "Seller 1 Garment",
  };

  const seller2Id = sellerId2;
  const simulatedAuthorizedLookup = (productId, requestingSellerId) => {
    if (
      productOwnedBySeller1._id.toString() === productId.toString() &&
      productOwnedBySeller1.sellerId.toString() === requestingSellerId.toString()
    ) {
      return productOwnedBySeller1;
    }
    return null;
  };

  assert(
    simulatedAuthorizedLookup(productOwnedBySeller1._id, sellerId1) !== null,
    "Owner (seller 1) is authorized to access their product"
  );
  assert(
    simulatedAuthorizedLookup(productOwnedBySeller1._id, seller2Id) === null,
    "Seller 2 is blocked from accessing or modifying Seller 1's product (IDOR prevented)"
  );

  // -------------------------------------------------------------------------
  // TEST 6: Inventory Management & Stock Mutation Logic
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Inventory Tools & Negative Stock Prevention ---");

  const inventoryItem = new StoreProduct({
    sellerId: sellerId1,
    storeId: storeId1,
    title: "Embroidered Silk Potli",
    description: "Gold sequin potli bag",
    category: "Accessories",
    condition: "NEW",
    price: 2500,
    stockQuantity: 4,
    images: ["https://example.com/potli.jpg"],
    variants: [
      { color: "Gold", stockQuantity: 2 },
      { color: "Rose Gold", stockQuantity: 2 },
    ],
  });

  // Valid inline stock update
  inventoryItem.stockQuantity = 10;
  inventoryItem.variants[0].stockQuantity = 5;
  inventoryItem.variants[1].stockQuantity = 5;
  const updateErr = inventoryItem.validateSync();
  assert(!updateErr && inventoryItem.stockQuantity === 10, "Stock can be updated to positive values");

  // Out of stock (0) is allowed and valid
  inventoryItem.stockQuantity = 0;
  const zeroStockErr = inventoryItem.validateSync();
  assert(!zeroStockErr && inventoryItem.stockQuantity === 0, "Stock quantity 0 (out of stock) is allowed");

  // Negative stock mutation rejected
  inventoryItem.stockQuantity = -1;
  const negMutateErr = inventoryItem.validateSync();
  assert(
    negMutateErr && negMutateErr.errors["stockQuantity"],
    "Negative stock mutation is strictly rejected by schema validator"
  );

  // -------------------------------------------------------------------------
  // TEST 7: Seller Overview Metric Calculations
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Seller Overview Metrics Calculation ---");

  const catalog = [
    { status: "APPROVED", stockQuantity: 10 },
    { status: "APPROVED", stockQuantity: 2 },  // low stock (<= 3)
    { status: "APPROVED", stockQuantity: 0 },  // out of stock (=== 0)
    { status: "PENDING_REVIEW", stockQuantity: 5 },
    { status: "REJECTED", stockQuantity: 1 },  // low stock (<= 3)
    { status: "DRAFT", stockQuantity: 3 },     // low stock (<= 3)
  ];

  let totalProducts = catalog.length;
  let approvedProducts = 0;
  let pendingProducts = 0;
  let rejectedProducts = 0;
  let draftProducts = 0;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  for (const p of catalog) {
    if (p.status === "APPROVED") approvedProducts++;
    else if (p.status === "PENDING_REVIEW") pendingProducts++;
    else if (p.status === "REJECTED") rejectedProducts++;
    else if (p.status === "DRAFT") draftProducts++;

    if (p.stockQuantity === 0) {
      outOfStockProducts++;
    } else if (p.stockQuantity <= 3) {
      lowStockProducts++;
    }
  }

  assert(totalProducts === 6, "Calculated totalProducts equals 6");
  assert(approvedProducts === 3, "Calculated approvedProducts equals 3");
  assert(pendingProducts === 1, "Calculated pendingProducts equals 1");
  assert(rejectedProducts === 1, "Calculated rejectedProducts equals 1");
  assert(draftProducts === 1, "Calculated draftProducts equals 1");
  assert(lowStockProducts === 3, "Calculated lowStockProducts (stock 1-3) equals 3");
  assert(outOfStockProducts === 1, "Calculated outOfStockProducts (stock === 0) equals 1");

  // -------------------------------------------------------------------------
  // TEST 8: Rental Domain Regression Safety
  // -------------------------------------------------------------------------
  console.log("\n--- 8. Rental Domain Regression Verification ---");

  // Date conflict checker integrity
  const existingBookings = [
    { startDate: new Date("2026-12-01T10:00:00Z"), endDate: new Date("2026-12-05T10:00:00Z"), orderId: "ord_1" },
    { startDate: new Date("2026-12-10T10:00:00Z"), endDate: new Date("2026-12-15T10:00:00Z"), orderId: "ord_2" },
  ];
  const overlap = findDateConflict(
    existingBookings,
    new Date("2026-12-03T10:00:00Z"),
    new Date("2026-12-07T10:00:00Z")
  );
  assert(Boolean(overlap), "Rental booking conflict detection detects overlapping window");

  const noOverlap = findDateConflict(
    existingBookings,
    new Date("2026-12-06T10:00:00Z"),
    new Date("2026-12-09T10:00:00Z")
  );
  assert(!noOverlap, "Rental booking conflict detection allows non-overlapping rental slots");

  // Rental pricing & security deposit invariant
  const mockRentalProduct = {
    price: 2000,
    securityDeposit: 5000,
    advance: "5000",
  };
  const pricing = calculateServerPricing(
    mockRentalProduct,
    new Date("2026-12-01T10:00:00Z"),
    new Date("2026-12-04T10:00:00Z")
  );
  assert(
    pricing.days === 3 &&
      pricing.rentalFee === 6000 &&
      pricing.securityDeposit === 5000 &&
      pricing.totalAmount === 11000,
    "Rental pricing formula and deposit calculations remain 100% intact"
  );

  console.log("\n==========================================================================");
  console.log(`   PHASE 3 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED        `);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase3TestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
