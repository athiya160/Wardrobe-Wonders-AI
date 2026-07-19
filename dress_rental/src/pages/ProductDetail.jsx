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

  const handleRentClick = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.email) return alert("Please Login to continue");
    if (qty < 1) return alert("Select at least 1 day");
    navigate(`/checkout/address/${product._id}`, { state: { qty, product } });
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

  const images = [product.image, ...(product.images || [])].filter(Boolean);

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
                    width: 80, height: 80, cursor: 'pointer', border: activeImage === img ? '2px solid #FE6B8B' : '1px solid #eee',
                    borderRadius: 1, overflow: 'hidden'
                  }}
                >
                  <img src={img} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" mb={1}>{product.name}</Typography>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Rating value={Number(avgRating)} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary">
                {avgRating} ({product.reviews?.length || 0} reviews)
              </Typography>
            </Stack>

            <Typography variant="h5" color="primary" fontWeight="bold" mb={2}>
              ₹{product.price} / day
            </Typography>
            <Typography variant="body1" mb={3} color="text.secondary">
              Advance: ₹{product.advance}
            </Typography>
            
            <Typography variant="body1" mb={4}>
              {product.description || "An elegant choice for your special occasion."}
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Stack spacing={2} mb={4} sx={{ maxWidth: 300 }}>
              <Typography variant="subtitle2" fontWeight="bold">Rental Duration (Days)</Typography>
              <TextField
                type="number"
                size="small"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputProps={{ min: 1, max: 30 }}
              />
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleRentClick}
                disabled={product.stock <= 0}
                sx={{ background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', color: 'white' }}
              >
                {product.stock > 0 ? "Rent Now" : "Out of Stock"}
              </Button>
            </Stack>

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
