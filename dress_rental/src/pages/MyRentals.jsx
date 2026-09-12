import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  CalendarMonthOutlined as CalendarIcon,
  LocalMallOutlined as BagIcon,
  StorefrontOutlined as AtelierIcon,
  CheckCircleOutline as CheckIcon,
  HourglassEmpty as PendingIcon,
  LocalShippingOutlined as ShippingIcon,
  AssignmentReturnOutlined as ReturnIcon,
  CancelOutlined as CancelIcon,
  InfoOutlined as InfoIcon,
  ShieldOutlined as ShieldIcon,
  ArrowForward as ArrowIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";

const MyRentals = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [cancelModal, setCancelModal] = useState({ open: false, order: null });
  const [instructionsModal, setInstructionsModal] = useState({ open: false, order: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchRentals = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      // First try authenticated /payment/my-rentals
      const res = await axios.get(`${BASE_URL}/payment/my-rentals`, authHeaders);
      if (res.data?.success && Array.isArray(res.data.orders)) {
        setRentals(res.data.orders);
      } else {
        // Fallback to /payment/orders/:email
        const fallbackRes = await axios.get(`${BASE_URL}/payment/orders/${user.email}`);
        if (Array.isArray(fallbackRes.data)) {
          setRentals(fallbackRes.data);
        }
      }
    } catch (err) {
      console.error("Failed to load customer rentals:", err);
      try {
        if (user.email) {
          const fbRes = await axios.get(`${BASE_URL}/payment/orders/${user.email}`);
          if (Array.isArray(fbRes.data)) setRentals(fbRes.data);
        }
      } catch (fbErr) {
        console.error("Fallback error:", fbErr);
        setNotification({ open: true, message: "Could not fetch your rentals", severity: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancelModal.order) return;
    setActionLoading(true);
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
          message: res.data?.message || "Failed to cancel rental",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Cancel order error:", err);
      setNotification({
        open: true,
        message: err.response?.data?.message || "Error cancelling rental request",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
      setCancelModal({ open: false, order: null });
    }
  };

  // Helper status determination
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
          label: "Awaiting Provider Approval",
          color: "#E65100",
          bg: "#FFF3E0",
          icon: <PendingIcon sx={{ fontSize: 16 }} />,
        };
      case "Accepted":
      case "Confirmed":
        return {
          label: "Confirmed & Reserved",
          color: "#1B5E20",
          bg: "#E8F5E9",
          icon: <CheckIcon sx={{ fontSize: 16 }} />,
        };
      case "Active":
        return {
          label: "Active on Rent",
          color: "#0D47A1",
          bg: "#E3F2FD",
          icon: <ShippingIcon sx={{ fontSize: 16 }} />,
        };
      case "Completed":
        return {
          label: "Rental Completed",
          color: "#2E7D32",
          bg: "#E8F5E9",
          icon: <CheckIcon sx={{ fontSize: 16 }} />,
        };
      case "Declined":
        return {
          label: "Request Declined",
          color: "#C62828",
          bg: "#FFEBEE",
          icon: <CancelIcon sx={{ fontSize: 16 }} />,
        };
      case "Cancelled":
        return {
          label: "Rental Cancelled",
          color: "#616161",
          bg: "#EEEEEE",
          icon: <CancelIcon sx={{ fontSize: 16 }} />,
        };
      default:
        return {
          label: status,
          color: "#424242",
          bg: "#F5F5F5",
          icon: <InfoIcon sx={{ fontSize: 16 }} />,
        };
    }
  };

  // Filter rentals
  const filteredRentals = rentals.filter((order) => {
    const s = getNormalizedStatus(order);
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return s === "Pending";
    if (activeFilter === "confirmed") return s === "Accepted" || s === "Confirmed";
    if (activeFilter === "active") return s === "Active";
    if (activeFilter === "completed") return s === "Completed";
    if (activeFilter === "cancelled") return s === "Cancelled" || s === "Declined";
    return true;
  });

  // Calculate high-level summary metrics
  const totalBookings = rentals.length;
  const activeCount = rentals.filter((r) => getNormalizedStatus(r) === "Active").length;
  const depositsHeld = rentals
    .filter((r) => ["Pending", "Accepted", "Confirmed", "Active"].includes(getNormalizedStatus(r)))
    .reduce((sum, r) => sum + (r.securityDeposit || 0), 0);
  const completedCount = rentals.filter((r) => getNormalizedStatus(r) === "Completed").length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", color: "#1A1817" }}>
      <ResponsiveAppBar />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Header Title & Refresh */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={3}>
          <Box>
            <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Customer Wardrobe
            </Typography>
            <Typography variant="h3" fontWeight={800} letterSpacing="-0.02em" sx={{ mt: 0.5 }}>
              My Rental Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Track booking approvals, live garment deliveries, return deadlines, and security deposits.
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchRentals}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "#E0E0E0",
              color: "#1A1817",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              "&:hover": { borderColor: "#D1A362", bgcolor: "#FFF" },
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* Stats Glance Bar */}
        <Grid container spacing={2} mb={4}>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                Total Bookings
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#1A1817" sx={{ mt: 0.5 }}>
                {totalBookings}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                Active on Rent
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#1976D2" sx={{ mt: 0.5 }}>
                {activeCount}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                Refundable Deposits Held
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#2E7D32" sx={{ mt: 0.5 }}>
                ₹{depositsHeld.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                Completed
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#1A1817" sx={{ mt: 0.5 }}>
                {completedCount}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filter Navigation Chips */}
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 2, mb: 3 }}>
          {[
            { id: "all", label: `All Rentals (${rentals.length})` },
            { id: "pending", label: "Pending Approval" },
            { id: "confirmed", label: "Confirmed & Upcoming" },
            { id: "active", label: "Active on Rent" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled / Declined" },
          ].map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <Chip
                key={tab.id}
                label={tab.label}
                clickable
                onClick={() => setActiveFilter(tab.id)}
                sx={{
                  bgcolor: isSelected ? "#1A1817" : "#FFF",
                  color: isSelected ? "#FFF" : "#555",
                  border: isSelected ? "1px solid #1A1817" : "1px solid #E0E0E0",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.85rem",
                  px: 1,
                  py: 2,
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: isSelected ? "#1A1817" : "#F5F5F5",
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* Rentals List Area */}
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
            <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Retrieving your rental orders...
            </Typography>
          </Box>
        ) : filteredRentals.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              border: "1px dashed #D5D5D5",
              textAlign: "center",
              bgcolor: "#FFF",
            }}
          >
            <BagIcon sx={{ fontSize: 48, color: "#BBB", mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="#1A1817" mb={0.5}>
              No {activeFilter !== "all" ? activeFilter : ""} rentals found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3} maxWidth={400} mx="auto">
              Explore designer lehengas, sherwanis, and luxury cocktail gowns curated for your next special event.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/w-dress")}
              sx={{
                bgcolor: "#1A1817",
                color: "#FFF",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                "&:hover": { bgcolor: "#333" },
              }}
            >
              Explore Collection
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

              return (
                <Paper
                  key={order._id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #EBEBEB",
                    bgcolor: "#FFF",
                    overflow: "hidden",
                    transition: "0.2s",
                    "&:hover": { borderColor: "#D1A362", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" },
                  }}
                >
                  {/* Top Bar: Order Date & Status Badge */}
                  <Box
                    sx={{
                      px: { xs: 2.5, sm: 3 },
                      py: 1.8,
                      bgcolor: "#FBFBFB",
                      borderBottom: "1px solid #F0F0F0",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        ORDER #{order.transactionId ? order.transactionId.slice(-8).toUpperCase() : order._id.slice(-8).toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
                        fontSize: "0.75rem",
                        borderRadius: 1.5,
                        "& .MuiChip-icon": { color: badge.color },
                      }}
                    />
                  </Box>

                  {/* Main Garment & Financial Card Body */}
                  <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Grid container spacing={3} alignItems="center">
                      {/* Product Thumbnail */}
                      <Grid item xs={12} sm={3} md={2.5}>
                        <Box
                          component={Link}
                          to={`/product/${product._id || ""}`}
                          sx={{
                            display: "block",
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid #EAEAEA",
                            aspectRatio: "3/4",
                            position: "relative",
                            bgcolor: "#F7F7F7",
                          }}
                        >
                          <img
                            src={product.image || "/assets/Cocktail Gown.jpg"}
                            alt={product.title || product.name || "Dress"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </Box>
                      </Grid>

                      {/* Details & Dates */}
                      <Grid item xs={12} sm={5} md={5.5}>
                        <Box>
                          <Typography
                            component={Link}
                            to={`/product/${product._id || ""}`}
                            variant="h6"
                            fontWeight={800}
                            sx={{
                              color: "#1A1817",
                              textDecoration: "none",
                              "&:hover": { color: "#D1A362" },
                              display: "block",
                              lineHeight: 1.3,
                              mb: 0.5,
                            }}
                          >
                            {product.title || product.name || "Designer Garment"}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" mb={1.5}>
                            Brand: <strong>{product.brand || "Atelier Exclusive"}</strong> &bull; Size: <strong>{product.size || "M"}</strong> &bull; Category: <strong>{product.category || "Couture"}</strong>
                          </Typography>

                          {/* Rental Dates Box */}
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: "#FAFAFA",
                              borderColor: "#EAEAEA",
                              display: "inline-block",
                              minWidth: "260px",
                              mb: 1.5,
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <CalendarIcon sx={{ fontSize: 18, color: "#D1A362" }} />
                              <Typography variant="caption" fontWeight={700} color="#1A1817">
                                RENTAL WINDOW ({days} DAYS)
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={600} color="#1A1817">
                              {sDate} &rarr; {eDate}
                            </Typography>
                          </Paper>

                          {/* Provider Info */}
                          {order.providerId && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              <AtelierIcon sx={{ fontSize: 13, verticalAlign: "middle", mr: 0.5 }} />
                              Lender Atelier: <strong>{order.providerId.name || order.providerId.email}</strong>
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      {/* Financial Breakdown & Actions */}
                      <Grid item xs={12} sm={4} md={4}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "#F9F9F9",
                            border: "1px solid #ECECEC",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" display="block" mb={1}>
                            Pricing & Deposit
                          </Typography>

                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Rental Fee ({days} days)
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              ₹{(order.rentalFee || (order.totalAmount - (order.securityDeposit || 0)))?.toLocaleString()}
                            </Typography>
                          </Box>

                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography variant="body2" color="text.secondary">
                                Security Deposit
                              </Typography>
                              <ShieldIcon sx={{ fontSize: 14, color: "#2E7D32" }} />
                            </Box>
                            <Typography variant="body2" fontWeight={600} color="#2E7D32">
                              ₹{(order.securityDeposit || 0)?.toLocaleString()}
                            </Typography>
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" fontWeight={800} color="#1A1817">
                              Total Paid
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={800} color="#1A1817">
                              ₹{order.totalAmount?.toLocaleString()}
                            </Typography>
                          </Box>

                          {/* Deposit Status Pill */}
                          <Box mt={1}>
                            <Chip
                              size="small"
                              label={
                                status === "Completed" || order.depositStatus === "REFUNDED"
                                  ? "Deposit Refunded"
                                  : status === "Cancelled" || status === "Declined"
                                  ? "Deposit Released"
                                  : "Refundable Deposit Held"
                              }
                              sx={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
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
                          </Box>
                        </Paper>

                        {/* Lifecycle Action Buttons */}
                        <Stack spacing={1} sx={{ mt: 2 }}>
                          {status === "Pending" && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => setCancelModal({ open: true, order })}
                              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                            >
                              Cancel Request
                            </Button>
                          )}

                          {(status === "Accepted" || status === "Confirmed" || status === "Active") && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ReturnIcon />}
                              onClick={() => setInstructionsModal({ open: true, order })}
                              sx={{
                                borderColor: "#1A1817",
                                color: "#1A1817",
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                                "&:hover": { bgcolor: "#F5F5F5", borderColor: "#1A1817" },
                              }}
                            >
                              Return Instructions
                            </Button>
                          )}

                          {status === "Completed" && (
                            <Button
                              variant="contained"
                              size="small"
                              component={Link}
                              to={`/product/${product._id || ""}`}
                              sx={{
                                bgcolor: "#1A1817",
                                color: "#FFF",
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                                "&:hover": { bgcolor: "#333" },
                              }}
                            >
                              Rent Again
                            </Button>
                          )}

                          {(status === "Declined" || status === "Cancelled") && (
                            <Button
                              variant="text"
                              size="small"
                              endIcon={<ArrowIcon />}
                              component={Link}
                              to="/w-dress"
                              sx={{ color: "#D1A362", fontWeight: 700, textTransform: "none" }}
                            >
                              Find Similar Dresses
                            </Button>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>

                    {/* Informational Callout Bar per State */}
                    {status === "Pending" && (
                      <Alert severity="warning" sx={{ mt: 2.5, borderRadius: 2, bgcolor: "#FFF8E1" }}>
                        <strong>Awaiting Provider Confirmation:</strong> The provider has been notified to review your rental dates. You may cancel without penalty before acceptance.
                      </Alert>
                    )}

                    {(status === "Accepted" || status === "Confirmed") && (
                      <Alert severity="success" sx={{ mt: 2.5, borderRadius: 2, bgcolor: "#E8F5E9" }}>
                        <strong>Booking Confirmed!</strong> The lender has accepted your request. The garment is being inspected and prepared for courier dispatch.
                      </Alert>
                    )}

                    {status === "Active" && (
                      <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2, bgcolor: "#E3F2FD" }}>
                        <strong>Currently Active on Rent:</strong> Enjoy your event! Please have the outfit ready for return courier pickup on <strong>{eDate}</strong>.
                      </Alert>
                    )}

                    {status === "Declined" && order.declineReason && (
                      <Alert severity="error" sx={{ mt: 2.5, borderRadius: 2, bgcolor: "#FFEBEE" }}>
                        <strong>Lender Notice:</strong> {order.declineReason}. All payments and security deposits have been restored.
                      </Alert>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Container>

      {/* CANCEL REQUEST CONFIRMATION DIALOG */}
      <Dialog
        open={cancelModal.open}
        onClose={() => setCancelModal({ open: false, order: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Cancel Rental Request?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to cancel your rental request for{" "}
            <strong>{cancelModal.order?.product?.title || "this dress"}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
            &bull; Your reserved dates will be instantly released for other renters.<br />
            &bull; Pre-authorized rental fees and security deposits will be refunded.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setCancelModal({ open: false, order: null })}
            sx={{ color: "#777" }}
          >
            Keep Rental
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={actionLoading}
            sx={{ fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* RETURN INSTRUCTIONS MODAL */}
      <Dialog
        open={instructionsModal.open}
        onClose={() => setInstructionsModal({ open: false, order: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Garment Return Guidelines & Checklist
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Zero Dry-Cleaning Hassle:</strong> Complimentary professional eco dry-cleaning is included with every rental! You do not need to wash or dry-clean the dress before returning.
            </Alert>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1A1817" mb={1}>
                Return Checklist
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                1. Place the outfit in its original protective garment bag and hanger.<br />
                2. Verify that all accompanying accessories (belts, brooches, stoles, dupatta) are inside.<br />
                3. Attach the pre-paid return shipping label or hand over to the verified courier representative on the scheduled return date.
              </Typography>
            </Box>

            <Box sx={{ bgcolor: "#F9F9F9", p: 2, borderRadius: 2, border: "1px solid #EAEAEA" }}>
              <Typography variant="subtitle2" fontWeight={700} color="#2E7D32" mb={0.5}>
                Security Deposit Return
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upon return and standard condition inspection by the provider, your security deposit of{" "}
                <strong>₹{instructionsModal.order?.securityDeposit?.toLocaleString()}</strong> will be automatically credited back to your original payment method within 24-48 hours.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={() => setInstructionsModal({ open: false, order: null })}
            sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#333" } }}
          >
            Understood
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

export default MyRentals;
