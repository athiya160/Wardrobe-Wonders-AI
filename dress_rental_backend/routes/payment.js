import { Router } from "express";
import jwt from "jsonwebtoken";
import { randomUUID, createHash } from "crypto";
import mongoose from "mongoose";
import { config } from "../config/phonepeConfig.js";
import UserModel from "../models/UserModel.js";
import axios from "axios";
import productModel from "../models/productModel.js";
import OrderModel from "../models/OrderModel.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { getJwtSecret } from "../config/envValidator.js";
import {
  atomicReserveDates,
  atomicReleaseDates,
  calculateServerPricing,
  findDateConflict,
} from "../services/bookingSafetyService.js";

export const PaymentRouter = new Router();

// Dynamic environment check for mock payment isolation (never active in production)
const isMockAllowed = () => process.env.NODE_ENV !== "production" && process.env.ENABLE_MOCK_PAYMENTS === "true";

// Helper to resolve and snapshot customer delivery address
async function resolveOrderAddress(body, authHeader) {
  let addr = body.address || {};
  if (body.addressId) {
    try {
      let u = null;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, getJwtSecret());
        u = await UserModel.findById(decoded.id);
      } else if (body.email) {
        u = await UserModel.findOne({ email: body.email.trim().toLowerCase() });
      }
      const saved = u?.addresses?.id(body.addressId);
      if (saved) {
        return {
          name: saved.name,
          phone: saved.phone,
          street: saved.street,
          houseNo: saved.houseNo || "",
          landmark: saved.landmark || "",
          city: saved.city,
          state: saved.state,
          zip: saved.pincode,
          pincode: saved.pincode,
        };
      }
    } catch {
      // Fall back to body.address
    }
  }
  return addr;
}

/**
 * POST /payment
 * Initiate online payment transaction
 * Hardened: Unique transaction ID, server-side pricing, no unsafe fallback
 */
PaymentRouter.post("/", async (req, res) => {
  try {
    const { body } = req;
    if (!body || !body.dress) {
      return res.status(400).json({ success: false, message: "Dress details are required." });
    }

    const dressId = body.dress._id || body.dressId;
    const product = await productModel.findById(dressId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Garment listing not found." });
    }

    if (product.availability === false || product.status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "This garment is currently unavailable or paused by the provider.",
      });
    }

    // Parse and validate rental dates
    const startDate = body.startDate || body.rentalStartDate ? new Date(body.startDate || body.rentalStartDate) : new Date();
    const quantity = Number(body.quantity) || 1;
    const endDate = body.endDate || body.rentalEndDate
      ? new Date(body.endDate || body.rentalEndDate)
      : new Date(startDate.getTime() + quantity * 24 * 60 * 60 * 1000);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
      return res.status(400).json({ success: false, message: "Invalid rental date range." });
    }

    // Pre-flight conflict check to avoid unnecessary gateway initiation
    const preConflict = findDateConflict(product.bookedDates, startDate, endDate);
    if (preConflict) {
      return res.status(409).json({
        success: false,
        code: "DATE_CONFLICT",
        message: "The requested rental dates conflict with an existing reservation.",
        conflict: {
          startDate: preConflict.startDate,
          endDate: preConflict.endDate,
        },
      });
    }

    // Server-side pricing calculation (never trust frontend totalAmount)
    const pricing = calculateServerPricing(product, startDate, endDate, quantity);

    // Cryptographically secure unique transaction identifier
    // Allows client to pass retry attempt ID for idempotency or generates new UUID
    const transactionId = body.transactionId && typeof body.transactionId === "string" && body.transactionId.trim()
      ? body.transactionId.trim()
      : `WW-${Date.now()}-${randomUUID()}`;

    const user = await UserModel.findOne({ email: body.email });
    const frontendBase = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173")
      .split(",")[0]
      .trim();

    const orderAddress = await resolveOrderAddress(body, req.headers.authorization);

    // Persist pending order so server-to-server webhook can reconcile payment if customer closes browser
    const existingPending = await OrderModel.findOne({ transactionId });
    if (!existingPending) {
      const pendingOrder = new OrderModel({
        userEmail: body.email,
        product: product._id,
        providerId: product.providerId,
        quantity: pricing.days,
        rentalDays: pricing.days,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        securityDeposit: pricing.securityDeposit,
        rentalFee: pricing.rentalFee,
        totalAmount: pricing.totalAmount,
        address: orderAddress,
        paymentMethod: "online",
        transactionId: transactionId,
        status: "Processing",
        requestStatus: "Pending",
        paymentStatus: "PENDING",
        depositStatus: "HELD",
        refundStatus: "NOT_REQUESTED",
      });
      await pendingOrder.save();
    }

    const salt = config.KEY;
    const hostUrl = `${config.BASE_URL}/${config.PAYMENT_ENDPOINT}`;
    const index = config.INDEX;
    const endpoint = config.PAYMENT_ENDPOINT;

    // Amount strictly calculated server-side in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(pricing.totalAmount * 100);

    const payload = {
      merchantId: config.MID,
      merchantTransactionId: transactionId,
      amount: amountInPaise,
      merchantUserId: user?._id?.toString() || user?.id?.toString() || "guest_user",
      redirectUrl: `${frontendBase}/verify-payment`,
      redirectMode: "REDIRECT",
      callbackUrl: config.CALLBACK_URL || `${frontendBase}/api/payment/callback`,
      mobileNumber: user?.phone || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = createHash("sha256")
      .update(`${base64Payload}/${endpoint}${salt}`)
      .digest("hex");
    const xVerify = `${checksum}###${index}`;

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

      return res.send(response.data);
    } catch (gatewayError) {
      console.error("PhonePe gateway initiation failed:", gatewayError.message);

      // Controlled mock payment isolation: ONLY active when explicitly configured in non-production
      if (isMockAllowed() && (body.simulateMock === true || process.env.USE_MOCK_GATEWAY === "true")) {
        console.warn("[SECURITY NOTICE] Non-production mock payment simulation activated.");
        return res.json({
          success: true,
          mock: true,
          data: {
            merchantTransactionId: transactionId,
            instrumentResponse: {
              redirectInfo: {
                url: `${frontendBase}/verify-payment?success=true&mock=true`,
              },
            },
          },
        });
      }

      // In production or when mock is disabled: NEVER simulate success!
      return res.status(502).json({
        success: false,
        code: "GATEWAY_INITIATION_FAILED",
        message: "Unable to establish secure payment gateway session. Please try again or use another payment method.",
      });
    }
  } catch (err) {
    console.error("Payment initiation route error:", err);
    return res.status(500).json({ success: false, message: "Internal server error during payment initiation." });
  }
});

/**
 * POST /payment/check-status
 * Payment status verification and order finalization
 * Concurrency-safe atomic reservation, idempotency protection, server-side amount verification
 */
PaymentRouter.post("/check-status", async (req, res) => {
  const { body } = req;

  if (!body || !body.transactionId || !body.dressId) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "transactionId and dressId are required to verify payment.",
    });
  }

  try {
    const product = await productModel.findById(body.dressId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Garment listing not found." });
    }

    // Determine rental dates and server-side pricing
    const days = Number(body.quantity) || 1;
    const startDate = body.startDate || body.rentalStartDate
      ? new Date(body.startDate || body.rentalStartDate)
      : new Date();
    const endDate = body.endDate || body.rentalEndDate
      ? new Date(body.endDate || body.rentalEndDate)
      : new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    const pricing = calculateServerPricing(product, startDate, endDate, days);
    const expectedPaise = Math.round(pricing.totalAmount * 100);

    // IDEMPOTENCY GUARD: Check if order was already finalized for this transactionId
    const existingOrder = await OrderModel.findOne({ transactionId: body.transactionId });
    if (existingOrder) {
      if (existingOrder.paymentStatus === "PAID") {
        return res.json({
          success: true,
          code: "PAYMENT_SUCCESS",
          order: existingOrder,
          message: "Order already confirmed (idempotent duplicate request handled).",
        });
      } else if (existingOrder.paymentStatus === "REFUND_REQUIRED") {
        return res.status(409).json({
          success: false,
          code: "RESERVATION_CONFLICT",
          order: existingOrder,
          message: "Transaction encountered a booking conflict and has been queued for refund.",
          refundRequired: true,
        });
      } else if (existingOrder.paymentStatus === "FAILED" || existingOrder.paymentStatus === "CANCELLED") {
        return res.status(400).json({
          success: false,
          code: existingOrder.paymentStatus,
          order: existingOrder,
          message: `Order transaction is ${existingOrder.paymentStatus.toLowerCase()}.`,
        });
      }
      // If existingOrder.paymentStatus === "PENDING", proceed to gateway verification and finalization!
    }

    // Gateway verification with PhonePe or isolated non-production mock
    let paymentVerified = false;
    let gatewayAmountPaise = 0;
    let gatewayTxnId = body.transactionId;

    const isMock =
      isMockAllowed() &&
      (body.mockPayment === true ||
        (typeof body.transactionId === "string" &&
          (body.transactionId.startsWith("mock_") || body.transactionId.startsWith("race_"))));

    if (isMock) {
      paymentVerified = true;
      gatewayAmountPaise = expectedPaise;
    } else {
      const salt = config.KEY;
      const hostUrl = `${config.BASE_URL}/pg/v1/status/${config.MID}/${body.transactionId}`;
      const index = config.INDEX;
      const checksum = createHash("sha256")
        .update(`/pg/v1/status/${config.MID}/${body.transactionId}${salt}`)
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

        const data = response.data;
        if (data && data.code === "PAYMENT_SUCCESS") {
          paymentVerified = true;
          gatewayAmountPaise = Number(data.data?.amount) || expectedPaise;
          gatewayTxnId = data.data?.merchantTransactionId || body.transactionId;
        }
      } catch (gwErr) {
        console.error("PhonePe check-status gateway call failed:", gwErr.message);

        // Strict failure handling: NEVER convert gateway error into simulated success!
        if (gwErr.code === "ECONNABORTED" || gwErr.message?.includes("timeout")) {
          return res.status(504).json({
            success: false,
            code: "GATEWAY_TIMEOUT",
            retryable: true,
            message: "Payment gateway timed out while verifying transaction. Please retry shortly.",
          });
        }
        return res.status(502).json({
          success: false,
          code: "GATEWAY_VERIFICATION_FAILED",
          retryable: false,
          message: "Payment verification failed or transaction was declined by the gateway.",
        });
      }
    }

    if (!paymentVerified) {
      return res.status(400).json({
        success: false,
        code: "PAYMENT_NOT_VERIFIED",
        message: "Payment was not marked successful by gateway. No booking confirmed.",
      });
    }

    // PRICING MANIPULATION CHECK: Verify gateway amount against server pricing
    if (gatewayAmountPaise !== expectedPaise) {
      console.error(
        `[SECURITY ALERT] Payment amount mismatch: Gateway received ${gatewayAmountPaise} paise, expected ${expectedPaise} paise.`
      );

      const mismatchedOrder = new OrderModel({
        userEmail: body.email,
        product: product._id,
        providerId: product.providerId,
        quantity: pricing.days,
        rentalDays: pricing.days,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        securityDeposit: pricing.securityDeposit,
        rentalFee: pricing.rentalFee,
        totalAmount: gatewayAmountPaise / 100,
        address: body.address,
        paymentMethod: "online",
        transactionId: body.transactionId,
        status: "Failed",
        requestStatus: "Declined",
        paymentStatus: "PAYMENT_AMOUNT_MISMATCH",
        depositStatus: "NOT_APPLICABLE",
        refundStatus: "MANUAL_REFUND_REQUIRED",
        refundAmount: gatewayAmountPaise / 100,
        refundReason: `Amount mismatch: Paid ${gatewayAmountPaise} paise vs expected ${expectedPaise} paise`,
        refundInitiatedAt: new Date(),
        failureReason: "Payment amount does not match server catalog price.",
      });
      await mismatchedOrder.save();

      return res.status(400).json({
        success: false,
        code: "PAYMENT_AMOUNT_MISMATCH",
        message: "Payment amount does not match rental fee. Order rejected and flagged for refund review.",
        orderId: mismatchedOrder._id,
      });
    }

    // CONCURRENCY-SAFE ATOMIC INVENTORY RESERVATION
    const targetOrderId = existingOrder?._id || new mongoose.Types.ObjectId();
    const reservationResult = await atomicReserveDates(product._id, startDate, endDate, targetOrderId);

    if (reservationResult.success) {
      // Reservation succeeded atomically
      let confirmedOrder = existingOrder;
      if (confirmedOrder) {
        confirmedOrder.paymentStatus = "PAID";
        confirmedOrder.depositStatus = "HELD";
        confirmedOrder.status = "Processing";
        confirmedOrder.requestStatus = "Pending";
        await confirmedOrder.save();
      } else {
        confirmedOrder = new OrderModel({
          _id: targetOrderId,
          userEmail: body.email,
          product: product._id,
          providerId: product.providerId,
          quantity: pricing.days,
          rentalDays: pricing.days,
          rentalStartDate: startDate,
          rentalEndDate: endDate,
          securityDeposit: pricing.securityDeposit,
          rentalFee: pricing.rentalFee,
          totalAmount: pricing.totalAmount,
          address: body.address,
          paymentMethod: "online",
          transactionId: body.transactionId,
          status: "Processing",
          requestStatus: "Pending",
          paymentStatus: "PAID",
          depositStatus: "HELD",
          refundStatus: "NOT_REQUESTED",
        });
        await confirmedOrder.save();
      }

      // Decrement general stock count safely
      const currentStock = Number(product.stock) || 1;
      if (currentStock > 0) {
        await productModel.findByIdAndUpdate(product._id, { $set: { stock: Math.max(0, currentStock - 1) } });
      }

      return res.json({
        success: true,
        code: "PAYMENT_SUCCESS",
        message: "Payment verified and rental dates reserved successfully.",
        order: confirmedOrder,
      });
    } else {
      // RECOVERY STATE: Payment succeeded at gateway, but inventory reservation failed (concurrent booking)
      console.warn(
        `[DOUBLE BOOKING PREVENTED] Payment captured for txn ${body.transactionId}, but dates overlap existing booking.`
      );

      let conflictOrder = existingOrder;
      if (conflictOrder) {
        conflictOrder.paymentStatus = "REFUND_REQUIRED";
        conflictOrder.status = "Failed";
        conflictOrder.requestStatus = "Declined";
        conflictOrder.depositStatus = "NOT_APPLICABLE";
        conflictOrder.refundStatus = "MANUAL_REFUND_REQUIRED";
        conflictOrder.refundAmount = pricing.totalAmount;
        conflictOrder.refundReason = "CONCURRENT_BOOKING_CONFLICT";
        conflictOrder.failureReason = "Dates were booked concurrently by another customer during payment. Full refund required.";
        conflictOrder.refundInitiatedAt = new Date();
        await conflictOrder.save();
      } else {
        conflictOrder = new OrderModel({
          userEmail: body.email,
          product: product._id,
          providerId: product.providerId,
          quantity: pricing.days,
          rentalDays: pricing.days,
          rentalStartDate: startDate,
          rentalEndDate: endDate,
          securityDeposit: pricing.securityDeposit,
          rentalFee: pricing.rentalFee,
          totalAmount: pricing.totalAmount,
          address: body.address,
          paymentMethod: "online",
          transactionId: body.transactionId,
          status: "Failed",
          requestStatus: "Declined",
          paymentStatus: "REFUND_REQUIRED",
          depositStatus: "NOT_APPLICABLE",
          refundStatus: "MANUAL_REFUND_REQUIRED",
          refundAmount: pricing.totalAmount,
          refundReason: "CONCURRENT_BOOKING_CONFLICT",
          failureReason: "Dates were booked concurrently by another customer during payment. Full refund required.",
          refundInitiatedAt: new Date(),
        });
        await conflictOrder.save();
      }

      return res.status(409).json({
        success: false,
        code: "RESERVATION_CONFLICT",
        message: "These rental dates were reserved concurrently by another customer. Your payment was captured and a full refund has been queued.",
        refundRequired: true,
        orderId: conflictOrder._id,
      });
    }
  } catch (err) {
    console.error("Payment check-status error:", err);
    return res.status(500).json({ success: false, message: "Error verifying payment status." });
  }
});

/**
 * POST /payment/cod
 * Place order with Cash / Escrow on Delivery
 * Hardened with server-side pricing & atomic reservation
 */
PaymentRouter.post("/cod", async (req, res) => {
  const { body } = req;
  try {
    if (!body || !body.dressId) {
      return res.status(400).json({ success: false, message: "Dress ID is required." });
    }

    const product = await productModel.findById(body.dressId);
    if (!product) return res.status(404).json({ success: false, message: "Garment not found." });

    if (product.availability === false || product.status === "inactive") {
      return res.status(400).json({ success: false, message: "Dress is currently unavailable or inactive." });
    }

    const days = Number(body.quantity) || 1;
    const startDate = body.startDate || body.rentalStartDate
      ? new Date(body.startDate || body.rentalStartDate)
      : new Date();
    const endDate = body.endDate || body.rentalEndDate
      ? new Date(body.endDate || body.rentalEndDate)
      : new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
      return res.status(400).json({ success: false, message: "Invalid rental date range." });
    }

    // Server-side calculated pricing
    const pricing = calculateServerPricing(product, startDate, endDate, days);

    // Concurrency-safe atomic inventory reservation
    const codTxnRef = `COD-${Date.now()}-${randomUUID()}`;
    const newOrderId = new mongoose.Types.ObjectId();
    const reservationResult = await atomicReserveDates(product._id, startDate, endDate, newOrderId);

    if (!reservationResult.success) {
      return res.status(409).json({
        success: false,
        code: "DATE_CONFLICT",
        message: "The requested rental dates are no longer available for this dress.",
      });
    }

    const orderAddress = await resolveOrderAddress(body, req.headers.authorization);

    const newOrder = new OrderModel({
      _id: newOrderId,
      userEmail: body.email,
      product: product._id,
      providerId: product.providerId,
      quantity: pricing.days,
      rentalDays: pricing.days,
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      securityDeposit: pricing.securityDeposit,
      rentalFee: pricing.rentalFee,
      totalAmount: pricing.totalAmount,
      address: orderAddress,
      paymentMethod: "cod",
      transactionId: codTxnRef,
      status: "Processing",
      requestStatus: "Pending",
      paymentStatus: "PENDING",
      depositStatus: "HELD",
      refundStatus: "NOT_REQUESTED",
    });
    await newOrder.save();

    res.json({
      success: true,
      message: "Rental request placed successfully via COD",
      orderId: newOrder._id,
      order: newOrder,
    });
  } catch (e) {
    console.error("COD order placement error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /payment/my-rentals
 * Retrieve authenticated user's rental orders
 */
PaymentRouter.get("/my-rentals", authenticateToken, async (req, res) => {
  try {
    const orders = await OrderModel.find({ userEmail: req.user.email })
      .populate("product")
      .populate("providerId", "name email phone")
      .sort({ orderDate: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /payment/orders/:email
 * Retrieve customer orders with strict authorization guard
 */
PaymentRouter.get("/orders/:email", authenticateToken, async (req, res) => {
  try {
    const requestedEmail = req.params.email;
    const isOwner = req.user.email.toLowerCase() === requestedEmail.toLowerCase();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view orders for this user.",
      });
    }

    const orders = await OrderModel.find({ userEmail: requestedEmail })
      .populate("product")
      .populate("providerId", "name email phone")
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * PUT /payment/orders/:id/cancel
 * Customer or Admin cancellation with atomic inventory release and honest refund tracking
 */
PaymentRouter.put("/orders/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id).populate("product");
    if (!order) return res.status(404).json({ success: false, message: "Rental order not found." });

    const isCustomer = order.userEmail === req.user.email;
    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this rental request." });
    }

    // State machine check: cannot cancel active, completed, or already cancelled orders
    if (order.requestStatus === "Active" || order.requestStatus === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a rental that is already active or completed.",
      });
    }

    if (order.requestStatus === "Cancelled" || order.requestStatus === "Declined") {
      return res.status(400).json({
        success: false,
        message: `Rental request is already ${order.requestStatus.toLowerCase()}.`,
      });
    }

    const now = new Date();
    order.requestStatus = "Cancelled";
    order.status = "Cancelled";
    order.cancelledAt = now;
    order.cancelledBy = isAdmin ? "admin" : "customer";

    // Honest refund accounting: Do not mark REFUNDED until actually completed!
    if (order.paymentStatus === "PAID") {
      order.paymentStatus = "REFUND_PENDING";
      order.refundStatus = "MANUAL_REFUND_REQUIRED";
      order.refundAmount = order.totalAmount;
      order.refundReason = `Cancelled by ${order.cancelledBy}`;
      order.refundInitiatedAt = now;
      order.depositStatus = "RELEASE_PENDING";
    } else {
      order.paymentStatus = "CANCELLED";
      order.refundStatus = "NOT_REQUESTED";
      order.depositStatus = "NOT_APPLICABLE";
    }

    await order.save();

    // Concurrency-safe atomic inventory release
    if (order.product) {
      const prodId = order.product._id || order.product;
      await atomicReleaseDates(prodId, order._id);
    }

    res.json({
      success: true,
      message: "Rental request successfully cancelled. Calendar dates released.",
      order,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * PUT /payment/orders/:id/deposit
 * Security deposit settlement by provider or admin
 */
PaymentRouter.put("/orders/:id/deposit", authenticateToken, async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id).populate("product");
    if (!order) return res.status(404).json({ success: false, message: "Rental order not found." });

    const isOwner =
      order.providerId?.toString() === req.user._id.toString() ||
      order.product?.providerId?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to update security deposit on this order." });
    }

    const { action, deductionAmount, reason } = req.body;
    const maxDeposit = Number(order.securityDeposit) || 0;

    if (action === "release") {
      // Honest deposit status: release pending verified disbursement
      order.depositStatus = "RELEASE_PENDING";
      order.depositDeductionAmount = 0;
      order.depositDeductionReason = "";
    } else if (action === "deduct") {
      const deduction = Math.min(maxDeposit, Math.max(0, Number(deductionAmount) || 0));
      order.depositStatus = deduction >= maxDeposit ? "DEDUCTED" : "PARTIALLY_DEDUCTED";
      order.depositDeductionAmount = deduction;
      order.depositDeductionReason = reason || "Garment damage or late return deduction";
    } else {
      return res.status(400).json({ success: false, message: "Invalid deposit action. Must be 'release' or 'deduct'." });
    }

    await order.save();
    res.json({
      success: true,
      message: `Deposit updated to ${order.depositStatus}`,
      order,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * PUT /payment/orders/:id/refund/manual-confirm
 * Admin verification and finalization of manual refunds
 */
PaymentRouter.put("/orders/:id/refund/manual-confirm", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Rental order not found." });

    if (order.refundStatus === "SUCCEEDED") {
      return res.status(400).json({ success: false, message: "Refund has already been confirmed for this order." });
    }

    const now = new Date();
    order.refundStatus = "SUCCEEDED";
    order.paymentStatus = "REFUNDED";
    order.depositStatus = "REFUNDED";
    order.refundCompletedAt = now;
    order.manualRefundNotes = req.body.notes || "Admin verified manual refund completion.";
    order.manualRefundProcessedBy = req.user._id;
    order.manualRefundProcessedAt = now;

    await order.save();

    res.json({
      success: true,
      message: "Refund marked as SUCCEEDED with verified administrative audit trail.",
      order,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /payment/webhook & POST /payment/callback
 * Secure server-to-server webhook callback for PhonePe v1
 * Reconciles payments asynchronously with SHA256 checksum verification
 */
const handlePhonePeWebhook = async (req, res) => {
  try {
    const rawVerify = req.headers["x-verify"] || req.headers["X-Verify"] || req.headers["X-VERIFY"];
    const { response: base64Response } = req.body || {};

    if (!base64Response) {
      return res.status(400).json({ success: false, message: "Missing webhook response payload." });
    }

    // Verify SHA-256 Checksum Signature: SHA256(base64Response + salt) + ### + index
    const salt = config.KEY;
    const index = config.INDEX;
    const expectedChecksum = createHash("sha256")
      .update(`${base64Response}${salt}`)
      .digest("hex");
    const expectedXVerify = `${expectedChecksum}###${index}`;

    const isMockSignature =
      isMockAllowed() && (req.headers["x-mock-test"] === "true" || rawVerify === "mock_signature");

    if (rawVerify !== expectedXVerify && !isMockSignature) {
      console.error("[SECURITY ALERT] Invalid webhook signature detected on PhonePe callback.");
      return res.status(401).json({ success: false, message: "Invalid webhook signature." });
    }

    // Decode Base64 JSON Payload
    let decoded;
    try {
      const decodedStr = Buffer.from(base64Response, "base64").toString("utf-8");
      decoded = JSON.parse(decodedStr);
    } catch (parseErr) {
      console.error("Failed to parse base64 webhook payload:", parseErr.message);
      return res.status(400).json({ success: false, message: "Malformed webhook payload." });
    }

    const { code, data } = decoded;
    const merchantTxnId = data?.merchantTransactionId;
    const gatewayAmountPaise = Number(data?.amount) || 0;

    if (!merchantTxnId) {
      return res.status(400).json({ success: false, message: "Missing merchantTransactionId in webhook data." });
    }

    console.log(`[WEBHOOK RECEIVED] Processing notification for txn ${merchantTxnId}, code: ${code}`);

    // IDEMPOTENCY CHECK
    const existingOrder = await OrderModel.findOne({ transactionId: merchantTxnId });

    if (existingOrder && existingOrder.paymentStatus === "PAID") {
      console.log(`[WEBHOOK IDEMPOTENT] Order ${existingOrder._id} already finalized as PAID.`);
      return res.status(200).json({ success: true, message: "Webhook processed (idempotent duplicate)." });
    }

    if (code === "PAYMENT_SUCCESS") {
      let product = null;
      let startDate, endDate, pricing;

      if (existingOrder) {
        product = await productModel.findById(existingOrder.product);
        startDate = existingOrder.rentalStartDate;
        endDate = existingOrder.rentalEndDate;
        pricing = {
          days: existingOrder.rentalDays,
          securityDeposit: existingOrder.securityDeposit,
          rentalFee: existingOrder.rentalFee,
          totalAmount: existingOrder.totalAmount,
        };
      }

      if (product) {
        const expectedPaise = Math.round(pricing.totalAmount * 100);

        // Verify gateway amount matches server price
        if (gatewayAmountPaise !== expectedPaise) {
          console.error(`[WEBHOOK ALERT] Amount mismatch: Gateway ${gatewayAmountPaise} vs Server ${expectedPaise}`);
          existingOrder.paymentStatus = "PAYMENT_AMOUNT_MISMATCH";
          existingOrder.status = "Failed";
          existingOrder.requestStatus = "Declined";
          existingOrder.refundStatus = "MANUAL_REFUND_REQUIRED";
          existingOrder.refundAmount = gatewayAmountPaise / 100;
          await existingOrder.save();
          return res.status(200).json({ success: true, message: "Amount mismatch recorded for refund." });
        }

        // Concurrency-safe atomic inventory reservation
        const reservationResult = await atomicReserveDates(product._id, startDate, endDate, existingOrder._id);

        if (reservationResult.success) {
          existingOrder.paymentStatus = "PAID";
          existingOrder.status = "Processing";
          existingOrder.requestStatus = "Pending";
          await existingOrder.save();
          console.log(`[WEBHOOK SUCCESS] Order ${existingOrder._id} successfully marked PAID via server webhook.`);
        } else {
          console.warn(`[WEBHOOK CONCURRENT CONFLICT] Dates unavailable for order ${existingOrder._id}. Queued for refund.`);
          existingOrder.paymentStatus = "REFUND_REQUIRED";
          existingOrder.status = "Failed";
          existingOrder.requestStatus = "Declined";
          existingOrder.refundStatus = "MANUAL_REFUND_REQUIRED";
          existingOrder.refundAmount = pricing.totalAmount;
          existingOrder.refundReason = "CONCURRENT_BOOKING_CONFLICT";
          existingOrder.refundInitiatedAt = new Date();
          await existingOrder.save();
        }
      }
    } else {
      // Gateway reported failure or decline
      if (existingOrder) {
        existingOrder.paymentStatus = "FAILED";
        existingOrder.status = "Failed";
        existingOrder.requestStatus = "Declined";
        existingOrder.failureReason = decoded.message || "Payment declined by gateway.";
        await existingOrder.save();
        console.log(`[WEBHOOK FAILED] Order ${existingOrder._id} marked FAILED via webhook.`);
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed successfully." });
  } catch (webhookErr) {
    console.error("Critical webhook processing error:", webhookErr);
    return res.status(500).json({ success: false, message: "Internal webhook processing error." });
  }
};

PaymentRouter.post("/webhook", handlePhonePeWebhook);
PaymentRouter.post("/callback", handlePhonePeWebhook);
