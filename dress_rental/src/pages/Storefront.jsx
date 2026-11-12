import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Avatar,
  Stack,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  CheckCircle as VerifiedIcon,
  LocationOnOutlined as LocationIcon,
  LocalShippingOutlined as ShippingIcon,
  LanguageOutlined as WebsiteIcon,
  Instagram as InstagramIcon,
  Refresh as RefreshIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import StoreProductCard from "../components/store/StoreProductCard";

export default function Storefront() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conditionFilter, setConditionFilter] = useState("all");

  const fetchStorefront = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/store/storefront/${slug}`);
      if (res.data?.success && res.data.store) {
        setStore(res.data.store);
        setProducts(res.data.products || []);
      } else {
        setError("Storefront not found or inactive.");
      }
    } catch (err) {
      console.error("Fetch storefront error:", err);
      setError(err.response?.data?.message || "Failed to load storefront.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefront();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Loading boutique storefront...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (error || !store) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 1 }}>
              Storefront Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              {error || "This store may be suspended or does not exist."}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/store")}
              sx={{ bgcolor: "#1A1817", color: "#D1A362", textTransform: "none" }}
            >
              Back to Store
            </Button>
          </Paper>
        </Container>
        <Fotter />
      </Box>
    );
  }

  const filteredProducts = products.filter((p) => {
    if (conditionFilter === "all") return true;
    return p.condition === conditionFilter;
  });

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", color: "#1A1817" }}>
      <ResponsiveAppBar />

      {/* Store Banner */}
      <Box
        sx={{
          height: { xs: 160, sm: 220, md: 280 },
          bgcolor: "#2C2825",
          backgroundImage: store.banner ? `url(${store.banner})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.45)",
          }}
        />
      </Box>

      {/* Store Identity Header Card */}
      <Container maxWidth="xl" sx={{ mt: -7, position: "relative", zIndex: 2, mb: 6 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: "1px solid #ECE7DE",
            bgcolor: "#FFFFFF",
            boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm="auto">
              <Avatar
                src={store.logo}
                sx={{
                  width: { xs: 80, sm: 100 },
                  height: { xs: 80, sm: 100 },
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 800,
                  fontSize: "2.2rem",
                  border: "4px solid #FFFFFF",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {store.storeName ? store.storeName[0].toUpperCase() : "S"}
              </Avatar>
            </Grid>

            <Grid item xs={12} sm>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 800,
                    color: "#1A1817",
                  }}
                >
                  {store.storeName}
                </Typography>
                <VerifiedIcon sx={{ color: "#D1A362", fontSize: 24 }} />
                <Chip
                  label={store.storeType?.replace("_", " ")}
                  size="small"
                  sx={{
                    bgcolor: "#FAF8F5",
                    color: "#A07028",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    border: "1px solid #ECE7DE",
                  }}
                />
              </Stack>

              <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 680, mb: 1.5 }}>
                {store.description || "Independent multi-vendor partner with verified authentic collections."}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ color: "text.secondary" }}>
                {store.location?.city && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationIcon sx={{ fontSize: 16, color: "#D1A362" }} />
                    <Typography variant="caption">
                      {store.location.city}, {store.location.state || "India"}
                    </Typography>
                  </Stack>
                )}

                {store.contact?.website && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <WebsiteIcon sx={{ fontSize: 16, color: "#D1A362" }} />
                    <Link
                      href={store.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      color="inherit"
                    >
                      Website
                    </Link>
                  </Stack>
                )}

                {store.contact?.instagram && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <InstagramIcon sx={{ fontSize: 16, color: "#D1A362" }} />
                    <Typography variant="caption">{store.contact.instagram}</Typography>
                  </Stack>
                )}

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ShippingIcon sx={{ fontSize: 16, color: "#D1A362" }} />
                  <Typography variant="caption">
                    Ships in {store.shippingPolicy?.estimatedDaysMin || 2}–{store.shippingPolicy?.estimatedDaysMax || 3} days
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Catalog & Filter Section */}
      <Container maxWidth="xl" sx={{ pb: 10 }}>
        {/* Filter Bar */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>
              Store Catalog ({filteredProducts.length})
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Every listing is verified and dispatched directly by {store.storeName}.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            {["all", "NEW", "PRE_OWNED"].map((cond) => (
              <Chip
                key={cond}
                label={cond === "all" ? "All Items" : cond === "NEW" ? "Brand New" : "Pre-loved"}
                clickable
                onClick={() => setConditionFilter(cond)}
                sx={{
                  bgcolor: conditionFilter === cond ? "#1A1817" : "#FFFFFF",
                  color: conditionFilter === cond ? "#FFFFFF" : "#555555",
                  border: conditionFilter === cond ? "1px solid #1A1817" : "1px solid #ECE7DE",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                }}
              />
            ))}
          </Stack>
        </Stack>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <StoreIcon sx={{ fontSize: 48, color: "#D1A362", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              No items matching this condition.
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This storefront currently has no active listings under the selected filter.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredProducts.map((prod) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={prod._id}>
                <StoreProductCard product={{ ...prod, storeId: store }} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Fotter />
    </Box>
  );
}
