import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  AdminPanelSettingsOutlined as AdminIcon,
  PeopleAltOutlined as UsersIcon,
  CheckroomOutlined as DressesIcon,
  ReceiptLongOutlined as OrdersIcon,
  ReportProblemOutlined as ReportsIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Visibility as ViewIcon,
  LockOutlined as LockIcon,
  HomeOutlined as HomeIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Data states
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);

  // Filter states
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");

  // Report resolution modal
  const [resolveModal, setResolveModal] = useState({
    open: false,
    report: null,
    status: "resolved",
    adminNotes: "",
    deactivateListing: false,
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const showToast = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  // Role Gate: Only 'admin' role allowed
  const isAdmin = user && (user.role === "admin" || user.type === "admin");

  // Fetch functions
  const fetchOverview = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/overview`, authHeaders);
      if (res.data?.success) setOverview(res.data.overview);
    } catch (err) {
      console.error("Overview error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {};
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userQuery.trim()) params.q = userQuery.trim();
      const res = await axios.get(`${BASE_URL}/admin/users`, { ...authHeaders, params });
      if (res.data?.success) setUsers(res.data.users);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchListings = async () => {
    try {
      const params = {};
      if (listingStatusFilter !== "all") params.status = listingStatusFilter;
      const res = await axios.get(`${BASE_URL}/admin/listings`, { ...authHeaders, params });
      if (res.data?.success) setListings(res.data.listings);
    } catch (err) {
      console.error("Fetch listings error:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const params = {};
      if (orderStatusFilter !== "all") params.status = orderStatusFilter;
      const res = await axios.get(`${BASE_URL}/admin/orders`, { ...authHeaders, params });
      if (res.data?.success) setOrders(res.data.orders);
    } catch (err) {
      console.error("Fetch orders error:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const params = {};
      if (reportStatusFilter !== "all") params.status = reportStatusFilter;
      const res = await axios.get(`${BASE_URL}/admin/reports`, { ...authHeaders, params });
      if (res.data?.success) setReports(res.data.reports);
    } catch (err) {
      console.error("Fetch reports error:", err);
    }
  };

  const loadTabData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    if (activeTab === "overview") await fetchOverview();
    else if (activeTab === "users") await fetchUsers();
    else if (activeTab === "listings") await fetchListings();
    else if (activeTab === "orders") await fetchOrders();
    else if (activeTab === "reports") await fetchReports();
    setLoading(false);
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab, userRoleFilter, listingStatusFilter, orderStatusFilter, reportStatusFilter]);

  // Actions
  const handleToggleUserStatus = async (targetUser) => {
    setActionLoading(true);
    try {
      const newStatus = !targetUser.isActive;
      const res = await axios.put(
        `${BASE_URL}/admin/users/${targetUser._id}/status`,
        { isActive: newStatus },
        authHeaders
      );
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: newStatus } : u))
        );
        showToast(`User ${newStatus ? "activated" : "deactivated"} successfully`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update user status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModerateListing = async (listingId, action) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/listings/${listingId}/moderate`,
        { action },
        authHeaders
      );
      if (res.data?.success) {
        setListings((prev) =>
          prev.map((l) => (l._id === listingId ? { ...l, status: res.data.listing.status } : l))
        );
        showToast(`Listing ${action === "approve" ? "approved" : "deactivated"}`);
      }
    } catch (err) {
      showToast("Failed to moderate listing", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = async () => {
    if (!resolveModal.report) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/reports/${resolveModal.report._id}/resolve`,
        {
          status: resolveModal.status,
          adminNotes: resolveModal.adminNotes,
          deactivateListing: resolveModal.deactivateListing,
        },
        authHeaders
      );
      if (res.data?.success) {
        setReports((prev) =>
          prev.map((r) =>
            r._id === resolveModal.report._id ? { ...r, status: resolveModal.status } : r
          )
        );
        showToast(`Report marked as ${resolveModal.status}`);
      }
    } catch (err) {
      showToast("Failed to resolve report", "error");
    } finally {
      setActionLoading(false);
      setResolveModal({ open: false, report: null, status: "resolved", adminNotes: "", deactivateListing: false });
    }
  };

  // If not authenticated or not admin, show explicit 403 Access Denied
  if (!token || !isAdmin) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}>
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
            <LockIcon sx={{ fontSize: 64, color: "#D32F2F", mb: 2 }} />
            <Typography variant="h4" fontWeight={800} color="#1A1817" mb={1}>
              403 — Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              You do not have administrative clearance to access the Wardrobe Wonders moderation console. Only verified administrators may enter this section.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => navigate("/")}
                sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700, borderRadius: 2 }}
              >
                Return to Home
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/login")}
                sx={{ borderColor: "#1A1817", color: "#1A1817", fontWeight: 700, borderRadius: 2 }}
              >
                Sign In as Admin
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", color: "#1A1817" }}>
      <ResponsiveAppBar />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Bar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AdminIcon sx={{ fontSize: 32, color: "#D1A362" }} />
              <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                Marketplace Administration & Moderation
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Central oversight of users, designer inventory, rental request pipelines, and compliance reports.
            </Typography>
          </Box>

          <Button
            startIcon={<RefreshIcon />}
            onClick={loadTabData}
            variant="outlined"
            size="small"
            sx={{ borderColor: "#E0E0E0", color: "#1A1817", fontWeight: 600, borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Navigation Tabs */}
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1, mb: 3 }}>
          {[
            { id: "overview", label: "Executive Overview", icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
            { id: "users", label: "Users & Roles", icon: <UsersIcon sx={{ fontSize: 18 }} /> },
            { id: "listings", label: "Listing Moderation", icon: <DressesIcon sx={{ fontSize: 18 }} /> },
            { id: "orders", label: "Rental Orders", icon: <OrdersIcon sx={{ fontSize: 18 }} /> },
            { id: "reports", label: "Reports & Compliance", icon: <ReportsIcon sx={{ fontSize: 18 }} /> },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Chip
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                clickable
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  bgcolor: isSelected ? "#1A1817" : "#FFF",
                  color: isSelected ? "#FFF" : "#555",
                  border: isSelected ? "1px solid #1A1817" : "1px solid #E0E0E0",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.85rem",
                  px: 1.5,
                  py: 2.2,
                  borderRadius: 2,
                  "& .MuiChip-icon": { color: isSelected ? "#D1A362" : "#777" },
                  "&:hover": { bgcolor: isSelected ? "#1A1817" : "#F5F5F5" },
                }}
              />
            );
          })}
        </Stack>

        {/* Main Content Area */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <CircularProgress sx={{ color: "#D1A362" }} />
          </Box>
        ) : (
          <>
            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {activeTab === "overview" && overview && (
              <Stack spacing={4}>
                {/* Revenue Metrics */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#1A1817", color: "#FFF" }}>
                  <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Financial Overview & Platform Take
                  </Typography>
                  <Grid container spacing={3} mt={0.5}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: "#AAA" }}>Marketplace GMV (Completed)</Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                        ₹{overview.finance.marketplaceVolume?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: "#AAA" }}>Net Rental Fees</Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: "#D1A362" }}>
                        ₹{overview.finance.rentalFeesVolume?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ color: "#AAA" }}>Est. Platform Revenue (15%)</Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: "#4CAF50" }}>
                        ₹{overview.finance.estimatedPlatformRevenue?.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* KPI Grid */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Users
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                        {overview.users.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {overview.users.customers} customers &bull; {overview.users.providers} providers
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Catalog Listings
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                        {overview.listings.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {overview.listings.active} active &bull; {overview.listings.inactive} paused
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Rental Requests
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: "#1976D2" }}>
                        {overview.rentals.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {overview.rentals.active} active &bull; {overview.rentals.completed} completed
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Compliance Reports
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: overview.reports.pending > 0 ? "#D32F2F" : "#2E7D32" }}>
                        {overview.reports.pending}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {overview.reports.total} total submitted
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            )}

            {/* TAB 2: USERS & ROLES */}
            {activeTab === "users" && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                    <TextField
                      size="small"
                      placeholder="Search users by name or email..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                      InputProps={{ startAdornment: <SearchIcon sx={{ color: "#999", mr: 1, fontSize: 20 }} /> }}
                      sx={{ width: 280 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={userRoleFilter}
                        label="Role"
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                      >
                        <MenuItem value="all">All Roles</MenuItem>
                        <MenuItem value="customer">Customers</MenuItem>
                        <MenuItem value="provider">Providers</MenuItem>
                        <MenuItem value="admin">Admins</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Total: <strong>{users.length}</strong> accounts
                  </Typography>
                </Box>

                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                      <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: u.role === "provider" ? "#D1A362" : "#1A1817", width: 34, height: 34, fontSize: "0.85rem" }}>
                              {u.name ? u.name[0].toUpperCase() : "U"}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{u.name || "Unnamed"}</Typography>
                              <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={u.role || "customer"}
                            sx={{
                              bgcolor: u.role === "admin" ? "#EDE7F6" : u.role === "provider" ? "#FFF8E1" : "#E3F2FD",
                              color: u.role === "admin" ? "#512DA8" : u.role === "provider" ? "#F57F17" : "#0D47A1",
                              fontWeight: 700,
                              textTransform: "capitalize",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{u.phone || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={u.isActive ? "Active" : "Deactivated"}
                            sx={{
                              bgcolor: u.isActive ? "#E8F5E9" : "#FFEBEE",
                              color: u.isActive ? "#2E7D32" : "#C62828",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {u._id !== user._id && (
                            <Button
                              size="small"
                              variant={u.isActive ? "outlined" : "contained"}
                              color={u.isActive ? "error" : "success"}
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={actionLoading}
                              sx={{ fontWeight: 700, textTransform: "none" }}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {/* TAB 3: LISTING MODERATION */}
            {activeTab === "listings" && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={listingStatusFilter}
                      label="Status"
                      onChange={(e) => setListingStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Listings</MenuItem>
                      <MenuItem value="active">Active (Available)</MenuItem>
                      <MenuItem value="inactive">Inactive / Paused</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary">
                    Total: <strong>{listings.length}</strong> items
                  </Typography>
                </Box>

                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Garment</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Provider / Lender</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category & Size</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Pricing (Daily / Deposit)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Moderation Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listings.map((l) => (
                      <TableRow key={l._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              variant="rounded"
                              src={l.image || "/assets/Cocktail Gown.jpg"}
                              sx={{ width: 44, height: 56, borderRadius: 1.5 }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{l.title || l.name}</Typography>
                              <Typography variant="caption" color="text.secondary">Brand: {l.brand || "—"}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{l.providerId?.name || "Catalog"}</Typography>
                          <Typography variant="caption" color="text.secondary">{l.providerId?.email || ""}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{l.category} &bull; Size {l.size || "M"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>₹{l.rentalPricePerDay || l.price} / day</Typography>
                          <Typography variant="caption" color="text.secondary">Deposit: ₹{l.securityDeposit || l.advance}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={l.status || "active"}
                            sx={{
                              bgcolor: l.status === "active" ? "#E8F5E9" : "#EEEEEE",
                              color: l.status === "active" ? "#2E7D32" : "#616161",
                              fontWeight: 700,
                              textTransform: "capitalize",
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {l.status === "inactive" ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleModerateListing(l._id, "restore")}
                                disabled={actionLoading}
                                sx={{ fontWeight: 700, textTransform: "none" }}
                              >
                                Restore
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleModerateListing(l._id, "deactivate")}
                                disabled={actionLoading}
                                sx={{ fontWeight: 700, textTransform: "none" }}
                              >
                                Deactivate
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {/* TAB 4: RENTAL ORDERS */}
            {activeTab === "orders" && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={orderStatusFilter}
                      label="Status"
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Orders</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Accepted">Accepted</MenuItem>
                      <MenuItem value="Active">Active on Rent</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Declined">Declined</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary">
                    Total: <strong>{orders.length}</strong> rental requests
                  </Typography>
                </Box>

                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Garment</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Renter Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total Paid</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Deposit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o._id} hover>
                        <TableCell>
                          <Typography variant="caption" fontWeight={700}>
                            #{o.transactionId ? o.transactionId.slice(-8).toUpperCase() : o._id.slice(-8).toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{o.product?.title || o.product?.name || "Garment"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{o.userEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            {o.rentalStartDate ? new Date(o.rentalStartDate).toLocaleDateString() : "—"} &rarr;{" "}
                            {o.rentalEndDate ? new Date(o.rentalEndDate).toLocaleDateString() : "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">({o.rentalDays || o.quantity} Days)</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>₹{o.totalAmount?.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={o.requestStatus || o.status}
                            sx={{
                              bgcolor:
                                o.requestStatus === "Completed"
                                  ? "#E8F5E9"
                                  : o.requestStatus === "Active"
                                  ? "#E3F2FD"
                                  : o.requestStatus === "Pending"
                                  ? "#FFF3E0"
                                  : "#EEEEEE",
                              color:
                                o.requestStatus === "Completed"
                                  ? "#2E7D32"
                                  : o.requestStatus === "Active"
                                  ? "#0D47A1"
                                  : o.requestStatus === "Pending"
                                  ? "#E65100"
                                  : "#616161",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={o.depositStatus || "HELD"}
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              bgcolor: o.depositStatus === "REFUNDED" ? "#E8F5E9" : "#FFF8E1",
                              color: o.depositStatus === "REFUNDED" ? "#2E7D32" : "#F57F17",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            {/* TAB 5: REPORTS & COMPLIANCE */}
            {activeTab === "reports" && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={reportStatusFilter}
                      label="Status"
                      onChange={(e) => setReportStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Reports</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                      <MenuItem value="dismissed">Dismissed</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary">
                    Total: <strong>{reports.length}</strong> reports
                  </Typography>
                </Box>

                {reports.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <ReportsIcon sx={{ fontSize: 48, color: "#CCC", mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No compliance reports matching selected filter.
                    </Typography>
                  </Box>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Reported Listing</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Reporter</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.map((rep) => (
                        <TableRow key={rep._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {rep.listingId?.title || rep.listingId?.name || "Garment"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{rep.reporterEmail}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={rep.reason}
                              sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{rep.details || "—"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={rep.status}
                              sx={{
                                bgcolor: rep.status === "resolved" ? "#E8F5E9" : "#FFF3E0",
                                color: rep.status === "resolved" ? "#2E7D32" : "#E65100",
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {rep.status === "pending" && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  setResolveModal({
                                    open: true,
                                    report: rep,
                                    status: "resolved",
                                    adminNotes: "",
                                    deactivateListing: false,
                                  })
                                }
                                sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700, textTransform: "none" }}
                              >
                                Review & Resolve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            )}
          </>
        )}
      </Container>

      {/* RESOLVE REPORT DIALOG */}
      <Dialog
        open={resolveModal.open}
        onClose={() => setResolveModal({ open: false, report: null, status: "resolved", adminNotes: "", deactivateListing: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Resolve Compliance Report</DialogTitle>
        <DialogContent dividers>
          {resolveModal.report && (
            <Stack spacing={2.5}>
              <Typography variant="body2">
                Reported Garment: <strong>{resolveModal.report.listingId?.title || "Listing"}</strong>
              </Typography>
              <Typography variant="body2">
                Reported Reason: <strong>{resolveModal.report.reason}</strong>
              </Typography>
              {resolveModal.report.details && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Details: {resolveModal.report.details}
                </Typography>
              )}

              <FormControl fullWidth size="small">
                <InputLabel>Resolution Action</InputLabel>
                <Select
                  value={resolveModal.status}
                  label="Resolution Action"
                  onChange={(e) => setResolveModal({ ...resolveModal, status: e.target.value })}
                >
                  <MenuItem value="resolved">Mark Resolved</MenuItem>
                  <MenuItem value="dismissed">Dismiss (No Violation)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Administrative Notes"
                value={resolveModal.adminNotes}
                onChange={(e) => setResolveModal({ ...resolveModal, adminNotes: e.target.value })}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={resolveModal.deactivateListing}
                    onChange={(e) => setResolveModal({ ...resolveModal, deactivateListing: e.target.checked })}
                    color="error"
                  />
                }
                label={<Typography variant="body2">Deactivate & Unpublish Garment Listing immediately</Typography>}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setResolveModal({ open: false, report: null, status: "resolved", adminNotes: "", deactivateListing: false })}
            sx={{ color: "#777" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleResolveReport}
            disabled={actionLoading}
            sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Submit Resolution"}
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

export default Dashboard;
