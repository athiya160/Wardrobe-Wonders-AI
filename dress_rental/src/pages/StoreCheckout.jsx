import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Stack,
  CircularProgress,
  Paper,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  LocalShippingOutlined as ShippingIcon,
  HomeOutlined as HomeIcon,
  AddLocationAltOutlined as AddAddressIcon,
  LockOutlined as LockIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";

export default function StoreCheckout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Add Address Modal State
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    street: "",
    houseNo: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    label: "Home",
  });
  const [addressError, setAddressError] = useState(null);

  const fetchData = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate Cart
      const cartRes = await axios.post(
        `${BASE_URL}/store/checkout/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!cartRes.data?.valid) {
        setError(cartRes.data?.errors?.join(". ") || "Some items in your cart are no longer available.");
      }
      setCart(cartRes.data?.cart);

      // Fetch Saved Addresses
      const addrRes = await axios.get(`${BASE_URL}/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (addrRes.data?.success && Array.isArray(addrRes.data.addresses)) {
        setAddresses(addrRes.data.addresses);
        // Find default address index
        const defIdx = addrRes.data.addresses.findIndex((a) => a.isDefault);
        if (defIdx > -1) setSelectedAddressIndex(defIdx);
      }
    } catch (err) {
      console.error("Checkout init error:", err);
      setError(err.response?.data?.message || "Failed to initialize checkout. Please check your cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    setAddressError(null);

    const { name, phone, street, city, state, pincode } = newAddress;
    if (!name || !phone || !street || !city || !state || !pincode) {
      setAddressError("Please fill in all required address fields.");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setAddressError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/user/addresses`, newAddress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && Array.isArray(res.data.addresses)) {
        setAddresses(res.data.addresses);
        setSelectedAddressIndex(res.data.addresses.length - 1);
        setOpenAddressDialog(false);
        setNewAddress({
          name: "",
          phone: "",
          street: "",
          houseNo: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
          label: "Home",
        });
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || "Failed to save address.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!addresses || addresses.length === 0) {
      setError("Please add a shipping address to proceed.");
      return;
    }

    const address = addresses[selectedAddressIndex];
    if (!address) {
      setError("Please select a valid delivery address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await axios.post(
        `${BASE_URL}/store/checkout/create-order`,
        {
          shippingAddress: {
            name: address.name,
            phone: address.phone,
            street: address.street,
            houseNo: address.houseNo || "",
            landmark: address.landmark || "",
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            label: address.label || "Home",
          },
          notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success && res.data.order) {
        window.dispatchEvent(new Event("store_cart_updated"));
        const createdOrder = res.data.order;
        const fulfilmentOrders = res.data.fulfilmentOrders || [];

        try {
          const payRes = await axios.post(
            `${BASE_URL}/store/payment/initiate`,
            {
              orderId: createdOrder._id,
              idempotencyKey: `CHK-${createdOrder._id}-${Date.now()}`,
              simulateMock: true,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (
            payRes.data?.success &&
            payRes.data.redirectUrl &&
            !payRes.data.redirectUrl.includes("store/order-success")
          ) {
            window.location.href = payRes.data.redirectUrl;
            return;
          }
        } catch (payErr) {
          console.warn("Payment session initiation notice:", payErr);
        }

        navigate(`/store/order-success/${createdOrder._id}`, {
          state: {
            order: createdOrder,
            fulfilmentOrders,
          },
        });
      } else {
        setError(res.data?.message || "Failed to finalize order.");
      }
    } catch (err) {
      console.error("Create order error:", err);
      setError(err.response?.data?.message || "Checkout failed. Some items may have changed stock.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Preparing multi-seller checkout...
          </Typography>
        </Container>
        <Fotter />
      </Box>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  if (isEmpty) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              Your Store cart is empty
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Please add items to your cart before proceeding to checkout.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/store")}
              sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700 }}
            >
              Browse Store
            </Button>
          </Paper>
        </Container>
        <Fotter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
      <ResponsiveAppBar />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Header Breadcrumb */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/store/cart")}
            sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
          >
            Back to Bag
          </Button>
        </Stack>

        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", letterSpacing: "-0.02em", mb: 1 }}>
          Store Checkout
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
          Review your shipping address and multi-seller shipment breakdown
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Multi-Seller Split Explanation Banner */}
        {cart.sellerGroups.length > 1 && (
          <Alert
            severity="info"
            icon={<StoreIcon sx={{ color: "#D1A362" }} />}
            sx={{
              mb: 4,
              borderRadius: 2.5,
              border: "1px solid #D1A362",
              bgcolor: "#FFFDF9",
              "& .MuiAlert-message": { color: "#1A1817" },
            }}
          >
            <strong>Multi-Seller Marketplace Order:</strong> Your cart includes items from{" "}
            <strong>{cart.sellerGroups.length} independent sellers</strong>. Each seller will individually prepare,
            package, and dispatch their portion of the order with dedicated courier tracking.
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Left Column: Address Selection & Seller Orders Review */}
          <Grid item xs={12} md={7}>
            <Stack spacing={4}>
              {/* Section 1: Delivery Address */}
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 2.5, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <HomeIcon sx={{ color: "#D1A362" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      1. Delivery Address
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddAddressIcon />}
                    onClick={() => setOpenAddressDialog(true)}
                    sx={{
                      borderColor: "#D1A362",
                      color: "#1A1817",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 1.5,
                    }}
                  >
                    Add New
                  </Button>
                </Stack>

                {addresses.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center", bgcolor: "#FAF9F7", borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                      No saved addresses found in your account.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setOpenAddressDialog(true)}
                      sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700 }}
                    >
                      Add Delivery Address
                    </Button>
                  </Box>
                ) : (
                  <RadioGroup
                    value={selectedAddressIndex}
                    onChange={(e) => setSelectedAddressIndex(Number(e.target.value))}
                  >
                    <Stack spacing={1.5}>
                      {addresses.map((addr, idx) => (
                        <Paper
                          key={idx}
                          elevation={0}
                          onClick={() => setSelectedAddressIndex(idx)}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: selectedAddressIndex === idx ? "2px solid #D1A362" : "1px solid #ECE7DE",
                            bgcolor: selectedAddressIndex === idx ? "#FFFDF9" : "#FFFFFF",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <FormControlLabel
                            value={idx}
                            control={<Radio sx={{ color: "#D1A362", "&.Mui-checked": { color: "#D1A362" } }} />}
                            label={
                              <Box sx={{ ml: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                                    {addr.name}
                                  </Typography>
                                  <Chip label={addr.label || "Home"} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} />
                                  {addr.isDefault && (
                                    <Chip label="Default" size="small" color="success" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} />
                                  )}
                                </Stack>
                                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                                  {addr.houseNo ? `${addr.houseNo}, ` : ""}
                                  {addr.street}
                                  {addr.landmark ? `, near ${addr.landmark}` : ""}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                                  {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                                  Phone: +91 {addr.phone}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: "100%", m: 0, alignItems: "flex-start" }}
                          />
                        </Paper>
                      ))}
                    </Stack>
                  </RadioGroup>
                )}
              </Paper>

              {/* Section 2: Multi-Seller Shipment Breakdown */}
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 2.5, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <ShippingIcon sx={{ color: "#D1A362" }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    2. Shipment Breakdown ({cart.sellerGroups.length} {cart.sellerGroups.length === 1 ? "Seller" : "Sellers"})
                  </Typography>
                </Stack>

                <Stack spacing={3}>
                  {cart.sellerGroups.map((group, gIdx) => (
                    <Box
                      key={group.storeId}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: "1px solid #F0ECE4",
                        bgcolor: "#FAFAF8",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                          Shipment #{gIdx + 1}: {group.storeName}
                        </Typography>
                        <Chip
                          label={group.shippingFee === 0 ? "Free Shipping" : `Delivery: ₹${group.shippingFee}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: group.shippingFee === 0 ? "#E8F5E9" : "#ECE7DE",
                            color: group.shippingFee === 0 ? "#2E7D32" : "#1A1817",
                          }}
                        />
                      </Stack>

                      <Stack spacing={1.5}>
                        {group.items.map((item) => (
                          <Stack direction="row" spacing={2} key={item._id} alignItems="center">
                            <Box
                              component="img"
                              src={item.image || "https://placehold.co/80x100?text=Item"}
                              alt={item.title}
                              sx={{
                                width: 50,
                                height: 65,
                                objectFit: "cover",
                                borderRadius: 1,
                                border: "1px solid #ECE7DE",
                              }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                                {item.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ""} {item.color ? `• Shade: ${item.color}` : ""}
                              </Typography>
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                              ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>

                      <Divider sx={{ my: 1.5, borderColor: "#E8E3D9" }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Seller Subtotal: ₹{group.subtotal.toLocaleString("en-IN")}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#1A1817" }}>
                          Total for this shipment: ₹{group.total.toLocaleString("en-IN")}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Section 3: Delivery Notes */}
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 2.5, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "#1A1817" }}>
                  Delivery Instructions / Order Notes (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g. Leave with security guard, gate code, preferred timing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Paper>
            </Stack>
          </Grid>

          {/* Right Column: Order Total & Confirm Action */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 2.5,
                border: "1px solid #ECE7DE",
                bgcolor: "#FFFFFF",
                position: "sticky",
                top: 24,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817", mb: 2.5 }}>
                Payment & Total
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Total Items ({cart.itemCount})
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ₹{cart.cartSubtotal.toLocaleString("en-IN")}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Delivery ({cart.sellerGroups.length} sellers)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: cart.totalShippingFee === 0 ? "success.main" : "text.primary" }}>
                    {cart.totalShippingFee === 0 ? "FREE" : `₹${cart.totalShippingFee.toLocaleString("en-IN")}`}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ mb: 2.5 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                  Amount Payable
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817" }}>
                  ₹{cart.grandTotal.toLocaleString("en-IN")}
                </Typography>
              </Stack>

              {/* Payment Method Badge */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#FAF9F7",
                  border: "1px solid #ECE7DE",
                  mb: 3,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <LockIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    PhonePe Sandbox (Phase 5/6)
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  Order starts in <strong>PENDING_PAYMENT</strong> state with atomic inventory reservation and multi-seller split. PhonePe sandbox payment gateway transitions to active fulfillment in Phase 6.
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting || addresses.length === 0}
                onClick={handlePlaceOrder}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                sx={{
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 800,
                  fontSize: "1rem",
                  py: 1.6,
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  "&:hover": { bgcolor: "#2C2825" },
                  "&.Mui-disabled": { bgcolor: "#ECE7DE", color: "#9E9E9E" },
                  mb: 2.5,
                }}
              >
                {submitting ? "Reserving & Splitting Orders..." : "Confirm & Place Store Order"}
              </Button>

              <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", display: "block" }}>
                🔒 High-concurrency atomic stock reservation • Rollback on failure
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Add Address Dialog */}
      <Dialog
        open={openAddressDialog}
        onClose={() => setOpenAddressDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Add Delivery Address
        </DialogTitle>
        <DialogContent dividers>
          {addressError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {addressError}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Recipient Full Name"
                  fullWidth
                  required
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  required
                  placeholder="10-digit mobile"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Flat / House No."
                  fullWidth
                  value={newAddress.houseNo}
                  onChange={(e) => setNewAddress({ ...newAddress, houseNo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Street / Locality"
                  fullWidth
                  required
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              label="Landmark (Optional)"
              fullWidth
              value={newAddress.landmark}
              onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="City"
                  fullWidth
                  required
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  fullWidth
                  required
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="PIN Code (6 digits)"
                  fullWidth
                  required
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Address Type"
              fullWidth
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
            >
              <MenuItem value="Home">Home</MenuItem>
              <MenuItem value="Work">Work</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddressDialog(false)} sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNewAddress}
            sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700 }}
          >
            Save Address
          </Button>
        </DialogActions>
      </Dialog>

      <Fotter />
    </Box>
  );
}
