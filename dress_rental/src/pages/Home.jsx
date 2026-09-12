import ResponsiveAppBar from "../components/Navbar";
import { Box, Typography, Stack, CircularProgress, Container, Tabs, Tab } from "@mui/material";
import axios from "axios";
import { styled } from "@mui/system";
import { useEffect, useState } from "react";
import { BASE_URL } from "../config/axiosConfig";
import ProductCard from "../components/ProductCard";
import HeroBanner from "../components/HeroBanner";
import FeaturesStrip from "../components/FeaturesStrip";
import CategorySection from "../components/CategorySection";

const ScrollableRow = styled(Box)({
  display: "flex",
  overflowX: "auto",
  paddingBottom: "24px",
  paddingTop: "10px",
  gap: "20px",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  msOverflowStyle: "none",
  scrollbarWidth: "none",
});

const SectionHeader = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '32px',
});

const ElegantTitle = ({ title }) => (
  <Box display="flex" flexDirection="column" alignItems="center">
    <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 500, color: '#1A1A1A' }}>
      {title}
    </Typography>
    <Box display="flex" alignItems="center" gap={1} mt={1}>
      <Box sx={{ width: 30, height: 1, backgroundColor: '#D1A362' }} />
      <Box sx={{ width: 6, height: 6, transform: 'rotate(45deg)', backgroundColor: '#D1A362' }} />
      <Box sx={{ width: 30, height: 1, backgroundColor: '#D1A362' }} />
    </Box>
  </Box>
);

const StyledTabs = styled(Tabs)({
  marginTop: '20px',
  '& .MuiTabs-indicator': {
    backgroundColor: '#D1A362',
    height: '2px',
  },
});

const StyledTab = styled(Tab)({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  color: '#666',
  minWidth: 'auto',
  margin: '0 15px',
  padding: '6px 0',
  '&.Mui-selected': {
    color: '#1A1A1A',
  },
});

const Home = () => {
  const [data, setData] = useState({ recommended: [], trending: [], ai_picks: [] });
  const [loading, setLoading] = useState(true);
  const [newArrivalsTab, setNewArrivalsTab] = useState("women");

  useEffect(() => {
    let recentSearches = [];
    try {
      recentSearches = JSON.parse(localStorage.getItem("recent_searches") || "[]");
    } catch(e) {
      void e;
    }

    axios
      .post(`${BASE_URL}/products/personalized-home`, { recent_searches: recentSearches })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load personalized home:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleTabChange = (event, newValue) => {
    setNewArrivalsTab(newValue);
  };

  // Filter recommended products based on the active tab
  const filteredNewArrivals = data.recommended.filter((dress) => {
    if (newArrivalsTab === "all") return true;
    return dress.gender?.toLowerCase() === newArrivalsTab;
  });

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', pb: 12 }}>
      <ResponsiveAppBar />
      <HeroBanner />
      <FeaturesStrip />
      
      <CategorySection />

      <Container maxWidth="xl" sx={{ mt: 8 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
            <CircularProgress size={60} thickness={4} sx={{ color: 'secondary.main' }} />
          </Box>
        ) : (
          <Stack spacing={10}>
            
            {data.recommended && data.recommended.length > 0 && (
              <Box>
                <SectionHeader>
                  <ElegantTitle title="New Arrivals" />
                  <StyledTabs value={newArrivalsTab} onChange={handleTabChange} centered>
                    <StyledTab label="Women" value="women" />
                    <StyledTab label="Men" value="men" />
                    <StyledTab label="All" value="all" />
                  </StyledTabs>
                </SectionHeader>
                <ScrollableRow>
                  {filteredNewArrivals.length > 0 ? (
                    filteredNewArrivals.map((dress, index) => (
                      <ProductCard key={`rec-${index}`} dress={dress} />
                    ))
                  ) : (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ width: '100%', mt: 4 }}>
                      No new arrivals found for this category.
                    </Typography>
                  )}
                </ScrollableRow>
              </Box>
            )}

            {data.trending && data.trending.length > 0 && (
              <Box>
                <SectionHeader>
                  <ElegantTitle title="Trending Now" />
                </SectionHeader>
                <ScrollableRow>
                  {data.trending.map((dress, index) => (
                    <ProductCard key={`trend-${index}`} dress={dress} />
                  ))}
                </ScrollableRow>
              </Box>
            )}

            {data.ai_picks && data.ai_picks.length > 0 && (
              <Box>
                <SectionHeader>
                  <ElegantTitle title="Curated For You" />
                </SectionHeader>
                <ScrollableRow>
                  {data.ai_picks.map((item, index) => (
                    <ProductCard key={`ai-${index}`} dress={item.product} />
                  ))}
                </ScrollableRow>
              </Box>
            )}

          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default Home;
