import { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider, Box } from "@mui/material";
import { theme } from "./theme";
import ProtectedRoute from "./components/ProtectedRoute";
import AIChatWidget from "./components/AIChatWidget";
import BottomNavBar from "./components/BottomNavBar";
import RouteLoadingFallback from "./components/RouteLoadingFallback";
import DeepLinkHandler from "./components/DeepLinkHandler";

// Eagerly loaded for instant initial render of landing page
import Home from "./pages/Home";

// Route-level code-split components for lean on-demand loading
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const AvailableDresses = lazy(() => import("./pages/MDress"));
const Fdress = lazy(() => import("./pages/Fdress"));
const Jewellery = lazy(() => import("./pages/Jewellery"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Stylist = lazy(() => import("./pages/Stylist"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CheckoutAddress = lazy(() => import("./pages/CheckoutAddress"));
const CheckoutPayment = lazy(() => import("./pages/CheckoutPayment"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Profile = lazy(() => import("./pages/Profile"));
const MyRentals = lazy(() => import("./pages/MyRentals"));
const VerifyPayment = lazy(() => import("./pages/VerifyPayment"));
const ProviderStudio = lazy(() => import("./pages/ProviderStudio"));
const Dashboard = lazy(() => import("./pages/Admin"));
const AboutUs = lazy(() => import("./pages/About"));
const ContactUs = lazy(() => import("./pages/Contact"));
const Legal = lazy(() => import("./pages/Legal"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StoreLanding = lazy(() => import("./pages/StoreLanding"));
const BecomeSeller = lazy(() => import("./pages/BecomeSeller"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const StoreProductDetail = lazy(() => import("./pages/StoreProductDetail"));
const Storefront = lazy(() => import("./pages/Storefront"));
const StoreCart = lazy(() => import("./pages/StoreCart"));
const StoreCheckout = lazy(() => import("./pages/StoreCheckout"));
const StoreOrderSuccess = lazy(() => import("./pages/StoreOrderSuccess"));
const StoreOrderDetail = lazy(() => import("./pages/StoreOrderDetail"));



function AppContent() {
  const location = useLocation();

  const isAuthRoute = ["/login", "/signup", "/sign-up"].includes(location.pathname);

  return (
    <>
      <DeepLinkHandler />
      <Box sx={{ pb: isAuthRoute ? 0 : { xs: "66px", md: 0 } }}>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Application Entry: Canonical Login for Unauthenticated Users, Marketplace for Authenticated Users */}
            <Route path="/" element={<Home />} />
            <Route path="/m-dress" element={<AvailableDresses />} />
            <Route path="/w-dress" element={<Fdress />} />
            <Route path="/jewellery" element={<Jewellery />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/stylist" element={<Stylist />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/terms" element={<Legal defaultTab="terms" />} />
            <Route path="/privacy" element={<Legal defaultTab="privacy" />} />
            <Route path="/rental-policy" element={<Legal defaultTab="rental-policy" />} />
            <Route path="/refund-policy" element={<Legal defaultTab="refund-policy" />} />
            <Route path="/provider-terms" element={<Legal defaultTab="provider-terms" />} />
            <Route path="/copyright" element={<Legal defaultTab="copyright" />} />
            <Route path="/report-listing" element={<Legal defaultTab="report-listing" />} />
            <Route path="/legal" element={<Legal defaultTab="terms" />} />
            <Route path="/store" element={<StoreLanding />} />
            <Route path="/store/product/:id" element={<StoreProductDetail />} />
            <Route path="/store/storefront/:slug" element={<Storefront />} />
            <Route path="/store/become-seller" element={<BecomeSeller />} />
            <Route path="/store/cart" element={<StoreCart />} />

            {/* Authentication Routes: Full-Screen Dedicated Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* Customer Protected Routes (Requires Auth) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout/address/:id" element={<CheckoutAddress />} />
              <Route path="/checkout/payment/:id" element={<CheckoutPayment />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-rentals" element={<MyRentals />} />
              <Route path="/verify-payment" element={<VerifyPayment />} />
              <Route path="/store/checkout" element={<StoreCheckout />} />
              <Route path="/store/order-success/:orderId" element={<StoreOrderSuccess />} />
              <Route path="/store/order-success" element={<StoreOrderSuccess />} />
              <Route path="/store/orders" element={<StoreOrderDetail />} />
              <Route path="/store/orders/:orderId" element={<StoreOrderDetail />} />
              <Route path="/store/seller/dashboard" element={<SellerDashboard />} />
            </Route>

            {/* Provider Studio (Restricted to Providers and Admins) */}
            <Route element={<ProtectedRoute allowedRoles={["provider", "admin"]} />}>
              <Route path="/provider-dashboard" element={<ProviderStudio />} />
            </Route>

            {/* Admin Moderation Console (Restricted to Admins) */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<Dashboard />} />
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Box>
      {!isAuthRoute && <AIChatWidget />}
      {!isAuthRoute && <BottomNavBar />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
