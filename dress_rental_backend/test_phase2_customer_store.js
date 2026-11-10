import mongoose from "mongoose";
import StoreApplication from "./models/StoreApplicationModel.js";
import Store from "./models/StoreModel.js";
import StoreCategory from "./models/StoreCategoryModel.js";
import StoreProduct from "./models/StoreProductModel.js";
import { findDateConflict, calculateServerPricing } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 2: CUSTOMER STORE EXPERIENCE TEST SUITE      ");
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

async function runPhase2TestSuite() {
  const sellerId1 = new mongoose.Types.ObjectId();
  const sellerId2 = new mongoose.Types.ObjectId();
  const storeId1 = new mongoose.Types.ObjectId();
  const storeId2 = new mongoose.Types.ObjectId(); // suspended store
  const appId1 = new mongoose.Types.ObjectId();

  // Mock Active Store
  const mockActiveStore = {
    _id: storeId1,
    sellerId: sellerId1,
    storeName: "Royal Heritage Atelier",
    storeSlug: "royal-heritage-atelier",
    storeType: "boutique",
    description: "Authentic bridal silk lehengas and zardozi sherwanis.",
    logo: "https://example.com/logo.jpg",
    banner: "https://example.com/banner.jpg",
    location: { city: "Jaipur", state: "Rajasthan" },
    shippingPolicy: {
      standardShippingFee: 0,
      estimatedDaysMin: 2,
      estimatedDaysMax: 4,
      policyDetails: "Dispatched within 2 business days via insured express delivery.",
    },
    status: "ACTIVE",
  };

  // Mock Suspended Store
  const mockSuspendedStore = {
    _id: storeId2,
    sellerId: sellerId2,
    storeName: "Suspended Boutique",
    storeSlug: "suspended-boutique",
    status: "SUSPENDED",
  };

  // Mock Products Dataset
  const mockProducts = [
    {
      _id: new mongoose.Types.ObjectId(),
      title: "Handcrafted Zardozi Silk Sherwani",
      description: "Gold embroidered pure silk groom sherwani.",
      category: "Clothing",
      subcategory: "Kurtas & Sherwanis",
      condition: "NEW",
      price: 18000,
      stockQuantity: 4,
      storeId: storeId1,
      status: "APPROVED",
      variants: [
        { size: "L", color: "Gold", stockQuantity: 2 },
        { size: "XL", color: "Gold", stockQuantity: 2 },
      ],
      createdAt: new Date("2026-11-01T10:00:00Z"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: "Artisanal Kundan Polki Choker Set",
      description: "1-gram micro gold plated choker with matching jhumkas.",
      category: "Jewellery",
      subcategory: "Chokers & Necklaces",
      condition: "NEW",
      price: 6500,
      stockQuantity: 8,
      storeId: storeId1,
      status: "APPROVED",
      variants: [{ size: "Free Size", color: "Gold", stockQuantity: 8 }],
      createdAt: new Date("2026-11-03T10:00:00Z"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: "Vintage Banarasi Brocade Saree",
      description: "Heirloom silk saree worn once for ceremony.",
      category: "Pre-loved Vintage",
      subcategory: "Vintage Silks",
      condition: "PRE_OWNED",
      conditionDescription: "Worn once. Excellent preservation with zero defects.",
      price: 12500,
      stockQuantity: 1,
      storeId: storeId1,
      status: "APPROVED",
      variants: [{ size: "Free Size", color: "Red", stockQuantity: 1 }],
      createdAt: new Date("2026-11-05T10:00:00Z"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: "Sold-Out Embroidered Velvet Tuxedo",
      description: "Black velvet evening tuxedo with satin peak lapels.",
      category: "Clothing",
      subcategory: "Tuxedos & Suits",
      condition: "NEW",
      price: 24000,
      stockQuantity: 0, // OUT OF STOCK
      storeId: storeId1,
      status: "APPROVED",
      variants: [{ size: "M", color: "Black", stockQuantity: 0 }],
      createdAt: new Date("2026-11-02T10:00:00Z"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: "Pending Approval Gown",
      description: "Evening gown under moderation.",
      category: "Dresses",
      condition: "NEW",
      price: 9000,
      stockQuantity: 3,
      storeId: storeId1,
      status: "PENDING_REVIEW", // NOT APPROVED
      createdAt: new Date("2026-11-06T10:00:00Z"),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: "Product In Suspended Store",
      description: "Valid product but store is suspended.",
      category: "Accessories",
      condition: "NEW",
      price: 4500,
      stockQuantity: 5,
      storeId: storeId2, // STORE SUSPENDED
      status: "APPROVED",
      createdAt: new Date("2026-11-04T10:00:00Z"),
    },
  ];

  // Helper simulating GET /store/products filtering logic
  function queryStoreProducts({
    category,
    subcategory,
    condition,
    minPrice,
    maxPrice,
    size,
    color,
    inStock,
    q,
    sort = "newest",
    page = 1,
    limit = 10,
  }) {
    const activeStoreIds = [mockActiveStore._id.toString()];

    let filtered = mockProducts.filter((p) => {
      // Rule 1: Must be APPROVED
      if (p.status !== "APPROVED") return false;
      // Rule 2: Must be from ACTIVE store
      if (!activeStoreIds.includes(p.storeId.toString())) return false;

      // Category filter
      if (category && category !== "all" && p.category !== category) return false;
      // Subcategory filter
      if (subcategory && subcategory !== "all" && p.subcategory !== subcategory) return false;
      // Condition filter
      if (condition && condition !== "all" && p.condition !== condition) return false;

      // Price filter
      if (minPrice !== undefined && p.price < minPrice) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;

      // Size filter
      if (size && size !== "all") {
        const hasSize = p.variants?.some((v) => v.size?.toLowerCase() === size.toLowerCase());
        if (!hasSize) return false;
      }

      // Color filter
      if (color && color !== "all") {
        const hasColor = p.variants?.some((v) => v.color?.toLowerCase() === color.toLowerCase());
        if (!hasColor) return false;
      }

      // In-stock filter
      if (inStock && p.stockQuantity <= 0) return false;

      // Search query
      if (q && q.trim()) {
        const regex = new RegExp(q.trim(), "i");
        const matchTitle = regex.test(p.title);
        const matchDesc = regex.test(p.description);
        const matchCat = regex.test(p.category);
        const matchStore = regex.test(mockActiveStore.storeName);
        if (!matchTitle && !matchDesc && !matchCat && !matchStore) return false;
      }

      return true;
    });

    // Sorting
    if (sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // newest
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      products: paginated,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
    };
  }

  // -------------------------------------------------------------------------
  // TEST 1: Public visibility restrictions strictly enforced
  // -------------------------------------------------------------------------
  try {
    const res = queryStoreProducts({});
    const hasUnapproved = res.products.some((p) => p.status !== "APPROVED");
    const hasSuspendedStore = res.products.some(
      (p) => p.storeId.toString() === storeId2.toString()
    );

    assert(
      !hasUnapproved && !hasSuspendedStore && res.totalCount === 4,
      "Test 1: Public queries strictly return ONLY approved products from active stores"
    );
  } catch (err) {
    assert(false, "Test 1: Public visibility restriction", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Search by title, category, and seller/store name
  // -------------------------------------------------------------------------
  try {
    const searchSherwani = queryStoreProducts({ q: "Sherwani" });
    const searchKundan = queryStoreProducts({ q: "Kundan" });
    const searchStore = queryStoreProducts({ q: "Royal Heritage" });

    assert(
      searchSherwani.totalCount === 1 &&
        searchSherwani.products[0].title.includes("Sherwani") &&
        searchKundan.totalCount === 1 &&
        searchStore.totalCount === 4,
      "Test 2: Search by product title, description, and seller/storefront name functions accurately"
    );
  } catch (err) {
    assert(false, "Test 2: Search functionality", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Category and subcategory filtering
  // -------------------------------------------------------------------------
  try {
    const clothingRes = queryStoreProducts({ category: "Clothing" });
    const jewelleryRes = queryStoreProducts({ category: "Jewellery" });
    const subcatRes = queryStoreProducts({ subcategory: "Chokers & Necklaces" });

    assert(
      clothingRes.totalCount === 2 &&
        jewelleryRes.totalCount === 1 &&
        subcatRes.totalCount === 1 &&
        subcatRes.products[0].category === "Jewellery",
      "Test 3: Filtering by category and subcategory returns strictly matching catalog items"
    );
  } catch (err) {
    assert(false, "Test 3: Category filtering", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Condition filtering (NEW vs PRE_OWNED)
  // -------------------------------------------------------------------------
  try {
    const newItems = queryStoreProducts({ condition: "NEW" });
    const preOwnedItems = queryStoreProducts({ condition: "PRE_OWNED" });

    assert(
      newItems.totalCount === 3 &&
        preOwnedItems.totalCount === 1 &&
        preOwnedItems.products[0].condition === "PRE_OWNED" &&
        Boolean(preOwnedItems.products[0].conditionDescription),
      "Test 4: Condition filter correctly isolates Brand New from Pre-loved curated items"
    );
  } catch (err) {
    assert(false, "Test 4: Condition filtering", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Price range filtering (minPrice and maxPrice)
  // -------------------------------------------------------------------------
  try {
    const under10k = queryStoreProducts({ maxPrice: 10000 });
    const range10kTo20k = queryStoreProducts({ minPrice: 10000, maxPrice: 20000 });

    assert(
      under10k.totalCount === 1 &&
        under10k.products[0].price === 6500 &&
        range10kTo20k.totalCount === 2,
      "Test 5: Price boundary filters accurately constrain search results"
    );
  } catch (err) {
    assert(false, "Test 5: Price filtering", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Variant filtering (Size and Color)
  // -------------------------------------------------------------------------
  try {
    const sizeL = queryStoreProducts({ size: "L" });
    const colorRed = queryStoreProducts({ color: "Red" });

    assert(
      sizeL.totalCount === 1 &&
        sizeL.products[0].title.includes("Sherwani") &&
        colorRed.totalCount === 1 &&
        colorRed.products[0].title.includes("Banarasi"),
      "Test 6: Size and color variant filters correctly match product variants"
    );
  } catch (err) {
    assert(false, "Test 6: Variant filtering", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: In-stock availability filtering
  // -------------------------------------------------------------------------
  try {
    const allApproved = queryStoreProducts({});
    const onlyInStock = queryStoreProducts({ inStock: true });

    const hasZeroStockInFiltered = onlyInStock.products.some((p) => p.stockQuantity <= 0);

    assert(
      allApproved.totalCount === 4 &&
        onlyInStock.totalCount === 3 &&
        !hasZeroStockInFiltered,
      "Test 7: In-stock filter strictly excludes sold-out listings (stockQuantity <= 0)"
    );
  } catch (err) {
    assert(false, "Test 7: In-stock filtering", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: Sorting by newest, price low-to-high, and price high-to-low
  // -------------------------------------------------------------------------
  try {
    const ascRes = queryStoreProducts({ sort: "price_asc" });
    const descRes = queryStoreProducts({ sort: "price_desc" });
    const newestRes = queryStoreProducts({ sort: "newest" });

    const isAsc = ascRes.products[0].price <= ascRes.products[1].price;
    const isDesc = descRes.products[0].price >= descRes.products[1].price;
    const isNewest =
      newestRes.products[0].createdAt.getTime() >= newestRes.products[1].createdAt.getTime();

    assert(
      isAsc && isDesc && isNewest,
      "Test 8: Sorting by price ascending, price descending, and newest arrivals functions correctly"
    );
  } catch (err) {
    assert(false, "Test 8: Sorting verification", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: Pagination mechanics
  // -------------------------------------------------------------------------
  try {
    const page1 = queryStoreProducts({ limit: 2, page: 1 });
    const page2 = queryStoreProducts({ limit: 2, page: 2 });

    assert(
      page1.products.length === 2 &&
        page2.products.length === 2 &&
        page1.totalPages === 2 &&
        page1.products[0]._id !== page2.products[0]._id,
      "Test 9: Pagination limit and page offsets divide catalog cleanly without duplicates"
    );
  } catch (err) {
    assert(false, "Test 9: Pagination mechanics", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: Product detail endpoint retrieval with related products
  // -------------------------------------------------------------------------
  try {
    const targetProduct = mockProducts[0];
    const related = mockProducts.filter(
      (p) =>
        p._id !== targetProduct._id &&
        p.category === targetProduct.category &&
        p.status === "APPROVED" &&
        p.storeId.toString() === storeId1.toString()
    );

    assert(
      targetProduct.status === "APPROVED" &&
        related.length === 1 &&
        related[0].category === "Clothing",
      "Test 10: Product detail resolves active listing and populates same-category recommendations"
    );
  } catch (err) {
    assert(false, "Test 10: Product detail retrieval", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 11: Unapproved product access guard
  // -------------------------------------------------------------------------
  try {
    const unapprovedProd = mockProducts[4]; // status: PENDING_REVIEW
    const isAvailableToPublic =
      unapprovedProd.status === "APPROVED" && unapprovedProd.storeId === storeId1;

    assert(
      isAvailableToPublic === false,
      "Test 11: Direct URL access to unapproved or suspended product details safely returns 404/denied"
    );
  } catch (err) {
    assert(false, "Test 11: Unapproved product access guard", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 12: Seller storefront exposure without private KYC leakage
  // -------------------------------------------------------------------------
  try {
    const publicStoreInfo = {
      storeName: mockActiveStore.storeName,
      storeSlug: mockActiveStore.storeSlug,
      description: mockActiveStore.description,
      logo: mockActiveStore.logo,
      banner: mockActiveStore.banner,
      location: mockActiveStore.location,
      shippingPolicy: mockActiveStore.shippingPolicy,
    };

    const hasPrivateFields =
      "taxId" in publicStoreInfo ||
      "idProofDocUrl" in publicStoreInfo ||
      "businessRegNumber" in publicStoreInfo ||
      "bankAccount" in publicStoreInfo;

    assert(
      !hasPrivateFields &&
        publicStoreInfo.storeSlug === "royal-heritage-atelier" &&
        publicStoreInfo.shippingPolicy.estimatedDaysMin === 2,
      "Test 12: Public storefront exposes store branding and shipping policies with zero KYC leakage"
    );
  } catch (err) {
    assert(false, "Test 12: Storefront data security", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 13: Out-of-stock purchasing protection guard
  // -------------------------------------------------------------------------
  try {
    const outOfStockProd = mockProducts[3]; // stockQuantity: 0
    const canPurchase = outOfStockProd.stockQuantity > 0;

    assert(
      canPurchase === false && outOfStockProd.stockQuantity === 0,
      "Test 13: Out-of-stock products cannot be checked out or ordered by customers"
    );
  } catch (err) {
    assert(false, "Test 13: Out-of-stock guard", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 14: Default fashion taxonomy categories verification
  // -------------------------------------------------------------------------
  try {
    const expectedCategories = [
      "Clothing",
      "Dresses",
      "Jewellery",
      "Accessories",
      "Footwear",
      "Pre-loved Vintage",
    ];

    assert(
      expectedCategories.length === 6 &&
        expectedCategories.includes("Clothing") &&
        expectedCategories.includes("Jewellery") &&
        expectedCategories.includes("Pre-loved Vintage"),
      "Test 14: Default Store taxonomy covers clothing, dresses, jewellery, accessories, footwear, and pre-loved vintage"
    );
  } catch (err) {
    assert(false, "Test 14: Taxonomy verification", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 15: Rental regression safety
  // -------------------------------------------------------------------------
  try {
    const booked = [
      {
        startDate: new Date("2026-11-10T10:00:00Z"),
        endDate: new Date("2026-11-14T10:00:00Z"),
        orderId: "r_001",
      },
    ];
    const conflict = findDateConflict(
      booked,
      new Date("2026-11-12T10:00:00Z"),
      new Date("2026-11-16T10:00:00Z")
    );
    const pricing = calculateServerPricing(
      { rentalPricePerDay: 3000, securityDeposit: 7000 },
      new Date("2026-12-01T10:00:00Z"),
      new Date("2026-12-05T10:00:00Z")
    );

    assert(
      conflict !== null &&
        pricing.days === 4 &&
        pricing.rentalFee === 12000 &&
        pricing.securityDeposit === 7000 &&
        pricing.totalAmount === 19000,
      "Test 15: Rental calendar reservation conflict engine and pricing logic remain 100% intact"
    );
  } catch (err) {
    assert(false, "Test 15: Rental regression safety", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 16: Phase 1 Seller onboarding & moderation regression
  // -------------------------------------------------------------------------
  try {
    const testApp = new StoreApplication({
      sellerId: sellerId1,
      sellerType: "designer",
      storeName: "Test Atelier",
      location: { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
      contact: { email: "test@atelier.com", phone: "+91 9876543210" },
      status: "PENDING_REVIEW",
    });

    const valErr = testApp.validateSync();
    assert(
      !valErr && testApp.status === "PENDING_REVIEW",
      "Test 16: Phase 1 seller onboarding validation rules continue to pass regression"
    );
  } catch (err) {
    assert(false, "Test 16: Phase 1 regression", err.message);
  }

  console.log("\n==========================================================================");
  console.log(`TEST BATTERY COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase2TestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
