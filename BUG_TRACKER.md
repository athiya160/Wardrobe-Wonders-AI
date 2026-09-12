# Wardrobe Wonders - Bug & Readiness Tracker

## Authentication
- [x] Register (customer & provider role selection, password strength meter, confirmation check)
- [x] Login (JWT token storage, role-aware redirection to /, /provider-dashboard, /admin)
- [x] Logout (clears token and user localStorage, redirects to /login)
- [x] Invalid Login (clear user-friendly error messages, rate limiting on brute force)
- [x] JWT Expiry & Protected Routes (redirects unauthenticated users to /login)

## Home & Marketplace
- [x] Homepage loads cleanly without white screen
- [x] Categories navigation (/m-dress, /w-dress)
- [x] Personalized Homepage (tracks search history gracefully)
- [x] AI Curated Picks & Trending Row
- [x] Responsive layout across Desktop, Laptop, Tablet, Mobile (375px - 1920px)

## Product
- [x] Product Detail page (/product/:id) with image gallery
- [x] Fallback images (onError handler prevents broken image icons)
- [x] Rental date selector with duration, fee, and security deposit breakdown
- [x] Overlapping date reservation conflict blocking
- [x] Customer Reviews & Similar Products recommendations
- [x] Trust & Safety listing reporting dialog (/products/:id/report)

## AI & Stylist
- [x] AI Chat Widget (floating FAB, quick suggestions, graceful offline fallback)
- [x] AI Stylist (/stylist with occasion, budget, color and style filtering)
- [x] Provider Magic AI Assistant (editorial description and multi-attribute tags)
- [x] Secure API Key isolation (GROQ_API_KEY strictly server-side, never in frontend)

## Provider Studio
- [x] Provider access control (explicit 403 screen for customer accounts)
- [x] Multi-image file upload with Cloudinary / local fallback
- [x] Listing creation with condition and ownership confirmation
- [x] Provider Order Management (Accept modal with 85% payout estimate, Decline modal with reason)
- [x] Automatic calendar date unblocking upon order decline
- [x] Anti-tampering protection (Provider B cannot alter Provider A's inventory)

## Checkout & Payment
- [x] Two-step checkout: Address (/checkout/address/:id) & Payment (/checkout/payment/:id)
- [x] Clear financial line items (Rental Fee vs. Refundable Security Deposit)
- [x] Payment verification (/verify-payment) with local MUI icons and retry actions
- [x] Customer self-service cancellation with automatic calendar date release
- [x] Deposit lifecycle tracking (HELD -> REFUNDED / DEDUCTED)
- [x] Status clarity: Marked as "NOT PRODUCTION VERIFIED" for mock/sandbox gateway credentials

## Admin Governance
- [x] Strict admin-only access control (/admin rejects customer and provider with HTTP 403)
- [x] Marketplace overview analytics (GMV, platform 15% revenue, order status distribution)
- [x] User management (activation/deactivation with self-lockout prevention)
- [x] Listing moderation (active/inactive suspension toggle)
- [x] Compliance reports queue with resolution notes

## Deployment Readiness
- [x] Node / Express API with security headers (CSP, X-Frame-Options, CORS)
- [x] MongoDB connection & health check (/health endpoint)
- [x] Vite React frontend production build passes cleanly
- [x] .env secret files gitignored (only .env.example tracked)

---

## Bug Log (Phase 19 Audit)

| Bug ID | Description | Priority | Status | Fix Details |
| :--- | :--- | :---: | :---: | :--- |
| **BUG-001** | Missing `AIChatWidget` import in `App.jsx` causing React runtime crash on load | **P0** | **FIXED** | Added explicit `import AIChatWidget from "./components/AIChatWidget"` in `App.jsx`. |
| **BUG-002** | Syntax error in `Generate_bill1.jsx` due to stray `k` in imports (`RadioGroup,k`) | **P1** | **FIXED** | Removed trailing typo `k` from `Generate_bill1.jsx`. |
| **BUG-003** | Customer visiting `/provider-dashboard` was redirected to `/login` instead of 403 screen | **P2** | **FIXED** | Added client-side role check and explicit 403 Access Denied screen in `ProviderStudio.jsx`. |
| **BUG-004** | `VerifyPayment.jsx` used external hotlinked icon PNGs and green background on failure | **P2** | **FIXED** | Replaced external images with bundled MUI icons (`CheckCircleOutlineIcon`, `ErrorOutlineIcon`), fixed error theme, and added retry/home buttons. |
| **BUG-005** | Broken image icons if remote/local sample images fail to load | **P2** | **FIXED** | Added `onError` fallback to `/assets/Cocktail Gown.jpg` in `ProductCard.jsx` and `ProductDetail.jsx`. |
| **BUG-006** | Mobile horizontal scrollbar due to default box-sizing and overflow behavior | **P2** | **FIXED** | Added `box-sizing: border-box` and `overflow-x: hidden` in `index.css`. |
| **BUG-007** | Use of unregulated "escrow" terminology in user-facing UI | **P2** | **FIXED** | Updated copy in `MyRentals.jsx`, `CheckoutPayment.jsx`, `Legal.jsx`, and `Fotter.jsx` to "Refundable Deposits Held" and order-tracked deposit protection. |
| **BUG-008** | PhonePe payment gateway runs on sandbox credentials (`PGTESTPAYUAT`) | **P2** | **DOCUMENTED** | Classified as "NOT PRODUCTION VERIFIED" for real payment settlement; sandbox/demo simulation verified. |
