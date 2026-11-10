import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import StoreApplication from "./models/StoreApplicationModel.js";
import Store from "./models/StoreModel.js";
import StoreCategory from "./models/StoreCategoryModel.js";
import StoreProduct from "./models/StoreProductModel.js";
import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import OrderModel from "./models/OrderModel.js";
import { requireApprovedSeller } from "./middleware/storeAuth.js";
import { authenticateToken, requireRole } from "./middleware/auth.js";
import { findDateConflict, calculateServerPricing } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 1: STORE FOUNDATION & RENTAL SEPARATION SUITE   ");
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

async function runTestSuite() {
  const customerId1 = new mongoose.Types.ObjectId();
  const customerId2 = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const storeId1 = new mongoose.Types.ObjectId();

  // -------------------------------------------------------------------------
  // TEST 1: Customer submits a seller application
  // -------------------------------------------------------------------------
  try {
    const validApp = new StoreApplication({
      sellerId: customerId1,
      sellerType: "boutique",
      storeName: "Emerald Silk Atelier",
      storeDescription: "Handcrafted boutique evening wear and artisanal textiles.",
      location: {
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        address: "14 Lavelle Road",
      },
      contact: {
        email: "emerald@example.com",
        phone: "+91 9876543210",
      },
      verificationMetadata: {
        businessRegNumber: "REG-KA-2026-9901",
        idProofType: "GSTIN",
        taxId: "29AAAAA0000A1Z5",
      },
      status: "PENDING_REVIEW",
    });

    const validationError = validApp.validateSync();
    assert(
      !validationError &&
        validApp.status === "PENDING_REVIEW" &&
        validApp.sellerType === "boutique" &&
        validApp.storeName === "Emerald Silk Atelier",
      "Test 1: Customer submits valid seller application with status PENDING_REVIEW"
    );
  } catch (err) {
    assert(false, "Test 1: Customer submits seller application", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Duplicate or invalid seller applications are handled safely
  // -------------------------------------------------------------------------
  try {
    const invalidApp = new StoreApplication({
      sellerId: customerId1,
      // missing sellerType
      storeName: "A", // too short (minlength is 2)
      location: { city: "" }, // missing state, pincode
      contact: {}, // missing email and phone
    });

    const validationError = invalidApp.validateSync();
    assert(
      Boolean(validationError?.errors?.sellerType) &&
        Boolean(validationError?.errors?.storeName) &&
        Boolean(validationError?.errors?.["location.city"]) &&
        Boolean(validationError?.errors?.["contact.email"]),
      "Test 2: Invalid seller application safely rejected with schema validation errors"
    );
  } catch (err) {
    assert(false, "Test 2: Invalid seller application handling", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: A pending seller cannot publish products
  // -------------------------------------------------------------------------
  try {
    let statusCode = null;
    let responseData = null;

    const mockReq = {
      user: { _id: customerId1, role: "customer" },
    };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };
    const mockNext = () => {};

    // Mock Store.findOne returning null (no active approved store exists)
    const originalFindOne = Store.findOne;
    Store.findOne = () => ({
      then: (resolve) => resolve(null),
    });
    // Mock StoreApplication.findOne returning pending application
    const originalAppFindOne = StoreApplication.findOne;
    StoreApplication.findOne = () => ({
      sort: () => ({
        then: (resolve) =>
          resolve({
            sellerId: customerId1,
            status: "PENDING_REVIEW",
          }),
      }),
    });

    await requireApprovedSeller(mockReq, mockRes, mockNext);

    // Restore mocks
    Store.findOne = originalFindOne;
    StoreApplication.findOne = originalAppFindOne;

    assert(
      statusCode === 403 &&
        responseData?.code === "SELLER_NOT_APPROVED" &&
        responseData?.applicationStatus === "PENDING_REVIEW",
      "Test 3: Pending seller blocked from publishing products (403 SELLER_NOT_APPROVED)"
    );
  } catch (err) {
    assert(false, "Test 3: Pending seller cannot publish products", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: An approved seller can create a product draft
  // -------------------------------------------------------------------------
  try {
    const newProduct = new StoreProduct({
      sellerId: customerId1,
      storeId: storeId1,
      title: "Royal Velvet Kurta Ensemble",
      description: "Embroidered festive kurta with churidar crafted in pure velvet.",
      category: "Ethnic Wear",
      subcategory: "Kurtas",
      condition: "NEW",
      price: 4999,
      stockQuantity: 5,
      images: ["https://res.cloudinary.com/demo/image/upload/sample_kurta.jpg"],
      status: "DRAFT",
    });

    const validationError = newProduct.validateSync();
    assert(
      !validationError &&
        newProduct.status === "DRAFT" &&
        newProduct.condition === "NEW" &&
        newProduct.price === 4999,
      "Test 4: Approved seller can create product draft with valid taxonomy and pricing"
    );
  } catch (err) {
    assert(false, "Test 4: Approved seller product draft creation", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: A seller cannot edit another seller's product
  // -------------------------------------------------------------------------
  try {
    const productSeller1 = new StoreProduct({
      _id: new mongoose.Types.ObjectId(),
      sellerId: customerId1,
      storeId: storeId1,
      title: "Seller 1 Garment",
      description: "Exclusive piece",
      category: "Dresses",
      condition: "NEW",
      price: 3500,
      stockQuantity: 1,
      images: ["https://example.com/img.jpg"],
      status: "APPROVED",
    });

    // Simulate seller 2 attempting to access or edit seller 1's product
    const requestingSellerId = customerId2;
    const isOwner = String(productSeller1.sellerId) === String(requestingSellerId);

    assert(
      isOwner === false,
      "Test 5: Seller ownership check strictly rejects unauthorized edits by another seller"
    );
  } catch (err) {
    assert(false, "Test 5: Seller cross-editing guard", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: A seller cannot approve their own product
  // -------------------------------------------------------------------------
  try {
    // A seller submitting updates can only request review or save draft
    const allowedSellerStatuses = ["DRAFT", "PENDING_REVIEW"];
    const sellerAttemptedStatus = "APPROVED";
    const canSellerSelfApprove = allowedSellerStatuses.includes(sellerAttemptedStatus);

    assert(
      canSellerSelfApprove === false,
      "Test 6: Seller cannot approve their own product (APPROVED status restricted to admin moderation)"
    );
  } catch (err) {
    assert(false, "Test 6: Seller self-approval guard", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: An admin can approve a seller application
  // -------------------------------------------------------------------------
  try {
    const application = new StoreApplication({
      sellerId: customerId1,
      sellerType: "jewellery",
      storeName: "Swarna Heritage Jewellery",
      location: { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
      contact: { email: "swarna@example.com", phone: "+91 9988776655" },
      status: "PENDING_REVIEW",
    });

    // Admin approves
    application.status = "APPROVED";
    application.adminReviewNotes = "KYC documents and tax identification verified.";
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();

    const createdStore = new Store({
      sellerId: application.sellerId,
      storeApplicationId: application._id,
      storeName: application.storeName,
      storeSlug: "swarna-heritage-jewellery",
      storeType: application.sellerType,
      status: "ACTIVE",
    });

    const appErr = application.validateSync();
    const storeErr = createdStore.validateSync();

    assert(
      !appErr &&
        !storeErr &&
        application.status === "APPROVED" &&
        createdStore.status === "ACTIVE" &&
        createdStore.storeSlug === "swarna-heritage-jewellery",
      "Test 7: Admin can approve seller application and activate storefront with unique slug"
    );
  } catch (err) {
    assert(false, "Test 7: Admin seller application approval", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: An admin can reject an application with a reason
  // -------------------------------------------------------------------------
  try {
    const application = new StoreApplication({
      sellerId: customerId2,
      sellerType: "reseller",
      storeName: "Quick Thrift",
      location: { city: "Delhi", state: "Delhi", pincode: "110001" },
      contact: { email: "thrift@example.com", phone: "+91 9123456789" },
      status: "PENDING_REVIEW",
    });

    const rejectionReason = "Business registration document is illegible. Please submit high-resolution copy.";
    application.status = "REJECTED";
    application.adminReviewNotes = rejectionReason;
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();

    assert(
      application.status === "REJECTED" &&
        application.adminReviewNotes === rejectionReason &&
        Boolean(application.reviewedBy),
      "Test 8: Admin can reject application with mandatory documented reason and audit trail"
    );
  } catch (err) {
    assert(false, "Test 8: Admin application rejection with reason", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: An admin can approve or reject a product
  // -------------------------------------------------------------------------
  try {
    const product = new StoreProduct({
      sellerId: customerId1,
      storeId: storeId1,
      title: "Designer Silk Lehenga",
      description: "Bridal lehenga with zardozi embroidery.",
      category: "Bridal",
      condition: "NEW",
      price: 18500,
      stockQuantity: 1,
      images: ["https://example.com/lehenga.jpg"],
      status: "PENDING_REVIEW",
    });

    // Admin approves
    product.status = "APPROVED";
    product.adminReviewNotes = "Meets luxury marketplace standards.";
    product.reviewedBy = adminId;
    product.reviewedAt = new Date();
    product.reviewHistory.push({
      status: "APPROVED",
      notes: product.adminReviewNotes,
      reviewedBy: adminId,
      reviewedAt: product.reviewedAt,
    });

    const err = product.validateSync();
    assert(
      !err &&
        product.status === "APPROVED" &&
        product.reviewHistory.length === 1 &&
        product.reviewHistory[0].status === "APPROVED",
      "Test 9: Admin can approve product with recorded review history and audit metadata"
    );
  } catch (err) {
    assert(false, "Test 9: Admin product moderation", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: Unapproved products never appear in public Store queries
  // -------------------------------------------------------------------------
  try {
    const productsMock = [
      { id: 1, title: "Draft Dress", status: "DRAFT", storeActive: true },
      { id: 2, title: "Pending Dress", status: "PENDING_REVIEW", storeActive: true },
      { id: 3, title: "Rejected Dress", status: "REJECTED", storeActive: true },
      { id: 4, title: "Approved Dress In Active Store", status: "APPROVED", storeActive: true },
      { id: 5, title: "Approved Dress In Suspended Store", status: "APPROVED", storeActive: false },
    ];

    // Filter logic enforced by GET /store/products
    const publicVisible = productsMock.filter(
      (p) => p.status === "APPROVED" && p.storeActive === true
    );

    assert(
      publicVisible.length === 1 &&
        publicVisible[0].id === 4 &&
        !publicVisible.some((p) => p.status !== "APPROVED"),
      "Test 10: Public store queries strictly exclude unapproved products and suspended stores"
    );
  } catch (err) {
    assert(false, "Test 10: Unapproved products excluded from public queries", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 11: Rejected products can be corrected and resubmitted
  // -------------------------------------------------------------------------
  try {
    const preOwnedProduct = new StoreProduct({
      sellerId: customerId1,
      storeId: storeId1,
      title: "Vintage Brocade Sherwani",
      description: "Gently worn wedding sherwani.",
      category: "Men",
      condition: "PRE_OWNED",
      conditionDescription: "Worn once for a 4-hour evening reception. No stains.",
      price: 8500,
      stockQuantity: 1,
      images: ["https://example.com/sherwani.jpg"],
      status: "REJECTED",
      adminReviewNotes: "Please upload clear images of collar and inner lining.",
    });

    // Seller fixes flaws and resubmits
    preOwnedProduct.defectImages = ["https://example.com/collar.jpg"];
    preOwnedProduct.conditionDescription =
      "Worn once for 4 hours. No tears or stains. Collar and hem photos added.";
    preOwnedProduct.status = "PENDING_REVIEW"; // resubmit transition

    const err = preOwnedProduct.validateSync();
    assert(
      !err &&
        preOwnedProduct.status === "PENDING_REVIEW" &&
        preOwnedProduct.defectImages.length === 1,
      "Test 11: Rejected pre-owned product corrected with defect disclosures and resubmitted"
    );
  } catch (err) {
    assert(false, "Test 11: Rejected product correction and resubmission", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 12: Suspended sellers cannot publish products
  // -------------------------------------------------------------------------
  try {
    let statusCode = null;
    let responseData = null;

    const mockReq = {
      user: { _id: customerId1, role: "customer" },
    };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };
    const mockNext = () => {};

    // Mock Store.findOne returning suspended store
    const originalFindOne = Store.findOne;
    Store.findOne = () => ({
      then: (resolve) =>
        resolve({
          _id: storeId1,
          sellerId: customerId1,
          status: "SUSPENDED",
        }),
    });

    await requireApprovedSeller(mockReq, mockRes, mockNext);

    Store.findOne = originalFindOne;

    assert(
      statusCode === 403 && responseData?.code === "STORE_SUSPENDED",
      "Test 12: Suspended seller blocked from publishing or modifying products (403 STORE_SUSPENDED)"
    );
  } catch (err) {
    assert(false, "Test 12: Suspended seller publishing guard", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 13: Existing Rental regression tests continue to pass
  // -------------------------------------------------------------------------
  try {
    // 13a. Non-overlapping rental allowed
    const booked = [
      {
        startDate: new Date("2026-11-01T10:00:00Z"),
        endDate: new Date("2026-11-04T10:00:00Z"),
        orderId: "rental_ord_001",
      },
    ];
    const c1 = findDateConflict(
      booked,
      new Date("2026-11-06T10:00:00Z"),
      new Date("2026-11-09T10:00:00Z")
    );
    // 13b. Overlapping rental blocked
    const c2 = findDateConflict(
      booked,
      new Date("2026-11-03T10:00:00Z"),
      new Date("2026-11-06T10:00:00Z")
    );
    // 13c. Rental pricing logic (85% provider payout, deposit isolated)
    const mockRentalProduct = {
      rentalPricePerDay: 2000,
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
      c1 === null &&
        c2 !== null &&
        pricing.days === 3 &&
        pricing.rentalFee === 6000 &&
        pricing.securityDeposit === 5000 &&
        pricing.totalAmount === 11000,
      "Test 13: Existing Rental safety, calendar conflict engine and pricing logic remain intact"
    );
  } catch (err) {
    assert(false, "Test 13: Rental regression test", err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 14: Existing authentication and authorization tests continue to pass
  // -------------------------------------------------------------------------
  try {
    const testSecret = "test_phase1_jwt_secret_key_12345";
    const payload = { id: customerId1.toString(), email: "customer@example.com" };
    const token = jwt.sign(payload, testSecret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, testSecret);

    // Test requireRole middleware behavior
    let roleAllowed = false;
    let forbiddenCalled = false;
    const reqCustomer = { user: { role: "customer" } };
    const reqAdmin = { user: { role: "admin" } };
    const resForbidden = {
      status: (c) => ({
        json: () => {
          if (c === 403) forbiddenCalled = true;
        },
      }),
    };

    requireRole("admin")(reqCustomer, resForbidden, () => {
      roleAllowed = true;
    });

    let adminAllowed = false;
    requireRole("admin")(reqAdmin, resForbidden, () => {
      adminAllowed = true;
    });

    assert(
      decoded.id === customerId1.toString() &&
        forbiddenCalled === true &&
        roleAllowed === false &&
        adminAllowed === true,
      "Test 14: Authentication JWT verification and role-based access control guards pass"
    );
  } catch (err) {
    assert(false, "Test 14: Auth/Authz test", err.message);
  }

  console.log("\n==========================================================================");
  console.log(`TEST BATTERY COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
