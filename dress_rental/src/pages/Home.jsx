import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Divider,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import HeroBanner from "../components/HeroBanner";
import FeaturesStrip from "../components/FeaturesStrip";
import HowItWorksSection from "../components/HowItWorksSection";
import CategorySection from "../components/CategorySection";
import ProductCard from "../components/ProductCard";
import StoreProductCard from "../components/store/StoreProductCard";
import AIFeatureBanner from "../components/AIFeatureBanner";
import PressAndTestimonialSection from "../components/PressAndTestimonialSection";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedIcon from "@mui/icons-material/Verified";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { useNavigate } from "react-router-dom";

const ScrollableRow = styled(Box)({
  display: "flex",
  overflowX: "auto",
  paddingBottom: "24px",
  paddingTop: "12px",
  gap: "24px",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  msOverflowStyle: "none",
  scrollbarWidth: "none",
});

const SectionHeader = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: "36px",
});

const ElegantTitle = ({ overline, title, subtitle }) => (
  <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
    {overline && (
      <Typography
        variant="overline"
        sx={{
          color: "#A07028",
          fontWeight: 800,
          letterSpacing: "0.18em",
          fontSize: "0.78rem",
          mb: 0.5,
        }}
      >
        {overline}
      </Typography>
    )}
    <Typography
      variant="h3"
      sx={{
        fontFamily: '"Playfair Display", "Georgia", serif',
        fontWeight: 600,
        color: "#1A1817",
        letterSpacing: "-0.02em",
        fontSize: { xs: "1.9rem", md: "2.4rem" },
      }}
    >
      {title}
    </Typography>
    <Box display="flex" alignItems="center" gap={1.2} mt={1.5} mb={subtitle ? 1.5 : 0}>
      <Box sx={{ width: 32, height: 1, backgroundColor: "#D1A362" }} />
      <Box sx={{ width: 6, height: 6, transform: "rotate(45deg)", backgroundColor: "#D1A362" }} />
      <Box sx={{ width: 32, height: 1, backgroundColor: "#D1A362" }} />
    </Box>
    {subtitle && (
      <Typography variant="body2" sx={{ color: "#666", maxWidth: 560, fontSize: "0.95rem" }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

const StyledTabs = styled(Tabs)({
  marginTop: "20px",
  "& .MuiTabs-indicator": {
    backgroundColor: "#D1A362",
    height: "3px",
    borderRadius: "2px",
  },
});

const StyledTab = styled(Tab)({
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.95rem",
  color: "#777777",
  minWidth: "auto",
  margin: "0 14px",
  padding: "8px 12px",
  "&.Mui-selected": {
    color: "#1A1817",
  },
});

// Curated fallbacks with unique, non-duplicating products and appropriate imagery
const defaultCollections = {
  recommended: [
    {
      _id: "jewel_01",
      name: "Padmavati 1-Gram Gold Lakshmi Temple Nakshi Bridal Set",
      price: 2400,
      advance: 4000,
      image: "/assets/Jewellery/image_20261019_002031.jpg",
      category: "Jewellery",
      gender: "jewellery",
    },
    {
      _id: "jewel_02",
      name: "Kempu Ratna 1-Gram Gold Lakshmi Bridal Haram & Jhumka Set",
      price: 2800,
      advance: 4500,
      image: "/assets/Jewellery/image_20261019_002033.jpg",
      category: "Jewellery",
      gender: "jewellery",
    },
    {
      _id: "jewel_03",
      name: "Aura Rose Gold American Diamond (AD) Bridal Choker Set",
      price: 1600,
      advance: 3000,
      image: "/assets/Jewellery/image_20261019_002857.jpg",
      category: "Jewellery",
      gender: "jewellery",
    },
    {
      _id: "6aa94b47b6771fe766b90fab",
      name: "Regal Crimson Bridal Lehenga",
      price: 14000,
      advance: 3000,
      image: "/assets/Women/bridal_01.png",
      category: "Wedding",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fac",
      name: "Royal Gold Embroidered Lehenga",
      price: 15500,
      advance: 3500,
      image: "/assets/Women/bridal_02.png",
      category: "Wedding",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fad",
      name: "Ivory Rose Reception Gown",
      price: 9800,
      advance: 2500,
      image: "/assets/Women/bridal_03.png",
      category: "Evening Wear",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fb5",
      name: "Classic Midnight Black Tuxedo",
      price: 3800,
      advance: 1000,
      image: "/assets/Men/suit_01.png",
      category: "Formal",
      gender: "men",
    },
    {
      _id: "6aa94b47b6771fe766b90fb6",
      name: "Royal Ivory Embroidered Sherwani with Stole",
      price: 6500,
      advance: 1500,
      image: "/assets/Men/sherwani_01.png",
      category: "Wedding",
      gender: "men",
    },
    {
      _id: "6aa94b47b6771fe766b90fb7",
      name: "Midnight Blue Velvet Bandhgala Suit",
      price: 3600,
      advance: 900,
      image: "/assets/Men/suit_02.png",
      category: "Formal",
      gender: "men",
    },
  ],
  trending: [
    {
      _id: "6aa94b47b6771fe766b90faf",
      name: "Emerald Green Embroidered Bridal Lehenga",
      price: 15800,
      advance: 3500,
      image: "/assets/Women/bridal_05.png",
      category: "Wedding",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fb1",
      name: "Lavender Lilac Zari Bridal Lehenga",
      price: 14200,
      advance: 3200,
      image: "/assets/Women/bridal_07.png",
      category: "Wedding",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fae",
      name: "Ivory Gold Reception Lehenga",
      price: 12500,
      advance: 3000,
      image: "/assets/Women/bridal_04.png",
      category: "Wedding",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fb8",
      name: "Imperial Raw Silk Groom Sherwani",
      price: 8500,
      advance: 2000,
      image: "/assets/Men/sherwani_01.png",
      category: "Wedding",
      gender: "men",
    },
    {
      _id: "jewel_04",
      name: "Imperial Kundan & Jadau Royal 7-Piece Bridal Set",
      price: 3200,
      advance: 5000,
      image: "/assets/Jewellery/image_20261019_002035.jpg",
      category: "Jewellery",
      gender: "jewellery",
    },
  ],
  ai_picks: [
    {
      product: {
        _id: "6aa94b47b6771fe766b90fa7",
        name: "Crimson Red Banarasi Silk Saree",
        price: 3400,
        advance: 800,
        image: "/assets/Women/festive_01.png",
        category: "Traditional",
        gender: "women",
      },
    },
    {
      product: {
        _id: "6aa94b47b6771fe766b90fa8",
        name: "Gold Resham Hand-Woven Sherwani",
        price: 9800,
        advance: 2200,
        image: "/assets/Men/sherwani_02.png",
        category: "Wedding",
        gender: "men",
      },
    },
    {
      product: {
        _id: "jewel_07",
        name: "Celeste Zirconia & Rhodium Solitaire Waterfall Necklace Set",
        price: 1800,
        advance: 3200,
        image: "/assets/Jewellery/image_20261019_002859.jpg",
        category: "Jewellery",
        gender: "jewellery",
      },
    },
  ],
};

const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(defaultCollections);
  const [newArrivalsTab, setNewArrivalsTab] = useState("all");

  // Store Products State
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeLoading, setStoreLoading] = useState(true);

  useEffect(() => {
    let recentSearches = [];
    try {
      recentSearches = JSON.parse(localStorage.getItem("recent_searches") || "[]");
    } catch (e) {
      void e;
    }

    // Fetch personalized home catalog
    axios
      .post(`${BASE_URL}/products/personalized-home`, { recent_searches: recentSearches })
      .then((res) => {
        if (res.data) {
          setData({
            recommended:
              res.data.recommended?.length > 0
                ? res.data.recommended
                : defaultCollections.recommended,
            trending:
              res.data.trending?.length > 0 ? res.data.trending : defaultCollections.trending,
            ai_picks:
              res.data.ai_picks?.length > 0 ? res.data.ai_picks : defaultCollections.ai_picks,
          });
        }
      })
      .catch((err) => {
        console.warn("Personalized home endpoint offline; serving curated default catalog.", err);
      });

    // Fetch real Store products for the Buy section (strictly approved & in-stock from active stores)
    axios
      .get(`${BASE_URL}/store/products?limit=8&inStock=true`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.products)) {
          setStoreProducts(res.data.products);
        }
      })
      .catch(() => {
        setStoreProducts([]);
      })
      .finally(() => {
        setStoreLoading(false);
      });
  }, []);

  const handleTabChange = (event, newValue) => {
    setNewArrivalsTab(newValue);
  };

  const filteredNewArrivals = data.recommended.filter((dress) => {
    if (newArrivalsTab === "all") return true;
    if (newArrivalsTab === "jewellery") {
      return (
        dress.gender?.toLowerCase() === "jewellery" ||
        (dress.category || "").toLowerCase().includes("jewel")
      );
    }
    return dress.gender?.toLowerCase() === newArrivalsTab;
  });

  return (
    <Box sx={{ backgroundColor: "#FAF8F5", minHeight: "100vh" }}>
      {/* 1. Global Navigation Bar */}
      <ResponsiveAppBar />

      {/* 2. Haute Couture Editorial Hero Banner */}
      <HeroBanner />

      {/* 3. PROMINENT RENT VS BUY SELECTION EXPERIENCE */}
      <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 6 }, mb: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3.5 }}>
          <Typography
            variant="overline"
            sx={{
              color: "#A07028",
              fontWeight: 800,
              letterSpacing: "0.18em",
              fontSize: "0.82rem",
            }}
          >
            DISCOVER YOUR SHOPPING EXPERIENCE
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              color: "#1A1817",
              letterSpacing: "-0.01em",
            }}
          >
            Rent Couture or Buy to Keep
          </Typography>
          <Typography variant="body2" sx={{ color: "#6E685F", mt: 0.8, maxWidth: 600, mx: "auto" }}>
            Choose between verified multi-day luxury rentals with refundable deposits, or permanent purchases from authenticated boutique storefronts across India.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Card 1: RENT COUTURE */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                height: "100%",
                borderRadius: 3.5,
                backgroundColor: "#FFFFFF",
                border: "1.5px solid #ECE7DE",
                boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#1A1817",
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <Chip
                    icon={<CheckroomIcon sx={{ fontSize: 16, color: "#FFFFFF !important" }} />}
                    label="RENTAL MARKETPLACE"
                    size="small"
                    sx={{
                      backgroundColor: "#1A1817",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      letterSpacing: "0.06em",
                    }}
                  />
                  <Chip
                    icon={<ShieldOutlinedIcon sx={{ fontSize: 14, color: "#9C7238 !important" }} />}
                    label="Refundable Deposit Protection"
                    size="small"
                    sx={{
                      backgroundColor: "rgba(209, 163, 98, 0.12)",
                      color: "#9C7238",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                    }}
                  />
                </Stack>

                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    color: "#1A1817",
                    mb: 1.2,
                  }}
                >
                  Haute Couture & Bridal Jewellery Rentals
                </Typography>

                <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6, mb: 3 }}>
                  Borrow authenticated designer lehengas, bespoke tuxedos, and 1-gram gold temple jewellery sets for 3 or 7 days. Complete with sanitized doorstep delivery, size verification, and guaranteed deposit return.
                </Typography>

                <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} mb={3}>
                  <Chip label="• 3-Day & 7-Day Booking Slots" size="small" sx={{ bgcolor: "#FAF8F5", color: "#555" }} />
                  <Chip label="• Free Dry Cleaning & Sanitization" size="small" sx={{ bgcolor: "#FAF8F5", color: "#555" }} />
                  <Chip label="• Refundable Security Deposit Protocol" size="small" sx={{ bgcolor: "#FAF8F5", color: "#555" }} />
                </Stack>
              </Box>

              <Button
                variant="contained"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/w-dress")}
                sx={{
                  py: 1.4,
                  bgcolor: "#1A1817",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  letterSpacing: "0.04em",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#2C2825" },
                }}
              >
                EXPLORE RENTAL COLLECTION
              </Button>
            </Card>
          </Grid>

          {/* Card 2: BUY / STORE */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                height: "100%",
                borderRadius: 3.5,
                backgroundColor: "#FFFFFF",
                border: "1.5px solid rgba(209, 163, 98, 0.4)",
                boxShadow: "0 6px 24px rgba(209, 163, 98, 0.08)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#9C7238",
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 32px rgba(209, 163, 98, 0.16)",
                },
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <Chip
                    icon={<StorefrontIcon sx={{ fontSize: 16, color: "#1A1817 !important" }} />}
                    label="BUY / STORE MARKETPLACE"
                    size="small"
                    sx={{
                      backgroundColor: "#D1A362",
                      color: "#1A1817",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      letterSpacing: "0.06em",
                    }}
                  />
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: 14, color: "#2E7D32 !important" }} />}
                    label="Verified Boutiques"
                    size="small"
                    sx={{
                      backgroundColor: "rgba(46, 125, 50, 0.08)",
                      color: "#2E7D32",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                    }}
                  />
                </Stack>

                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    color: "#1A1817",
                    mb: 1.2,
                  }}
                >
                  Shop Verified Boutiques & Pre-loved Designers
                </Typography>

                <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6, mb: 3 }}>
                  Purchase brand-new handcrafted designer wear and certified pre-loved luxury couture directly from independent Indian ateliers. Includes multi-seller checkout, real-time courier tracking, and buyer guarantee.
                </Typography>

                <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} mb={3}>
                  <Chip label="• Permanent Ownership" size="small" sx={{ bgcolor: "#FAF8F5", color: "#555" }} />
                  <Chip label="• Brand New & Pre-loved Outfits" size="small" sx={{ bgcolor: "#FAF8F5", color: "#555" }} />
                  <Chip label="• Direct Seller Storefronts" size="small" sx={{ bgcolor: "#FAF8F5", color: "#555" }} />
                </Stack>
              </Box>

              <Button
                variant="contained"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/store")}
                sx={{
                  py: 1.4,
                  bgcolor: "#9C7238",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  letterSpacing: "0.04em",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#855E2B" },
                }}
              >
                SHOP BOUTIQUE STORE
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* 4. Core Feature Promises Strip */}
      <FeaturesStrip />

      {/* 5. 4-Step Circular Rental Experience */}
      <HowItWorksSection />

      {/* 6. Curated Occasion & Category Departments */}
      <CategorySection />

      {/* 7. Main Interactive Rental Catalog Showcase */}
      <Container maxWidth="xl" sx={{ mt: 8, mb: 10 }}>
        <Stack spacing={10}>
          {/* New Arrivals Rental Section */}
          <Box>
            <SectionHeader>
              <ElegantTitle
                overline="RENT FOR YOUR SPECIAL OCCASION"
                title="Curated Rental New Arrivals"
                subtitle="Hand-inspected designer additions refreshed weekly from India's premier fashion ateliers."
              />
              <StyledTabs value={newArrivalsTab} onChange={handleTabChange} centered>
                <StyledTab label="All Collections" value="all" />
                <StyledTab label="Bridal Jewellery" value="jewellery" />
                <StyledTab label="Women's Couture" value="women" />
                <StyledTab label="Men's Tailoring" value="men" />
              </StyledTabs>
            </SectionHeader>

            <ScrollableRow>
              {filteredNewArrivals.map((dress, index) => (
                <ProductCard key={`rec-${dress._id || index}`} dress={dress} />
              ))}
            </ScrollableRow>

            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => {
                  if (newArrivalsTab === "men") navigate("/m-dress");
                  else if (newArrivalsTab === "jewellery") navigate("/jewellery");
                  else navigate("/w-dress");
                }}
                sx={{
                  borderColor: "#1A1817",
                  color: "#1A1817",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  px: 3.5,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#1A1817",
                    color: "#FFFFFF",
                    borderColor: "#1A1817",
                  },
                }}
              >
                {newArrivalsTab === "men"
                  ? "View Full Men's Catalog"
                  : newArrivalsTab === "jewellery"
                  ? "Explore All Bridal Jewellery (50+ Sets)"
                  : "View Full Women's Catalog"}
              </Button>
            </Box>
          </Box>

          {/* 8. Dedicated Storefront Showcase (Buy & Own) */}
          <Box
            sx={{
              p: { xs: 2.5, sm: 4, md: 5 },
              bgcolor: "#FFFFFF",
              borderRadius: 3.5,
              border: "1px solid #ECE7DE",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={2}
              mb={4}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Chip
                    label="BUY / STORE"
                    size="small"
                    sx={{ bgcolor: "#9C7238", color: "#FFF", fontWeight: 800, fontSize: "0.68rem" }}
                  />
                  <Typography variant="overline" sx={{ color: "#8C6D37", fontWeight: 700, letterSpacing: "0.08em" }}>
                    PURCHASE DIRECTLY FROM VERIFIED ATELIERS
                  </Typography>
                </Stack>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    color: "#1A1817",
                  }}
                >
                  Featured Store & Boutique Products
                </Typography>
              </Box>

              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/store")}
                sx={{
                  borderColor: "#9C7238",
                  color: "#9C7238",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2.5,
                  "&:hover": { bgcolor: "rgba(156, 114, 56, 0.08)", borderColor: "#9C7238" },
                }}
              >
                Browse All Store Products
              </Button>
            </Box>

            {storeLoading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress sx={{ color: "#9C7238" }} />
              </Box>
            ) : storeProducts.length > 0 ? (
              <Grid container spacing={3}>
                {storeProducts.map((prod) => (
                  <Grid item xs={12} sm={6} md={3} key={prod._id}>
                    <StoreProductCard product={prod} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  backgroundColor: "#FAF8F5",
                  borderRadius: 2.5,
                  border: "1px dashed #DDD",
                }}
              >
                <StorefrontIcon sx={{ fontSize: 48, color: "#9C7238", opacity: 0.8, mb: 1.5 }} />
                <Typography variant="h6" fontWeight={700} color="#1A1817" gutterBottom>
                  Curating Verified Boutique Partners
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: "auto", mb: 2.5 }}>
                  Independent designers and boutique partners are currently being authenticated. Have a fashion label or pre-loved couture wardrobe? Apply to become a verified seller.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/store/become-seller")}
                  sx={{
                    bgcolor: "#1A1817",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  Apply to Sell on Store
                </Button>
              </Box>
            )}
          </Box>

          {/* 9. Interactive Groq LLM AI Stylist Feature Banner */}
          <AIFeatureBanner />

          {/* Trending Collections Section */}
          {data.trending && data.trending.length > 0 && (
            <Box>
              <SectionHeader>
                <ElegantTitle
                  overline="MOST REQUESTED THIS WEDDING SEASON"
                  title="Trending Gala & Soirée Looks"
                  subtitle="The most coveted silhouettes reserved across Delhi, Mumbai, and Bangalore this week."
                />
              </SectionHeader>

              <ScrollableRow>
                {data.trending.map((dress, index) => (
                  <ProductCard key={`trend-${dress._id || index}`} dress={dress} />
                ))}
              </ScrollableRow>
            </Box>
          )}

          {/* AI Tailored Curations Section */}
          {data.ai_picks && data.ai_picks.length > 0 && (
            <Box>
              <SectionHeader>
                <ElegantTitle
                  overline="ALGORITHMIC STYLING"
                  title="Tailored For You"
                  subtitle="Intelligent suggestions curated based on regional seasonal trends and luxury rental demand."
                />
              </SectionHeader>

              <ScrollableRow>
                {data.ai_picks.map((item, index) => (
                  <ProductCard
                    key={`ai-${item.product?._id || index}`}
                    dress={item.product || item}
                  />
                ))}
              </ScrollableRow>
            </Box>
          )}
        </Stack>
      </Container>

      {/* 10. Press Strip & Verified Community Testimonials */}
      <PressAndTestimonialSection />

      {/* 11. Global Luxury Footer */}
      <Fotter />
    </Box>
  );
};

export default Home;
