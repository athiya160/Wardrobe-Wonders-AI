import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  LocalShippingOutlined as ShippingIcon,
  ReceiptLongOutlined as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
  Inventory2Outlined as OrderBoxIcon,
  HomeOutlined as AddressIcon,
  CalendarTodayOutlined as DateIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline as CheckIcon,
  OpenInNewOutlined as OpenInNewIcon,
  CancelOutlined as CancelIcon,
  AssignmentReturnOutlined as ReturnIcon,
  RateReviewOutlined as ReviewIcon,
  PrintOutlined as PrintIcon,
} from "@mui/icons-material";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import StoreInvoiceModal from "../components/store/StoreInvoiceModal";

export default function StoreOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [order, setOrder] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Phase 8 Post-Purchase States
  const [cancellations, setCancellations] = useState([]);
  const [returns, setReturns] = useState([]);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [invoiceSnapshot, setInvoiceSnapshot] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Cancellation modal
  const [cancelModal, setCancelModal] = useState({ open: false, sfo: null, reason: "" });
  const [cancelLoading, setCancelLoading] = useState(false);

  // Return modal
  const [returnModal, setReturnModal] = useState({
    open: false,
    sfo: null,
    reason: "Size/Fit issue",
    description: "",
    selectedItems: [],
  });
  const [returnLoading, setReturnLoading] = useState(false);

  // Review modal
  const [reviewModal, setReviewModal] = useState({
    open: false,
    item: null,
    sfo: null,
    rating: 5,
    title: "",
    comment: "",
  });
  const [reviewLoading, setReviewLoading] = useState(false);

  // Customer delivery confirmation modal
  const [confirmDeliveryModalOpen, setConfirmDeliveryModalOpen] = useState(false);
  const [fulfilmentToConfirm, setFulfilmentToConfirm] = useState(null);
  const [confirmingLoading, setConfirmingLoading] = useState(false);

  const getStepIndex = (status) => {
    switch (status) {
      case "ORDER_PLACED":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PROCESSING":
        return 2;
      case "SHIPPED":
      case "DISPATCHED":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0;
    }
  };

  const handleOpenConfirmDelivery = (sfo) => {
    setFulfilmentToConfirm(sfo);
    setConfirmDeliveryModalOpen(true);
  };

  const handleCustomerConfirmDelivery = async () => {
    if (!fulfilmentToConfirm || !order) return;
    setConfirmingLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/store/orders/${order._id}/fulfilment/${fulfilmentToConfirm._id}/confirm-delivery`,
        { note: "Customer verified delivery receipt." },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setSuccessMsg("Shipment delivery successfully confirmed! Thank you.");
        setConfirmDeliveryModalOpen(false);
        // Refresh single order details
        const refreshed = await axios.get(`${BASE_URL}/store/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshed.data?.success && refreshed.data.order) {
          setOrder(refreshed.data.order);
          setCancellations(refreshed.data.cancellations || []);
          setReturns(refreshed.data.returns || []);
          setInvoiceSnapshot(refreshed.data.invoice || null);
          setCustomerReviews(refreshed.data.reviews || []);
        }
      }
    } catch (err) {
      console.error("Confirm delivery error:", err);
      setError(err.response?.data?.message || "Failed to confirm shipment delivery.");
    } finally {
      setConfirmingLoading(false);
    }
  };

  // Invoice Handlers
  const handleOpenInvoice = async () => {
    if (!order) return;
    setInvoiceLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/store/orders/${order._id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setInvoiceSnapshot(res.data.invoice);
        setInvoiceModalOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Cancellation Handlers
  const handleOpenCancellation = (sfo) => {
    setCancelModal({ open: true, sfo, reason: "" });
  };

  const handleSubmitCancellation = async () => {
    if (!cancelModal.reason.trim()) {
      setError("Please provide a cancellation reason.");
      return;
    }
    setCancelLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/store/orders/${order._id}/cancellations`,
        {
          fulfilmentOrderId: cancelModal.sfo._id,
          reason: cancelModal.reason.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setSuccessMsg("Cancellation request submitted successfully.");
        setCancelModal({ open: false, sfo: null, reason: "" });
        // Refresh order
        const refreshed = await axios.get(`${BASE_URL}/store/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshed.data?.success) {
          setOrder(refreshed.data.order);
          setCancellations(refreshed.data.cancellations || []);
          setReturns(refreshed.data.returns || []);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit cancellation request.");
    } finally {
      setCancelLoading(false);
    }
  };

  // Return Handlers
  const handleOpenReturn = (sfo) => {
    const allItems = (sfo.items || []).map((it) => ({
      productId: it.productId,
      title: it.title,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      selected: true,
    }));
    setReturnModal({
      open: true,
      sfo,
      reason: "Size/Fit issue",
      description: "",
      selectedItems: allItems,
    });
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = returnModal.selectedItems
      .filter((it) => it.selected)
      .map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));

    if (itemsToReturn.length === 0) {
      setError("Please select at least one item to return.");
      return;
    }
    if (!returnModal.description.trim()) {
      setError("Please describe the issue or reason for return.");
      return;
    }

    setReturnLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/store/orders/${order._id}/returns`,
        {
          fulfilmentOrderId: returnModal.sfo._id,
          items: itemsToReturn,
          reason: returnModal.reason,
          description: returnModal.description.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setSuccessMsg("Return request submitted successfully. You will receive review updates here.");
        setReturnModal({ open: false, sfo: null, reason: "Size/Fit issue", description: "", selectedItems: [] });
        // Refresh order
        const refreshed = await axios.get(`${BASE_URL}/store/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshed.data?.success) {
          setOrder(refreshed.data.order);
          setCancellations(refreshed.data.cancellations || []);
          setReturns(refreshed.data.returns || []);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit return request.");
    } finally {
      setReturnLoading(false);
    }
  };

  // Review Handlers
  const handleOpenReviewModal = (item, sfo) => {
    setReviewModal({
      open: true,
      item,
      sfo,
      rating: 5,
      title: "",
      comment: "",
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewModal.comment.trim()) {
      setError("Please enter your review feedback.");
      return;
    }
    setReviewLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/store/products/${reviewModal.item.productId}/reviews`,
        {
          fulfilmentOrderId: reviewModal.sfo._id,
          rating: reviewModal.rating,
          title: reviewModal.title.trim(),
          comment: reviewModal.comment.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setSuccessMsg("Review submitted successfully! Thank you for your feedback.");
        setCustomerReviews((prev) => [...prev, res.data.review]);
        setReviewModal({ open: false, item: null, sfo: null, rating: 5, title: "", comment: "" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    if (orderId) {
      // Single order view
      axios
        .get(`${BASE_URL}/store/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.success && res.data.order) {
            setOrder(res.data.order);
            setCancellations(res.data.cancellations || []);
            setReturns(res.data.returns || []);
            setInvoiceSnapshot(res.data.invoice || null);
            setCustomerReviews(res.data.reviews || []);
          } else {
            setError("Store order details could not be found.");
          }
        })
        .catch((err) => {
          console.error("Fetch order detail error:", err);
          setError(err.response?.data?.message || "Order not found or access denied.");
        })
        .finally(() => setLoading(false));
    } else {
      // Order history list view
      axios
        .get(`${BASE_URL}/store/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.orders)) {
            setOrdersList(res.data.orders);
          }
        })
        .catch((err) => {
          console.error("Fetch orders list error:", err);
          setError(err.response?.data?.message || "Failed to load order history.");
        })
        .finally(() => setLoading(false));
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [orderId, token]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Loading your Store orders...
          </Typography>
        </Container>
        <Fotter />
      </Box>
    );
  }

  // View: Single Order Detail
  if (orderId && order) {
    const shippingAddr = order.shippingAddress;
    const fulfillments = order.fulfilmentOrderIds || [];

    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />

        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/store/orders")}
              sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
            >
              All Store Orders
            </Button>
          </Stack>

          {/* Master Order Header */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 2.5,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
              mb: 4,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 800, textTransform: "uppercase" }}>
                  Wardrobe Wonders Store Vertical
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", letterSpacing: "-0.01em" }}>
                  Order #{order.orderNumber}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label={order.status}
                  sx={{
                    fontWeight: 800,
                    bgcolor: order.status === "COMPLETED" ? "#E8F5E9" : "#FFF3E0",
                    color: order.status === "COMPLETED" ? "#2E7D32" : "#E65100",
                  }}
                />
                <Chip
                  label={`Payment: ${order.paymentStatus}`}
                  sx={{
                    fontWeight: 700,
                    bgcolor: order.paymentStatus === "PAID" ? "#E8F5E9" : "#FAF9F7",
                    color: order.paymentStatus === "PAID" ? "#2E7D32" : "#1A1817",
                    border: "1px solid #ECE7DE",
                  }}
                />
                {order.paymentStatus === "PAID" && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PrintIcon />}
                    onClick={handleOpenInvoice}
                    disabled={invoiceLoading}
                    sx={{
                      borderColor: "#1A1817",
                      color: "#1A1817",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                      ml: 1,
                      "&:hover": { bgcolor: "#F5F2EB" },
                    }}
                  >
                    {invoiceLoading ? "Loading..." : "View Invoice"}
                  </Button>
                )}
              </Stack>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <AddressIcon sx={{ color: "#D1A362", fontSize: 20, mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Delivery Address
                    </Typography>
                    {shippingAddr && (
                      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.5 }}>
                        <strong>{shippingAddr.name}</strong><br />
                        {shippingAddr.houseNo ? `${shippingAddr.houseNo}, ` : ""}
                        {shippingAddr.street}<br />
                        {shippingAddr.city}, {shippingAddr.state} — {shippingAddr.pincode}<br />
                        Phone: +91 {shippingAddr.phone}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <ReceiptIcon sx={{ color: "#D1A362", fontSize: 20, mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Financial Summary
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.6 }}>
                      Items Subtotal: ₹{order.subtotal?.toLocaleString("en-IN")}<br />
                      Shipping: ₹{order.totalShippingFee?.toLocaleString("en-IN")}<br />
                      <strong>Grand Total: ₹{order.grandTotal?.toLocaleString("en-IN")}</strong><br />
                      Method: {order.paymentMethod}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <ShippingIcon sx={{ color: "#D1A362", fontSize: 20, mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Fulfilment Model
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      Split into <strong>{fulfillments.length} independent seller shipments</strong>. Each boutique manages their own dispatch and tracking.
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Individual Seller Fulfillment Cards */}
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817", mb: 2 }}>
            Shipments & Seller Fulfilments ({fulfillments.length})
          </Typography>

          <Stack spacing={3}>
            {fulfillments.map((sfo, sIdx) => {
              const sfoData = typeof sfo === "object" ? sfo : null;
              return (
                <Paper
                  key={sfoData?._id || sIdx}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2.5,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                    sx={{ pb: 2, borderBottom: "1px solid #F0ECE4", mb: 2 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <StoreIcon sx={{ color: "#D1A362", fontSize: 22 }} />
                      <Box>
                        <Typography
                          component={RouterLink}
                          to={`/store/storefront/${sfoData?.storeSlug}`}
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800,
                            color: "#1A1817",
                            textDecoration: "none",
                            "&:hover": { color: "#D1A362" },
                          }}
                        >
                          {sfoData?.storeName || "Seller Boutique"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Fulfilment #{sfoData?.fulfilmentOrderNumber || `SFO-${sIdx + 1}`}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      label={sfoData?.status || "PENDING_PAYMENT"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor:
                          sfoData?.status === "DELIVERED"
                            ? "#E8F5E9"
                            : sfoData?.status === "SHIPPED" || sfoData?.status === "DISPATCHED"
                            ? "#E0F2F1"
                            : sfoData?.status === "CANCELLED"
                            ? "#FFEBEE"
                            : "#FFF8E1",
                        color:
                          sfoData?.status === "DELIVERED"
                            ? "#2E7D32"
                            : sfoData?.status === "SHIPPED" || sfoData?.status === "DISPATCHED"
                            ? "#00796B"
                            : sfoData?.status === "CANCELLED"
                            ? "#C62828"
                            : "#F57F17",
                      }}
                    />
                  </Stack>

                  {/* Independent Shipment Stepper */}
                  {sfoData?.status !== "CANCELLED" && (
                    <Box sx={{ my: 2.5, px: { xs: 0, sm: 2 } }}>
                      <Stepper activeStep={getStepIndex(sfoData?.status)} alternativeLabel>
                        {["Placed", "Confirmed", "Packaging", "Dispatched", "Delivered"].map((label, lIdx) => (
                          <Step
                            key={label}
                            completed={getStepIndex(sfoData?.status) > lIdx || sfoData?.status === "DELIVERED"}
                          >
                            <StepLabel
                              sx={{
                                "& .MuiStepLabel-label": { fontSize: "0.75rem", fontWeight: 700 },
                                "& .Mui-completed": { color: "#2E7D32 !important" },
                                "& .Mui-active": { color: "#D1A362 !important" },
                              }}
                            >
                              {label}
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                  )}

                  {/* Dispatch / Tracking Details if available */}
                  {sfoData?.dispatchDetails?.trackingNumber && (
                    <Box sx={{ p: 2, mb: 2, bgcolor: "#FAF9F7", borderRadius: 2, border: "1px solid #ECE7DE" }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 0.5 }}>
                            Courier &amp; Tracking Information
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                            Courier: <strong>{sfoData.dispatchDetails.courierName || "Standard Express"}</strong> • AWB:{" "}
                            <strong>{sfoData.dispatchDetails.trackingNumber}</strong>
                            {sfoData.dispatchDetails.trackingUrl && (
                              <Button
                                component="a"
                                href={sfoData.dispatchDetails.trackingUrl}
                                target="_blank"
                                size="small"
                                sx={{ ml: 1, textTransform: "none", fontWeight: 700, color: "#D1A362" }}
                              >
                                Live Tracking ↗
                              </Button>
                            )}
                          </Typography>
                          {sfoData.dispatchDetails.dispatchedAt && (
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                              Dispatched on: {new Date(sfoData.dispatchDetails.dispatchedAt).toLocaleDateString("en-IN")}
                            </Typography>
                          )}
                        </Box>

                        {/* Customer Confirmation of Delivery Receipt */}
                        {(sfoData?.status === "SHIPPED" || sfoData?.status === "DISPATCHED") && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckIcon />}
                            onClick={() => handleOpenConfirmDelivery(sfoData)}
                            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, whiteSpace: "nowrap" }}
                          >
                            Confirm Delivery Received
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* Items in this Fulfillment */}
                  <Stack spacing={2} divider={<Divider sx={{ borderColor: "#F7F5F0" }} />}>
                    {sfoData?.items?.map((item, itemIdx) => (
                      <Grid container spacing={2} key={itemIdx} alignItems="center">
                        <Grid item xs={3} sm={1.5}>
                          <Box
                            component="img"
                            src={item.image || "https://placehold.co/80x100?text=Listing"}
                            alt={item.title}
                            sx={{
                              width: "100%",
                              aspectRatio: "3/4",
                              objectFit: "cover",
                              borderRadius: 1.5,
                              border: "1px solid #ECE7DE",
                            }}
                          />
                        </Grid>
                        <Grid item xs={9} sm={7.5}>
                          {item.brand && (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#8D6E63", textTransform: "uppercase" }}>
                              {item.brand}
                            </Typography>
                          )}
                          <Typography
                            component={RouterLink}
                            to={`/store/product/${item.productId}`}
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: "#1A1817",
                              textDecoration: "none",
                              display: "block",
                              "&:hover": { color: "#D1A362" },
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            {item.size && <Chip label={`Size: ${item.size}`} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />}
                            {item.color && <Chip label={`Colour: ${item.color}`} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />}
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={3} sx={{ textAlign: { xs: "left", sm: "right" } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}
                          </Typography>
                          {sfoData?.status === "DELIVERED" && (
                            <Box sx={{ mt: 1 }}>
                              {customerReviews.some(
                                (r) =>
                                  r.productId?.toString() === item.productId?.toString() &&
                                  (r.fulfilmentOrderId?.toString() === sfoData._id?.toString() ||
                                    r.fulfilmentOrderId?._id?.toString() === sfoData._id?.toString())
                              ) ? (
                                <Chip
                                  icon={<CheckIcon sx={{ fontSize: 14 }} />}
                                  label="Reviewed"
                                  size="small"
                                  color="success"
                                  sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
                                />
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<ReviewIcon />}
                                  onClick={() => handleOpenReviewModal(item, sfoData)}
                                  sx={{
                                    fontSize: "0.75rem",
                                    textTransform: "none",
                                    borderColor: "#D1A362",
                                    color: "#8D6E63",
                                    fontWeight: 700,
                                    borderRadius: 1.5,
                                    py: 0.3,
                                  }}
                                >
                                  Write Review
                                </Button>
                              )}
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    ))}
                  </Stack>

                  {/* Status Milestones Accordion */}
                  {sfoData?.statusHistory && sfoData.statusHistory.length > 0 && (
                    <Accordion
                      elevation={0}
                      sx={{
                        mt: 2,
                        bgcolor: "#FAF9F7",
                        border: "1px solid #ECE7DE",
                        borderRadius: "8px !important",
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                          View Shipment Milestones &amp; Audit Log ({sfoData.statusHistory.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Stack spacing={1}>
                          {sfoData.statusHistory.map((h, hIdx) => (
                            <Stack key={hIdx} direction="row" spacing={1.5} alignItems="center">
                              <Chip label={h.status} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {new Date(h.changedAt).toLocaleString("en-IN")} • {h.note || "Status updated"}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Post-Purchase Actions & Alerts for this shipment */}
                  {(() => {
                    const activeCancel = cancellations.find(
                      (c) =>
                        c.fulfilmentOrderId?.toString() === sfoData?._id?.toString() ||
                        c.fulfilmentOrderId?._id?.toString() === sfoData?._id?.toString()
                    );
                    const activeReturn = returns.find(
                      (r) =>
                        r.fulfilmentOrderId?.toString() === sfoData?._id?.toString() ||
                        r.fulfilmentOrderId?._id?.toString() === sfoData?._id?.toString()
                    );

                    return (
                      <Box sx={{ mt: 2 }}>
                        {/* Cancellation Alert */}
                        {activeCancel && (
                          <Alert
                            severity={
                              activeCancel.status === "APPROVED"
                                ? "success"
                                : activeCancel.status === "REJECTED"
                                ? "error"
                                : "warning"
                            }
                            sx={{ mb: 1.5, borderRadius: 2 }}
                          >
                            <strong>Cancellation Request ({activeCancel.status}):</strong> {activeCancel.reason}
                            {activeCancel.adminReview?.reason && (
                              <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                                Admin Response: {activeCancel.adminReview.reason}
                              </Typography>
                            )}
                          </Alert>
                        )}

                        {/* Return Alert */}
                        {activeReturn && (
                          <Alert
                            severity={
                              activeReturn.status === "REFUNDED" || activeReturn.status === "APPROVED"
                                ? "success"
                                : activeReturn.status === "REJECTED"
                                ? "error"
                                : "info"
                            }
                            sx={{ mb: 1.5, borderRadius: 2 }}
                          >
                            <strong>Return Request ({activeReturn.status}):</strong> {activeReturn.reason}
                            {activeReturn.adminDecision?.reason && (
                              <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                                Operational Note: {activeReturn.adminDecision.reason}
                              </Typography>
                            )}
                            {activeReturn.status === "ITEM_RETURNED" && (
                              <Typography variant="caption" sx={{ display: "block", color: "#2E7D32", mt: 0.5 }}>
                                Return item received at warehouse. Safe refund record pending.
                              </Typography>
                            )}
                          </Alert>
                        )}

                        {/* Action Buttons if eligible */}
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1.5 }} flexWrap="wrap">
                          {/* Cancel button if pre-dispatch and no active cancellation */}
                          {!activeCancel &&
                            ["ORDER_PLACED", "CONFIRMED", "PROCESSING"].includes(sfoData?.status) && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => handleOpenCancellation(sfoData)}
                                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                              >
                                Request Cancellation
                              </Button>
                            )}

                          {/* Return button if delivered and no active return */}
                          {!activeReturn && sfoData?.status === "DELIVERED" && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ReturnIcon />}
                              onClick={() => handleOpenReturn(sfoData)}
                              sx={{
                                borderColor: "#D1A362",
                                color: "#8D6E63",
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                              }}
                            >
                              Request Return (7-Day Policy)
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    );
                  })()}

                  <Divider sx={{ my: 2, borderColor: "#F0ECE4" }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Shipping Fee: ₹{sfoData?.shippingFee?.toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      Shipment Total: ₹{sfoData?.totalAmount?.toLocaleString("en-IN")}
                    </Typography>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          {/* Customer Confirmation Modal */}
          <Dialog
            open={confirmDeliveryModalOpen}
            onClose={() => setConfirmDeliveryModalOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ fontWeight: 800 }}>Confirm Delivery Receipt</DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                Have you received all items in shipment #{fulfilmentToConfirm?.fulfilmentOrderNumber} from{" "}
                <strong>{fulfilmentToConfirm?.storeName}</strong> in good condition?
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                Confirming delivery marks this shipment as successfully completed and informs the boutique.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setConfirmDeliveryModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
                Not Yet
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleCustomerConfirmDelivery}
                disabled={confirmingLoading}
                sx={{ fontWeight: 700, textTransform: "none" }}
              >
                {confirmingLoading ? <CircularProgress size={20} color="inherit" /> : "Yes, Delivery Received"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Store Invoice Modal */}
          <StoreInvoiceModal
            open={invoiceModalOpen}
            onClose={() => setInvoiceModalOpen(false)}
            invoice={invoiceSnapshot}
          />

          {/* Cancellation Request Modal */}
          <Dialog
            open={cancelModal.open}
            onClose={() => !cancelLoading && setCancelModal({ ...cancelModal, open: false })}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ fontWeight: 800 }}>Request Shipment Cancellation</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Request cancellation for shipment #{cancelModal.sfo?.fulfilmentOrderNumber} from{" "}
                <strong>{cancelModal.sfo?.storeName}</strong>. Cancellation can only be requested prior to courier dispatch.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for Cancellation *"
                placeholder="e.g. Ordered incorrect size, duplicate order, changed mind..."
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setCancelModal({ ...cancelModal, open: false })} disabled={cancelLoading}>
                Keep Order
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleSubmitCancellation}
                disabled={cancelLoading}
                sx={{ fontWeight: 700, textTransform: "none" }}
              >
                {cancelLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancellation Request"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Return Request Modal */}
          <Dialog
            open={returnModal.open}
            onClose={() => !returnLoading && setReturnModal({ ...returnModal, open: false })}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ fontWeight: 800 }}>Request Return (7-Day Policy)</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Select items to return from shipment #{returnModal.sfo?.fulfilmentOrderNumber} from{" "}
                <strong>{returnModal.sfo?.storeName}</strong>:
              </Typography>

              {/* Items Selection */}
              <Stack spacing={1} sx={{ mb: 2.5 }}>
                {returnModal.selectedItems.map((item, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 1.5, border: "1px solid #ECE7DE", borderRadius: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.selected}
                          onChange={(e) => {
                            const updated = [...returnModal.selectedItems];
                            updated[idx].selected = e.target.checked;
                            setReturnModal({ ...returnModal, selectedItems: updated });
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {item.title} (Qty: {item.quantity})
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Refund value: ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                ))}
              </Stack>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Return Reason *</InputLabel>
                <Select
                  value={returnModal.reason}
                  label="Return Reason *"
                  onChange={(e) => setReturnModal({ ...returnModal, reason: e.target.value })}
                >
                  <MenuItem value="Size/Fit issue">Size / Fit issue</MenuItem>
                  <MenuItem value="Item defective or damaged">Item defective or damaged</MenuItem>
                  <MenuItem value="Item not as described">Item not as described</MenuItem>
                  <MenuItem value="Color/Fabric mismatch">Color or fabric mismatch</MenuItem>
                  <MenuItem value="Quality issue">Quality issue</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Detailed Description *"
                placeholder="Please provide details about the issue or reason for return..."
                value={returnModal.description}
                onChange={(e) => setReturnModal({ ...returnModal, description: e.target.value })}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setReturnModal({ ...returnModal, open: false })} disabled={returnLoading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitReturn}
                disabled={returnLoading}
                sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700, textTransform: "none" }}
              >
                {returnLoading ? <CircularProgress size={20} color="inherit" /> : "Submit Return Request"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Item Review Dialog */}
          <Dialog
            open={reviewModal.open}
            onClose={() => !reviewLoading && setReviewModal({ ...reviewModal, open: false })}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ fontWeight: 800 }}>Write Verified Review</DialogTitle>
            <DialogContent dividers>
              <Box textAlign="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {reviewModal.item?.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                  Verified Purchase from {reviewModal.sfo?.storeName}
                </Typography>
                <Rating
                  value={reviewModal.rating}
                  onChange={(_, val) => setReviewModal({ ...reviewModal, rating: val || 5 })}
                  size="large"
                />
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Review Headline / Title"
                placeholder="e.g. Gorgeous fit and fabric!"
                value={reviewModal.title}
                onChange={(e) => setReviewModal({ ...reviewModal, title: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Your Review Feedback *"
                placeholder="Share details about the fit, quality, styling, and your shopping experience..."
                value={reviewModal.comment}
                onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setReviewModal({ ...reviewModal, open: false })} disabled={reviewLoading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitReview}
                disabled={reviewLoading}
                sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700, textTransform: "none" }}
              >
                {reviewLoading ? <CircularProgress size={20} color="inherit" /> : "Submit Review"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>

        <Fotter />
      </Box>
    );
  }

  // View: Customer Store Orders History List
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
      <ResponsiveAppBar />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", letterSpacing: "-0.02em" }}>
              My Store Purchases
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Permanent fashion purchases from independent boutiques (Separated from Rental bookings)
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate("/my-rentals")}
            sx={{
              borderColor: "#ECE7DE",
              color: "#1A1817",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { borderColor: "#D1A362" },
            }}
          >
            Switch to My Rentals
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {ordersList.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <OrderBoxIcon sx={{ fontSize: 72, color: "#D1A362", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", mb: 1 }}>
              No Store orders yet
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 450, mx: "auto", mb: 3 }}>
              You haven&apos;t purchased any items from the Store marketplace yet. Explore curated new and pre-owned pieces from verified designers.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/store")}
              sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700, px: 3.5, py: 1.2, borderRadius: 2 }}
            >
              Browse Store
            </Button>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {ordersList.map((ord) => (
              <Paper
                key={ord._id}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  border: "1px solid #ECE7DE",
                  bgcolor: "#FFFFFF",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#D1A362", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  sx={{ pb: 2, borderBottom: "1px solid #F0ECE4", mb: 2 }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      Order #{ord.orderNumber}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DateIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        • {ord.items?.length || 0} items
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        • {ord.fulfilmentOrderIds?.length || 1} {ord.fulfilmentOrderIds?.length === 1 ? "seller" : "sellers"}
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={ord.status}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: ord.status === "COMPLETED" ? "#E8F5E9" : "#FFF3E0",
                        color: ord.status === "COMPLETED" ? "#2E7D32" : "#E65100",
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/store/orders/${ord._id}`)}
                      sx={{
                        bgcolor: "#1A1817",
                        color: "#D1A362",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 1.5,
                        "&:hover": { bgcolor: "#2C2825" },
                      }}
                    >
                      View Details
                    </Button>
                  </Stack>
                </Stack>

                {/* Items Preview */}
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Stack direction="row" spacing={1.5} overflow="auto" sx={{ py: 0.5 }}>
                      {ord.items?.map((it, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={it.image || "https://placehold.co/60x80?text=Listing"}
                          alt={it.title}
                          title={it.title}
                          sx={{
                            width: 52,
                            height: 68,
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid #ECE7DE",
                            flexShrink: 0,
                          }}
                        />
                      ))}
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={4} sx={{ textAlign: { xs: "left", sm: "right" } }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      Grand Total
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      ₹{ord.grandTotal?.toLocaleString("en-IN")}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>

      <Fotter />
    </Box>
  );
}
