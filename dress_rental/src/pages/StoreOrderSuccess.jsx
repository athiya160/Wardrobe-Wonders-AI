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
} from "@mui/material";
import {
  CheckCircleOutline as SuccessIcon,
  StorefrontOutlined as StoreIcon,
  LocalShippingOutlined as ShippingIcon,
  ShoppingBagOutlined as ShoppingBagIcon,
  ReceiptLongOutlined as ReceiptIcon,
} from "@mui/icons-material";
import { useParams, useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";

export default function StoreOrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const queryParams = new URLSearchParams(location.search);
  const targetOrderId = orderId || queryParams.get("orderId");
  const txnId = queryParams.get("txnId") || queryParams.get("merchantTransactionId");

  const [order, setOrder] = useState(location.state?.order || null);
  const [fulfilments, setFulfilments] = useState(location.state?.fulfilmentOrders || []);
  const [loading, setLoading] = useState(!location.state?.order);
  const [verifyingPayment, setVerifyingPayment] = useState(Boolean(txnId));

  useEffect(() => {
    const fetchAndVerify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // If txnId is present from PhonePe redirect, verify payment first
      if (txnId) {
        try {
          await axios.post(
            `${BASE_URL}/store/payment/verify`,
            { merchantTransactionId: txnId, simulateMock: true },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (verifyErr) {
          console.warn("Payment verify notice:", verifyErr);
        } finally {
          setVerifyingPayment(false);
        }
      }

      if (targetOrderId) {
        try {
          const res = await axios.get(`${BASE_URL}/store/orders/${targetOrderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.success && res.data.order) {
            setOrder(res.data.order);
            setFulfilments(res.data.order.fulfilmentOrderIds || []);
          }
        } catch (err) {
          console.error("Fetch order detail error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchAndVerify();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [targetOrderId, txnId, token]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Confirming order details...
          </Typography>
        </Container>
        <Fotter />
      </Box>
    );
  }

  const shippingAddr = order?.shippingAddress;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
      <ResponsiveAppBar />

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 3,
            border: "1px solid #ECE7DE",
            bgcolor: "#FFFFFF",
            textAlign: "center",
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "#F4EBD9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <SuccessIcon sx={{ fontSize: 52, color: "#A07028" }} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", letterSpacing: "-0.02em", mb: 1 }}>
            Thank You For Your Order!
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 500, mx: "auto", mb: 2 }}>
            Your Store marketplace order has been placed successfully and partitioned into individual seller fulfillment shipments.
          </Typography>

          <Chip
            label={`Master Order ID: ${order?.orderNumber || orderId}`}
            sx={{
              fontWeight: 800,
              bgcolor: "#1A1817",
              color: "#D1A362",
              px: 2,
              py: 2,
              borderRadius: 2,
              fontSize: "0.95rem",
              mb: 4,
            }}
          />

          <Divider sx={{ mb: 4 }} />

          {/* Key Summary Details */}
          <Grid container spacing={3} sx={{ textAlign: "left", mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 0.8 }}>
                Delivery Address:
              </Typography>
              {shippingAddr ? (
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                  <strong>{shippingAddr.name}</strong> (+91 {shippingAddr.phone})<br />
                  {shippingAddr.houseNo ? `${shippingAddr.houseNo}, ` : ""}
                  {shippingAddr.street}<br />
                  {shippingAddr.city}, {shippingAddr.state} — {shippingAddr.pincode}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Delivery address confirmed with order.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 0.8 }}>
                Order Summary:
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                Items Subtotal: ₹{order?.subtotal?.toLocaleString("en-IN")}<br />
                Shipping ({fulfilments.length || 1} sellers): ₹{order?.totalShippingFee?.toLocaleString("en-IN")}<br />
                <strong>Grand Total: ₹{order?.grandTotal?.toLocaleString("en-IN")}</strong><br />
                Status: <span style={{ color: "#D1A362", fontWeight: 700 }}>{order?.status || "PENDING_PAYMENT"}</span>
              </Typography>
            </Grid>
          </Grid>

          {/* Seller Fulfillment Shipments Breakdown */}
          <Box sx={{ textAlign: "left", mb: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <ShippingIcon sx={{ color: "#D1A362" }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817" }}>
                Individual Seller Shipments ({fulfilments.length || 1})
              </Typography>
            </Stack>

            <Stack spacing={2.5}>
              {fulfilments.map((sfo, sIdx) => {
                const sfoData = typeof sfo === "object" ? sfo : null;
                return (
                  <Paper
                    key={sfoData?._id || sIdx}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: "1px solid #ECE7DE",
                      bgcolor: "#FAF9F7",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1}
                      sx={{ mb: 2, pb: 1.5, borderBottom: "1px solid #EAE5DC" }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StoreIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                          Shipment #{sIdx + 1}: {sfoData?.storeName || "Seller Store"}
                        </Typography>
                      </Stack>
                      <Chip
                        label={sfoData?.fulfilmentOrderNumber || `SFO-${sIdx + 1}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: "#FFFFFF", border: "1px solid #ECE7DE" }}
                      />
                    </Stack>

                    {/* Shipment Items */}
                    {sfoData?.items && (
                      <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {sfoData.items.map((it, itIdx) => (
                          <Stack direction="row" spacing={2} key={itIdx} alignItems="center">
                            <Box
                              component="img"
                              src={it.image || "https://placehold.co/60x80?text=Item"}
                              alt={it.title}
                              sx={{
                                width: 44,
                                height: 56,
                                objectFit: "cover",
                                borderRadius: 1,
                                border: "1px solid #ECE7DE",
                              }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                                {it.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ""} {it.color ? `• Shade: ${it.color}` : ""}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                              ₹{(it.unitPrice * it.quantity).toLocaleString("en-IN")}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}

                    <Divider sx={{ my: 1, borderColor: "#EAE5DC" }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Status: <strong style={{ color: "#D1A362" }}>{sfoData?.status || "PENDING_PAYMENT"}</strong>
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                        Shipment Total: ₹{sfoData?.totalAmount?.toLocaleString("en-IN")}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          {/* Action CTAs */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<ReceiptIcon />}
              onClick={() => navigate(`/store/orders/${order?._id || orderId}`)}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                px: 3.5,
                py: 1.3,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              View Order Details
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShoppingBagIcon />}
              onClick={() => navigate("/store")}
              sx={{
                borderColor: "#ECE7DE",
                color: "#1A1817",
                fontWeight: 700,
                px: 3.5,
                py: 1.3,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": { borderColor: "#D1A362", bgcolor: "#FAF9F7" },
              }}
            >
              Continue Shopping
            </Button>
          </Stack>
        </Paper>
      </Container>

      <Fotter />
    </Box>
  );
}
