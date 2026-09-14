import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  TextField,
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Avatar,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Snackbar,
} from "@mui/material";
import {
  DashboardOutlined as OverviewIcon,
  CheckroomOutlined as DressesIcon,
  AddCircleOutline as AddIcon,
  ReceiptLongOutlined as OrdersIcon,
  MonetizationOnOutlined as EarningsIcon,
  StorefrontOutlined as BoutiqueIcon,
  DeleteOutline as DeleteIcon,
  OpenInNew as ExternalIcon,
  Logout as LogoutIcon,
  ShoppingBagOutlined as ShopIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as ActiveIcon,
  PauseCircleOutline as InactiveIcon,
  AutoAwesome as MagicIcon,
  CloudUploadOutlined as UploadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  LockOutlined as LockIcon,
  HomeOutlined as HomeIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";

// Sample preset luxury wardrobe assets for quick selection
const SAMPLE_ASSETS = [
  { label: "Bridal Lehenga", url: "/assets/Women/bridal_01.png", category: "Wedding", gender: "women" },
  { label: "Festive Anarkali", url: "/assets/Women/festive_01.png", category: "Traditional", gender: "women" },
  { label: "Cocktail Evening Gown", url: "/assets/Women/look_01.png", category: "Party", gender: "women" },
  { label: "Chic Summer Outfit", url: "/assets/Women/outfit_01.png", category: "Casual", gender: "women" },
  { label: "Classic Tuxedo", url: "/assets/Men/suit_01.png", category: "Formal", gender: "men" },
  { label: "Royal Groom Sherwani", url: "/assets/Men/sherwani_01.png", category: "Wedding", gender: "men" },
  { label: "Festive Kurta Set", url: "/assets/Men/sherwani_05.png", category: "Traditional", gender: "men" },
  { label: "Urban Minimalist Look", url: "/assets/Men/casual_01.png", category: "Casual", gender: "men" },
];

const ProviderStudio = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isProvider = Boolean(user && (user.role === "provider" || user.role === "admin" || user.type === "provider" || user.type === "admin"));

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalOrders: 0,
    totalEarnings: 0,
  });
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Delete Confirmation Dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, listingId: null, title: "" });

  // Step 10: Decision Modals & Order Filtering
  const [orderFilter, setOrderFilter] = useState("all");
  const [acceptModal, setAcceptModal] = useState({ open: false, order: null });
  const [declineModal, setDeclineModal] = useState({
    open: false,
    order: null,
    reason: "Garment undergoing maintenance or dry cleaning",
    customNote: "",
  });

  // Add New Dress Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Traditional",
    gender: "women",
    size: "M",
    brand: "",
    condition: "Like New",
    rentalPricePerDay: "",
    securityDeposit: "",
    image: "/assets/Cocktail Gown.jpg",
    images: ["/assets/Cocktail Gown.jpg"],
    description: "",
    tags: [],
    occasion: "",
    color: "",
    pattern: "",
    style: "",
    season: "",
    location: "Mumbai, Bandra West",
    externalRefUrl: "",
    ownershipConfirmed: false,
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch Stats, Listings & Rental Orders
  const fetchData = async () => {
    if (!token || !isProvider) return;
    setLoading(true);
    try {
      const [statsRes, listingsRes, ordersRes] = await Promise.all([
        axios.get(`${BASE_URL}/provider/stats`, authHeaders),
        axios.get(`${BASE_URL}/provider/listings`, authHeaders),
        axios.get(`${BASE_URL}/provider/orders`, authHeaders).catch(() => ({ data: { orders: [] } })),
      ]);
      if (statsRes.data?.status) setStats(statsRes.data.stats);
      if (listingsRes.data?.status) setListings(listingsRes.data.listings);
      if (ordersRes.data?.orders) setOrders(ordersRes.data.orders);
    } catch (err) {
      console.error("Failed to load provider studio data:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  // Step 6: Multi-Photo Cloud Image Upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const uploadData = new FormData();
    const fileArray = Array.from(files).slice(0, 5); // up to 5 images

    fileArray.forEach((file) => {
      uploadData.append("images", file);
    });

    setUploading(true);
    try {
      const res = await axios.post(`${BASE_URL}/upload/provider`, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.status && res.data?.urls?.length > 0) {
        const newUrls = res.data.urls;
        setFormData((prev) => ({
          ...prev,
          images: newUrls,
          image: newUrls[0],
        }));
        showToast(`✨ ${newUrls.length} photo(s) uploaded successfully!`);
      } else {
        showToast(res.data?.message || "Failed to upload photos", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast(err.response?.data?.message || "Error uploading photos", "error");
    } finally {
      setUploading(false);
    }
  };

  // Step 7: Magic AI Fashion Assistant
  const handleGenerateAi = async () => {
    if (!formData.title && !formData.category) {
      showToast("Please enter at least a dress title or category first", "warning");
      return;
    }

    setAiLoading(true);
    try {
      const [descRes, tagsRes] = await Promise.all([
        axios.post(
          `${BASE_URL}/provider/ai/generate-description`,
          {
            productName: formData.title,
            category: formData.category,
            price: Number(formData.rentalPricePerDay) || 2500,
            brand: formData.brand,
          },
          authHeaders
        ),
        axios.post(
          `${BASE_URL}/provider/ai/generate-tags`,
          {
            productName: formData.title,
            category: formData.category,
            description: formData.description,
          },
          authHeaders
        ),
      ]);

      const descData = descRes.data?.data || {};
      const tagData = tagsRes.data?.data || {};

      setFormData((prev) => ({
        ...prev,
        title: descData.title || prev.title,
        description: descData.description || prev.description,
        tags: descData.tags || prev.tags,
        occasion: descData.occasion || prev.occasion,
        color: tagData.color || prev.color,
        pattern: tagData.pattern || prev.pattern,
        style: tagData.style || prev.style,
        season: tagData.season || prev.season,
      }));

      showToast("✨ AI Fashion copy & tags generated!");
    } catch (err) {
      console.error("AI Generation error:", err);
      showToast("Failed to generate AI details", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Step 9 & 10: Provider Update Rental Request Status (Accept / Decline)
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/provider/orders/${orderId}/status`,
        { status: newStatus },
        authHeaders
      );
      if (res.data?.status) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord._id === orderId ? { ...ord, requestStatus: newStatus, status: res.data.order.status } : ord
          )
        );
        showToast(`Rental booking marked as ${newStatus}`);
      }
    } catch (err) {
      console.error("Order status update failed:", err);
      showToast("Failed to update rental status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 10: Confirm Accept from Modal
  const confirmAcceptOrder = async () => {
    if (!acceptModal.order) return;
    await handleOrderStatusUpdate(acceptModal.order._id, "Accepted");
    setAcceptModal({ open: false, order: null });
  };

  // Step 10: Confirm Decline with Reason & Calendar Release from Modal
  const confirmDeclineOrder = async () => {
    if (!declineModal.order) return;
    const finalReason = declineModal.customNote
      ? `${declineModal.reason}: ${declineModal.customNote}`
      : declineModal.reason;

    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/provider/orders/${declineModal.order._id}/status`,
        { status: "Declined", declineReason: finalReason },
        authHeaders
      );
      if (res.data?.status) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord._id === declineModal.order._id
              ? {
                  ...ord,
                  requestStatus: "Declined",
                  status: "Cancelled",
                  declineReason: finalReason,
                }
              : ord
          )
        );
        showToast("Rental request declined. Calendar dates have been released.");
      }
    } catch (err) {
      console.error("Decline order error:", err);
      showToast("Failed to decline rental request", "error");
    } finally {
      setActionLoading(false);
      setDeclineModal({
        open: false,
        order: null,
        reason: "Garment undergoing maintenance or dry cleaning",
        customNote: "",
      });
    }
  };

  // Toggle Listing Availability
  const handleToggleAvailability = async (listing) => {
    const newStatus = listing.availability ? false : true;
    try {
      await axios.put(
        `${BASE_URL}/provider/listings/${listing._id}`,
        { availability: newStatus, status: newStatus ? "active" : "inactive" },
        authHeaders
      );
      setListings((prev) =>
        prev.map((item) =>
          item._id === listing._id
            ? { ...item, availability: newStatus, status: newStatus ? "active" : "inactive" }
            : item
        )
      );
      showToast(newStatus ? "Listing activated for rentals" : "Listing paused from rentals");
    } catch (err) {
      showToast("Failed to update availability", "error");
    }
  };

  // Delete Listing
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.listingId) return;
    setActionLoading(true);
    try {
      await axios.delete(`${BASE_URL}/provider/listings/${deleteDialog.listingId}`, authHeaders);
      setListings((prev) => prev.filter((item) => item._id !== deleteDialog.listingId));
      setStats((prev) => ({
        ...prev,
        totalListings: Math.max(0, prev.totalListings - 1),
        activeListings: Math.max(0, prev.activeListings - 1),
      }));
      showToast("Dress listing removed successfully");
    } catch (err) {
      showToast("Failed to delete listing", "error");
    } finally {
      setActionLoading(false);
      setDeleteDialog({ open: false, listingId: null, title: "" });
    }
  };

  // Submit Add Dress
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.rentalPricePerDay || !formData.securityDeposit) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    // Step 14: Enforce ownership & truthful condition confirmation
    if (!formData.ownershipConfirmed) {
      showToast("Please confirm garment ownership / listing permissions before publishing.", "error");
      return;
    }

    // Step 14: Validate external reference URL if provided
    if (formData.externalRefUrl && formData.externalRefUrl.trim()) {
      const url = formData.externalRefUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        showToast("External reference URL must begin with http:// or https://", "error");
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        rentalPricePerDay: Number(formData.rentalPricePerDay),
        securityDeposit: String(formData.securityDeposit),
        images: formData.images?.length > 0 ? formData.images : [formData.image],
        image: formData.image || formData.images?.[0],
        externalUrl: formData.externalRefUrl ? formData.externalRefUrl.trim() : "",
      };

      const res = await axios.post(`${BASE_URL}/provider/listings`, payload, authHeaders);
      if (res.data?.status) {
        showToast("🎉 Dress listed successfully! It is now live in the marketplace.");
        // Reset form
        setFormData({
          title: "",
          category: "Traditional",
          gender: "women",
          size: "M",
          brand: "",
          condition: "Like New",
          rentalPricePerDay: "",
          securityDeposit: "",
          image: "/assets/Cocktail Gown.jpg",
          images: ["/assets/Cocktail Gown.jpg"],
          description: "",
          tags: [],
          occasion: "",
          color: "",
          pattern: "",
          style: "",
          season: "",
          location: "Mumbai, Bandra West",
          externalRefUrl: "",
          ownershipConfirmed: false,
        });
        fetchData();
        setActiveTab("listings");
      }
    } catch (err) {
      console.error("Listing creation failed:", err);
      showToast(err.response?.data?.message || "Failed to create dress listing", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!token || !isProvider) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, maxWidth: 500, width: "100%", textAlign: "center", borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
          <LockIcon sx={{ fontSize: 64, color: "#D32F2F", mb: 2 }} />
          <Typography variant="h4" fontWeight={800} color="#1A1817" mb={1}>
            403 — Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            You do not have provider clearance to access the Wardrobe Wonders Provider Studio. Only verified boutiques and providers may enter this section.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={() => navigate("/")}
              sx={{ bgcolor: "#1A1817", "&:hover": { bgcolor: "#333" } }}
            >
              Return to Marketplace
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
      {/* STUDIO TOP NAVIGATION BAR */}
      <Paper
        elevation={0}
        sx={{
          py: 1.5,
          px: { xs: 2, md: 4 },
          borderBottom: "1px solid #EBEBEB",
          backgroundColor: "#FFFFFF",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Link to="/">
            <img src={logo} alt="Wardrobe Wonders" style={{ height: 36, objectFit: "contain" }} />
          </Link>
          <Chip
            label="Provider Studio"
            size="small"
            sx={{
              backgroundColor: "rgba(209, 163, 98, 0.15)",
              color: "#A07028",
              fontWeight: 800,
              fontSize: "0.75rem",
              borderRadius: 1,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            component={Link}
            to="/"
            startIcon={<ShopIcon />}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "#E0E0E0",
              color: "#1A1A1A",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              display: { xs: "none", sm: "inline-flex" },
              "&:hover": { borderColor: "#D1A362", backgroundColor: "transparent" },
            }}
          >
            Customer Storefront
          </Button>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: "#1A1A1A", width: 34, height: 34, fontSize: "0.85rem", fontWeight: 700 }}>
              {user.name ? user.name[0].toUpperCase() : "P"}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
                {user.name || user.firstname || "Lender"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Verified Provider
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={handleLogout} size="small" title="Sign Out" sx={{ color: "#888" }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      {/* STUDIO MAIN WORKSPACE */}
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        {/* LEFT SIDEBAR NAVIGATION */}
        <Box
          sx={{
            width: { xs: 70, md: 240 },
            flexShrink: 0,
            borderRight: "1px solid #EBEBEB",
            backgroundColor: "#FFFFFF",
            py: 3,
          }}
        >
          <List component="nav" disablePadding>
            {[
              { id: "overview", label: "Overview", icon: <OverviewIcon /> },
              { id: "listings", label: "My Listings", icon: <DressesIcon />, badge: listings.length },
              { id: "add-dress", label: "+ Add Dress", icon: <AddIcon /> },
              { id: "requests", label: "Rental Requests", icon: <OrdersIcon />, badge: stats.totalOrders },
              { id: "earnings", label: "Earnings", icon: <EarningsIcon /> },
              { id: "profile", label: "Boutique Profile", icon: <BoutiqueIcon /> },
            ].map((item) => (
              <ListItemButton
                key={item.id}
                selected={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                sx={{
                  py: 1.5,
                  px: { xs: 2, md: 3 },
                  my: 0.5,
                  mx: { xs: 1, md: 1.5 },
                  borderRadius: 2,
                  "&.Mui-selected": {
                    backgroundColor: "#1A1A1A",
                    color: "#FFFFFF",
                    "&:hover": { backgroundColor: "#333333" },
                    "& .MuiListItemIcon-root": { color: "#D1A362" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: { xs: "auto", md: 36 },
                    color: activeTab === item.id ? "#D1A362" : "#757575",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: activeTab === item.id ? 700 : 500,
                  }}
                  sx={{ display: { xs: "none", md: "block" } }}
                />
                {item.badge != null && item.badge > 0 && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      display: { xs: "none", md: "inline-flex" },
                      height: 20,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: activeTab === item.id ? "rgba(209, 163, 98, 0.3)" : "#F0F0F0",
                      color: activeTab === item.id ? "#FFFFFF" : "#555555",
                    }}
                  />
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* RIGHT CONTENT WORKSPACE */}
        <Box sx={{ flexGrow: 1, p: { xs: 2.5, sm: 4, md: 5 }, maxWidth: "1400px", mx: "auto", width: "100%" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress sx={{ color: "#D1A362" }} />
            </Box>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <Box>
                  {/* Greeting Banner */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", mb: 0.5 }}>
                      Good day, {user.name ? user.name.split(" ")[0] : "Lender"} 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Here is what is happening across your Wardrobe Wonders rental inventory today.
                    </Typography>
                  </Box>

                  {/* KPI Stat Cards */}
                  <Grid container spacing={3} sx={{ mb: 5 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.05em">
                          TOTAL EARNINGS
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#1A1A1A" sx={{ my: 1 }}>
                          ₹{stats.totalEarnings.toLocaleString()}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "#2E7D32" }}>
                          <TrendingUpIcon fontSize="small" />
                          <Typography variant="caption" fontWeight={600}>
                            Direct Payouts Ready
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.05em">
                          TOTAL DRESSES
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#1A1A1A" sx={{ my: 1 }}>
                          {stats.totalListings}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          In your rental portfolio
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.05em">
                          ACTIVE FOR RENT
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#D1A362" sx={{ my: 1 }}>
                          {stats.activeListings}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Available on storefront
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.05em">
                          RENTAL ORDERS
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#1A1A1A" sx={{ my: 1 }}>
                          {stats.totalOrders}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Processed to date
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Quick Action & Inventory Teaser */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: "1px solid #EBEBEB",
                      bgcolor: "#FFFFFF",
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 3,
                      mb: 4,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Expand your wardrobe earnings
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        List ethnic lehengas, bridal gowns, party dresses, and designer tuxedos to earn from every wear.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setActiveTab("add-dress")}
                      sx={{
                        backgroundColor: "#1A1A1A",
                        color: "#FFF",
                        fontWeight: 700,
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        "&:hover": { backgroundColor: "#333333" },
                      }}
                    >
                      + Add New Dress
                    </Button>
                  </Paper>

                  {/* Recent Dresses */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={700}>
                        Recent Listings
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setActiveTab("listings")}
                        sx={{ color: "#D1A362", fontWeight: 700, textTransform: "none" }}
                      >
                        View All ({listings.length}) &rarr;
                      </Button>
                    </Stack>

                    {listings.length === 0 ? (
                      <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px dashed #DDD" }}>
                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                          No dresses listed yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                          Start listing pieces from your personal wardrobe today and watch your earnings grow.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setActiveTab("add-dress")}
                          sx={{ backgroundColor: "#1A1A1A", color: "#FFF" }}
                        >
                          Add Your First Dress
                        </Button>
                      </Paper>
                    ) : (
                      <Grid container spacing={3}>
                        {listings.slice(0, 4).map((listing) => (
                          <Grid item xs={12} sm={6} md={3} key={listing._id}>
                            <Card
                              elevation={0}
                              sx={{
                                border: "1px solid #EBEBEB",
                                borderRadius: 2.5,
                                overflow: "hidden",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <CardMedia
                                component="img"
                                height="220"
                                image={listing.image || "/assets/Cocktail Gown.jpg"}
                                alt={listing.title || listing.name}
                                sx={{ objectFit: "cover" }}
                              />
                              <CardContent sx={{ p: 2, flexGrow: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                  {listing.category} &bull; Size {listing.size || "M"}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ mt: 0.5, mb: 1 }}>
                                  {listing.title || listing.name}
                                </Typography>
                                <Typography variant="body2" fontWeight={800} color="#1A1A1A">
                                  ₹{listing.rentalPricePerDay || listing.price}
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {" "}
                                    / day
                                  </Typography>
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </Box>
              )}

              {/* TAB 2: MY LISTINGS */}
              {activeTab === "listings" && (
                <Box>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2}
                    sx={{ mb: 4 }}
                  >
                    <Box>
                      <Typography variant="h5" fontWeight={800}>
                        My Wardrobe Listings ({listings.length})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage rental availability, pricing, and visibility for your inventory.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setActiveTab("add-dress")}
                      sx={{
                        backgroundColor: "#1A1A1A",
                        color: "#FFF",
                        fontWeight: 700,
                        borderRadius: 2,
                        "&:hover": { backgroundColor: "#333333" },
                      }}
                    >
                      + Add New Dress
                    </Button>
                  </Stack>

                  {listings.length === 0 ? (
                    <Paper elevation={0} sx={{ p: 8, textAlign: "center", borderRadius: 3, border: "1px dashed #DDD" }}>
                      <Typography variant="h6" fontWeight={700} mb={1}>
                        Your wardrobe is empty
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        Add your first designer piece to start earning rentals.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setActiveTab("add-dress")}
                        sx={{ backgroundColor: "#1A1A1A", color: "#FFF" }}
                      >
                        List A Dress Now
                      </Button>
                    </Paper>
                  ) : (
                    <Grid container spacing={3}>
                      {listings.map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item._id}>
                          <Card
                            elevation={0}
                            sx={{
                              border: "1px solid #EBEBEB",
                              borderRadius: 3,
                              overflow: "hidden",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              transition: "box-shadow 0.2s ease",
                              "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.06)" },
                            }}
                          >
                            <Box sx={{ position: "relative" }}>
                              <CardMedia
                                component="img"
                                height="260"
                                image={item.image || "/assets/Cocktail Gown.jpg"}
                                alt={item.title || item.name}
                                sx={{ objectFit: "cover" }}
                              />
                              <Chip
                                icon={item.availability ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />}
                                label={item.availability ? "Active" : "Paused"}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  left: 12,
                                  backgroundColor: item.availability ? "#2E7D32" : "#757575",
                                  color: "#FFFFFF",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              />
                            </Box>

                            <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                {item.category} &bull; {item.brand || "Boutique"}
                              </Typography>
                              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, mb: 1, fontSize: "1.05rem" }}>
                                {item.title || item.name}
                              </Typography>

                              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip label={`Size: ${item.size || "M"}`} size="small" variant="outlined" />
                                <Chip label={item.condition || "Like New"} size="small" variant="outlined" />
                              </Stack>

                              <Divider sx={{ my: 1.5 }} />

                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    RENTAL RATE
                                  </Typography>
                                  <Typography variant="subtitle1" fontWeight={800} color="#1A1A1A">
                                    ₹{item.rentalPricePerDay || item.price} / day
                                  </Typography>
                                </Box>
                                <Box textAlign="right">
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    DEPOSIT
                                  </Typography>
                                  <Typography variant="subtitle2" fontWeight={700} color="#666">
                                    ₹{item.securityDeposit || item.advance}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>

                            <CardActions
                              sx={{
                                px: 2.5,
                                pb: 2,
                                pt: 0,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={Boolean(item.availability)}
                                    onChange={() => handleToggleAvailability(item)}
                                    color="success"
                                  />
                                }
                                label={
                                  <Typography variant="caption" fontWeight={600}>
                                    {item.availability ? "Available" : "Paused"}
                                  </Typography>
                                }
                              />

                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  component={Link}
                                  to={`/product/${item._id}`}
                                  target="_blank"
                                  title="View on Storefront"
                                  sx={{ color: "#777" }}
                                >
                                  <ExternalIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setDeleteDialog({ open: true, listingId: item._id, title: item.title || item.name })
                                  }
                                  title="Delete Listing"
                                  sx={{ color: "#E53935" }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {/* TAB 3: ADD NEW DRESS FORM */}
              {activeTab === "add-dress" && (
                <Box maxWidth="880px" mx="auto">
                  <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" mb={0.5}>
                        List a New Dress
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Provide accurate details, sizes, and pricing to make your garment attractive to renters.
                      </Typography>
                    </Box>

                    {/* Step 7: Magic AI Assistant Button */}
                    <Button
                      variant="contained"
                      onClick={handleGenerateAi}
                      disabled={aiLoading}
                      startIcon={aiLoading ? <CircularProgress size={18} sx={{ color: "#D1A362" }} /> : <MagicIcon sx={{ color: "#D1A362" }} />}
                      sx={{
                        background: "linear-gradient(135deg, #1A1817 0%, #3D352E 100%)",
                        color: "#FFFFFF",
                        border: "1px solid #D1A362",
                        px: 2.5,
                        py: 1,
                        borderRadius: 3,
                        fontWeight: 700,
                        textTransform: "none",
                        boxShadow: "0 4px 14px rgba(209, 163, 98, 0.25)",
                        "&:hover": { background: "#1A1817" },
                      }}
                    >
                      {aiLoading ? "Consulting AI..." : "✨ Magic AI Assistant"}
                    </Button>
                  </Box>

                  <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                    <form onSubmit={handleCreateListing}>
                      <Stack spacing={3.5}>
                        {/* Section 1: Dress Title & Brand */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#D1A362" textTransform="uppercase" mb={2}>
                            1. Garment Information
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                              <TextField
                                fullWidth
                                label="Dress Title"
                                placeholder="e.g. Sabyasachi Royal Velvet Anarkali"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Brand / Designer"
                                placeholder="e.g. Sabyasachi / Boutique"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                              />
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Section 2: Taxonomy & Specifications */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#D1A362" textTransform="uppercase" mb={2}>
                            2. Category & Specifications
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                  value={formData.category}
                                  label="Category"
                                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                  <MenuItem value="Traditional">Traditional</MenuItem>
                                  <MenuItem value="Wedding">Wedding</MenuItem>
                                  <MenuItem value="Party">Party</MenuItem>
                                  <MenuItem value="Evening Wear">Evening Wear</MenuItem>
                                  <MenuItem value="Formal">Formal</MenuItem>
                                  <MenuItem value="Casual">Casual</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth>
                                <InputLabel>Target Section</InputLabel>
                                <Select
                                  value={formData.gender}
                                  label="Target Section"
                                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                  <MenuItem value="women">Women's Collection</MenuItem>
                                  <MenuItem value="men">Men's Collection</MenuItem>
                                  <MenuItem value="unisex">Unisex / Adaptive</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                              <FormControl fullWidth>
                                <InputLabel>Size</InputLabel>
                                <Select
                                  value={formData.size}
                                  label="Size"
                                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                >
                                  <MenuItem value="XS">XS (Extra Small)</MenuItem>
                                  <MenuItem value="S">S (Small)</MenuItem>
                                  <MenuItem value="M">M (Medium)</MenuItem>
                                  <MenuItem value="L">L (Large)</MenuItem>
                                  <MenuItem value="XL">XL (Extra Large)</MenuItem>
                                  <MenuItem value="Free Size">Free Size / Tailorable</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Garment Condition</InputLabel>
                                <Select
                                  value={formData.condition}
                                  label="Garment Condition"
                                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                >
                                  <MenuItem value="Brand New with Tags">Brand New with Tags</MenuItem>
                                  <MenuItem value="Like New">Like New (Worn 1-2 times)</MenuItem>
                                  <MenuItem value="Excellent">Excellent (No signs of wear)</MenuItem>
                                  <MenuItem value="Gently Used">Gently Used</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Color"
                                placeholder="e.g. Emerald Green, Royal Navy"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              />
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Section 3: Pricing & Deposit */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#D1A362" textTransform="uppercase" mb={2}>
                            3. Rental Economics
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Rental Price Per Day (₹)"
                                placeholder="e.g. 2500"
                                required
                                value={formData.rentalPricePerDay}
                                onChange={(e) => setFormData({ ...formData, rentalPricePerDay: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Refundable Security Deposit (₹)"
                                placeholder="e.g. 1000"
                                required
                                value={formData.securityDeposit}
                                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Location / Pickup Hub"
                                placeholder="e.g. Bandra West, Mumbai"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              />
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Section 4: Step 6 Multi-Photo Cloud Dropzone & Gallery */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#D1A362" textTransform="uppercase" mb={1}>
                            4. Garment Photography (Cloud Upload)
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Upload high-resolution photography from your boutique (Front, Back, Details up to 5 images):
                          </Typography>

                          {/* Upload Dropzone */}
                          <Box
                            sx={{
                              border: "2px dashed #D1A362",
                              borderRadius: 3,
                              p: 3,
                              textAlign: "center",
                              bgcolor: "#FAFAF8",
                              cursor: "pointer",
                              mb: 2.5,
                              transition: "all 0.2s ease",
                              "&:hover": { bgcolor: "#F5F2EC", borderColor: "#B58847" },
                            }}
                            onClick={() => document.getElementById("photo-upload-input")?.click()}
                          >
                            <input
                              id="photo-upload-input"
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              multiple
                              style={{ display: "none" }}
                              onChange={(e) => handleFileUpload(e.target.files)}
                            />
                            {uploading ? (
                              <Box sx={{ py: 2 }}>
                                <CircularProgress size={36} sx={{ color: "#D1A362", mb: 1 }} />
                                <Typography variant="subtitle2" fontWeight={600}>
                                  Uploading and optimizing photography...
                                </Typography>
                              </Box>
                            ) : (
                              <Box>
                                <UploadIcon sx={{ fontSize: 44, color: "#D1A362", mb: 1 }} />
                                <Typography variant="subtitle1" fontWeight={700} color="#1A1817">
                                  Click or Drag & Drop Dress Photos
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Supports JPG, PNG, WEBP up to 10MB each (Cloud CDN hosted)
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Uploaded Photos Gallery Preview */}
                          {formData.images?.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                                UPLOADED PHOTOS ({formData.images.length}/5) &bull; First image is the catalog cover
                              </Typography>
                              <Grid container spacing={1.5}>
                                {formData.images.map((imgUrl, idx) => (
                                  <Grid item xs={6} sm={3} key={idx}>
                                    <Box
                                      sx={{
                                        position: "relative",
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        border: formData.image === imgUrl ? "2px solid #D1A362" : "1px solid #EBEBEB",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                        height: 120,
                                      }}
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`Uploaded photo ${idx + 1}`}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                      {idx === 0 && (
                                        <Chip
                                          label="Cover Photo"
                                          size="small"
                                          sx={{
                                            position: "absolute",
                                            top: 6,
                                            left: 6,
                                            bgcolor: "#D1A362",
                                            color: "#FFF",
                                            fontWeight: 700,
                                            fontSize: "0.65rem",
                                            height: 20,
                                          }}
                                        />
                                      )}
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const filtered = formData.images.filter((_, i) => i !== idx);
                                          setFormData({
                                            ...formData,
                                            images: filtered,
                                            image: filtered[0] || "/assets/Cocktail Gown.jpg",
                                          });
                                        }}
                                        sx={{
                                          position: "absolute",
                                          top: 6,
                                          right: 6,
                                          bgcolor: "rgba(0,0,0,0.6)",
                                          color: "#FFF",
                                          "&:hover": { bgcolor: "#E53935" },
                                          width: 24,
                                          height: 24,
                                        }}
                                      >
                                        <CloseIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}

                          {/* Quick Sample Presets Accordion */}
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            Or select sample photography presets for quick testing:
                          </Typography>
                          <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            {SAMPLE_ASSETS.map((sample, idx) => (
                              <Grid item xs={6} sm={3} key={idx}>
                                <Paper
                                  elevation={0}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      image: sample.url,
                                      images: [sample.url],
                                      category: sample.category,
                                      gender: sample.gender,
                                    })
                                  }
                                  sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    border:
                                      formData.image === sample.url ? "2px solid #D1A362" : "1px solid #EBEBEB",
                                    bgcolor: formData.image === sample.url ? "rgba(209, 163, 98, 0.08)" : "#FFF",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Avatar src={sample.url} variant="rounded" sx={{ width: 36, height: 36 }} />
                                  <Typography variant="caption" fontWeight={600} noWrap>
                                    {sample.label}
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>

                        {/* Section 5: Step 7 AI Description & Generated Attributes */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#D1A362" textTransform="uppercase" mb={2}>
                            5. Editorial Description & Garment Styling
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            placeholder="Describe the fabric, silhouette, embroidery details, and matching styling recommendations..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            sx={{ mb: 2 }}
                          />

                          {/* AI Generated Tags & Occasion Chips */}
                          {formData.occasion && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                                RECOMMENDED OCCASION:
                              </Typography>
                              <Chip label={formData.occasion} size="small" sx={{ bgcolor: "#F5EFE6", color: "#8C6D3B", fontWeight: 600 }} />
                            </Box>
                          )}

                          {formData.tags?.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                                AI SEARCH TAGS:
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {formData.tags.map((tag, tIdx) => (
                                  <Chip key={tIdx} label={`#${tag}`} size="small" variant="outlined" sx={{ borderColor: "#D1A362", color: "#6B5226" }} />
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                        {/* Section 6: Step 14 Trust, Provenance & Ownership Confirmation */}
                        <Box sx={{ p: 2.5, bgcolor: "#FBF9F5", borderRadius: 2, border: "1px solid #F0E6D6" }}>
                          <Typography variant="subtitle2" fontWeight={700} color="#8C6D3B" mb={1.5} textTransform="uppercase">
                            6. Trust, Provenance & Legal Ownership
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            label="External Designer / Collection Reference URL (Optional)"
                            placeholder="https://designerbrand.com/collection/garment-link"
                            value={formData.externalRefUrl}
                            onChange={(e) => setFormData({ ...formData, externalRefUrl: e.target.value })}
                            helperText="If this garment is from an authentic designer line, provide a reference link (must begin with http:// or https://)"
                            sx={{ mb: 2, bgcolor: "#FFF" }}
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.ownershipConfirmed}
                                onChange={(e) => setFormData({ ...formData, ownershipConfirmed: e.target.checked })}
                                sx={{ color: "#D1A362", "&.Mui-checked": { color: "#D1A362" } }}
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1817" }}>
                                I confirm that I own or have permission to use the photos and information submitted for this listing, and that all garment condition details are truthful.
                              </Typography>
                            }
                          />
                        </Box>

                        <Divider />

                        {/* Submit Actions */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            onClick={() => setActiveTab("listings")}
                            sx={{ borderColor: "#DDD", color: "#666" }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={actionLoading}
                            sx={{
                              backgroundColor: "#1A1A1A",
                              color: "#FFF",
                              fontWeight: 700,
                              px: 4,
                              py: 1.2,
                              borderRadius: 2,
                              "&:hover": { backgroundColor: "#333333" },
                            }}
                          >
                            {actionLoading ? <CircularProgress size={24} sx={{ color: "#FFF" }} /> : "Publish Listing"}
                          </Button>
                        </Stack>
                      </Stack>
                    </form>
                  </Paper>
                </Box>
              )}

              {/* TAB 4: STEP 8, 9 & 10 RENTAL REQUESTS & DECISION WORKFLOW */}
              {activeTab === "requests" && (
                <Box>
                  <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={800} mb={0.5}>
                        Rental Requests & Active Bookings
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review customer reservations, approve payouts, and manage rental lifecycle.
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 10: Status Filter Chips Bar */}
                  <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: "auto", pb: 1 }}>
                    <Chip
                      label={`All (${orders.length})`}
                      onClick={() => setOrderFilter("all")}
                      variant={orderFilter === "all" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600, bgcolor: orderFilter === "all" ? "#1A1817" : "transparent", color: orderFilter === "all" ? "#FFF" : "inherit" }}
                    />
                    <Chip
                      label={`Pending Action (${orders.filter((o) => o.requestStatus === "Pending").length})`}
                      onClick={() => setOrderFilter("Pending")}
                      color="warning"
                      variant={orderFilter === "Pending" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={`Confirmed (${orders.filter((o) => o.requestStatus === "Accepted" || o.status === "Confirmed").length})`}
                      onClick={() => setOrderFilter("Accepted")}
                      color="primary"
                      variant={orderFilter === "Accepted" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={`Active on Rent (${orders.filter((o) => o.requestStatus === "Active" || o.status === "Delivered").length})`}
                      onClick={() => setOrderFilter("Active")}
                      color="info"
                      variant={orderFilter === "Active" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={`Completed (${orders.filter((o) => o.requestStatus === "Completed").length})`}
                      onClick={() => setOrderFilter("Completed")}
                      color="success"
                      variant={orderFilter === "Completed" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={`Declined (${orders.filter((o) => o.requestStatus === "Declined" || o.status === "Cancelled").length})`}
                      onClick={() => setOrderFilter("Declined")}
                      variant={orderFilter === "Declined" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>

                  {(() => {
                    const filteredOrders = orders.filter((o) => {
                      if (orderFilter === "all") return true;
                      if (orderFilter === "Accepted") return o.requestStatus === "Accepted" || o.status === "Confirmed";
                      if (orderFilter === "Active") return o.requestStatus === "Active" || o.status === "Delivered";
                      if (orderFilter === "Declined") return o.requestStatus === "Declined" || o.status === "Cancelled";
                      return o.requestStatus === orderFilter;
                    });

                    if (filteredOrders.length === 0) {
                      return (
                        <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px dashed #DDD" }}>
                          <OrdersIcon sx={{ fontSize: 56, color: "#D1A362", mb: 2 }} />
                          <Typography variant="h6" fontWeight={700} mb={0.5}>
                            {orderFilter === "all" ? "No rental requests yet" : `No orders matching filter: ${orderFilter}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" maxWidth={420} mx="auto">
                            Customer bookings, rental windows, and decision controls will be organized here as orders arrive.
                          </Typography>
                        </Paper>
                      );
                    }

                    return (
                      <Grid container spacing={2.5}>
                        {filteredOrders.map((order) => {
                          const prod = order.product || {};
                          const sDate = order.rentalStartDate ? new Date(order.rentalStartDate).toLocaleDateString() : "Flexible";
                          const eDate = order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString() : "Flexible";
                          const reqStatus = order.requestStatus || "Pending";

                          const statusColors = {
                            Pending: { bg: "#FFF4E5", text: "#B76E00" },
                            Accepted: { bg: "#EDF7ED", text: "#1E4620" },
                            Confirmed: { bg: "#EDF7ED", text: "#1E4620" },
                            Declined: { bg: "#FDEDED", text: "#5F2120" },
                            Cancelled: { bg: "#FDEDED", text: "#5F2120" },
                            Active: { bg: "#E5F6FD", text: "#014361" },
                            Completed: { bg: "#E8F5E9", text: "#2E7D32" },
                          };
                          const currentStatusColor = statusColors[reqStatus] || statusColors.Pending;
                          const rentalFeeOnly = order.rentalFee || Math.max(0, (order.totalAmount || 0) - (order.securityDeposit || 0));
                          const netEarningsEstimate = Math.round(rentalFeeOnly * 0.85);

                          return (
                            <Grid item xs={12} key={order._id}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 3,
                                  borderRadius: 3,
                                  border: "1px solid #EBEBEB",
                                  display: "flex",
                                  flexDirection: { xs: "column", md: "row" },
                                  justifyContent: "space-between",
                                  alignItems: { xs: "flex-start", md: "center" },
                                  gap: 2.5,
                                }}
                              >
                                <Stack direction="row" spacing={2.5} alignItems="center">
                                  <Avatar
                                    src={prod.image || "/assets/Cocktail Gown.jpg"}
                                    variant="rounded"
                                    sx={{ width: 75, height: 95, borderRadius: 2 }}
                                  />
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                      {prod.title || prod.name || "Designer Dress"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Customer: <strong>{order.userEmail}</strong> &bull; Placed: {new Date(order.orderDate).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: "#1A1817" }}>
                                      Rental Window: {sDate} &rarr; {eDate} ({order.rentalDays || order.quantity} Days)
                                    </Typography>

                                    {/* Decline reason note */}
                                    {order.declineReason && (
                                      <Typography variant="caption" sx={{ color: "#D32F2F", bgcolor: "#FDEDED", px: 1, py: 0.3, borderRadius: 1, display: "inline-block", mt: 0.8, fontWeight: 600 }}>
                                        Decline Reason: {order.declineReason}
                                      </Typography>
                                    )}

                                    {/* Inspection completed note */}
                                    {order.inspectionNotes && (
                                      <Typography variant="caption" sx={{ color: "#2E7D32", bgcolor: "#E8F5E9", px: 1, py: 0.3, borderRadius: 1, display: "inline-block", mt: 0.8, fontWeight: 600 }}>
                                        Inspection: {order.inspectionNotes}
                                      </Typography>
                                    )}
                                  </Box>
                                </Stack>

                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={3}
                                  alignItems={{ xs: "flex-start", sm: "center" }}
                                >
                                  <Box textAlign={{ xs: "left", sm: "right" }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      TOTAL PAID BY CUSTOMER
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="#1A1817">
                                      ₹{order.totalAmount?.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Est. Payout (85%): <strong>₹{netEarningsEstimate.toLocaleString()}</strong>
                                    </Typography>
                                    <Chip
                                      label={reqStatus}
                                      size="small"
                                      sx={{
                                        bgcolor: currentStatusColor.bg,
                                        color: currentStatusColor.text,
                                        fontWeight: 700,
                                        fontSize: "0.75rem",
                                        mt: 0.5,
                                      }}
                                    />
                                  </Box>

                                  {/* Step 10: Provider Decision & Lifecycle Action Buttons */}
                                  {reqStatus === "Pending" && (
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<CheckIcon />}
                                        onClick={() => setAcceptModal({ open: true, order })}
                                        sx={{ bgcolor: "#2E7D32", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#1B5E20" } }}
                                      >
                                        Review & Accept
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<CloseIcon />}
                                        onClick={() =>
                                          setDeclineModal({
                                            open: true,
                                            order,
                                            reason: "Garment undergoing maintenance or dry cleaning",
                                            customNote: "",
                                          })
                                        }
                                        sx={{ borderColor: "#D32F2F", color: "#D32F2F", fontWeight: 700, "&:hover": { bgcolor: "#FFEBEE" } }}
                                      >
                                        Decline
                                      </Button>
                                    </Stack>
                                  )}

                                  {(reqStatus === "Accepted" || reqStatus === "Confirmed") && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => handleOrderStatusUpdate(order._id, "Active")}
                                      sx={{ bgcolor: "#1976D2", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#115293" } }}
                                    >
                                      Mark as Dispatched
                                    </Button>
                                  )}

                                  {reqStatus === "Active" && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => handleOrderStatusUpdate(order._id, "Completed")}
                                      sx={{ bgcolor: "#2E7D32", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#1B5E20" } }}
                                    >
                                      Mark Returned & Inspected
                                    </Button>
                                  )}
                                </Stack>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    );
                  })()}
                </Box>
              )}

              {/* TAB 5: EARNINGS & PAYOUTS */}
              {activeTab === "earnings" && (
                <Box>
                  <Typography variant="h5" fontWeight={800} mb={1}>
                    Earnings & Payouts
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Transparent financial reporting on rentals, damage deposits, and bank transfers.
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          LIFETIME EARNINGS
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#1A1A1A" my={1}>
                          ₹{stats.totalEarnings.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Direct rental fee revenue
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          ESCROW SECURITY DEPOSITS
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#D1A362" my={1}>
                          ₹0
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Protected under Wardrobe Guarantee
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          NEXT PAYOUT SCHEDULE
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="#2E7D32" my={1}>
                          Every Monday
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Direct Bank / UPI transfer
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* TAB 6: BOUTIQUE PROFILE */}
              {activeTab === "profile" && (
                <Box maxWidth="700px">
                  <Typography variant="h5" fontWeight={800} mb={1}>
                    Boutique & Provider Profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Your public lender information and payout preferences.
                  </Typography>

                  <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                    <Stack spacing={3}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: "#D1A362", fontSize: "1.5rem", fontWeight: 800 }}>
                          {user.name ? user.name[0].toUpperCase() : "P"}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {user.name || "Provider"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Role: {user.role || "provider"} &bull; Member since 2026
                          </Typography>
                        </Box>
                      </Box>

                      <Divider />

                      <TextField fullWidth label="Full Name" defaultValue={user.name} disabled />
                      <TextField fullWidth label="Registered Email" defaultValue={user.email} disabled />
                      <TextField fullWidth label="Contact Phone" defaultValue={user.phone} disabled />
                      <TextField fullWidth label="Default City / Hub" defaultValue="Mumbai, Maharashtra" />

                      <Button
                        variant="contained"
                        sx={{ alignSelf: "flex-start", backgroundColor: "#1A1A1A", color: "#FFF", fontWeight: 700 }}
                      >
                        Save Settings
                      </Button>
                    </Stack>
                  </Paper>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, listingId: null, title: "" })}>
        <DialogTitle sx={{ fontWeight: 700 }}>Remove Listing?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>"{deleteDialog.title}"</strong>? It will no longer be available for customer rentals.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialog({ open: false, listingId: null, title: "" })} sx={{ color: "#777" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={actionLoading}
            sx={{ fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ACCEPT CONFIRMATION DIALOG */}
      <Dialog
        open={acceptModal.open}
        onClose={() => setAcceptModal({ open: false, order: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Confirm Rental Acceptance
        </DialogTitle>
        <DialogContent dividers>
          {acceptModal.order && (
            <Stack spacing={2.5}>
              <Box display="flex" gap={2} alignItems="center">
                <Avatar
                  variant="rounded"
                  src={acceptModal.order.product?.image || "/assets/Cocktail Gown.jpg"}
                  sx={{ width: 64, height: 80, borderRadius: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {acceptModal.order.product?.name || "Garment"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Renter: <strong>{acceptModal.order.userEmail}</strong>
                  </Typography>
                  <Typography variant="body2" color="#1A1817" sx={{ mt: 0.5 }}>
                    Window: {new Date(acceptModal.order.startDate).toLocaleDateString()} &rarr;{" "}
                    {new Date(acceptModal.order.endDate).toLocaleDateString()} (
                    {acceptModal.order.rentalDays || acceptModal.order.quantity} days)
                  </Typography>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#FAFAFA" }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Earnings & Deposit Summary
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Total Paid by Customer
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹{acceptModal.order.totalAmount?.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Platform Fee (15%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    - ₹{Math.round((acceptModal.order.totalAmount || 0) * 0.15).toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle2" fontWeight={800} color="#2E7D32">
                    Estimated Net Payout (85%)
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="#2E7D32">
                    ₹{Math.round((acceptModal.order.totalAmount || 0) * 0.85).toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Note: Payout becomes payable upon customer receiving the garment and completion of rental.
                </Typography>
              </Paper>

              <Box sx={{ bgcolor: "#E8F5E9", p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#2E7D32" mb={0.5}>
                  Handover Checklist
                </Typography>
                <Typography variant="caption" color="#1B5E20" component="div">
                  &bull; Ensure the dress is dry-cleaned and neatly packaged.<br />
                  &bull; Prepare any accessories (dupatta, belt, hanger, cover) included.<br />
                  &bull; Handover to renter or courier on or before start date.
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setAcceptModal({ open: false, order: null })}
            sx={{ color: "#777" }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmAcceptOrder}
            variant="contained"
            disabled={actionLoading}
            sx={{ bgcolor: "#2E7D32", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#1B5E20" } }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Confirm & Accept Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DECLINE CONFIRMATION DIALOG */}
      <Dialog
        open={declineModal.open}
        onClose={() =>
          setDeclineModal({
            open: false,
            order: null,
            reason: "Garment undergoing maintenance or dry cleaning",
            customNote: "",
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#D32F2F" }}>
          Decline Rental Request
        </DialogTitle>
        <DialogContent dividers>
          {declineModal.order && (
            <Stack spacing={2.5}>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to decline the rental request for{" "}
                <strong>{declineModal.order.product?.name || "this garment"}</strong> from{" "}
                <strong>{declineModal.order.userEmail}</strong>?
              </Typography>

              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>
                  Reason for Declining
                </FormLabel>
                <RadioGroup
                  value={declineModal.reason}
                  onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
                >
                  <FormControlLabel
                    value="Garment undergoing maintenance or dry cleaning"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">Garment undergoing maintenance or dry cleaning</Typography>}
                  />
                  <FormControlLabel
                    value="Private event or unavailable for listed window"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">Private event or unavailable for listed window</Typography>}
                  />
                  <FormControlLabel
                    value="Garment undergoing quality inspection or repair"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">Garment undergoing quality inspection or repair</Typography>}
                  />
                  <FormControlLabel
                    value="Date conflict with another booking"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">Date conflict with another booking</Typography>}
                  />
                  <FormControlLabel
                    value="Other"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">Other</Typography>}
                  />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Optional Details / Custom Note for Customer"
                placeholder="e.g. Garment sent for professional dry cleaning until Friday."
                value={declineModal.customNote}
                onChange={(e) => setDeclineModal({ ...declineModal, customNote: e.target.value })}
              />

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <strong>Automatic Calendar Release:</strong> Declining this order will instantly release the reserved dates from your garment's calendar so other renters can book.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() =>
              setDeclineModal({
                open: false,
                order: null,
                reason: "Garment undergoing maintenance or dry cleaning",
                customNote: "",
              })
            }
            sx={{ color: "#777" }}
          >
            Keep Order
          </Button>
          <Button
            onClick={confirmDeclineOrder}
            variant="contained"
            color="error"
            disabled={actionLoading}
            sx={{ fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Decline Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATION */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProviderStudio;
