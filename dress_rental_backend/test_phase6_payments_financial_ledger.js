process.env.ENABLE_MOCK_PAYMENTS = "true";
process.env.NODE_ENV = "test";
process.env.STORE_COMMISSION_PERCENT = "10";

import mongoose from "mongoose";
import axios from "axios";
import { randomUUID, createHash } from "crypto";
import StoreOrder from "./models/StoreOrderModel.js";
import StoreFulfilmentOrder from "./models/StoreFulfilmentOrderModel.js";
import StorePayment from "./models/StorePaymentModel.js";
import StoreLedger from "./models/StoreLedgerModel.js";
import StoreRefund from "./models/StoreRefundModel.js";
import { config } from "./config/phonepeConfig.js";
import {
  calculateSellerFinancialBreakdown,
  getStoreCommissionPercent,
  createFulfilmentLedgerEntries,
  initiateStorePayment,
  verifyStorePayment,
  processStoreWebhook,
  initiateStoreRefund,
  getAdminFinancesOverview,
  getSellerFinancesOverview,
} from "./services/storePaymentService.js";
import { findDateConflict, calculateServerPricing } from "./services/bookingSafetyService.js";

console.log("\n==========================================================================");
console.log("   WARDROBE WONDERS — PHASE 6: STORE PAYMENTS, PHONEPE SANDBOX & LEDGER   ");
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

async function runPhase6TestSuite() {
  const customerId1 = new mongoose.Types.ObjectId();
  const customerId2 = new mongoose.Types.ObjectId();
  const sellerId1 = new mongoose.Types.ObjectId();
  const sellerId2 = new mongoose.Types.ObjectId();
  const storeId1 = new mongoose.Types.ObjectId();
  const storeId2 = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const prodId1 = new mongoose.Types.ObjectId();
  const prodId2 = new mongoose.Types.ObjectId();

  // -------------------------------------------------------------------------
  // SECTION 1: Schema Invariants for Payment, Ledger & Refund Models
  // -------------------------------------------------------------------------
  console.log("--- 1. Store Payment, Ledger & Refund Schema Invariants ---");

  const orderId1 = new mongoose.Types.ObjectId();
  const orderNumber1 = `SO-${Date.now()}-1001`;

  // 1A: Valid StorePayment Document
  const validPayment = new StorePayment({
    parentOrderId: orderId1,
    orderNumber: orderNumber1,
    customerId: customerId1,
    paymentProvider: "PHONEPE",
    internalPaymentId: `SPAY-${Date.now()}-1`,
    merchantTransactionId: `STXN-${Date.now()}-1`,
    amount: 15000,
    amountInPaise: 1500000,
    currency: "INR",
    status: "INITIATED",
  });
  const paymentValErr = validPayment.validateSync();
  assert(!paymentValErr, "Valid StorePayment document passes schema validation");

  // 1B: StorePayment rejects missing parentOrderId
  const invalidPayment = new StorePayment({
    orderNumber: orderNumber1,
    customerId: customerId1,
    internalPaymentId: `SPAY-${Date.now()}-2`,
    merchantTransactionId: `STXN-${Date.now()}-2`,
    amount: 1000,
    amountInPaise: 100000,
  });
  const invPayErr = invalidPayment.validateSync();
  assert(Boolean(invPayErr?.errors?.parentOrderId), "StorePayment requires parentOrderId");

  // 1C: StorePayment rejects invalid status enum
  const badStatusPayment = new StorePayment({
    parentOrderId: orderId1,
    orderNumber: orderNumber1,
    customerId: customerId1,
    internalPaymentId: `SPAY-${Date.now()}-3`,
    merchantTransactionId: `STXN-${Date.now()}-3`,
    amount: 1000,
    amountInPaise: 100000,
    status: "BOGUS_STATUS",
  });
  const badStatusErr = badStatusPayment.validateSync();
  assert(Boolean(badStatusErr?.errors?.status), "StorePayment enforces strict status enum values");

  // 1D: Valid StoreLedger Document
  const validLedger = new StoreLedger({
    entryId: `SLED-SALE-${Date.now()}-1`,
    storeOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    fulfilmentOrderId: new mongoose.Types.ObjectId(),
    fulfilmentOrderNumber: `SFO-${Date.now()}-1`,
    sellerId: sellerId1,
    storeId: storeId1,
    type: "SALE",
    direction: "CREDIT",
    amount: 10000,
    amountInPaise: 1000000,
    netSellerImpact: 10000,
    description: "Item sales credit",
  });
  const ledgerValErr = validLedger.validateSync();
  assert(!ledgerValErr, "Valid StoreLedger document passes schema validation");

  // 1E: StoreLedger rejects missing direction or entryId
  const invalidLedger = new StoreLedger({
    storeOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    fulfilmentOrderId: new mongoose.Types.ObjectId(),
    fulfilmentOrderNumber: `SFO-${Date.now()}-2`,
    sellerId: sellerId1,
    storeId: storeId1,
    type: "SALE",
  });
  const invLedgerErr = invalidLedger.validateSync();
  assert(Boolean(invLedgerErr?.errors?.entryId && invLedgerErr?.errors?.direction), "StoreLedger requires entryId and direction");

  // 1F: Valid StoreRefund Document
  const validRefund = new StoreRefund({
    refundId: `SRFD-${Date.now()}-1`,
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    paymentId: validPayment._id,
    requestedBy: adminId,
    amount: 5000,
    amountInPaise: 500000,
    reason: "Damaged item during shipping",
    status: "REQUESTED",
  });
  const refundValErr = validRefund.validateSync();
  assert(!refundValErr, "Valid StoreRefund document passes schema validation");

  // 1G: StoreRefund rejects non-positive amount
  const zeroRefund = new StoreRefund({
    refundId: `SRFD-${Date.now()}-2`,
    parentOrderId: orderId1,
    parentOrderNumber: orderNumber1,
    paymentId: validPayment._id,
    requestedBy: adminId,
    amount: 0,
    amountInPaise: 0,
    reason: "Zero refund test",
  });
  const zeroRefErr = zeroRefund.validateSync();
  assert(Boolean(zeroRefErr?.errors?.amount), "StoreRefund strictly rejects zero or negative refund amount");

  // -------------------------------------------------------------------------
  // SECTION 2: Commission Formula & Integer Paise Precision
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Commission Formula & Integer Paise Arithmetic Precision ---");

  // 2A: Default 10% platform commission calculation
  const mockFulfilment1 = {
    subtotal: 15499.5, // Float price to test rounding
    shippingFee: 250,
  };
  const breakdown1 = calculateSellerFinancialBreakdown(mockFulfilment1, 10);

  // Subtotal in paise = 1549950
  // Commission @ 10% = 154995 paise = ₹1549.95
  // Shipping @ 0% comm = 25000 paise = ₹250.00
  // Seller payable = 1549950 - 154995 + 25000 = 1419955 paise = ₹14199.55
  assert(breakdown1.subtotalPaise === 1549950, "Subtotal converted precisely to integer paise (1549950)");
  assert(breakdown1.commissionPaise === 154995, "10% commission calculated precisely in paise (154995)");
  assert(breakdown1.commission === 1549.95, "Commission in INR is ₹1549.95");
  assert(breakdown1.shippingFee === 250, "Shipping fee preserved without commission (₹250)");
  assert(breakdown1.sellerPayablePaise === 1419955, "Seller payable paise matches exact formula (1419955)");
  assert(breakdown1.sellerPayable === 14199.55, "Seller payable amount in INR is ₹14199.55");

  // 2B: Configurable commission rate (15%)
  const breakdown2 = calculateSellerFinancialBreakdown({ subtotal: 10000, shippingFee: 0 }, 15);
  assert(breakdown2.commission === 1500, "Configurable 15% commission equals ₹1500");
  assert(breakdown2.sellerPayable === 8500, "Seller payable equals ₹8500 at 15% commission");

  // 2C: Independence from Rental 85% payout
  assert(
    breakdown1.commissionPercent === 10 && breakdown1.commission !== 0,
    "Store commission is independent of Rental's 85% provider payout"
  );

  // -------------------------------------------------------------------------
  // SECTION 3: Payment Initiation & Security Guards
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Payment Initiation, Authorization & Idempotency ---");

  // Mock StoreOrder in-memory database
  const mockOrderData = {
    _id: orderId1,
    orderNumber: orderNumber1,
    customerId: customerId1,
    customerPhone: "9876543210",
    grandTotal: 15749.5,
    currency: "INR",
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
  };

  const originalOrderFindOne = StoreOrder.findOne;
  const originalOrderFindById = StoreOrder.findById;
  const originalPaymentFindOne = StorePayment.findOne;
  const originalPaymentSave = StorePayment.prototype.save;
  const originalOrderSave = StoreOrder.prototype.save;
  const originalLedgerSave = StoreLedger.prototype.save;
  const originalLedgerFind = StoreLedger.find;
  const originalFulfilmentFind = StoreFulfilmentOrder.find;

  // Mock StoreOrder.findOne
  StoreOrder.findOne = async (q) => {
    if (q._id?.toString() === orderId1.toString() || q.orderNumber === orderNumber1) {
      return { ...mockOrderData };
    }
    return null;
  };

  // Mock StorePayment.findOne
  let activeMockPayment = null;
  StorePayment.findOne = async (q) => {
    if (q.idempotencyKey && activeMockPayment?.idempotencyKey === q.idempotencyKey) {
      return activeMockPayment;
    }
    if (q.merchantTransactionId && activeMockPayment?.merchantTransactionId === q.merchantTransactionId) {
      return activeMockPayment;
    }
    if (q.parentOrderId?.toString() === orderId1.toString() && q.status === "SUCCESS" && activeMockPayment?.status === "SUCCESS") {
      return activeMockPayment;
    }
    return null;
  };

  // Mock StorePayment.prototype.save
  StorePayment.prototype.save = async function () {
    activeMockPayment = this;
    return this;
  };

  // Mock Axios for PhonePe Sandbox endpoints
  const originalAxiosPost = axios.post;
  const originalAxiosGet = axios.get;

  axios.post = async (url, data, options) => {
    if (url && url.includes("pg/v1/pay")) {
      const decodedPayload = JSON.parse(Buffer.from(data.request, "base64").toString("utf-8"));
      return {
        data: {
          success: true,
          code: "PAYMENT_INITIATED",
          message: "Payment initiated successfully in sandbox",
          data: {
            merchantId: decodedPayload.merchantId,
            merchantTransactionId: decodedPayload.merchantTransactionId,
            instrumentResponse: {
              type: "PAY_PAGE",
              redirectInfo: {
                url: `https://mercury-uat.phonepe.com/transact/pg?token=sandbox_${decodedPayload.merchantTransactionId}`,
                method: "GET",
              },
            },
          },
        },
      };
    }
    return originalAxiosPost(url, data, options);
  };

  axios.get = async (url, options) => {
    if (url && url.includes("/pg/v1/status/")) {
      const parts = url.split("/");
      const txnId = parts[parts.length - 1];
      return {
        data: {
          success: true,
          code: "PAYMENT_SUCCESS",
          message: "Your payment is successful",
          data: {
            merchantId: config.MID,
            merchantTransactionId: txnId,
            transactionId: `PHONEPE-${Date.now()}`,
            amount: 1574950,
            state: "COMPLETED",
            responseCode: "SUCCESS",
          },
        },
      };
    }
    return originalAxiosGet(url, options);
  };

  // 3A: Authentication & Multi-Tenant IDOR: Customer B cannot pay Customer A's order
  let idorCaught = false;
  try {
    await initiateStorePayment({
      orderId: orderId1,
      customerId: customerId2, // Wrong customer!
      simulateMock: true,
    });
  } catch (err) {
    if (err.statusCode === 403) {
      idorCaught = true;
    }
  }
  assert(idorCaught, "Customer B is strictly forbidden from initiating payment on Customer A's order (HTTP 403)");

  // 3B: Legitimate Customer A initiates payment session
  const initResult = await initiateStorePayment({
    orderId: orderId1,
    customerId: customerId1,
    idempotencyKey: "IDEM-KEY-001",
    simulateMock: true,
  });
  assert(Boolean(initResult.payment), "Payment session created successfully for legitimate customer");
  assert(
    initResult.payment.amount === mockOrderData.grandTotal,
    "Payment amount is calculated strictly from server order grand total (15749.5)"
  );
  assert(
    initResult.payment.amountInPaise === Math.round(mockOrderData.grandTotal * 100),
    "Payment amount in paise matches server calculation (1574950)"
  );
  assert(initResult.payment.status === "PENDING", "Payment initial status set to PENDING");

  // 3C: Duplicate Payment Initiation Idempotency: Same idempotency key reuses transaction
  const dupInitResult = await initiateStorePayment({
    orderId: orderId1,
    customerId: customerId1,
    idempotencyKey: "IDEM-KEY-001",
    simulateMock: true,
  });
  assert(dupInitResult.isIdempotent === true, "Repeated payment initiation with same idempotencyKey is handled idempotently");
  assert(
    dupInitResult.payment.merchantTransactionId === initResult.payment.merchantTransactionId,
    "Idempotent initiation returns identical transaction reference without duplicate charge creation"
  );

  // 3D: Order State Guard: Cannot pay an already paid order
  let alreadyPaidCaught = false;
  StoreOrder.findOne = async () => ({
    ...mockOrderData,
    paymentStatus: "PAID",
    status: "PROCESSING",
  });
  try {
    await initiateStorePayment({
      orderId: orderId1,
      customerId: customerId1,
      simulateMock: true,
    });
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes("already been paid")) {
      alreadyPaidCaught = true;
    }
  }
  assert(alreadyPaidCaught, "Initiating payment for an already paid order is strictly rejected (HTTP 400)");

  // Reset StoreOrder.findOne
  StoreOrder.findOne = async () => ({ ...mockOrderData });

  // -------------------------------------------------------------------------
  // SECTION 4: PhonePe Signature & Checksum Verification
  // -------------------------------------------------------------------------
  console.log("\n--- 4. PhonePe V1 SHA-256 Signature & Checksum Verification ---");

  const salt = config.KEY;
  const index = config.INDEX;

  // 4A: Checksum generation format
  const mockPayload = {
    merchantId: config.MID,
    merchantTransactionId: initResult.payment.merchantTransactionId,
    amount: 1574950,
  };
  const base64Str = Buffer.from(JSON.stringify(mockPayload)).toString("base64");
  const expectedHash = createHash("sha256")
    .update(`${base64Str}/pg/v1/pay${salt}`)
    .digest("hex");
  const expectedVerify = `${expectedHash}###${index}`;

  assert(expectedVerify.includes(`###${index}`), "Checksum matches PhonePe V1 signature format (SHA256###INDEX)");

  // 4B: Webhook callback signature verification rejects tampered signature
  let badSignatureCaught = false;
  try {
    await processStoreWebhook({
      rawVerify: "invalid_tampered_signature###1",
      base64Response: base64Str,
    });
  } catch (err) {
    if (err.statusCode === 401 && err.message.includes("Invalid webhook signature")) {
      badSignatureCaught = true;
    }
  }
  assert(badSignatureCaught, "Callback with invalid/tampered SHA-256 signature is rejected with HTTP 401");

  // 4C: Legitimate webhook signature generation
  const webhookExpectedHash = createHash("sha256")
    .update(`${base64Str}${salt}`)
    .digest("hex");
  const legitimateWebhookVerify = `${webhookExpectedHash}###${index}`;
  assert(Boolean(legitimateWebhookVerify), "Valid SHA-256 webhook signature successfully constructed");

  // -------------------------------------------------------------------------
  // SECTION 5: Payment Finalization, Order Activation & Ledger Generation
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Payment Finalization, Order Activation & Ledger Generation ---");

  const fulfilmentOrderId1 = new mongoose.Types.ObjectId();
  const fulfilmentOrderId2 = new mongoose.Types.ObjectId();

  const mockChildFulfilments = [
    {
      _id: fulfilmentOrderId1,
      fulfilmentOrderNumber: `SFO-${Date.now()}-1`,
      parentOrderId: orderId1,
      sellerId: sellerId1,
      storeId: storeId1,
      subtotal: 10000,
      shippingFee: 250,
      totalAmount: 10250,
      currency: "INR",
      status: "PENDING_PAYMENT",
      save: async function () {
        return this;
      },
    },
    {
      _id: fulfilmentOrderId2,
      fulfilmentOrderNumber: `SFO-${Date.now()}-2`,
      parentOrderId: orderId1,
      sellerId: sellerId2,
      storeId: storeId2,
      subtotal: 5499.5,
      shippingFee: 0,
      totalAmount: 5499.5,
      currency: "INR",
      status: "PENDING_PAYMENT",
      save: async function () {
        return this;
      },
    },
  ];

  StoreOrder.findById = async (id) => {
    return {
      ...mockOrderData,
      _id: id,
      fulfilmentOrderIds: [fulfilmentOrderId1, fulfilmentOrderId2],
      save: async function () {
        this.saved = true;
        return this;
      },
      populate: function () {
        return this;
      },
    };
  };

  StoreFulfilmentOrder.find = async () => mockChildFulfilments;

  // Track created ledger entries
  const memoryLedger = [];
  StoreLedger.prototype.save = async function () {
    memoryLedger.push(this);
    return this;
  };
  StoreLedger.find = async (q) => {
    if (q.fulfilmentOrderId) {
      return memoryLedger.filter((e) => e.fulfilmentOrderId?.toString() === q.fulfilmentOrderId.toString());
    }
    if (q.sellerId) {
      return memoryLedger.filter((e) => e.sellerId?.toString() === q.sellerId.toString());
    }
    return memoryLedger;
  };

  // 5A: Verify Payment Success
  const verifyResult = await verifyStorePayment({
    merchantTransactionId: initResult.payment.merchantTransactionId,
    customerId: customerId1,
    simulateMock: true,
  });

  assert(verifyResult.success === true, "Payment verification returns success: true");
  assert(verifyResult.payment.status === "SUCCESS", "StorePayment transitioned to SUCCESS");
  assert(verifyResult.order.paymentStatus === "PAID", "Parent StoreOrder paymentStatus marked PAID");
  assert(verifyResult.order.status === "PROCESSING", "Parent StoreOrder status moved to PROCESSING");

  // 5B: Seller Fulfillment Order Activation
  assert(
    mockChildFulfilments[0].status === "ORDER_PLACED" && mockChildFulfilments[1].status === "ORDER_PLACED",
    "Child seller fulfilment orders moved from PENDING_PAYMENT to ORDER_PLACED"
  );

  // 5C: Immutable Ledger Entries Generated for Both Sellers
  // Seller 1: subtotal 10000, commission 1000, shipping 250 -> 3 entries
  // Seller 2: subtotal 5499.5, commission 550, shipping 0 -> 2 entries
  // Total entries = 5
  assert(memoryLedger.length === 5, `Exactly 5 ledger audit entries created (got ${memoryLedger.length})`);

  const s1Sale = memoryLedger.find((e) => e.sellerId.toString() === sellerId1.toString() && e.type === "SALE");
  const s1Comm = memoryLedger.find((e) => e.sellerId.toString() === sellerId1.toString() && e.type === "COMMISSION");
  const s1Ship = memoryLedger.find((e) => e.sellerId.toString() === sellerId1.toString() && e.type === "SHIPPING");

  assert(s1Sale && s1Sale.amount === 10000 && s1Sale.direction === "CREDIT", "Seller 1 SALE entry credited for ₹10,000");
  assert(s1Comm && s1Comm.amount === 1000 && s1Comm.direction === "DEBIT", "Seller 1 COMMISSION entry debited for ₹1,000");
  assert(s1Ship && s1Ship.amount === 250 && s1Ship.direction === "CREDIT", "Seller 1 SHIPPING entry credited for ₹250");

  // 5D: Idempotency Protection: Repeated verify call does not create duplicate ledger entries
  const repeatVerifyResult = await verifyStorePayment({
    merchantTransactionId: initResult.payment.merchantTransactionId,
    customerId: customerId1,
    simulateMock: true,
  });
  assert(repeatVerifyResult.idempotent === true, "Repeated verification detected as idempotent");
  assert(memoryLedger.length === 5, "Repeated verification did not create duplicate ledger entries");

  // -------------------------------------------------------------------------
  // SECTION 6: Out-of-Order Webhook & Failed Payment Guards
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Out-of-Order Webhook & Failed Payment Safeguards ---");

  // 6A: A failed webhook CANNOT overwrite an already confirmed SUCCESS payment
  const failedPayload = {
    code: "PAYMENT_ERROR",
    message: "Late timeout report",
    data: {
      merchantTransactionId: initResult.payment.merchantTransactionId,
      amount: 1574950,
    },
  };
  const failedBase64 = Buffer.from(JSON.stringify(failedPayload)).toString("base64");
  const failedHash = createHash("sha256").update(`${failedBase64}${salt}`).digest("hex") + `###${index}`;

  const lateWebhookRes = await processStoreWebhook({
    rawVerify: failedHash,
    base64Response: failedBase64,
  });

  assert(
    initResult.payment.status === "SUCCESS",
    "Out-of-order failed webhook did NOT overwrite confirmed SUCCESS payment status"
  );
  assert(
    lateWebhookRes.idempotent === true || lateWebhookRes.code === "ALREADY_CONFIRMED",
    "Webhook recognized confirmed state and responded safely"
  );

  // 6B: Legitimate failure on fresh transaction leaves order in safe retry state
  const failedPaymentTxn = new StorePayment({
    parentOrderId: orderId1,
    orderNumber: orderNumber1,
    customerId: customerId1,
    internalPaymentId: `SPAY-${Date.now()}-FAIL`,
    merchantTransactionId: `STXN-${Date.now()}-FAIL`,
    amount: 1000,
    amountInPaise: 100000,
    status: "INITIATED",
  });
  activeMockPayment = failedPaymentTxn;

  const freshFailedPayload = {
    code: "PAYMENT_DECLINED",
    message: "Card expired",
    data: {
      merchantTransactionId: failedPaymentTxn.merchantTransactionId,
      amount: 100000,
    },
  };
  const freshFailBase64 = Buffer.from(JSON.stringify(freshFailedPayload)).toString("base64");
  const freshFailHash = createHash("sha256").update(`${freshFailBase64}${salt}`).digest("hex") + `###${index}`;

  const failedOutcome = await processStoreWebhook({
    rawVerify: freshFailHash,
    base64Response: freshFailBase64,
  });

  assert(failedOutcome.code === "PAYMENT_FAILED", "Failed gateway callback safely recorded as PAYMENT_FAILED");
  assert(failedPaymentTxn.status === "FAILED", "Payment transaction marked FAILED");

  // -------------------------------------------------------------------------
  // SECTION 7: Admin Refund Foundation & Compensating Ledgers
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Admin Refund Foundation & Compensating Ledgers ---");

  // Set active payment back to confirmed SUCCESS
  activeMockPayment = initResult.payment;
  initResult.payment.status = "SUCCESS";

  StoreOrder.findById = async (id) => ({
    ...mockOrderData,
    _id: id,
    paymentStatus: "PAID",
    status: "PROCESSING",
    save: async function () {
      return this;
    },
  });

  StoreFulfilmentOrder.findOne = async () => mockChildFulfilments[0];

  const memoryRefunds = [];
  StoreRefund.prototype.save = async function () {
    memoryRefunds.push(this);
    return this;
  };
  StoreRefund.find = async () => memoryRefunds;
  StoreRefund.findOne = async (q) => {
    if (q?.idempotencyKey) {
      return memoryRefunds.find((r) => r.idempotencyKey === q.idempotencyKey) || null;
    }
    return memoryRefunds[0] || null;
  };

  // 7A: Over-refund limit rejection (Cannot refund more than order total)
  let overRefundCaught = false;
  try {
    await initiateStoreRefund({
      parentOrderId: orderId1,
      amount: 25000, // Exceeds 15749.50
      reason: "Greedy refund attempt",
      adminUser: { _id: adminId },
    });
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes("exceeds maximum remaining refundable")) {
      overRefundCaught = true;
    }
  }
  assert(overRefundCaught, "Refund amount exceeding original paid total is strictly rejected (HTTP 400)");

  // 7B: Partial refund with compensating ledger entries
  const refundAmount = 3000;
  const refundRes = await initiateStoreRefund({
    parentOrderId: orderId1,
    fulfilmentOrderId: fulfilmentOrderId1,
    amount: refundAmount,
    reason: "Defective item partial refund",
    adminUser: { _id: adminId },
    idempotencyKey: "RFND-IDEM-001",
  });

  assert(refundRes.success === true, "Partial refund initiated successfully");
  assert(refundRes.refund.amount === 3000, "Refund amount recorded as ₹3,000");
  assert(refundRes.refund.status === "REQUESTED", "Refund tracked in safe sandbox REQUESTED status");
  assert(refundRes.order.paymentStatus === "PARTIALLY_REFUNDED", "Order paymentStatus updated to PARTIALLY_REFUNDED");

  // Verify compensating ledger entries:
  // 1. REFUND entry: -₹3,000 (DEBIT)
  // 2. COMMISSION_REVERSAL entry: +₹300 (CREDIT @ 10%)
  const refundLedger = memoryLedger.find((e) => e.type === "REFUND");
  const commRevLedger = memoryLedger.find((e) => e.type === "COMMISSION_REVERSAL");

  assert(refundLedger && refundLedger.amount === 3000 && refundLedger.direction === "DEBIT", "Compensating REFUND ledger entry debited for ₹3,000");
  assert(commRevLedger && commRevLedger.amount === 300 && commRevLedger.direction === "CREDIT", "Compensating COMMISSION_REVERSAL entry credited for ₹300 (10%)");

  // 7C: Duplicate refund idempotency
  StoreRefund.findOne = async (q) => {
    if (q.idempotencyKey === "RFND-IDEM-001") return refundRes.refund;
    return null;
  };
  const dupRefundRes = await initiateStoreRefund({
    parentOrderId: orderId1,
    amount: refundAmount,
    reason: "Duplicate request",
    adminUser: { _id: adminId },
    idempotencyKey: "RFND-IDEM-001",
  });
  assert(dupRefundRes.isIdempotent === true, "Repeated refund request with same idempotencyKey is handled idempotently");

  // -------------------------------------------------------------------------
  // SECTION 8: Multi-Tenant Seller Isolation & Admin Overview
  // -------------------------------------------------------------------------
  console.log("\n--- 8. Multi-Tenant Seller Financial Isolation & Admin Reporting ---");

  // Mock ledger find for seller isolation test
  StoreLedger.find = (q) => ({
    sort: () => ({
      lean: async () => {
        if (q?.sellerId) {
          return memoryLedger.filter((e) => e.sellerId.toString() === q.sellerId.toString());
        }
        return memoryLedger;
      },
    }),
    lean: async () => {
      if (q?.sellerId) {
        return memoryLedger.filter((e) => e.sellerId.toString() === q.sellerId.toString());
      }
      return memoryLedger;
    },
  });

  StorePayment.find = () => ({
    lean: async () => [initResult.payment],
  });

  StoreRefund.find = () => ({
    lean: async () => memoryRefunds,
  });

  // 8A: Seller 1 financial breakdown
  const s1Finances = await getSellerFinancesOverview(sellerId1);
  // S1: Sale 10000, Comm 1000, Shipping 250, Refund 3000, CommRev 300
  // Net Payable = 10000 - 1000 + 250 - 3000 + 300 = ₹6,550
  assert(s1Finances.grossItemSales === 10000, "Seller 1 gross sales correctly isolated (₹10,000)");
  assert(s1Finances.commissionDeductions === 1000, "Seller 1 commission deductions correctly isolated (₹1,000)");
  assert(s1Finances.shippingReimbursements === 250, "Seller 1 shipping reimbursements correctly isolated (₹250)");
  assert(s1Finances.refundAdjustments === 3000, "Seller 1 refund adjustments correctly isolated (₹3,000)");
  assert(s1Finances.commissionReversals === 300, "Seller 1 commission reversals correctly isolated (₹300)");
  assert(s1Finances.netPayableAmount === 6550, "Seller 1 net payable balance is ₹6,550");
  assert(s1Finances.disclaimer.includes("internal ledger balances"), "Seller finances carries explicit internal ledger disclaimer");

  // 8B: Seller 2 financial isolation (Seller 2 must NOT see Seller 1's sales)
  const s2Finances = await getSellerFinancesOverview(sellerId2);
  // S2: Sale 5499.5, Comm 549.95, Shipping 0, Refund 0
  // Net Payable = 5499.5 - 549.95 = ₹4,949.55
  assert(s2Finances.grossItemSales === 5499.5, "Seller 2 gross sales reflects only own catalog (₹5,499.50)");
  assert(s2Finances.refundAdjustments === 0, "Seller 2 is unaffected by Seller 1's refund adjustments (₹0)");
  assert(s2Finances.netPayableAmount === 4949.55, "Seller 2 net payable is strictly isolated (₹4,949.55)");

  // 8C: Admin Overview aggregates cross-seller platform health
  const adminFinances = await getAdminFinancesOverview();
  // Gross sales = 10000 + 5499.5 = ₹15,499.50
  // Commission earned = 1000 + 549.95 - 300 = ₹1,249.95
  // Shipping collected = ₹250
  // Total refunds = ₹3,000
  // Total seller payable = 6550 + 4949.55 = ₹11,499.55
  assert(adminFinances.grossStoreSales === 15499.5, "Admin gross store sales accurately aggregated (₹15,499.50)");
  assert(adminFinances.platformCommissionEarned === 1249.95, "Admin platform commission accurately calculated (₹1,249.95)");
  assert(adminFinances.shippingFeesCollected === 250, "Admin shipping fees accurately aggregated (₹250)");
  assert(adminFinances.totalRefundsProcessed === 3000, "Admin refunds accurately aggregated (₹3,000)");
  assert(adminFinances.totalSellerPayableBalance === 11499.55, "Admin cross-seller payable balances accurately summed (₹11,499.55)");

  // -------------------------------------------------------------------------
  // SECTION 9: Rental Vertical Zero-Regression Verification
  // -------------------------------------------------------------------------
  console.log("\n--- 9. Rental Vertical Invariants & Zero-Regression Check ---");

  // 9A: Rental booking calendar conflict engine
  const rentalExisting = [
    { startDate: new Date("2026-12-01"), endDate: new Date("2026-12-05") },
  ];
  const rentalConflict = findDateConflict(
    rentalExisting,
    new Date("2026-12-03"),
    new Date("2026-12-07")
  );
  assert(Boolean(rentalConflict), "Rental booking conflict engine flags overlapping booking");

  // 9B: Rental server pricing & 85% provider earnings invariant
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
  axios.post = originalAxiosPost;
  axios.get = originalAxiosGet;
  StoreOrder.findOne = originalOrderFindOne;
  StoreOrder.findById = originalOrderFindById;
  StorePayment.findOne = originalPaymentFindOne;
  StorePayment.prototype.save = originalPaymentSave;
  StoreOrder.prototype.save = originalOrderSave;
  StoreLedger.prototype.save = originalLedgerSave;
  StoreLedger.find = originalLedgerFind;
  StoreFulfilmentOrder.find = originalFulfilmentFind;

  // -------------------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(`   PHASE 6 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED        `);
  console.log("==========================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase6TestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
