import { useState, useEffect, useCallback } from "react";
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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  IconButton,
  Pagination,
  Skeleton,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Link,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  CheckroomOutlined as DressIcon,
  DiamondOutlined as JewelleryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  WorkspacePremiumOutlined as QualityIcon,
  LocalShippingOutlined as ShippingIcon,
  SellOutlined as SellIcon,
  AutoAwesome as SparkleIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import StoreProductCard from "../components/store/StoreProductCard";

export default function StoreLanding() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters from URL or defaults
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get("category") || "all");
  const [conditionFilter, setConditionFilter] = useState(() => searchParams.get("condition") || "all");
  const [sortOption, setSortOption] = useState(() => searchParams.get("sort") || "newest");
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get("page"), 10) || 1);
  const [priceRange, setPriceRange] = useState(() => searchParams.get("price") || "all");
  const [sizeFilter, setSizeFilter] = useState(() => searchParams.get("size") || "all");
  const [colorFilter, setColorFilter] = useState(() => searchParams.get("color") || "all");
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get("inStock") === "true");

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/store/categories`);
        if (res.data?.success && Array.isArray(res.data.categories)) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Store Products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 16,
        sort: sortOption,
      };

      if (categoryFilter !== "all") params.category = categoryFilter;
      if (conditionFilter !== "all") params.condition = conditionFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (sizeFilter !== "all") params.size = sizeFilter;
      if (colorFilter !== "all") params.color = colorFilter;
      if (inStockOnly) params.inStock = "true";

      if (priceRange === "under_5k") {
        params.maxPrice = 5000;
      } else if (priceRange === "5k_15k") {
        params.minPrice = 5000;
        params.maxPrice = 15000;
      } else if (priceRange === "15k_30k") {
        params.minPrice = 15000;
        params.maxPrice = 30000;
      } else if (priceRange === "above_30k") {
        params.minPrice = 30000;
      }

      const res = await axios.get(`${BASE_URL}/store/products`, { params });
      if (res.data?.success) {
        setProducts(res.data.products || []);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError("Failed to retrieve store products.");
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setError(err.response?.data?.message || "Failed to connect to Store service.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, conditionFilter, searchQuery, sortOption, currentPage, priceRange, sizeFilter, colorFilter, inStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync state with URL search params
  const updateParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (!val || val === "all" || val === false) {
        updated.delete(key);
      } else {
        updated.set(key, String(val));
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      setCurrentPage(1);
      updateParams({ q: searchQuery, page: 1 });
    }
  };

  const handleCategoryChange = (catName) => {
    setCategoryFilter(catName);
    setCurrentPage(1);
    updateParams({ category: catName, page: 1 });
  };

  const handleConditionChange = (cond) => {
    setConditionFilter(cond);
    setCurrentPage(1);
    updateParams({ condition: cond, page: 1 });
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSortOption(val);
    updateParams({ sort: val });
  };

  const handlePriceChange = (range) => {
    setPriceRange(range);
    setCurrentPage(1);
    updateParams({ price: range, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setConditionFilter("all");
    setSortOption("newest");
    setPriceRange("all");
    setSizeFilter("all");
    setColorFilter("all");
    setInStockOnly(false);
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
  const colorOptions = ["Red", "Gold", "Silver", "Emerald", "Navy", "Black", "Ivory", "Pastel"];

  // Reusable Filter Sidebar Content
  const filterControls = (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
          Refine Selection
        </Typography>
        <Button
          size="small"
          onClick={handleResetFilters}
          sx={{ textTransform: "none", color: "#A07028", fontWeight: 700 }}
        >
          Reset All
        </Button>
      </Stack>

      {/* Condition Filter */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1 }}>
          Garment Condition
        </Typography>
        <Stack spacing={1}>
          {[
            { id: "all", label: "All Items" },
            { id: "NEW", label: "Brand New Only" },
            { id: "PRE_OWNED", label: "Pre-loved Curated" },
          ].map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              clickable
              onClick={() => handleConditionChange(item.id)}
              sx={{
                justifyContent: "flex-start",
                bgcolor: conditionFilter === item.id ? "#1A1817" : "#FFFFFF",
                color: conditionFilter === item.id ? "#FFFFFF" : "#1A1817",
                border: conditionFilter === item.id ? "1px solid #1A1817" : "1px solid #ECE7DE",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Price Range Filter */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1 }}>
          Price Range
        </Typography>
        <Stack spacing={1}>
          {[
            { id: "all", label: "All Prices" },
            { id: "under_5k", label: "Under ₹5,000" },
            { id: "5k_15k", label: "₹5,000 – ₹15,000" },
            { id: "15k_30k", label: "₹15,000 – ₹30,000" },
            { id: "above_30k", label: "Above ₹30,000" },
          ].map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              clickable
              onClick={() => handlePriceChange(item.id)}
              sx={{
                justifyContent: "flex-start",
                bgcolor: priceRange === item.id ? "#1A1817" : "#FFFFFF",
                color: priceRange === item.id ? "#FFFFFF" : "#1A1817",
                border: priceRange === item.id ? "1px solid #1A1817" : "1px solid #ECE7DE",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Size Filter */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1 }}>
          Size
        </Typography>
        <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.8}>
          {sizeOptions.map((sz) => (
            <Chip
              key={sz}
              label={sz}
              clickable
              onClick={() => {
                const next = sizeFilter === sz ? "all" : sz;
                setSizeFilter(next);
                updateParams({ size: next, page: 1 });
              }}
              sx={{
                minWidth: 42,
                bgcolor: sizeFilter === sz ? "#D1A362" : "#FFFFFF",
                color: sizeFilter === sz ? "#1A1817" : "#555555",
                border: sizeFilter === sz ? "1px solid #D1A362" : "1px solid #ECE7DE",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Color Filter */}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1 }}>
          Colour Palette
        </Typography>
        <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.8}>
          {colorOptions.map((clr) => (
            <Chip
              key={clr}
              label={clr}
              clickable
              onClick={() => {
                const next = colorFilter === clr ? "all" : clr;
                setColorFilter(next);
                updateParams({ color: next, page: 1 });
              }}
              sx={{
                bgcolor: colorFilter === clr ? "#1A1817" : "#FFFFFF",
                color: colorFilter === clr ? "#FFFFFF" : "#555555",
                border: colorFilter === clr ? "1px solid #1A1817" : "1px solid #ECE7DE",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* In-Stock Only Switch */}
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                updateParams({ inStock: e.target.checked, page: 1 });
              }}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#D1A362",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#D1A362",
                },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
              In-Stock Items Only
            </Typography>
          }
        />
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5", color: "#1A1817" }}>
      <ResponsiveAppBar />

      {/* Luxury Editorial Hero */}
      <Box
        sx={{
          bgcolor: "#1A1817",
          color: "#FFFFFF",
          pt: { xs: 5, md: 8 },
          pb: { xs: 6, md: 9 },
          px: 2,
          textAlign: "center",
          position: "relative",
        }}
      >
        <Container maxWidth="md">
          {/* Vertical Switch Indicator */}
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
            <Chip
              label="WARDROBE WONDERS"
              size="small"
              sx={{ bgcolor: "rgba(209, 163, 98, 0.2)", color: "#D1A362", fontWeight: 800, fontSize: "0.72rem" }}
            />
            <Chip
              label="PERMANENT STORE"
              size="small"
              sx={{ bgcolor: "#D1A362", color: "#1A1817", fontWeight: 800, fontSize: "0.72rem" }}
            />
          </Stack>

          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 800,
              fontSize: { xs: "2.2rem", sm: "3.2rem", md: "3.8rem" },
              letterSpacing: "-0.02em",
              mb: 1.5,
              lineHeight: 1.15,
            }}
          >
            The Permanent Fashion Marketplace
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#E2DACB",
              fontSize: { xs: "0.95rem", md: "1.1rem" },
              maxWidth: 620,
              mx: "auto",
              mb: 3.5,
              lineHeight: 1.6,
            }}
          >
            Curated permanent-sale collections from verified boutiques, independent ateliers, bridal jewelers, and pre-loved vintage collectors.
          </Typography>

          {/* Integrated Search Bar */}
          <Paper
            elevation={0}
            sx={{
              p: "4px 8px",
              display: "flex",
              alignItems: "center",
              maxWidth: 600,
              mx: "auto",
              borderRadius: 3,
              border: "1px solid rgba(209, 163, 98, 0.5)",
              bgcolor: "#FFFFFF",
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search garments, jewellery, designer, or boutique..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9E9E9E", ml: 1, mr: 0.5 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchQuery(""); updateParams({ q: "" }); }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ px: 1, py: 0.5 }}
            />
            <Button
              variant="contained"
              onClick={handleSearchSubmit}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              Search
            </Button>
          </Paper>

          {/* Switch to Rental Vertical Banner */}
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ color: "#B8ADA1" }}>
              Looking for temporary luxury rentals instead?
            </Typography>
            <Link
              component={RouterLink}
              to="/"
              sx={{ color: "#D1A362", fontWeight: 700, fontSize: "0.78rem", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              Go to Rental Vertical →
            </Link>
          </Stack>
        </Container>
      </Box>

      {/* Category Horizontal Filter Strip */}
      <Box sx={{ borderBottom: "1px solid #ECE7DE", bgcolor: "#FFFFFF", py: 1.5, position: "sticky", top: { xs: 56, md: 70 }, zIndex: 10 }}>
        <Container maxWidth="xl">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ overflowX: "auto", pb: 0.5 }}>
            <Chip
              label="All Categories"
              clickable
              onClick={() => handleCategoryChange("all")}
              sx={{
                bgcolor: categoryFilter === "all" ? "#1A1817" : "#FAF8F5",
                color: categoryFilter === "all" ? "#FFFFFF" : "#1A1817",
                border: categoryFilter === "all" ? "1px solid #1A1817" : "1px solid #ECE7DE",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            />
            {categories.map((cat) => {
              const isSelected = categoryFilter === cat.name;
              return (
                <Chip
                  key={cat.slug || cat.name}
                  label={cat.name}
                  clickable
                  onClick={() => handleCategoryChange(cat.name)}
                  sx={{
                    bgcolor: isSelected ? "#1A1817" : "#FAF8F5",
                    color: isSelected ? "#FFFFFF" : "#1A1817",
                    border: isSelected ? "1px solid #1A1817" : "1px solid #ECE7DE",
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: "0.85rem",
                  }}
                />
              );
            })}
          </Stack>
        </Container>
      </Box>

      {/* Main Content & Product Grid */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Top Controls: Filter toggle (mobile) & Sort */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isMobile && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
                onClick={() => setMobileFilterOpen(true)}
                sx={{ borderColor: "#ECE7DE", color: "#1A1817", fontWeight: 700, borderRadius: 2 }}
              >
                Filters
              </Button>
            )}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Showing <strong>{products.length}</strong> of <strong>{totalCount}</strong> verified pieces
            </Typography>
          </Stack>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="sort-select-label">Sort By</InputLabel>
            <Select
              labelId="sort-select-label"
              value={sortOption}
              label="Sort By"
              onChange={handleSortChange}
              sx={{ borderRadius: 2, bgcolor: "#FFFFFF" }}
            >
              <MenuItem value="newest">Newest Arrivals</MenuItem>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Grid container spacing={3}>
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <Grid item md={3} lg={2.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  border: "1px solid #ECE7DE",
                  bgcolor: "#FFFFFF",
                  position: "sticky",
                  top: 140,
                }}
              >
                {filterControls}
              </Paper>
            </Grid>
          )}

          {/* Product Feed */}
          <Grid item xs={12} md={isMobile ? 12 : 9} lg={isMobile ? 12 : 9.5}>
            {loading ? (
              <Grid container spacing={2.5}>
                {Array.from(new Array(8)).map((_, idx) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                    <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2.5 }} />
                    <Skeleton width="60%" height={24} sx={{ mt: 1 }} />
                    <Skeleton width="40%" height={20} />
                  </Grid>
                ))}
              </Grid>
            ) : error ? (
              <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  Unable to load products
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  {error}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchProducts}
                  sx={{ borderColor: "#D1A362", color: "#A07028" }}
                >
                  Retry Connection
                </Button>
              </Paper>
            ) : products.length === 0 ? (
              <Paper elevation={0} sx={{ p: 8, textAlign: "center", borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
                <StoreIcon sx={{ fontSize: 56, color: "#D1A362", mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 1 }}>
                  No Products Found
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 480, mx: "auto", mb: 3 }}>
                  No approved items matched your current filter selection. Try resetting filters or searching for another garment.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleResetFilters}
                  sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700, textTransform: "none", borderRadius: 2 }}
                >
                  Reset All Filters
                </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={2.5}>
                  {products.map((item) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                      <StoreProductCard product={item} />
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(e, page) => {
                        setCurrentPage(page);
                        updateParams({ page });
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      sx={{
                        "& .Mui-selected": {
                          bgcolor: "#1A1817 !important",
                          color: "#D1A362 !important",
                          fontWeight: 800,
                        },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{ sx: { width: 300, p: 3 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Filters
          </Typography>
          <IconButton size="small" onClick={() => setMobileFilterOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {filterControls}
      </Drawer>

      <Fotter />
    </Box>
  );
}
