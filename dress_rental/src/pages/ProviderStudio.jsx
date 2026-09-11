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
  FormControlLabel,
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
  VisibilityOutlined as ViewIcon,
  OpenInNew as ExternalIcon,
  Logout as LogoutIcon,
  ShoppingBagOutlined as ShopIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as ActiveIcon,
  PauseCircleOutline as InactiveIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";

// Sample preset luxury wardrobe assets for quick selection
const SAMPLE_ASSETS = [
  { label: "Cocktail Gown", url: "/assets/Cocktail Gown.jpg", category: "Party", gender: "women" },
  { label: "Bridal Lehenga", url: "/assets/Bridal.jpg", category: "Wedding", gender: "women" },
  { label: "Anarkali Suit", url: "/assets/Anarkali.jpg", category: "Traditional", gender: "women" },
  { label: "Silk Saree", url: "/assets/black_saree.jpg", category: "Traditional", gender: "women" },
  { label: "Women's Blazer", url: "/assets/Blazer.jpg", category: "Formal", gender: "women" },
  { label: "Classic Tuxedo", url: "/assets/Men/men1.jpg", category: "Formal", gender: "men" },
  { label: "Men's Sherwani", url: "/assets/Men/men2.jpg", category: "Wedding", gender: "men" },
  { label: "Men's Party Suit", url: "/assets/Men/men3.jpg", category: "Party", gender: "men" },
];

const ProviderStudio = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalOrders: 0,
    totalEarnings: 0,
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Delete Confirmation Dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, listingId: null, title: "" });

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
    description: "",
    color: "",
    location: "Mumbai, Bandra West",
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch Stats & Listings
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, listingsRes] = await Promise.all([
        axios.get(`${BASE_URL}/provider/stats`, authHeaders),
        axios.get(`${BASE_URL}/provider/listings`, authHeaders),
      ]);
      if (statsRes.data?.status) setStats(statsRes.data.stats);
      if (listingsRes.data?.status) setListings(listingsRes.data.listings);
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

    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        rentalPricePerDay: Number(formData.rentalPricePerDay),
        securityDeposit: String(formData.securityDeposit),
        images: [formData.image],
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
          description: "",
          color: "",
          location: "Mumbai, Bandra West",
        });
        await fetchData();
        setActiveTab("listings");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to publish listing", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

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
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" mb={0.5}>
                      List a New Dress
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Provide accurate details, sizes, and pricing to make your garment attractive to renters.
                    </Typography>
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

                        {/* Section 4: Imagery & Photo Selection */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#D1A362" textTransform="uppercase" mb={1}>
                            4. Garment Photo
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Select from curated high-fashion photography or provide an image link:
                          </Typography>

                          {/* Quick Sample Asset Selectors */}
                          <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            {SAMPLE_ASSETS.map((sample, idx) => (
                              <Grid item xs={6} sm={3} key={idx}>
                                <Paper
                                  elevation={0}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      image: sample.url,
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

                          <TextField
                            fullWidth
                            label="Photo Image URL"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            required
                          />
                        </Box>

                        {/* Section 5: Description */}
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} color="#D1A362" textTransform="uppercase" mb={2}>
                            5. Description & Styling Notes
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            placeholder="Describe the fabric, silhouette, embroidery details, and matching styling recommendations..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

              {/* TAB 4: RENTAL REQUESTS */}
              {activeTab === "requests" && (
                <Box>
                  <Typography variant="h5" fontWeight={800} mb={1}>
                    Rental Requests & Active Bookings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Incoming orders and reservations placed by customers for your dresses.
                  </Typography>

                  <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px dashed #DDD" }}>
                    <OrdersIcon sx={{ fontSize: 56, color: "#D1A362", mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} mb={0.5}>
                      No pending rental requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary" maxWidth={420} mx="auto">
                      As soon as customers book one of your dresses through the marketplace, their booking requests, rental duration, and verification details will appear here.
                    </Typography>
                  </Paper>
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
