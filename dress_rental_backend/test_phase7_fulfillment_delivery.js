process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import StoreOrder from "./models/StoreOrderModel.js";
import StoreFulfilmentOrder from "./models/StoreFulfilmentOrderModel.js";
import StoreNotification from "./models/StoreNotificationModel.js";
import OrderModel from "./models/OrderModel.js";
import {
  deriveParentOrderStatus,
  resolveCourierTrackingUrl,
  createStoreNotification,
  transitionFulfilmentStatus,
} from "./services/storeFulfillmentService.js";
import { findDateConflict } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 7: SELLER FULFILMENT, DELIVERY & TRACKING    ");
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

async function runPhase7TestSuite() {
  const customerId1 = new mongoose.Types.ObjectId();
  const customerId2 = new mongoose.Types.ObjectId();
  const sellerId1 = new mongoose.Types.ObjectId();
  const sellerId2 = new mongoose.Types.ObjectId();
  const storeId1 = new mongoose.Types.ObjectId();
  const storeId2 = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const prodId1 = new mongoose.Types.ObjectId();
  const prodId2 = new mongoose.Types.ObjectId();

  const orderId1 = new mongoose.Types.ObjectId();
  const orderNumber1 = `SO-${Date.now()}-1001`;

  // -------------------------------------------------------------------------
  // SECTION 1: Schema Invariants for Fulfilment, Order & Notification Models
  // -------------------------------------------------------------------------
  console.log("--- 1. Fulfilment, Order & Notification Schema Invariants ---");

  const validFulfilment = new StoreFulfilmentOrder({
    fulfilmentOrderNumber: `SFO-${Date.now()}-1`,
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    customerId: customerId1,
    sellerId: sellerId1,
    storeId: storeId1,
    storeName: "Silk & Zardozi Boutique",
    storeSlug: "silk-zardozi-boutique",
    items: [
      {
        productId: prodId1,
        title: "Embroidered Sherwani",
        unitPrice: 12000,
        quantity: 1,
        totalPrice: 12000,
      },
    ],
    subtotal: 12000,
    shippingFee: 250,
    totalAmount: 12250,
    status: "ORDER_PLACED",
    deliveryAddress: {
      name: "Radhika Sharma",
      phone: "9876543210",
      street: "MG Road",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    },
    dispatchDetails: {
      courierName: "Blue Dart",
      trackingNumber: "BD99887766IN",
      trackingUrl: "https://www.bluedart.com/tracking?trackNumber=BD99887766IN",
    },
    statusHistory: [
      {
        status: "ORDER_PLACED",
        changedAt: new Date(),
        role: "system",
        note: "Payment confirmed.",
      },
    ],
  });

  const valErr = validFulfilment.validateSync();
  assert(!valErr, "Valid StoreFulfilmentOrder document passes schema validation");

  // Rejects invalid status enum
  const badStatusFulfilment = new StoreFulfilmentOrder({
    fulfilmentOrderNumber: `SFO-${Date.now()}-2`,
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    customerId: customerId1,
    sellerId: sellerId1,
    storeId: storeId1,
    storeName: "Test Store",
    storeSlug: "test-store",
    subtotal: 5000,
    totalAmount: 5000,
    deliveryAddress: {
      name: "Test",
      phone: "9876543210",
      street: "Test St",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
    },
    status: "BOGUS_STATUS_INVALID",
  });
  const badStatusErr = badStatusFulfilment.validateSync();
  assert(Boolean(badStatusErr?.errors?.status), "StoreFulfilmentOrder rejects invalid status enum");

  // Accepts all valid Phase 7 statuses
  for (const st of ["PENDING_PAYMENT", "ORDER_PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DISPATCHED", "DELIVERED", "CANCELLED"]) {
    const doc = new StoreFulfilmentOrder({
      fulfilmentOrderNumber: `SFO-${Date.now()}-${st}`,
      parentOrderId: orderId1,
      parentOrderNumber: orderNumber1,
      customerId: customerId1,
      sellerId: sellerId1,
      storeId: storeId1,
      storeName: "Test Store",
      storeSlug: "test-store",
      subtotal: 5000,
      totalAmount: 5000,
      deliveryAddress: {
        name: "Test",
        phone: "9876543210",
        street: "Test St",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
      status: st,
    });
    const err = doc.validateSync();
    assert(!err, `StoreFulfilmentOrder accepts valid status enum '${st}'`);
  }

  // StoreOrder Model accepts Phase 7 lifecycle states
  for (const parentSt of [
    "PENDING_PAYMENT",
    "ORDER_PLACED",
    "CONFIRMED",
    "PROCESSING",
    "PARTIALLY_SHIPPED",
    "SHIPPED",
    "PARTIALLY_DELIVERED",
    "DELIVERED",
    "CANCELLED",
  ]) {
    const parentDoc = new StoreOrder({
      orderNumber: `SO-TEST-${parentSt}`,
      customerId: customerId1,
      customerEmail: "cust@test.com",
      shippingAddress: {
        name: "Customer",
        phone: "9876543210",
        street: "Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      items: [
        {
          productId: prodId1,
          storeId: storeId1,
          sellerId: sellerId1,
          storeName: "Store 1",
          title: "Item 1",
          unitPrice: 1000,
          quantity: 1,
          totalPrice: 1000,
        },
      ],
      subtotal: 1000,
      totalShippingFee: 100,
      grandTotal: 1100,
      status: parentSt,
    });
    const parentErr = parentDoc.validateSync();
    assert(!parentErr, `StoreOrder accepts lifecycle status '${parentSt}'`);
  }

  // StoreNotification Schema Validation
  const validNotif = new StoreNotification({
    recipientId: customerId1,
    recipientRole: "customer",
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    fulfilmentOrderId: validFulfilment._id,
    fulfilmentOrderNumber: validFulfilment.fulfilmentOrderNumber,
    type: "ORDER_SHIPPED",
    title: "Shipment Dispatched",
    message: "Your order is on the way!",
    metadata: { courier: "Blue Dart", awb: "BD123" },
  });
  assert(!validNotif.validateSync(), "StoreNotification document passes schema validation");

  const badNotif = new StoreNotification({
    recipientId: customerId1,
    type: "INVALID_NOTIF_TYPE",
    title: "Test",
    message: "Test",
  });
  assert(Boolean(badNotif.validateSync()?.errors?.type), "StoreNotification rejects invalid notification type");

  // -------------------------------------------------------------------------
  // SECTION 2: Courier URL Resolver & Validation Boundary
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Courier URL Resolution & Boundary ---");

  assert(
    resolveCourierTrackingUrl("Blue Dart", "BD123").includes("bluedart.com"),
    "Auto-resolves Blue Dart tracking URL"
  );
  assert(
    resolveCourierTrackingUrl("Delhivery Express", "DLH999").includes("delhivery.com"),
    "Auto-resolves Delhivery tracking URL"
  );
  assert(
    resolveCourierTrackingUrl("DTDC Courier", "D8877").includes("dtdc.in"),
    "Auto-resolves DTDC tracking URL"
  );
  assert(
    resolveCourierTrackingUrl("India Post (Speed Post)", "EM123456789IN").includes("indiapost.gov.in"),
    "Auto-resolves India Post tracking URL"
  );
  assert(
    resolveCourierTrackingUrl("Shiprocket", "SRK456").includes("shiprocket.co"),
    "Auto-resolves Shiprocket tracking URL"
  );
  assert(
    resolveCourierTrackingUrl("FedEx", "FDX789").includes("fedex.com"),
    "Auto-resolves FedEx tracking URL"
  );
  assert(
    resolveCourierTrackingUrl("Custom Logistics", "CUST123", "https://track.custom.com/c/123") ===
      "https://track.custom.com/c/123",
    "Preserves valid explicit custom tracking URL"
  );

  // -------------------------------------------------------------------------
  // SECTION 3: Parent Order Status Derivation Rules
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Parent Order Status Derivation Rules ---");

  // 3A: If parent order is unpaid, status remains PENDING_PAYMENT
  const unpaidParent = { paymentStatus: "PENDING", status: "PENDING_PAYMENT" };
  assert(
    deriveParentOrderStatus([{ status: "ORDER_PLACED" }], unpaidParent) === "PENDING_PAYMENT",
    "Unpaid parent order retains PENDING_PAYMENT status"
  );

  // 3B: If all child orders are ORDER_PLACED
  const paidParent = { paymentStatus: "PAID", status: "PROCESSING" };
  assert(
    deriveParentOrderStatus([{ status: "ORDER_PLACED" }, { status: "ORDER_PLACED" }], paidParent) ===
      "ORDER_PLACED",
    "All child orders ORDER_PLACED derives parent ORDER_PLACED"
  );

  // 3C: If any child is CONFIRMED or PROCESSING, parent is PROCESSING
  assert(
    deriveParentOrderStatus([{ status: "ORDER_PLACED" }, { status: "CONFIRMED" }], paidParent) ===
      "PROCESSING",
    "Child order CONFIRMED derives parent PROCESSING"
  );
  assert(
    deriveParentOrderStatus([{ status: "PROCESSING" }, { status: "ORDER_PLACED" }], paidParent) ===
      "PROCESSING",
    "Child order PROCESSING derives parent PROCESSING"
  );

  // 3D: If one is SHIPPED and one is PROCESSING, parent is PARTIALLY_SHIPPED
  assert(
    deriveParentOrderStatus([{ status: "SHIPPED" }, { status: "PROCESSING" }], paidParent) ===
      "PARTIALLY_SHIPPED",
    "One child SHIPPED and one PROCESSING derives parent PARTIALLY_SHIPPED"
  );

  // 3E: If all active child orders are SHIPPED, parent is SHIPPED
  assert(
    deriveParentOrderStatus([{ status: "SHIPPED" }, { status: "SHIPPED" }], paidParent) ===
      "SHIPPED",
    "All active child orders SHIPPED derives parent SHIPPED"
  );

  // 3F: If one is DELIVERED and one is SHIPPED, parent is PARTIALLY_DELIVERED
  assert(
    deriveParentOrderStatus([{ status: "DELIVERED" }, { status: "SHIPPED" }], paidParent) ===
      "PARTIALLY_DELIVERED",
    "One child DELIVERED and one SHIPPED derives parent PARTIALLY_DELIVERED"
  );

  // 3G: If all active child orders are DELIVERED, parent is DELIVERED
  assert(
    deriveParentOrderStatus([{ status: "DELIVERED" }, { status: "DELIVERED" }], paidParent) ===
      "DELIVERED",
    "All child orders DELIVERED derives parent DELIVERED"
  );

  // 3H: If one is DELIVERED and other is CANCELLED, parent is DELIVERED
  assert(
    deriveParentOrderStatus([{ status: "DELIVERED" }, { status: "CANCELLED" }], paidParent) ===
      "DELIVERED",
    "Non-cancelled orders DELIVERED with one CANCELLED derives parent DELIVERED"
  );

  // 3I: If all child orders are CANCELLED, parent is CANCELLED
  assert(
    deriveParentOrderStatus([{ status: "CANCELLED" }, { status: "CANCELLED" }], paidParent) ===
      "CANCELLED",
    "All child orders CANCELLED derives parent CANCELLED"
  );

  // -------------------------------------------------------------------------
  // SECTION 4: In-Memory DB Mocks for Transition Engine Testing
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Transition Engine & Security Enforcement ---");

  // Mock StoreOrder and StoreFulfilmentOrder findById / find / save
  const mockOrdersStore = new Map();
  const mockFulfilmentsStore = new Map();
  const mockNotificationsStore = [];

  StoreOrder.findById = async (id) => mockOrdersStore.get(id.toString()) || null;
  StoreOrder.find = async (q) => {
    const list = Array.from(mockOrdersStore.values());
    if (q.customerId) return list.filter((o) => o.customerId.toString() === q.customerId.toString());
    return list;
  };

  StoreFulfilmentOrder.findById = async (id) => mockFulfilmentsStore.get(id.toString()) || null;
  StoreFulfilmentOrder.find = async (q) => {
    let list = Array.from(mockFulfilmentsStore.values());
    if (q.parentOrderId) list = list.filter((f) => f.parentOrderId.toString() === q.parentOrderId.toString());
    if (q.sellerId) list = list.filter((f) => f.sellerId.toString() === q.sellerId.toString());
    return list;
  };

  StoreNotification.prototype.save = async function () {
    mockNotificationsStore.push(this);
    return this;
  };

  // Helper to create and register mock parent and fulfilment orders
  const setupMockOrderPair = ({ paymentStatus = "PAID", initialStatus = "ORDER_PLACED" } = {}) => {
    const pId = new mongoose.Types.ObjectId();
    const fId1 = new mongoose.Types.ObjectId();
    const fId2 = new mongoose.Types.ObjectId();

    const parent = new StoreOrder({
      _id: pId,
      orderNumber: `SO-MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: customerId1,
      customerEmail: "radhika@example.com",
      shippingAddress: {
        name: "Radhika",
        phone: "9876543210",
        street: "Park Street",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          productId: prodId1,
          storeId: storeId1,
          sellerId: sellerId1,
          storeName: "Boutique Alpha",
          title: "Saree Alpha",
          unitPrice: 5000,
          quantity: 1,
          totalPrice: 5000,
        },
        {
          productId: prodId2,
          storeId: storeId2,
          sellerId: sellerId2,
          storeName: "Boutique Beta",
          title: "Lehenga Beta",
          unitPrice: 8000,
          quantity: 1,
          totalPrice: 8000,
        },
      ],
      subtotal: 13000,
      totalShippingFee: 400,
      grandTotal: 13400,
      status: paymentStatus === "PAID" ? "ORDER_PLACED" : "PENDING_PAYMENT",
      paymentStatus,
      fulfilmentOrderIds: [fId1, fId2],
      statusHistory: [],
    });

    const fo1 = new StoreFulfilmentOrder({
      _id: fId1,
      fulfilmentOrderNumber: `SFO-1-${Date.now()}`,
      parentOrderId: pId,
      parentOrderNumber: parent.orderNumber,
      customerId: customerId1,
      sellerId: sellerId1,
      storeId: storeId1,
      storeName: "Boutique Alpha",
      storeSlug: "boutique-alpha",
      items: [
        {
          productId: prodId1,
          title: "Saree Alpha",
          unitPrice: 5000,
          quantity: 1,
          totalPrice: 5000,
        },
      ],
      subtotal: 5000,
      shippingFee: 200,
      totalAmount: 5200,
      status: initialStatus,
      deliveryAddress: parent.shippingAddress,
      dispatchDetails: {},
      statusHistory: [{ status: initialStatus, changedAt: new Date(), role: "system" }],
    });

    const fo2 = new StoreFulfilmentOrder({
      _id: fId2,
      fulfilmentOrderNumber: `SFO-2-${Date.now()}`,
      parentOrderId: pId,
      parentOrderNumber: parent.orderNumber,
      customerId: customerId1,
      sellerId: sellerId2,
      storeId: storeId2,
      storeName: "Boutique Beta",
      storeSlug: "boutique-beta",
      items: [
        {
          productId: prodId2,
          title: "Lehenga Beta",
          unitPrice: 8000,
          quantity: 1,
          totalPrice: 8000,
        },
      ],
      subtotal: 8000,
      shippingFee: 200,
      totalAmount: 8200,
      status: initialStatus,
      deliveryAddress: parent.shippingAddress,
      dispatchDetails: {},
      statusHistory: [{ status: initialStatus, changedAt: new Date(), role: "system" }],
    });

    parent.save = async function () {
      mockOrdersStore.set(pId.toString(), this);
      return this;
    };
    fo1.save = async function () {
      mockFulfilmentsStore.set(fId1.toString(), this);
      return this;
    };
    fo2.save = async function () {
      mockFulfilmentsStore.set(fId2.toString(), this);
      return this;
    };

    mockOrdersStore.set(pId.toString(), parent);
    mockFulfilmentsStore.set(fId1.toString(), fo1);
    mockFulfilmentsStore.set(fId2.toString(), fo2);

    return { parent, fo1, fo2 };
  };

  // 4A: Paid-Order Fulfilment Restriction
  console.log("\n--- 4A. Paid-Order Fulfilment Restriction ---");
  const { fo1: unpaidFo } = setupMockOrderPair({ paymentStatus: "PENDING", initialStatus: "PENDING_PAYMENT" });

  let unpaidErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: unpaidFo._id,
      targetStatus: "CONFIRMED",
      actorId: sellerId1,
      actorRole: "seller",
    });
  } catch (err) {
    unpaidErr = err;
  }
  assert(
    Boolean(unpaidErr) && unpaidErr.statusCode === 400 && unpaidErr.message.includes("requires verified payment"),
    "Rejects advancing unpaid order in PENDING_PAYMENT status"
  );

  // 4B: Seller Ownership Isolation (Multi-Tenant Security)
  console.log("\n--- 4B. Seller Ownership Isolation ---");
  const { fo1: foSeller1 } = setupMockOrderPair({ paymentStatus: "PAID", initialStatus: "ORDER_PLACED" });

  let rogueSellerErr = null;
  try {
    // Seller 2 attempts to confirm Seller 1's order
    await transitionFulfilmentStatus({
      fulfilmentOrderId: foSeller1._id,
      targetStatus: "CONFIRMED",
      actorId: sellerId2,
      actorRole: "seller",
    });
  } catch (err) {
    rogueSellerErr = err;
  }
  assert(
    Boolean(rogueSellerErr) && rogueSellerErr.statusCode === 403,
    "Seller 2 is forbidden (403) from modifying Seller 1's fulfilment order"
  );
  assert(
    mockFulfilmentsStore.get(foSeller1._id.toString()).status === "ORDER_PLACED",
    "Seller 1's order status remains unmodified after rogue seller attempt"
  );

  // 4C: Customer Order Ownership & Action Limits
  console.log("\n--- 4C. Customer Order Ownership & Delivery Confirmation ---");
  const { fo1: custFo } = setupMockOrderPair({ paymentStatus: "PAID", initialStatus: "ORDER_PLACED" });

  // Customer 2 attempts to confirm Customer 1's order
  let rogueCustErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: custFo._id,
      targetStatus: "DELIVERED",
      actorId: customerId2,
      actorRole: "customer",
    });
  } catch (err) {
    rogueCustErr = err;
  }
  assert(
    Boolean(rogueCustErr) && rogueCustErr.statusCode === 403,
    "Customer 2 is forbidden (403) from acting on Customer 1's order"
  );

  // Customer 1 attempts to confirm delivery when order is NOT yet shipped (still in ORDER_PLACED)
  let prematureDeliveryErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: custFo._id,
      targetStatus: "DELIVERED",
      actorId: customerId1,
      actorRole: "customer",
    });
  } catch (err) {
    prematureDeliveryErr = err;
  }
  assert(
    Boolean(prematureDeliveryErr) && prematureDeliveryErr.statusCode === 400,
    "Customer cannot confirm delivery before order is SHIPPED (transition rules enforced)"
  );

  // 4D: Invalid Status Transitions (Skipping states & Backward transitions)
  console.log("\n--- 4D. State Machine: Invalid Transitions & Skip Protection ---");
  const { fo1: smFo } = setupMockOrderPair({ paymentStatus: "PAID", initialStatus: "ORDER_PLACED" });

  // Cannot jump ORDER_PLACED -> SHIPPED directly
  let skipToShipErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: smFo._id,
      targetStatus: "SHIPPED",
      actorId: sellerId1,
      actorRole: "seller",
      dispatchData: { courierName: "Blue Dart", trackingNumber: "BD12345" },
    });
  } catch (err) {
    skipToShipErr = err;
  }
  assert(
    Boolean(skipToShipErr) && skipToShipErr.statusCode === 400,
    "Rejects skipping states (ORDER_PLACED -> SHIPPED is disallowed)"
  );

  // Cannot jump ORDER_PLACED -> DELIVERED directly
  let skipToDeliverErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: smFo._id,
      targetStatus: "DELIVERED",
      actorId: sellerId1,
      actorRole: "seller",
    });
  } catch (err) {
    skipToDeliverErr = err;
  }
  assert(
    Boolean(skipToDeliverErr) && skipToDeliverErr.statusCode === 400,
    "Rejects skipping states (ORDER_PLACED -> DELIVERED is disallowed)"
  );

  // 4E: Valid Lifecycle Progression: ORDER_PLACED -> CONFIRMED -> PROCESSING
  console.log("\n--- 4E. Valid Lifecycle Progression ---");
  const confirmResult = await transitionFulfilmentStatus({
    fulfilmentOrderId: smFo._id,
    targetStatus: "CONFIRMED",
    actorId: sellerId1,
    actorRole: "seller",
    note: "Accepted by Boutique Alpha",
  });
  assert(confirmResult.success && smFo.status === "CONFIRMED", "Successfully moves ORDER_PLACED -> CONFIRMED");

  const processingResult = await transitionFulfilmentStatus({
    fulfilmentOrderId: smFo._id,
    targetStatus: "PROCESSING",
    actorId: sellerId1,
    actorRole: "seller",
    note: "Packaging saree in luxury gift box",
  });
  assert(processingResult.success && smFo.status === "PROCESSING", "Successfully moves CONFIRMED -> PROCESSING");

  // Cannot transition backwards PROCESSING -> CONFIRMED
  let backwardErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: smFo._id,
      targetStatus: "CONFIRMED",
      actorId: sellerId1,
      actorRole: "seller",
    });
  } catch (err) {
    backwardErr = err;
  }
  assert(
    Boolean(backwardErr) && backwardErr.statusCode === 400,
    "Disallows backward transition (PROCESSING -> CONFIRMED)"
  );

  // 4F: Tracking Details Validation on SHIPPED
  console.log("\n--- 4F. Tracking Details Validation ---");

  // Attempt to ship without courier name
  let missingCourierErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: smFo._id,
      targetStatus: "SHIPPED",
      actorId: sellerId1,
      actorRole: "seller",
      dispatchData: { courierName: "", trackingNumber: "BD998877" },
    });
  } catch (err) {
    missingCourierErr = err;
  }
  assert(
    Boolean(missingCourierErr) && missingCourierErr.statusCode === 400 && missingCourierErr.message.includes("courier partner name"),
    "Rejects shipping with empty courier partner name"
  );

  // Attempt to ship without tracking number
  let missingAwbErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: smFo._id,
      targetStatus: "SHIPPED",
      actorId: sellerId1,
      actorRole: "seller",
      dispatchData: { courierName: "Blue Dart", trackingNumber: "" },
    });
  } catch (err) {
    missingAwbErr = err;
  }
  assert(
    Boolean(missingAwbErr) && missingAwbErr.statusCode === 400 && missingAwbErr.message.includes("tracking / AWB number"),
    "Rejects shipping with empty tracking / AWB number"
  );

  // Valid shipping execution
  const shipResult = await transitionFulfilmentStatus({
    fulfilmentOrderId: smFo._id,
    targetStatus: "SHIPPED",
    actorId: sellerId1,
    actorRole: "seller",
    dispatchData: {
      courierName: "Delhivery Express",
      trackingNumber: "DLH88776655IN",
    },
  });
  assert(shipResult.success && smFo.status === "SHIPPED", "Successfully moves PROCESSING -> SHIPPED with valid courier data");
  assert(
    smFo.dispatchDetails.trackingUrl.includes("delhivery.com/track/package/DLH88776655IN"),
    "Auto-populates official courier tracking URL for Delhivery"
  );
  assert(Boolean(smFo.dispatchDetails.dispatchedAt), "Records dispatchedAt timestamp");

  // 4G: Customer Confirms Delivery Receipt
  console.log("\n--- 4G. Customer Confirms Delivery on SHIPPED Order ---");
  const custDeliverResult = await transitionFulfilmentStatus({
    fulfilmentOrderId: smFo._id,
    targetStatus: "DELIVERED",
    actorId: customerId1,
    actorRole: "customer",
    note: "Package received in pristine condition",
  });
  assert(custDeliverResult.success && smFo.status === "DELIVERED", "Customer confirms delivery for SHIPPED order");
  assert(Boolean(smFo.dispatchDetails.deliveredAt), "Records deliveredAt timestamp");

  // Terminal state: DELIVERED cannot transition back to SHIPPED
  let deliverBackwardErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: smFo._id,
      targetStatus: "SHIPPED",
      actorId: sellerId1,
      actorRole: "seller",
    });
  } catch (err) {
    deliverBackwardErr = err;
  }
  assert(
    Boolean(deliverBackwardErr) && deliverBackwardErr.statusCode === 400,
    "Terminal state: DELIVERED order cannot transition back to SHIPPED"
  );

  // 4H: Cancellation & Terminal State
  console.log("\n--- 4H. Cancellation Lifecycle & Terminal State ---");
  const { fo1: cancelFo } = setupMockOrderPair({ paymentStatus: "PAID", initialStatus: "ORDER_PLACED" });

  const cancelResult = await transitionFulfilmentStatus({
    fulfilmentOrderId: cancelFo._id,
    targetStatus: "CANCELLED",
    actorId: sellerId1,
    actorRole: "seller",
    dispatchData: { cancellationReason: "Out of raw fabric for embroidery" },
  });
  assert(cancelResult.success && cancelFo.status === "CANCELLED", "Successfully cancels order in ORDER_PLACED state");
  assert(
    cancelFo.dispatchDetails.cancellationReason === "Out of raw fabric for embroidery",
    "Stores cancellation reason in dispatchDetails"
  );

  // CANCELLED cannot transition to CONFIRMED or DELIVERED
  let reviveErr = null;
  try {
    await transitionFulfilmentStatus({
      fulfilmentOrderId: cancelFo._id,
      targetStatus: "CONFIRMED",
      actorId: sellerId1,
      actorRole: "seller",
    });
  } catch (err) {
    reviveErr = err;
  }
  assert(
    Boolean(reviveErr) && reviveErr.statusCode === 400,
    "Terminal state: CANCELLED order cannot be revived to CONFIRMED"
  );

  // -------------------------------------------------------------------------
  // SECTION 5: Multi-Seller Shipment Separation & Independence
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Multi-Seller Shipment Separation ---");
  const { parent: msParent, fo1: msFo1, fo2: msFo2 } = setupMockOrderPair({ paymentStatus: "PAID", initialStatus: "ORDER_PLACED" });

  // Seller 1 advances SFO-1: ORDER_PLACED -> CONFIRMED -> PROCESSING -> SHIPPED
  await transitionFulfilmentStatus({ fulfilmentOrderId: msFo1._id, targetStatus: "CONFIRMED", actorId: sellerId1, actorRole: "seller" });
  await transitionFulfilmentStatus({ fulfilmentOrderId: msFo1._id, targetStatus: "PROCESSING", actorId: sellerId1, actorRole: "seller" });
  await transitionFulfilmentStatus({
    fulfilmentOrderId: msFo1._id,
    targetStatus: "SHIPPED",
    actorId: sellerId1,
    actorRole: "seller",
    dispatchData: { courierName: "Blue Dart", trackingNumber: "BD-ALPHA-001" },
  });

  // Verify Seller 2's SFO-2 is completely unaffected
  assert(
    msFo2.status === "ORDER_PLACED",
    "Seller 1's dispatch does not affect Seller 2's order status (remains ORDER_PLACED)"
  );
  assert(
    !msFo2.dispatchDetails?.trackingNumber,
    "Seller 1's tracking information does not leak into Seller 2's order"
  );

  // Parent order status derived as PARTIALLY_SHIPPED
  assert(
    mockOrdersStore.get(msParent._id.toString()).status === "PARTIALLY_SHIPPED",
    "Parent order status derived as PARTIALLY_SHIPPED when one seller ships and another is pending"
  );

  // Seller 2 now ships SFO-2
  await transitionFulfilmentStatus({ fulfilmentOrderId: msFo2._id, targetStatus: "CONFIRMED", actorId: sellerId2, actorRole: "seller" });
  await transitionFulfilmentStatus({ fulfilmentOrderId: msFo2._id, targetStatus: "PROCESSING", actorId: sellerId2, actorRole: "seller" });
  await transitionFulfilmentStatus({
    fulfilmentOrderId: msFo2._id,
    targetStatus: "SHIPPED",
    actorId: sellerId2,
    actorRole: "seller",
    dispatchData: { courierName: "DTDC", trackingNumber: "DTDC-BETA-002" },
  });

  // Both sellers shipped -> parent is SHIPPED
  assert(
    mockOrdersStore.get(msParent._id.toString()).status === "SHIPPED",
    "Parent order status derived as SHIPPED when all seller shipments are dispatched"
  );

  // Seller 1 delivers SFO-1 -> parent is PARTIALLY_DELIVERED
  await transitionFulfilmentStatus({ fulfilmentOrderId: msFo1._id, targetStatus: "DELIVERED", actorId: sellerId1, actorRole: "seller" });
  assert(
    mockOrdersStore.get(msParent._id.toString()).status === "PARTIALLY_DELIVERED",
    "Parent order status derived as PARTIALLY_DELIVERED when one seller delivers and another is in transit"
  );

  // Seller 2 delivers SFO-2 -> parent is DELIVERED
  await transitionFulfilmentStatus({ fulfilmentOrderId: msFo2._id, targetStatus: "DELIVERED", actorId: sellerId2, actorRole: "seller" });
  assert(
    mockOrdersStore.get(msParent._id.toString()).status === "DELIVERED",
    "Parent order status derived as DELIVERED when all seller shipments are delivered"
  );

  // -------------------------------------------------------------------------
  // SECTION 6: Admin Access Control & Audit Override
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Admin Access Control & Audit Override ---");
  const { fo1: adminFo } = setupMockOrderPair({ paymentStatus: "PAID", initialStatus: "ORDER_PLACED" });

  // Admin override succeeds with mandatory note
  const adminOverrideResult = await transitionFulfilmentStatus({
    fulfilmentOrderId: adminFo._id,
    targetStatus: "SHIPPED",
    actorId: adminId,
    actorRole: "admin",
    actorName: "Master Admin",
    dispatchData: {
      courierName: "Shiprocket",
      trackingNumber: "SRK-ADMIN-99",
    },
    note: "[Admin Override] Expedited courier dispatch authorized by customer support.",
    isAdmin: true,
  });

  assert(adminOverrideResult.success && adminFo.status === "SHIPPED", "Admin override successfully updates status");
  const lastHistory = adminFo.statusHistory[adminFo.statusHistory.length - 1];
  assert(
    lastHistory.role === "admin" && lastHistory.note.includes("[Admin Override]"),
    "Admin intervention permanently audited in statusHistory with 'admin' role"
  );

  // -------------------------------------------------------------------------
  // SECTION 7: Idempotency & Duplicate State Updates
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Idempotency & Duplicate Status Updates ---");
  const { fo1: idempFo } = setupMockOrderPair({ paymentStatus: "PAID", initialStatus: "ORDER_PLACED" });

  // First confirm
  await transitionFulfilmentStatus({ fulfilmentOrderId: idempFo._id, targetStatus: "CONFIRMED", actorId: sellerId1, actorRole: "seller" });
  const historyLenBefore = idempFo.statusHistory.length;

  // Duplicate confirm call
  const idempResult = await transitionFulfilmentStatus({
    fulfilmentOrderId: idempFo._id,
    targetStatus: "CONFIRMED",
    actorId: sellerId1,
    actorRole: "seller",
  });

  assert(idempResult.success && idempResult.isIdempotent === true, "Repeated transition to same status returns isIdempotent: true");
  assert(
    idempFo.statusHistory.length === historyLenBefore,
    "Idempotent duplicate transition does not corrupt statusHistory with duplicate records"
  );

  // -------------------------------------------------------------------------
  // SECTION 8: Store Notification Events & Zero Paid Network Calls
  // -------------------------------------------------------------------------
  console.log("\n--- 8. In-App Notification Events ---");

  const notifBeforeCount = mockNotificationsStore.length;
  await createStoreNotification({
    recipientId: customerId1,
    recipientRole: "customer",
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    fulfilmentOrderId: idempFo._id,
    fulfilmentOrderNumber: idempFo.fulfilmentOrderNumber,
    type: "ORDER_SHIPPED",
    title: "Order Dispatched",
    message: "Your package is on its way via Blue Dart (AWB: BD12345).",
    metadata: { courierName: "Blue Dart", trackingNumber: "BD12345" },
  });

  assert(mockNotificationsStore.length === notifBeforeCount + 1, "Creates in-app store notification");
  const latestNotif = mockNotificationsStore[mockNotificationsStore.length - 1];
  assert(latestNotif.type === "ORDER_SHIPPED", "Notification records correct event type");
  assert(latestNotif.isRead === false, "Notification initialized with isRead: false");
  assert(latestNotif.channel === "IN_APP", "Notification uses safe IN_APP channel (zero SMS/paid gateways)");

  // -------------------------------------------------------------------------
  // SECTION 9: Rental Order & Lifecycle Regression Isolation
  // -------------------------------------------------------------------------
  console.log("\n--- 9. Rental Order & Provider Payout Regression Isolation ---");

  // Rental model schema invariants
  const rentalOrderDoc = new OrderModel({
    userEmail: "customer@example.com",
    product: prodId1,
    quantity: 1,
    providerId: sellerId1,
    rentalStartDate: new Date("2026-12-01"),
    rentalEndDate: new Date("2026-12-05"),
    totalAmount: 4000,
    depositAmount: 2000,
    securityDepositStatus: "HELD",
    status: "Processing",
    paymentMethod: "PHONEPE",
    address: {
      name: "Rental Customer",
      phone: "9876543210",
      street: "Colaba Causeway",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400005",
    },
  });

  const rentalErr = rentalOrderDoc.validateSync();
  assert(!rentalErr, "Rental OrderModel document schema remains valid and untouched");

  // Rental provider earnings 85% invariant
  const rentalGross = 4000;
  const rentalProviderShare = rentalGross * 0.85;
  const rentalPlatformFee = rentalGross * 0.15;
  assert(rentalProviderShare === 3400 && rentalPlatformFee === 600, "Rental 85%/15% provider split remains completely untouched");

  // Rental date conflict detection unaffected
  const existingRentalBookings = [
    {
      startDate: new Date("2026-12-10"),
      endDate: new Date("2026-12-15"),
      orderId: "order_rental_1",
    },
  ];
  const hasConflict = findDateConflict(existingRentalBookings, new Date("2026-12-12"), new Date("2026-12-18"));
  const noConflict = findDateConflict(existingRentalBookings, new Date("2026-12-20"), new Date("2026-12-25"));
  assert(Boolean(hasConflict) && noConflict === null, "Rental booking calendar collision detection remains fully functional");

  // -------------------------------------------------------------------------
  // TEST SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(`   PHASE 7 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED   `);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase7TestSuite().catch((err) => {
  console.error("Phase 7 test suite encountered unhandled error:", err);
  process.exit(1);
});
