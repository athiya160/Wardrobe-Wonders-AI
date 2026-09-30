import React, { useEffect, useState } from "react";
import { Box, Typography, Container, Tabs, Tab, Button, Stack, Chip } from "@mui/material";
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
import AIFeatureBanner from "../components/AIFeatureBanner";
import PressAndTestimonialSection from "../components/PressAndTestimonialSection";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
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

// Curated fallbacks to guarantee zero blank screens during API cold start
const defaultCollections = {
  recommended: [
    {
      _id: "6aa94b47b6771fe766b90fab",
      name: "Regal Crimson Bridal Lehenga",
      price: 14000,
      advance: 3000,
      image: "/assets/Women/bridal_01.png",
      category: "Bridal Couture",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fac",
      name: "Royal Gold Embroidered Lehenga",
      price: 15500,
      advance: 3500,
      image: "/assets/Women/bridal_02.png",
      category: "Heritage Bridal",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fad",
      name: "Ivory Rose Reception Gown",
      price: 9800,
      advance: 2500,
      image: "/assets/Women/bridal_03.png",
      category: "Reception Gown",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fb5",
      name: "Midnight Blue Velvet Tuxedo",
      price: 6800,
      advance: 2000,
      image: "/assets/Formal.jpg",
      category: "Black Tie Tuxedo",
      gender: "men",
    },
    {
      _id: "6aa94b47b6771fe766b90fb6",
      name: "Heritage Embroidered Raw Silk Sherwani",
      price: 11000,
      advance: 2800,
      image: "/assets/Ethnic.jpg",
      category: "Heritage Sherwani",
      gender: "men",
    },
    {
      _id: "6aa94b47b6771fe766b90fb7",
      name: "Italian Wool Charcoal Blazer Suit",
      price: 5500,
      advance: 1800,
      image: "/assets/Blazer.jpg",
      category: "Bespoke Suiting",
      gender: "men",
    },
  ],
  trending: [
    {
      _id: "6aa94b47b6771fe766b90faf",
      name: "Scarlet Velvet Wedding Lehenga",
      price: 13800,
      advance: 3200,
      image: "/assets/Women/bridal_05.png",
      category: "Bridal Couture",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fb1",
      name: "Blush Heritage Silk Lehenga",
      price: 12500,
      advance: 3000,
      image: "/assets/Women/bridal_07.png",
      category: "Wedding",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fae",
      name: "Pastel Peach Floral Bridal Set",
      price: 11500,
      advance: 2800,
      image: "/assets/Women/bridal_04.png",
      category: "Floral Bridal",
      gender: "women",
    },
    {
      _id: "6aa94b47b6771fe766b90fb8",
      name: "Classic Black Peak Lapel Tuxedo",
      price: 7200,
      advance: 2200,
      image: "/assets/black_saree.jpg",
      category: "Formal",
      gender: "men",
    },
  ],
  ai_picks: [
    {
      product: {
        _id: "6aa94b47b6771fe766b90fab",
        name: "Regal Crimson Bridal Lehenga",
        price: 14000,
        advance: 3000,
        image: "/assets/Women/bridal_01.png",
        category: "Bridal Couture",
        gender: "women",
      },
    },
    {
      product: {
        _id: "6aa94b47b6771fe766b90fac",
        name: "Royal Gold Embroidered Lehenga",
        price: 15500,
        advance: 3500,
        image: "/assets/Women/bridal_02.png",
        category: "Heritage Bridal",
        gender: "women",
      },
    },
    {
      product: {
        _id: "6aa94b47b6771fe766b90fad",
        name: "Ivory Rose Reception Gown",
        price: 9800,
        advance: 2500,
        image: "/assets/Women/bridal_03.png",
        category: "Reception Gown",
        gender: "women",
      },
    },
  ],
};

const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(defaultCollections);
  const [newArrivalsTab, setNewArrivalsTab] = useState("all");

  useEffect(() => {
    let recentSearches = [];
    try {
      recentSearches = JSON.parse(localStorage.getItem("recent_searches") || "[]");
    } catch (e) {
      void e;
    }

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
  }, []);

  const handleTabChange = (event, newValue) => {
    setNewArrivalsTab(newValue);
  };

  const filteredNewArrivals = data.recommended.filter((dress) => {
    if (newArrivalsTab === "all") return true;
    return dress.gender?.toLowerCase() === newArrivalsTab;
  });

  return (
    <Box sx={{ backgroundColor: "#FAF8F5", minHeight: "100vh" }}>
      {/* 1. Global Navigation Bar */}
      <ResponsiveAppBar />

      {/* 2. Haute Couture Editorial Hero Banner */}
      <HeroBanner />

      {/* 3. Core Feature Promises Strip */}
      <FeaturesStrip />

      {/* 4. 4-Step Circular Rental Experience */}
      <HowItWorksSection />

      {/* 5. Curated Occasion & Category Departments */}
      <CategorySection />

      {/* 6. Main Interactive Catalog Showcase */}
      <Container maxWidth="xl" sx={{ mt: 8, mb: 10 }}>
        <Stack spacing={10}>
          {/* New Arrivals Section */}
          <Box>
            <SectionHeader>
              <ElegantTitle
                overline="FRESH OFF THE RUNWAY"
                title="Curated New Arrivals"
                subtitle="Hand-inspected designer additions refreshed weekly from India's premier fashion ateliers."
              />
              <StyledTabs value={newArrivalsTab} onChange={handleTabChange} centered>
                <StyledTab label="All Collections" value="all" />
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
                onClick={() =>
                  navigate(newArrivalsTab === "men" ? "/m-dress" : "/w-dress")
                }
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
                View Full {newArrivalsTab === "men" ? "Men's" : "Women's"} Catalog
              </Button>
            </Box>
          </Box>

          {/* 7. Interactive Groq LLM AI Stylist Feature Banner */}
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

      {/* 8. Press Strip & Verified Community Testimonials */}
      <PressAndTestimonialSection />

      {/* 9. Global Luxury Footer with System Architecture & Live Health */}
      <Fotter />
    </Box>
  );
};

export default Home;
