import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import SecurityIcon from '@mui/icons-material/Security';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState("");

  const [newReview, setNewReview] = useState({ rating: 5, comment: "", username: "" });

  // Step 14: Report Listing Dialog State
  const [reportModal, setReportModal] = useState({
    open: false,
    reason: "Misleading listing",
    details: "",
    reporterEmail: "",
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFeedback, setReportFeedback] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    setLoading(true);
    axios.get(`${BASE_URL}/products/detail/${id}`)
      .then(res => {
        const data = res.data;
        setProduct(data);
        setActiveImage(data.image);
        
        try {
          let recent = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
          recent = recent.filter(p => p._id !== data._id);
          recent.unshift(data);
          if (recent.length > 5) recent.pop();
          localStorage.setItem("recently_viewed", JSON.stringify(recent));
          setRecentlyViewed(recent.filter(p => p._id !== data._id));
        } catch(e) {}

        return axios.post(`${BASE_URL}/products/similar`, {
          product_id: data._id,
          product_name: data.name,
          product_category: data.category,
          product_description: data.description || ""
        });
      })
      .then(res => {
        setSimilar(res.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split("T")[0];
  });
  const [availability, setAvailability] = useState({ available: true, bookedDates: [] });
  const [dateConflict, setDateConflict] = useState(false);

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

    // Check conflict with bookedDates
    const hasConflict = (availability.bookedDates || []).some((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return s <= bEnd && bStart <= e;
    });
    setDateConflict(hasConflict);
  }, [startDate, endDate, availability]);

  const handleRentClick = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.email) return alert("Please Login to continue");
    if (dateConflict) return alert("Selected rental dates are not available.");
    if (qty < 1) return alert("Select at least 1 day rental");
    navigate(`/checkout/address/${product._id}`, {
      state: { qty, startDate, endDate, product },
    });
  };

  const submitReview = async () => {
    if (!newReview.comment || !newReview.username) return alert("Please fill out review");
    try {
      const res = await axios.post(`${BASE_URL}/products/${id}/review`, newReview);
      setProduct(res.data);
      setNewReview({ rating: 5, comment: "", username: "" });
      alert("Review submitted!");
    } catch (err) {
      console.error(err);
    }
  };

  // Step 14: Report Listing Handlers
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
          message: "Report submitted successfully. Our trust & safety team will review this listing within 24 hours.",
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

  if (loading) return <Box mt={10} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (!product) return <Typography mt={5} textAlign="center">Product not found</Typography>;

  const avgRating = product.reviews?.length 
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1) 
    : 0;

  const images = Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)));
  const pricePerDay = Number(product.rentalPricePerDay || product.price) || 0;
  const deposit = Number(product.securityDeposit || product.advance) || 0;
  const totalRentalFee = pricePerDay * qty;
  const grandTotal = totalRentalFee + deposit;
  const minDate = new Date().toISOString().split("T")[0];

  return (
    <>
      <ResponsiveAppBar />
      <Box p={4} maxWidth="1200px" margin="auto">
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Box sx={{ border: '1px solid #eee', borderRadius: 2, overflow: 'hidden', mb: 2, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={activeImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </Box>
            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
              {images.map((img, idx) => (
                <Box 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  sx={{ 
                    width: 80, height: 80, cursor: 'pointer', border: activeImage === img ? '2px solid #D1A362' : '1px solid #eee',
                    borderRadius: 1, overflow: 'hidden'
                  }}
                >
                  <img src={img} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" mb={1}>{product.title || product.name}</Typography>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Rating value={Number(avgRating)} readOnly precision={0.5} size="small" />
              <Typography variant="body2" color="text.secondary">({avgRating} / 5 from {product.reviews?.length || 0} reviews)</Typography>
            </Stack>

            <Typography variant="h5" color="primary" fontWeight="bold" mb={1}>
              ₹{pricePerDay.toLocaleString()} <Typography component="span" variant="body1" color="text.secondary">/ day</Typography>
            </Typography>
            <Typography variant="body2" mb={2} color="text.secondary">
              Refundable Security Deposit: ₹{deposit.toLocaleString()}
            </Typography>
            
            <Typography variant="body1" mb={3} color="text.secondary">
              {product.description || "An elegant choice for your special occasion."}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Step 8 Rental Date & Availability Selector */}
            <Box sx={{ bgcolor: "#faf7f2", border: "1px solid #f0e6d6", borderRadius: 2, p: 2.5, mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="#1A1817" mb={1.5}>
                Select Rental Dates
              </Typography>
              <Grid container spacing={2} mb={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Rental Start Date
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={startDate}
                    inputProps={{ min: minDate }}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Return Date
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={endDate}
                    inputProps={{ min: startDate || minDate }}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Grid>
              </Grid>

              {dateConflict ? (
                <Typography variant="caption" color="error" fontWeight="bold" display="block" mb={1}>
                  ⚠️ Selected dates are reserved or invalid. Please select another date window.
                </Typography>
              ) : (
                <Box sx={{ borderTop: "1px dashed #e0d5c1", pt: 1.5, mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Rental Duration:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {qty} {qty === 1 ? "Day" : "Days"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Rental Fee (₹{pricePerDay} × {qty} days):
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{totalRentalFee.toLocaleString()}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Refundable Deposit:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{deposit.toLocaleString()}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Total to Pay:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold" color="#D1A362">
                      ₹{grandTotal.toLocaleString()}
                    </Typography>
                  </Stack>
                </Box>
              )}

              <Button 
                variant="contained" 
                size="large" 
                fullWidth
                onClick={handleRentClick}
                disabled={product.stock <= 0 || dateConflict}
                sx={{ 
                  mt: 2,
                  background: 'linear-gradient(45deg, #1A1817 30%, #3D352E 90%)',
                  color: '#D1A362',
                  fontWeight: 600,
                  '&:hover': { background: '#1A1817' }
                }}
              >
                {product.stock <= 0 ? "Out of Stock" : dateConflict ? "Dates Unavailable" : `Reserve for ${qty} Days (₹${grandTotal.toLocaleString()})`}
              </Button>
            </Box>

            <Stack spacing={2} sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <LocalShippingIcon color="primary" />
                <Typography variant="body2">Delivery in 2 days</Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <AssignmentReturnIcon color="primary" />
                <Typography variant="body2">Free Returns within 24 hours of delivery</Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <SecurityIcon color="primary" />
                <Typography variant="body2">Secure Payment & Quality Guarantee</Typography>
              </Stack>
            </Stack>

            {/* Step 14: Safe Designer Provenance Reference */}
            {product.externalUrl && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#FDFBF7", borderRadius: 2, border: "1px solid #F0E6D6" }}>
                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} mb={0.5}>
                  AUTHENTIC DESIGNER PROVENANCE
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <a
                    href={product.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#8C6D3B", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" }}
                  >
                    View Official Designer / Retail Page
                  </a>
                  <OpenInNewIcon sx={{ fontSize: 14, color: "#8C6D3B" }} />
                </Stack>
              </Box>
            )}

            {/* Step 14: Report Listing Button */}
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="text"
                size="small"
                startIcon={<FlagOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={handleOpenReport}
                sx={{ color: "#888", fontSize: "0.75rem", textTransform: "none", "&:hover": { color: "#d32f2f" } }}
              >
                Report this listing
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Box mt={8}>
          <Typography variant="h5" fontWeight="bold" mb={3}>You May Also Like</Typography>
          <Box display="flex" flexWrap="wrap">
            {similar.map(dress => <ProductCard key={dress._id} dress={dress} />)}
            {similar.length === 0 && <Typography>No similar products found.</Typography>}
          </Box>
        </Box>

        {recentlyViewed.length > 0 && (
          <Box mt={6}>
            <Typography variant="h5" fontWeight="bold" mb={3}>Recently Viewed</Typography>
            <Box display="flex" flexWrap="wrap">
              {recentlyViewed.map(dress => <ProductCard key={dress._id} dress={dress} />)}
            </Box>
          </Box>
        )}

        <Box mt={8}>
          <Typography variant="h5" fontWeight="bold" mb={3}>Customer Reviews</Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {product.reviews?.length === 0 && <Typography>No reviews yet.</Typography>}
                {product.reviews?.map((r, i) => (
                  <Box key={i} sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography fontWeight="bold">{r.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(r.date).toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Rating value={r.rating} readOnly size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2">{r.comment}</Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ bgcolor: '#f9f9f9', p: 3, borderRadius: 2 }}>
                <Typography variant="h6" mb={2}>Write a Review</Typography>
                <Stack spacing={2}>
                  <Rating value={newReview.rating} onChange={(e, val) => setNewReview({...newReview, rating: val})} />
                  <TextField label="Name" size="small" value={newReview.username} onChange={e => setNewReview({...newReview, username: e.target.value})} />
                  <TextField label="Review" multiline rows={3} value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} />
                  <Button variant="contained" onClick={submitReview}>Submit Review</Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Step 14: Report Listing Dialog */}
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
            <Typography variant="body2" color="text.secondary" mb={2.5}>
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

        {/* Feedback Snackbar */}
        <Snackbar
          open={reportFeedback.open}
          autoHideDuration={6000}
          onClose={() => setReportFeedback({ ...reportFeedback, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={reportFeedback.severity}
            onClose={() => setReportFeedback({ ...reportFeedback, open: false })}
            sx={{ borderRadius: 2, boxShadow: 3 }}
          >
            {reportFeedback.message}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default ProductDetail;
