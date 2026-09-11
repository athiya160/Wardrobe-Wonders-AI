import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";

import UserModel from "./models/UserModel.js";
import UserRouter from "./routes/user.router.js";
import { authenticateToken, requireRole } from "./middleware/auth.js";

dotenv.config();

const PORT = 4005; // Use a dedicated port for testing
const TEST_BASE_URL = `http://localhost:${PORT}`;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";

const app = express();
app.use(bodyParser.json());
app.use(UserRouter);

// Test protected role route
app.get("/test/provider-only", authenticateToken, requireRole("provider"), (req, res) => {
  res.json({ status: true, message: "Welcome Provider", user: req.user });
});

app.get("/test/admin-only", authenticateToken, requireRole("admin"), (req, res) => {
  res.json({ status: true, message: "Welcome Admin", user: req.user });
});

let server;

async function runTestSuite() {
  console.log("\n==========================================");
  console.log("  DRESSR AUTHENTICATION SYSTEM TEST SUITE  ");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${description}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    server = app.listen(PORT);
    console.log(`Test server running on port ${PORT}.\n`);

    const timestamp = Date.now();
    const customerEmail = `test_cust_${timestamp}@example.com`;
    const providerEmail = `test_prov_${timestamp}@example.com`;
    const legacyEmail = `test_legacy_${timestamp}@example.com`;
    const testPassword = "Password@123";

    // Clean up any potential prior test records
    await UserModel.deleteMany({
      email: { $in: [customerEmail, providerEmail, legacyEmail, "admin_hack@example.com"] },
    });

    // 1. Customer Registration
    console.log("--- TEST 1: Customer Registration ---");
    const custRegRes = await axios.post(`${TEST_BASE_URL}/register`, {
      name: "Alice Customer",
      email: customerEmail,
      phone: "9876543210",
      password: testPassword,
      role: "customer",
    });

    assert(custRegRes.status === 200, "Customer registration returns HTTP 200");
    assert(custRegRes.data.status === true, "Response status is true");
    assert(custRegRes.data.user.role === "customer", "Registered user role is 'customer'");
    assert(custRegRes.data.user.password === undefined || custRegRes.data.user.password === null, "Password is not returned");
    assert(custRegRes.data.user.passwordHash === undefined, "passwordHash is NOT exposed in response");

    const custDbUser = await UserModel.findOne({ email: customerEmail });
    assert(!!custDbUser.passwordHash, "passwordHash is persisted in MongoDB");
    assert(custDbUser.password === undefined, "Plaintext password is NOT persisted");
    const isBcrypt = await bcrypt.compare(testPassword, custDbUser.passwordHash);
    assert(isBcrypt, "Stored passwordHash is a valid bcrypt hash");

    // 2. Provider Registration
    console.log("\n--- TEST 2: Provider Registration ---");
    const provRegRes = await axios.post(`${TEST_BASE_URL}/register`, {
      name: "Bob Provider",
      email: providerEmail,
      phone: "9876543211",
      password: testPassword,
      role: "provider",
    });

    assert(provRegRes.status === 200, "Provider registration returns HTTP 200");
    assert(provRegRes.data.user.role === "provider", "Registered user role is 'provider'");
    assert(provRegRes.data.user.passwordHash === undefined, "passwordHash is NOT exposed for provider");

    // 3. Reject Admin Registration via Public Signup
    console.log("\n--- TEST 3: Reject Admin Registration ---");
    try {
      await axios.post(`${TEST_BASE_URL}/register`, {
        name: "Hacker Admin",
        email: "admin_hack@example.com",
        password: testPassword,
        role: "admin",
      });
      assert(false, "Admin registration should have failed");
    } catch (err) {
      assert(err.response.status === 400, "Public admin registration rejected with HTTP 400");
      assert(
        err.response.data.message.includes("Admin accounts cannot be registered"),
        "Informative error message returned"
      );
    }

    // 4. Reject Duplicate Email
    console.log("\n--- TEST 4: Reject Duplicate Email ---");
    try {
      await axios.post(`${TEST_BASE_URL}/register`, {
        name: "Duplicate User",
        email: customerEmail,
        password: testPassword,
      });
      assert(false, "Duplicate email registration should have failed");
    } catch (err) {
      assert(err.response.status === 400, "Duplicate email rejected with HTTP 400");
      assert(
        err.response.data.message.includes("already exists"),
        "Duplicate rejection message verified"
      );
    }

    // 5. Login with Correct Credentials
    console.log("\n--- TEST 5: Login with Correct Password ---");
    const custLoginRes = await axios.post(`${TEST_BASE_URL}/login`, {
      email: customerEmail,
      password: testPassword,
    });

    assert(custLoginRes.status === 200, "Login returns HTTP 200");
    assert(custLoginRes.data.status === true, "Login status is true");
    assert(!!custLoginRes.data.token, "JWT token is returned");
    assert(custLoginRes.data.user.role === "customer", "User role in login response is 'customer'");
    assert(custLoginRes.data.user.passwordHash === undefined, "passwordHash is NOT in login response");
    const customerToken = custLoginRes.data.token;

    // 6. Login with Wrong Password
    console.log("\n--- TEST 6: Login with Wrong Password ---");
    try {
      await axios.post(`${TEST_BASE_URL}/login`, {
        email: customerEmail,
        password: "WrongPassword999",
      });
      assert(false, "Wrong password login should have failed");
    } catch (err) {
      assert(err.response.status === 401, "Wrong password rejected with HTTP 401");
      assert(err.response.data.status === false, "Status is false");
    }

    // 7. JWT Payload Verification
    console.log("\n--- TEST 7: JWT Payload Verification ---");
    const jwtSecret = process.env.JWT_SECRET || process.env.SECRET || "change_this_in_production";
    const decoded = jwt.verify(customerToken, jwtSecret);
    assert(!!decoded.id, "JWT contains user id");
    assert(decoded.role === "customer", "JWT contains user role ('customer')");
    assert(decoded.email === customerEmail, "JWT contains user email");

    // 8. Protected Endpoint - Reject Missing Token
    console.log("\n--- TEST 8: Protected Route Rejects Missing Token ---");
    try {
      await axios.get(`${TEST_BASE_URL}/auth/me`);
      assert(false, "Protected route should reject request without token");
    } catch (err) {
      assert(err.response.status === 401, "/auth/me returns HTTP 401 when token is missing");
    }

    // 9. Protected Endpoint - Accepts Valid Token
    console.log("\n--- TEST 9: Protected Route Accepts Valid Token ---");
    const meRes = await axios.get(`${TEST_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    assert(meRes.status === 200, "/auth/me returns HTTP 200 with valid token");
    assert(meRes.data.user.email === customerEmail, "Current user email matches");
    assert(meRes.data.user.role === "customer", "Current user role matches");
    assert(meRes.data.user.passwordHash === undefined, "passwordHash is not exposed in /auth/me");

    // 10. Role Protection Checks
    console.log("\n--- TEST 10: Role-Based Access Control ---");
    // Customer accessing provider route should be rejected with 403
    try {
      await axios.get(`${TEST_BASE_URL}/test/provider-only`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert(false, "Customer should NOT be allowed to access provider route");
    } catch (err) {
      assert(err.response.status === 403, "Customer access to provider route blocked with HTTP 403");
    }

    // Provider accessing provider route should succeed
    const provLoginRes = await axios.post(`${TEST_BASE_URL}/login`, {
      email: providerEmail,
      password: testPassword,
    });
    const providerToken = provLoginRes.data.token;

    const provAccessRes = await axios.get(`${TEST_BASE_URL}/test/provider-only`, {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    assert(provAccessRes.status === 200, "Provider access to provider route succeeded with HTTP 200");

    // 11. Backward Compatibility & Plaintext Password Auto-Migration
    console.log("\n--- TEST 11: Backward Compatibility & Plaintext Auto-Migration ---");
    // Insert a legacy user with plaintext password directly into MongoDB
    const legacyPlaintext = "LegacyPass123";
    await mongoose.connection.db.collection("users").insertOne({
      name: "Legacy User",
      email: legacyEmail,
      password: legacyPlaintext, // Plaintext password directly in DB
      type: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Attempt login with plaintext password
    const legacyLoginRes = await axios.post(`${TEST_BASE_URL}/login`, {
      email: legacyEmail,
      password: legacyPlaintext,
    });

    assert(legacyLoginRes.status === 200, "Legacy account login succeeded with plaintext password");
    assert(!!legacyLoginRes.data.token, "JWT token issued for legacy account");

    // Verify DB record has been auto-migrated to bcrypt hash
    const migratedUser = await UserModel.findOne({ email: legacyEmail });
    assert(!!migratedUser.passwordHash, "Legacy account now has passwordHash");
    assert(migratedUser.password === undefined, "Plaintext password was cleared from MongoDB");
    const migratedHashValid = await bcrypt.compare(legacyPlaintext, migratedUser.passwordHash);
    assert(migratedHashValid, "New passwordHash correctly validates password via bcrypt");

    // Clean up test records
    await UserModel.deleteMany({
      email: { $in: [customerEmail, providerEmail, legacyEmail] },
    });
    console.log("\nCleaned up all test records.");

  } catch (suiteError) {
    console.error("Test suite runtime error:", suiteError);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log("\n==========================================");
    console.log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("==========================================\n");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTestSuite();
