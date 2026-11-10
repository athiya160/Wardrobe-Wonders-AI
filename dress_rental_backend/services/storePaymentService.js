import { randomUUID, createHash } from "crypto";
import axios from "axios";
import { config } from "../config/phonepeConfig.js";
import StoreOrder from "../models/StoreOrderModel.js";
import StoreFulfilmentOrder from "../models/StoreFulfilmentOrderModel.js";
import StorePayment from "../models/StorePaymentModel.js";
import StoreLedger from "../models/StoreLedgerModel.js";
import StoreRefund from "../models/StoreRefundModel.js";

/**
 * Dynamic environment check for mock payment isolation.
 * Strictly forbidden when NODE_ENV === 'production'.
 */
export const isMockAllowed = () =>
  process.env.NODE_ENV !== "production" && process.env.ENABLE_MOCK_PAYMENTS === "true";

/**
 * Retrieve configured Store marketplace commission percentage.
 * Strictly separate from Rental's 85% provider payout invariant.
 */
export const getStoreCommissionPercent = () => {
  const envVal = Number(process.env.STORE_COMMISSION_PERCENT);
  if (!isNaN(envVal) && envVal >= 0 && envVal <= 100) {
    return envVal;
  }
  return 10; // Default 10% platform commission for Store products
};

/**
 * Calculate precise financial breakdown for a seller fulfilment order using integer paise arithmetic.
 * Ensures zero floating-point drift.
 * Shipping fee is passed through 100% to seller (0% commission).
 */
export const calculateSellerFinancialBreakdown = (
  fulfilmentOrder,
  commissionPercent = getStoreCommissionPercent()
) => {
  const subtotalPaise = Math.round(Number(fulfilmentOrder.subtotal || 0) * 100);
  const shippingPaise = Math.round(Number(fulfilmentOrder.shippingFee || 0) * 100);

  const rate = Number(commissionPercent) / 100;
  const commissionPaise = Math.round(subtotalPaise * rate);
  const sellerPayablePaise = subtotalPaise - commissionPaise + shippingPaise;

  return {
    subtotal: subtotalPaise / 100,
    subtotalPaise,
    commissionPercent,
    commission: commissionPaise / 100,
    commissionPaise,
    shippingFee: shippingPaise / 100,
    shippingPaise,
    sellerPayable: sellerPayablePaise / 100,
    sellerPayablePaise,
  };
};

/**
 * Generate immutable ledger entries for confirmed seller fulfilment order.
 * Strictly immutable audit records.
 */
export const createFulfilmentLedgerEntries = async (storeOrder, fulfilmentOrder) => {
  // Guard against duplicate ledger entries for the same fulfilment order
  const existingEntries = await StoreLedger.find({
    fulfilmentOrderId: fulfilmentOrder._id,
    type: { $in: ["SALE", "COMMISSION", "SHIPPING"] },
  });
  if (existingEntries.length > 0) {
    return existingEntries;
  }

  const breakdown = calculateSellerFinancialBreakdown(fulfilmentOrder);
  const now = new Date();
  const createdEntries = [];

  // 1. SALE entry: Credit gross merchandise sales to seller ledger
  const saleEntry = new StoreLedger({
    entryId: `SLED-SALE-${Date.now()}-${randomUUID()}`,
    storeOrderId: storeOrder._id,
    parentOrderNumber: storeOrder.orderNumber,
    fulfilmentOrderId: fulfilmentOrder._id,
    fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
    sellerId: fulfilmentOrder.sellerId,
    storeId: fulfilmentOrder.storeId,
    type: "SALE",
    direction: "CREDIT",
    amount: breakdown.subtotal,
    amountInPaise: breakdown.subtotalPaise,
    currency: fulfilmentOrder.currency || "INR",
    netSellerImpact: breakdown.subtotal,
    description: `Gross item sales credit for ${fulfilmentOrder.fulfilmentOrderNumber}`,
    metadata: {
      itemCount: fulfilmentOrder.items?.length || 0,
      parentOrderNumber: storeOrder.orderNumber,
    },
    createdAt: now,
  });
  await saleEntry.save();
  createdEntries.push(saleEntry);

  // 2. COMMISSION entry: Debit platform commission from seller ledger
  if (breakdown.commissionPaise > 0) {
    const commissionEntry = new StoreLedger({
      entryId: `SLED-COMM-${Date.now()}-${randomUUID()}`,
      storeOrderId: storeOrder._id,
      parentOrderNumber: storeOrder.orderNumber,
      fulfilmentOrderId: fulfilmentOrder._id,
      fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
      sellerId: fulfilmentOrder.sellerId,
      storeId: fulfilmentOrder.storeId,
      type: "COMMISSION",
      direction: "DEBIT",
      amount: breakdown.commission,
      amountInPaise: breakdown.commissionPaise,
      currency: fulfilmentOrder.currency || "INR",
      netSellerImpact: -breakdown.commission,
      description: `Marketplace platform commission (${breakdown.commissionPercent}%) for ${fulfilmentOrder.fulfilmentOrderNumber}`,
      metadata: {
        commissionPercent: breakdown.commissionPercent,
        parentOrderNumber: storeOrder.orderNumber,
      },
      createdAt: now,
    });
    await commissionEntry.save();
    createdEntries.push(commissionEntry);
  }

  // 3. SHIPPING entry: Credit shipping reimbursement to seller ledger (if any)
  if (breakdown.shippingPaise > 0) {
    const shippingEntry = new StoreLedger({
      entryId: `SLED-SHIP-${Date.now()}-${randomUUID()}`,
      storeOrderId: storeOrder._id,
      parentOrderNumber: storeOrder.orderNumber,
      fulfilmentOrderId: fulfilmentOrder._id,
      fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
      sellerId: fulfilmentOrder.sellerId,
      storeId: fulfilmentOrder.storeId,
      type: "SHIPPING",
      direction: "CREDIT",
      amount: breakdown.shippingFee,
      amountInPaise: breakdown.shippingPaise,
      currency: fulfilmentOrder.currency || "INR",
      netSellerImpact: breakdown.shippingFee,
      description: `Shipping reimbursement credit for ${fulfilmentOrder.fulfilmentOrderNumber}`,
      metadata: {
        parentOrderNumber: storeOrder.orderNumber,
      },
      createdAt: now,
    });
    await shippingEntry.save();
    createdEntries.push(shippingEntry);
  }

  return createdEntries;
};

/**
 * Initiate Store payment via PhonePe Sandbox.
 * Calculates amount strictly from backend StoreOrder.
 */
export const initiateStorePayment = async ({
  orderId,
  orderNumber,
  customerId,
  customerEmail,
  idempotencyKey = null,
  simulateMock = false,
}) => {
  const query = orderId ? { _id: orderId } : { orderNumber };
  const order = await StoreOrder.findOne(query);

  if (!order) {
    const err = new Error("Store order not found.");
    err.statusCode = 404;
    throw err;
  }

  // Multi-tenant authorization guard
  if (order.customerId.toString() !== customerId.toString()) {
    const err = new Error("Forbidden: You do not own this order.");
    err.statusCode = 403;
    throw err;
  }

  // State guard: Cannot initiate payment for already confirmed or paid orders
  if (order.paymentStatus === "PAID" || order.status === "PROCESSING" || order.status === "COMPLETED") {
    const err = new Error("This order has already been paid and confirmed.");
    err.statusCode = 400;
    throw err;
  }

  if (order.status === "CANCELLED" || order.status === "FAILED") {
    const err = new Error(`Cannot initiate payment for a ${order.status.toLowerCase()} order.`);
    err.statusCode = 400;
    throw err;
  }

  // Idempotency check: If an existing transaction for this idempotencyKey is already pending/initiated
  if (idempotencyKey) {
    const existingKeyPayment = await StorePayment.findOne({
      idempotencyKey,
      parentOrderId: order._id,
    });
    if (existingKeyPayment && ["INITIATED", "PENDING", "SUCCESS"].includes(existingKeyPayment.status)) {
      return {
        payment: existingKeyPayment,
        isIdempotent: true,
        redirectUrl: existingKeyPayment.metadata?.redirectUrl || null,
      };
    }
  }

  // Server-side calculated amount (never trust client amounts)
  const amount = Number(order.grandTotal);
  const amountInPaise = Math.round(amount * 100);

  if (amountInPaise <= 0) {
    const err = new Error("Order total must be greater than zero.");
    err.statusCode = 400;
    throw err;
  }

  const internalPaymentId = `SPAY-${Date.now()}-${randomUUID()}`;
  const merchantTransactionId = `STXN-${Date.now()}-${randomUUID()}`;

  const payment = new StorePayment({
    parentOrderId: order._id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    paymentProvider: "PHONEPE",
    internalPaymentId,
    merchantTransactionId,
    amount,
    amountInPaise,
    currency: order.currency || "INR",
    status: "INITIATED",
    idempotencyKey: idempotencyKey || null,
    initiatedAt: new Date(),
  });

  await payment.save();

  // Construct PhonePe V1 payload
  const frontendBase = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
  const backendBase = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");

  const redirectUrl = `${frontendBase}/store/order-success?orderId=${order._id}&orderNumber=${order.orderNumber}&txnId=${merchantTransactionId}`;
  const callbackUrl = `${backendBase}/store/payment/callback`;

  const payload = {
    merchantId: config.MID,
    merchantTransactionId,
    amount: amountInPaise,
    merchantUserId: customerId.toString(),
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    mobileNumber: order.customerPhone || "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const endpoint = config.PAYMENT_ENDPOINT; // "pg/v1/pay"
  const salt = config.KEY;
  const index = config.INDEX;

  const checksum = createHash("sha256")
    .update(`${base64Payload}/${endpoint}${salt}`)
    .digest("hex");
  const xVerify = `${checksum}###${index}`;

  const hostUrl = `${config.BASE_URL}/${endpoint}`;

  try {
    const response = await axios.post(
      hostUrl,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Verify": xVerify,
        },
        timeout: 10000,
      }
    );

    const resData = response.data;
    const gatewayRedirectUrl = resData?.data?.instrumentResponse?.redirectInfo?.url || redirectUrl;

    payment.status = "PENDING";
    payment.metadata = {
      redirectUrl: gatewayRedirectUrl,
      phonepeResponseCode: resData?.code,
    };
    await payment.save();

    return {
      payment,
      redirectUrl: gatewayRedirectUrl,
      data: resData?.data || {},
    };
  } catch (gatewayError) {
    // Isolated non-production mock simulation
    if (isMockAllowed() && (simulateMock === true || process.env.USE_MOCK_GATEWAY === "true")) {
      payment.status = "PENDING";
      payment.metadata = {
        mock: true,
        redirectUrl: `${redirectUrl}&mock=true`,
      };
      await payment.save();

      return {
        payment,
        mock: true,
        redirectUrl: `${redirectUrl}&mock=true`,
      };
    }

    payment.status = "FAILED";
    payment.failureReason = gatewayError.message || "Gateway initiation error";
    await payment.save();

    const err = new Error("Unable to establish PhonePe sandbox session. Please try again.");
    err.statusCode = 502;
    err.details = gatewayError.message;
    throw err;
  }
};

/**
 * Verify Store payment status and finalize order + seller fulfillment permissions.
 * Concurrency-safe, idempotent, strict server amount validation.
 */
export const verifyStorePayment = async ({
  merchantTransactionId,
  customerId = null,
  isAdmin = false,
  simulateMock = false,
}) => {
  const payment = await StorePayment.findOne({ merchantTransactionId });
  if (!payment) {
    const err = new Error("Store payment transaction not found.");
    err.statusCode = 404;
    throw err;
  }

  // Authorization check: customer ownership or admin role
  if (!isAdmin && customerId && payment.customerId.toString() !== customerId.toString()) {
    const err = new Error("Forbidden: You do not own this payment transaction.");
    err.statusCode = 403;
    throw err;
  }

  const order = await StoreOrder.findById(payment.parentOrderId);
  if (!order) {
    const err = new Error("Associated Store order not found.");
    err.statusCode = 404;
    throw err;
  }

  // IDEMPOTENCY GUARD: If payment was already confirmed successful
  if (payment.status === "SUCCESS") {
    return {
      success: true,
      code: "PAYMENT_SUCCESS",
      idempotent: true,
      message: "Payment already confirmed (idempotent).",
      payment,
      order,
    };
  }

  let gatewaySuccess = false;
  let gatewayAmountPaise = 0;
  let providerRef = null;

  const isMock =
    isMockAllowed() &&
    (simulateMock === true ||
      merchantTransactionId.startsWith("mock_") ||
      payment.metadata?.mock === true);

  if (isMock) {
    gatewaySuccess = true;
    gatewayAmountPaise = payment.amountInPaise;
    providerRef = `MOCK-TXN-${Date.now()}`;
  } else {
    // PhonePe V1 status verification API call
    const salt = config.KEY;
    const index = config.INDEX;
    const statusPath = `/pg/v1/status/${config.MID}/${merchantTransactionId}`;
    const hostUrl = `${config.BASE_URL}${statusPath}`;

    const checksum = createHash("sha256")
      .update(`${statusPath}${salt}`)
      .digest("hex");
    const xVerify = `${checksum}###${index}`;

    try {
      const response = await axios.get(hostUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-Verify": xVerify,
          "X-MERCHANT-ID": config.MID,
        },
        timeout: 10000,
      });

      const resData = response.data;
      if (resData && resData.code === "PAYMENT_SUCCESS") {
        gatewaySuccess = true;
        gatewayAmountPaise = Number(resData.data?.amount) || payment.amountInPaise;
        providerRef = resData.data?.transactionId || resData.data?.providerReferenceId || null;
      } else {
        payment.status = "FAILED";
        payment.failureReason = resData?.message || "Payment declined by gateway.";
        await payment.save();

        order.paymentStatus = "FAILED";
        await order.save();

        return {
          success: false,
          code: resData?.code || "PAYMENT_FAILED",
          message: resData?.message || "Payment verification failed.",
          payment,
          order,
        };
      }
    } catch (gwErr) {
      if (gwErr.code === "ECONNABORTED" || gwErr.message?.includes("timeout")) {
        const err = new Error("Payment gateway timed out. Please retry verification shortly.");
        err.statusCode = 504;
        err.retryable = true;
        throw err;
      }
      const err = new Error("Gateway verification failed or transaction declined.");
      err.statusCode = 502;
      throw err;
    }
  }

  // PRICING MANIPULATION CHECK: Verify gateway amount against server order amount
  if (gatewayAmountPaise !== payment.amountInPaise) {
    console.error(
      `[SECURITY ALERT] Store payment mismatch: Gateway received ${gatewayAmountPaise} paise, expected ${payment.amountInPaise} paise.`
    );
    payment.status = "FAILED";
    payment.failureReason = `Amount mismatch: Received ${gatewayAmountPaise} paise, expected ${payment.amountInPaise} paise.`;
    await payment.save();

    order.paymentStatus = "FAILED";
    await order.save();

    const err = new Error("Payment amount mismatch. Order flagged and rejected.");
    err.statusCode = 400;
    throw err;
  }

  // FINALIZE PAYMENT & MOVE ORDER LIFECYCLE FORWARD
  if (gatewaySuccess) {
    const now = new Date();
    payment.status = "SUCCESS";
    payment.providerReferenceId = providerRef;
    payment.confirmedAt = now;
    payment.metadata = {
      ...(payment.metadata || {}),
      verifiedAt: now,
      providerRef,
    };
    await payment.save();

    // Confirm Parent Store Order
    order.paymentStatus = "PAID";
    order.status = "PROCESSING";
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: "PROCESSING",
      changedAt: now,
      role: "system",
      note: "PhonePe payment confirmed. Order moved to processing for boutique fulfilment.",
    });
    await order.save();

    // Activate Child Seller Fulfilment Orders (Move to ORDER_PLACED)
    const fulfilmentOrders = await StoreFulfilmentOrder.find({ parentOrderId: order._id });
    for (const fo of fulfilmentOrders) {
      if (fo.status === "PENDING_PAYMENT") {
        fo.status = "ORDER_PLACED";
        if (!Array.isArray(fo.statusHistory)) {
          fo.statusHistory = [];
        }
        fo.statusHistory.push({
          status: "ORDER_PLACED",
          changedAt: now,
          role: "system",
          note: "Customer payment confirmed. Order placed with boutique.",
        });
        await fo.save();
      }
      // Create immutable financial ledger entries for each seller
      await createFulfilmentLedgerEntries(order, fo);
    }

    return {
      success: true,
      code: "PAYMENT_SUCCESS",
      message: "Store payment confirmed and seller fulfillment orders placed.",
      payment,
      order,
    };
  }

  return {
    success: false,
    code: "PAYMENT_NOT_VERIFIED",
    message: "Payment could not be verified.",
  };
};

/**
 * Handle PhonePe server-to-server webhook callback for Store orders.
 * Verifies SHA-256 signature, validates order reference, ensures idempotency,
 * and prevents out-of-order callback overwrites.
 */
export const processStoreWebhook = async ({ rawVerify, base64Response, isMock = false }) => {
  if (!base64Response) {
    const err = new Error("Missing webhook response payload.");
    err.statusCode = 400;
    throw err;
  }

  // Verify SHA-256 Checksum Signature: SHA256(base64Response + salt) + ### + index
  const salt = config.KEY;
  const index = config.INDEX;
  const expectedChecksum = createHash("sha256")
    .update(`${base64Response}${salt}`)
    .digest("hex");
  const expectedXVerify = `${expectedChecksum}###${index}`;

  const isMockSignature = isMockAllowed() && (isMock || rawVerify === "mock_signature");

  if (rawVerify !== expectedXVerify && !isMockSignature) {
    console.error("[SECURITY ALERT] Invalid webhook signature detected on PhonePe Store callback.");
    const err = new Error("Invalid webhook signature.");
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    const decodedStr = Buffer.from(base64Response, "base64").toString("utf-8");
    decoded = JSON.parse(decodedStr);
  } catch (parseErr) {
    const err = new Error("Malformed webhook JSON payload.");
    err.statusCode = 400;
    throw err;
  }

  const { code, data } = decoded;
  const merchantTxnId = data?.merchantTransactionId;
  const gatewayAmountPaise = Number(data?.amount) || 0;
  const providerRef = data?.transactionId || data?.providerReferenceId || null;

  if (!merchantTxnId) {
    const err = new Error("Missing merchantTransactionId in webhook payload.");
    err.statusCode = 400;
    throw err;
  }

  const payment = await StorePayment.findOne({ merchantTransactionId: merchantTxnId });
  if (!payment) {
    const err = new Error("Store payment transaction not found for webhook.");
    err.statusCode = 404;
    throw err;
  }

  // IDEMPOTENCY GUARD: Do not re-process already confirmed successful payments
  if (payment.status === "SUCCESS") {
    return {
      success: true,
      code: "ALREADY_CONFIRMED",
      message: "Webhook processed (idempotent duplicate).",
      payment,
    };
  }

  if (code === "PAYMENT_SUCCESS") {
    // Verify amount
    if (gatewayAmountPaise !== payment.amountInPaise) {
      console.error(
        `[SECURITY ALERT] Webhook amount mismatch for ${merchantTxnId}: received ${gatewayAmountPaise}, expected ${payment.amountInPaise}`
      );
      payment.status = "FAILED";
      payment.failureReason = `Webhook amount mismatch: Received ${gatewayAmountPaise} paise vs ${payment.amountInPaise} expected.`;
      await payment.save();
      return { success: false, code: "AMOUNT_MISMATCH", message: "Payment amount mismatch." };
    }

    const now = new Date();
    payment.status = "SUCCESS";
    payment.providerReferenceId = providerRef;
    payment.confirmedAt = now;
    payment.metadata = {
      ...(payment.metadata || {}),
      webhookProcessedAt: now,
      providerRef,
    };
    await payment.save();

    const order = await StoreOrder.findById(payment.parentOrderId);
    if (order) {
      order.paymentStatus = "PAID";
      order.status = "PROCESSING";
      if (!Array.isArray(order.statusHistory)) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status: "PROCESSING",
        changedAt: now,
        role: "system",
        note: "PhonePe webhook confirmed payment. Order moved to processing for boutique fulfilment.",
      });
      await order.save();

      const fulfilmentOrders = await StoreFulfilmentOrder.find({ parentOrderId: order._id });
      for (const fo of fulfilmentOrders) {
        if (fo.status === "PENDING_PAYMENT") {
          fo.status = "ORDER_PLACED";
          if (!Array.isArray(fo.statusHistory)) {
            fo.statusHistory = [];
          }
          fo.statusHistory.push({
            status: "ORDER_PLACED",
            changedAt: now,
            role: "system",
            note: "Customer payment confirmed via webhook. Order placed with boutique.",
          });
          await fo.save();
        }
        await createFulfilmentLedgerEntries(order, fo);
      }
    }

    return {
      success: true,
      code: "PAYMENT_SUCCESS",
      message: "Webhook processed: payment confirmed and orders activated.",
      payment,
    };
  } else {
    // OUT-OF-ORDER GUARD: Never let a failed/pending webhook overwrite an already confirmed payment!
    if (payment.status !== "SUCCESS") {
      payment.status = "FAILED";
      payment.failureReason = decoded.message || "Payment declined per webhook.";
      await payment.save();

      const order = await StoreOrder.findById(payment.parentOrderId);
      if (order && order.paymentStatus === "PENDING") {
        order.paymentStatus = "FAILED";
        await order.save();
      }
    }

    return {
      success: true,
      code: "PAYMENT_FAILED",
      message: "Webhook processed: payment marked failed.",
    };
  }
};

/**
 * Admin-authorized refund initiation with compensating ledger entries.
 * Idempotency protection, refund amount validation, and provider execution tracking.
 */
export const initiateStoreRefund = async ({
  parentOrderId,
  fulfilmentOrderId = null,
  amount,
  reason,
  adminUser,
  idempotencyKey = null,
}) => {
  if (!amount || Number(amount) <= 0) {
    const err = new Error("Refund amount must be greater than zero.");
    err.statusCode = 400;
    throw err;
  }

  if (!reason || !String(reason).trim()) {
    const err = new Error("Refund reason is required.");
    err.statusCode = 400;
    throw err;
  }

  const order = await StoreOrder.findById(parentOrderId);
  if (!order) {
    const err = new Error("Store order not found.");
    err.statusCode = 404;
    throw err;
  }

  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_REFUNDED") {
    const err = new Error("Cannot issue refund: Order has not been successfully paid.");
    err.statusCode = 400;
    throw err;
  }

  const payment = await StorePayment.findOne({
    parentOrderId: order._id,
    status: "SUCCESS",
  });
  if (!payment) {
    const err = new Error("No successful payment record found for this order.");
    err.statusCode = 404;
    throw err;
  }

  // Idempotency check: Repeated refund submission with same key
  if (idempotencyKey) {
    const existingRefund = await StoreRefund.findOne({ idempotencyKey });
    if (existingRefund) {
      return {
        refund: existingRefund,
        isIdempotent: true,
        message: "Refund already recorded for this idempotency key.",
      };
    }
  }

  // Validate refund amount against original payment minus previous refunds
  const existingRefunds = await StoreRefund.find({
    parentOrderId: order._id,
    status: { $in: ["REQUESTED", "PENDING_PROVIDER", "SUCCEEDED"] },
  });

  const alreadyRefundedPaise = existingRefunds.reduce((sum, r) => sum + r.amountInPaise, 0);
  const requestedPaise = Math.round(Number(amount) * 100);
  const remainingRefundablePaise = payment.amountInPaise - alreadyRefundedPaise;

  if (requestedPaise > remainingRefundablePaise) {
    const maxRefundable = remainingRefundablePaise / 100;
    const err = new Error(
      `Requested refund of ₹${amount} exceeds maximum remaining refundable balance of ₹${maxRefundable}.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Locate associated fulfilment order if specified or single-seller order
  let fulfilmentOrder = null;
  if (fulfilmentOrderId) {
    fulfilmentOrder = await StoreFulfilmentOrder.findOne({
      _id: fulfilmentOrderId,
      parentOrderId: order._id,
    });
    if (!fulfilmentOrder) {
      const err = new Error("Specified fulfilment order not found under this parent order.");
      err.statusCode = 404;
      throw err;
    }
  } else {
    // Default to first fulfilment order if none specified
    fulfilmentOrder = await StoreFulfilmentOrder.findOne({ parentOrderId: order._id });
  }

  const refundId = `SRFD-${Date.now()}-${randomUUID()}`;
  const now = new Date();
  const compensatingEntryIds = [];

  // Generate compensating ledger entries if associated fulfilment order and seller exist
  if (fulfilmentOrder) {
    const commissionPercent = getStoreCommissionPercent();
    const refundAmount = requestedPaise / 100;

    // 1. REFUND entry: Debit seller ledger for refunded amount
    const refundLedger = new StoreLedger({
      entryId: `SLED-RFND-${Date.now()}-${randomUUID()}`,
      storeOrderId: order._id,
      parentOrderNumber: order.orderNumber,
      fulfilmentOrderId: fulfilmentOrder._id,
      fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
      sellerId: fulfilmentOrder.sellerId,
      storeId: fulfilmentOrder.storeId,
      type: "REFUND",
      direction: "DEBIT",
      amount: refundAmount,
      amountInPaise: requestedPaise,
      currency: order.currency || "INR",
      netSellerImpact: -refundAmount,
      description: `Refund debit reversal (${reason.trim()}) for ${fulfilmentOrder.fulfilmentOrderNumber}`,
      metadata: {
        refundId,
        reason: reason.trim(),
        adminId: adminUser._id,
      },
      createdAt: now,
    });
    await refundLedger.save();
    compensatingEntryIds.push(refundLedger._id);

    // 2. COMMISSION_REVERSAL entry: Credit marketplace commission back to seller for refunded portion
    const commissionRate = commissionPercent / 100;
    const commReversalPaise = Math.round(requestedPaise * commissionRate);
    const commReversalAmount = commReversalPaise / 100;

    if (commReversalPaise > 0) {
      const commReversalLedger = new StoreLedger({
        entryId: `SLED-CREV-${Date.now()}-${randomUUID()}`,
        storeOrderId: order._id,
        parentOrderNumber: order.orderNumber,
        fulfilmentOrderId: fulfilmentOrder._id,
        fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
        sellerId: fulfilmentOrder.sellerId,
        storeId: fulfilmentOrder.storeId,
        type: "COMMISSION_REVERSAL",
        direction: "CREDIT",
        amount: commReversalAmount,
        amountInPaise: commReversalPaise,
        currency: order.currency || "INR",
        netSellerImpact: commReversalAmount,
        description: `Marketplace platform commission reversal (${commissionPercent}%) on refund for ${fulfilmentOrder.fulfilmentOrderNumber}`,
        metadata: {
          refundId,
          commissionPercent,
        },
        createdAt: now,
      });
      await commReversalLedger.save();
      compensatingEntryIds.push(commReversalLedger._id);
    }
  }

  // Create StoreRefund record
  // Safe sandbox notice: In test mode without live banking refund API, refund is safely tracked as REQUESTED
  const refund = new StoreRefund({
    refundId,
    parentOrderId: order._id,
    parentOrderNumber: order.orderNumber,
    fulfilmentOrderId: fulfilmentOrder ? fulfilmentOrder._id : null,
    fulfilmentOrderNumber: fulfilmentOrder ? fulfilmentOrder.fulfilmentOrderNumber : "",
    paymentId: payment._id,
    sellerId: fulfilmentOrder ? fulfilmentOrder.sellerId : null,
    storeId: fulfilmentOrder ? fulfilmentOrder.storeId : null,
    requestedBy: adminUser._id,
    amount: requestedPaise / 100,
    amountInPaise: requestedPaise,
    currency: order.currency || "INR",
    reason: reason.trim(),
    status: "REQUESTED",
    idempotencyKey: idempotencyKey || null,
    compensatingLedgerEntryIds: compensatingEntryIds,
    notes: `Admin-initiated refund. Sandbox provider execution pending. Reason: ${reason.trim()}`,
    processedAt: now,
  });

  await refund.save();

  // Update order payment status
  const totalRefundedPaise = alreadyRefundedPaise + requestedPaise;
  if (totalRefundedPaise >= payment.amountInPaise) {
    order.paymentStatus = "REFUNDED";
    order.status = "CANCELLED";
  } else {
    order.paymentStatus = "PARTIALLY_REFUNDED";
  }
  await order.save();

  return {
    success: true,
    message: "Refund initiated and compensating ledger entries recorded.",
    refund,
    order,
  };
};

/**
 * Financial Aggregations for Admin.
 * Cross-seller metrics, payment status distributions, commission totals.
 */
export const getAdminFinancesOverview = async () => {
  const [payments, ledgerEntries, refunds] = await Promise.all([
    StorePayment.find().lean(),
    StoreLedger.find().lean(),
    StoreRefund.find().lean(),
  ]);

  let grossSalesPaise = 0;
  let platformCommissionPaise = 0;
  let shippingCollectedPaise = 0;
  let totalRefundsPaise = 0;
  let netSellerPayablePaise = 0;

  const paymentCounts = {
    SUCCESS: 0,
    PENDING: 0,
    FAILED: 0,
    CANCELLED: 0,
    REFUNDED: 0,
    PARTIALLY_REFUNDED: 0,
    INITIATED: 0,
  };

  for (const p of payments) {
    if (paymentCounts[p.status] !== undefined) {
      paymentCounts[p.status]++;
    }
  }

  for (const entry of ledgerEntries) {
    if (entry.type === "SALE") {
      grossSalesPaise += entry.amountInPaise;
    } else if (entry.type === "COMMISSION") {
      platformCommissionPaise += entry.amountInPaise;
    } else if (entry.type === "SHIPPING") {
      shippingCollectedPaise += entry.amountInPaise;
    } else if (entry.type === "COMMISSION_REVERSAL") {
      platformCommissionPaise -= entry.amountInPaise;
    }

    netSellerPayablePaise += Math.round(entry.netSellerImpact * 100);
  }

  for (const r of refunds) {
    if (r.status === "SUCCEEDED" || r.status === "REQUESTED") {
      totalRefundsPaise += r.amountInPaise;
    }
  }

  return {
    grossStoreSales: grossSalesPaise / 100,
    netSales: (grossSalesPaise - totalRefundsPaise) / 100,
    platformCommissionEarned: Math.max(0, platformCommissionPaise / 100),
    shippingFeesCollected: shippingCollectedPaise / 100,
    totalRefundsProcessed: totalRefundsPaise / 100,
    totalSellerPayableBalance: Math.max(0, netSellerPayablePaise / 100),
    paymentCounts,
    totalLedgerEntriesCount: ledgerEntries.length,
    disclaimer:
      "All seller payable figures represent internal ledger balances, not automated bank transfers. Live bank settlement is disabled.",
  };
};

/**
 * Financial Aggregations for Seller.
 * Strictly isolated to sellerId. Never exposes another seller's figures.
 */
export const getSellerFinancesOverview = async (sellerId) => {
  const ledgerEntries = await StoreLedger.find({ sellerId }).sort({ createdAt: -1 }).lean();

  let grossItemSalesPaise = 0;
  let commissionDeductionsPaise = 0;
  let shippingReimbursementsPaise = 0;
  let refundAdjustmentsPaise = 0;
  let commissionReversalsPaise = 0;
  let netPayablePaise = 0;

  for (const entry of ledgerEntries) {
    if (entry.type === "SALE") {
      grossItemSalesPaise += entry.amountInPaise;
    } else if (entry.type === "COMMISSION") {
      commissionDeductionsPaise += entry.amountInPaise;
    } else if (entry.type === "SHIPPING") {
      shippingReimbursementsPaise += entry.amountInPaise;
    } else if (entry.type === "REFUND") {
      refundAdjustmentsPaise += entry.amountInPaise;
    } else if (entry.type === "COMMISSION_REVERSAL") {
      commissionReversalsPaise += entry.amountInPaise;
    }

    netPayablePaise += Math.round(entry.netSellerImpact * 100);
  }

  return {
    grossItemSales: grossItemSalesPaise / 100,
    commissionDeductions: commissionDeductionsPaise / 100,
    shippingReimbursements: shippingReimbursementsPaise / 100,
    refundAdjustments: refundAdjustmentsPaise / 100,
    commissionReversals: commissionReversalsPaise / 100,
    netPayableAmount: Math.max(0, netPayablePaise / 100),
    entryCount: ledgerEntries.length,
    disclaimer:
      "Seller payable amounts represent internal ledger balances, not completed bank payouts. Live bank payouts are disabled.",
  };
};
