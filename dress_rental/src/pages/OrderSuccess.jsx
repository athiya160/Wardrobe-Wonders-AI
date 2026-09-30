import React from "react";
import { Box, Typography, Button, Paper, Container, Stack, Divider, Chip, Grid } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const orderId =
    location.state?.orderId || `WW-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const product = location.state?.product;
  const startDate = location.state?.startDate || "Oct 4, 2026";
  const endDate = location.state?.endDate || "Oct 7, 2026";
  const rentalDays = location.state?.rentalDays || 3;
  const totalAmount = location.state?.totalAmount || 17000;
  const address = location.state?.address;

  return (
    <Box sx={{ backgroundColor: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ResponsiveAppBar />

      <Container maxWidth="md" sx={{ mt: 6, mb: 10, flexGrow: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 6 },
            borderRadius: 3.5,
            border: "1px solid #ECE7DE",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
            textAlign: "center",
          }}
        >
          {/* Success Emblem */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "rgba(209, 163, 98, 0.14)",
              color: "#A07028",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 46, color: "#D1A362" }} />
          </Box>

          <Chip
            label="RESERVATION CONFIRMED"
            sx={{
              bgcolor: "#1A1817",
              color: "#D1A362",
              fontWeight: 800,
              fontSize: "0.76rem",
              letterSpacing: "0.08em",
              mb: 2,
              px: 1,
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              color: "#1A1817",
              letterSpacing: "-0.02em",
              fontSize: { xs: "2rem", md: "2.6rem" },
              mb: 1,
            }}
          >
            Your Couture Look is Reserved
          </Typography>

          <Typography variant="body1" sx={{ color: "#666666", maxWidth: 540, mx: "auto", mb: 4 }}>
            Booking Reference:{" "}
            <Typography component="span" fontWeight={800} color="#1A1817">
              #{orderId}
            </Typography>
            . We have dispatched confirmation to your email.
          </Typography>

          {/* Booking Voucher Card */}
          <Box
            sx={{
              p: 3,
              borderRadius: 2.5,
              bgcolor: "#FAF8F5",
              border: "1px solid #ECE7DE",
              textAlign: "left",
              mb: 4,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              {product && (
                <Grid item xs={12} sm={3}>
                  <Box
                    component="img"
                    src={product.image || "/assets/Cocktail Gown.jpg"}
                    alt={product.name}
                    sx={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid #E8DFCF",
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={product ? 9 : 12}>
                <Typography variant="caption" sx={{ color: "#A07028", fontWeight: 700, letterSpacing: "0.05em" }}>
                  RENTAL DETAILS
                </Typography>
                <Typography variant="h6" fontWeight={700} color="#1A1817" sx={{ mb: 0.5 }}>
                  {product?.name || "Designer Garment"}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Rental Window
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#1A1817">
                      {startDate} → {endDate}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Total Paid / Escrow
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#1A1817">
                      ₹{totalAmount.toLocaleString()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      White-Glove Destination
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#1A1817">
                      {address?.city || "Mumbai"}, {address?.zip || "400050"}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>

          {/* Fulfillment Timeline */}
          <Box sx={{ mb: 4.5, textAlign: "left" }}>
            <Typography variant="overline" fontWeight={800} color="#8A6D3B" letterSpacing="0.1em">
              NEXT STEPS IN YOUR RENTAL JOURNEY
            </Typography>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: "#FFFFFF", border: "1px solid #ECE7DE", borderRadius: 2, height: "100%" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#1A1817">
                    1. Eco Sanitization
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                    Garment is hand-inspected, gently dry cleaned, and packed into a protective garment bag.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: "#FFFFFF", border: "1px solid #ECE7DE", borderRadius: 2, height: "100%" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#1A1817">
                    2. Doorstep Arrival
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                    Delivered 24 hours prior to your event. Courier coordinates arrival via SMS/Call.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: "#FFFFFF", border: "1px solid #ECE7DE", borderRadius: 2, height: "100%" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#1A1817">
                    3. Deposit Release
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                    Return via prepaid pouch. Security deposit releases automatically back to your payment method.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Action CTAs */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/my-rentals")}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: "#1A1817",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.92rem",
                px: 3.5,
                py: 1.3,
                borderRadius: 1.5,
                textTransform: "none",
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              View My Rentals & Bookings
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/")}
              startIcon={<HomeOutlinedIcon />}
              sx={{
                borderColor: "#D1A362",
                color: "#8A6D3B",
                fontWeight: 700,
                fontSize: "0.92rem",
                px: 3.5,
                py: 1.3,
                borderRadius: 1.5,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#A07028",
                  backgroundColor: "rgba(209, 163, 98, 0.08)",
                },
              }}
            >
              Continue Browsing Storefront
            </Button>
          </Stack>
        </Paper>
      </Container>

      <Fotter />
    </Box>
  );
};

export default OrderSuccess;
