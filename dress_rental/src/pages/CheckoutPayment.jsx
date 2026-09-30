import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  Container,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  TextField,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import { initPayment } from "../utils/initPayment";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BoltIcon from "@mui/icons-material/Bolt";

const CheckoutPayment = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentType, setPaymentType] = useState("card");
  const [product, setProduct] = useState(location.state?.product || null);

  const qty = location.state?.qty || 1;
  const startDate = location.state?.startDate || null;
  const endDate = location.state?.endDate || null;
  const address = location.state?.address || {
    houseNo: "Suite 402",
    street: "Fashion Avenue",
    landmark: "Grand Hotel",
    city: "Mumbai",
    state: "Maharashtra",
    zip: "400050",
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product && id) {
      axios
        .get(`${BASE_URL}/products/detail/${id}`)
        .then((res) => setProduct(res.data))
        .catch((err) => console.error("Failed to load product:", err));
    }
  }, [id, product]);

  const rentalDays = location.state?.rentalDays || 3;
  const dailyPrice = product ? Number(product.rentalPricePerDay || product.price) || 0 : 0;
  const rentalFee = location.state?.rentalFee || dailyPrice * qty;
  const securityDeposit = location.state?.securityDeposit || (product ? Number(product.securityDeposit || product.advance) || 2500 : 2500);
  const totalAmount = location.state?.totalAmount || rentalFee + securityDeposit;

  const handlePayment = async () => {
    if (!product) return alert("Product data is missing.");
    setLoading(true);
    setError("");

    if (paymentType !== "cod") {
      // Online payment via simulated gateway
      try {
        await initPayment(product, qty, address, startDate, endDate, totalAmount);
      } catch (err) {
        console.error("Payment init error:", err);
        setError("Payment gateway session timed out. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Cash / Escrow on Delivery
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user || !user.email) {
          setError("Please sign in to complete your rental booking.");
          setLoading(false);
          return;
        }

        const reqData = {
          dressId: product._id,
          quantity: qty,
          startDate: startDate,
          endDate: endDate,
          rentalFee: rentalFee,
          securityDeposit: securityDeposit,
          totalAmount: totalAmount,
          email: user.email,
          address: address,
        };

        const res = await axios.post(`${BASE_URL}/payment/cod`, reqData);
        if (res.data?.success) {
          navigate("/order-success", {
            state: {
              orderId: res.data.order?._id || `WW-2026-${Math.floor(100000 + Math.random() * 900000)}`,
              product,
              rentalDays,
              startDate,
              endDate,
              totalAmount,
              address,
            },
          });
        } else {
          setError(res.data?.message || "Order placement failed. Please verify dates and try again.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to place order. Date window may be unavailable.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ backgroundColor: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ResponsiveAppBar />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 10, flexGrow: 1 }}>
        {/* Breadcrumbs & Stepper */}
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs sx={{ mb: 1.5, fontSize: "0.85rem", color: "#888" }}>
            <MuiLink
              underline="hover"
              color="inherit"
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              Home
            </MuiLink>
            <MuiLink
              underline="hover"
              color="inherit"
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(`/checkout/address/${id}`)}
            >
              Delivery Address
            </MuiLink>
            <Typography color="#D1A362" fontWeight={600} fontSize="0.85rem">
              Payment & Escrow
            </Typography>
          </Breadcrumbs>

          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              color: "#1A1817",
            }}
          >
            Select Payment Method
          </Typography>

          {/* Stepper Strip */}
          <Stack direction="row" spacing={2} alignItems="center" mt={2}>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#43A047 !important" }} />}
              label="1. Delivery Address"
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{
                borderColor: "#43A047",
                color: "#2E7D32",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            />
            <Box sx={{ width: 24, height: 1, bgcolor: "#D1A362" }} />
            <Chip
              icon={<LockOutlinedIcon sx={{ fontSize: 16, color: "#FFFFFF !important" }} />}
              label="2. Payment & Escrow"
              sx={{
                bgcolor: "#1A1817",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            />
            <Box sx={{ width: 24, height: 1, bgcolor: "#DDD" }} />
            <Chip
              label="3. Confirmation"
              variant="outlined"
              sx={{
                borderColor: "#E0E0E0",
                color: "#9E9E9E",
                fontSize: "0.8rem",
              }}
            />
          </Stack>
        </Box>

        {/* 2-Column Luxury Layout */}
        <Grid container spacing={4}>
          {/* Left Column: Payment Selection */}
          <Grid item xs={12} md={7} lg={7.5}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4.5 },
                borderRadius: 3,
                border: "1px solid #ECE7DE",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              {/* Simulated Escrow Disclosure */}
              <Alert
                severity="info"
                icon={<SecurityOutlinedIcon sx={{ color: "#A07028" }} />}
                sx={{
                  mb: 3.5,
                  borderRadius: 2,
                  bgcolor: "#FAF8F5",
                  color: "#1A1817",
                  border: "1px solid #E8DFCF",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                }}
              >
                <strong>Simulated Escrow Sandbox:</strong> Transactions operate in a secure demonstration escrow environment. Security deposits are simulated and automatically released upon return verification.
              </Alert>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Typography variant="h6" fontWeight={700} sx={{ color: "#1A1817", mb: 2 }}>
                Payment Options
              </Typography>

              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  sx={{ gap: 2 }}
                >
                  {/* Option 1: Credit / Debit Card */}
                  <Box
                    sx={{
                      border: paymentType === "card" ? "2px solid #D1A362" : "1px solid #ECE7DE",
                      bgcolor: paymentType === "card" ? "#FAF8F5" : "#FFFFFF",
                      p: 2.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => setPaymentType("card")}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <FormControlLabel
                        value="card"
                        control={<Radio sx={{ color: "#D1A362", "&.Mui-checked": { color: "#A07028" } }} />}
                        label={
                          <Box display="flex" alignItems="center" gap={1.2}>
                            <CreditCardIcon sx={{ color: "#1A1817" }} />
                            <Box>
                              <Typography fontWeight={700} color="#1A1817" fontSize="0.95rem">
                                Credit / Debit Card (Visa, Mastercard, Amex)
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Encrypted 256-Bit SSL Checkout
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Chip label="Popular" size="small" sx={{ bgcolor: "#E8DFCF", color: "#1A1817", fontWeight: 700, fontSize: "0.7rem" }} />
                    </Box>

                    {paymentType === "card" && (
                      <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid #E8DFCF" }}>
                        <Stack spacing={2}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Card Number"
                            placeholder="4532 •••• •••• 8910"
                            defaultValue="4532 9821 7342 8910"
                          />
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                size="small"
                                fullWidth
                                label="Expires"
                                placeholder="MM/YY"
                                defaultValue="12/28"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                size="small"
                                fullWidth
                                label="CVV"
                                placeholder="•••"
                                defaultValue="888"
                              />
                            </Grid>
                          </Grid>
                        </Stack>
                      </Box>
                    )}
                  </Box>

                  {/* Option 2: Instant UPI */}
                  <Box
                    sx={{
                      border: paymentType === "upi" ? "2px solid #D1A362" : "1px solid #ECE7DE",
                      bgcolor: paymentType === "upi" ? "#FAF8F5" : "#FFFFFF",
                      p: 2.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => setPaymentType("upi")}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <FormControlLabel
                        value="upi"
                        control={<Radio sx={{ color: "#D1A362", "&.Mui-checked": { color: "#A07028" } }} />}
                        label={
                          <Box display="flex" alignItems="center" gap={1.2}>
                            <QrCodeScannerIcon sx={{ color: "#1A1817" }} />
                            <Box>
                              <Typography fontWeight={700} color="#1A1817" fontSize="0.95rem">
                                Instant UPI (Google Pay, PhonePe, Paytm)
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Pay seamlessly via UPI ID or QR Code
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Chip label="Instant" size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.7rem" }} />
                    </Box>

                    {paymentType === "upi" && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #E8DFCF" }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Virtual Payment Address (UPI ID)"
                          placeholder="username@okhdfcbank"
                          defaultValue="athiya@okaxis"
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Option 3: Net Banking */}
                  <Box
                    sx={{
                      border: paymentType === "netbanking" ? "2px solid #D1A362" : "1px solid #ECE7DE",
                      bgcolor: paymentType === "netbanking" ? "#FAF8F5" : "#FFFFFF",
                      p: 2.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => setPaymentType("netbanking")}
                  >
                    <FormControlLabel
                      value="netbanking"
                      control={<Radio sx={{ color: "#D1A362", "&.Mui-checked": { color: "#A07028" } }} />}
                      label={
                        <Box display="flex" alignItems="center" gap={1.2}>
                          <AccountBalanceIcon sx={{ color: "#1A1817" }} />
                          <Box>
                            <Typography fontWeight={700} color="#1A1817" fontSize="0.95rem">
                              Net Banking
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              All major Indian banks supported (HDFC, ICICI, SBI, Axis)
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Box>

                  {/* Option 4: Cash / Escrow on Delivery */}
                  <Box
                    sx={{
                      border: paymentType === "cod" ? "2px solid #D1A362" : "1px solid #ECE7DE",
                      bgcolor: paymentType === "cod" ? "#FAF8F5" : "#FFFFFF",
                      p: 2.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => setPaymentType("cod")}
                  >
                    <FormControlLabel
                      value="cod"
                      control={<Radio sx={{ color: "#D1A362", "&.Mui-checked": { color: "#A07028" } }} />}
                      label={
                        <Box display="flex" alignItems="center" gap={1.2}>
                          <LocalAtmIcon sx={{ color: "#1A1817" }} />
                          <Box>
                            <Typography fontWeight={700} color="#1A1817" fontSize="0.95rem">
                              Cash / Escrow on Delivery (COD)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Pay rental fee and deposit upon white-glove arrival
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Box>
                </RadioGroup>
              </FormControl>

              {/* Complete Booking Button */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} pt={2}>
                <Button
                  onClick={() => navigate(-1)}
                  sx={{ color: "#666", textTransform: "none", fontWeight: 600 }}
                >
                  ← Edit Address
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={handlePayment}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOutlinedIcon />}
                  sx={{
                    backgroundColor: "#1A1817",
                    color: "#FFFFFF",
                    px: 4.5,
                    py: 1.4,
                    fontWeight: 700,
                    borderRadius: 1.5,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    "&:hover": {
                      backgroundColor: "#2C2825",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                    },
                  }}
                >
                  {loading ? "Confirming Rental..." : `Confirm & Pay ₹${totalAmount.toLocaleString()}`}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Sticky Order Summary */}
          <Grid item xs={12} md={5} lg={4.5}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: "1px solid #ECE7DE",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                position: { md: "sticky" },
                top: 100,
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ color: "#1A1817", mb: 2.5 }}>
                Rental Summary
              </Typography>

              {product && (
                <Stack direction="row" spacing={2} mb={3} alignItems="center">
                  <Box
                    component="img"
                    src={product.image || "/assets/Cocktail Gown.jpg"}
                    alt={product.name}
                    sx={{
                      width: 72,
                      height: 96,
                      objectFit: "cover",
                      borderRadius: 1.5,
                      border: "1px solid #E8DFCF",
                    }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#A07028",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {product.category || "Designer Collection"}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ color: "#1A1817", lineHeight: 1.3, mb: 0.5 }}
                    >
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Quantity: {qty} • Dates: {startDate || "TBD"} to {endDate || "TBD"} ({rentalDays} Days)
                    </Typography>
                  </Box>
                </Stack>
              )}

              {/* Delivery Destination */}
              <Box sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2, mb: 2.5, border: "1px solid #ECE7DE" }}>
                <Typography variant="caption" fontWeight={700} color="#8A6D3B" textTransform="uppercase">
                  Delivering to:
                </Typography>
                <Typography variant="body2" color="#1A1817" fontWeight={600} mt={0.3}>
                  {address.houseNo}, {address.street}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {address.city}, {address.state} - {address.zip}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Rental Duration Fee ({rentalDays} Days)
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#1A1817">
                    ₹{rentalFee.toLocaleString()}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Refundable Security Deposit
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#43A047", fontWeight: 600 }}>
                      ✓ 100% Refunded on Return
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="#1A1817">
                    ₹{securityDeposit.toLocaleString()}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Eco Dry Cleaning & Steaming
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#43A047">
                    FREE
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Doorstep White-Glove Delivery
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="#43A047">
                    FREE
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box display="flex" justifyContent="space-between" alignItems="baseline">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#1A1817">
                      Total Payable
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Includes ₹{securityDeposit.toLocaleString()} refundable deposit
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={800} color="#1A1817">
                    ₹{totalAmount.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Fotter />
    </Box>
  );
};

export default CheckoutPayment;
