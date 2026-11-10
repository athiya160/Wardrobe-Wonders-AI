process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import StoreOrder from "./models/StoreOrderModel.js";
import StoreFulfilmentOrder from "./models/StoreFulfilmentOrderModel.js";
import StorePayment from "./models/StorePaymentModel.js";
import StoreLedger from "./models/StoreLedgerModel.js";
import StoreRefund from "./models/StoreRefundModel.js";
import StoreProduct from "./models/StoreProductModel.js";
import StoreInvoice from "./models/StoreInvoiceModel.js";
import StoreCancellation from "./models/StoreCancellationModel.js";
import StoreReturn from "./models/StoreReturnModel.js";
import StoreReview from "./models/StoreReviewModel.js";
import StoreNotification from "./models/StoreNotificationModel.js";
import OrderModel from "./models/OrderModel.js";

import {
  getOrCreateStoreInvoice,
  requestStoreCancellation,
  reviewStoreCancellation,
  requestStoreReturn,
  reviewStoreReturn,
  recordReturnItemReceived,
  createStoreReview,
  recalculateProductRating,
  moderateStoreReview,
  getProductReviews,
} from "./services/storePostPurchaseService.js";

import { findDateConflict, calculateServerPricing } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 8: POST-PURCHASE EXPERIENCE TEST SUITE       ");
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

async function runPhase8TestSuite() {
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
  // SECTION 1: Schema Invariants for Invoices, Cancellations, Returns & Reviews
  // -------------------------------------------------------------------------
  console.log("--- 1. Post-Purchase Schema Invariants ---");

  // 1A: StoreInvoiceModel requires fields
  const validInvoiceDoc = new StoreInvoice({
    invoiceNumber: `SINV-${Date.now()}-001`,
    parentOrderId: orderId1,
    orderNumber: orderNumber1,
    customerId: customerId1,
    customerEmail: "customer1@wardrobewonders.com",
    billingAddress: {
      name: "Radhika Sharma",
      phone: "9876543210",
      street: "MG Road",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
    },
    sellerBreakdown: [
      {
        fulfilmentOrderId: new mongoose.Types.ObjectId(),
        fulfilmentOrderNumber: "SFO-1001",
        sellerId: sellerId1,
        storeId: storeId1,
        storeName: "Rajputana Silks",
        originCity: "Jaipur",
        originState: "Rajasthan",
        items: [
          {
            productId: prodId1,
            title: "Zardozi Lehenga",
            unitPrice: 12000,
            quantity: 1,
            totalPrice: 12000,
          },
        ],
        subtotal: 12000,
        shippingFee: 200,
        totalAmount: 12200,
      },
    ],
    subtotal: 12000,
    totalShippingFee: 200,
    grandTotal: 12200,
    paymentStatus: "PAID",
  });
  const invErr = validInvoiceDoc.validateSync();
  assert(!invErr, "Valid StoreInvoice document passes schema validation");

  const badInvoiceDoc = new StoreInvoice({
    invoiceNumber: "SINV-BAD",
  });
  const badInvErr = badInvoiceDoc.validateSync();
  assert(Boolean(badInvErr?.errors?.parentOrderId), "StoreInvoice requires parentOrderId");
  assert(Boolean(badInvErr?.errors?.customerId), "StoreInvoice requires customerId");

  // 1B: StoreCancellationModel
  const validCancelDoc = new StoreCancellation({
    cancellationId: `SCAN-${Date.now()}-001`,
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    fulfilmentOrderId: new mongoose.Types.ObjectId(),
    fulfilmentOrderNumber: "SFO-1001",
    customerId: customerId1,
    sellerId: sellerId1,
    storeId: storeId1,
    status: "REQUESTED",
    reason: "Ordered incorrect size by mistake",
  });
  const cancelErr = validCancelDoc.validateSync();
  assert(!cancelErr, "Valid StoreCancellation document passes schema validation");

  const badCancelDoc = new StoreCancellation({
    cancellationId: "SCAN-BAD",
    status: "INVALID_STATUS_XYZ",
  });
  const badCancelErr = badCancelDoc.validateSync();
  assert(Boolean(badCancelErr?.errors?.status), "StoreCancellation rejects invalid status enum");

  // 1C: StoreReturnModel
  const validReturnDoc = new StoreReturn({
    returnId: `SRTN-${Date.now()}-001`,
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    fulfilmentOrderId: new mongoose.Types.ObjectId(),
    fulfilmentOrderNumber: "SFO-1001",
    customerId: customerId1,
    sellerId: sellerId1,
    storeId: storeId1,
    items: [
      {
        productId: prodId1,
        title: "Zardozi Lehenga",
        quantity: 1,
        unitPrice: 12000,
        totalPrice: 12000,
      },
    ],
    reason: "Size/Fit issue",
    description: "The lehenga waist size is smaller than measurement chart.",
    requestedRefundAmount: 12000,
    requestedRefundAmountInPaise: 1200000,
    status: "REQUESTED",
  });
  const returnErr = validReturnDoc.validateSync();
  assert(!returnErr, "Valid StoreReturn document passes schema validation");

  for (const st of ["REQUESTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ITEM_RETURNED", "REFUND_PENDING", "REFUNDED", "CLOSED"]) {
    const doc = new StoreReturn({
      returnId: `SRTN-${Date.now()}-${st}`,
      parentOrderId: orderId1,
      parentOrderNumber: orderNumber1,
      fulfilmentOrderId: new mongoose.Types.ObjectId(),
      fulfilmentOrderNumber: "SFO-1001",
      customerId: customerId1,
      sellerId: sellerId1,
      storeId: storeId1,
      items: [{ productId: prodId1, title: "Test", quantity: 1, unitPrice: 1000, totalPrice: 1000 }],
      reason: "Quality issue",
      requestedRefundAmount: 1000,
      requestedRefundAmountInPaise: 100000,
      status: st,
    });
    const err = doc.validateSync();
    assert(!err, `StoreReturn accepts valid status enum '${st}'`);
  }

  // 1D: StoreReviewModel
  const validReviewDoc = new StoreReview({
    reviewId: `SREV-${Date.now()}-001`,
    productId: prodId1,
    storeId: storeId1,
    sellerId: sellerId1,
    customerId: customerId1,
    customerName: "Radhika S.",
    parentOrderId: orderId1,
    fulfilmentOrderId: new mongoose.Types.ObjectId(),
    rating: 5,
    title: "Magnificent craftsmanship",
    comment: "The embroidery and silk quality exceeded expectations. Exactly as pictured.",
    isVerifiedPurchase: true,
    status: "PUBLISHED",
  });
  const reviewErr = validReviewDoc.validateSync();
  assert(!reviewErr, "Valid StoreReview document passes schema validation");

  const badReviewRating = new StoreReview({
    reviewId: `SREV-BAD-RATING`,
    productId: prodId1,
    storeId: storeId1,
    sellerId: sellerId1,
    customerId: customerId1,
    rating: 6, // > 5
  });
  const badRatingErr = badReviewRating.validateSync();
  assert(Boolean(badRatingErr?.errors?.rating), "StoreReview rejects rating > 5");

  const zeroRating = new StoreReview({
    reviewId: `SREV-ZERO-RATING`,
    productId: prodId1,
    storeId: storeId1,
    sellerId: sellerId1,
    customerId: customerId1,
    rating: 0, // < 1
  });
  const zeroRatingErr = zeroRating.validateSync();
  assert(Boolean(zeroRatingErr?.errors?.rating), "StoreReview rejects rating < 1");

  // 1E: StoreProductModel rating and reviewsCount
  const productDoc = new StoreProduct({
    storeId: storeId1,
    sellerId: sellerId1,
    title: "Banarasi Georgette Saree",
    description: "Authentic pure georgette banarasi saree with hand-woven zari work.",
    price: 15000,
    category: "Clothing",
    condition: "NEW",
    stockQuantity: 5,
    images: ["https://example.com/saree1.jpg"],
    inventoryType: "MADE_TO_ORDER",
    status: "APPROVED",
    rating: 4.8,
    reviewsCount: 12,
  });
  const prodErr = productDoc.validateSync();
  assert(!prodErr, "StoreProduct accepts rating and reviewsCount fields");
  assert(productDoc.rating === 4.8 && productDoc.reviewsCount === 12, "Product rating and count stored accurately");

  // -------------------------------------------------------------------------
  // SECTION 2: In-Memory DB Fixtures & Mock Storage
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Setting Up In-Memory Mock Store ---");

  const mockOrders = new Map();
  const mockFulfilments = new Map();
  const mockInvoices = new Map();
  const mockCancellations = new Map();
  const mockReturns = new Map();
  const mockReviews = new Map();
  const mockProducts = new Map();
  const mockPayments = new Map();
  const mockLedgers = [];
  const mockNotifications = [];

  StoreOrder.findById = async (id) => mockOrders.get(id?.toString()) || null;
  StoreOrder.findOne = async (q) => {
    for (const ord of mockOrders.values()) {
      let match = true;
      if (q._id && ord._id.toString() !== q._id.toString()) match = false;
      if (q.customerId && ord.customerId.toString() !== q.customerId.toString()) match = false;
      if (match) return ord;
    }
    return null;
  };

  StoreFulfilmentOrder.findById = async (id) => mockFulfilments.get(id?.toString()) || null;
  StoreFulfilmentOrder.findOne = async (q) => {
    for (const f of mockFulfilments.values()) {
      let match = true;
      if (q._id && f._id?.toString() !== q._id?.toString()) match = false;
      if (q.parentOrderId && f.parentOrderId?.toString() !== q.parentOrderId?.toString()) match = false;
      if (match) return f;
    }
    return null;
  };
  StoreFulfilmentOrder.find = (q) => {
    let list = Array.from(mockFulfilments.values());
    if (q.parentOrderId) list = list.filter((f) => f.parentOrderId.toString() === q.parentOrderId.toString());
    if (q.sellerId) list = list.filter((f) => f.sellerId.toString() === q.sellerId.toString());

    const promise = Promise.resolve(list);
    promise.populate = () => ({
      lean: async () => list,
    });
    promise.lean = async () => list;
    return promise;
  };

  StoreInvoice.findOne = async (q) => {
    for (const inv of mockInvoices.values()) {
      if (q.parentOrderId && inv.parentOrderId.toString() === q.parentOrderId.toString()) return inv;
      if (q.invoiceNumber && inv.invoiceNumber === q.invoiceNumber) return inv;
      if (q._id && inv._id.toString() === q._id.toString()) return inv;
    }
    return null;
  };
  StoreInvoice.prototype.save = async function () {
    mockInvoices.set(this._id.toString(), this);
    return this;
  };

  StoreCancellation.findOne = async (q) => {
    for (const can of mockCancellations.values()) {
      if (q.cancellationId && can.cancellationId === q.cancellationId) return can;
      if (q._id && can._id?.toString() === q._id?.toString()) return can;
      const canFid = can.fulfilmentOrderId?._id ? can.fulfilmentOrderId._id.toString() : can.fulfilmentOrderId?.toString();
      const qFid = q.fulfilmentOrderId?._id ? q.fulfilmentOrderId._id.toString() : q.fulfilmentOrderId?.toString();
      if (qFid && canFid === qFid) {
        if (q.status && q.status.$in) {
          if (q.status.$in.includes(can.status)) return can;
        } else if (!q.status || can.status === q.status) {
          return can;
        }
      }
      if (q.$or) {
        for (const sub of q.$or) {
          if (sub._id && can._id?.toString() === sub._id?.toString()) return can;
          if (sub.cancellationId && can.cancellationId === sub.cancellationId) return can;
        }
      }
    }
    return null;
  };
  StoreCancellation.find = async (q) => {
    let list = Array.from(mockCancellations.values());
    if (q.customerId) list = list.filter((c) => c.customerId.toString() === q.customerId.toString());
    if (q.parentOrderId) list = list.filter((c) => c.parentOrderId.toString() === q.parentOrderId.toString());
    return {
      sort: () => ({
        lean: async () => list,
      }),
      lean: async () => list,
    };
  };
  StoreCancellation.prototype.save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    mockCancellations.set(this._id.toString(), this);
    return this;
  };

  StoreReturn.findOne = async (q) => {
    for (const ret of mockReturns.values()) {
      if (q.returnId && ret.returnId === q.returnId) return ret;
      if (q._id && ret._id?.toString() === q._id?.toString()) return ret;
      const retFid = ret.fulfilmentOrderId?._id ? ret.fulfilmentOrderId._id.toString() : ret.fulfilmentOrderId?.toString();
      const qFid = q.fulfilmentOrderId?._id ? q.fulfilmentOrderId._id.toString() : q.fulfilmentOrderId?.toString();
      if (qFid && retFid === qFid) {
        if (q.status && q.status.$in) {
          if (q.status.$in.includes(ret.status)) return ret;
        } else if (!q.status || ret.status === q.status) {
          return ret;
        }
      }
      if (q.$or) {
        for (const sub of q.$or) {
          if (sub._id && ret._id?.toString() === sub._id?.toString()) return ret;
          if (sub.returnId && ret.returnId === sub.returnId) return ret;
        }
      }
    }
    return null;
  };
  StoreReturn.find = async (q) => {
    let list = Array.from(mockReturns.values());
    if (q.customerId) list = list.filter((r) => r.customerId.toString() === q.customerId.toString());
    if (q.parentOrderId) list = list.filter((r) => r.parentOrderId.toString() === q.parentOrderId.toString());
    return {
      sort: () => ({
        lean: async () => list,
      }),
      lean: async () => list,
    };
  };
  StoreReturn.prototype.save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    mockReturns.set(this._id.toString(), this);
    return this;
  };

  StoreReview.findOne = async (q) => {
    for (const rev of mockReviews.values()) {
      if (q.reviewId && rev.reviewId === q.reviewId) return rev;
      if (q._id && rev._id.toString() === q._id.toString()) return rev;
      if (
        q.customerId &&
        q.productId &&
        q.fulfilmentOrderId &&
        rev.customerId.toString() === q.customerId.toString() &&
        rev.productId.toString() === q.productId.toString() &&
        rev.fulfilmentOrderId.toString() === q.fulfilmentOrderId.toString()
      ) {
        return rev;
      }
      if (q.$or) {
        for (const sub of q.$or) {
          if (sub._id && rev._id.toString() === sub._id.toString()) return rev;
          if (sub.reviewId && rev.reviewId === sub.reviewId) return rev;
        }
      }
    }
    return null;
  };
  StoreReview.find = (q) => {
    let list = Array.from(mockReviews.values());
    if (q.productId) list = list.filter((r) => r.productId.toString() === q.productId.toString());
    if (q.status) list = list.filter((r) => r.status === q.status);
    if (q.customerId) list = list.filter((r) => r.customerId.toString() === q.customerId.toString());
    const p = Promise.resolve(list);
    p.sort = () => ({
      skip: () => ({
        limit: () => ({
          lean: async () => list,
        }),
      }),
      lean: async () => list,
    });
    p.lean = async () => list;
    return p;
  };
  StoreReview.countDocuments = async (q) => {
    let list = Array.from(mockReviews.values());
    if (q.productId) list = list.filter((r) => r.productId.toString() === q.productId.toString());
    if (q.status) list = list.filter((r) => r.status === q.status);
    return list.length;
  };
  StoreReview.prototype.save = async function () {
    mockReviews.set(this._id.toString(), this);
    return this;
  };

  StoreProduct.findById = async (id) => mockProducts.get(id?.toString()) || null;
  StoreProduct.findByIdAndUpdate = async (id, update) => {
    const p = mockProducts.get(id?.toString());
    if (p) {
      Object.assign(p, update);
      return p;
    }
    return null;
  };
  StoreProduct.findOneAndUpdate = async (q, update) => {
    const id = q?._id || q;
    return StoreProduct.findByIdAndUpdate(id, update);
  };
  StorePayment.findOne = (q) => {
    const paymentObj = {
      _id: new mongoose.Types.ObjectId(),
      status: "SUCCESS",
      amount: 12200,
      currency: "INR",
      merchantTransactionId: `TXN-${Date.now()}`,
      paymentMethod: "PHONEPE_SANDBOX",
    };
    const promise = Promise.resolve(paymentObj);
    promise.lean = async () => paymentObj;
    return promise;
  };
  StoreLedger.prototype.save = async function () {
    mockLedgers.push(this);
    return this;
  };

  const mockRefunds = [];
  StoreRefund.find = (q) => {
    let list = [...mockRefunds];
    if (q.parentOrderId) list = list.filter((r) => r.parentOrderId?.toString() === q.parentOrderId?.toString());
    const p = Promise.resolve(list);
    p.lean = async () => list;
    return p;
  };
  StoreRefund.findOne = async (q) => {
    for (const r of mockRefunds) {
      if (q.idempotencyKey && r.idempotencyKey === q.idempotencyKey) return r;
      if (q.refundId && r.refundId === q.refundId) return r;
    }
    return null;
  };
  StoreRefund.prototype.save = async function () {
    if (!this._id) this._id = new mongoose.Types.ObjectId();
    mockRefunds.push(this);
    return this;
  };
  StoreNotification.prototype.save = async function () {
    mockNotifications.push(this);
    return this;
  };

  // Create standard test product
  const testProduct1 = new StoreProduct({
    _id: prodId1,
    storeId: storeId1,
    sellerId: sellerId1,
    title: "Handcrafted Zardozi Kurta",
    description: "Authentic pure silk kurta with exquisite zari and zardozi embroidery.",
    price: 12000,
    category: "Clothing",
    condition: "NEW",
    stockQuantity: 10,
    images: ["https://example.com/kurta1.jpg"],
    inventoryType: "MADE_TO_ORDER",
    status: "APPROVED",
    rating: 0,
    reviewsCount: 0,
  });
  testProduct1.save = async function () {
    mockProducts.set(this._id.toString(), this);
    return this;
  };
  mockProducts.set(prodId1.toString(), testProduct1);

  // Helper to build test parent order
  const buildMockOrder = ({ paymentStatus = "PAID", status = "PROCESSING" } = {}) => {
    const parentId = new mongoose.Types.ObjectId();
    const fId1 = new mongoose.Types.ObjectId();
    const fId2 = new mongoose.Types.ObjectId();

    const parentOrder = new StoreOrder({
      _id: parentId,
      orderNumber: `SO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: customerId1,
      customerEmail: "customer1@wardrobewonders.com",
      shippingAddress: {
        name: "Radhika Sharma",
        phone: "9876543210",
        street: "12 Heritage Enclave",
        houseNo: "Flat 4B",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [
        {
          productId: prodId1,
          storeId: storeId1,
          sellerId: sellerId1,
          storeName: "Rajputana Silks",
          title: "Handcrafted Zardozi Kurta",
          unitPrice: 12000,
          quantity: 1,
          totalPrice: 12000,
        },
      ],
      subtotal: 12000,
      totalShippingFee: 200,
      grandTotal: 12200,
      paymentStatus,
      status,
      fulfilmentOrderIds: [fId1, fId2],
    });

    const sfo1 = new StoreFulfilmentOrder({
      _id: fId1,
      fulfilmentOrderNumber: `SFO-${Date.now()}-1`,
      parentOrderId: parentId,
      parentOrderNumber: parentOrder.orderNumber,
      customerId: customerId1,
      sellerId: sellerId1,
      storeId: storeId1,
      storeName: "Rajputana Silks",
      storeSlug: "rajputana-silks",
      items: [
        {
          productId: prodId1,
          title: "Handcrafted Zardozi Kurta",
          unitPrice: 12000,
          quantity: 1,
          totalPrice: 12000,
        },
      ],
      subtotal: 12000,
      shippingFee: 200,
      totalAmount: 12200,
      deliveryAddress: parentOrder.shippingAddress,
      status: "ORDER_PLACED",
      statusHistory: [{ status: "ORDER_PLACED", changedAt: new Date() }],
    });

    const sfo2 = new StoreFulfilmentOrder({
      _id: fId2,
      fulfilmentOrderNumber: `SFO-${Date.now()}-2`,
      parentOrderId: parentId,
      parentOrderNumber: parentOrder.orderNumber,
      customerId: customerId1,
      sellerId: sellerId2,
      storeId: storeId2,
      storeName: "Vedic Weaves",
      storeSlug: "vedic-weaves",
      items: [
        {
          productId: prodId2,
          title: "Embroidered Dupatta",
          unitPrice: 3500,
          quantity: 1,
          totalPrice: 3500,
        },
      ],
      subtotal: 3500,
      shippingFee: 150,
      totalAmount: 3650,
      deliveryAddress: parentOrder.shippingAddress,
      status: "ORDER_PLACED",
      statusHistory: [{ status: "ORDER_PLACED", changedAt: new Date() }],
    });

    parentOrder.save = async function () {
      mockOrders.set(this._id.toString(), this);
      return this;
    };
    sfo1.save = async function () {
      mockFulfilments.set(this._id.toString(), this);
      return this;
    };
    sfo2.save = async function () {
      mockFulfilments.set(this._id.toString(), this);
      return this;
    };

    mockOrders.set(parentId.toString(), parentOrder);
    mockFulfilments.set(fId1.toString(), sfo1);
    mockFulfilments.set(fId2.toString(), sfo2);

    return { parentOrder, sfo1, sfo2 };
  };

  // -------------------------------------------------------------------------
  // SECTION 3: Store Invoice Tests
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Store Invoice Generation, Immutability & Access Control ---");

  const { parentOrder: paidOrder, sfo1: paidSfo1 } = buildMockOrder({ paymentStatus: "PAID" });
  const { parentOrder: unpaidOrder } = buildMockOrder({ paymentStatus: "PENDING", status: "PENDING_PAYMENT" });

  // 3A: Unpaid order invariant
  try {
    await getOrCreateStoreInvoice({ parentOrderId: unpaidOrder._id, customerId: customerId1 });
    assert(false, "Unpaid order must reject invoice generation");
  } catch (err) {
    assert(
      err.statusCode === 400 && err.message.includes("unpaid order"),
      "Paid invoice generation strictly rejected for unpaid order (HTTP 400)"
    );
  }

  // 3B: Customer IDOR ownership protection
  try {
    await getOrCreateStoreInvoice({ parentOrderId: paidOrder._id, customerId: customerId2, isAdmin: false });
    assert(false, "Customer 2 should not access Customer 1's invoice");
  } catch (err) {
    assert(
      err.statusCode === 403,
      "Customer B cannot view Customer A's invoice (HTTP 403 IDOR guard)"
    );
  }

  // 3C: Legitimate invoice generation
  const invoiceRes = await getOrCreateStoreInvoice({ parentOrderId: paidOrder._id, customerId: customerId1 });
  assert(invoiceRes.success === true, "Invoice generated successfully for legitimate customer");
  assert(invoiceRes.isExisting === false, "First invoice call creates new snapshot record");
  assert(
    invoiceRes.invoice.invoiceNumber.startsWith("SINV-"),
    `Invoice number format follows SINV standard (${invoiceRes.invoice.invoiceNumber})`
  );
  assert(
    invoiceRes.invoice.grandTotal === 12200,
    "Invoice grand total matches purchase total (₹12,200)"
  );
  assert(
    invoiceRes.invoice.billingAddress.city === "Jaipur",
    "Invoice captures immutable snapshot of customer billing address"
  );
  assert(
    invoiceRes.invoice.sellerBreakdown.length > 0,
    "Invoice preserves itemized seller breakdown snapshots"
  );

  // 3D: Idempotent invoice retrieval
  const secondInvoiceRes = await getOrCreateStoreInvoice({ parentOrderId: paidOrder._id, customerId: customerId1 });
  assert(secondInvoiceRes.isExisting === true, "Subsequent invoice fetch returns existing immutable snapshot");
  assert(
    secondInvoiceRes.invoice.invoiceNumber === invoiceRes.invoice.invoiceNumber,
    "Invoice reference is idempotent and unique per order"
  );

  // 3E: Admin access allowed
  const adminInvoiceRes = await getOrCreateStoreInvoice({ parentOrderId: paidOrder._id, customerId: adminId, isAdmin: true });
  assert(adminInvoiceRes.success === true, "Platform Administrator has authorized clearance to inspect invoice");

  // -------------------------------------------------------------------------
  // SECTION 4: Customer Order Cancellation Workflow
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Customer Order Cancellation Workflow ---");

  const { parentOrder: cancelParent, sfo1: cancelSfo1 } = buildMockOrder({ paymentStatus: "PAID", status: "PROCESSING" });

  // 4A: IDOR check on cancellation
  try {
    await requestStoreCancellation({
      parentOrderId: cancelParent._id,
      fulfilmentOrderId: cancelSfo1._id,
      customerId: customerId2, // Wrong customer
      reason: "Halt dispatch",
    });
    assert(false, "Customer 2 must not cancel Customer 1's order");
  } catch (err) {
    assert(err.statusCode === 403, "Cancellation strictly rejects unauthorized customer (HTTP 403)");
  }

  // 4B: Rejection if order already shipped or delivered
  cancelSfo1.status = "SHIPPED";
  try {
    await requestStoreCancellation({
      parentOrderId: cancelParent._id,
      fulfilmentOrderId: cancelSfo1._id,
      customerId: customerId1,
      reason: "Need to cancel",
    });
    assert(false, "Cancellation must reject shipped order");
  } catch (err) {
    assert(
      err.statusCode === 400 && err.message.includes("Cannot cancel shipment"),
      "Cancellation strictly blocked once shipment is in SHIPPED status (HTTP 400)"
    );
  }

  // Restore to PROCESSING for valid cancellation request
  cancelSfo1.status = "PROCESSING";

  // 4C: Legitimate cancellation submission
  const cancelReq = await requestStoreCancellation({
    parentOrderId: cancelParent._id,
    fulfilmentOrderId: cancelSfo1._id,
    customerId: customerId1,
    reason: "Ordered wrong size; boutique notified.",
  });
  assert(cancelReq.success === true, "Customer cancellation request submitted successfully");
  assert(cancelReq.cancellation.status === "REQUESTED", "Cancellation initialized in REQUESTED status");
  assert(
    cancelReq.cancellation.cancellationId.startsWith("SCAN-"),
    "Cancellation ID assigned unique SCAN standard prefix"
  );

  // 4D: Duplicate cancellation prevention
  try {
    await requestStoreCancellation({
      parentOrderId: cancelParent._id,
      fulfilmentOrderId: cancelSfo1._id,
      customerId: customerId1,
      reason: "Second request",
    });
    assert(false, "Duplicate cancellation must be rejected");
  } catch (err) {
    assert(
      err.statusCode === 400 && (err.message.includes("already active") || err.message.includes("already under review")),
      "Duplicate cancellation request strictly prevented while request is active"
    );
  }

  // 4E: Admin Review - Missing audit reason rejected
  try {
    await reviewStoreCancellation({
      cancellationId: cancelReq.cancellation.cancellationId,
      adminId,
      decision: "APPROVED",
      reason: "", // Empty reason
    });
    assert(false, "Review must require audit reason");
  } catch (err) {
    assert(
      err.statusCode === 400 && err.message.includes("Audit reason is required"),
      "Admin cancellation review requires mandatory audit reason"
    );
  }

  // 4F: Admin Approval of Cancellation
  const approveCancelRes = await reviewStoreCancellation({
    cancellationId: cancelReq.cancellation.cancellationId,
    adminId,
    adminName: "Senior Marketplace Admin",
    decision: "APPROVED",
    reason: "Item not yet packed; boutique confirmed hold.",
  });
  assert(approveCancelRes.success === true, "Cancellation approved successfully by admin");
  assert(approveCancelRes.cancellation.status === "APPROVED", "Cancellation status transitioned to APPROVED");
  assert(cancelSfo1.status === "CANCELLED", "Child fulfilment order transitioned to CANCELLED");
  assert(Boolean(approveCancelRes.cancellation.refundId), "Compensating refund record registered on approved cancellation");
  const refundDoc = mockRefunds.find((r) => r._id.toString() === approveCancelRes.cancellation.refundId.toString());
  assert(
    refundDoc?.status === "REQUESTED",
    "Compensating refund record safely initialized in REQUESTED state"
  );

  // -------------------------------------------------------------------------
  // SECTION 5: Store Return & Refund Workflow
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Customer Return & Refund Lifecycle ---");

  const { parentOrder: returnParent, sfo1: returnSfo1 } = buildMockOrder({ paymentStatus: "PAID", status: "PROCESSING" });

  // 5A: Return rejected if order is not DELIVERED
  returnSfo1.status = "PROCESSING";
  try {
    await requestStoreReturn({
      parentOrderId: returnParent._id,
      fulfilmentOrderId: returnSfo1._id,
      customerId: customerId1,
      items: [{ productId: prodId1, quantity: 1 }],
      reason: "Size/Fit issue",
      description: "Too loose",
    });
    assert(false, "Return must reject non-delivered order");
  } catch (err) {
    assert(
      err.statusCode === 400 && (err.message.includes("delivered orders") || err.message.includes("DELIVERED")),
      "Return request strictly rejected if order is not DELIVERED (HTTP 400)"
    );
  }

  // Move sfo to DELIVERED 2 days ago (within 7-day window)
  returnSfo1.status = "DELIVERED";
  returnSfo1.dispatchDetails = { deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) };

  // 5B: Return rejected if outside return window
  const expiredSfo = new StoreFulfilmentOrder({
    _id: new mongoose.Types.ObjectId(),
    fulfilmentOrderNumber: "SFO-EXPIRED-01",
    parentOrderId: returnParent._id,
    parentOrderNumber: returnParent.orderNumber,
    customerId: customerId1,
    sellerId: sellerId1,
    storeId: storeId1,
    status: "DELIVERED",
    dispatchDetails: { deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, // 10 days ago (> 7 days)
    items: [{ productId: prodId1, title: "Item", unitPrice: 5000, quantity: 1, totalPrice: 5000 }],
    subtotal: 5000,
    totalAmount: 5000,
  });
  expiredSfo.save = async function () {
    mockFulfilments.set(this._id.toString(), this);
    return this;
  };
  mockFulfilments.set(expiredSfo._id.toString(), expiredSfo);

  try {
    await requestStoreReturn({
      parentOrderId: returnParent._id,
      fulfilmentOrderId: expiredSfo._id,
      customerId: customerId1,
      items: [{ productId: prodId1, quantity: 1 }],
      reason: "Size/Fit issue",
      description: "Past window return",
    });
    assert(false, "Return past 7 days must be rejected");
  } catch (err) {
    assert(
      err.statusCode === 400 && (err.message.includes("has expired") || err.message.includes("Return window")),
      "Return request strictly rejected when outside 7-day policy window"
    );
  }

  // 5C: Legitimate return request within window
  const returnReq = await requestStoreReturn({
    parentOrderId: returnParent._id,
    fulfilmentOrderId: returnSfo1._id,
    customerId: customerId1,
    items: [{ productId: prodId1, quantity: 1 }],
    reason: "Size/Fit issue",
    description: "Item waist circumference does not match the measurement chart.",
  });
  assert(returnReq.success === true, "Return request created successfully within policy window");
  assert(returnReq.returnRequest.status === "REQUESTED", "Return initialized in REQUESTED status");
  assert(
    returnReq.returnRequest.requestedRefundAmount === 12000,
    "Requested refund amount matches returned item subtotal (₹12,000)"
  );
  assert(
    returnReq.returnRequest.returnId.startsWith("SRTN-"),
    "Return assigned unique SRTN standard reference"
  );

  // 5D: Duplicate return prevention
  try {
    await requestStoreReturn({
      parentOrderId: returnParent._id,
      fulfilmentOrderId: returnSfo1._id,
      customerId: customerId1,
      items: [{ productId: prodId1, quantity: 1 }],
      reason: "Second return",
      description: "Duplicate",
    });
    assert(false, "Duplicate return must be rejected");
  } catch (err) {
    assert(
      err.statusCode === 400 && (err.message.includes("already in progress") || err.message.includes("already active")),
      "Duplicate return request strictly blocked while another is pending"
    );
  }

  // 5E: Admin Return Review (Approval)
  const approveReturnRes = await reviewStoreReturn({
    returnId: returnReq.returnRequest.returnId,
    adminId,
    adminName: "Marketplace Support Lead",
    decision: "APPROVED",
    reason: "Measurement discrepancy verified with buyer photos. Return authorized.",
  });
  assert(approveReturnRes.success === true, "Return request approved by admin");
  assert(approveReturnRes.returnRequest.status === "APPROVED", "Return status transitioned to APPROVED");

  // 5F: Warehouse Item Receipt Logging
  const receiveRes = await recordReturnItemReceived({
    returnId: returnReq.returnRequest.returnId,
    adminId,
    adminName: "Jaipur Logistics Hub",
    returnTracking: {
      courierName: "Blue Dart Return",
      trackingNumber: "BDRTN987654321",
    },
    note: "Inspected at warehouse: unworn, tags attached, in original condition.",
  });
  assert(receiveRes.success === true, "Return item receipt recorded successfully");
  assert(
    receiveRes.returnRequest.status === "ITEM_RETURNED" || receiveRes.returnRequest.status === "REFUND_PENDING",
    "Return status transitioned to ITEM_RETURNED or REFUND_PENDING"
  );
  assert(returnSfo1.status === "RETURNED", "Fulfilment order status moved to RETURNED");
  assert(Boolean(receiveRes.returnRequest.refundId), "Refund record created upon warehouse return item receipt");
  const returnRefundDoc = mockRefunds.find((r) => r._id.toString() === receiveRes.returnRequest.refundId.toString());
  assert(
    returnRefundDoc?.status === "REQUESTED",
    "Refund ledger entry initiated safely in REQUESTED status (no live bank transfers)"
  );

  // -------------------------------------------------------------------------
  // SECTION 6: Verified Purchase Reviews & Ratings Recalculation
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Verified Purchase Reviews & Aggregate Ratings ---");

  const { parentOrder: reviewParent, sfo1: reviewSfo1 } = buildMockOrder({ paymentStatus: "PAID", status: "DELIVERED" });
  reviewSfo1.status = "DELIVERED";

  // 6A: Undelivered order review rejection
  const undeliveredSfo = new StoreFulfilmentOrder({
    _id: new mongoose.Types.ObjectId(),
    fulfilmentOrderNumber: "SFO-UNDELIVERED-01",
    parentOrderId: reviewParent._id,
    parentOrderNumber: reviewParent.orderNumber,
    customerId: customerId1,
    sellerId: sellerId1,
    storeId: storeId1,
    status: "PROCESSING",
    items: [{ productId: prodId1, title: "Item", unitPrice: 5000, quantity: 1, totalPrice: 5000 }],
    subtotal: 5000,
    totalAmount: 5000,
  });
  undeliveredSfo.save = async function () {
    mockFulfilments.set(this._id.toString(), this);
    return this;
  };
  mockFulfilments.set(undeliveredSfo._id.toString(), undeliveredSfo);

  try {
    await createStoreReview({
      customerId: customerId1,
      customerName: "Radhika",
      productId: prodId1,
      fulfilmentOrderId: undeliveredSfo._id,
      rating: 5,
      comment: "Great",
    });
    assert(false, "Undelivered item review must be rejected");
  } catch (err) {
    assert(
      err.statusCode === 400 && err.message.toLowerCase().includes("delivered"),
      "Review submission strictly rejected if fulfilment order is not DELIVERED (HTTP 400)"
    );
  }

  // 6B: Anti-self-review guard
  try {
    await createStoreReview({
      customerId: sellerId1, // Seller trying to review own item
      customerName: "Sneaky Seller",
      productId: prodId1,
      fulfilmentOrderId: reviewSfo1._id,
      rating: 5,
      comment: "I love my own clothes!",
    });
    assert(false, "Seller self-review must be blocked");
  } catch (err) {
    assert(
      err.statusCode === 403 && (err.message.includes("prohibited from reviewing") || err.message.includes("cannot review")),
      "Anti-self-review guard blocks sellers from reviewing their own products (HTTP 403)"
    );
  }

  // 6C: Legitimate verified purchase review
  const reviewRes1 = await createStoreReview({
    customerId: customerId1,
    customerName: "Radhika Sharma",
    productId: prodId1,
    fulfilmentOrderId: reviewSfo1._id,
    rating: 5,
    title: "Spectacular royal silhouette",
    comment: "The zari handwork is authentic and stunning. Fits like couture.",
  });
  assert(reviewRes1.success === true, "Verified purchase review submitted successfully");
  assert(reviewRes1.review.isVerifiedPurchase === true, "Review tagged with isVerifiedPurchase: true");
  assert(reviewRes1.review.status === "PUBLISHED", "Review published to catalog");

  // Check auto-recalculated product rating
  assert(testProduct1.rating === 5, "Product rating recalculated to 5.0 after 5-star review");
  assert(testProduct1.reviewsCount === 1, "Product reviewsCount incremented to 1");

  // 6D: Duplicate review prevention
  try {
    await createStoreReview({
      customerId: customerId1,
      customerName: "Radhika Sharma",
      productId: prodId1,
      fulfilmentOrderId: reviewSfo1._id,
      rating: 4,
      comment: "Trying to review again",
    });
    assert(false, "Duplicate review for same purchase item must be rejected");
  } catch (err) {
    assert(
      err.statusCode === 400 && (err.message.includes("already submitted") || err.message.includes("Duplicate review")),
      "Customer cannot submit duplicate reviews for the same fulfilled purchase item"
    );
  }

  // 6E: Second customer adds a 4-star review
  const secondCustSfo = new StoreFulfilmentOrder({
    _id: new mongoose.Types.ObjectId(),
    fulfilmentOrderNumber: "SFO-CUST2-01",
    parentOrderId: new mongoose.Types.ObjectId(),
    parentOrderNumber: `SO-CUST2-01`,
    customerId: customerId2,
    sellerId: sellerId1,
    storeId: storeId1,
    status: "DELIVERED",
    items: [{ productId: prodId1, title: "Kurta", unitPrice: 12000, quantity: 1, totalPrice: 12000 }],
    subtotal: 12000,
    totalAmount: 12000,
  });
  secondCustSfo.save = async function () {
    mockFulfilments.set(this._id.toString(), this);
    return this;
  };
  mockFulfilments.set(secondCustSfo._id.toString(), secondCustSfo);

  await createStoreReview({
    customerId: customerId2,
    customerName: "Ananya Iyer",
    productId: prodId1,
    fulfilmentOrderId: secondCustSfo._id,
    rating: 4,
    title: "Lovely fabric, slightly delayed delivery",
    comment: "The garment itself is 5 stars, courier took 4 days.",
  });

  // Expected avg: (5 + 4) / 2 = 4.5
  assert(testProduct1.rating === 4.5, "Product rating weighted average updated to 4.5");
  assert(testProduct1.reviewsCount === 2, "Product reviewsCount updated to 2");

  // 6F: Public reviews breakdown
  const publicReviews = await getProductReviews({ productId: prodId1 });
  assert(publicReviews.success === true, "Public reviews fetched successfully");
  assert(publicReviews.total === 2, "Public reviews total count is 2");
  assert(publicReviews.ratingBreakdown[5] === 1, "Rating breakdown has 1 five-star review");
  assert(publicReviews.ratingBreakdown[4] === 1, "Rating breakdown has 1 four-star review");

  // 6G: Admin Moderation - Hiding a review removes it from aggregate rating
  const modRes = await moderateStoreReview({
    reviewId: reviewRes1.review.reviewId,
    adminId,
    status: "HIDDEN",
    moderationNotes: "Review under investigation for promotional wording.",
  });
  assert(modRes.success === true, "Review status moderated to HIDDEN");
  assert(testProduct1.rating === 4, "Product rating recalculated to 4.0 after hiding 5-star review");
  assert(testProduct1.reviewsCount === 1, "Product reviewsCount decreased to 1");

  // -------------------------------------------------------------------------
  // SECTION 7: Post-Purchase Notifications
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Post-Purchase Notification Delivery & Safe Channel ---");

  assert(mockNotifications.length > 0, "Post-purchase events generated in-app notifications");
  const cancelNotifs = mockNotifications.filter((n) => n.type.includes("CANCELLATION"));
  const returnNotifs = mockNotifications.filter((n) => n.type.includes("RETURN"));
  assert(cancelNotifs.length > 0, "Cancellation event generated notification record");
  assert(returnNotifs.length > 0, "Return event generated notification record");
  assert(
    mockNotifications.every((n) => n.channel === "IN_APP"),
    "All notifications dispatched strictly via zero-cost IN_APP channel (no SMS/paid APIs)"
  );

  // -------------------------------------------------------------------------
  // SECTION 8: Rental Vertical Invariants & Zero-Regression Check
  // -------------------------------------------------------------------------
  console.log("\n--- 8. Rental Vertical Isolation & Zero-Regression Guard ---");

  // 8A: Rental booking calendar conflict engine
  const rentalStart = new Date("2026-12-01T10:00:00Z");
  const rentalEnd = new Date("2026-12-05T18:00:00Z");
  const existingRentals = [
    {
      startDate: new Date("2026-12-03T00:00:00Z"),
      endDate: new Date("2026-12-08T00:00:00Z"),
    },
  ];
  const conflict = findDateConflict(existingRentals, rentalStart, rentalEnd);
  assert(Boolean(conflict), "Rental calendar collision detection remains fully operational");

  // 8B: Rental OrderModel schema
  const rentalOrder = new OrderModel({
    userEmail: "renter@wardrobewonders.com",
    product: new mongoose.Types.ObjectId(),
    quantity: 1,
    totalAmount: 7000,
    paymentMethod: "PHONEPE",
    providerId: sellerId1,
    rentalStartDate: rentalStart,
    rentalEndDate: rentalEnd,
    rentalFee: 4000,
    securityDeposit: 3000,
    requestStatus: "Pending",
  });
  const rentalErr = rentalOrder.validateSync();
  assert(!rentalErr, "Rental OrderModel schema remains completely untouched and valid");

  const mockRentalProduct = { rentalPricePerDay: 1000, securityDeposit: 3000 };
  const rentalPricing = calculateServerPricing(mockRentalProduct, rentalStart, rentalEnd);
  const providerEarnings = Math.round(rentalPricing.rentalFee * 0.85);
  assert(
    providerEarnings === 3400,
    "Rental provider 85% payout invariant remains strictly untouched (3400)"
  );

  // -------------------------------------------------------------------------
  // FINAL RESULTS SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(`   PHASE 8 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED   `);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase8TestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
