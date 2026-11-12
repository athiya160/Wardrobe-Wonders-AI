import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Paper,
  Divider,
  Breadcrumbs,
  Link,
  Avatar,
  IconButton,
  Alert,
  Tooltip,
  Snackbar,
  Rating,
  LinearProgress,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  CheckCircleOutline as ApprovedIcon,
  WarningAmberOutlined as DefectIcon,
  LocalShippingOutlined as ShippingIcon,
  AssignmentReturnOutlined as ReturnIcon,
  ShieldOutlined as ShieldIcon,
  ShoppingBagOutlined as CartIcon,
  ArrowBack as BackIcon,
  RemoveShoppingCartOutlined as OutOfStockIcon,
  Refresh as RefreshIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import StoreProductCard from "../components/store/StoreProductCard";
import { resolveProductImage, getCategoryFallbackImage } from "../utils/imageOptimizer";

export default function StoreProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery & Variant State
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(null);
  const [cartError, setCartError] = useState(null);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [breakdown, setBreakdown] = useState({});

  const handleAddToCart = async (redirectToCheckout = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setAddingToCart(true);
    setCartError(null);
    try {
      const matchedVariant = product?.variants?.find(
        (v) =>
          (!selectedSize || v.size === selectedSize) &&
          (!selectedColor || v.color === selectedColor)
      );

      const res = await axios.post(
        `${BASE_URL}/store/cart/items`,
        {
          productId: product._id,
          variantId: matchedVariant?._id || null,
          size: selectedSize,
          color: selectedColor,
          quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        window.dispatchEvent(new Event("store_cart_updated"));
        if (redirectToCheckout) {
          navigate("/store/checkout");
        } else {
          setCartSuccess("Item added to your Store shopping bag!");
        }
      } else {
        setCartError(res.data?.message || "Failed to add to cart.");
      }
    } catch (err) {
      console.error("Add to cart error:", err);
      setCartError(err.response?.data?.message || "Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/store/products/${id}`);
      if (res.data?.success && res.data.product) {
        const prod = res.data.product;
        setProduct(prod);
        setRelatedProducts(res.data.relatedProducts || []);
        setSelectedImage(0);

        // Pre-select first variant if available
        if (prod.variants && prod.variants.length > 0) {
          if (prod.variants[0].size) setSelectedSize(prod.variants[0].size);
          if (prod.variants[0].color) setSelectedColor(prod.variants[0].color);
        }
      } else {
        setError("Product not found or currently unavailable.");
      }
    } catch (err) {
      console.error("Fetch store product detail error:", err);
      setError(err.response?.data?.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    axios
      .get(`${BASE_URL}/store/products/${id}/reviews`)
      .then((res) => {
        if (res.data?.success) {
          setReviews(res.data.reviews || []);
          setReviewsTotal(res.data.total || 0);
          setAvgRating(res.data.averageRating || 0);
          setBreakdown(res.data.ratingBreakdown || {});
        }
      })
      .catch((err) => console.error("Fetch reviews error:", err));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Authenticating luxury listing...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 1 }}>
              Listing Unavailable
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              {error || "This store listing is not publicly visible or may be undergoing moderation."}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchProduct}
                sx={{ textTransform: "none", borderColor: "#D1A362", color: "#A07028" }}
              >
                Retry
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/store")}
                sx={{ bgcolor: "#1A1817", color: "#D1A362", textTransform: "none" }}
              >
                Return to Store
              </Button>
            </Stack>
          </Paper>
        </Container>
        <Fotter />
      </Box>
    );
  }

  const isOutOfStock = Number(product.stockQuantity) <= 0;
  const isPreOwned = product.condition === "PRE_OWNED";
  const store = product.storeId || {};
  const rawImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images.filter(Boolean).map((img) => resolveProductImage({ ...product, image: img }, 1000))
    : [resolveProductImage(product, 1000)];
  const images = rawImages.length > 0 ? rawImages : [getCategoryFallbackImage("store", product.category)];

  // Unique sizes & colors from variants
  const availableSizes = Array.from(new Set(product.variants?.map((v) => v.size).filter(Boolean)));
  const availableColors = Array.from(new Set(product.variants?.map((v) => v.color).filter(Boolean)));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", color: "#1A1817" }}>
      <ResponsiveAppBar />

      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
        {/* Breadcrumb Navigation */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton size="small" onClick={() => navigate("/store")}>
            <BackIcon fontSize="small" />
          </IconButton>
          <Breadcrumbs separator="›" aria-label="store breadcrumbs">
            <Link component={RouterLink} to="/store" underline="hover" color="inherit">
              Store
            </Link>
            <Link component={RouterLink} to={`/store?category=${encodeURIComponent(product.category)}`} underline="hover" color="inherit">
              {product.category}
            </Link>
            {product.subcategory && (
              <Typography color="text.secondary" variant="body2">
                {product.subcategory}
              </Typography>
            )}
            <Typography color="text.primary" variant="body2" sx={{ fontWeight: 700 }}>
              {product.title}
            </Typography>
          </Breadcrumbs>
        </Stack>

        {/* Main Product Layout */}
        <Grid container spacing={{ xs: 3, md: 6 }}>
          {/* Left Column: Image Gallery */}
          <Grid item xs={12} md={7}>
            <Box sx={{ position: "sticky", top: 100 }}>
              {/* Featured Image */}
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: "#FFFFFF",
                  border: "1px solid #ECE7DE",
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={images[selectedImage] || images[0]}
                  alt={product.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCategoryFallbackImage("store", product.category);
                  }}
                  sx={{
                    width: "100%",
                    height: { xs: 360, sm: 520, md: 620 },
                    objectFit: "cover",
                    display: "block",
                    bgcolor: "#FAF8F5",
                    filter: isOutOfStock ? "grayscale(80%) opacity(0.85)" : "none",
                  }}
                />

                {/* Condition Badge */}
                <Chip
                  label={isPreOwned ? "Pre-loved Curated" : "Brand New Couture"}
                  size="small"
                  icon={isPreOwned ? <DefectIcon sx={{ fontSize: "15px !important" }} /> : <ApprovedIcon sx={{ fontSize: "15px !important" }} />}
                  sx={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    bgcolor: isPreOwned ? "rgba(255, 248, 225, 0.95)" : "rgba(26, 24, 23, 0.9)",
                    color: isPreOwned ? "#F57F17" : "#FFFFFF",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    border: isPreOwned ? "1px solid #FFE082" : "1px solid rgba(209, 163, 98, 0.4)",
                    backdropFilter: "blur(6px)",
                  }}
                />

                {isOutOfStock && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: "rgba(211, 47, 47, 0.9)",
                      color: "#FFFFFF",
                      py: 1,
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Sold Out — Currently Unavailable
                  </Box>
                )}
              </Box>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
                  {images.map((img, idx) => (
                    <Box
                      key={idx}
                      component="img"
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getCategoryFallbackImage("store", product.category);
                      }}
                      onClick={() => setSelectedImage(idx)}
                      sx={{
                        width: 76,
                        height: 96,
                        objectFit: "cover",
                        borderRadius: 1.5,
                        cursor: "pointer",
                        border: selectedImage === idx ? "2px solid #D1A362" : "1px solid #ECE7DE",
                        opacity: selectedImage === idx ? 1 : 0.65,
                        transition: "all 0.2s ease",
                        "&:hover": { opacity: 1 },
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Grid>

          {/* Right Column: Details & Purchasing Controls */}
          <Grid item xs={12} md={5}>
            {/* Storefront Attribution Pill */}
            {store.storeSlug && (
              <Paper
                elevation={0}
                component={RouterLink}
                to={`/store/storefront/${store.storeSlug}`}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.2,
                  px: 2,
                  py: 1,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid #ECE7DE",
                  bgcolor: "#FFFFFF",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#D1A362", bgcolor: "#FAF8F5" },
                }}
              >
                <Avatar
                  src={store.logo}
                  sx={{ width: 28, height: 28, bgcolor: "#D1A362", color: "#1A1817", fontWeight: 700, fontSize: "0.8rem" }}
                >
                  {store.storeName ? store.storeName[0].toUpperCase() : "S"}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", lineHeight: 1.2 }}>
                    {store.storeName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Verified Partner • {store.location?.city || "India"}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Product Title */}
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 800,
                fontSize: { xs: "1.8rem", sm: "2.3rem" },
                letterSpacing: "-0.02em",
                color: "#1A1817",
                mb: 1.5,
                lineHeight: 1.2,
              }}
            >
              {product.title}
            </Typography>

            {/* Price Block */}
            <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mb: 2.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817" }}>
                ₹{Number(product.price).toLocaleString("en-IN")}
              </Typography>
              {product.originalRetailPrice && Number(product.originalRetailPrice) > Number(product.price) && (
                <Typography variant="h6" sx={{ color: "text.disabled", textDecoration: "line-through" }}>
                  ₹{Number(product.originalRetailPrice).toLocaleString("en-IN")}
                </Typography>
              )}
              <Chip
                label="Permanent Purchase"
                size="small"
                sx={{ bgcolor: "#FAF8F5", color: "#A07028", fontWeight: 700, border: "1px solid #ECE7DE" }}
              />
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {/* Pre-Loved Transparency Disclosure */}
            {isPreOwned && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "#FFFDE7",
                  border: "1px solid #FFF59D",
                  mb: 3,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <DefectIcon sx={{ color: "#F57F17", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F57F17" }}>
                    Pre-loved Condition & Flaw Disclosures
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: "#5D4037", lineHeight: 1.6, mb: 1.5 }}>
                  {product.conditionDescription || "Verified pre-owned garment. Inspected by seller."}
                </Typography>

                {/* Defect Images */}
                {product.defectImages && product.defectImages.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#8D6E63", display: "block", mb: 0.8 }}>
                      Detailed Photos of Visible Wear / Flaws:
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {product.defectImages.map((dImg, dIdx) => (
                        <Box
                          key={dIdx}
                          component="img"
                          src={dImg}
                          alt="Defect detail"
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid #FFE082",
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}

            {/* Variant Selector: Size */}
            {availableSizes.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  Select Size: {selectedSize && <strong>({selectedSize})</strong>}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {availableSizes.map((sz) => (
                    <Chip
                      key={sz}
                      label={sz}
                      clickable
                      onClick={() => setSelectedSize(sz)}
                      sx={{
                        bgcolor: selectedSize === sz ? "#1A1817" : "#FFFFFF",
                        color: selectedSize === sz ? "#FFFFFF" : "#1A1817",
                        border: selectedSize === sz ? "1px solid #1A1817" : "1px solid #ECE7DE",
                        fontWeight: 700,
                        minWidth: 44,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Variant Selector: Color */}
            {availableColors.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  Select Shade / Colour: {selectedColor && <strong>({selectedColor})</strong>}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {availableColors.map((clr) => (
                    <Chip
                      key={clr}
                      label={clr}
                      clickable
                      onClick={() => setSelectedColor(clr)}
                      sx={{
                        bgcolor: selectedColor === clr ? "#1A1817" : "#FFFFFF",
                        color: selectedColor === clr ? "#FFFFFF" : "#1A1817",
                        border: selectedColor === clr ? "1px solid #1A1817" : "1px solid #ECE7DE",
                        fontWeight: 700,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Stock & Quantity */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Quantity:
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: isOutOfStock ? "error.main" : "success.main",
                  }}
                >
                  {isOutOfStock ? "Sold Out" : `${product.stockQuantity} items in stock`}
                </Typography>
              </Stack>

              {!isOutOfStock && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    sx={{ minWidth: 36, borderColor: "#ECE7DE", color: "#1A1817" }}
                  >
                    -
                  </Button>
                  <Typography variant="body1" sx={{ fontWeight: 800, px: 2 }}>
                    {quantity}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                    sx={{ minWidth: 36, borderColor: "#ECE7DE", color: "#1A1817" }}
                  >
                    +
                  </Button>
                </Stack>
              )}
            </Box>

            {/* Purchase CTA */}
            {cartError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setCartError(null)}>
                {cartError}
              </Alert>
            )}

            <Stack spacing={1.5} sx={{ mb: 4 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={isOutOfStock || addingToCart}
                startIcon={addingToCart ? <CircularProgress size={20} color="inherit" /> : (isOutOfStock ? <OutOfStockIcon /> : <CartIcon />)}
                onClick={() => handleAddToCart(false)}
                sx={{
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 800,
                  fontSize: "1rem",
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#2C2825" },
                  "&.Mui-disabled": { bgcolor: "#ECE7DE", color: "#9E9E9E" },
                }}
              >
                {isOutOfStock ? "Out of Stock" : addingToCart ? "Adding to Bag..." : "Add to Store Bag"}
              </Button>

              {!isOutOfStock && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  disabled={addingToCart}
                  onClick={() => handleAddToCart(true)}
                  sx={{
                    borderColor: "#1A1817",
                    color: "#1A1817",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    py: 1.3,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": { borderColor: "#D1A362", bgcolor: "#FAF9F7" },
                  }}
                >
                  Buy Now (Instant Checkout)
                </Button>
              )}

              <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", display: "block" }}>
                🔒 Secure Platform Checkout • Multi-vendor purchase protection
              </Typography>
            </Stack>

            <Snackbar
              open={Boolean(cartSuccess)}
              autoHideDuration={4000}
              onClose={() => setCartSuccess(null)}
              message={cartSuccess}
              action={
                <Button
                  size="small"
                  onClick={() => {
                    setCartSuccess(null);
                    navigate("/store/cart");
                  }}
                  sx={{ color: "#D1A362", fontWeight: 700 }}
                >
                  View Bag
                </Button>
              }
            />

            {/* Shipping & Fulfillment Policy Card */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF", mb: 4 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <ShippingIcon sx={{ color: "#D1A362", fontSize: 22, mt: 0.3 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      Seller-Managed Dispatch
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      Dispatched directly by {store.storeName || "the seller"} within {product.shippingInformation?.dispatchDays || 2} business days. Tracked domestic delivery.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <ReturnIcon sx={{ color: "#D1A362", fontSize: 22, mt: 0.3 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      {product.shippingInformation?.returnPolicyDays || 7}-Day Marketplace Return Policy
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      Eligible for return if unworn with tags attached or if condition materially differs from seller disclosure.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Paper>

            {/* Product Description */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 1 }}>
                Product Description
              </Typography>
              <Typography variant="body2" sx={{ color: "#4A4A4A", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {product.description}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Customer Reviews & Ratings Breakdown */}
        <Box sx={{ mt: 8, pt: 5, borderTop: "1px solid #ECE7DE" }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 800,
              color: "#1A1817",
              mb: 1,
            }}
          >
            Customer Reviews &amp; Ratings
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Verified purchase reviews from customers who received this item.
          </Typography>

          <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* Rating Summary Card */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  border: "1px solid #ECE7DE",
                  bgcolor: "#FAF9F7",
                  textAlign: "center",
                }}
              >
                <Typography variant="h2" sx={{ fontWeight: 800, color: "#1A1817", mb: 0.5 }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </Typography>
                <Rating value={avgRating} precision={0.1} readOnly size="medium" sx={{ mb: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Based on {reviewsTotal} verified {reviewsTotal === 1 ? "review" : "reviews"}
                </Typography>
              </Paper>
            </Grid>

            {/* Rating Breakdown Bars */}
            <Grid item xs={12} md={8}>
              <Stack spacing={1.2} justifyContent="center" sx={{ height: "100%" }}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = breakdown[stars] || 0;
                  const pct = reviewsTotal > 0 ? (count / reviewsTotal) * 100 : 0;
                  return (
                    <Stack key={stars} direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" sx={{ minWidth: 45, fontWeight: 700, color: "text.secondary" }}>
                        {stars} Star
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "#ECE7DE",
                          "& .MuiLinearProgress-bar": { bgcolor: "#D1A362", borderRadius: 4 },
                        }}
                      />
                      <Typography variant="caption" sx={{ minWidth: 35, textAlign: "right", color: "text.secondary" }}>
                        {count}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Grid>
          </Grid>

          {/* Published Reviews List */}
          {reviews.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px dashed #ECE7DE", borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No reviews yet for this listing. Be the first verified customer to share feedback!
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2.5}>
              {reviews.map((rev) => (
                <Paper
                  key={rev._id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid #ECE7DE",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {rev.customerName || "Verified Customer"}
                      </Typography>
                      <Chip
                        icon={<VerifiedIcon sx={{ fontSize: 13, color: "#2E7D32 !important" }} />}
                        label="Verified Purchase"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: "#E8F5E9",
                          color: "#2E7D32",
                        }}
                      />
                    </Stack>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  </Stack>

                  <Rating value={rev.rating} readOnly size="small" sx={{ mb: 1 }} />

                  {rev.title && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 0.5 }}>
                      {rev.title}
                    </Typography>
                  )}

                  <Typography variant="body2" sx={{ color: "#4A4A4A", lineHeight: 1.6 }}>
                    {rev.comment}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 10, pt: 6, borderTop: "1px solid #ECE7DE" }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 800,
                color: "#1A1817",
                mb: 1,
              }}
            >
              More from {product.category}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
              Explore other approved permanent-purchase pieces in this collection.
            </Typography>

            <Grid container spacing={3}>
              {relatedProducts.map((relItem) => (
                <Grid item xs={12} sm={6} md={3} key={relItem._id}>
                  <StoreProductCard product={relItem} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      <Fotter />
    </Box>
  );
}
