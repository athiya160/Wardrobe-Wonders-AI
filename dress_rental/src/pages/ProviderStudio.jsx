import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  TextField,
  Avatar,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  DashboardOutlined as OverviewIcon,
  CheckroomOutlined as DressesIcon,
  AddCircleOutline as AddIcon,
  ReceiptLongOutlined as OrdersIcon,
  MonetizationOnOutlined as EarningsIcon,
  StorefrontOutlined as BoutiqueIcon,
  Logout as LogoutIcon,
  ShoppingBagOutlined as ShopIcon,
  LockOutlined as LockIcon,
  HomeOutlined as HomeIcon,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";
import WardrobeWondersLogo from "../components/WardrobeWondersLogo";
import Fotter from "../components/Fotter";

// Sub-components
import ProviderOverview from "../components/provider/ProviderOverview";
import ProviderListings from "../components/provider/ProviderListings";
import ProviderAddDress from "../components/provider/ProviderAddDress";
import ProviderRentalRequests from "../components/provider/ProviderRentalRequests";
import ProviderEarnings from "../components/provider/ProviderEarnings";

const ProviderStudio = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isProvider = Boolean(
    user &&
      (user.role === "provider" ||
        user.role === "admin" ||
        user.type === "provider" ||
        user.type === "admin")
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalOrders: 0,
    totalEarnings: 0,
    payableEarnings: 0,
    pendingEarnings: 0,
  });
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Dialog States
  const [deleteDialog, setDeleteDialog] = useState({ open: false, listingId: null, title: "" });
  const [orderFilter, setOrderFilter] = useState("all");
  const [acceptModal, setAcceptModal] = useState({ open: false, order: null });
  const [declineModal, setDeclineModal] = useState({
    open: false,
    order: null,
    reason: "Garment undergoing maintenance or dry cleaning",
    customNote: "",
  });

  // Add Dress Form State
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
    location: "Mumbai, Bandra West Atelier",
    externalRefUrl: "",
    ownershipConfirmed: false,
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const showToast = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  // Fetch Stats, Listings & Orders
  const fetchData = async () => {
    if (!token || !isProvider) return;
    setLoading(true);
    try {
      const [statsRes, listingsRes, ordersRes] = await Promise.all([
        axios.get(`${BASE_URL}/provider/stats`, authHeaders).catch(() => ({ data: { status: false } })),
        axios.get(`${BASE_URL}/provider/listings`, authHeaders).catch(() => ({ data: { status: false, listings: [] } })),
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

  // Multi-Photo Cloud Image Upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const uploadData = new FormData();
    const fileArray = Array.from(files).slice(0, 5);

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
        showToast(`✨ ${newUrls.length} boutique photo(s) uploaded successfully!`);
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

  // Magic AI Fashion Assistant
  const handleGenerateAi = async () => {
    if (!formData.title && !formData.category) {
      showToast("Please enter at least a garment title or category first", "warning");
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

      showToast("✨ AI Fashion copy & styling tags generated!");
    } catch (err) {
      console.error("AI Generation error:", err);
      showToast("Failed to generate AI details", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Update Rental Request Status (Accept / Active / Completed)
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
            ord._id === orderId
              ? { ...ord, requestStatus: newStatus, status: res.data.order?.status || newStatus }
              : ord
          )
        );
        showToast(`Rental booking marked as ${newStatus}`);
        fetchData(); // sync stats
      }
    } catch (err) {
      console.error("Order status update failed:", err);
      showToast("Failed to update rental status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Accept Modal
  const confirmAcceptOrder = async () => {
    if (!acceptModal.order) return;
    await handleOrderStatusUpdate(acceptModal.order._id, "Accepted");
    setAcceptModal({ open: false, order: null });
  };

  // Confirm Decline Modal
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
        fetchData();
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

  // Toggle Availability
  const handleToggleAvailability = async (listing) => {
    const newStatus = !listing.availability;
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
      showToast(newStatus ? "Garment activated for customer booking" : "Garment paused from storefront");
    } catch {
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
      showToast("Garment listing removed from wardrobe");
    } catch {
      showToast("Failed to delete listing", "error");
    } finally {
      setActionLoading(false);
      setDeleteDialog({ open: false, listingId: null, title: "" });
    }
  };

  // Create Listing
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.rentalPricePerDay || !formData.securityDeposit) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!formData.ownershipConfirmed) {
      showToast("Please confirm garment ownership / listing permissions before publishing.", "error");
      return;
    }

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
        showToast("🎉 Garment published successfully! It is now live in the marketplace.");
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
          location: "Mumbai, Bandra West Atelier",
          externalRefUrl: "",
          ownershipConfirmed: false,
        });
        fetchData();
        setActiveTab("listings");
      }
    } catch (err) {
      console.error("Listing creation failed:", err);
      showToast(err.response?.data?.message || "Failed to create garment listing", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 403 Forbidden State
  if (!token || !isProvider) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, maxWidth: 500, width: "100%", textAlign: "center", borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
          <LockIcon sx={{ fontSize: 60, color: "#D32F2F", mb: 2 }} />
          <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, mb: 1, color: "#1A1817" }}>
            Provider Studio Restricted
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
            You do not have boutique provider permissions to access the Atelier Studio. Please sign in with a registered provider account.
          </Typography>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
            sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700, "&:hover": { bgcolor: "#2E2A27" } }}
          >
            Return to Storefront
          </Button>
        </Paper>
      </Box>
    );
  }

  const menuItems = [
    { id: "overview", label: "Studio Overview", icon: <OverviewIcon /> },
    { id: "listings", label: "My Listings", icon: <DressesIcon />, badge: listings.length },
    { id: "add-dress", label: "+ Add Garment", icon: <AddIcon /> },
    { id: "requests", label: "Rental Bookings", icon: <OrdersIcon />, badge: stats.totalOrders },
    { id: "earnings", label: "Earnings & Ledger", icon: <EarningsIcon /> },
    { id: "profile", label: "Boutique Profile", icon: <BoutiqueIcon /> },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#FAFAFA" }}>
      {/* STUDIO TOP HEADER */}
      <Paper
        elevation={0}
        sx={{
          py: 1.5,
          px: { xs: 2, md: 4 },
          borderBottom: "1px solid #ECE7DE",
          bgcolor: "#FFFFFF",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <RouterLink to="/" style={{ textDecoration: "none" }}>
            <WardrobeWondersLogo size="small" />
          </RouterLink>
          <Chip
            label="Boutique Studio"
            size="small"
            sx={{
              bgcolor: "#1A1817",
              color: "#D1A362",
              fontWeight: 800,
              fontSize: "0.7rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              borderRadius: 1.5,
            }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ShopIcon />}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "#ECE7DE",
              color: "#1A1817",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              display: { xs: "none", sm: "inline-flex" },
              "&:hover": { borderColor: "#D1A362", bgcolor: "#FAF8F5" },
            }}
          >
            Client Storefront
          </Button>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: "#1A1817", color: "#D1A362", width: 34, height: 34, fontSize: "0.85rem", fontWeight: 700 }}>
              {(user.name || user.firstname || "L")[0].toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817", lineHeight: 1.2 }}>
                {user.name || user.firstname || "Boutique Owner"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#888" }}>
                Verified Atelier Lender
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={handleLogout} size="small" title="Sign Out" sx={{ color: "#888", "&:hover": { color: "#D32F2F" } }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      {/* MOBILE TAB BAR */}
      {isMobile && (
        <Box sx={{ borderBottom: "1px solid #ECE7DE", bgcolor: "#FFFFFF", overflowX: "auto" }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Provider Studio Navigation"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "#666",
                minHeight: 48,
                "&.Mui-selected": { color: "#1A1817", fontWeight: 700 },
              },
              "& .MuiTabs-indicator": { bgcolor: "#D1A362", height: 3 },
            }}
          >
            {menuItems.map((item) => (
              <Tab key={item.id} value={item.id} label={item.label} icon={item.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>
      )}

      {/* STUDIO MAIN WORKSPACE */}
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        {/* DESKTOP LEFT SIDEBAR */}
        {!isMobile && (
          <Box
            sx={{
              width: 250,
              flexShrink: 0,
              borderRight: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
              py: 3,
            }}
          >
            <List component="nav" disablePadding>
              {menuItems.map((item) => (
                <ListItemButton
                  key={item.id}
                  selected={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    py: 1.4,
                    px: 3,
                    my: 0.5,
                    mx: 1.5,
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: "#1A1817",
                      color: "#FFFFFF",
                      "&:hover": { bgcolor: "#2E2A27" },
                      "& .MuiListItemIcon-root": { color: "#D1A362" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: activeTab === item.id ? "#D1A362" : "#777" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: activeTab === item.id ? 700 : 500,
                    }}
                  />
                  {item.badge != null && item.badge > 0 && (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        bgcolor: activeTab === item.id ? "rgba(209, 163, 98, 0.25)" : "#F0ECE4",
                        color: activeTab === item.id ? "#D1A362" : "#555",
                      }}
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}

        {/* WORKSPACE CONTENT */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2.5, sm: 4, md: 5 },
            pb: { xs: 12, md: 6 }, // clearance above mobile bottom nav
            maxWidth: "1400px",
            mx: "auto",
            width: "100%",
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
              <Stack spacing={2} alignItems="center">
                <CircularProgress sx={{ color: "#D1A362" }} size={44} />
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Synchronizing Studio Inventory...
                </Typography>
              </Stack>
            </Box>
          ) : (
            <>
              {activeTab === "overview" && (
                <ProviderOverview
                  stats={stats}
                  listings={listings}
                  user={user}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === "listings" && (
                <ProviderListings
                  listings={listings}
                  onAddClick={() => setActiveTab("add-dress")}
                  onToggleAvailability={handleToggleAvailability}
                  onOpenDelete={(item) =>
                    setDeleteDialog({ open: true, listingId: item._id, title: item.title || item.name })
                  }
                />
              )}

              {activeTab === "add-dress" && (
                <ProviderAddDress
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleCreateListing}
                  onFileUpload={handleFileUpload}
                  uploading={uploading}
                  onGenerateAi={handleGenerateAi}
                  aiLoading={aiLoading}
                  actionLoading={actionLoading}
                />
              )}

              {activeTab === "requests" && (
                <ProviderRentalRequests
                  orders={orders}
                  orderFilter={orderFilter}
                  setOrderFilter={setOrderFilter}
                  onAcceptClick={(order) => setAcceptModal({ open: true, order })}
                  onDeclineClick={(order) =>
                    setDeclineModal({
                      open: true,
                      order,
                      reason: "Garment undergoing maintenance or dry cleaning",
                      customNote: "",
                    })
                  }
                  onUpdateStatus={handleOrderStatusUpdate}
                  actionLoading={actionLoading}
                />
              )}

              {activeTab === "earnings" && <ProviderEarnings stats={stats} orders={orders} />}

              {activeTab === "profile" && (
                <Box maxWidth="700px">
                  <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#1A1817", mb: 0.5 }}>
                    Boutique & Lender Profile
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                    Your public lender information and payout preferences.
                  </Typography>

                  <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                    <Stack spacing={3}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: "#1A1817", color: "#D1A362", fontSize: "1.5rem", fontWeight: 800 }}>
                          {(user.name || "P")[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817" }}>
                            {user.name || user.firstname || "Boutique Owner"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#8C6D3B", fontWeight: 600 }}>
                            Role: {user.role || "provider"} &bull; Verified Lender
                          </Typography>
                        </Box>
                      </Box>

                      <TextField fullWidth size="small" label="Full Name" defaultValue={user.name} disabled />
                      <TextField fullWidth size="small" label="Registered Email" defaultValue={user.email} disabled />
                      <TextField fullWidth size="small" label="Contact Phone" defaultValue={user.phone} disabled />
                      <TextField fullWidth size="small" label="Atelier Hub Location" defaultValue="Mumbai, Bandra West Atelier" />

                      <Button
                        variant="contained"
                        sx={{ alignSelf: "flex-start", bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700, "&:hover": { bgcolor: "#2E2A27" } }}
                        onClick={() => showToast("Boutique settings updated.")}
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
        <DialogTitle sx={{ fontWeight: 700 }}>Remove Garment Listing?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#666" }}>
            Are you sure you want to remove <strong>&ldquo;{deleteDialog.title}&rdquo;</strong>? It will no longer be visible for customer bookings.
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
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ACCEPT MODAL */}
      <Dialog open={acceptModal.open} onClose={() => setAcceptModal({ open: false, order: null })} maxWidth="sm" fullWidth>
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
                    Window: {new Date(acceptModal.order.rentalStartDate || acceptModal.order.startDate).toLocaleDateString()} &rarr;{" "}
                    {new Date(acceptModal.order.rentalEndDate || acceptModal.order.endDate).toLocaleDateString()} ({acceptModal.order.rentalDays || acceptModal.order.quantity} days)
                  </Typography>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#FAF8F5", borderColor: "#ECE7DE" }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Earnings Breakdown
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
                    Platform Commission (15%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    - ₹{Math.round((acceptModal.order.totalAmount || 0) * 0.15).toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle2" fontWeight={800} color="#2E7D32">
                    Estimated Net Provider Payout (85%)
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="#2E7D32">
                    ₹{Math.round((acceptModal.order.totalAmount || 0) * 0.85).toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAcceptModal({ open: false, order: null })} sx={{ color: "#777" }}>
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

      {/* DECLINE MODAL */}
      <Dialog
        open={declineModal.open}
        onClose={() => setDeclineModal({ open: false, order: null, reason: "Garment undergoing maintenance or dry cleaning", customNote: "" })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#D32F2F" }}>
          Decline Rental Request
        </DialogTitle>
        <DialogContent dividers>
          {declineModal.order && (
            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Decline the reservation request for <strong>{declineModal.order.product?.name || "this garment"}</strong> from <strong>{declineModal.order.userEmail}</strong>?
              </Typography>

              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>
                  Reason for Declining
                </FormLabel>
                <RadioGroup
                  value={declineModal.reason}
                  onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
                >
                  <FormControlLabel value="Garment undergoing maintenance or dry cleaning" control={<Radio size="small" />} label={<Typography variant="body2">Garment undergoing maintenance or dry cleaning</Typography>} />
                  <FormControlLabel value="Private event or unavailable for listed window" control={<Radio size="small" />} label={<Typography variant="body2">Private event or unavailable for listed window</Typography>} />
                  <FormControlLabel value="Garment undergoing quality inspection or repair" control={<Radio size="small" />} label={<Typography variant="body2">Garment undergoing quality inspection or repair</Typography>} />
                  <FormControlLabel value="Date conflict with another booking" control={<Radio size="small" />} label={<Typography variant="body2">Date conflict with another booking</Typography>} />
                  <FormControlLabel value="Other" control={<Radio size="small" />} label={<Typography variant="body2">Other</Typography>} />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Optional Details / Custom Note for Customer"
                value={declineModal.customNote}
                onChange={(e) => setDeclineModal({ ...declineModal, customNote: e.target.value })}
              />

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Declining this order will instantly release the reserved dates on your garment&apos;s calendar so other renters can book.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeclineModal({ open: false, order: null, reason: "Garment undergoing maintenance or dry cleaning", customNote: "" })} sx={{ color: "#777" }}>
            Keep Order
          </Button>
          <Button onClick={confirmDeclineOrder} variant="contained" color="error" disabled={actionLoading} sx={{ fontWeight: 700 }}>
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

      <Fotter />
    </Box>
  );
};

export default ProviderStudio;
