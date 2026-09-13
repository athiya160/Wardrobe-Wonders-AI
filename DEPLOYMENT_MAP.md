# 🗺️ Wardrobe Wonders (`DressR`) — Production Deployment Map

> **Generated**: Verified MVP Deployment Specification  
> **Status**: PRE-DEPLOYMENT VERIFIED — NO PRODUCTION DEPLOYMENT EXECUTED YET  
> **Branch**: `production-deployment`  
> **Active Git Commit**: `41585ff` (`feat(deploy): add vercel.json for SPA client-side route rewrites`)

---

## 1. Frontend Deployment Configuration (`dress_rental/`)

* **Application Path**: `dress_rental/`
* **Framework**: React 18.2.0 + Vite 5.2.8 + Material-UI (MUI v5)
* **Package/Dependency File**: `dress_rental/package.json`
* **Lockfile**: `package-lock.json` & `yarn.lock`
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Production Port**: Edge CDN / Managed HTTPS (Port 443 via Vercel/Netlify)
* **Start Command**: Static edge hosting (or `npm run preview` for local staging preview)
* **Dockerfile**: None (Static JAMstack SPA — Docker not required for Vercel)
* **SPA Routing Requirement**: Configured via `dress_rental/vercel.json`:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
* **Environment Variables Used in Source**:
  * `import.meta.env.VITE_API_URL` — referenced in `src/config/axiosConfig.js` (line 1). Fallback: `"http://localhost:4000"`.
* **Tracked `.env.example`**:
  * `VITE_API_URL=https://<your-backend-api-domain>`
* **Health Endpoint**: `GET /` (serves `dist/index.html`, HTTP 200)
* **Platform Readiness**: **100% READY** for Vercel, Netlify, or Cloudflare Pages.
* **Deployment Blockers**: None. Build verified (`dist/index-BxOtwPYp.js` generated cleanly).

---

## 2. Backend Deployment Configuration (`dress_rental_backend/`)

* **Application Path**: `dress_rental_backend/`
* **Runtime**: Node.js (ES Modules, `"type": "module"`) + Express 4.19.2
* **Package/Dependency File**: `dress_rental_backend/package.json`
* **Lockfile**: `package-lock.json` & `yarn.lock`
* **Build Command**: `npm install`
* **Start Command**: `npm start` (which executes `node index.js`)
* **Production Port**: Injected dynamically via `process.env.PORT` (fallback: `4000`)
* **Dockerfile**: None (Native Node.js runtime supported directly by Render/Railway/Cloud Run)
* **Reverse Proxy Support**: Configured with `app.set("trust proxy", 1)` in `index.js`
* **Health Check Endpoint**: `GET /health` in `middleware/security.js`
  * Status 200: Healthy (Database connected, readyState = 1)
  * Status 503: Degraded (Database connecting or disconnected)
* **Source Code `process.env` Inventory**:
  1. `PORT` — server listener (`index.js:66`)
  2. `NODE_ENV` — activates HSTS headers, strict CORS, and hides error stacks (`security.js:15,131,155,171`)
  3. `MONGO_URI` / `MONGODB_URI` — database connection string (`index.js:69`)
  4. `JWT_SECRET` / `SECRET` — JWT signing key (`middleware/auth.js:23`, `routes/user.router.js:29`)
  5. `FRONTEND_URL` / `CLIENT_ORIGIN` — allowed CORS origins (`middleware/security.js:117`, `routes/payment.js:21`)
  6. `FASTAPI_URL` — microservice endpoint (`routes/product.router.js:45`, `routes/provider.router.js:452,535`)
  7. `CLOUDINARY_CLOUD_NAME` — media storage (`services/uploadService.js:42,54`)
  8. `CLOUDINARY_API_KEY` — media storage (`services/uploadService.js:43,55`)
  9. `CLOUDINARY_API_SECRET` — media storage (`services/uploadService.js:44,56`)
  10. `DISABLE_RATE_LIMIT` — test suite bypass only (`middleware/security.js:47`)
* **Tracked `.env.example`**:
  * `NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `FASTAPI_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
* **Platform Readiness**: **Ready for Web Service deployment** (Render, Railway, Cloud Run).
* **Deployment Blockers**:
  * Cloud MongoDB Atlas URI required (cannot connect to `127.0.0.1` from cloud host).
  * Cloudinary API keys required for persistent image hosting across container restarts.

---

## 3. AI Service Deployment Configuration (`ai_service/`)

* **Application Path**: `ai_service/`
* **Runtime**: Python 3.11+ / FastAPI / Uvicorn
* **Package/Dependency File**: `ai_service/requirements.txt` (UTF-8 encoded; frozen with `torch`, `sentence-transformers`, `faiss-cpu`, `groq`)
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT` (local fallback: port `8001`)
* **Production Port**: Injected dynamically via `$PORT`
* **Dockerfile**: None (Native Python Web Service on Render or Cloud Run)
* **Health Check Endpoint**: `GET /` (returns `{"message": "AI Service Running"}`, HTTP 200)
* **Source Code `os.getenv` Inventory**:
  1. `GROQ_API_KEY` — Groq Cloud LLM API key (`services/chatbot.py:10`, `services/generator.py:9`)
  2. `MODEL_NAME` — Groq model name (`services/chatbot.py:48`, `services/generator.py:31,63,101,139,178`)
  3. `BACKEND_URL` / `NODE_API_URL` — Node.js backend endpoint for catalog sync (`services/product_service.py:4`)
* **Tracked `.env.example`**:
  * `GROQ_API_KEY`, `MODEL_NAME`, `BACKEND_URL`, `MONGO_URI`
* **Startup Resilience**: `product_service.py` handles backend connection timeouts gracefully so AI microservice starts without crashing even if deployed before backend.
* **Platform Readiness**: **Ready for Python Web Service deployment**.
* **Deployment Blockers**:
  * `GROQ_API_KEY` required from `console.groq.com` to enable LLM features (graceful editorial fallback exists if omitted).
  * Host RAM requirement: Host must have at least 1 GB RAM to load `all-MiniLM-L6-v2` SentenceTransformer embeddings.

---

## 4. MongoDB Atlas Cloud Requirements

* **Cluster Type**: MongoDB Atlas (M0 Free or Shared/Dedicated tier)
* **Target Database Name**: `dress_rental`
* **Authentication**: Username + strong alphanumeric password (URL-encoded if special characters exist)
* **Collections Initialized**: `users`, `products`, `orders`, `reports`
* **Network Access**:
  * Initial deployment: `0.0.0.0/0` (Allow Access from Anywhere) to accommodate dynamic cloud outbound IPs.
  * Production hardening: Restricted to static outbound IPs / VPC peering if provided by host.
* **Connection String Format**:
  ```text
  mongodb+srv://<username>:<password>@<cluster-address>.mongodb.net/dress_rental?retryWrites=true&w=majority
  ```

---

## 5. Cloudinary Media CDN Requirements

* **Account**: Cloudinary Free / Paid tier account
* **Storage Mode in Code**: Dual-mode in `services/uploadService.js`:
  * *Without Cloudinary keys*: Saves to ephemeral local disk (`/uploads`).
  * *With Cloudinary keys*: Automatically streams images to `res.cloudinary.com` CDN.
* **Required Production Keys**:
  * `CLOUDINARY_CLOUD_NAME`
  * `CLOUDINARY_API_KEY`
  * `CLOUDINARY_API_SECRET`
* **Target Folder**: Garment photography automatically structured under `wardrobe_wonders/dresses`.

---

## 6. Payment System Status

* **Status**: **SANDBOX / TEST MODE ONLY (NOT PRODUCTION VERIFIED)**
* **Gateway**: PhonePe UAT Sandbox
* **Merchant ID (MID)**: `PGTESTPAYUAT` (PhonePe's public UAT test identifier)
* **Salt Key**: Public sandbox salt key configured in `config/phonepeConfig.js`
* **Endpoint**: `https://api-preprod.phonepe.com/apis/pg-sandbox`
* **Fallback Simulation**: If sandbox gateway fails or times out, backend gracefully simulates payment redirect for testing.
* **Commercial Launch Requirements**:
  1. Business KYC (GST, PAN, Company Registration, Bank Account) with Razorpay, PhonePe, or Stripe.
  2. Production Merchant ID and live Salt Keys injected via environment variables.
  3. Split payment settlement (e.g., Razorpay Route or Stripe Connect) for automated 85% provider disbursements and deposit escrow holds.

---

## 7. Master Environment Variables Matrix

| Variable Name | Component | Required? | Source in Code | Production Destination | Secret? |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `NODE_ENV` | Backend | **Yes** | `middleware/security.js` | Cloud Host (Render/Railway) | No |
| `PORT` | Backend | Optional | `index.js` | Injected by Cloud Host (`$PORT`) | No |
| `MONGO_URI` | Backend | **Yes** | `index.js` | Cloud Host Secrets | **YES** |
| `JWT_SECRET` | Backend | **Yes** | `middleware/auth.js` | Cloud Host Secrets | **YES** |
| `SECRET` | Backend | Optional | Legacy fallback for `JWT_SECRET` | Cloud Host Secrets | **YES** |
| `FRONTEND_URL` | Backend | **Yes** | `middleware/security.js` | Cloud Host Settings | No |
| `FASTAPI_URL` | Backend | Optional | `routes/provider.router.js` | Cloud Host Settings | No |
| `CLOUDINARY_CLOUD_NAME` | Backend | Recommended | `services/uploadService.js` | Cloud Host Settings | No |
| `CLOUDINARY_API_KEY` | Backend | Recommended | `services/uploadService.js` | Cloud Host Secrets | **YES** |
| `CLOUDINARY_API_SECRET` | Backend | Recommended | `services/uploadService.js` | Cloud Host Secrets | **YES** |
| `VITE_API_URL` | Frontend | **Yes** | `src/config/axiosConfig.js` | Vercel Environment Variables | No |
| `GROQ_API_KEY` | AI Service | **Yes** | `services/chatbot.py` | Cloud Host Secrets | **YES** |
| `MODEL_NAME` | AI Service | Optional | `services/chatbot.py` | Cloud Host Settings | No |
| `BACKEND_URL` | AI Service | **Yes** | `services/product_service.py` | Cloud Host Settings | No |

---

## 8. Deployment Blockers

1. **MongoDB Atlas URI**: Backend cannot connect to `mongodb://127.0.0.1:27017` in the cloud. Atlas connection string must be provisioned.
2. **Cloudinary Configuration**: Without Cloudinary credentials, provider dress uploads save to local container disk, which is wiped on cloud restarts.
3. **Mutual URL Cross-Linking**:
   * Frontend needs backend URL (`VITE_API_URL`).
   * Backend needs frontend URL (`FRONTEND_URL`) for CORS.
   * AI needs backend URL (`BACKEND_URL`).
   * Backend needs AI URL (`FASTAPI_URL`).
4. **PhonePe Production Credentials**: Live financial transactions require real merchant onboarding.

---

## 9. Recommended Deployment Order

```text
Step 1: MongoDB Atlas Provisioning & IP Whitelist
                     │
                     ▼
Step 2: Deploy AI Service (Render: ai_service/)
        ──► Generates AI Service HTTPS URL
                     │
                     ▼
Step 3: Deploy Backend (Render: dress_rental_backend/)
        ──► Connects to Atlas (MONGO_URI)
        ──► Connects to AI Service (FASTAPI_URL)
        ──► Connects to Cloudinary (CLOUDINARY_*)
        ──► Generates Backend HTTPS URL
                     │
                     ▼
Step 4: Deploy Frontend (Vercel: dress_rental/)
        ──► Injects VITE_API_URL (Backend HTTPS URL)
        ──► Generates Frontend HTTPS URL
                     │
                     ▼
Step 5: Close CORS Loop & Verification
        ──► Update Backend FRONTEND_URL with live Vercel domain
        ──► Run end-to-end user journeys (Register, Browse, Provider Studio, Rental)
```
