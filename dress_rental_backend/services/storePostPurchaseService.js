import mongoose from "mongoose";
import StoreOrder from "../models/StoreOrderModel.js";
import StoreFulfilmentOrder from "../models/StoreFulfilmentOrderModel.js";
import StorePayment from "../models/StorePaymentModel.js";
import StoreProduct from "../models/StoreProductModel.js";
import StoreInvoice from "../models/StoreInvoiceModel.js";
import StoreCancellation from "../models/StoreCancellationModel.js";
import StoreReturn from "../models/StoreReturnModel.js";
import StoreReview from "../models/StoreReviewModel.js";
import { createStoreNotification, transitionFulfilmentStatus, deriveParentOrderStatus } from "./storeFulfillmentService.js";
import { initiateStoreRefund } from "./storePaymentService.js";

const DEFAULT_RETURN_WINDOW_DAYS = Number(process.env.STORE_RETURN_WINDOW_DAYS || 7);

/**
 * =========================================================================
 * 1. STORE INVOICE GENERATION & RETRIEVAL
 * =========================================================================
 */
export async function getOrCreateStoreInvoice({ parentOrderId, customerId, isAdmin = false }) {
  if (!parentOrderId) {
    const err = new Error("parentOrderId is required to view or generate an invoice.");
    err.statusCode = 400;
    throw err;
  }

  const order = await StoreOrder.findById(parentOrderId);
  if (!order) {
    const err = new Error("Store order not found.");
    err.statusCode = 404;
    throw err;
  }

  // IDOR Ownership Guard
  if (!isAdmin && order.customerId.toString() !== customerId.toString()) {
    const err = new Error("Access denied. You can only view invoices for your own orders.");
    err.statusCode = 403;
    throw err;
  }

  // Unpaid order invariant
  if (order.paymentStatus !== "PAID") {
    const err = new Error(
      `Cannot generate paid invoice for an unpaid order. Payment status is '${order.paymentStatus}'.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Return existing immutable invoice snapshot if present
  let invoice = await StoreInvoice.findOne({ parentOrderId: order._id });
  if (invoice) {
    return { success: true, invoice, isExisting: true };
  }

  // Retrieve child fulfilment orders and confirmed payment
  const [fulfilmentOrders, payment] = await Promise.all([
    StoreFulfilmentOrder.find({ parentOrderId: order._id }).populate("storeId", "location").lean(),
    StorePayment.findOne({ parentOrderId: order._id, status: "SUCCESS" }).lean(),
  ]);

  const sellerBreakdown = (fulfilmentOrders || []).map((fo) => ({
    fulfilmentOrderId: fo._id,
    fulfilmentOrderNumber: fo.fulfilmentOrderNumber,
    sellerId: fo.sellerId,
    storeId: fo.storeId?._id || fo.storeId,
    storeName: fo.storeName,
    storeSlug: fo.storeSlug,
    originCity: fo.storeId?.location?.city || "Jaipur",
    originState: fo.storeId?.location?.state || "Rajasthan",
    items: (fo.items || []).map((it) => ({
      productId: it.productId,
      title: it.title,
      brand: it.brand || "",
      size: it.size || "",
      color: it.color || "",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
    })),
    subtotal: fo.subtotal,
    shippingFee: fo.shippingFee || 0,
    totalAmount: fo.totalAmount,
  }));

  const invoiceDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const invoiceNumber = `SINV-${invoiceDateStr}-${order.orderNumber}`;

  invoice = new StoreInvoice({
    invoiceNumber,
    parentOrderId: order._id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerEmail: order.customerEmail,
    billingAddress: {
      name: order.shippingAddress.name,
      phone: order.shippingAddress.phone,
      street: order.shippingAddress.street,
      houseNo: order.shippingAddress.houseNo || "",
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      pincode: order.shippingAddress.pincode,
    },
    paymentId: payment?._id || null,
    merchantTransactionId: payment?.merchantTransactionId || "",
    paymentProvider: payment?.paymentProvider || "PHONEPE",
    paymentStatus: "PAID",
    paidAt: payment?.confirmedAt || order.updatedAt,
    sellerBreakdown,
    subtotal: order.subtotal,
    totalShippingFee: order.totalShippingFee,
    grandTotal: order.grandTotal,
    currency: order.currency || "INR",
    invoiceDate: new Date(),
  });

  await invoice.save();

  // In-app notification
  await createStoreNotification({
    recipientId: order.customerId,
    recipientRole: "customer",
    parentOrderId: order._id,
    parentOrderNumber: order.orderNumber,
    type: "INVOICE_GENERATED",
    title: `Tax Invoice Available: #${order.orderNumber}`,
    message: `Your printable official Store purchase invoice ${invoiceNumber} is now ready to download.`,
    metadata: { invoiceNumber, orderNumber: order.orderNumber },
  });

  return { success: true, invoice, isExisting: false };
}

/**
 * =========================================================================
 * 2. STORE ORDER CANCELLATION WORKFLOW
 * =========================================================================
 */
export async function requestStoreCancellation({ parentOrderId, fulfilmentOrderId, customerId, reason }) {
  if (!fulfilmentOrderId) {
    const err = new Error("fulfilmentOrderId is required to request cancellation.");
    err.statusCode = 400;
    throw err;
  }
  if (!reason || !String(reason).trim()) {
    const err = new Error("Cancellation reason is required.");
    err.statusCode = 400;
    throw err;
  }

  const fulfilmentOrder = await StoreFulfilmentOrder.findById(fulfilmentOrderId);
  if (!fulfilmentOrder) {
    const err = new Error("Fulfilment order not found.");
    err.statusCode = 404;
    throw err;
  }

  // IDOR Ownership Guard
  if (fulfilmentOrder.customerId.toString() !== customerId.toString()) {
    const err = new Error("Access denied. You can only request cancellation for your own purchases.");
    err.statusCode = 403;
    throw err;
  }

  // Check state eligibility: Disallow if already shipped, delivered, or cancelled
  const curStatus = fulfilmentOrder.status === "DISPATCHED" ? "SHIPPED" : fulfilmentOrder.status;
  if (["SHIPPED", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED"].includes(curStatus)) {
    const err = new Error(
      `Cannot cancel shipment in '${curStatus}' state. Once dispatched or delivered, ordinary cancellation is closed.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Prevent duplicate active cancellation request
  const existingActive = await StoreCancellation.findOne({
    fulfilmentOrderId: fulfilmentOrder._id,
    status: { $in: ["REQUESTED", "UNDER_REVIEW"] },
  });
  if (existingActive) {
    const err = new Error("An active cancellation request is already under review for this shipment.");
    err.statusCode = 400;
    throw err;
  }

  const parentOrder = await StoreOrder.findById(fulfilmentOrder.parentOrderId);
  const cancellationId = `SCAN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const cancellation = new StoreCancellation({
    cancellationId,
    parentOrderId: fulfilmentOrder.parentOrderId,
    parentOrderNumber: fulfilmentOrder.parentOrderNumber,
    fulfilmentOrderId: fulfilmentOrder._id,
    fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
    customerId: fulfilmentOrder.customerId,
    sellerId: fulfilmentOrder.sellerId,
    storeId: fulfilmentOrder.storeId,
    reason: String(reason).trim(),
    status: "REQUESTED",
    history: [
      {
        status: "REQUESTED",
        changedAt: new Date(),
        changedBy: customerId,
        role: "customer",
        note: `Customer requested cancellation: ${reason.trim()}`,
      },
    ],
  });

  await cancellation.save();

  // Notifications to seller and admin
  await createStoreNotification({
    recipientId: fulfilmentOrder.sellerId,
    recipientRole: "seller",
    parentOrderId: fulfilmentOrder.parentOrderId,
    parentOrderNumber: fulfilmentOrder.parentOrderNumber,
    fulfilmentOrderId: fulfilmentOrder._id,
    fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
    type: "CANCELLATION_REQUESTED",
    title: `Cancellation Request: #${fulfilmentOrder.fulfilmentOrderNumber}`,
    message: `Customer requested cancellation for shipment #${fulfilmentOrder.fulfilmentOrderNumber}. Reason: ${reason.trim()}`,
    metadata: { cancellationId, reason },
  });

  return { success: true, cancellation };
}

export async function reviewStoreCancellation({ cancellationId, adminId, adminName = "Admin", decision, reason }) {
  if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
    const err = new Error("Decision must be either 'APPROVED' or 'REJECTED'.");
    err.statusCode = 400;
    throw err;
  }
  if (!reason || !String(reason).trim()) {
    const err = new Error("Audit reason is required for administrative cancellation review.");
    err.statusCode = 400;
    throw err;
  }

  const cancellationQuery = mongoose.Types.ObjectId.isValid(cancellationId)
    ? { $or: [{ _id: cancellationId }, { cancellationId }] }
    : { cancellationId };
  const cancellation = await StoreCancellation.findOne(cancellationQuery);
  if (!cancellation) {
    const err = new Error("Cancellation request not found.");
    err.statusCode = 404;
    throw err;
  }

  if (cancellation.status !== "REQUESTED" && cancellation.status !== "UNDER_REVIEW") {
    const err = new Error(`Cancellation request is already in '${cancellation.status}' state.`);
    err.statusCode = 400;
    throw err;
  }

  const fulfilmentOrder = await StoreFulfilmentOrder.findById(cancellation.fulfilmentOrderId);
  const parentOrder = await StoreOrder.findById(cancellation.parentOrderId);

  cancellation.adminReview = {
    reviewedBy: adminId,
    reviewedAt: new Date(),
    decision,
    reason: String(reason).trim(),
  };

  if (decision === "APPROVED") {
    cancellation.status = "APPROVED";
    cancellation.history.push({
      status: "APPROVED",
      changedAt: new Date(),
      changedBy: adminId,
      role: "admin",
      note: `Approved by ${adminName}: ${reason.trim()}`,
    });

    // Cancel child fulfilment order safely using core fulfillment transition engine
    if (fulfilmentOrder && fulfilmentOrder.status !== "CANCELLED") {
      await transitionFulfilmentStatus({
        fulfilmentOrderId: fulfilmentOrder._id,
        targetStatus: "CANCELLED",
        actorId: adminId,
        actorRole: "admin",
        actorName: adminName,
        dispatchData: { cancellationReason: `Cancellation request approved: ${reason.trim()}` },
        note: `[Cancellation Approved] ${reason.trim()}`,
        isAdmin: true,
      });
    }

    // Initiate tracked refund record and compensating ledger if parent order was paid
    if (parentOrder && parentOrder.paymentStatus === "PAID") {
      try {
        const refundResult = await initiateStoreRefund({
          parentOrderId: parentOrder._id,
          fulfilmentOrderId: fulfilmentOrder._id,
          amount: fulfilmentOrder.totalAmount,
          reason: `Approved cancellation refund: ${cancellation.cancellationId}`,
          adminUser: { _id: adminId, name: adminName, role: "admin" },
          idempotencyKey: `REFUND-CANCEL-${cancellation.cancellationId}`,
        });
        if (refundResult.refund) {
          cancellation.refundId = refundResult.refund._id;
        }
      } catch (rfErr) {
        console.error("Non-fatal cancellation refund initiation error:", rfErr.message);
      }
    }

    // Notify customer
    await createStoreNotification({
      recipientId: cancellation.customerId,
      recipientRole: "customer",
      parentOrderId: cancellation.parentOrderId,
      parentOrderNumber: cancellation.parentOrderNumber,
      fulfilmentOrderId: cancellation.fulfilmentOrderId,
      fulfilmentOrderNumber: cancellation.fulfilmentOrderNumber,
      type: "CANCELLATION_APPROVED",
      title: `Cancellation Approved: #${cancellation.fulfilmentOrderNumber}`,
      message: `Your cancellation request for shipment #${cancellation.fulfilmentOrderNumber} was approved. A refund of ₹${fulfilmentOrder?.totalAmount} has been registered.`,
      metadata: { cancellationId, reason },
    });
  } else {
    cancellation.status = "REJECTED";
    cancellation.history.push({
      status: "REJECTED",
      changedAt: new Date(),
      changedBy: adminId,
      role: "admin",
      note: `Rejected by ${adminName}: ${reason.trim()}`,
    });

    // Notify customer
    await createStoreNotification({
      recipientId: cancellation.customerId,
      recipientRole: "customer",
      parentOrderId: cancellation.parentOrderId,
      parentOrderNumber: cancellation.parentOrderNumber,
      fulfilmentOrderId: cancellation.fulfilmentOrderId,
      fulfilmentOrderNumber: cancellation.fulfilmentOrderNumber,
      type: "CANCELLATION_REJECTED",
      title: `Cancellation Request Declined: #${cancellation.fulfilmentOrderNumber}`,
      message: `Your cancellation request for shipment #${cancellation.fulfilmentOrderNumber} could not be approved. Reason: ${reason.trim()}`,
      metadata: { cancellationId, reason },
    });
  }

  await cancellation.save();
  return { success: true, cancellation };
}

/**
 * =========================================================================
 * 3. STORE RETURN & REFUND REQUEST WORKFLOW
 * =========================================================================
 */
export async function requestStoreReturn({
  parentOrderId,
  fulfilmentOrderId,
  customerId,
  items = [],
  reason,
  description = "",
  images = [],
}) {
  if (!fulfilmentOrderId) {
    const err = new Error("fulfilmentOrderId is required to request a return.");
    err.statusCode = 400;
    throw err;
  }
  if (!reason || !String(reason).trim()) {
    const err = new Error("Return reason is required.");
    err.statusCode = 400;
    throw err;
  }

  const fulfilmentOrder = await StoreFulfilmentOrder.findById(fulfilmentOrderId);
  if (!fulfilmentOrder) {
    const err = new Error("Fulfilment order not found.");
    err.statusCode = 404;
    throw err;
  }

  // IDOR Ownership Guard
  if (fulfilmentOrder.customerId.toString() !== customerId.toString()) {
    const err = new Error("Access denied. You can only request returns for your own delivered orders.");
    err.statusCode = 403;
    throw err;
  }

  // Prevent duplicate active return request for the same fulfillment order
  const existingActive = await StoreReturn.findOne({
    fulfilmentOrderId: fulfilmentOrder._id,
    status: { $in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "ITEM_RETURNED", "REFUND_PENDING"] },
  });
  if (existingActive) {
    const err = new Error("An active return request is already in progress for this shipment.");
    err.statusCode = 400;
    throw err;
  }

  // Delivery check: Must be delivered
  if (fulfilmentOrder.status !== "DELIVERED") {
    const err = new Error(
      `Return request can only be submitted for delivered orders. Current status is '${fulfilmentOrder.status}'.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Return window check (default 7 days)
  const deliveredDate = fulfilmentOrder.dispatchDetails?.deliveredAt || fulfilmentOrder.deliveredAt;
  if (deliveredDate) {
    const deliveredMs = new Date(deliveredDate).getTime();
    const windowMs = DEFAULT_RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - deliveredMs > windowMs) {
      const err = new Error(
        `Return request window (${DEFAULT_RETURN_WINDOW_DAYS} days) has expired for this delivered shipment.`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Securely resolve return items and unit prices against original purchase order items
  let returnItems = [];
  if (Array.isArray(items) && items.length > 0) {
    returnItems = items.map((clientItem) => {
      const match = (fulfilmentOrder.items || []).find(
        (it) => it.productId?.toString() === (clientItem.productId?._id || clientItem.productId)?.toString()
      );
      const qty = Math.min(Number(clientItem.quantity) || 1, match ? match.quantity : 1);
      const unitPrice = match ? match.unitPrice : 0;
      return {
        productId: match ? match.productId : clientItem.productId,
        title: match ? match.title : "Returned Item",
        quantity: qty,
        unitPrice,
        totalPrice: unitPrice * qty,
        reason: String(clientItem.reason || reason || "").trim(),
      };
    });
  } else {
    returnItems = (fulfilmentOrder.items || []).map((it) => ({
      productId: it.productId,
      title: it.title,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      reason: String(reason).trim(),
    }));
  }

  // Calculate requested refund amount strictly based on verified item subtotal
  const requestedRefundAmount = returnItems.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0);
  const requestedRefundAmountInPaise = Math.round(requestedRefundAmount * 100);

  const returnId = `SRTN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const returnRequest = new StoreReturn({
    returnId,
    parentOrderId: fulfilmentOrder.parentOrderId,
    parentOrderNumber: fulfilmentOrder.parentOrderNumber,
    fulfilmentOrderId: fulfilmentOrder._id,
    fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
    customerId: fulfilmentOrder.customerId,
    sellerId: fulfilmentOrder.sellerId,
    storeId: fulfilmentOrder.storeId,
    items: returnItems,
    reason: String(reason).trim(),
    description: String(description || "").trim(),
    images: Array.isArray(images) ? images : [],
    status: "REQUESTED",
    requestedRefundAmount,
    requestedRefundAmountInPaise,
    history: [
      {
        status: "REQUESTED",
        changedAt: new Date(),
        changedBy: customerId,
        role: "customer",
        note: `Customer requested return: ${reason.trim()}`,
      },
    ],
  });

  await returnRequest.save();

  // Update fulfillment order state
  fulfilmentOrder.status = "RETURN_REQUESTED";
  if (!Array.isArray(fulfilmentOrder.statusHistory)) {
    fulfilmentOrder.statusHistory = [];
  }
  fulfilmentOrder.statusHistory.push({
    status: "RETURN_REQUESTED",
    changedAt: new Date(),
    changedBy: customerId,
    role: "customer",
    note: `Return request ${returnId} submitted by customer.`,
  });
  await fulfilmentOrder.save();

  // In-app notifications
  await createStoreNotification({
    recipientId: fulfilmentOrder.sellerId,
    recipientRole: "seller",
    parentOrderId: fulfilmentOrder.parentOrderId,
    parentOrderNumber: fulfilmentOrder.parentOrderNumber,
    fulfilmentOrderId: fulfilmentOrder._id,
    fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
    type: "RETURN_REQUESTED",
    title: `Return Requested: #${fulfilmentOrder.fulfilmentOrderNumber}`,
    message: `Customer requested a return for shipment #${fulfilmentOrder.fulfilmentOrderNumber}. Reason: ${reason.trim()}`,
    metadata: { returnId, requestedRefundAmount },
  });

  return { success: true, returnRequest };
}

export async function reviewStoreReturn({ returnId, adminId, adminName = "Admin", decision, reason }) {
  if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
    const err = new Error("Decision must be either 'APPROVED' or 'REJECTED'.");
    err.statusCode = 400;
    throw err;
  }
  if (!reason || !String(reason).trim()) {
    const err = new Error("Audit reason is required for return review.");
    err.statusCode = 400;
    throw err;
  }

  const returnQuery = mongoose.Types.ObjectId.isValid(returnId)
    ? { $or: [{ _id: returnId }, { returnId }] }
    : { returnId };
  const returnRequest = await StoreReturn.findOne(returnQuery);
  if (!returnRequest) {
    const err = new Error("Return request not found.");
    err.statusCode = 404;
    throw err;
  }

  if (returnRequest.status !== "REQUESTED" && returnRequest.status !== "UNDER_REVIEW") {
    const err = new Error(`Return request is already in '${returnRequest.status}' state.`);
    err.statusCode = 400;
    throw err;
  }

  const fulfilmentOrder = await StoreFulfilmentOrder.findById(returnRequest.fulfilmentOrderId);

  returnRequest.adminDecision = {
    decision,
    decidedBy: adminId,
    decidedAt: new Date(),
    reason: String(reason).trim(),
  };

  if (decision === "APPROVED") {
    returnRequest.status = "APPROVED";
    returnRequest.history.push({
      status: "APPROVED",
      changedAt: new Date(),
      changedBy: adminId,
      role: "admin",
      note: `Return approved by ${adminName}. Awaiting return package delivery. Note: ${reason.trim()}`,
    });

    await createStoreNotification({
      recipientId: returnRequest.customerId,
      recipientRole: "customer",
      parentOrderId: returnRequest.parentOrderId,
      parentOrderNumber: returnRequest.parentOrderNumber,
      fulfilmentOrderId: returnRequest.fulfilmentOrderId,
      fulfilmentOrderNumber: returnRequest.fulfilmentOrderNumber,
      type: "RETURN_APPROVED",
      title: `Return Request Approved: #${returnRequest.fulfilmentOrderNumber}`,
      message: `Your return request was approved. Please pack the item securely for reverse courier collection.`,
      metadata: { returnId },
    });
  } else {
    returnRequest.status = "REJECTED";
    returnRequest.history.push({
      status: "REJECTED",
      changedAt: new Date(),
      changedBy: adminId,
      role: "admin",
      note: `Return rejected by ${adminName}: ${reason.trim()}`,
    });

    // Revert fulfilment order status back to DELIVERED
    if (fulfilmentOrder && fulfilmentOrder.status === "RETURN_REQUESTED") {
      fulfilmentOrder.status = "DELIVERED";
      fulfilmentOrder.statusHistory.push({
        status: "DELIVERED",
        changedAt: new Date(),
        changedBy: adminId,
        role: "admin",
        note: `Return request ${returnId} was rejected by admin. Reverted to DELIVERED.`,
      });
      await fulfilmentOrder.save();
    }

    await createStoreNotification({
      recipientId: returnRequest.customerId,
      recipientRole: "customer",
      parentOrderId: returnRequest.parentOrderId,
      parentOrderNumber: returnRequest.parentOrderNumber,
      fulfilmentOrderId: returnRequest.fulfilmentOrderId,
      fulfilmentOrderNumber: returnRequest.fulfilmentOrderNumber,
      type: "RETURN_REJECTED",
      title: `Return Request Declined: #${returnRequest.fulfilmentOrderNumber}`,
      message: `Your return request could not be accepted. Note: ${reason.trim()}`,
      metadata: { returnId, reason },
    });
  }

  await returnRequest.save();
  return { success: true, returnRequest };
}

export async function recordReturnItemReceived({ returnId, adminId, adminName = "Admin", returnTracking = {}, note = "" }) {
  const returnQuery = mongoose.Types.ObjectId.isValid(returnId)
    ? { $or: [{ _id: returnId }, { returnId }] }
    : { returnId };
  const returnRequest = await StoreReturn.findOne(returnQuery);
  if (!returnRequest) {
    const err = new Error("Return request not found.");
    err.statusCode = 404;
    throw err;
  }

  if (returnRequest.status !== "APPROVED") {
    const err = new Error(`Item receipt can only be logged for an 'APPROVED' return. Current status is '${returnRequest.status}'.`);
    err.statusCode = 400;
    throw err;
  }

  const fulfilmentOrder = await StoreFulfilmentOrder.findById(returnRequest.fulfilmentOrderId);
  const parentOrder = await StoreOrder.findById(returnRequest.parentOrderId);

  returnRequest.status = "ITEM_RETURNED";
  returnRequest.returnTracking = {
    courierName: returnTracking.courierName || "Reverse Logistics Express",
    trackingNumber: returnTracking.trackingNumber || `REV-${Date.now()}`,
    trackingUrl: returnTracking.trackingUrl || "",
    shippedBackAt: returnTracking.shippedBackAt || new Date(),
    receivedAt: new Date(),
  };

  returnRequest.history.push({
    status: "ITEM_RETURNED",
    changedAt: new Date(),
    changedBy: adminId,
    role: "admin",
    note: `Returned item received and inspected at warehouse: ${note || "Quality inspected"}.`,
  });

  if (fulfilmentOrder) {
    fulfilmentOrder.status = "RETURNED";
    fulfilmentOrder.statusHistory.push({
      status: "RETURNED",
      changedAt: new Date(),
      changedBy: adminId,
      role: "admin",
      note: `Return item verified received. Fulfilment marked as RETURNED.`,
    });
    await fulfilmentOrder.save();
  }

  // Initiate safe refund tracking and compensating ledger
  const refundAmount = returnRequest.requestedRefundAmount;
  returnRequest.actualRefundAmount = refundAmount;
  returnRequest.actualRefundAmountInPaise = Math.round(refundAmount * 100);

  try {
    const refundResult = await initiateStoreRefund({
      parentOrderId: returnRequest.parentOrderId,
      fulfilmentOrderId: returnRequest.fulfilmentOrderId,
      amount: refundAmount,
      reason: `Return item received refund: ${returnRequest.returnId}`,
      adminUser: { _id: adminId, name: adminName, role: "admin" },
      idempotencyKey: `REFUND-RETURN-${returnRequest.returnId}`,
    });

    if (refundResult.refund) {
      returnRequest.refundId = refundResult.refund._id;
      returnRequest.status = "REFUND_PENDING";
      returnRequest.history.push({
        status: "REFUND_PENDING",
        changedAt: new Date(),
        changedBy: adminId,
        role: "admin",
        note: `Compensating ledger credited. Refund registered in safe PENDING_PROVIDER status.`,
      });
    }
  } catch (rfErr) {
    console.error("Non-fatal return refund initiation error:", rfErr.message);
  }

  await returnRequest.save();

  // In-app notifications
  await createStoreNotification({
    recipientId: returnRequest.customerId,
    recipientRole: "customer",
    parentOrderId: returnRequest.parentOrderId,
    parentOrderNumber: returnRequest.parentOrderNumber,
    fulfilmentOrderId: returnRequest.fulfilmentOrderId,
    fulfilmentOrderNumber: returnRequest.fulfilmentOrderNumber,
    type: "RETURN_ITEM_RECEIVED",
    title: `Return Item Received: #${returnRequest.fulfilmentOrderNumber}`,
    message: `We have received your returned item. A refund of ₹${refundAmount} is currently being processed.`,
    metadata: { returnId, refundAmount },
  });

  return { success: true, returnRequest };
}

/**
 * =========================================================================
 * 4. VERIFIED PURCHASE REVIEWS & RATINGS WORKFLOW
 * =========================================================================
 */
export async function createStoreReview({
  customerId,
  customerName,
  productId,
  fulfilmentOrderId,
  rating,
  title = "",
  comment = "",
  images = [],
}) {
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    const err = new Error("Rating must be an integer between 1 and 5.");
    err.statusCode = 400;
    throw err;
  }

  const product = await StoreProduct.findById(productId);
  if (!product) {
    const err = new Error("Product not found.");
    err.statusCode = 404;
    throw err;
  }

  // Anti-fraud: Sellers cannot review their own products
  if (product.sellerId.toString() === customerId.toString()) {
    const err = new Error("Sellers are strictly prohibited from reviewing their own products.");
    err.statusCode = 403;
    throw err;
  }

  // Verified purchase check: Customer must have purchased this product in a completed/delivered order
  const fulfilmentOrder = await StoreFulfilmentOrder.findById(fulfilmentOrderId);
  if (!fulfilmentOrder) {
    const err = new Error("Associated fulfilment order not found.");
    err.statusCode = 404;
    throw err;
  }

  if (fulfilmentOrder.customerId.toString() !== customerId.toString()) {
    const err = new Error("Access denied. You can only review products from your own purchases.");
    err.statusCode = 403;
    throw err;
  }

  if (fulfilmentOrder.status !== "DELIVERED") {
    const err = new Error("Only delivered purchases are eligible for verified customer reviews.");
    err.statusCode = 400;
    throw err;
  }

  const hasItem = (fulfilmentOrder.items || []).some(
    (it) => it.productId.toString() === productId.toString()
  );
  if (!hasItem) {
    const err = new Error("The specified product is not part of this delivered shipment.");
    err.statusCode = 400;
    throw err;
  }

  // Duplicate review check: One review per customer per product purchase
  const existingReview = await StoreReview.findOne({
    customerId,
    productId,
    fulfilmentOrderId,
  });
  if (existingReview) {
    const err = new Error("Duplicate review. You have already submitted a review for this purchase.");
    err.statusCode = 400;
    throw err;
  }

  const reviewId = `SREV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const review = new StoreReview({
    reviewId,
    productId,
    storeId: product.storeId,
    sellerId: product.sellerId,
    customerId,
    customerName: customerName || "Verified Customer",
    parentOrderId: fulfilmentOrder.parentOrderId,
    fulfilmentOrderId: fulfilmentOrder._id,
    rating: numRating,
    title: String(title || "").trim(),
    comment: String(comment || "").trim(),
    images: Array.isArray(images) ? images : [],
    isVerifiedPurchase: true,
    status: "PUBLISHED",
  });

  await review.save();

  // Recalculate product aggregate ratings safely
  await recalculateProductRating(productId);

  // Notify seller of verified customer review
  await createStoreNotification({
    recipientId: product.sellerId,
    recipientRole: "seller",
    parentOrderId: fulfilmentOrder.parentOrderId,
    type: "REVIEW_SUBMITTED",
    title: `New Verified Review: ${numRating}★ for ${product.title}`,
    message: `${customerName || "A customer"} left a ${numRating}-star verified purchase review for "${product.title}".`,
    metadata: { reviewId, rating: numRating, productId },
  });

  return { success: true, review };
}

export async function recalculateProductRating(productId) {
  const publishedReviews = await StoreReview.find({ productId, status: "PUBLISHED" });
  const reviewsCount = publishedReviews.length;
  let rating = 0;

  if (reviewsCount > 0) {
    const sum = publishedReviews.reduce((acc, r) => acc + r.rating, 0);
    rating = Math.round((sum / reviewsCount) * 10) / 10;
  }

  await StoreProduct.findByIdAndUpdate(productId, { rating, reviewsCount });
  return { rating, reviewsCount };
}

export async function moderateStoreReview({ reviewId, adminId, status, moderationNotes = "" }) {
  if (!["PUBLISHED", "PENDING_MODERATION", "HIDDEN", "REJECTED"].includes(status)) {
    const err = new Error("Invalid moderation status.");
    err.statusCode = 400;
    throw err;
  }

  const reviewQuery = mongoose.Types.ObjectId.isValid(reviewId)
    ? { $or: [{ _id: reviewId }, { reviewId }] }
    : { reviewId };
  const review = await StoreReview.findOne(reviewQuery);
  if (!review) {
    const err = new Error("Review not found.");
    err.statusCode = 404;
    throw err;
  }

  review.status = status;
  review.moderatedBy = adminId;
  review.moderatedAt = new Date();
  review.moderationNotes = String(moderationNotes || "").trim();
  await review.save();

  // Recalculate product aggregate rating
  await recalculateProductRating(review.productId);

  return { success: true, review };
}

export async function getProductReviews({ productId, page = 1, limit = 20 }) {
  const query = { productId, status: "PUBLISHED" };
  const take = Math.min(50, Math.max(1, Number(limit)));
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const [reviews, total, allForStats] = await Promise.all([
    StoreReview.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
    StoreReview.countDocuments(query),
    StoreReview.find(query, "rating").lean(),
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  allForStats.forEach((r) => {
    if (distribution[r.rating] !== undefined) {
      distribution[r.rating]++;
    }
    sum += r.rating;
  });

  const averageRating = allForStats.length > 0 ? Math.round((sum / allForStats.length) * 10) / 10 : 0;

  return {
    success: true,
    reviews,
    total,
    page: Number(page),
    averageRating,
    distribution,
    ratingBreakdown: distribution,
  };
}
