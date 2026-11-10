import ProductModel from "../models/productModel.js";

/**
 * Check if a requested rental date range overlaps with any existing booked range.
 * Interval [s1, e1] overlaps with [s2, e2] iff s1 <= e2 && s2 <= e1.
 *
 * @param {Array} bookedDates Array of { startDate, endDate, orderId }
 * @param {Date} reqStart Requested rental start date
 * @param {Date} reqEnd Requested rental end date
 * @param {string|ObjectId} excludeOrderId Optional orderId to exclude (for modifications)
 * @returns {Object|null} Conflicting booking or null
 */
export function findDateConflict(bookedDates, reqStart, reqEnd, excludeOrderId = null) {
  if (!Array.isArray(bookedDates) || bookedDates.length === 0) return null;

  const startMs = reqStart.getTime();
  const endMs = reqEnd.getTime();

  for (const booking of bookedDates) {
    if (excludeOrderId && booking.orderId && String(booking.orderId) === String(excludeOrderId)) {
      continue;
    }
    const bStartMs = new Date(booking.startDate).getTime();
    const bEndMs = new Date(booking.endDate).getTime();

    // Overlap condition: startMs <= bEndMs && bStartMs <= endMs
    if (startMs <= bEndMs && bStartMs <= endMs) {
      return booking;
    }
  }
  return null;
}

/**
 * Calculate rental pricing strictly on the server to prevent client-side tampering.
 *
 * @param {Object} product Mongoose product document
 * @param {Date} startDate Rental start date
 * @param {Date} endDate Rental end date
 * @param {number} fallbackDays Quantity or days if dates are missing
 * @returns {Object} { days, pricePerDay, securityDeposit, rentalFee, totalAmount }
 */
export function calculateServerPricing(product, startDate, endDate, fallbackDays = 1) {
  let days = Number(fallbackDays) || 1;
  if (startDate && endDate) {
    const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
    days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  const pricePerDay = Number(product.rentalPricePerDay || product.price) || 0;
  const rawDeposit = product.securityDeposit != null ? product.securityDeposit : product.advance;
  const securityDeposit = Number(rawDeposit) || 0;
  const rentalFee = pricePerDay * days;
  const totalAmount = rentalFee + securityDeposit;

  return {
    days,
    pricePerDay,
    securityDeposit,
    rentalFee,
    totalAmount,
  };
}

/**
 * Concurrency-safe atomic inventory reservation at the database level.
 * Uses atomic findOneAndUpdate with $not: { $elemMatch: { ... } } to ensure
 * two simultaneous requests can NEVER both reserve overlapping dates.
 *
 * @param {string|ObjectId} productId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string|ObjectId} orderId Temporary or confirmed Order ID
 * @returns {Promise<{ success: boolean, product?: Object, reason?: string }>}
 */
export async function atomicReserveDates(productId, startDate, endDate, orderId) {
  try {
    const updatedProduct = await ProductModel.findOneAndUpdate(
      {
        _id: productId,
        availability: { $ne: false },
        status: { $ne: "inactive" },
        bookedDates: {
          $not: {
            $elemMatch: {
              startDate: { $lte: endDate },
              endDate: { $gte: startDate },
            },
          },
        },
      },
      {
        $push: {
          bookedDates: {
            startDate: startDate,
            endDate: endDate,
            orderId: orderId,
          },
        },
      },
      { new: true }
    );

    if (!updatedProduct) {
      // Either product does not exist, is inactive/paused, or date conflict occurred
      const exists = await ProductModel.findById(productId);
      if (!exists) {
        return { success: false, reason: "PRODUCT_NOT_FOUND" };
      }
      if (exists.availability === false || exists.status === "inactive") {
        return { success: false, reason: "GARMENT_UNAVAILABLE" };
      }
      return { success: false, reason: "DATE_CONFLICT" };
    }

    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error("Atomic reservation error:", error);
    return { success: false, reason: error.message };
  }
}

/**
 * Release reserved calendar dates atomically upon cancellation, decline, or failure.
 *
 * @param {string|ObjectId} productId
 * @param {string|ObjectId} orderId
 * @returns {Promise<{ success: boolean, product?: Object }>}
 */
export async function atomicReleaseDates(productId, orderId) {
  try {
    if (!productId || !orderId) return { success: false };
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      {
        $pull: { bookedDates: { orderId: orderId } },
      },
      { new: true }
    );
    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error("Atomic release error:", error);
    return { success: false, reason: error.message };
  }
}
