import dotenv from "dotenv";
dotenv.config();

const isProdEnv = process.env.NODE_ENV === "production";
const useProdGateway = process.env.PHONEPE_ENV === "production";

export const config = {
  // Merchant Identifier & Keys
  MID: process.env.PHONEPE_MERCHANT_ID || process.env.PHONEPE_MID || (isProdEnv ? "" : "PGTESTPAYUAT86"),
  KEY: process.env.PHONEPE_SALT_KEY || (isProdEnv ? "" : "96434309-7796-489d-8924-ab56988a6076"),
  INDEX: Number(process.env.PHONEPE_SALT_INDEX) || 1,

  // Host & Endpoints
  HOST: process.env.PHONEPE_HOST || (useProdGateway ? "api.phonepe.com" : "api-preprod.phonepe.com"),
  PHONE_PE_ENDPOINT: process.env.PHONEPE_PAY_ENDPOINT || (useProdGateway ? "/apis/hermes/pg/v1/pay" : "/apis/pg-sandbox/pg/v1/pay"),
  PAYMENT_ENDPOINT: "pg/v1/pay",
  BASE_URL: process.env.PHONEPE_BASE_URL || (useProdGateway ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox"),

  // Dynamic Callbacks & Redirects
  CALLBACK_URL:
    process.env.PHONEPE_CALLBACK_URL ||
    `${(process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "")}/payment/callback`,
  REDIRECT_URL:
    process.env.PHONEPE_REDIRECT_URL ||
    `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")}/order-success`,

  APP_ID: process.env.PHONEPE_APP_ID || "",
  isProductionGateway: useProdGateway,
};
