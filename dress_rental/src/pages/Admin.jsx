import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
} from "@mui/material";
import {
  AdminPanelSettingsOutlined as AdminIcon,
  PeopleAltOutlined as UsersIcon,
  CheckroomOutlined as DressesIcon,
  ReceiptLongOutlined as OrdersIcon,
  ReportProblemOutlined as ReportsIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  LockOutlined as LockIcon,
  HomeOutlined as HomeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";

// Modular Admin Components
import AdminOverview from "../components/admin/AdminOverview";
import AdminUsers from "../components/admin/AdminUsers";
import AdminListings from "../components/admin/AdminListings";
import AdminOrders from "../components/admin/AdminOrders";
import AdminReports from "../components/admin/AdminReports";
import AdminStoreApplications from "../components/admin/AdminStoreApplications";
import AdminStoreProducts from "../components/admin/AdminStoreProducts";
import AdminStoreFinances from "../components/admin/AdminStoreFinances";
import AdminStoreFulfilments from "../components/admin/AdminStoreFulfilments";
import AdminStorePostPurchase from "../components/admin/AdminStorePostPurchase";
import {
  StorefrontOutlined as StoreIcon,
  LocalOfferOutlined as StoreProductIcon,
  AccountBalanceWalletOutlined as FinancesIcon,
  LocalShippingOutlined as ShippingIcon,
  AssignmentReturnOutlined as PostPurchaseIcon,
} from "@mui/icons-material";

const Admin = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Data states
  const [overview, setOverview] = useState(null);
  const [storeOverview, setStoreOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [storeApplications, setStoreApplications] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);

  // Filter states
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  const [listingSearchQuery, setListingSearchQuery] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [listingCategoryFilter, setListingCategoryFilter] = useState("all");

  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");

  // Store filter states
  const [storeAppStatusFilter, setStoreAppStatusFilter] = useState("all");
  const [storeAppQuery, setStoreAppQuery] = useState("");
  const [storeProductStatusFilter, setStoreProductStatusFilter] = useState("all");
  const [storeProductConditionFilter, setStoreProductConditionFilter] = useState("all");
  const [storeProductQuery, setStoreProductQuery] = useState("");

  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const showToast = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  // Role Gate: Only verified admin role allowed
  const isAdmin = user && (user.role === "admin" || user.type === "admin");

  // Fetch functions
  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/overview`, authHeaders);
      if (res.data?.success) setOverview(res.data.overview);
    } catch (err) {
      console.error("Overview error:", err);
    }
  }, [authHeaders]);

  const fetchStoreOverview = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/store/overview`, authHeaders);
      if (res.data?.success) setStoreOverview(res.data.metrics);
    } catch (err) {
      console.error("Store overview error:", err);
    }
  }, [authHeaders]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = {};
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userStatusFilter !== "all") params.status = userStatusFilter;
      if (userQuery.trim()) params.q = userQuery.trim();
      const res = await axios.get(`${BASE_URL}/admin/users`, { ...authHeaders, params });
      if (res.data?.success) setUsers(res.data.users);
    } catch (err) {
      console.error("Fetch users error:", err);
      showToast("Failed to fetch users", "error");
    }
  }, [authHeaders, userRoleFilter, userStatusFilter, userQuery]);

  const fetchListings = useCallback(async () => {
    try {
      const params = {};
      if (listingStatusFilter !== "all") params.status = listingStatusFilter;
      if (listingCategoryFilter !== "all") params.category = listingCategoryFilter;
      if (listingSearchQuery.trim()) params.q = listingSearchQuery.trim();
      const res = await axios.get(`${BASE_URL}/admin/listings`, { ...authHeaders, params });
      if (res.data?.success) setListings(res.data.listings);
    } catch (err) {
      console.error("Fetch listings error:", err);
      showToast("Failed to fetch listings", "error");
    }
  }, [authHeaders, listingStatusFilter, listingCategoryFilter, listingSearchQuery]);

  const fetchOrders = useCallback(async () => {
    try {
      const params = {};
      if (orderStatusFilter !== "all" && orderStatusFilter !== "refund_attention") {
        params.status = orderStatusFilter;
      }
      const res = await axios.get(`${BASE_URL}/admin/orders`, { ...authHeaders, params });
      if (res.data?.success) setOrders(res.data.orders);
    } catch (err) {
      console.error("Fetch orders error:", err);
      showToast("Failed to fetch orders", "error");
    }
  }, [authHeaders, orderStatusFilter]);

  const fetchReports = useCallback(async () => {
    try {
      const params = {};
      if (reportStatusFilter !== "all") params.status = reportStatusFilter;
      const res = await axios.get(`${BASE_URL}/admin/reports`, { ...authHeaders, params });
      if (res.data?.success) setReports(res.data.reports);
    } catch (err) {
      console.error("Fetch reports error:", err);
      showToast("Failed to fetch reports", "error");
    }
  }, [authHeaders, reportStatusFilter]);

  const fetchStoreApplications = useCallback(async () => {
    try {
      const params = {};
      if (storeAppStatusFilter !== "all") params.status = storeAppStatusFilter;
      if (storeAppQuery.trim()) params.q = storeAppQuery.trim();
      const res = await axios.get(`${BASE_URL}/admin/store/applications`, { ...authHeaders, params });
      if (res.data?.success) setStoreApplications(res.data.applications);
    } catch (err) {
      console.error("Fetch store applications error:", err);
      showToast("Failed to fetch store applications", "error");
    }
  }, [authHeaders, storeAppStatusFilter, storeAppQuery]);

  const fetchStoreProducts = useCallback(async () => {
    try {
      const params = {};
      if (storeProductStatusFilter !== "all") params.status = storeProductStatusFilter;
      if (storeProductConditionFilter !== "all") params.condition = storeProductConditionFilter;
      if (storeProductQuery.trim()) params.q = storeProductQuery.trim();
      const res = await axios.get(`${BASE_URL}/admin/store/products`, { ...authHeaders, params });
      if (res.data?.success) setStoreProducts(res.data.products);
    } catch (err) {
      console.error("Fetch store products error:", err);
      showToast("Failed to fetch store products", "error");
    }
  }, [authHeaders, storeProductStatusFilter, storeProductConditionFilter, storeProductQuery]);

  const loadTabData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    if (activeTab === "overview") {
      await Promise.all([fetchOverview(), fetchStoreOverview()]);
    } else if (activeTab === "users") await fetchUsers();
    else if (activeTab === "listings") await fetchListings();
    else if (activeTab === "orders") await fetchOrders();
    else if (activeTab === "reports") await fetchReports();
    else if (activeTab === "store_apps") await fetchStoreApplications();
    else if (activeTab === "store_products") await fetchStoreProducts();
    setLoading(false);
  }, [
    isAdmin,
    activeTab,
    fetchOverview,
    fetchUsers,
    fetchListings,
    fetchOrders,
    fetchReports,
    fetchStoreApplications,
    fetchStoreProducts,
    fetchStoreOverview,
  ]);

  // Initial load and tab change listener
  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Always refresh overview count badges in background
  useEffect(() => {
    if (isAdmin && activeTab !== "overview") {
      fetchOverview();
      fetchStoreOverview();
    }
  }, [isAdmin, activeTab, fetchOverview, fetchStoreOverview]);

  // Handlers for mutations
  const handleToggleUserStatus = async (targetUser) => {
    if (String(user._id) === String(targetUser._id)) {
      showToast("Self-deactivation is rejected for administrative safety.", "error");
      return;
    }
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
        showToast(`User ${newStatus ? "activated" : "deactivated"} successfully.`);
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
        showToast(`Listing ${action === "approve" || action === "restore" ? "restored to live catalog" : "deactivated"}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to moderate listing", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRefund = async (orderId, notes) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/payment/orders/${orderId}/refund/manual-confirm`,
        { notes },
        authHeaders
      );
      if (res.data?.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  refundStatus: "SUCCEEDED",
                  paymentStatus: "REFUNDED",
                  depositStatus: "REFUNDED",
                  manualRefundNotes: notes,
                  refundCompletedAt: new Date().toISOString(),
                }
              : o
          )
        );
        showToast("Refund marked SUCCEEDED and recorded in ledger.");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to confirm refund", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = async (reportId, payload) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/reports/${reportId}/resolve`,
        payload,
        authHeaders
      );
      if (res.data?.success) {
        setReports((prev) =>
          prev.map((r) =>
            r._id === reportId
              ? {
                  ...r,
                  status: payload.status,
                  adminNotes: payload.adminNotes,
                  resolvedAt: new Date().toISOString(),
                }
              : r
          )
        );
        showToast(`Dispute marked as ${payload.status}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to resolve report", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewStoreApplication = async (applicationId, action, notes) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/store/applications/${applicationId}/review`,
        { action, notes },
        authHeaders
      );
      if (res.data?.success) {
        setStoreApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId
              ? { ...app, status: action, adminReviewNotes: notes }
              : app
          )
        );
        showToast(`Seller application has been ${action}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to review seller application", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModerateStoreProduct = async (productId, action, notes) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/store/products/${productId}/moderate`,
        { action, notes },
        authHeaders
      );
      if (res.data?.success) {
        setStoreProducts((prev) =>
          prev.map((p) =>
            p._id === productId
              ? { ...p, status: action, adminReviewNotes: notes }
              : p
          )
        );
        showToast(`Store listing has been ${action}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to moderate store listing", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // If not authenticated or not admin, show explicit 403 Access Denied
  if (!token || !isAdmin) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}>
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <LockIcon sx={{ fontSize: 64, color: "#D32F2F", mb: 2 }} />
            <Typography variant="h4" fontWeight={800} color="#1A1817" mb={1} fontFamily='"Playfair Display", Georgia, serif'>
              403 — Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              You do not have administrative clearance to access the Wardrobe Wonders operations console. Only verified administrators may enter this section.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => navigate("/")}
                sx={{ bgcolor: "#1A1817", color: "#FFFFFF", fontWeight: 700, borderRadius: 2 }}
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

  const pendingReportsCount = overview?.reports?.pending || 0;
  const pendingOrdersCount = overview?.rentals?.pending || 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", color: "#1A1817" }}>
      <ResponsiveAppBar />

      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
        {/* Header Bar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AdminIcon sx={{ fontSize: 32, color: "#D1A362" }} />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#1A1817",
                }}
              >
                Marketplace Operations Console
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Central oversight of users, designer catalog moderation, rental pipelines, escrow deposits, and compliance disputes.
            </Typography>
          </Box>

          <Button
            startIcon={<RefreshIcon />}
            onClick={loadTabData}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "#ECE7DE",
              bgcolor: "#FFFFFF",
              color: "#1A1817",
              fontWeight: 700,
              borderRadius: 2,
              px: 2,
              py: 0.8,
              "&:hover": { bgcolor: "#F5F2EB" },
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* Navigation Tabs */}
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1, mb: 3 }}>
          {[
            { id: "overview", label: "Executive Overview", icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
            { id: "users", label: "Users & Roles", icon: <UsersIcon sx={{ fontSize: 18 }} /> },
            { id: "listings", label: "Garment Catalog", icon: <DressesIcon sx={{ fontSize: 18 }} /> },
            {
              id: "orders",
              label: "Order Ledger",
              icon: <OrdersIcon sx={{ fontSize: 18 }} />,
              badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
            },
            {
              id: "reports",
              label: "Trust & Disputes",
              icon: <ReportsIcon sx={{ fontSize: 18 }} />,
              badge: pendingReportsCount > 0 ? pendingReportsCount : null,
              badgeColor: "error",
            },
            {
              id: "store_apps",
              label: "Store Applications",
              icon: <StoreIcon sx={{ fontSize: 18 }} />,
              badge: (storeOverview?.applications?.pending || 0) > 0 ? storeOverview.applications.pending : null,
              badgeColor: "warning",
            },
            {
              id: "store_products",
              label: "Store Moderation",
              icon: <StoreProductIcon sx={{ fontSize: 18 }} />,
              badge: (storeOverview?.products?.pending || 0) > 0 ? storeOverview.products.pending : null,
              badgeColor: "warning",
            },
            {
              id: "store_finances",
              label: "Store Finances & Ledger",
              icon: <FinancesIcon sx={{ fontSize: 18 }} />,
            },
            {
              id: "store_fulfilments",
              label: "Store Deliveries",
              icon: <ShippingIcon sx={{ fontSize: 18 }} />,
            },
            {
              id: "store_post_purchase",
              label: "Returns & Reviews",
              icon: <PostPurchaseIcon sx={{ fontSize: 18 }} />,
              badge:
                ((storeOverview?.postPurchase?.pendingCancellations || 0) +
                  (storeOverview?.postPurchase?.pendingReturns || 0) +
                  (storeOverview?.postPurchase?.pendingReviews || 0)) > 0
                  ? (storeOverview?.postPurchase?.pendingCancellations || 0) +
                    (storeOverview?.postPurchase?.pendingReturns || 0) +
                    (storeOverview?.postPurchase?.pendingReviews || 0)
                  : null,
              badgeColor: "warning",
            },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Badge
                key={tab.id}
                badgeContent={tab.badge}
                color={tab.badgeColor || "warning"}
                sx={{ "& .MuiBadge-badge": { fontWeight: 700, fontSize: "0.7rem", top: 4, right: 8 } }}
              >
                <Chip
                  icon={tab.icon}
                  label={tab.label}
                  clickable
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    bgcolor: isSelected ? "#1A1817" : "#FFFFFF",
                    color: isSelected ? "#FFFFFF" : "#555555",
                    border: isSelected ? "1px solid #1A1817" : "1px solid #ECE7DE",
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: "0.85rem",
                    px: 1.8,
                    py: 2.2,
                    borderRadius: 2,
                    "& .MuiChip-icon": { color: isSelected ? "#D1A362" : "#888888" },
                    "&:hover": { bgcolor: isSelected ? "#1A1817" : "#F5F2EB" },
                  }}
                />
              </Badge>
            );
          })}
        </Stack>

        {/* Main Content Area */}
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12}>
            <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Synchronizing operations console...
            </Typography>
          </Box>
        ) : (
          <>
            {activeTab === "overview" && (
              <AdminOverview
                overview={overview}
                storeOverview={storeOverview}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onRefresh={() => {
                  fetchOverview();
                  fetchStoreOverview();
                }}
              />
            )}

            {activeTab === "users" && (
              <AdminUsers
                users={users}
                currentUser={user}
                onToggleStatus={handleToggleUserStatus}
                actionLoading={actionLoading}
                userQuery={userQuery}
                setUserQuery={setUserQuery}
                roleFilter={userRoleFilter}
                setRoleFilter={setUserRoleFilter}
                statusFilter={userStatusFilter}
                setStatusFilter={setUserStatusFilter}
                onSearch={fetchUsers}
                onRefresh={fetchUsers}
              />
            )}

            {activeTab === "listings" && (
              <AdminListings
                listings={listings}
                onModerate={handleModerateListing}
                actionLoading={actionLoading}
                searchQuery={listingSearchQuery}
                setSearchQuery={setListingSearchQuery}
                statusFilter={listingStatusFilter}
                setStatusFilter={setListingStatusFilter}
                categoryFilter={listingCategoryFilter}
                setCategoryFilter={setListingCategoryFilter}
                onSearch={fetchListings}
                onRefresh={fetchListings}
              />
            )}

            {activeTab === "orders" && (
              <AdminOrders
                orders={orders}
                onConfirmRefund={handleConfirmRefund}
                actionLoading={actionLoading}
                statusFilter={orderStatusFilter}
                setStatusFilter={setOrderStatusFilter}
                onRefresh={fetchOrders}
              />
            )}

            {activeTab === "reports" && (
              <AdminReports
                reports={reports}
                onResolveReport={handleResolveReport}
                actionLoading={actionLoading}
                statusFilter={reportStatusFilter}
                setStatusFilter={setReportStatusFilter}
                onRefresh={fetchReports}
              />
            )}

            {activeTab === "store_apps" && (
              <AdminStoreApplications
                applications={storeApplications}
                onReview={handleReviewStoreApplication}
                actionLoading={actionLoading}
                statusFilter={storeAppStatusFilter}
                setStatusFilter={setStoreAppStatusFilter}
                searchQuery={storeAppQuery}
                setSearchQuery={setStoreAppQuery}
                onRefresh={fetchStoreApplications}
              />
            )}

            {activeTab === "store_products" && (
              <AdminStoreProducts
                products={storeProducts}
                onModerate={handleModerateStoreProduct}
                actionLoading={actionLoading}
                statusFilter={storeProductStatusFilter}
                setStatusFilter={setStoreProductStatusFilter}
                conditionFilter={storeProductConditionFilter}
                setConditionFilter={setStoreProductConditionFilter}
                searchQuery={storeProductQuery}
                setSearchQuery={setStoreProductQuery}
                onRefresh={fetchStoreProducts}
              />
            )}

            {activeTab === "store_finances" && <AdminStoreFinances />}
            {activeTab === "store_fulfilments" && <AdminStoreFulfilments />}
            {activeTab === "store_post_purchase" && <AdminStorePostPurchase />}
          </>
        )}
      </Container>

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

export default Admin;
