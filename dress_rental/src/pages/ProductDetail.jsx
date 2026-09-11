import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Button, CircularProgress, TextField, Rating, Grid, Divider } from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import SecurityIcon from '@mui/icons-material/Security';
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
    } catch (e) {
      console.error(e);
      alert("Failed to add review");
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

      </Box>
    </>
  );
};

export default ProductDetail;
