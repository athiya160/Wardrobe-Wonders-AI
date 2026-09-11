import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import UserModel from "./models/UserModel.js";
import UserRouter from "./routes/user.router.js";

dotenv.config();

const PORT = 4008;
const BASE_URL = `http://localhost:${PORT}`;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dress_rental";

const app = express();
app.use(bodyParser.json());
app.use(UserRouter);

async function runManualTestCheck() {
  await mongoose.connect(MONGO_URI);
  const server = app.listen(PORT);

  const custEmail = "customer_test_2026@example.com";
  const provEmail = "provider_test_2026@example.com";

  // Clean prior tests if any
  await UserModel.deleteMany({ email: { $in: [custEmail, provEmail] } });

  console.log("=== MANUAL TEST VERIFICATION ===\n");

  // TEST 1: Customer Signup & Login
  console.log("TEST 1 — Customer Signup & Login");
  const custReg = await axios.post(`${BASE_URL}/register`, {
    name: "Test Customer",
    email: custEmail,
    phone: "9876543210",
    password: "TestCustomer@123",
    role: "customer",
  });
  console.log("Signup Response:", {
    status: custReg.data.status,
    role: custReg.data.user.role,
    hasToken: !!custReg.data.token,
    hasPasswordHash: !!custReg.data.user.passwordHash,
  });

  const custLogin = await axios.post(`${BASE_URL}/login`, {
    email: custEmail,
    password: "TestCustomer@123",
  });
  console.log("Login Response:", {
    status: custLogin.data.status,
    role: custLogin.data.user.role,
    routeTarget: custLogin.data.user.role === "customer" ? "/" : "other",
    tokenIssued: !!custLogin.data.token,
  });

  // TEST 2: Provider Signup & Login
  console.log("\nTEST 2 — Provider Signup & Login");
  const provReg = await axios.post(`${BASE_URL}/register`, {
    name: "Test Provider",
    email: provEmail,
    phone: "9876543211",
    password: "TestProvider@123",
    role: "provider",
  });
  console.log("Signup Response:", {
    status: provReg.data.status,
    role: provReg.data.user.role,
    hasToken: !!provReg.data.token,
    hasPasswordHash: !!provReg.data.user.passwordHash,
  });

  const provLogin = await axios.post(`${BASE_URL}/login`, {
    email: provEmail,
    password: "TestProvider@123",
  });
  console.log("Login Response:", {
    status: provLogin.data.status,
    role: provLogin.data.user.role,
    routeTarget: provLogin.data.user.role === "provider" ? "/provider-dashboard" : "other",
    tokenIssued: !!provLogin.data.token,
  });

  // TEST 3: Wrong Password
  console.log("\nTEST 3 — Wrong Password Rejection");
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: provEmail,
      password: "wrongpassword",
    });
    console.log("FAIL: Wrong password should have been rejected");
  } catch (err) {
    console.log("Wrong Password Response:", {
      httpStatus: err.response.status,
      status: err.response.data.status,
      message: err.response.data.message,
    });
  }

  // TEST 4: Duplicate Account Rejection
  console.log("\nTEST 4 — Duplicate Account Rejection");
  try {
    await axios.post(`${BASE_URL}/register`, {
      name: "Test Duplicate",
      email: custEmail,
      password: "TestCustomer@123",
    });
    console.log("FAIL: Duplicate email should have been rejected");
  } catch (err) {
    console.log("Duplicate Email Response:", {
      httpStatus: err.response.status,
      status: err.response.data.status,
      message: err.response.data.message,
    });
  }

  server.close();
  await mongoose.disconnect();
  console.log("\n=== MANUAL TESTS COMPLETED SUCCESSFULLY ===");
}

runManualTestCheck().catch(console.error);
