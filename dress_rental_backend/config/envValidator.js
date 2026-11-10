/**
 * Environment & Secrets Security Validator
 * Enforces production invariants, rejects insecure defaults, and prevents mock payments in production.
 */

const INSECURE_JWT_SECRETS = new Set([
  "change_this_in_production",
  "secret",
  "jwt_secret",
  "test_secret",
  "123456",
  "admin",
  "password",
  "<GENERATE_A_LONG_RANDOM_SECRET>",
]);

/**
 * Validates the runtime environment on application startup.
 * Throws a descriptive error if production invariants are violated.
 */
export function validateEnvironment() {
  const isProd = process.env.NODE_ENV === "production";
  const jwtSecret = (process.env.JWT_SECRET || process.env.SECRET || "").trim();
  const mongoUri = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

  // 1. Production JWT Secret Invariant
  if (isProd) {
    if (!jwtSecret) {
      throw new Error(
        "[FATAL SECURITY ERROR] Missing JWT_SECRET environment variable in production. " +
        "The server will not start without a secure JWT signing secret."
      );
    }
    if (INSECURE_JWT_SECRETS.has(jwtSecret.toLowerCase()) || jwtSecret.length < 32) {
      throw new Error(
        "[FATAL SECURITY ERROR] Insecure or short JWT_SECRET detected in production. " +
        "JWT_SECRET must be at least 32 characters long and cannot be a default or known placeholder."
      );
    }
  } else if (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret.toLowerCase())) {
    console.warn(
      "[SECURITY WARNING] Running with default or insecure JWT_SECRET in non-production mode. " +
      "Set a dedicated JWT_SECRET in your .env file."
    );
  }

  // 2. Production Database URI Invariant
  if (isProd) {
    if (!mongoUri) {
      throw new Error(
        "[FATAL SECURITY ERROR] Missing MONGO_URI or MONGODB_URI in production environment."
      );
    }
    if (mongoUri.includes("localhost") || mongoUri.includes("127.0.0.1")) {
      console.warn(
        "[SECURITY WARNING] MONGO_URI references localhost in production mode. " +
        "Ensure MongoDB Atlas or a dedicated production database is configured."
      );
    }
  }

  // 3. Mock Payments Invariant
  if (isProd && process.env.ENABLE_MOCK_PAYMENTS === "true") {
    throw new Error(
      "[FATAL SECURITY ERROR] ENABLE_MOCK_PAYMENTS cannot be active when NODE_ENV=production. " +
      "Mock payments bypass actual gateway verification and are strictly prohibited in production."
    );
  }

  // 4. PhonePe UAT Key Invariant
  if (isProd) {
    const mid = process.env.PHONEPE_MERCHANT_ID || process.env.PHONEPE_MID;
    if (!mid || mid === "PGTESTPAYUAT" || mid === "PGTESTPAYUAT86") {
      console.warn(
        "[SECURITY NOTICE] PhonePe is configured with UAT test credentials (PGTESTPAYUAT) or unset in production. " +
        "Production transactions will not process real money until production credentials are provided."
      );
    }
  }

  return {
    isProduction: isProd,
    hasSecureJwt: Boolean(jwtSecret && !INSECURE_JWT_SECRETS.has(jwtSecret.toLowerCase()) && jwtSecret.length >= 32),
    hasDbUri: Boolean(mongoUri),
    mockPaymentsForbidden: isProd,
  };
}

/**
 * Centralized, secure JWT secret retrieval.
 * Eliminates silent fallbacks to insecure defaults in production.
 */
export function getJwtSecret() {
  const isProd = process.env.NODE_ENV === "production";
  const jwtSecret = (process.env.JWT_SECRET || process.env.SECRET || "").trim();

  if (isProd) {
    if (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret.toLowerCase()) || jwtSecret.length < 32) {
      throw new Error("[SECURITY ERROR] Attempted to use invalid or insecure JWT_SECRET in production.");
    }
    return jwtSecret;
  }

  // Safe fallback for local automated test suites and development ONLY
  return jwtSecret || "wardrobe_wonders_development_secret_only";
}
