import mongoose from "mongoose";
import StoreOrder from "../models/StoreOrderModel.js";
import StoreFulfilmentOrder from "../models/StoreFulfilmentOrderModel.js";
import StoreNotification from "../models/StoreNotificationModel.js";

/**
 * Valid state transition graph for Store fulfillment orders.
 * Terminal states: CANCELLED (and DELIVERED for Phase 7 dispatch workflow).
 */
const VALID_FULFILMENT_TRANSITIONS = {
  PENDING_PAYMENT: ["ORDER_PLACED"], // Driven by payment verification only
  ORDER_PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "DISPATCHED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [], // Terminal for dispatch
  CANCELLED: [], // Terminal
};

/**
 * Known courier tracking URL generators for India & global couriers.
 */
const COURIER_TRACKING_TEMPLATES = {
  bluedart: (awb) => `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(awb)}`,
  "blue dart": (awb) => `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(awb)}`,
  delhivery: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`,
  dtdc: (awb) => `https://www.dtdc.in/tracking/tracking_results.asp?action=profile&trckno=${encodeURIComponent(awb)}`,
  "india post": (awb) => `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx?consNo=${encodeURIComponent(awb)}`,
  speedpost: (awb) => `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx?consNo=${encodeURIComponent(awb)}`,
  shiprocket: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,
  ekart: (awb) => `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(awb)}`,
  shadowfax: (awb) => `https://tracker.shadowfax.in/#/track?awb=${encodeURIComponent(awb)}`,
  fedex: (awb) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`,
  dhl: (awb) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(awb)}`,
};

/**
 * Resolve or auto-generate a valid courier tracking URL.
 */
export function resolveCourierTrackingUrl(courierName, trackingNumber, existingUrl = "") {
  const trimmedUrl = String(existingUrl || "").trim();
  if (trimmedUrl && /^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  const normalized = String(courierName || "").trim().toLowerCase();
  for (const [key, generator] of Object.entries(COURIER_TRACKING_TEMPLATES)) {
    if (normalized.includes(key)) {
      return generator(trackingNumber);
    }
  }

  return trimmedUrl || "";
}

/**
 * Pure function: Derive the parent StoreOrder status based on all child fulfilment orders.
 */
export function deriveParentOrderStatus(childOrders, parentOrder = null) {
  if (!Array.isArray(childOrders) || childOrders.length === 0) {
    return parentOrder?.status || "PENDING_PAYMENT";
  }

  // If parent order is still pending payment or unpaid, do not derive fulfillment states
  if (parentOrder && parentOrder.paymentStatus !== "PAID" && parentOrder.status === "PENDING_PAYMENT") {
    return "PENDING_PAYMENT";
  }

  const statuses = childOrders.map((o) => (o.status === "DISPATCHED" ? "SHIPPED" : o.status));

  // If all are cancelled
  if (statuses.every((s) => s === "CANCELLED")) {
    return "CANCELLED";
  }

  // Filter non-cancelled orders for progression
  const activeStatuses = statuses.filter((s) => s !== "CANCELLED");
  if (activeStatuses.length === 0) {
    return "CANCELLED";
  }

  // If all active are DELIVERED
  if (activeStatuses.every((s) => s === "DELIVERED")) {
    return "DELIVERED";
  }

  // If at least one is DELIVERED, but not all
  if (activeStatuses.some((s) => s === "DELIVERED")) {
    return "PARTIALLY_DELIVERED";
  }

  // If all active are SHIPPED
  if (activeStatuses.every((s) => s === "SHIPPED")) {
    return "SHIPPED";
  }

  // If at least one active is SHIPPED
  if (activeStatuses.some((s) => s === "SHIPPED")) {
    return "PARTIALLY_SHIPPED";
  }

  // If any active is PROCESSING or CONFIRMED
  if (activeStatuses.some((s) => s === "PROCESSING" || s === "CONFIRMED")) {
    return "PROCESSING";
  }

  // If all active are ORDER_PLACED
  if (activeStatuses.every((s) => s === "ORDER_PLACED")) {
    return "ORDER_PLACED";
  }

  return "PROCESSING";
}

/**
 * Safe in-app store notification helper.
 * Zero external network calls; logs and persists notification immutably.
 */
export async function createStoreNotification({
  recipientId,
  recipientRole = "customer",
  parentOrderId = null,
  parentOrderNumber = "",
  fulfilmentOrderId = null,
  fulfilmentOrderNumber = "",
  type,
  title,
  message,
  metadata = {},
}) {
  try {
    if (!recipientId || !type || !title || !message) {
      return null;
    }

    const notif = new StoreNotification({
      recipientId,
      recipientRole,
      parentOrderId,
      parentOrderNumber,
      fulfilmentOrderId,
      fulfilmentOrderNumber,
      type,
      title: title.trim(),
      message: message.trim(),
      metadata,
      isRead: false,
      channel: "IN_APP",
    });

    await notif.save();
    return notif;
  } catch (err) {
    console.error("Store notification creation failed (non-fatal):", err.message);
    return null;
  }
}

/**
 * Core fulfillment transition engine.
 * Validates ownership, paid status, transition validity, tracking attributes,
 * updates history audit log, synchronizes parent order status, and triggers notifications.
 */
export async function transitionFulfilmentStatus({
  fulfilmentOrderId,
  targetStatus,
  actorId,
  actorRole = "seller",
  actorName = "",
  dispatchData = {},
  note = "",
  isAdmin = false,
}) {
  if (!fulfilmentOrderId) {
    const err = new Error("fulfilmentOrderId is required.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedTarget = targetStatus === "DISPATCHED" ? "SHIPPED" : String(targetStatus).toUpperCase().trim();

  const fulfilmentOrder = await StoreFulfilmentOrder.findById(fulfilmentOrderId);
  if (!fulfilmentOrder) {
    const err = new Error("Fulfilment order not found.");
    err.statusCode = 404;
    throw err;
  }

  // Authorization check
  if (!isAdmin) {
    if (actorRole === "seller") {
      if (fulfilmentOrder.sellerId.toString() !== actorId.toString()) {
        const err = new Error("Access denied. You can only manage your own boutique's fulfilment orders.");
        err.statusCode = 403;
        throw err;
      }
    } else if (actorRole === "customer") {
      if (fulfilmentOrder.customerId.toString() !== actorId.toString()) {
        const err = new Error("Access denied. You can only view or confirm your own orders.");
        err.statusCode = 403;
        throw err;
      }
      // Customer is only permitted to confirm delivery for an already SHIPPED / DISPATCHED order
      if (normalizedTarget !== "DELIVERED") {
        const err = new Error("Customers may only confirm order delivery.");
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error("Unauthorized role for fulfilment operation.");
      err.statusCode = 403;
      throw err;
    }
  }

  // Retrieve parent order to check payment status
  const parentOrder = await StoreOrder.findById(fulfilmentOrder.parentOrderId);
  if (!parentOrder) {
    const err = new Error("Parent store order not found.");
    err.statusCode = 404;
    throw err;
  }

  // Enforce paid order requirement
  if (parentOrder.paymentStatus !== "PAID") {
    const err = new Error(
      `Cannot advance fulfilment order. Order payment status is '${parentOrder.paymentStatus}'. Fulfilment requires verified payment.`
    );
    err.statusCode = 400;
    throw err;
  }

  const currentStatus = fulfilmentOrder.status === "DISPATCHED" ? "SHIPPED" : fulfilmentOrder.status;

  // Idempotency check: if already at target status, return cleanly without duplicate state mutation
  if (currentStatus === normalizedTarget) {
    return {
      success: true,
      message: `Fulfilment order is already in '${normalizedTarget}' state.`,
      fulfilmentOrder,
      parentOrder,
      isIdempotent: true,
    };
  }

  // Enforce state transition rules (admin can intervene with audit note if necessary, but invalid jumping still validated)
  const allowedNext = VALID_FULFILMENT_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(normalizedTarget) && !allowedNext.includes(targetStatus)) {
    // Admin override exception allows administrative corrections (e.g. exceptions or manual overrides)
    if (!isAdmin) {
      const err = new Error(
        `Invalid status transition from '${currentStatus}' to '${normalizedTarget}'. Allowed next states: [${allowedNext.join(", ")}].`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // Tracking details validation when transitioning to SHIPPED
  if (normalizedTarget === "SHIPPED") {
    const courierName = String(dispatchData.courierName || fulfilmentOrder.dispatchDetails?.courierName || "").trim();
    const trackingNumber = String(dispatchData.trackingNumber || fulfilmentOrder.dispatchDetails?.trackingNumber || "").trim();

    if (!courierName || courierName.length < 2) {
      const err = new Error("A valid courier partner name (minimum 2 characters) is required to ship an order.");
      err.statusCode = 400;
      throw err;
    }

    if (!trackingNumber || trackingNumber.length < 3) {
      const err = new Error("A valid tracking / AWB number (minimum 3 characters) is required to ship an order.");
      err.statusCode = 400;
      throw err;
    }

    const resolvedUrl = resolveCourierTrackingUrl(courierName, trackingNumber, dispatchData.trackingUrl);

    fulfilmentOrder.dispatchDetails = {
      ...fulfilmentOrder.dispatchDetails,
      courierName,
      trackingNumber,
      trackingUrl: resolvedUrl,
      dispatchedAt: dispatchData.dispatchedAt ? new Date(dispatchData.dispatchedAt) : new Date(),
      estimatedDelivery: dispatchData.estimatedDelivery ? new Date(dispatchData.estimatedDelivery) : null,
    };
  }

  // Delivery details when transitioning to DELIVERED
  if (normalizedTarget === "DELIVERED") {
    fulfilmentOrder.dispatchDetails = {
      ...fulfilmentOrder.dispatchDetails,
      deliveredAt: new Date(),
      deliveryConfirmationNote: String(dispatchData.deliveryConfirmationNote || note || "").trim(),
    };
  }

  // Cancellation details when transitioning to CANCELLED
  if (normalizedTarget === "CANCELLED") {
    const cancellationReason = String(dispatchData.cancellationReason || note || "Cancelled by seller").trim();
    fulfilmentOrder.dispatchDetails = {
      ...fulfilmentOrder.dispatchDetails,
      cancellationReason,
      cancelledBy: actorRole,
      cancelledAt: new Date(),
    };
  }

  // Update fulfillment order status
  fulfilmentOrder.status = normalizedTarget;

  // Append to status history audit trail
  const historyEntry = {
    status: normalizedTarget,
    changedAt: new Date(),
    changedBy: actorId,
    changedByName: actorName || (isAdmin ? "Admin" : actorRole),
    role: isAdmin ? "admin" : actorRole,
    note: (note || "").trim(),
  };

  if (!Array.isArray(fulfilmentOrder.statusHistory)) {
    fulfilmentOrder.statusHistory = [];
  }
  fulfilmentOrder.statusHistory.push(historyEntry);

  await fulfilmentOrder.save();

  // Derive and update parent order status
  const allChildOrders = await StoreFulfilmentOrder.find({ parentOrderId: parentOrder._id });
  const derivedParentStatus = deriveParentOrderStatus(allChildOrders, parentOrder);

  if (parentOrder.status !== derivedParentStatus) {
    parentOrder.status = derivedParentStatus;
    if (!Array.isArray(parentOrder.statusHistory)) {
      parentOrder.statusHistory = [];
    }
    parentOrder.statusHistory.push({
      status: derivedParentStatus,
      changedAt: new Date(),
      changedBy: actorId,
      changedByName: actorName || "System",
      role: isAdmin ? "admin" : "system",
      note: `Parent status automatically synchronized to ${derivedParentStatus} following ${fulfilmentOrder.fulfilmentOrderNumber} transition to ${normalizedTarget}.`,
    });
    await parentOrder.save();
  }

  // Generate safe in-app notifications
  try {
    let notifType = "DELIVERY_UPDATED";
    let notifTitle = `Order Update: #${parentOrder.orderNumber}`;
    let notifMessage = `Your shipment from ${fulfilmentOrder.storeName} has been updated to ${normalizedTarget}.`;

    if (normalizedTarget === "CONFIRMED") {
      notifType = "ORDER_CONFIRMED";
      notifTitle = `Shipment Confirmed: #${fulfilmentOrder.fulfilmentOrderNumber}`;
      notifMessage = `${fulfilmentOrder.storeName} has accepted and confirmed your shipment from order #${parentOrder.orderNumber}.`;
    } else if (normalizedTarget === "PROCESSING") {
      notifType = "PROCESSING_STARTED";
      notifTitle = `Items Being Prepared: #${fulfilmentOrder.fulfilmentOrderNumber}`;
      notifMessage = `${fulfilmentOrder.storeName} has started packaging and preparing your items for courier pickup.`;
    } else if (normalizedTarget === "SHIPPED") {
      notifType = "ORDER_SHIPPED";
      notifTitle = `Shipment Dispatched: #${fulfilmentOrder.fulfilmentOrderNumber}`;
      notifMessage = `Your order from ${fulfilmentOrder.storeName} is on the way! Dispatched via ${fulfilmentOrder.dispatchDetails.courierName} (AWB: ${fulfilmentOrder.dispatchDetails.trackingNumber}).`;
    } else if (normalizedTarget === "DELIVERED") {
      notifType = "ORDER_DELIVERED";
      notifTitle = `Delivered: #${fulfilmentOrder.fulfilmentOrderNumber}`;
      notifMessage = `Your shipment from ${fulfilmentOrder.storeName} has been delivered successfully.`;
    } else if (normalizedTarget === "CANCELLED") {
      notifType = "ORDER_CANCELLED";
      notifTitle = `Shipment Cancelled: #${fulfilmentOrder.fulfilmentOrderNumber}`;
      notifMessage = `Shipment #${fulfilmentOrder.fulfilmentOrderNumber} from ${fulfilmentOrder.storeName} was cancelled.`;
    }

    // Notify customer
    await createStoreNotification({
      recipientId: fulfilmentOrder.customerId,
      recipientRole: "customer",
      parentOrderId: parentOrder._id,
      parentOrderNumber: parentOrder.orderNumber,
      fulfilmentOrderId: fulfilmentOrder._id,
      fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      metadata: {
        courierName: fulfilmentOrder.dispatchDetails?.courierName || "",
        trackingNumber: fulfilmentOrder.dispatchDetails?.trackingNumber || "",
        trackingUrl: fulfilmentOrder.dispatchDetails?.trackingUrl || "",
        status: normalizedTarget,
      },
    });

    // If cancelled by admin, also notify seller
    if (normalizedTarget === "CANCELLED" && isAdmin) {
      await createStoreNotification({
        recipientId: fulfilmentOrder.sellerId,
        recipientRole: "seller",
        parentOrderId: parentOrder._id,
        parentOrderNumber: parentOrder.orderNumber,
        fulfilmentOrderId: fulfilmentOrder._id,
        fulfilmentOrderNumber: fulfilmentOrder.fulfilmentOrderNumber,
        type: "ORDER_CANCELLED",
        title: `Admin Cancelled Shipment: #${fulfilmentOrder.fulfilmentOrderNumber}`,
        message: `An administrator cancelled shipment #${fulfilmentOrder.fulfilmentOrderNumber}. Note: ${note || "Administrative intervention"}`,
        metadata: { status: "CANCELLED", reason: note },
      });
    }
  } catch (notifErr) {
    console.error("Non-fatal notification emission error:", notifErr.message);
  }

  return {
    success: true,
    message: `Fulfilment order ${fulfilmentOrder.fulfilmentOrderNumber} transitioned to ${normalizedTarget}.`,
    fulfilmentOrder,
    parentOrder,
    isIdempotent: false,
  };
}

/**
 * Admin: Retrieve paginated fulfillment orders with flexible filters and delayed tracking detection.
 */
export async function getAdminFulfilmentOrdersOverview({
  status,
  sellerId,
  storeId,
  delayedOnly = false,
  search = "",
  limit = 50,
  page = 1,
}) {
  const query = {};

  if (status) {
    query.status = status === "DISPATCHED" ? "SHIPPED" : status;
  }

  if (sellerId) {
    query.sellerId = sellerId;
  }

  if (storeId) {
    query.storeId = storeId;
  }

  // Filter orders not dispatched within configured limits (> 48 hours since confirmation / placement)
  if (delayedOnly === "true" || delayedOnly === true) {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    query.status = { $in: ["ORDER_PLACED", "CONFIRMED", "PROCESSING"] };
    query.createdAt = { $lte: twoDaysAgo };
  }

  if (search && String(search).trim()) {
    const s = String(search).trim();
    query.$or = [
      { fulfilmentOrderNumber: { $regex: s, $options: "i" } },
      { parentOrderNumber: { $regex: s, $options: "i" } },
      { storeName: { $regex: s, $options: "i" } },
      { "dispatchDetails.trackingNumber": { $regex: s, $options: "i" } },
      { "deliveryAddress.name": { $regex: s, $options: "i" } },
      { "deliveryAddress.phone": { $regex: s, $options: "i" } },
    ];
  }

  const take = Math.min(100, Math.max(1, Number(limit)));
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const [orders, total] = await Promise.all([
    StoreFulfilmentOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take)
      .populate("sellerId", "name email")
      .populate("customerId", "name email phone")
      .lean(),
    StoreFulfilmentOrder.countDocuments(query),
  ]);

  return {
    orders,
    total,
    page: Number(page),
    limit: take,
  };
}

/**
 * Admin: Retrieve aggregated fulfillment metrics.
 */
export async function getAdminFulfilmentMetrics() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    totalFulfilments,
    awaitingConfirmation,
    inProcessing,
    inTransit,
    delivered,
    delayedOrders,
    cancelled,
  ] = await Promise.all([
    StoreFulfilmentOrder.countDocuments(),
    StoreFulfilmentOrder.countDocuments({ status: "ORDER_PLACED" }),
    StoreFulfilmentOrder.countDocuments({ status: { $in: ["CONFIRMED", "PROCESSING"] } }),
    StoreFulfilmentOrder.countDocuments({ status: { $in: ["SHIPPED", "DISPATCHED"] } }),
    StoreFulfilmentOrder.countDocuments({ status: "DELIVERED" }),
    StoreFulfilmentOrder.countDocuments({
      status: { $in: ["ORDER_PLACED", "CONFIRMED", "PROCESSING"] },
      createdAt: { $lte: twoDaysAgo },
    }),
    StoreFulfilmentOrder.countDocuments({ status: "CANCELLED" }),
  ]);

  return {
    totalFulfilments,
    awaitingConfirmation,
    inProcessing,
    inTransit,
    delivered,
    delayedOrders,
    cancelled,
  };
}
