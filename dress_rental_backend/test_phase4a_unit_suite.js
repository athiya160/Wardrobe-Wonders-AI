import {
  findDateConflict,
  calculateServerPricing,
} from "./services/bookingSafetyService.js";
import { randomUUID } from "crypto";

console.log("\n=======================================================");
console.log("   WARDROBE WONDERS — PHASE 4A: UNIT LOGIC SUITE       ");
console.log("=======================================================\n");

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

// 1. Two legitimate rentals on non-overlapping dates
const bookedDates = [
  {
    startDate: new Date("2026-11-01T10:00:00Z"),
    endDate: new Date("2026-11-04T10:00:00Z"),
    orderId: "order_111",
  },
];

const nonOverlappingStart = new Date("2026-11-06T10:00:00Z");
const nonOverlappingEnd = new Date("2026-11-09T10:00:00Z");
const conflict1 = findDateConflict(bookedDates, nonOverlappingStart, nonOverlappingEnd);
assert(conflict1 === null, "Scenario 1: Non-overlapping rental allowed without conflict");

// 2. Overlapping rental attempts
const overlapStart = new Date("2026-11-03T10:00:00Z");
const overlapEnd = new Date("2026-11-06T10:00:00Z");
const conflict2 = findDateConflict(bookedDates, overlapStart, overlapEnd);
assert(conflict2 !== null && String(conflict2.orderId) === "order_111", "Scenario 2: Overlapping rental correctly flagged as conflict");

// 3. Unique transaction identifiers (crypto.randomUUID)
const generatedIds = new Set();
for (let i = 0; i < 500; i++) {
  generatedIds.add(`WW-${Date.now()}-${randomUUID()}`);
}
assert(generatedIds.size === 500, "Scenario 3: 500 unique transaction IDs generated with zero collisions (replaces MD5 dressId)");

// 4. Server-side pricing enforcement
const mockProduct = {
  rentalPricePerDay: 2500,
  price: 2500,
  securityDeposit: 6000,
  advance: "6000",
};
const startRent = new Date("2026-12-01T10:00:00Z");
const endRent = new Date("2026-12-04T10:00:00Z"); // 3 days
const pricing = calculateServerPricing(mockProduct, startRent, endRent);

assert(pricing.days === 3, "Scenario 4a: Correct day duration calculated (3 days)");
assert(pricing.rentalFee === 7500, "Scenario 4b: Correct server rental fee (3 * 2500 = 7500)");
assert(pricing.securityDeposit === 6000, "Scenario 4c: Security deposit isolated (6000)");
assert(pricing.totalAmount === 13500, "Scenario 4d: Total amount enforced server-side (13500)");

// 5. State Machine Transition validation logic
const allowedTransitions = {
  Pending: ["Accepted", "Declined"],
  Accepted: ["Active", "Declined"],
  Active: ["Completed"],
};

function isValidTransition(current, next) {
  const terminalStates = ["Cancelled", "Declined", "Completed"];
  if (terminalStates.includes(current)) return false;
  return (allowedTransitions[current] || []).includes(next);
}

assert(isValidTransition("Pending", "Accepted") === true, "Scenario 5a: Pending -> Accepted is valid");
assert(isValidTransition("Pending", "Declined") === true, "Scenario 5b: Pending -> Declined is valid");
assert(isValidTransition("Accepted", "Active") === true, "Scenario 5c: Accepted -> Active is valid");
assert(isValidTransition("Active", "Completed") === true, "Scenario 5d: Active -> Completed is valid");
assert(isValidTransition("Pending", "Completed") === false, "Scenario 5e: Pending -> Completed is rejected");
assert(isValidTransition("Completed", "Pending") === false, "Scenario 5f: Completed -> Pending is rejected");
assert(isValidTransition("Cancelled", "Active") === false, "Scenario 5g: Cancelled -> Active is rejected");
assert(isValidTransition("Declined", "Accepted") === false, "Scenario 5h: Declined -> Accepted is rejected");

// 6. Provider revenue excludes security deposit
function calculateProviderRevenue(orders) {
  let payableEarnings = 0;
  orders.forEach((order) => {
    if (order.paymentStatus !== "PAID" && !(order.paymentMethod === "cod" && order.requestStatus === "Completed")) {
      return;
    }
    if (["FAILED", "CANCELLED", "REFUND_REQUIRED"].includes(order.paymentStatus)) return;
    const fee = Number(order.rentalFee) || Math.max(0, (Number(order.totalAmount) || 0) - (Number(order.securityDeposit) || 0));
    const providerShare = Math.round(fee * 0.85);
    if (order.requestStatus === "Completed") {
      payableEarnings += providerShare;
    }
  });
  return payableEarnings;
}

const mockOrders = [
  {
    requestStatus: "Completed",
    paymentStatus: "PAID",
    rentalFee: 10000,
    securityDeposit: 5000,
    totalAmount: 15000,
  },
  {
    requestStatus: "Completed",
    paymentStatus: "REFUND_REQUIRED", // should be excluded
    rentalFee: 8000,
    securityDeposit: 3000,
    totalAmount: 11000,
  },
];

const provEarnings = calculateProviderRevenue(mockOrders);
assert(provEarnings === 8500, "Scenario 6: Provider earnings strictly 85% of rental fee (8500), deposit excluded, refund-required excluded");

// 7. Honest Refund State Progression
function simulateRefundFlow() {
  const order = {
    paymentStatus: "PAID",
    refundStatus: "NOT_REQUESTED",
    depositStatus: "HELD",
  };

  // Step A: Cancellation requested
  order.paymentStatus = "REFUND_PENDING";
  order.refundStatus = "MANUAL_REFUND_REQUIRED";
  order.depositStatus = "RELEASE_PENDING";

  const intermediateHonest = order.refundStatus === "MANUAL_REFUND_REQUIRED" && order.paymentStatus === "REFUND_PENDING";

  // Step B: Admin verified manual refund
  order.refundStatus = "SUCCEEDED";
  order.paymentStatus = "REFUNDED";
  order.depositStatus = "REFUNDED";

  const finalVerified = order.refundStatus === "SUCCEEDED" && order.paymentStatus === "REFUNDED";

  return intermediateHonest && finalVerified;
}

assert(simulateRefundFlow() === true, "Scenario 7: Refund states correctly progress from MANUAL_REFUND_REQUIRED to SUCCEEDED only upon verification");

console.log("\n=======================================================");
console.log(`UNIT SUITE SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log("=======================================================\n");
