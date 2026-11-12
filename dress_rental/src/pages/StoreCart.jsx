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
  IconButton,
  Alert,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  StorefrontOutlined as StoreIcon,
  LocalShippingOutlined as ShippingIcon,
  ShieldOutlined as ShieldIcon,
  ArrowForward as ArrowForwardIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  ShoppingBagOutlined as EmptyCartIcon,
  WarningAmberOutlined as WarningIcon,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";

export default function StoreCart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const token = localStorage.getItem("token");

  const fetchCart = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await axios.get(`${BASE_URL}/store/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.cart) {
        setCart(res.data.cart);
        window.dispatchEvent(new Event("store_cart_updated"));
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
      setError(err.response?.data?.message || "Failed to load shopping cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleUpdateQuantity = async (itemId, currentQty, delta, maxStock) => {
    const newQty = currentQty + delta;
    if (newQty < 1 || newQty > maxStock) return;

    setActionLoadingId(itemId);
    setError(null);
    try {
      const res = await axios.put(
        `${BASE_URL}/store/cart/items/${itemId}`,
        { quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success && res.data.cart) {
        setCart(res.data.cart);
        window.dispatchEvent(new Event("store_cart_updated"));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update item quantity.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setActionLoadingId(itemId);
    setError(null);
    try {
      const res = await axios.delete(`${BASE_URL}/store/cart/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.cart) {
        setCart(res.data.cart);
        setSuccessMsg("Item removed from your cart.");
        window.dispatchEvent(new Event("store_cart_updated"));
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove item.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to empty your Store shopping cart?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.delete(`${BASE_URL}/store/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.cart) {
        setCart(res.data.cart);
        window.dispatchEvent(new Event("store_cart_updated"));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear cart.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <EmptyCartIcon sx={{ fontSize: 64, color: "#D1A362", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", mb: 1.5 }}>
              Sign In to View Your Store Bag
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Your Store cart is securely synced with your Wardrobe Wonders member account across devices.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                px: 4,
                py: 1.2,
                borderRadius: 2,
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              Sign In to Continue
            </Button>
          </Paper>
        </Container>
        <Fotter />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Loading your Store shopping bag...
          </Typography>
        </Container>
        <Fotter />
      </Box>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
      <ResponsiveAppBar />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", letterSpacing: "-0.02em" }}>
              Store Shopping Bag
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Permanent fashion purchases from independent boutiques and designers
            </Typography>
          </Box>
          {!isEmpty && (
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={handleClearCart}
              sx={{ fontWeight: 600, textTransform: "none" }}
            >
              Clear Bag
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
            {successMsg}
          </Alert>
        )}

        {cart?.hasUnavailableItems && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 3, borderRadius: 2, border: "1px solid #FFE082" }}
          >
            Some items in your cart are currently out of stock or unavailable. Please remove or adjust them before proceeding to checkout.
          </Alert>
        )}

        {isEmpty ? (
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
            <EmptyCartIcon sx={{ fontSize: 72, color: "#D1A362", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", mb: 1 }}>
              Your Store bag is empty
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 450, mx: "auto", mb: 4 }}>
              Discover handcrafted couture, bridal jewellery, evening wear, and accessories from verified independent sellers.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/store")}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                px: 4,
                py: 1.4,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              Explore Store Marketplace
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {/* Left: Seller Groups & Items */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                {cart.sellerGroups.map((group) => (
                  <Paper
                    key={group.storeId}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 2.5,
                      border: "1px solid #ECE7DE",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    {/* Seller Header */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ pb: 2, borderBottom: "1px solid #F0ECE4", mb: 2 }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <StoreIcon sx={{ color: "#D1A362", fontSize: 24 }} />
                        <Box>
                          <Typography
                            component={RouterLink}
                            to={`/store/storefront/${group.storeSlug}`}
                            variant="subtitle1"
                            sx={{
                              fontWeight: 800,
                              color: "#1A1817",
                              textDecoration: "none",
                              "&:hover": { color: "#D1A362" },
                            }}
                          >
                            {group.storeName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                            Independent Seller • Direct Dispatch
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        icon={<ShippingIcon sx={{ fontSize: 16 }} />}
                        label={
                          group.shippingFee === 0
                            ? "Free Delivery"
                            : `Shipping: ₹${group.shippingFee.toLocaleString("en-IN")}`
                        }
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: group.shippingFee === 0 ? "#E8F5E9" : "#F5F5F5",
                          color: group.shippingFee === 0 ? "#2E7D32" : "#1A1817",
                        }}
                      />
                    </Stack>

                    {/* Group Items */}
                    <Stack spacing={2} divider={<Divider sx={{ borderColor: "#F7F5F0" }} />}>
                      {group.items.map((item) => (
                        <Grid container spacing={2} key={item._id} alignItems="center">
                          {/* Image */}
                          <Grid item xs={3} sm={2}>
                            <Box
                              component="img"
                              src={item.image || "https://placehold.co/120x160?text=Listing"}
                              alt={item.title}
                              sx={{
                                width: "100%",
                                aspectRatio: "3/4",
                                objectFit: "cover",
                                borderRadius: 1.5,
                                border: "1px solid #ECE7DE",
                                opacity: item.isAvailable ? 1 : 0.6,
                              }}
                            />
                          </Grid>

                          {/* Info */}
                          <Grid item xs={9} sm={6}>
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
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mb: 0.5,
                                "&:hover": { color: "#D1A362" },
                              }}
                            >
                              {item.title}
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              {item.size && (
                                <Chip label={`Size: ${item.size}`} size="small" sx={{ fontSize: "0.75rem", height: 22 }} />
                              )}
                              {item.color && (
                                <Chip label={`Colour: ${item.color}`} size="small" sx={{ fontSize: "0.75rem", height: 22 }} />
                              )}
                            </Stack>

                            {!item.isAvailable && (
                              <Chip
                                label={item.warning || "Unavailable"}
                                size="small"
                                color="error"
                                sx={{ fontWeight: 700, fontSize: "0.75rem", height: 22 }}
                              />
                            )}
                          </Grid>

                          {/* Quantity & Pricing */}
                          <Grid item xs={12} sm={4}>
                            <Stack
                              direction={{ xs: "row", sm: "column" }}
                              alignItems={{ xs: "center", sm: "flex-end" }}
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                                ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                              </Typography>

                              {item.quantity > 1 && (
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                  ₹{item.unitPrice.toLocaleString("en-IN")} each
                                </Typography>
                              )}

                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <IconButton
                                  size="small"
                                  disabled={item.quantity <= 1 || actionLoadingId === item._id || !item.isAvailable}
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity, -1, item.availableStock || 999)}
                                  sx={{ border: "1px solid #ECE7DE", borderRadius: 1 }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" sx={{ fontWeight: 700, px: 1 }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  disabled={
                                    item.quantity >= (item.availableStock || 0) ||
                                    actionLoadingId === item._id ||
                                    !item.isAvailable
                                  }
                                  onClick={() => handleUpdateQuantity(item._id, item.quantity, 1, item.availableStock || 999)}
                                  sx={{ border: "1px solid #ECE7DE", borderRadius: 1 }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={actionLoadingId === item._id}
                                  onClick={() => handleRemoveItem(item._id)}
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </Grid>
                        </Grid>
                      ))}
                    </Stack>

                    <Divider sx={{ my: 2, borderColor: "#F0ECE4" }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Boutique subtotal:
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                        ₹{group.subtotal.toLocaleString("en-IN")} + ₹{group.shippingFee.toLocaleString("en-IN")} delivery
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>

            {/* Right: Order Summary Sidebar */}
            <Grid item xs={12} md={4}>
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
                  Order Summary
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Items Subtotal ({cart.itemCount} items)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      ₹{cart.cartSubtotal.toLocaleString("en-IN")}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Total Delivery ({cart.sellerGroups.length} sellers)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: cart.totalShippingFee === 0 ? "success.main" : "text.primary" }}>
                      {cart.totalShippingFee === 0 ? "FREE" : `₹${cart.totalShippingFee.toLocaleString("en-IN")}`}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    Grand Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    ₹{cart.grandTotal.toLocaleString("en-IN")}
                  </Typography>
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={cart.hasUnavailableItems || cart.items.length === 0}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/store/checkout")}
                  sx={{
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    fontWeight: 800,
                    fontSize: "1rem",
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    "&:hover": { bgcolor: "#2C2825" },
                    "&.Mui-disabled": { bgcolor: "#ECE7DE", color: "#9E9E9E" },
                    mb: 3,
                  }}
                >
                  Proceed to Store Checkout
                </Button>

                {/* Trust Badges */}
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ShieldIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Verified independent boutiques & designers
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ShippingIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Individual seller dispatch with tracking updates
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      <Fotter />
    </Box>
  );
}
