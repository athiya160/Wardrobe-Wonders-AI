# 📋 Wardrobe Wonders (`DressR`) — Production Deployment Checklist & Configuration Guide

> **Current System Status**: **Production-Prepared MVP**  
> Core application flows, regression test suites (315 / 315 passing assertions), and client-side builds are verified.  
> Production cloud infrastructure, live payment merchant onboarding, deployment configuration, and legal counsel review remain outstanding prior to public commercial launch.

---

## 1. Complete Environment Variables Inventory

| Variable Name | Component | Required / Optional | Development Value Source | Production Value Source | Secret? | Configuration Location |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| `NODE_ENV` | Backend (`dress_rental_backend`) | Recommended | Omitted or `development` | Set to `production` | No | Cloud Dashboard (Render/Cloud Run/Railway) |
| `PORT` | Backend (`dress_rental_backend`) | Optional | `4000` | Injected dynamically by host (`$PORT`) | No | Cloud Dashboard |
| `MONGO_URI` / `MONGODB_URI` | Backend (`dress_rental_backend`) | **Required** | `mongodb://127.0.0.1:27017/dress_rental` | MongoDB Atlas cluster connection string (`mongodb+srv://...`) | **YES** | Cloud Provider Secrets / Env Settings |
| `JWT_SECRET` | Backend (`dress_rental_backend`) | **Required** | `change_this_in_production` (or `.env`) | 256-bit cryptographically random string | **YES** | Cloud Provider Secrets / Env Settings |
| `SECRET` | Backend (`dress_rental_backend`) | Optional | Fallback for legacy setups | Legacy fallback (same as `JWT_SECRET`) | **YES** | Cloud Provider Secrets / Env Settings |
| `FRONTEND_URL` / `CLIENT_ORIGIN` | Backend (`dress_rental_backend`) | **Required** | `http://localhost:5173,http://localhost:3000` | Deployed Frontend HTTPS URL (e.g., `https://wardrobe-wonders.vercel.app`) | No | Cloud Provider Env Settings |
| `FASTAPI_URL` | Backend (`dress_rental_backend`) | Optional | `http://127.0.0.1:8001` | Deployed FastAPI AI microservice HTTPS URL (`https://<ai-service-domain>`) | No | Cloud Provider Env Settings |
| `CLOUDINARY_CLOUD_NAME` | Backend (`dress_rental_backend`) | Optional (Recommended) | Omitted (defaults to local disk storage `/uploads`) | Cloudinary Account Dashboard | No | Cloud Provider Env Settings |
| `CLOUDINARY_API_KEY` | Backend (`dress_rental_backend`) | Optional (Recommended) | Omitted | Cloudinary API Key | **YES** | Cloud Provider Secrets |
| `CLOUDINARY_API_SECRET` | Backend (`dress_rental_backend`) | Optional (Recommended) | Omitted | Cloudinary API Secret | **YES** | Cloud Provider Secrets |
| `DISABLE_RATE_LIMIT` | Backend (`dress_rental_backend`) | Dev/Test Only | `true` during test runs | Omitted or `false` | No | Do not set in production |
| `VITE_API_URL` | Frontend (`dress_rental`) | **Required** | `http://localhost:4000` (via fallback) | Deployed Node Backend HTTPS URL (e.g., `https://api.wardrobewonders.com`) | No | Frontend Host (Vercel/Netlify Environment Variables at build time) |
| `GROQ_API_KEY` | AI Service (`ai_service`) | **Required for AI** | `console.groq.com` API Key | Production Groq API Key | **YES** | AI Host Environment Variables / Secrets |
| `MODEL_NAME` | AI Service (`ai_service`) | Optional | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` or `mixtral-8x7b-32768` | No | AI Host Environment Variables |
| `BACKEND_URL` / `NODE_API_URL` | AI Service (`ai_service`) | **Required for FAISS** | `http://localhost:4000` | Deployed Node Backend HTTPS URL | No | AI Host Environment Variables |

---

## 2. Secret Hygiene Audit

- [x] **`.env` files Gitignored**: Root and subfolder `.gitignore` files ignore all `.env`, `.env.local`, and `.env.production` files.
- [x] **Only Templates Tracked**: Only `.env.example` files containing non-secret placeholders are tracked in Git.
- [x] **No Live Credentials in Repository**:
  - `GROQ_API_KEY`: Only references `os.getenv("GROQ_API_KEY")` and placeholders.
  - `JWT_SECRET`: Only references `process.env.JWT_SECRET` with development fallbacks.
  - `CLOUDINARY`: Only references environment variables.
  - `PGTESTPAYUAT`: Verified to be PhonePe's public UAT test sandbox identifier, not a live production credential.

---

## 3. Production CORS Configuration

The backend CORS origin validator in `middleware/security.js` is dynamically configured:

```javascript
// middleware/security.js
export const getCorsOptions = () => {
  const envOrigins = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN;
  const allowedOrigins = envOrigins
    ? envOrigins.split(",").map((origin) => origin.trim())
    : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"];

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Access from this origin is not allowed."));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-test-bypass-rate-limit"],
    credentials: true,
  };
};
```

- **In Local Development (`NODE_ENV !== "production"`)**: Allows localhost ports (5173, 3000) and curl/Postman.
- **In Production (`NODE_ENV === "production"`)**: Restricts access **strictly** to the origins listed in `FRONTEND_URL`. Unlisted origins receive a CORS rejection.

---

## 4. Frontend API Configuration

- All client-side HTTP calls route through `dress_rental/src/config/axiosConfig.js`:
  ```javascript
  export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
  ```
- **Development**: Seamlessly points to `http://localhost:4000`.
- **Production**: Vercel/Netlify injects `VITE_API_URL=https://<your-deployed-backend-api-url>` during `npm run build`. No hardcoded production URLs exist in frontend source code.

---

## 5. Backend Production Hardening

- **Reverse Proxy Support**: Configured `app.set("trust proxy", 1)` in `index.js` for proper client IP identification behind Cloud Run, Render, Railway, or AWS ALB.
- **Production Start Script**: `package.json` specifies `"start": "node index.js"` (no dependence on `nodemon` in production environments).
- **Flexible MongoDB Connection**: Supports both `MONGO_URI` and `MONGODB_URI` environment variables.
- **Health Check**: `GET /health` returns JSON uptime, service version, environment mode, and database connection state (HTTP 200 when connected, HTTP 503 when degraded).
- **OWASP Headers**: Emits `nosniff`, `SAMEORIGIN`, `XSS-Protection`, `Referrer-Policy`, and strips `X-Powered-By`. In production, emits HSTS (`Strict-Transport-Security`).
- **Error Sanitization**: Centralized error middleware ensures internal database stack traces are never sent to the client when `NODE_ENV === "production"`.

---

## 6. MongoDB Atlas Cloud Readiness

1. Create a free/dedicated cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Database Name: **`dress_rental`**.
3. Create a Database User with **Read and Write** access (`readWrite@dress_rental`).
4. Network Access: Whitelist `0.0.0.0/0` (Allow Access from Anywhere) or the specific static IPs of your backend hosting service.
5. In your backend cloud environment variables, set:
   ```env
   MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster-address>.mongodb.net/dress_rental?retryWrites=true&w=majority
   ```
6. Schema Collections automatically initialized: `users`, `products`, `orders`, `reports`.

---

## 7. Cloudinary Media Storage Readiness

- **Dual Mode**:
  - Without Cloudinary credentials: Files are written to `/uploads` on disk with static serving (great for local development).
  - With Cloudinary credentials: Files are streamed directly to Cloudinary CDN (`wardrobe_wonders/dresses` folder) and return secure HTTPS CDN URLs.
  - Zero-Crash Resiliency: If Cloudinary encounters a network failure, the backend automatically falls back to local disk storage.
- **Production Variables**:
  ```env
  CLOUDINARY_CLOUD_NAME=<YOUR_CLOUD_NAME>
  CLOUDINARY_API_KEY=<YOUR_API_KEY>
  CLOUDINARY_API_SECRET=<YOUR_API_SECRET>
  ```

---

## 8. FastAPI AI Microservice Readiness

- Located in `ai_service/`.
- Startup Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- System Architecture:
  - Vector Store: `faiss-cpu` index on product catalog embeddings.
  - LLM Engine: Groq Cloud API (`llama-3.3-70b-versatile` / `mixtral-8x7b-32768`).
  - Catalog Sync: Fetches live products from Node.js backend using `BACKEND_URL` environment variable.
- Node.js Backend calls AI microservice using `FASTAPI_URL`.
- Resilience: If the AI microservice is unreachable or sleeping, the Node.js backend falls back gracefully to deterministic rule-based fashion tags and descriptions without crashing provider listing creation.

---

## 9. Payment Readiness & Live Blockers

> [!WARNING]
> **Payment Status: DEVELOPMENT & DEMO SANDBOX ONLY**  
> The payment integration is **NOT PRODUCTION VERIFIED** for real financial transactions.

### Outstanding Payment Blockers Before Commercial Launch:
1. **Merchant KYC & Onboarding**: Production PhonePe, Razorpay, or Stripe merchant account requires verified business documentation (GST, PAN, bank account, business registration).
2. **Production Credentials**: Replace sandbox MID (`PGTESTPAYUAT`) with live production merchant ID, production salt key, and live host endpoint.
3. **Webhook Verification**: Production payments require an authenticated server-side webhook handler to prevent client-side payment spoofing.
4. **Deposit Escrow & Provider Payout Settlement**:
   - The platform currently maintains a secure logical escrow state in MongoDB (`depositStatus: 'HELD'`, `rentalFee` vs `securityDeposit` 3-line pricing, and honest 85% provider earnings calculations).
   - Real-world automated deposit holds and provider bank wire payouts require integration with a licensed payment splitting gateway (such as **Stripe Connect** or **Razorpay Route**).

---

## 10. Legal & Compliance Blockers

- The public policy center (`/terms`, `/privacy`, `/rental-policy`, `/refund-policy`, `/provider-terms`, `/copyright`) contains structured demonstration policies and community listing reporting (`/report-listing`).
- Prior to commercial launch, all terms of service, rental liability waivers, insurance disclosures, and cancellation policies must be reviewed by qualified legal counsel in the operating jurisdiction.

---

## 11. Recommended Hosting Architecture

```text
                  ┌─────────────────────────────────────┐
                  │       Custom Domain (HTTPS)         │
                  │       (e.g., Cloudflare DNS)        │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │       Frontend: Vercel / Netlify       │
                 │   React 18 + Vite (Static CDN Edge)   │
                 │   Env: VITE_API_URL                   │
                 └───────────────────┬───────────────────┘
                                     │
                           HTTPS REST API Requests
                                     │
                 ┌───────────────────▼───────────────────┐
                 │    Backend: Render / Cloud Run /      │
                 │              Railway                  │
                 │   Node.js 18+ Express API Gateway     │
                 │   Env: MONGO_URI, JWT_SECRET,         │
                 │        FRONTEND_URL, FASTAPI_URL,     │
                 │        CLOUDINARY_*                   │
                 └───────┬───────────────────────┬───────┘
                         │                       │
           Mongoose TLS  │                       │ HTTPS API (Groq styling)
                         ▼                       ▼
            ┌─────────────────────────┐   ┌─────────────────────────┐
            │   MongoDB Atlas Cloud   │   │   FastAPI AI Service    │
            │   Multi-region Cluster  │   │   Render / Cloud Run    │
            │   DB: dress_rental      │   │   Env: GROQ_API_KEY,    │
            └─────────────────────────┘   │        BACKEND_URL      │
                         │                └─────────────────────────┘
                         ▼
            ┌─────────────────────────┐
            │  Cloudinary Media CDN   │
            │  Garment Photo Storage  │
            └─────────────────────────┘
```

---

## 12. Pre-Flight Verification Checklist

Before pointing production DNS to your deployed services:

- [ ] MongoDB Atlas cluster provisioned, IP whitelist configured, user created.
- [ ] Backend environment variables (`MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`) populated in cloud dashboard.
- [ ] Backend deployed and verified via `curl https://<backend-domain>/health` returning HTTP 200 `{"status": "healthy"}`.
- [ ] Cloudinary credentials populated in backend (or verified local disk persistent volume).
- [ ] Frontend deployed on Vercel/Netlify with `VITE_API_URL` pointing to the deployed backend HTTPS domain.
- [ ] AI service deployed with `GROQ_API_KEY` and `BACKEND_URL` (or verified backend graceful fallback).
- [ ] Verify CORS: Opening frontend in browser can authenticate, fetch catalog, and book rental dates without CORS errors.
- [ ] Seed production catalog: Run `node seed.js` (with Atlas `MONGO_URI`) or upload initial provider listings.
