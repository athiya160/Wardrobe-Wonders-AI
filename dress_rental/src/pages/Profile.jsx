import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Chip,
  Stack,
  Avatar,
  Button,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate, Link as RouterLink, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";

// Icons
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import StraightenIcon from "@mui/icons-material/Straighten";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "rentals");
  const [user, setUser] = useState(storedUser);

  // Rentals state
  const [rentals, setRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalFilter, setRentalFilter] = useState("all");
  const [cancelModal, setCancelModal] = useState({ open: false, order: null });
  const [cancelLoading, setCancelLoading] = useState(false);

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState([]);

  // Addresses state
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("user_addresses") || "[]");
      if (saved.length > 0) return saved;
      return [];
    } catch {
      return [];
    }
  });
  const [newAddressModal, setNewAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    street: "",
    houseNo: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    label: "Home",
  });

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    firstname: storedUser.firstname || "",
    lastname: storedUser.lastname || "",
    email: storedUser.email || "",
    phone: storedUser.phone || "",
    bust: storedUser.measurements?.bust ?? "",
    waist: storedUser.measurements?.waist ?? "",
    hips: storedUser.measurements?.hips ?? "",
    height: storedUser.measurements?.height ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Feedback notifications
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Sync tab with URL
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue });
  };

  // Fetch rentals from backend
  const fetchRentals = async () => {
    if (!storedUser.email) return;
    setRentalsLoading(true);
    try {
      if (token) {
        const res = await axios.get(`${BASE_URL}/payment/my-rentals`, authHeaders);
        if (res.data?.success && Array.isArray(res.data.orders)) {
          setRentals(res.data.orders);
          setRentalsLoading(false);
          return;
        }
      }
      // Fallback
      const fbRes = await axios.get(`${BASE_URL}/payment/orders/${storedUser.email}`);
      if (Array.isArray(fbRes.data)) {
        setRentals(fbRes.data);
      }
    } catch (err) {
      console.error("Error fetching rentals:", err);
      try {
        const fbRes = await axios.get(`${BASE_URL}/payment/orders/${storedUser.email}`);
        if (Array.isArray(fbRes.data)) setRentals(fbRes.data);
      } catch (e) {
        console.error("Orders fallback error:", e);
      }
    } finally {
      setRentalsLoading(false);
    }
  };

  // Synchronize authenticated customer data from MongoDB and handle safe migration
  const fetchCustomerData = async () => {
    if (!token) return;
    try {
      // 1. Synchronize Profile & Measurements
      const profRes = await axios.get(`${BASE_URL}/user/profile`, authHeaders);
      if (profRes.data?.success && profRes.data.user) {
        const u = profRes.data.user;
        setUser(u);
        setProfileForm({
          firstname: u.firstname || "",
          lastname: u.lastname || "",
          email: u.email || "",
          phone: u.phone || "",
          bust: u.measurements?.bust ?? "",
          waist: u.measurements?.waist ?? "",
          hips: u.measurements?.hips ?? "",
          height: u.measurements?.height ?? "",
        });
        localStorage.setItem("user", JSON.stringify(u));
      }

      // 2. Synchronize Addresses & Safe One-Time Migration
      const addrRes = await axios.get(`${BASE_URL}/user/addresses`, authHeaders);
      if (addrRes.data?.success) {
        let serverAddrs = addrRes.data.addresses || [];
        const localAddrs = JSON.parse(localStorage.getItem("user_addresses") || "[]");

        if (serverAddrs.length === 0 && localAddrs.length > 0) {
          try {
            const migRes = await axios.post(
              `${BASE_URL}/user/addresses/migrate`,
              { addresses: localAddrs },
              authHeaders
            );
            if (migRes.data?.success && Array.isArray(migRes.data.addresses)) {
              serverAddrs = migRes.data.addresses;
              localStorage.removeItem("user_addresses");
            }
          } catch (migErr) {
            console.error("Address migration error:", migErr);
          }
        }
        setAddresses(serverAddrs);
      }

      // 3. Synchronize Wishlist & Safe One-Time Migration
      const wishRes = await axios.get(`${BASE_URL}/user/wishlist`, authHeaders);
      if (wishRes.data?.success) {
        let serverWishlist = wishRes.data.wishlist || [];
        const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

        if (serverWishlist.length === 0 && localWishlist.length > 0) {
          try {
            const productIds = localWishlist
              .map((item) => (typeof item === "object" ? item._id : item))
              .filter(Boolean);
            const migRes = await axios.post(
              `${BASE_URL}/user/wishlist/migrate`,
              { productIds },
              authHeaders
            );
            if (migRes.data?.success) {
              const refetch = await axios.get(`${BASE_URL}/user/wishlist`, authHeaders);
              if (refetch.data?.success && Array.isArray(refetch.data.wishlist)) {
                serverWishlist = refetch.data.wishlist;
              }
            }
          } catch (migWishErr) {
            console.error("Wishlist migration error:", migWishErr);
          }
        }
        setWishlistItems(serverWishlist);
        localStorage.setItem("wishlist", JSON.stringify(serverWishlist));
        window.dispatchEvent(new Event("wishlist_updated"));
      }
    } catch (err) {
      console.error("Failed to fetch customer profile data:", err);
    }
  };

  useEffect(() => {
    fetchRentals();
    fetchCustomerData();
     
  }, []);

  // Handle Cancel Order
  const handleCancelOrder = async () => {
    if (!cancelModal.order) return;
    setCancelLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/payment/orders/${cancelModal.order._id}/cancel`,
        {},
        authHeaders
      );
      if (res.data?.success) {
        setRentals((prev) =>
          prev.map((ord) =>
            ord._id === cancelModal.order._id
              ? {
                  ...ord,
                  requestStatus: "Cancelled",
                  status: "Cancelled",
                  paymentStatus: "REFUNDED",
                  depositStatus: "REFUNDED",
                }
              : ord
          )
        );
        setNotification({
          open: true,
          message: "Rental request cancelled. Reserved dates have been freed.",
          severity: "success",
        });
      } else {
        setNotification({
          open: true,
          message: res.data?.message || "Unable to cancel rental.",
          severity: "error",
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to cancel rental. Please try again.",
        severity: "error",
      });
    } finally {
      setCancelLoading(false);
      setCancelModal({ open: false, order: null });
    }
  };

  // Profile & Measurements Save
  const handleSaveProfile = async () => {
    // Validate numeric measurements
    const b = profileForm.bust !== "" && profileForm.bust !== null ? Number(profileForm.bust) : null;
    const w = profileForm.waist !== "" && profileForm.waist !== null ? Number(profileForm.waist) : null;
    const h = profileForm.hips !== "" && profileForm.hips !== null ? Number(profileForm.hips) : null;
    const ht = profileForm.height !== "" && profileForm.height !== null ? Number(profileForm.height) : null;

    if (b !== null && (isNaN(b) || b < 15 || b > 80)) {
      setNotification({ open: true, message: "Bust measurement must be between 15 and 80 inches.", severity: "warning" });
      return;
    }
    if (w !== null && (isNaN(w) || w < 15 || w > 80)) {
      setNotification({ open: true, message: "Waist measurement must be between 15 and 80 inches.", severity: "warning" });
      return;
    }
    if (h !== null && (isNaN(h) || h < 15 || h > 90)) {
      setNotification({ open: true, message: "Hips measurement must be between 15 and 90 inches.", severity: "warning" });
      return;
    }
    if (ht !== null && (isNaN(ht) || ht < 36 || ht > 260)) {
      setNotification({ open: true, message: "Height must be between 36 and 260.", severity: "warning" });
      return;
    }

    setProfileSaving(true);
    try {
      if (token) {
        const payload = {
          firstname: profileForm.firstname,
          lastname: profileForm.lastname,
          phone: profileForm.phone,
          measurements: {
            bust: b,
            waist: w,
            hips: h,
            height: ht,
            unit: "in",
          },
        };
        const res = await axios.put(`${BASE_URL}/user/profile`, payload, authHeaders);
        if (res.data?.success) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setNotification({
            open: true,
            message: "Personal details and sizing measurements saved successfully to your account.",
            severity: "success",
          });
          return;
        }
      }

      // Offline fallback
      const updated = {
        ...user,
        firstname: profileForm.firstname,
        lastname: profileForm.lastname,
        phone: profileForm.phone,
        measurements: { bust: b, waist: w, hips: h, height: ht },
      };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setNotification({
        open: true,
        message: "Details saved locally.",
        severity: "success",
      });
    } catch (err) {
      console.error("Save profile error:", err);
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to save profile. Please try again.",
        severity: "error",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleClearMeasurements = async () => {
    try {
      if (token) {
        await axios.delete(`${BASE_URL}/user/measurements`, authHeaders);
      }
      setProfileForm((prev) => ({
        ...prev,
        bust: "",
        waist: "",
        hips: "",
        height: "",
      }));
      const updated = {
        ...user,
        measurements: {},
      };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setNotification({
        open: true,
        message: "Fit measurements cleared from your account.",
        severity: "info",
      });
    } catch (err) {
      console.error("Clear measurements error:", err);
      setNotification({
        open: true,
        message: "Failed to clear measurements.",
        severity: "error",
      });
    }
  };

  // Wishlist actions
  const handleRemoveWishlist = async (id) => {
    try {
      if (token) {
        await axios.delete(`${BASE_URL}/user/wishlist/${id}`, authHeaders);
      }
      const updated = wishlistItems.filter((item) => (item._id || item.id) !== id);
      setWishlistItems(updated);
      localStorage.setItem("wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlist_updated"));
      setNotification({ open: true, message: "Removed from your Wishlist.", severity: "info" });
    } catch (err) {
      console.error("Remove wishlist error:", err);
      setNotification({ open: true, message: "Failed to update wishlist.", severity: "error" });
    }
  };

  // Address actions
  const handleSaveAddress = async () => {
    if (!addressForm.name || !addressForm.street || !addressForm.city || !addressForm.pincode || !addressForm.phone) {
      setNotification({ open: true, message: "Please fill in all required address fields.", severity: "warning" });
      return;
    }
    const pin = addressForm.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setNotification({ open: true, message: "Please enter a valid 6-digit Indian PIN code (e.g. 560001).", severity: "warning" });
      return;
    }

    try {
      if (token) {
        const payload = {
          name: addressForm.name,
          street: addressForm.street,
          houseNo: addressForm.houseNo || "",
          landmark: addressForm.landmark || "",
          city: addressForm.city,
          state: addressForm.state,
          pincode: pin,
          phone: addressForm.phone,
          label: addressForm.label || "Home",
          isDefault: addresses.length === 0,
        };
        const res = await axios.post(`${BASE_URL}/user/addresses`, payload, authHeaders);
        if (res.data?.success && Array.isArray(res.data.addresses)) {
          setAddresses(res.data.addresses);
          setAddressForm({ name: "", street: "", houseNo: "", landmark: "", city: "", state: "", pincode: "", phone: "", label: "Home" });
          setNewAddressModal(false);
          setNotification({ open: true, message: "New delivery address saved to your account.", severity: "success" });
          return;
        }
      }

      // Offline fallback
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...addressForm,
        isDefault: addresses.length === 0,
      };
      const updated = [...addresses, newAddr];
      setAddresses(updated);
      localStorage.setItem("user_addresses", JSON.stringify(updated));
      setAddressForm({ name: "", street: "", houseNo: "", landmark: "", city: "", state: "", pincode: "", phone: "", label: "Home" });
      setNewAddressModal(false);
      setNotification({ open: true, message: "New delivery address added.", severity: "success" });
    } catch (err) {
      console.error("Save address error:", err);
      setNotification({ open: true, message: err.response?.data?.message || "Failed to save address.", severity: "error" });
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      if (token) {
        const res = await axios.patch(`${BASE_URL}/user/addresses/${id}/default`, {}, authHeaders);
        if (res.data?.success && Array.isArray(res.data.addresses)) {
          setAddresses(res.data.addresses);
          setNotification({ open: true, message: "Default delivery address updated.", severity: "success" });
          return;
        }
      }
      const updated = addresses.map((a) => ({ ...a, isDefault: (a._id || a.id) === id }));
      setAddresses(updated);
      localStorage.setItem("user_addresses", JSON.stringify(updated));
      setNotification({ open: true, message: "Default address updated.", severity: "success" });
    } catch (err) {
      console.error("Set default address error:", err);
      setNotification({ open: true, message: "Failed to update default address.", severity: "error" });
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      if (token) {
        const res = await axios.delete(`${BASE_URL}/user/addresses/${id}`, authHeaders);
        if (res.data?.success && Array.isArray(res.data.addresses)) {
          setAddresses(res.data.addresses);
          setNotification({ open: true, message: "Delivery address removed.", severity: "info" });
          return;
        }
      }
      const updated = addresses.filter((a) => (a._id || a.id) !== id);
      setAddresses(updated);
      localStorage.setItem("user_addresses", JSON.stringify(updated));
      setNotification({ open: true, message: "Address removed.", severity: "info" });
    } catch (err) {
      console.error("Delete address error:", err);
      setNotification({ open: true, message: "Failed to delete address.", severity: "error" });
    }
  };

  // Sign out (clears credentials and local cached data to prevent cross-account leak)
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user_addresses");
    localStorage.removeItem("wishlist");
    window.dispatchEvent(new Event("auth_updated"));
    window.dispatchEvent(new Event("wishlist_updated"));
    navigate("/login");
  };

  // Status mapping
  const getNormalizedStatus = (order) => {
    if (order.requestStatus) return order.requestStatus;
    if (order.status === "Delivered") return "Active";
    if (order.status === "Confirmed") return "Accepted";
    if (order.status === "Cancelled") return "Cancelled";
    return "Pending";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return {
          label: "Awaiting Approval",
          color: "#E65100",
          bg: "#FFF3E0",
          icon: <HourglassEmptyIcon sx={{ fontSize: 15 }} />,
        };
      case "Accepted":
      case "Confirmed":
        return {
          label: "Confirmed & Reserved",
          color: "#1B5E20",
          bg: "#E8F5E9",
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />,
        };
      case "Active":
        return {
          label: "Active on Rent",
          color: "#0D47A1",
          bg: "#E3F2FD",
          icon: <LocalShippingOutlinedIcon sx={{ fontSize: 15 }} />,
        };
      case "Completed":
        return {
          label: "Rental Completed",
          color: "#2E7D32",
          bg: "#E8F5E9",
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />,
        };
      case "Declined":
        return {
          label: "Request Declined",
          color: "#C62828",
          bg: "#FFEBEE",
          icon: <CancelOutlinedIcon sx={{ fontSize: 15 }} />,
        };
      case "Cancelled":
        return {
          label: "Cancelled",
          color: "#616161",
          bg: "#EEEEEE",
          icon: <CancelOutlinedIcon sx={{ fontSize: 15 }} />,
        };
      default:
        return {
          label: status,
          color: "#424242",
          bg: "#F5F5F5",
          icon: <InfoOutlinedIcon sx={{ fontSize: 15 }} />,
        };
    }
  };

  // Filter rentals
  const filteredRentals = rentals.filter((order) => {
    const s = getNormalizedStatus(order);
    if (rentalFilter === "all") return true;
    if (rentalFilter === "pending") return s === "Pending";
    if (rentalFilter === "confirmed") return s === "Accepted" || s === "Confirmed";
    if (rentalFilter === "active") return s === "Active";
    if (rentalFilter === "completed") return s === "Completed";
    if (rentalFilter === "cancelled") return s === "Cancelled" || s === "Declined";
    return true;
  });

  const activeRentalsCount = rentals.filter((r) => getNormalizedStatus(r) === "Active").length;
  const pendingRentalsCount = rentals.filter((r) => getNormalizedStatus(r) === "Pending").length;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FAFAFA" }}>
      <ResponsiveAppBar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          maxWidth: "1240px",
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 5 },
          pb: { xs: 12, md: 6 }, // clearance above mobile bottom nav
        }}
      >
        {/* LUXURY CUSTOMER HEADER HERO CARD */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 4,
            bgcolor: "#FFFFFF",
            border: "1px solid #ECE7DE",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Avatar & Identifiers */}
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Avatar
                  sx={{
                    width: { xs: 64, sm: 76 },
                    height: { xs: 64, sm: 76 },
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    fontSize: { xs: "1.6rem", sm: "2rem" },
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    border: "2px solid #D1A362",
                    boxShadow: "0 4px 12px rgba(26,24,23,0.15)",
                  }}
                >
                  {(user.firstname || user.email || "C")[0].toUpperCase()}
                </Avatar>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontWeight: 700,
                        color: "#1A1817",
                      }}
                    >
                      {user.firstname || "Occasion"} {user.lastname || "Client"}
                    </Typography>
                    <Chip
                      label={user.role === "provider" ? "Boutique Lender" : "Client Member"}
                      size="small"
                      sx={{
                        bgcolor: "#1A1817",
                        color: "#D1A362",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {user.email}
                  </Typography>

                  {user.phone && (
                    <Typography variant="caption" sx={{ color: "#888", display: "block", mt: 0.2 }}>
                      Mobile: {user.phone}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Grid>

            {/* Quick Metrics & Sign Out */}
            <Grid item xs={12} md={5}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent={{ xs: "flex-start", md: "flex-end" }}
                alignItems="center"
                flexWrap="wrap"
                gap={1.5}
              >
                <Box
                  sx={{
                    textAlign: "center",
                    p: 1.5,
                    bgcolor: "#FAF8F5",
                    borderRadius: 2,
                    border: "1px solid #ECE7DE",
                    minWidth: 84,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#888", display: "block", textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 700 }}>
                    Bookings
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    {rentals.length}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    textAlign: "center",
                    p: 1.5,
                    bgcolor: "#FAF8F5",
                    borderRadius: 2,
                    border: "1px solid #ECE7DE",
                    minWidth: 84,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#888", display: "block", textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 700 }}>
                    Wishlist
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    {wishlistItems.length}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<StorefrontOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate("/store/become-seller")}
                  sx={{
                    borderColor: "#D1A362",
                    color: "#A07028",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    "&:hover": { borderColor: "#D1A362", bgcolor: "rgba(209, 163, 98, 0.08)" },
                  }}
                >
                  Store Seller Portal
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LogoutOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={handleLogout}
                  sx={{
                    borderColor: "#ECE7DE",
                    color: "#888",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    "&:hover": { borderColor: "#D32F2F", color: "#D32F2F", bgcolor: "#FFF5F5" },
                  }}
                >
                  Sign Out
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* NAVIGATION TABS */}
        <Box sx={{ borderBottom: "1px solid #ECE7DE", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Customer dashboard tabs"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "0.95rem" },
                color: "#666",
                minHeight: 48,
                px: { xs: 2, sm: 3 },
                "&.Mui-selected": { color: "#1A1817", fontWeight: 700 },
              },
              "& .MuiTabs-indicator": {
                bgcolor: "#D1A362",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab
              value="rentals"
              label={`My Rentals & Orders (${rentals.length})`}
              icon={<LocalMallOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="profile"
              label="Profile & Fit Measurements"
              icon={<PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="addresses"
              label={`Delivery Addresses (${addresses.length})`}
              icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
            <Tab
              value="wishlist"
              label={`Wishlist (${wishlistItems.length})`}
              icon={<FavoriteBorderOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* TAB 1: RENTALS & ORDERS */}
        {activeTab === "rentals" && (
          <Box>
            {/* Top Toolbar: Sub-filters & Refresh */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5, maxWidth: "100%" }}>
                {[
                  { id: "all", label: `All (${rentals.length})` },
                  { id: "pending", label: `Pending (${pendingRentalsCount})` },
                  { id: "confirmed", label: "Confirmed" },
                  { id: "active", label: `Active (${activeRentalsCount})` },
                  { id: "completed", label: "Completed" },
                  { id: "cancelled", label: "Cancelled" },
                ].map((chip) => {
                  const selected = rentalFilter === chip.id;
                  return (
                    <Chip
                      key={chip.id}
                      label={chip.label}
                      clickable
                      onClick={() => setRentalFilter(chip.id)}
                      sx={{
                        bgcolor: selected ? "#1A1817" : "#FFFFFF",
                        color: selected ? "#D1A362" : "#555",
                        border: selected ? "1px solid #1A1817" : "1px solid #ECE7DE",
                        fontWeight: selected ? 700 : 500,
                        fontSize: "0.8rem",
                        borderRadius: 2,
                        "&:hover": { bgcolor: selected ? "#1A1817" : "#F5F2EB" },
                      }}
                    />
                  );
                })}
              </Stack>

              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                onClick={fetchRentals}
                sx={{
                  borderColor: "#ECE7DE",
                  color: "#1A1817",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  "&:hover": { borderColor: "#D1A362", bgcolor: "#FFF" },
                }}
              >
                Refresh
              </Button>
            </Stack>

            {/* Content List */}
            {rentalsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <Stack spacing={2} alignItems="center">
                  <CircularProgress sx={{ color: "#D1A362" }} size={40} />
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Loading rental orders...
                  </Typography>
                </Stack>
              </Box>
            ) : filteredRentals.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, sm: 6 },
                  textAlign: "center",
                  bgcolor: "#FFFFFF",
                  border: "1px dashed #ECE7DE",
                  borderRadius: 3,
                }}
              >
                <LocalMallOutlinedIcon sx={{ fontSize: 54, color: "#D6CEC2", mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817", mb: 0.5 }}>
                  No {rentalFilter !== "all" ? rentalFilter : ""} rentals found
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 3, maxWidth: 440, mx: "auto" }}>
                  Explore designer lehengas, sherwanis, and cocktail gowns curated for your next wedding or occasion.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/"
                  variant="contained"
                  sx={{
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    fontWeight: 700,
                    px: 3.5,
                    py: 1,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": { bgcolor: "#2E2A27" },
                  }}
                >
                  Browse Collection
                </Button>
              </Paper>
            ) : (
              <Stack spacing={3}>
                {filteredRentals.map((order) => {
                  const status = getNormalizedStatus(order);
                  const badge = getStatusBadge(status);
                  const product = order.product || {};
                  const sDate = order.rentalStartDate
                    ? new Date(order.rentalStartDate).toLocaleDateString()
                    : "TBD";
                  const eDate = order.rentalEndDate
                    ? new Date(order.rentalEndDate).toLocaleDateString()
                    : "TBD";
                  const days = order.rentalDays || order.quantity || 1;
                  const canCancel = ["Pending", "Accepted", "Confirmed"].includes(status);

                  return (
                    <Paper
                      key={order._id}
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: "1px solid #ECE7DE",
                        bgcolor: "#FFFFFF",
                        overflow: "hidden",
                        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                        "&:hover": {
                          borderColor: "#D1A362",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                        },
                      }}
                    >
                      {/* Order Header Ribbon */}
                      <Box
                        sx={{
                          px: { xs: 2.5, sm: 3 },
                          py: 1.5,
                          bgcolor: "#FBF9F6",
                          borderBottom: "1px solid #ECE7DE",
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#1A1817", letterSpacing: "0.04em" }}>
                            ORDER #{order.transactionId ? order.transactionId.slice(-8).toUpperCase() : order._id?.slice(-8).toUpperCase()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#777" }}>
                            &bull; Placed on {new Date(order.orderDate).toLocaleDateString()}
                          </Typography>
                        </Stack>

                        <Chip
                          icon={badge.icon}
                          label={badge.label}
                          size="small"
                          sx={{
                            bgcolor: badge.bg,
                            color: badge.color,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: 1.5,
                            "& .MuiChip-icon": { color: badge.color },
                          }}
                        />
                      </Box>

                      {/* Main Card Content */}
                      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Grid container spacing={3} alignItems="center">
                          {/* Garment Image */}
                          <Grid item xs={12} sm={3} md={2.5}>
                            <Box
                              component={RouterLink}
                              to={`/product/${product._id || ""}`}
                              sx={{
                                display: "block",
                                borderRadius: 2,
                                overflow: "hidden",
                                border: "1px solid #ECE7DE",
                                aspectRatio: "3/4",
                                bgcolor: "#F7F5F2",
                                position: "relative",
                              }}
                            >
                              <Box
                                component="img"
                                src={product.image || "/assets/Cocktail Gown.jpg"}
                                alt={product.title || product.name || "Garment"}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/assets/Cocktail Gown.jpg";
                                }}
                              />
                            </Box>
                          </Grid>

                          {/* Garment & Rental Info */}
                          <Grid item xs={12} sm={5} md={5.5}>
                            <Typography
                              component={RouterLink}
                              to={`/product/${product._id || ""}`}
                              variant="h6"
                              sx={{
                                fontFamily: '"Playfair Display", Georgia, serif',
                                fontWeight: 700,
                                color: "#1A1817",
                                textDecoration: "none",
                                "&:hover": { color: "#D1A362" },
                                display: "block",
                                mb: 0.8,
                              }}
                            >
                              {product.title || product.name || "Designer Garment"}
                            </Typography>

                            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                              Category: <strong>{product.category || "Couture"}</strong> &bull; Size: <strong>{product.size || "M"}</strong>
                            </Typography>

                            {/* Rental Window Card */}
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: "#FAF8F5",
                                borderColor: "#ECE7DE",
                                display: "inline-block",
                                minWidth: { xs: "100%", sm: "260px" },
                                mb: 1.5,
                              }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: "#D1A362" }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "#1A1817", letterSpacing: "0.04em" }}>
                                  RENTAL WINDOW ({days} {days === 1 ? "DAY" : "DAYS"})
                                </Typography>
                              </Stack>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1817" }}>
                                {sDate} &rarr; {eDate}
                              </Typography>
                            </Paper>
                          </Grid>

                          {/* Financials & Actions */}
                          <Grid item xs={12} sm={4} md={4}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: "#FAF8F5",
                                border: "1px solid #ECE7DE",
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography variant="body2" sx={{ color: "#666" }}>
                                  Rental Fee ({days}d)
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1817" }}>
                                  ₹{(order.rentalFee || (order.totalAmount - (order.securityDeposit || 0)))?.toLocaleString()}
                                </Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Typography variant="body2" sx={{ color: "#666" }}>
                                    Security Deposit
                                  </Typography>
                                  <ShieldOutlinedIcon sx={{ fontSize: 14, color: "#2E7D32" }} />
                                </Stack>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#2E7D32" }}>
                                  ₹{(order.securityDeposit || 0)?.toLocaleString()}
                                </Typography>
                              </Stack>

                              <Divider sx={{ my: 1, borderColor: "#ECE7DE" }} />

                              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                                  Total Paid
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                                  ₹{order.totalAmount?.toLocaleString()}
                                </Typography>
                              </Stack>

                              {/* Deposit Status Pill */}
                              <Chip
                                size="small"
                                label={
                                  status === "Completed" || order.depositStatus === "REFUNDED"
                                    ? "Deposit Refund Initiated"
                                    : status === "Cancelled" || status === "Declined"
                                    ? "Deposit Released"
                                    : "Refundable Deposit Held"
                                }
                                sx={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  width: "100%",
                                  mb: 1.5,
                                  bgcolor:
                                    status === "Completed" || order.depositStatus === "REFUNDED"
                                      ? "#E8F5E9"
                                      : "#FFF3E0",
                                  color:
                                    status === "Completed" || order.depositStatus === "REFUNDED"
                                      ? "#2E7D32"
                                      : "#E65100",
                                }}
                              />

                              {/* Actions */}
                              <Stack spacing={1}>
                                <Button
                                  component={RouterLink}
                                  to={`/product/${product._id || ""}`}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  sx={{
                                    borderColor: "#ECE7DE",
                                    color: "#1A1817",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    borderRadius: 1.5,
                                    "&:hover": { borderColor: "#D1A362", bgcolor: "#FFF" },
                                  }}
                                >
                                  View Garment
                                </Button>

                                {canCancel && (
                                  <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    onClick={() => setCancelModal({ open: true, order })}
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Cancel Booking Request
                                  </Button>
                                )}
                              </Stack>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* TAB 2: PERSONAL PROFILE & FIT MEASUREMENTS */}
        {activeTab === "profile" && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 4 },
              bgcolor: "#FFFFFF",
              border: "1px solid #ECE7DE",
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#1A1817", mb: 0.5 }}>
              Account & Profile Information
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
              Update your contact information and manage your saved tailoring measurements for quick fit checks.
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="First Name"
                  value={profileForm.firstname}
                  onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Last Name"
                  value={profileForm.lastname}
                  onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  value={profileForm.email}
                  disabled
                  helperText="Registered login email cannot be modified."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mobile Contact Number"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: "#ECE7DE" }} />

            {/* Custom Sizing Measurements */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <StraightenIcon sx={{ color: "#D1A362", fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A1817" }}>
                  Saved Fit & Sizing Measurements (Optional)
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2.5 }}>
                Record your measurements in inches to compare against couture lehenga and sherwani size charts.
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bust / Chest (in)"
                    placeholder='e.g. 36"'
                    value={profileForm.bust}
                    onChange={(e) => setProfileForm({ ...profileForm, bust: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Natural Waist (in)"
                    placeholder='e.g. 28"'
                    value={profileForm.waist}
                    onChange={(e) => setProfileForm({ ...profileForm, waist: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Hips (in)"
                    placeholder='e.g. 38"'
                    value={profileForm.hips}
                    onChange={(e) => setProfileForm({ ...profileForm, hips: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Height with Footwear"
                    placeholder="e.g. 5'6&quot;"
                    value={profileForm.height}
                    onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                onClick={handleSaveProfile}
                disabled={profileSaving}
                sx={{
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 700,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#2E2A27" },
                }}
              >
                {profileSaving ? "Saving to Account..." : "Save Profile & Measurements"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearMeasurements}
                sx={{
                  borderColor: "#ECE7DE",
                  color: "#666",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { borderColor: "#1A1817", color: "#1A1817" },
                }}
              >
                Clear Saved Measurements
              </Button>
            </Stack>
          </Paper>
        )}

        {/* TAB 3: DELIVERY ADDRESSES */}
        {activeTab === "addresses" && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#1A1817" }}>
                Saved Delivery Addresses
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewAddressModal(true)}
                sx={{
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#2E2A27" },
                }}
              >
                Add New Address
              </Button>
            </Stack>

            {addresses.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: "center",
                  bgcolor: "#FFFFFF",
                  border: "1px dashed #ECE7DE",
                  borderRadius: 3,
                }}
              >
                <LocationOnOutlinedIcon sx={{ fontSize: 50, color: "#D6CEC2", mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817", mb: 0.5 }}>
                  No delivery addresses saved
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 2.5 }}>
                  Add a delivery address for swift pre-event courier dispatch.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setNewAddressModal(true)}
                  sx={{ borderColor: "#1A1817", color: "#1A1817", borderRadius: 2 }}
                >
                  Add Your Address
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {addresses.map((addr) => (
                  <Grid item xs={12} sm={6} key={addr._id || addr.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "#FFFFFF",
                        border: addr.isDefault ? "2px solid #D1A362" : "1px solid #ECE7DE",
                        borderRadius: 3,
                        position: "relative",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A1817" }}>
                            {addr.name}
                          </Typography>
                          {addr.isDefault && (
                            <Chip
                              label="Default Delivery"
                              size="small"
                              sx={{
                                bgcolor: "#FAF8F5",
                                color: "#8C6D3B",
                                border: "1px solid #D1A362",
                                fontWeight: 700,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                        </Stack>

                        <Typography variant="body2" sx={{ color: "#555", lineHeight: 1.6, mb: 1 }}>
                          {addr.houseNo ? `${addr.houseNo}, ` : ""}{addr.street}
                          {addr.landmark ? ` (Near ${addr.landmark})` : ""}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#555", mb: 1 }}>
                          {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#888", display: "block" }}>
                          Phone: {addr.phone}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2, borderColor: "#ECE7DE" }} />

                      <Stack direction="row" spacing={2} alignItems="center">
                        {!addr.isDefault && (
                          <Button
                            size="small"
                            onClick={() => handleSetDefaultAddress(addr._id || addr.id)}
                            sx={{ color: "#8C6D3B", fontWeight: 700, textTransform: "none", p: 0 }}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAddress(addr._id || addr.id)}
                          sx={{ textTransform: "none", fontSize: "0.8rem", p: 0 }}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 4: WISHLIST */}
        {activeTab === "wishlist" && (
          <Box>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#1A1817", mb: 3 }}>
              Your Saved Couture Wishlist
            </Typography>

            {wishlistItems.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: "center",
                  bgcolor: "#FFFFFF",
                  border: "1px dashed #ECE7DE",
                  borderRadius: 3,
                }}
              >
                <FavoriteBorderOutlinedIcon sx={{ fontSize: 54, color: "#D6CEC2", mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817", mb: 0.5 }}>
                  Your wishlist is empty
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 3, maxWidth: 400, mx: "auto" }}>
                  Save bridal lehengas, sherwanis, and luxury accessories to review and reserve later.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/"
                  variant="contained"
                  sx={{
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    fontWeight: 700,
                    px: 3.5,
                    py: 1,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": { bgcolor: "#2E2A27" },
                  }}
                >
                  Explore Collection
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {wishlistItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: "1px solid #ECE7DE",
                        bgcolor: "#FFFFFF",
                        overflow: "hidden",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#D1A362", boxShadow: "0 6px 20px rgba(0,0,0,0.05)" },
                      }}
                    >
                      <Box
                        component={RouterLink}
                        to={`/product/${item._id}`}
                        sx={{
                          display: "block",
                          width: "100%",
                          aspectRatio: "3/4",
                          bgcolor: "#F7F5F2",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          component="img"
                          src={item.image || "/assets/Cocktail Gown.jpg"}
                          alt={item.name}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/assets/Cocktail Gown.jpg";
                          }}
                        />
                      </Box>

                      <Box sx={{ p: 2.5 }}>
                        <Typography
                          component={RouterLink}
                          to={`/product/${item._id}`}
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: "#1A1817",
                            textDecoration: "none",
                            "&:hover": { color: "#D1A362" },
                            display: "block",
                            lineHeight: 1.3,
                            mb: 0.5,
                          }}
                        >
                          {item.title || item.name}
                        </Typography>

                        <Typography variant="caption" sx={{ color: "#777", display: "block", mb: 1.5 }}>
                          Category: {item.category || "Couture"}
                        </Typography>

                        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            Tariff:
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                            ₹{(item.rentalPricePerDay || item.price)?.toLocaleString()} <Typography component="span" variant="caption" sx={{ color: "#777" }}>/ day</Typography>
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.5}>
                          <Button
                            component={RouterLink}
                            to={`/product/${item._id}`}
                            variant="contained"
                            size="small"
                            fullWidth
                            sx={{
                              bgcolor: "#1A1817",
                              color: "#D1A362",
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: 1.5,
                              "&:hover": { bgcolor: "#2E2A27" },
                            }}
                          >
                            Reserve Dates
                          </Button>

                          <IconButton
                            size="small"
                            aria-label="remove from wishlist"
                            onClick={() => handleRemoveWishlist(item._id)}
                            sx={{
                              color: "#888",
                              border: "1px solid #ECE7DE",
                              borderRadius: 1.5,
                              "&:hover": { color: "#D32F2F", borderColor: "#D32F2F" },
                            }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>

      {/* CANCEL BOOKING DIALOG */}
      <Dialog
        open={cancelModal.open}
        onClose={() => !cancelLoading && setCancelModal({ open: false, order: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", pb: 1 }}>
          Cancel Rental Request?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
            Are you sure you want to cancel this booking request? Your reserved dates will be returned to the boutique catalog.
          </Typography>
          {cancelModal.order && (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#FAF8F5", borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                {cancelModal.order.product?.name || "Garment"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#888" }}>
                Order #{cancelModal.order._id?.slice(-8).toUpperCase()} &bull; Total: ₹{cancelModal.order.totalAmount}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCancelModal({ open: false, order: null })}
            disabled={cancelLoading}
            sx={{ color: "#666" }}
          >
            Keep Reservation
          </Button>
          <Button
            variant="contained"
            onClick={handleCancelOrder}
            disabled={cancelLoading}
            sx={{ bgcolor: "#D32F2F", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#B71C1C" } }}
          >
            {cancelLoading ? <CircularProgress size={18} sx={{ color: "#FFF" }} /> : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD ADDRESS MODAL */}
      <Dialog
        open={newAddressModal}
        onClose={() => setNewAddressModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", pb: 1 }}>
          Add New Delivery Address
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#666", mb: 2.5 }}>
            Provide your occasion delivery coordinates for courier dispatch.
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              required
              label="Recipient Full Name"
              value={addressForm.name}
              onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              required
              label="House / Flat No., Building & Street"
              value={addressForm.street}
              onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Pincode / Postal Code"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Contact Phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewAddressModal(false)} sx={{ color: "#666" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAddress}
            sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700, "&:hover": { bgcolor: "#2E2A27" } }}
          >
            Save Address
          </Button>
        </DialogActions>
      </Dialog>

      {/* FEEDBACK SNACKBAR */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4500}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ borderRadius: 2, boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <Fotter />
    </Box>
  );
};

export default Profile;
