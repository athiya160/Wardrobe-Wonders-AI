# 👗 Wardrobe Wonders (`DressR`) — Peer-to-Peer Luxury Fashion Rental Marketplace

An enterprise-grade, AI-driven peer-to-peer luxury fashion rental marketplace connecting high-end garment owners and boutiques (**Providers**) with fashion enthusiasts (**Customers**), governed by an executive moderation console (**Admin**).

Wardrobe Wonders combines **Retrieval-Augmented Generation (RAG)**, **Groq LLM fashion styling**, and **FAISS vector search** with robust e-commerce rental lifecycles, transparent 3-line pricing, security deposit escrow, real-time calendar conflict prevention, provider accept/decline workflows, community listing reporting, and production security hardening.

---

## 🏛️ System Architecture

```text
                                  ┌────────────────────────────────┐
                                  │      React + Vite Frontend     │
                                  │  (MUI, Responsive Luxury UI)   │
                                  └───────────────┬────────────────┘
                                                  │
                                   HTTP / REST (JWT Bearer Auth)
                                                  │
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │    Node.js + Express Gateway   │
                                  │  (OWASP Headers, Rate Limiting)│
                                  │  (Port 4000 / Dynamic Base URL)│
                                  └───────┬──────────────┬─────────┘
                                          │              │
                       Mongoose / MongoDB │              │ HTTP Microservice
                                          │              ▼
               ┌──────────────────────────┴──┐  ┌────────────────────────────────┐
               │    MongoDB Database         │  │   FastAPI AI Microservice      │
               │  - Users (Customer/Prov/Adm)│  │  - Groq LLM (Mixtral/Llama)    │
               │  - Products & Booked Dates  │  │  - FAISS Vector Similarity     │
               │  - Orders & Escrow Deposits │  │  - Sentence Transformers       │
               │  - Trust Reports & Reviews  │  │  - Fashion Assistant & Stylist │
               └─────────────────────────────┘  └────────────────────────────────┘
```

---

## 👥 Multi-Role Governance Matrix

The platform enforces strict backend role verification (`authenticateToken` + `requireRole`) on every endpoint:

| Role | Permitted Access | Key Capabilities |
| :--- | :--- | :--- |
| **Customer** | `/`, `/m-dress`, `/w-dress`, `/product/:id`, `/my-rentals`, `/checkout/*`, `/stylist`, `/legal` | Browse luxury wardrobe, book calendar dates, view deposit escrow breakdown, cancel pending rentals with instant calendar release, report listings. |
| **Provider** | `/provider-dashboard` (`ProviderStudio`), `/my-rentals`, plus all Customer views | Upload multi-photo galleries, invoke AI Fashion Assistant, publish listings with legal ownership confirmation, accept/decline rental requests, track honest earnings (85% fee isolation, 0% deposit commission). |
| **Admin** | `/admin` Executive Console, plus all platform routes | View platform GMV & 15% marketplace revenue, toggle user status (activate/suspend), moderate listings (approve/deactivate/restore), review and resolve community trust reports. Self-deactivation is strictly barred. |

---

## ✨ Comprehensive Feature Matrix

### 1. Multi-Photo Cloud & Local Fallback Image Storage (Step 6)
- **Dual-Mode Engine**: Automatically uploads up to 5 high-resolution garment photos to **Cloudinary CDN** when API credentials are provided, or seamlessly stores files on local disk (`/uploads/`) with static serving.
- **Drag-and-Drop Gallery**: Full reordering, primary photo selection, and preview carousel on both product pages and provider studio.

### 2. AI Fashion Assistant & Auto-Tagging (Step 7)
- **1-Click Magic AI Assistant**: Providers click *"✨ Magic AI Fashion Assistant"* to generate professional editorial descriptions, occasion recommendations, search tags, garment colors, patterns, and styling advice powered by FastAPI and Groq.
- **Resilient Fallback**: Zero-crash editorial fallback ensures provider listings can be published even if the external LLM is unreachable.

### 3. Rental Dates & Real-Time Availability Calendar (Step 8 & 9)
- **Interactive Date Picker**: Customers select exact pickup and return dates with automatic day calculation.
- **Atomic Conflict Prevention**: Every product document maintains a `bookedDates` array (`startDate`, `endDate`, `orderId`). Overlapping rental requests are instantly rejected at both API and frontend levels.

### 4. Provider Accept / Decline & Payout Workflow (Step 10)
- **Decision Dialogs**: Providers review customer details, delivery location, and rental duration before accepting or declining.
- **Calendar Auto-Release**: When a provider declines a request or a customer cancels, the reserved calendar dates are immediately removed from MongoDB (`$pull: { bookedDates: { orderId } }`), making the dress instantly bookable for other customers.

### 5. Customer Rental Dashboard (`/my-rentals`) (Step 11)
- **Status Tabs**: Filter bookings across *All*, *Pending Action*, *Confirmed*, *Active on Rent*, *Completed*, and *Cancelled*.
- **Self-Service Cancellation**: Customers can cancel pending requests with 1-click confirmation, immediately restoring calendar availability without administrative intervention.

### 6. Transparent Pricing & Security Deposit Escrow (Step 12)
- **3-Line Financial Breakdown**: Every booking explicitly separates:
  1. `rentalFee` = `pricePerDay` × `rentalDays`
  2. `deliveryFee` / cleaning
  3. `securityDeposit` (held in escrow during rental)
- **Deposit Resolution**: Providers and admins can process full deposit refunds (`action: "release"`) or partial damage deductions (`action: "deduct"`) with mandatory photographic evidence and audit notes.
- **Honest Provider Earnings**: Provider dashboard statistics calculate earnings exclusively as 85% of completed rental fees (`payableEarnings`) and 85% of ongoing rentals (`pendingEarnings`), strictly excluding refundable security deposits.

### 7. Executive Admin Moderation Console (`/admin`) (Step 13)
- **Access Gate**: Strict 403 access barrier against unauthorized customers or providers.
- **Platform Overview**: Real-time GMV, 15% platform commission calculation, active user breakdown, and inventory metrics.
- **User Governance**: Search and toggle user active/suspended state with built-in self-deactivation guard.
- **Listing Moderation**: Search catalog, inspect provider ownership, and approve, deactivate, or restore listings with 1 click.

### 8. Legal, Trust & Reporting Center (Step 14)
- **Public Policy Portal**: Tabbed legal hub handling `/terms`, `/privacy`, `/rental-policy`, `/refund-policy`, `/provider-terms`, `/copyright`, and `/report-listing`.
- **Garment Reporting**: Customers can report suspicious listings directly from any product page with categorized taxonomy (`Copyright/IP`, `Misleading listing`, `Inappropriate content`, `Fraud/suspicious activity`, `Incorrect condition`).
- **Legal Ownership Confirmation**: Providers must check a mandatory truthfulness checkbox before publishing: *"I confirm that I own or have permission to use the photos and information submitted for this listing, and that all garment condition details are truthful."*

### 9. Production Security Hardening & Health Monitoring (Steps 15 & 16)
- **OWASP Security Headers**: Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and strips `X-Powered-By`.
- **Brute-Force Rate Limiting**: In-memory sliding-window rate limiter throttles `/login` and `/register` to 30 requests per 15 minutes per IP, returning HTTP 429 with standard `Retry-After` headers.
- **Health Check Endpoint**: `GET /health` provides service uptime, environment, and MongoDB connection status for orchestration monitoring.
- **Centralized Error Handling**: Express 4-argument error handler ensures sanitized JSON errors without stack trace leakage in production.

---

## 📸 Core User Journeys

```text
[CUSTOMER JOURNEY]
Browse Catalog ──► Select Calendar Dates ──► 3-Line Escrow Checkout ──► Track in /my-rentals ──► Return Garment & Deposit Refund

[PROVIDER JOURNEY]
Provider Studio ──► Upload Photos & AI Copy ──► Confirm Ownership ──► Receive Booking ──► Accept / Decline ──► Track 85% Payout

[ADMIN JOURNEY]
/admin Console ──► Platform GMV & Commission ──► User Governance ──► Moderate Inventory ──► Resolve Trust Reports
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Material-UI (MUI v5), React Router DOM v6, Axios |
| **Backend** | Node.js, Express 4.19, Mongoose 8.3, JSON Web Tokens (JWT), bcryptjs |
| **Database** | MongoDB (Document Store with indexed date ranges and role schemas) |
| **AI Microservice** | Python, FastAPI, Groq LLM (Mixtral/Llama), FAISS Vector Index, Sentence Transformers |
| **Media Storage** | Cloudinary CDN with transparent Local Disk fallback |

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/dress_rental`) or MongoDB Atlas URI
- **Python**: v3.9+ (optional, only required if running local AI microservice)

---

### 1. Clone the Repository
```bash
git clone <repository-url>
cd dress_rental
```

---

### 2. Backend Setup (`dress_rental_backend`)
```bash
cd dress_rental_backend
npm install
```

Create `.env` in `dress_rental_backend`:
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/dress_rental
JWT_SECRET=your_jwt_secret_key_here
FASTAPI_URL=http://127.0.0.1:8001

# Optional Cloudinary Configuration (defaults to local disk storage if omitted)
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend server:
```bash
npm start
# Server listens on http://localhost:4000
```

---

### 3. Frontend Setup (`dress_rental`)
```bash
cd ../dress_rental
npm install
```

Create `.env` in `dress_rental`:
```env
VITE_API_URL=http://localhost:4000
```

Start the frontend development server:
```bash
npm run dev
# App opens on http://localhost:5173
```

To build for production:
```bash
npm run build
# Compiles ~11,888 modules into dist/ with zero errors
```

---

### 4. AI Microservice Setup (`ai_service`) *(Optional)*
```bash
cd ../ai_service
python -m venv venv
venv\Scripts\activate  # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` in `ai_service`:
```env
GROQ_API_KEY=your_groq_api_key
MODEL_NAME=mixtral-8x7b-32768
MONGO_URI=mongodb://127.0.0.1:27017/dress_rental
```

Start the FastAPI microservice:
```bash
python -m uvicorn app:app --port 8001
```

---

## 🧪 Automated Test Suites & Regression Verification

The platform contains **10 automated integration test suites** verifying all functionality end-to-end:

| Test Suite File | Focus Area | Assertions |
| :--- | :--- | :---: |
| `test_auth_suite.js` | Authentication, JWT, bcrypt hashing, plaintext auto-migration, RBAC barriers | 37 / 37 PASS |
| `test_provider_suite.js` | Provider listing CRUD, catalog sync, cross-provider tampering protection | 30 / 30 PASS |
| `test_rental_lifecycle_suite.js` | Image upload, AI description/tags, date calculation, booking conflict prevention | 38 / 38 PASS |
| `test_accept_reject_suite.js` | Provider accept/decline, dispatch, inspection, calendar date auto-restoration | 24 / 24 PASS |
| `test_customer_rentals_suite.js` | Customer `/my-rentals`, status tabs, cancellation flow, cross-customer protection | 23 / 23 PASS |
| `test_payment_deposit_suite.js` | 3-line pricing, deposit escrow, damage deduction, honest 85% provider earnings | 25 / 25 PASS |
| `test_admin_moderation_suite.js` | Admin overview GMV/revenue, user governance, listing moderation, report resolution | 21 / 21 PASS |
| `test_legal_reporting_suite.js` | Garment reporting endpoint, legal trust policies, ownership & URL validation | 20 / 20 PASS |
| `test_security_hardening_suite.js` | OWASP security headers, health endpoint, brute-force rate limiting, error handling | 20 / 20 PASS |
| `test_master_e2e.js` | **Master End-to-End User Journey** executing full 8-phase lifecycle | 39 / 39 PASS |
| **CUMULATIVE TOTAL** | **100% Pass Rate Across Entire Marketplace Architecture** | **277 / 277 PASS** |

### Run Any Test Suite:
```bash
cd dress_rental_backend

# Run the Master E2E Regression Suite
node test_master_e2e.js

# Run Individual Feature Suites
node test_auth_suite.js
node test_provider_suite.js
node test_rental_lifecycle_suite.js
node test_accept_reject_suite.js
node test_customer_rentals_suite.js
node test_payment_deposit_suite.js
node test_admin_moderation_suite.js
node test_legal_reporting_suite.js
node test_security_hardening_suite.js
```

---

## 🔒 Security & Operational Notice

- **Security Deposit Escrow**: Deposits are held securely in database escrow and released automatically upon provider condition sign-off or administrative review.
- **Provider Earnings**: Reported earnings distinguish `payableEarnings` (completed rentals) from `pendingEarnings` (active rentals) and strictly exclude customer security deposits.
- **Demonstration Notice**: *This software is an operational, production-prepared MVP demonstration. While fully equipped with OWASP security headers, input validation, rate limiting, and RBAC, formal merchant settlement and legal policies should be customized prior to high-volume commercial deployment.*

---

## 👩‍💻 Author & Attribution

Developed with passion by **Athiya Tabassum** for luxury fashion sustainability and circular economy innovation.
