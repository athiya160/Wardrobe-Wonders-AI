import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import { ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import ContactUs from "./pages/Contact";
import AboutUs from "./pages/About";
import AvailableDresses from "./pages/MDress";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Fdress from "./pages/Fdress";
import Dashboard from "./pages/Admin";
import VerifyPayment from "./pages/VerifyPayment";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchResults from "./pages/SearchResults";
import Stylist from "./pages/Stylist";
import ProductDetail from "./pages/ProductDetail";
import CheckoutAddress from "./pages/CheckoutAddress";
import CheckoutPayment from "./pages/CheckoutPayment";
import OrderSuccess from "./pages/OrderSuccess";
import Profile from "./pages/Profile";
import ProviderStudio from "./pages/ProviderStudio";
import MyRentals from "./pages/MyRentals";
import Legal from "./pages/Legal";
import AIChatWidget from "./components/AIChatWidget";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Public Discovery Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/m-dress" element={<AvailableDresses />} />
          <Route path="/w-dress" element={<Fdress />} />
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

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />

          {/* Customer Protected Routes (Requires Auth) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/address/:id" element={<CheckoutAddress />} />
            <Route path="/checkout/payment/:id" element={<CheckoutPayment />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-rentals" element={<MyRentals />} />
            <Route path="/verify-payment" element={<VerifyPayment />} />
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
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
        <AIChatWidget />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
