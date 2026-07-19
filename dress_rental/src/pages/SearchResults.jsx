import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { styled } from "@mui/system";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

const StyledContainer = styled(Box)({
  width: "100%",
  margin: "auto",
  display: "flex",
  flexWrap: "wrap",
});

const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(null);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q");

  useEffect(() => {
    if (query) {
      setLoading(true);
      
      // Save search to history for Phase 9 Personalization
      try {
        let history = JSON.parse(localStorage.getItem("recent_searches") || "[]");
        history.push(query);
        localStorage.setItem("recent_searches", JSON.stringify(history));
      } catch(e) {}
      
      axios
        .post(`${BASE_URL}/products/search`, { query })
        .then((res) => {
          setResults(res.data.results || []);
          setFilters(res.data.filters || null);
        })
        .catch((err) => {
          console.error("Search failed:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [query]);

  return (
    <>
      <ResponsiveAppBar />
      <Stack p={3}>
        <Typography variant="h4" mb={2}>
          Search Results for "{query}"
        </Typography>
        
        {filters && Object.values(filters).some(v => v !== null) && (
          <Box mb={2} p={2} sx={{ background: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              AI Detected Filters:
            </Typography>
            <Typography variant="body2">
              {Object.entries(filters)
                .filter(([k, v]) => v !== null)
                .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
                .join(" | ")}
            </Typography>
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : results.length > 0 ? (
          <StyledContainer>
            {results.map((dress, index) => (
              <ProductCard key={index} dress={dress} />
            ))}
          </StyledContainer>
        ) : (
          <Typography variant="h6" color="textSecondary">
            No products found matching your AI criteria. Try a different search!
          </Typography>
        )}
      </Stack>
    </>
  );
};

export default SearchResults;
