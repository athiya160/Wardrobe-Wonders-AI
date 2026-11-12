import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Button,
  CircularProgress,
  TextField,
  Rating,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  Tooltip,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import CleanHandsOutlinedIcon from "@mui/icons-material/CleanHandsOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import StraightenIcon from "@mui/icons-material/Straighten";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VerifiedIcon from "@mui/icons-material/Verified";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import ProductCard from "../components/ProductCard";
import SizeGuideModal from "../components/SizeGuideModal";
import { resolveProductImage, getCategoryFallbackImage, getOptimizedImageUrl } from "../utils/imageOptimizer";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [qty, setQty] = useState(3);
  const [activeImage, setActiveImage] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Gallery zoom & lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ display: "none" });
  const imageContainerRef = useRef(null);

  // Size Guide Modal state
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Review state
  const [newReview, setNewReview] = useState({ rating: 5, comment: "", username: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Report Listing Dialog state
  const [reportModal, setReportModal] = useState({
    open: false,
    reason: "Misleading listing",
    details: "",
    reporterEmail: "",
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFeedback, setReportFeedback] = useState({ open: false, message: "", severity: "success" });

  // Dates and availability
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [availability, setAvailability] = useState({ available: true, bookedDates: [] });
  const [dateConflict, setDateConflict] = useState(false);
  const [presetDuration, setPresetDuration] = useState("3"); // "3", "7", or "custom"

  // Fetch product and related items
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/products/detail/${id}`)
      .then((res) => {
        const data = res.data;
        setProduct(data);
        setActiveImage(resolveProductImage(data, 1200));

        // Sync wishlist status
        try {
          const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
          setIsWishlisted(wishlist.some((item) => item._id === data._id));
        } catch {
          setIsWishlisted(false);
        }

        // Save recently viewed
        try {
          let recent = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
          recent = recent.filter((p) => p._id !== data._id);
          recent.unshift(data);
          if (recent.length > 6) recent.pop();
          localStorage.setItem("recently_viewed", JSON.stringify(recent));
          setRecentlyViewed(recent.filter((p) => p._id !== data._id));
        } catch {
          // ignore local storage errors
        }

        // Fetch similar
        return axios.post(`${BASE_URL}/products/similar`, {
          product_id: data._id,
          product_name: data.name,
          product_category: data.category,
          product_description: data.description || "",
        });
      })
      .then((res) => {
        setSimilar(res.data || []);
      })
      .catch((err) => console.error("Error loading product detail:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch availability calendar
  useEffect(() => {
    axios
      .get(`${BASE_URL}/products/${id}/availability`)
      .then((res) => {
        if (res.data?.status) {
          setAvailability(res.data);
        }
      })
      .catch(() => {});
  }, [id]);

  // Handle duration preset changes (3-day vs 7-day vs custom)
  const applyPreset = (days) => {
    setPresetDuration(String(days));
    const s = new Date(startDate || new Date());
    const e = new Date(s);
    e.setDate(s.getDate() + days);
    setEndDate(e.toISOString().split("T")[0]);
  };

  // Validate dates and calculate quantity
  useEffect(() => {
    if (!startDate || !endDate) return;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) {
      setDateConflict(true);
      return;
    }
    const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    setQty(diff);

    // Check conflict against booked dates
    const hasConflict = (availability.bookedDates || []).some((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return s <= bEnd && bStart <= e;
    });
    setDateConflict(hasConflict);
  }, [startDate, endDate, availability]);

  // Wishlist toggle with backend synchronization
  const toggleWishlist = async () => {
    if (!product) return;
    const token = localStorage.getItem("token");
    let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

    if (isWishlisted) {
      if (token) {
        try {
          await axios.delete(`${BASE_URL}/user/wishlist/${product._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error("Failed to delete wishlist item on server:", err);
        }
      }
      wishlist = wishlist.filter((item) => (item._id || item) !== product._id);
      setIsWishlisted(false);
      setReportFeedback({ open: true, message: "Removed from your Wishlist.", severity: "info" });
    } else {
      if (token) {
        try {
          await axios.post(`${BASE_URL}/user/wishlist/${product._id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error("Failed to add wishlist item on server:", err);
        }
      }
      wishlist.push(product);
      setIsWishlisted(true);
      setReportFeedback({ open: true, message: "Saved to your Wishlist.", severity: "success" });
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("wishlist_updated"));
  };

  // Share link
  const handleShare = async () => {
    const shareData = {
      title: product?.name || "Wardrobe Wonders Couture",
      text: `Rent ${product?.name} on Wardrobe Wonders:`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setReportFeedback({ open: true, message: "Product link copied to clipboard!", severity: "success" });
      } catch {
        setReportFeedback({ open: true, message: "Unable to copy link.", severity: "warning" });
      }
    }
  };

  // Magnifying lens hover calculations
  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: "block",
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  // Booking CTA
  const handleRentClick = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.email) {
      navigate("/login", { state: { from: `/checkout/address/${product._id}` } });
      return;
    }
    if (dateConflict) {
      setReportFeedback({
        open: true,
        message: "Selected rental dates are already reserved. Please choose different dates.",
        severity: "error",
      });
      return;
    }
    if (qty < 1) {
      setReportFeedback({
        open: true,
        message: "Please select a rental duration of at least 1 day.",
        severity: "warning",
      });
      return;
    }
    navigate(`/checkout/address/${product._id}`, {
      state: { qty, startDate, endDate, product },
    });
  };

  // Review submission
  const submitReview = async () => {
    if (!newReview.comment.trim() || !newReview.username.trim()) {
      setReportFeedback({
        open: true,
        message: "Please provide both your name and a detailed review comment.",
        severity: "warning",
      });
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/products/${id}/review`, newReview);
      setProduct(res.data);
      setNewReview({ rating: 5, comment: "", username: "" });
      setReportFeedback({ open: true, message: "Thank you! Your verified review has been published.", severity: "success" });
    } catch (err) {
      console.error("Review submit error:", err);
      setReportFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to submit review. Please try again.",
        severity: "error",
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Report modal handlers
  const handleOpenReport = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setReportModal({
      open: true,
      reason: "Misleading listing",
      details: "",
      reporterEmail: user.email || "",
    });
  };

  const handleSubmitReport = async () => {
    if (!reportModal.reporterEmail || !reportModal.reporterEmail.includes("@")) {
      setReportFeedback({
        open: true,
        message: "Please enter a valid email address for contact.",
        severity: "error",
      });
      return;
    }

    setReportLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/products/${id}/report`, {
        reason: reportModal.reason,
        details: reportModal.details,
        reporterEmail: reportModal.reporterEmail,
      });

      if (res.data?.success) {
        setReportFeedback({
          open: true,
          message: "Report submitted successfully. Our Trust & Safety team will review this listing within 24 hours.",
          severity: "success",
        });
        setReportModal({ open: false, reason: "Misleading listing", details: "", reporterEmail: "" });
      } else {
        setReportFeedback({
          open: true,
          message: res.data?.message || "Failed to submit report.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Report submit error:", err);
      setReportFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to submit report. Please try again.",
        severity: "error",
      });
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FAFAFA" }}>
        <ResponsiveAppBar />
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 12 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress sx={{ color: "#D1A362" }} size={48} />
            <Typography variant="body2" sx={{ color: "#666", letterSpacing: "0.05em" }}>
              Curating Couture Details...
            </Typography>
          </Stack>
        </Box>
        <Fotter />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FAFAFA" }}>
        <ResponsiveAppBar />
        <Box sx={{ flexGrow: 1, textAlign: "center", py: 10, px: 2 }}>
          <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 1.5, color: "#1A1817" }}>
            Garment Unavailable
          </Typography>
          <Typography variant="body1" sx={{ color: "#666", mb: 3 }}>
            The garment you are looking for may have been archived or is temporarily removed from the catalog.
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            sx={{ bgcolor: "#1A1817", color: "#D1A362", px: 4, py: 1 }}
          >
            Explore Active Collection
          </Button>
        </Box>
        <Fotter />
      </Box>
    );
  }

  // Imagery, pricing & availability calculations
  const rawImages = [product.image, ...(product.images || [])]
    .filter(Boolean)
    .map((img) => resolveProductImage({ ...product, image: img }, 1200));
  const images = Array.from(new Set(rawImages));
  if (images.length === 0) images.push(getCategoryFallbackImage(product.gender, product.category));

  const pricePerDay = Number(product.rentalPricePerDay || product.price) || 0;
  const deposit = Number(product.securityDeposit || product.advance) || 0;
  const totalRentalFee = pricePerDay * qty;
  const grandTotal = totalRentalFee + deposit;
  const minDate = new Date().toISOString().split("T")[0];

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
    : "5.0";

  // Category determination for breadcrumbs and size guide default
  const categoryLower = (product.category || "").toLowerCase();
  const isMen = categoryLower.includes("men") || categoryLower.includes("sherwani") || categoryLower.includes("kurta");
  const isJewellery = categoryLower.includes("jewel") || categoryLower.includes("necklace") || categoryLower.includes("bangle");
  const categoryPath = isMen ? "/m-dress" : isJewellery ? "/jewellery" : "/w-dress";
  const categoryName = isMen ? "Men's Royal Attire" : isJewellery ? "Temple & Fine Jewellery" : "Women's Couture";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#FAFAFA" }}>
      <ResponsiveAppBar />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          maxWidth: "1280px",
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, md: 3 },
          pb: { xs: 12, md: 6 }, // extra padding on mobile for sticky booking bar
        }}
      >
        {/* Editorial Breadcrumbs */}
        <Breadcrumbs
          separator={<ArrowForwardIosIcon sx={{ fontSize: 10, color: "#999" }} />}
          aria-label="garment navigation breadcrumbs"
          sx={{ mb: { xs: 2, md: 3 }, fontSize: "0.85rem" }}
        >
          <Link
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{ color: "#777", "&:hover": { color: "#1A1817" } }}
          >
            Home
          </Link>
          <Link
            component={RouterLink}
            to={categoryPath}
            underline="hover"
            sx={{ color: "#777", "&:hover": { color: "#1A1817" } }}
          >
            {categoryName}
          </Link>
          <Typography sx={{ color: "#1A1817", fontWeight: 600, fontSize: "0.85rem" }}>
            {product.title || product.name}
          </Typography>
        </Breadcrumbs>

        {/* 2-Column Product Showcase Grid */}
        <Grid container spacing={{ xs: 3, md: 5 }}>
          {/* LEFT COLUMN: Interactive Luxury Gallery */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: "sticky", top: 88 }}>
              {/* Main Image Viewport with Hover Zoom */}
              <Box
                ref={imageContainerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => setLightboxOpen(true)}
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: 380, sm: 480, md: 540 },
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: "#F7F5F2",
                  border: "1px solid #ECE7DE",
                  cursor: "zoom-in",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Standard Display Image */}
                <Box
                  component="img"
                  src={getOptimizedImageUrl(activeImage, 1000)}
                  alt={product.title || product.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    p: { xs: 1, sm: 2 },
                    transition: "transform 0.25s ease-out",
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCategoryFallbackImage(product.gender, product.category);
                  }}
                />

                {/* Desktop Zoom Overlay */}
                <Box
                  component="img"
                  src={getOptimizedImageUrl(activeImage, 1600)}
                  alt="Zoom lens magnification"
                  sx={{
                    display: { xs: "none", md: zoomStyle.display || "none" },
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: "scale(1.85)",
                    transformOrigin: zoomStyle.transformOrigin || "center center",
                    pointerEvents: "none",
                    bgcolor: "#F7F5F2",
                    zIndex: 2,
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getCategoryFallbackImage(product.gender, product.category);
                  }}
                />

                {/* Floating Action Buttons over Image */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    zIndex: 3,
                  }}
                >
                  <Tooltip title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}>
                    <IconButton
                      aria-label="save to wishlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist();
                      }}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(4px)",
                        color: isWishlisted ? "#D32F2F" : "#1A1817",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        "&:hover": { bgcolor: "#FFFFFF", transform: "scale(1.08)" },
                      }}
                    >
                      {isWishlisted ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Share Garment">
                    <IconButton
                      aria-label="share garment"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(4px)",
                        color: "#1A1817",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        "&:hover": { bgcolor: "#FFFFFF", transform: "scale(1.08)" },
                      }}
                    >
                      <ShareOutlinedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Expand Fullscreen View">
                    <IconButton
                      aria-label="expand image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxOpen(true);
                      }}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(4px)",
                        color: "#1A1817",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        "&:hover": { bgcolor: "#FFFFFF", transform: "scale(1.08)" },
                      }}
                    >
                      <ZoomInIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Boutique Listing Pill */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 14,
                    left: 14,
                    zIndex: 3,
                    bgcolor: "rgba(26,24,23,0.85)",
                    backdropFilter: "blur(6px)",
                    color: "#D1A362",
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                  }}
                >
                  <VerifiedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: "0.04em", fontSize: "0.72rem" }}>
                    CURATED BOUTIQUE LISTING
                  </Typography>
                </Box>
              </Box>

              {/* Gallery Thumbnails Carousel */}
              {images.length > 1 && (
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    mt: 2,
                    overflowX: "auto",
                    pb: 1,
                    "&::-webkit-scrollbar": { height: 4 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "#D1A362", borderRadius: 2 },
                  }}
                >
                  {images.map((img, idx) => {
                    const isSelected = activeImage === img;
                    return (
                      <Box
                        key={idx}
                        component="button"
                        type="button"
                        aria-label={`Select photo ${idx + 1}`}
                        onClick={() => setActiveImage(img)}
                        sx={{
                          flex: "0 0 auto",
                          width: { xs: 68, sm: 78 },
                          height: { xs: 68, sm: 78 },
                          p: 0,
                          border: isSelected ? "2px solid #D1A362" : "1px solid #ECE7DE",
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "#FFF",
                          cursor: "pointer",
                          outline: "none",
                          transition: "all 0.2s ease",
                          boxShadow: isSelected ? "0 0 0 2px rgba(209,163,98,0.25)" : "none",
                          "&:hover": { borderColor: "#D1A362" },
                        }}
                      >
                        <Box
                          component="img"
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getCategoryFallbackImage(product.gender, product.category);
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Grid>

          {/* RIGHT COLUMN: Garment Details & Booking Configuration */}
          <Grid item xs={12} md={6}>
            {/* Brand / Atelier Header */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                label={product.brand || "Exclusive Atelier"}
                size="small"
                sx={{
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  borderRadius: 1.5,
                }}
              />
              {product.condition && (
                <Chip
                  label={product.condition}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: "#D1A362",
                    color: "#8C6D3B",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    borderRadius: 1.5,
                  }}
                />
              )}
              {product.stock <= 0 ? (
                <Chip label="Reserved" size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />
              ) : (
                <Chip
                  label="Available for Booking"
                  size="small"
                  sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.72rem" }}
                />
              )}
            </Stack>

            {/* Garment Title */}
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                color: "#1A1817",
                lineHeight: 1.25,
                mb: 1.5,
              }}
            >
              {product.title || product.name}
            </Typography>

            {/* Rating & Verified Reviews Anchor */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Rating value={Number(avgRating)} readOnly precision={0.5} size="small" />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                {avgRating}
              </Typography>
              <Typography variant="body2" sx={{ color: "#777" }}>
                ({product.reviews?.length || 0} {product.reviews?.length === 1 ? "review" : "reviews"})
              </Typography>
            </Stack>

            {/* Price & Deposit Display */}
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                mb: 3,
                bgcolor: "#FFFFFF",
                border: "1px solid #ECE7DE",
                borderRadius: 2.5,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={1}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#888", display: "block", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                    Rental Tariff
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      ₹{pricePerDay.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                      / calendar day
                    </Typography>
                  </Stack>
                </Box>

                <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                  <Typography variant="caption" sx={{ color: "#888", display: "block", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                    Security Guarantee
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#2E7D32" }}>
                    ₹{deposit.toLocaleString()} <Typography component="span" variant="caption" sx={{ color: "#666" }}>(100% Refundable)</Typography>
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Description */}
            <Typography variant="body2" sx={{ color: "#4A4643", lineHeight: 1.7, mb: 3 }}>
              {product.description ||
                "Impeccably tailored designer ensemble crafted for weddings, grand receptions, and milestone celebrations. Featuring hand-embroidery, luxurious drape, and premium breathable lining."}
            </Typography>

            {/* Garment Specifications & Size Guide Launcher */}
            <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", border: "1px solid #ECE7DE", borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                  Garment Specifications & Sizing
                </Typography>
                <Button
                  size="small"
                  onClick={() => setSizeGuideOpen(true)}
                  startIcon={<StraightenIcon sx={{ fontSize: 16, color: "#D1A362" }} />}
                  sx={{
                    color: "#8C6D3B",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "none",
                    p: 0,
                    "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                  }}
                >
                  Size Guide & Measurements
                </Button>
              </Stack>

              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ bgcolor: "#FAFAFA", p: 1.2, borderRadius: 1.5, border: "1px solid #F0ECE4" }}>
                    <Typography variant="caption" sx={{ color: "#888", display: "block" }}>Size</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                      {product.size || "M (38)"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ bgcolor: "#FAFAFA", p: 1.2, borderRadius: 1.5, border: "1px solid #F0ECE4" }}>
                    <Typography variant="caption" sx={{ color: "#888", display: "block" }}>Occasion</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                      {product.occasion || "Wedding / Reception"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ bgcolor: "#FAFAFA", p: 1.2, borderRadius: 1.5, border: "1px solid #F0ECE4" }}>
                    <Typography variant="caption" sx={{ color: "#888", display: "block" }}>Color</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                      {product.color || "Artisan Palette"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ bgcolor: "#FAFAFA", p: 1.2, borderRadius: 1.5, border: "1px solid #F0ECE4" }}>
                    <Typography variant="caption" sx={{ color: "#888", display: "block" }}>Alterations</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1817" }}>
                      Check with Lender
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3, borderColor: "#ECE7DE" }} />

            {/* RENTAL RESERVATION ENGINE */}
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                border: "2px solid #ECE7DE",
                borderRadius: 3,
                p: { xs: 2.2, sm: 3 },
                mb: 3,
                boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <CalendarMonthIcon sx={{ color: "#D1A362" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                  Select Rental Duration & Event Dates
                </Typography>
              </Stack>

              {/* Quick Duration Preset Chips */}
              <Typography variant="caption" sx={{ color: "#777", display: "block", mb: 1, fontWeight: 600 }}>
                Popular Rental Packages:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap", gap: 0.5 }}>
                <Button
                  size="small"
                  variant={presetDuration === "3" ? "contained" : "outlined"}
                  onClick={() => applyPreset(3)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    bgcolor: presetDuration === "3" ? "#1A1817" : "transparent",
                    color: presetDuration === "3" ? "#D1A362" : "#1A1817",
                    borderColor: "#1A1817",
                    "&:hover": { bgcolor: "#1A1817", color: "#D1A362" },
                  }}
                >
                  3-Day Event (Standard)
                </Button>

                <Button
                  size="small"
                  variant={presetDuration === "7" ? "contained" : "outlined"}
                  onClick={() => applyPreset(7)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    bgcolor: presetDuration === "7" ? "#1A1817" : "transparent",
                    color: presetDuration === "7" ? "#D1A362" : "#1A1817",
                    borderColor: "#1A1817",
                    "&:hover": { bgcolor: "#1A1817", color: "#D1A362" },
                  }}
                >
                  7-Day Wedding Week (Extended)
                </Button>

                <Button
                  size="small"
                  variant={presetDuration === "custom" ? "contained" : "outlined"}
                  onClick={() => setPresetDuration("custom")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    bgcolor: presetDuration === "custom" ? "#1A1817" : "transparent",
                    color: presetDuration === "custom" ? "#D1A362" : "#1A1817",
                    borderColor: "#1A1817",
                    "&:hover": { bgcolor: "#1A1817", color: "#D1A362" },
                  }}
                >
                  Custom Dates
                </Button>
              </Stack>

              {/* Date Inputs */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 0.5, fontWeight: 600 }}>
                    Rental Start Date (Garment Arrives)
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={startDate}
                    inputProps={{ min: minDate }}
                    onChange={(e) => {
                      setPresetDuration("custom");
                      setStartDate(e.target.value);
                    }}
                    sx={{ bgcolor: "#FAFAFA" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 0.5, fontWeight: 600 }}>
                    Return Date (Courier Pickup)
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={endDate}
                    inputProps={{ min: startDate || minDate }}
                    onChange={(e) => {
                      setPresetDuration("custom");
                      setEndDate(e.target.value);
                    }}
                    sx={{ bgcolor: "#FAFAFA" }}
                  />
                </Grid>
              </Grid>

              {/* Real-time Conflict Alert */}
              {dateConflict ? (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  <strong>Dates Unavailable:</strong> The selected date window overlaps with an existing reservation. Please choose alternative dates.
                </Alert>
              ) : (
                <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ mb: 2, borderRadius: 2 }}>
                  <strong>Ready for Booking:</strong> Garment is available for all {qty} days.
                </Alert>
              )}

              {/* Itemized Price Breakdown */}
              <Box sx={{ borderTop: "1px dashed #D6CEC2", pt: 2, mt: 1 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Rental Fee (₹{pricePerDay.toLocaleString()} × {qty} {qty === 1 ? "day" : "days"}):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1817" }}>
                    ₹{totalRentalFee.toLocaleString()}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Refundable Security Deposit:
                    </Typography>
                    <Tooltip title="Refundable security guarantee. Reimbursed upon return check-in and condition assessment by the lender.">
                      <InfoOutlinedIcon sx={{ fontSize: 15, color: "#999", cursor: "pointer" }} />
                    </Tooltip>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#2E7D32" }}>
                    ₹{deposit.toLocaleString()}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Sanitization & Steam Pressing:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#2E7D32" }}>
                    FREE (Included)
                  </Typography>
                </Stack>

                <Divider sx={{ my: 1.5, borderColor: "#ECE7DE" }} />

                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      Total Due Today:
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#888", display: "block" }}>
                      Includes ₹{deposit.toLocaleString()} refundable deposit
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#D1A362" }}>
                    ₹{grandTotal.toLocaleString()}
                  </Typography>
                </Stack>
              </Box>

              {/* Desktop Booking CTA */}
              <Box sx={{ display: { xs: "none", md: "block" }, mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleRentClick}
                  disabled={product.stock <= 0 || dateConflict}
                  sx={{
                    py: 1.6,
                    background: "linear-gradient(45deg, #1A1817 30%, #3D352E 90%)",
                    color: "#D1A362",
                    fontWeight: 700,
                    fontSize: "1rem",
                    letterSpacing: "0.03em",
                    borderRadius: 2,
                    boxShadow: "0 8px 20px rgba(26,24,23,0.18)",
                    "&:hover": { background: "#1A1817", color: "#E0B77A" },
                    "&.Mui-disabled": { bgcolor: "#E0E0E0", color: "#9E9E9E" },
                  }}
                >
                  {product.stock <= 0
                    ? "Currently Rented Out"
                    : dateConflict
                    ? "Dates Reserved — Select Other Dates"
                    : `Reserve for ${qty} Days (₹${grandTotal.toLocaleString()})`}
                </Button>
              </Box>
            </Box>

            {/* Rental & Service Information */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "#FFFFFF",
                border: "1px solid #ECE7DE",
                borderRadius: 2.5,
                mb: 3,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817", mb: 2 }}>
                Rental & Service Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <LocalShippingOutlinedIcon sx={{ color: "#D1A362", fontSize: 22, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                        Estimated Delivery
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                        Targeted arrival 1 to 2 days prior to your rental start date based on dispatch logistics.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <AssignmentReturnOutlinedIcon sx={{ color: "#D1A362", fontSize: 22, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                        Coordinated Return
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                        Courier return pickup or drop-off arranged as coordinated with your rental order instructions.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <CleanHandsOutlinedIcon sx={{ color: "#D1A362", fontSize: 22, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                        Garment Preparation
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                        Inspected and steam pressed prior to dispatch for ready-to-wear presentation.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <SecurityOutlinedIcon sx={{ color: "#D1A362", fontSize: 22, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                        Security Deposit Assessment
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                        Deposit refund initiated to original payment source upon successful return check-in without damage.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Provenance & Moderation Flag */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              {product.externalUrl ? (
                <Stack direction="row" alignItems="center" spacing={0.8}>
                  <a
                    href={product.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#8C6D3B", fontWeight: 600, fontSize: "0.82rem", textDecoration: "none" }}
                  >
                    View Authentic Designer / Retail Page
                  </a>
                  <OpenInNewIcon sx={{ fontSize: 13, color: "#8C6D3B" }} />
                </Stack>
              ) : (
                <Box />
              )}

              <Button
                variant="text"
                size="small"
                startIcon={<FlagOutlinedIcon sx={{ fontSize: 15 }} />}
                onClick={handleOpenReport}
                sx={{
                  color: "#888",
                  fontSize: "0.75rem",
                  textTransform: "none",
                  "&:hover": { color: "#D32F2F" },
                }}
              >
                Report this listing
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* CUSTOMER REVIEWS SECTION */}
        <Box sx={{ mt: { xs: 6, md: 8 }, pt: 4, borderTop: "1px solid #ECE7DE" }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              color: "#1A1817",
              mb: 3,
            }}
          >
            Client Reviews & Occasion Experiences
          </Typography>

          <Grid container spacing={4}>
            {/* Reviews List */}
            <Grid item xs={12} md={7}>
              {product.reviews?.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: "#FFFFFF",
                    border: "1px dashed #ECE7DE",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ color: "#666", mb: 1 }}>
                    Be the first to share an occasion story for this garment.
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#999" }}>
                    Reviews submitted by community members and clients.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2.5}>
                  {product.reviews?.map((r, i) => (
                    <Paper
                      key={i}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        bgcolor: "#FFFFFF",
                        border: "1px solid #ECE7DE",
                        borderRadius: 2,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              bgcolor: "#1A1817",
                              color: "#D1A362",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            {(r.username || "V")[0].toUpperCase()}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                              {r.username}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#8C6D3B", fontWeight: 600 }}>
                              Client Review
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          {r.date ? new Date(r.date).toLocaleDateString() : "Recent Event"}
                        </Typography>
                      </Stack>
                      <Rating value={r.rating} readOnly size="small" sx={{ mb: 1 }} />
                      <Typography variant="body2" sx={{ color: "#444", lineHeight: 1.6 }}>
                        &ldquo;{r.comment}&rdquo;
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Grid>

            {/* Write a Review Box */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #ECE7DE",
                  borderRadius: 2.5,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A1817", mb: 1 }}>
                  Share Your Rental Experience
                </Typography>
                <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
                  Help future clients choose the perfect silhouette, size, and drape.
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#777", display: "block", mb: 0.5 }}>
                      Overall Rating
                    </Typography>
                    <Rating
                      value={newReview.rating}
                      onChange={(e, val) => setNewReview({ ...newReview, rating: val || 5 })}
                    />
                  </Box>

                  <TextField
                    label="Your Name or Moniker"
                    size="small"
                    fullWidth
                    value={newReview.username}
                    onChange={(e) => setNewReview({ ...newReview, username: e.target.value })}
                  />

                  <TextField
                    label="Your Review (Fit, Fabric, Compliments, Styling)"
                    multiline
                    rows={4}
                    fullWidth
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Tell us about how the garment looked, fit at your event, and any styling advice..."
                  />

                  <Button
                    variant="contained"
                    onClick={submitReview}
                    disabled={reviewSubmitting}
                    sx={{
                      bgcolor: "#1A1817",
                      color: "#D1A362",
                      fontWeight: 700,
                      py: 1,
                      "&:hover": { bgcolor: "#332F2C" },
                    }}
                  >
                    {reviewSubmitting ? <CircularProgress size={20} sx={{ color: "#D1A362" }} /> : "Submit Review"}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* SIMILAR ATELIER PIECES */}
        {similar.length > 0 && (
          <Box sx={{ mt: { xs: 6, md: 8 }, pt: 4, borderTop: "1px solid #ECE7DE" }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                color: "#1A1817",
                mb: 3,
              }}
            >
              Curated Recommendations: You May Also Love
            </Typography>
            <Box
              sx={{
                display: "flex",
                overflowX: "auto",
                gap: 2.5,
                pb: 2,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "#D1A362", borderRadius: 3 },
              }}
            >
              {similar.map((dress) => (
                <Box key={dress._id} sx={{ flex: "0 0 260px" }}>
                  <ProductCard dress={dress} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* RECENTLY VIEWED */}
        {recentlyViewed.length > 0 && (
          <Box sx={{ mt: { xs: 6, md: 8 }, pt: 4, borderTop: "1px solid #ECE7DE" }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                color: "#1A1817",
                mb: 3,
              }}
            >
              Recently Viewed Garments
            </Typography>
            <Box
              sx={{
                display: "flex",
                overflowX: "auto",
                gap: 2.5,
                pb: 2,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "#D1A362", borderRadius: 3 },
              }}
            >
              {recentlyViewed.map((dress) => (
                <Box key={dress._id} sx={{ flex: "0 0 260px" }}>
                  <ProductCard dress={dress} />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* MOBILE STICKY BOOKING CTA BAR */}
      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            bottom: "66px", // sits right above BottomNavBar (height: 66px)
            left: 0,
            right: 0,
            zIndex: 1000,
            bgcolor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid #ECE7DE",
            boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
            px: 2,
            py: 1.2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: "#888", display: "block", lineHeight: 1 }}>
                {qty} {qty === 1 ? "Day" : "Days"} Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817" }}>
                ₹{grandTotal.toLocaleString()}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleRentClick}
              disabled={product.stock <= 0 || dateConflict}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                px: 3.5,
                minHeight: 48, // accessible touch target
                borderRadius: 2,
                fontSize: "0.92rem",
                "&:hover": { bgcolor: "#2E2A27" },
                "&.Mui-disabled": { bgcolor: "#E0E0E0", color: "#9E9E9E" },
              }}
            >
              {product.stock <= 0 ? "Reserved" : dateConflict ? "Dates Taken" : "Reserve Now"}
            </Button>
          </Stack>
        </Box>
      )}

      {/* FULLSCREEN LIGHTBOX DIALOG */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0E0E0E",
            borderRadius: 3,
            p: 1,
            position: "relative",
          },
        }}
      >
        <IconButton
          aria-label="close lightbox"
          onClick={() => setLightboxOpen(false)}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "#FFFFFF",
            bgcolor: "rgba(255,255,255,0.15)",
            zIndex: 10,
            "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
          <Box
            component="img"
            src={getOptimizedImageUrl(activeImage, 1000)}
            alt={product.title || product.name}
            sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
          />
        </DialogContent>
      </Dialog>

      {/* SIZE GUIDE MODAL */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        defaultGender={isMen ? "men" : isJewellery ? "jewellery" : "women"}
      />

      {/* REPORT LISTING DIALOG */}
      <Dialog
        open={reportModal.open}
        onClose={() => !reportLoading && setReportModal({ ...reportModal, open: false })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", pb: 1 }}>
          Report Listing to Trust & Moderation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#666", mb: 2.5 }}>
            Help us keep Wardrobe Wonders authentic, transparent, and safe. Tell us why you are reporting this garment.
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="report-reason-label">Reason for Report</InputLabel>
              <Select
                labelId="report-reason-label"
                label="Reason for Report"
                value={reportModal.reason}
                onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
              >
                <MenuItem value="Copyright/IP">Copyright or Intellectual Property Infringement</MenuItem>
                <MenuItem value="Misleading listing">Misleading Listing or Inaccurate Description</MenuItem>
                <MenuItem value="Inappropriate content">Inappropriate or Prohibited Content</MenuItem>
                <MenuItem value="Fraud/suspicious activity">Fraud or Suspicious Provider Activity</MenuItem>
                <MenuItem value="Incorrect condition">Incorrect Garment Condition Rating</MenuItem>
                <MenuItem value="Other">Other Policy Concern</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              required
              label="Your Contact Email"
              type="email"
              placeholder="name@example.com"
              value={reportModal.reporterEmail}
              onChange={(e) => setReportModal({ ...reportModal, reporterEmail: e.target.value })}
              helperText="Required so our moderation team can verify and follow up if needed."
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Context & Specific Concerns (Optional)"
              placeholder="Describe any evidence, links, or specific discrepancies..."
              value={reportModal.details}
              onChange={(e) => setReportModal({ ...reportModal, details: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setReportModal({ ...reportModal, open: false })}
            disabled={reportLoading}
            sx={{ color: "#666" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReport}
            disabled={reportLoading}
            sx={{
              bgcolor: "#D32F2F",
              color: "#FFF",
              fontWeight: 700,
              "&:hover": { bgcolor: "#B71C1C" },
            }}
          >
            {reportLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Submit Report"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FEEDBACK SNACKBAR */}
      <Snackbar
        open={reportFeedback.open}
        autoHideDuration={5000}
        onClose={() => setReportFeedback({ ...reportFeedback, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={reportFeedback.severity}
          onClose={() => setReportFeedback({ ...reportFeedback, open: false })}
          sx={{ borderRadius: 2, boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}
        >
          {reportFeedback.message}
        </Alert>
      </Snackbar>

      <Fotter />
    </Box>
  );
};

export default ProductDetail;
