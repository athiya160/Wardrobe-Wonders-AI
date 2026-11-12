import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Stack,
  Container,
  Divider,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocationCityOutlinedIcon from "@mui/icons-material/LocationCityOutlined";
import PinDropOutlinedIcon from "@mui/icons-material/PinDropOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";

const CheckoutAddress = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(location.state?.product || null);
  const qty = location.state?.qty || 1;
  const startDate = location.state?.startDate || null;
  const endDate = location.state?.endDate || null;

  const [address, setAddress] = useState({
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    name: "",
  });

  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isManualAddress, setIsManualAddress] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);

  useEffect(() => {
    if (token) {
      axios
        .get(`${BASE_URL}/user/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.addresses) && res.data.addresses.length > 0) {
            setSavedAddresses(res.data.addresses);
            const def = res.data.addresses.find((a) => a.isDefault) || res.data.addresses[0];
            setSelectedAddressId(def._id || def.id);
            setAddress({
              houseNo: def.houseNo || "1",
              street: def.street,
              landmark: def.landmark || "",
              city: def.city,
              state: def.state,
              zip: def.pincode,
              phone: def.phone,
              name: def.name,
              _id: def._id,
            });
          } else {
            setIsManualAddress(true);
          }
        })
        .catch(() => {
          setIsManualAddress(true);
        });
    } else {
      setIsManualAddress(true);
    }
  }, [token]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id || addr.id);
    setIsManualAddress(false);
    setAddress({
      houseNo: addr.houseNo || "1",
      street: addr.street,
      landmark: addr.landmark || "",
      city: addr.city,
      state: addr.state,
      zip: addr.pincode,
      phone: addr.phone,
      name: addr.name,
      _id: addr._id,
    });
  };

  const handleUseNewAddress = () => {
    setIsManualAddress(true);
    setSelectedAddressId("new");
    setAddress({
      houseNo: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      name: "",
    });
  };

  useEffect(() => {
    if (!product && id) {
      axios
        .get(`${BASE_URL}/products/detail/${id}`)
        .then((res) => setProduct(res.data))
        .catch((err) => console.error("Failed to load product:", err));
    }
  }, [id, product]);

  // Calculate rental duration in days
  const calculateDays = () => {
    if (!startDate || !endDate) return 3;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 3;
  };

  const rentalDays = calculateDays();
  const dailyPrice = product ? Number(product.rentalPricePerDay || product.price) || 0 : 0;
  const rentalFee = dailyPrice * qty * (rentalDays > 3 ? Math.ceil(rentalDays / 3) : 1);
  const securityDeposit = product ? Number(product.securityDeposit || product.advance) || 2500 : 2500;
  const totalAmount = rentalFee + securityDeposit;

  const handleContinue = async () => {
    setError("");
    if (!address.houseNo.trim() || !address.street.trim() || !address.city.trim() || !address.zip.trim()) {
      setError("Please complete all required address fields (House/Building, Street, City, and ZIP code).");
      return;
    }

    // If customer entered custom address and opted to save to profile
    if (isManualAddress && saveToProfile && token) {
      try {
        const pin = address.zip.trim();
        if (/^[1-9][0-9]{5}$/.test(pin)) {
          await axios.post(
            `${BASE_URL}/user/addresses`,
            {
              name: address.name || "Recipient",
              street: address.street,
              houseNo: address.houseNo,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pincode: pin,
              phone: address.phone || "9999999999",
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (saveErr) {
        console.error("Auto-save address error:", saveErr);
      }
    }

    navigate(`/checkout/payment/${id}`, {
      state: {
        qty,
        startDate,
        endDate,
        address,
        addressId: address._id,
        product,
        rentalDays,
        rentalFee,
        securityDeposit,
        totalAmount,
      },
    });
  };

  return (
    <Box sx={{ backgroundColor: "#FAF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ResponsiveAppBar />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 10, flexGrow: 1 }}>
        {/* Checkout Header & Stepper */}
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
              onClick={() => navigate(`/product/${id}`)}
            >
              {product?.name || "Garment"}
            </MuiLink>
            <Typography color="#D1A362" fontWeight={600} fontSize="0.85rem">
              Checkout
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
            Delivery & Fitting Details
          </Typography>

          {/* Stepper Strip */}
          <Stack direction="row" spacing={2} alignItems="center" mt={2}>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 16, color: "#FFFFFF !important" }} />}
              label="1. Delivery Address"
              sx={{
                bgcolor: "#1A1817",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            />
            <Box sx={{ width: 24, height: 1, bgcolor: "#D1A362" }} />
            <Chip
              label="2. Payment & Escrow"
              variant="outlined"
              sx={{
                borderColor: "#D1A362",
                color: "#8A6D3B",
                fontWeight: 600,
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
          {/* Left Column: Address Form */}
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
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: "#1A1817", mb: 0.5 }}
              >
                Shipping & Fitting Address
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Where should we courier your professionally steamed and sanitized garment?
              </Typography>

              {error && (
                <Box
                  sx={{
                    mb: 3,
                    p: 1.5,
                    bgcolor: "#FDEDED",
                    color: "#D32F2F",
                    borderRadius: 1.5,
                    fontSize: "0.85rem",
                  }}
                >
                  {error}
                </Box>
              )}

              {/* Saved Addresses Quick Selection */}
              {savedAddresses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#1A1817" mb={1.5}>
                    Select from Your Saved Delivery Addresses:
                  </Typography>
                  <Grid container spacing={2}>
                    {savedAddresses.map((sa) => {
                      const isSelected = !isManualAddress && selectedAddressId === (sa._id || sa.id);
                      return (
                        <Grid item xs={12} sm={6} key={sa._id || sa.id}>
                          <Paper
                            elevation={0}
                            onClick={() => handleSelectSavedAddress(sa)}
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              border: isSelected ? "2px solid #D1A362" : "1px solid #ECE7DE",
                              bgcolor: isSelected ? "#FAF8F5" : "#FFFFFF",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              "&:hover": { borderColor: "#D1A362" },
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Typography variant="body2" fontWeight={700} color="#1A1817">
                                {sa.name}
                              </Typography>
                              {sa.isDefault && (
                                <Chip
                                  label="Default"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    bgcolor: "#D1A362",
                                    color: "#FFF",
                                    fontWeight: 700,
                                  }}
                                />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {sa.houseNo ? `${sa.houseNo}, ` : ""}{sa.street}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {sa.city}, {sa.state} - {sa.pincode}
                            </Typography>
                            <Typography variant="caption" color="#888" display="block" mt={0.5}>
                              Phone: {sa.phone}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>

                  <Button
                    size="small"
                    onClick={handleUseNewAddress}
                    sx={{
                      mt: 1.5,
                      color: isManualAddress ? "#D1A362" : "#666",
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "0.8rem",
                    }}
                  >
                    + Enter a different occasion address
                  </Button>
                  <Divider sx={{ my: 2, borderColor: "#ECE7DE" }} />
                </Box>
              )}

              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Recipient Full Name"
                  placeholder="e.g. Priya Sharma"
                  value={address.name || ""}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Flat / House No. / Villa"
                      placeholder="e.g. Apartment 402, Tower B"
                      value={address.houseNo}
                      onChange={(e) => setAddress({ ...address, houseNo: e.target.value })}
                      InputProps={{
                        startAdornment: <HomeOutlinedIcon sx={{ color: "#9E9E9E", mr: 1, fontSize: 20 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Street / Locality / Society"
                      placeholder="e.g. Golf Course Road"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Landmark (Optional)"
                  placeholder="e.g. Near Grand Hyatt Hotel"
                  value={address.landmark}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="City"
                      placeholder="e.g. Mumbai"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      InputProps={{
                        startAdornment: <LocationCityOutlinedIcon sx={{ color: "#9E9E9E", mr: 1, fontSize: 20 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="State"
                      placeholder="e.g. Maharashtra"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="ZIP / PIN Code"
                      placeholder="e.g. 400050"
                      value={address.zip}
                      onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      InputProps={{
                        startAdornment: <PinDropOutlinedIcon sx={{ color: "#9E9E9E", mr: 1, fontSize: 20 }} />,
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Recipient Phone Number"
                  placeholder="10-digit mobile number for delivery coordination"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  InputProps={{
                    startAdornment: <PhoneOutlinedIcon sx={{ color: "#9E9E9E", mr: 1, fontSize: 20 }} />,
                  }}
                />

                {token && (isManualAddress || savedAddresses.length === 0) && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={saveToProfile}
                        onChange={(e) => setSaveToProfile(e.target.checked)}
                        sx={{ color: "#D1A362", "&.Mui-checked": { color: "#D1A362" } }}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        Save this address to my profile for future rental bookings
                      </Typography>
                    }
                  />
                )}

                {/* White-Glove Delivery Notice */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#FAF8F5",
                    border: "1px dashed #D1A362",
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                  }}
                >
                  <LocalShippingOutlinedIcon sx={{ color: "#A07028", mt: 0.3 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="#1A1817">
                      Complimentary White-Glove Delivery & Prepaid Return
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontSize="0.82rem">
                      Garments arrive freshly steamed and sanitized in a breathable travel garment bag. A prepaid return shipping label and courier pick-up are included automatically.
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" pt={2}>
                  <Button
                    onClick={() => navigate(-1)}
                    sx={{ color: "#666", textTransform: "none", fontWeight: 600 }}
                  >
                    ← Back to Garment
                  </Button>

                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleContinue}
                    sx={{
                      backgroundColor: "#1A1817",
                      color: "#FFFFFF",
                      px: 4,
                      py: 1.3,
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
                    Continue to Payment
                  </Button>
                </Box>
              </Stack>
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
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: "#1A1817", mb: 2.5 }}
              >
                Rental Summary
              </Typography>

              {/* Product Preview Card */}
              {product ? (
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
                      {product.category || "Luxury Designer"}
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
              ) : null}

              <Divider sx={{ my: 2 }} />

              {/* Price Breakdown */}
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
                    Professional Dry Cleaning
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
                      Estimated Total
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

              {/* Deposit Protection Box */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: "#FAF8F5",
                  borderRadius: 2,
                  border: "1px solid #ECE7DE",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                }}
              >
                <SecurityOutlinedIcon sx={{ color: "#D1A362", fontSize: 24 }} />
                <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                  <strong>Deposit Protection:</strong> Security deposits are safely held and refunded within 24 hours of garment return inspection.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Fotter />
    </Box>
  );
};

export default CheckoutAddress;
