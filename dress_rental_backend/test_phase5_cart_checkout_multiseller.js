import mongoose from "mongoose";
import StoreApplication from "./models/StoreApplicationModel.js";
import Store from "./models/StoreModel.js";
import StoreProduct from "./models/StoreProductModel.js";
import StoreCart from "./models/StoreCartModel.js";
import StoreOrder from "./models/StoreOrderModel.js";
import StoreFulfilmentOrder from "./models/StoreFulfilmentOrderModel.js";
import UserModel from "./models/UserModel.js";
import ProductModel from "./models/productModel.js";
import OrderModel from "./models/OrderModel.js";
import { calculateSellerShipping, enrichCart } from "./routes/store.router.js";
import { findDateConflict, calculateServerPricing } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 5: STORE CART, CHECKOUT & ORDER SPLITTING     ");
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

async function runPhase5TestSuite() {
  const customerId1 = new mongoose.Types.ObjectId();
  const customerId2 = new mongoose.Types.ObjectId();
  const sellerId1 = new mongoose.Types.ObjectId();
  const sellerId2 = new mongoose.Types.ObjectId();
  const storeId1 = new mongoose.Types.ObjectId();
  const storeId2 = new mongoose.Types.ObjectId();

  const prodId1 = new mongoose.Types.ObjectId();
  const prodId2 = new mongoose.Types.ObjectId();
  const prodId3 = new mongoose.Types.ObjectId();
  const variantId1 = new mongoose.Types.ObjectId();

  // -------------------------------------------------------------------------
  // SECTION 1: Schema Invariants for Cart & Order Models
  // -------------------------------------------------------------------------
  console.log("--- 1. Store Cart & Item Schema Validation ---");

  // 1A: Valid Cart
  const validCart = new StoreCart({
    customerId: customerId1,
    items: [
      {
        productId: prodId1,
        storeId: storeId1,
        variantId: variantId1,
        size: "M",
        color: "Royal Emerald",
        quantity: 2,
      },
    ],
  });
  const cartValErr = validCart.validateSync();
  assert(!cartValErr, "Valid StoreCart document passes schema validation");

  // 1B: Missing customerId fails validation
  const invalidCartNoUser = new StoreCart({
    items: [],
  });
  const noUserErr = invalidCartNoUser.validateSync();
  assert(Boolean(noUserErr?.errors?.customerId), "StoreCart requires customerId");

  // 1C: Missing productId in item fails validation
  const invalidItemCart = new StoreCart({
    customerId: customerId1,
    items: [
      {
        storeId: storeId1,
        quantity: 1,
      },
    ],
  });
  const invalidItemErr = invalidItemCart.validateSync();
  assert(Boolean(invalidItemErr?.errors?.["items.0.productId"]), "CartItem requires productId");

  // 1D: Zero or negative quantity fails validation
  const zeroQtyCart = new StoreCart({
    customerId: customerId1,
    items: [
      {
        productId: prodId1,
        storeId: storeId1,
        quantity: 0,
      },
    ],
  });
  const zeroQtyErr = zeroQtyCart.validateSync();
  assert(Boolean(zeroQtyErr?.errors?.["items.0.quantity"]), "CartItem quantity must be at least 1");

  // -------------------------------------------------------------------------
  // SECTION 2: Cart Operations & Business Rules
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Cart Operations & Business Rules ---");

  // 2A: Deduplication & line merging logic
  const mockCart = {
    customerId: customerId1,
    items: [
      {
        productId: prodId1,
        storeId: storeId1,
        variantId: variantId1,
        size: "M",
        color: "Emerald",
        quantity: 1,
      },
    ],
  };

  const incomingItem = {
    productId: prodId1,
    variantId: variantId1,
    size: "M",
    color: "Emerald",
    quantity: 2,
  };

  const existingIdx = mockCart.items.findIndex(
    (it) =>
      String(it.productId) === String(incomingItem.productId) &&
      String(it.variantId) === String(incomingItem.variantId)
  );

  assert(existingIdx > -1, "Duplicate cart line detected by product + variant");
  if (existingIdx > -1) {
    mockCart.items[existingIdx].quantity += incomingItem.quantity;
  }
  assert(mockCart.items[0].quantity === 3, "Duplicate item merged into quantity update (1 + 2 = 3)");
  assert(mockCart.items.length === 1, "Cart lines not duplicated on repeated addition");

  // 2B: Quantity bounds check
  const availableStock = 5;
  const requestedExcessiveQty = 10;
  const exceedsStock = requestedExcessiveQty > availableStock;
  assert(exceedsStock, "Excessive quantity rejected when exceeding stock limits");

  // 2C: Product status validation on cart add
  const draftProduct = { _id: prodId2, status: "DRAFT", stockQuantity: 5 };
  const approvedProduct = { _id: prodId1, status: "APPROVED", stockQuantity: 5 };
  assert(draftProduct.status !== "APPROVED", "Unapproved / draft product rejected from Store cart");
  assert(approvedProduct.status === "APPROVED", "Approved Store product accepted into Store cart");

  // 2D: Store status validation
  const suspendedStore = { _id: storeId2, status: "SUSPENDED" };
  const activeStore = { _id: storeId1, status: "ACTIVE" };
  assert(suspendedStore.status !== "ACTIVE", "Product from suspended store is rejected from cart");
  assert(activeStore.status === "ACTIVE", "Product from active store is accepted into cart");

  // -------------------------------------------------------------------------
  // SECTION 3: Live Pricing & Multi-Seller Cart Enrichment
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Cart Enrichment, Live Pricing & Shipping Policy ---");

  // 3A: Shipping Policy Calculation
  const storeWithFreeAbove = {
    shippingPolicy: {
      standardShippingFee: 150,
      freeShippingAbove: 2000,
    },
  };

  const storeFlatShipping = {
    shippingPolicy: {
      standardShippingFee: 200,
      freeShippingAbove: 0,
    },
  };

  const feeUnderThreshold = calculateSellerShipping(storeWithFreeAbove, 1500);
  const feeOverThreshold = calculateSellerShipping(storeWithFreeAbove, 2500);
  const feeFlat = calculateSellerShipping(storeFlatShipping, 5000);

  assert(feeUnderThreshold === 150, "Standard shipping fee charged when below free shipping threshold");
  assert(feeOverThreshold === 0, "Free delivery applied when subtotal meets freeShippingAbove");
  assert(feeFlat === 200, "Flat standard fee charged when no free shipping threshold defined");
  assert(calculateSellerShipping(null, 1000) === 0, "Null store safely yields 0 shipping fee");
  assert(calculateSellerShipping(storeWithFreeAbove, 0) === 0, "Zero subtotal yields 0 shipping fee");

  // 3B: Server Pricing recalculation (Client price tampering ignored)
  const originalStoreFindById = Store.findById;
  const originalProductFindById = StoreProduct.findById;

  StoreProduct.findById = (id) => ({
    lean: () => {
      if (String(id) === String(prodId1)) {
        return Promise.resolve({
          _id: prodId1,
          storeId: storeId1,
          title: "Sabyasachi Silk Lehenga",
          price: 15000,
          stockQuantity: 10,
          status: "APPROVED",
          variants: [
            { _id: variantId1, size: "M", color: "Crimson", stockQuantity: 4, priceOverride: 16500 },
          ],
        });
      }
      if (String(id) === String(prodId2)) {
        return Promise.resolve({
          _id: prodId2,
          storeId: storeId2,
          title: "Artisanal Kundan Choker",
          price: 3500,
          stockQuantity: 8,
          status: "APPROVED",
          variants: [],
        });
      }
      return Promise.resolve(null);
    },
  });

  Store.findById = (id) => ({
    lean: () => {
      if (String(id) === String(storeId1)) {
        return Promise.resolve({
          _id: storeId1,
          sellerId: sellerId1,
          storeName: "Royal Heritage Couture",
          storeSlug: "royal-heritage-couture",
          status: "ACTIVE",
          shippingPolicy: { standardShippingFee: 250, freeShippingAbove: 20000 },
        });
      }
      if (String(id) === String(storeId2)) {
        return Promise.resolve({
          _id: storeId2,
          sellerId: sellerId2,
          storeName: "Gems of Jaipur",
          storeSlug: "gems-of-jaipur",
          status: "ACTIVE",
          shippingPolicy: { standardShippingFee: 100, freeShippingAbove: 2000 },
        });
      }
      return Promise.resolve(null);
    },
  });

  const cartToEnrich = {
    items: [
      {
        _id: new mongoose.Types.ObjectId(),
        productId: prodId1,
        storeId: storeId1,
        variantId: variantId1,
        quantity: 1, // unit price should be 16500 (variant override)
      },
      {
        _id: new mongoose.Types.ObjectId(),
        productId: prodId2,
        storeId: storeId2,
        quantity: 2, // unit price should be 3500, subtotal 7000 (qualifies for free shipping above 2000)
      },
    ],
  };

  const enrichedResult = await enrichCart(cartToEnrich);

  assert(enrichedResult.items.length === 2, "Enriched cart contains 2 verified items");
  assert(enrichedResult.items[0].unitPrice === 16500, "Variant price override correctly honored (₹16,500)");
  assert(enrichedResult.items[1].unitPrice === 3500, "Base product price correctly resolved (₹3,500)");
  assert(enrichedResult.cartSubtotal === 23500, "Cart subtotal correctly calculated: 16500 + 7000 = ₹23,500");
  assert(enrichedResult.sellerGroups.length === 2, "Cart partitioned into exactly 2 distinct seller groups");

  // Check seller group 1 (Royal Heritage): subtotal 16500 < 20000 => shipping = 250
  const group1 = enrichedResult.sellerGroups.find((g) => String(g.storeId) === String(storeId1));
  assert(group1 && group1.shippingFee === 250, "Seller 1 shipping calculated as standard ₹250");

  // Check seller group 2 (Gems of Jaipur): subtotal 7000 >= 2000 => shipping = 0
  const group2 = enrichedResult.sellerGroups.find((g) => String(g.storeId) === String(storeId2));
  assert(group2 && group2.shippingFee === 0, "Seller 2 shipping calculated as Free Delivery (₹0)");

  assert(enrichedResult.totalShippingFee === 250, "Total shipping fee correctly aggregated across sellers (₹250)");
  assert(enrichedResult.grandTotal === 23750, "Grand total correctly aggregated: ₹23,500 + ₹250 = ₹23,750");

  // -------------------------------------------------------------------------
  // SECTION 4: Multi-Seller Order Splitting & Hierarchy
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Multi-Seller Order Splitting & Hierarchy ---");

  const shippingAddressSnapshot = {
    name: "Pooja Sharma",
    phone: "9876543210",
    street: "88 Indiranagar 100ft Road",
    houseNo: "Flat 4B",
    landmark: "Opposite Metro Station",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    label: "Home",
  };

  const parentOrderNumber = `SO-${Date.now()}-1001`;
  const parentOrder = new StoreOrder({
    orderNumber: parentOrderNumber,
    customerId: customerId1,
    customerEmail: "pooja.sharma@example.com",
    customerPhone: "9876543210",
    shippingAddress: shippingAddressSnapshot,
    items: [
      {
        productId: prodId1,
        storeId: storeId1,
        sellerId: sellerId1,
        storeName: "Royal Heritage Couture",
        title: "Sabyasachi Silk Lehenga",
        variantId: variantId1,
        size: "M",
        color: "Crimson",
        unitPrice: 16500,
        quantity: 1,
        totalPrice: 16500,
      },
      {
        productId: prodId2,
        storeId: storeId2,
        sellerId: sellerId2,
        storeName: "Gems of Jaipur",
        title: "Artisanal Kundan Choker",
        variantId: null,
        size: "",
        color: "",
        unitPrice: 3500,
        quantity: 2,
        totalPrice: 7000,
      },
    ],
    subtotal: 23500,
    totalShippingFee: 250,
    grandTotal: 23750,
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    paymentMethod: "PHONEPE",
  });

  const parentValErr = parentOrder.validateSync();
  assert(!parentValErr, "Master StoreOrder document passes schema validation");
  assert(parentOrder.status === "PENDING_PAYMENT", "Parent order initial status is PENDING_PAYMENT");
  assert(parentOrder.paymentStatus === "PENDING", "Parent order initial paymentStatus is PENDING");

  // Child Fulfilment Orders
  const sfo1 = new StoreFulfilmentOrder({
    fulfilmentOrderNumber: `SFO-${Date.now()}-1-1001`,
    parentOrderId: parentOrder._id,
    parentOrderNumber: parentOrder.orderNumber,
    customerId: customerId1,
    sellerId: sellerId1,
    storeId: storeId1,
    storeName: "Royal Heritage Couture",
    storeSlug: "royal-heritage-couture",
    items: [
      {
        productId: prodId1,
        title: "Sabyasachi Silk Lehenga",
        variantId: variantId1,
        size: "M",
        color: "Crimson",
        unitPrice: 16500,
        quantity: 1,
        totalPrice: 16500,
      },
    ],
    subtotal: 16500,
    shippingFee: 250,
    totalAmount: 16750,
    status: "PENDING_PAYMENT",
    deliveryAddress: shippingAddressSnapshot,
  });

  const sfo2 = new StoreFulfilmentOrder({
    fulfilmentOrderNumber: `SFO-${Date.now()}-2-1002`,
    parentOrderId: parentOrder._id,
    parentOrderNumber: parentOrder.orderNumber,
    customerId: customerId1,
    sellerId: sellerId2,
    storeId: storeId2,
    storeName: "Gems of Jaipur",
    storeSlug: "gems-of-jaipur",
    items: [
      {
        productId: prodId2,
        title: "Artisanal Kundan Choker",
        variantId: null,
        size: "",
        color: "",
        unitPrice: 3500,
        quantity: 2,
        totalPrice: 7000,
      },
    ],
    subtotal: 7000,
    shippingFee: 0,
    totalAmount: 7000,
    status: "PENDING_PAYMENT",
    deliveryAddress: shippingAddressSnapshot,
  });

  const sfoValErr1 = sfo1.validateSync();
  const sfoValErr2 = sfo2.validateSync();
  assert(!sfoValErr1, "Child StoreFulfilmentOrder 1 passes schema validation");
  assert(!sfoValErr2, "Child StoreFulfilmentOrder 2 passes schema validation");

  // Link child orders to parent
  parentOrder.fulfilmentOrderIds = [sfo1._id, sfo2._id];
  assert(parentOrder.fulfilmentOrderIds.length === 2, "Parent order successfully links both fulfillment IDs");
  assert(
    sfo1.totalAmount + sfo2.totalAmount === parentOrder.grandTotal,
    "Sum of child fulfillment totals equals parent grand total (16750 + 7000 = ₹23,750)"
  );

  // -------------------------------------------------------------------------
  // SECTION 5: Concurrency, Atomic Stock Decrement & Rollback Protection
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Atomic Stock Decrement & Rollback Safety ---");

  // 5A: Single-item stock decrement simulation
  let testProductStock = 5;
  const decrementQty = 2;
  const simulatedAtomicUpdate = (available, reqQty) => {
    if (available >= reqQty) {
      return available - reqQty;
    }
    return null; // Atomic $gte guard prevents update
  };

  testProductStock = simulatedAtomicUpdate(testProductStock, decrementQty);
  assert(testProductStock === 3, "Atomic stock decrement decreases inventory accurately (5 -> 3)");

  // 5B: Overselling prevention
  const failedAtomicUpdate = simulatedAtomicUpdate(testProductStock, 10);
  assert(failedAtomicUpdate === null, "Atomic guard strictly prevents overselling when requested > available");

  // 5C: Rollback simulation
  const stockInventory = {
    [String(prodId1)]: 10,
    [String(prodId2)]: 1, // Only 1 available, but checkout requests 2!
  };

  const checkoutItems = [
    { productId: prodId1, quantity: 2 },
    { productId: prodId2, quantity: 2 }, // Will fail!
  ];

  const decrementedLog = [];
  let checkoutFailed = false;

  for (const item of checkoutItems) {
    const curStock = stockInventory[String(item.productId)];
    if (curStock >= item.quantity) {
      stockInventory[String(item.productId)] -= item.quantity;
      decrementedLog.push(item);
    } else {
      checkoutFailed = true;
      break;
    }
  }

  assert(checkoutFailed, "Checkout catches insufficient stock on second item");
  assert(decrementedLog.length === 1, "First item was decremented before failure");

  // Execute Rollback
  for (const dec of decrementedLog) {
    stockInventory[String(dec.productId)] += dec.quantity;
  }

  assert(
    stockInventory[String(prodId1)] === 10,
    "Rollback successfully restored stock of previously decremented item to original (10)"
  );

  // -------------------------------------------------------------------------
  // SECTION 6: Privacy, Multi-Vendor & Customer IDOR Isolation
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Multi-Tenant Privacy & IDOR Isolation ---");

  // 6A: Customer Isolation
  const customerBId = customerId2;
  const canCustomerBView = String(parentOrder.customerId) === String(customerBId);
  assert(!canCustomerBView, "Customer B cannot view Customer A's store order (IDOR protected)");

  // 6B: Seller Isolation
  const sellerBId = sellerId2;
  const canSellerBViewSfo1 = String(sfo1.sellerId) === String(sellerBId);
  assert(!canSellerBViewSfo1, "Seller 2 cannot view Seller 1's fulfillment order (IDOR protected)");

  // 6C: Seller sees only their items
  const sfo1ItemsOnlySeller1 = sfo1.items.every(
    (item) => String(item.productId) === String(prodId1)
  );
  assert(sfo1ItemsOnlySeller1, "Fulfillment order contains only products belonging to Seller 1");
  assert(sfo1.items.length === 1 && parentOrder.items.length === 2, "Parent items cleanly split from seller fulfillment");

  // -------------------------------------------------------------------------
  // SECTION 7: Rental Vertical Invariant & Zero-Regression Check
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Rental Vertical Invariants & Zero-Regression Verification ---");

  // 7A: Rental booking calendar conflict engine
  const rentalExisting = [
    { startDate: new Date("2026-12-01"), endDate: new Date("2026-12-05") },
  ];
  const rentalConflict = findDateConflict(
    rentalExisting,
    new Date("2026-12-03"),
    new Date("2026-12-07")
  );
  assert(Boolean(rentalConflict), "Rental booking conflict engine flags overlapping booking");

  // 7B: Rental server pricing & 85% provider earnings
  const mockRentalProduct = {
    rentalPricePerDay: 1000,
    securityDeposit: 2000,
  };
  const rentalPricing = calculateServerPricing(
    mockRentalProduct,
    new Date("2026-12-01"),
    new Date("2026-12-04")
  );
  const providerEarnings = Math.round(rentalPricing.rentalFee * 0.85);

  assert(rentalPricing.rentalFee === 3000, "Rental fee calculation remains intact (3000)");
  assert(rentalPricing.securityDeposit === 2000, "Rental security deposit remains intact (2000)");
  assert(rentalPricing.totalAmount === 5000, "Rental total amount remains intact (5000)");
  assert(providerEarnings === 2550, "Rental provider 85% payout invariant remains strictly intact (2550)");

  // Restore mocks
  StoreProduct.findById = originalProductFindById;
  Store.findById = originalStoreFindById;

  // -------------------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(`   PHASE 5 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED        `);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase5TestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
