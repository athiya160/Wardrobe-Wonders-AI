import { 
  Box, 
  Typography, 
  Container, 
  Stack, 
  Chip, 
  TextField, 
  InputAdornment, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  CircularProgress, 
  Breadcrumbs, 
  Link as MuiLink,
  Button,
  Drawer,
  IconButton,
  Divider,
  Badge
} from "@mui/material";
import axios from "axios";
import { styled } from "@mui/system";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import AmazonFilterSidebar from "../components/AmazonFilterSidebar";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/axiosConfig";
import ProductCard from "../components/ProductCard";
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

// Hero Banner Container with luxury plum/wine gradient
const HeroSection = styled(Box)({
  background: "linear-gradient(135deg, #1C1215 0%, #2A1A20 50%, #3B242C 100%)",
  color: "#FFFFFF",
  padding: "60px 0 45px 0",
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: "450px",
    height: "100%",
    background: "radial-gradient(circle, rgba(209, 163, 98, 0.18) 0%, rgba(0,0,0,0) 70%)",
    pointerEvents: "none",
  }
});

const CategoryChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "selected",
})(({ selected }) => ({
  fontWeight: 600,
  fontSize: "0.85rem",
  padding: "6px 2px",
  height: "36px",
  borderRadius: "20px",
  cursor: "pointer",
  transition: "all 0.25s ease",
  backgroundColor: selected ? "#D1A362" : "#FFFFFF",
  color: selected ? "#FFFFFF" : "#333333",
  border: selected ? "1px solid #D1A362" : "1px solid #E2E2E6",
  boxShadow: selected ? "0 4px 12px rgba(209, 163, 98, 0.35)" : "0 1px 3px rgba(0,0,0,0.04)",
  "&:hover": {
    backgroundColor: selected ? "#C59653" : "#F4F4F6",
    transform: "translateY(-1px)",
  }
}));

const ProductsGrid = styled(Box)({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "24px",
  width: "100%",
});

const WOMEN_CATEGORIES = [
  { key: "Casual", label: "Casual & Chic", icon: "👗" },
  { key: "Wedding", label: "Bridal Lehengas", icon: "👑" },
  { key: "Traditional", label: "Festive & Sarees", icon: "🥻" },
  { key: "Party", label: "Party & Cocktails", icon: "🍸" },
  { key: "Evening Wear", label: "Evening Gowns", icon: "👠" },
];

const getItemRating = (item) => {
  if (item.rating && typeof item.rating === "number") return item.rating;
  if (item.reviews && item.reviews.length > 0) {
    const sum = item.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return sum / item.reviews.length;
  }
  const hash = (item.name || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 4.2 + (hash % 8) * 0.1;
};

const Fdress = () => {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [rentalDuration, setRentalDuration] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sync category from URL param on load/change
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam && catParam.toLowerCase() !== "all") {
      const cats = catParam.split(",").map(c => c.trim()).filter(Boolean);
      setSelectedCategories(cats);
    } else {
      setSelectedCategories([]);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/products/gender/women`)
      .then((res) => {
        setDresses(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to load women dresses:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCategoryToggle = (categoryKey) => {
    let nextCategories;
    if (selectedCategories.some(c => c.toLowerCase() === categoryKey.toLowerCase())) {
      nextCategories = selectedCategories.filter(c => c.toLowerCase() !== categoryKey.toLowerCase());
    } else {
      nextCategories = [...selectedCategories, categoryKey];
    }
    setSelectedCategories(nextCategories);
    
    // Update URL query
    const params = new URLSearchParams(searchParams);
    if (nextCategories.length === 0) {
      params.delete("category");
    } else {
      params.set("category", nextCategories.join(","));
    }
    setSearchParams(params);
  };

  const handleQuickPillClick = (key) => {
    if (key === "all") {
      setSelectedCategories([]);
      const params = new URLSearchParams(searchParams);
      params.delete("category");
      setSearchParams(params);
    } else {
      const isSelected = selectedCategories.some(c => c.toLowerCase() === key.toLowerCase());
      if (isSelected && selectedCategories.length === 1) {
        // Unselect if only this was selected
        setSelectedCategories([]);
        const params = new URLSearchParams(searchParams);
        params.delete("category");
        setSearchParams(params);
      } else {
        setSelectedCategories([key]);
        const params = new URLSearchParams(searchParams);
        params.set("category", key);
        setSearchParams(params);
      }
    }
  };

  const handleResetAll = () => {
    setSelectedCategories([]);
    setPriceRange([0, 20000]);
    setRentalDuration("all");
    setRatingFilter(0);
    setInStockOnly(false);
    setSearchQuery("");
    setSortBy("recommended");
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    setSearchParams(params);
  };

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    dresses.forEach((d) => {
      const cat = d.category || "Other";
      const match = WOMEN_CATEGORIES.find(c => c.key.toLowerCase() === cat.toLowerCase());
      const key = match ? match.key : cat;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [dresses]);

  const sidebarCategories = useMemo(() => {
    return WOMEN_CATEGORIES.map(cat => ({
      key: cat.key,
      label: cat.label,
      count: categoryCounts[cat.key] || 0,
    }));
  }, [categoryCounts]);

  // Active filters count & flag
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (priceRange[0] > 0 || priceRange[1] < 20000) count += 1;
    if (rentalDuration !== "all") count += 1;
    if (ratingFilter > 0) count += 1;
    if (inStockOnly) count += 1;
    if (searchQuery.trim().length > 0) count += 1;
    return count;
  }, [selectedCategories, priceRange, rentalDuration, ratingFilter, inStockOnly, searchQuery]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Filter and Sort dresses
  const filteredDresses = useMemo(() => {
    return dresses
      .filter((item) => {
        // 1. Multi-category filter
        if (selectedCategories.length > 0) {
          const match = selectedCategories.some(
            (c) => item.category && item.category.toLowerCase() === c.toLowerCase()
          );
          if (!match) return false;
        }

        // 2. Price filter
        const price = Number(item.price) || 0;
        if (price < priceRange[0] || price > priceRange[1]) {
          return false;
        }

        // 3. Rental duration
        if (rentalDuration === "7") {
          // 7-day rentals are suitable for wedding, traditional, or evening gowns
          const isExtendedPackage = item.category !== "Casual" || price >= 2000;
          if (!isExtendedPackage) return false;
        }

        // 4. Rating filter
        if (ratingFilter > 0) {
          const itemRating = getItemRating(item);
          if (itemRating < ratingFilter) return false;
        }

        // 5. In-stock filter
        if (inStockOnly) {
          const stockNum = parseInt(item.stock, 10);
          if (!isNaN(stockNum) && stockNum <= 0) return false;
          if (item.availability === false) return false;
        }

        // 6. Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name && item.name.toLowerCase().includes(q);
          const matchCat = item.category && item.category.toLowerCase().includes(q);
          if (!matchName && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
        if (sortBy === "rating-desc") return getItemRating(b) - getItemRating(a);
        return 0; // default featured order
      });
  }, [dresses, selectedCategories, priceRange, rentalDuration, ratingFilter, inStockOnly, searchQuery, sortBy]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAFAFA" }}>
      <ResponsiveAppBar />

      {/* Hero Header */}
      <HeroSection>
        <Container maxWidth="xl">
          <Breadcrumbs sx={{ mb: 2, color: "#9E9E9E", fontSize: "0.85rem" }}>
            <MuiLink 
              underline="hover" 
              color="inherit" 
              sx={{ cursor: "pointer" }} 
              onClick={() => navigate("/")}
            >
              Home
            </MuiLink>
            <Typography color="#D1A362" fontSize="0.85rem" fontWeight={500}>
              Women&apos;s Collection
            </Typography>
          </Breadcrumbs>

          <Box sx={{ maxWidth: "800px" }}>
            <Typography 
              variant="overline" 
              sx={{ 
                letterSpacing: "0.2em", 
                color: "#D1A362", 
                fontWeight: 700, 
                display: "inline-block",
                mb: 1
              }}
            >
              HAUTE COUTURE RENTALS
            </Typography>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontFamily: '"Playfair Display", "Georgia", serif', 
                fontWeight: 600, 
                color: "#FFFFFF",
                fontSize: { xs: "2rem", md: "2.8rem" },
                mb: 1.5
              }}
            >
              Women&apos;s Designer Collection
            </Typography>
            <Typography variant="body1" sx={{ color: "#E0D2D6", fontSize: "1.05rem", lineHeight: 1.6 }}>
              Drape yourself in royal bridal lehengas, handwoven Banarasi silk sarees, one-shoulder red carpet gowns, and contemporary luxury co-ords for your most memorable moments.
            </Typography>
          </Box>
        </Container>
      </HeroSection>

      {/* Main Container */}
      <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
        
        {/* Quick Category Pill Tabs */}
        <Box sx={{ mb: 3 }}>
          <Stack 
            direction="row" 
            spacing={1.2} 
            sx={{ 
              overflowX: "auto", 
              py: 0.5,
              "&::-webkit-scrollbar": { height: "4px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#E0E0E0", borderRadius: "4px" }
            }}
          >
            <CategoryChip
              label={`✨ All Outfits (${dresses.length})`}
              selected={selectedCategories.length === 0}
              onClick={() => handleQuickPillClick("all")}
            />
            {WOMEN_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.some(c => c.toLowerCase() === cat.key.toLowerCase());
              const count = categoryCounts[cat.key] || 0;
              return (
                <CategoryChip
                  key={cat.key}
                  label={`${cat.icon} ${cat.label} ${count > 0 ? `(${count})` : ""}`}
                  selected={isSelected}
                  onClick={() => handleQuickPillClick(cat.key)}
                />
              );
            })}
          </Stack>
        </Box>

        {/* 2-Column Amazon-Style Layout */}
        <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, alignItems: "flex-start" }}>
          
          {/* Desktop Left Sidebar */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: "260px",
              flexShrink: 0,
              position: "sticky",
              top: 85,
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
              pr: 2,
              backgroundColor: "#FFFFFF",
              p: 2.5,
              borderRadius: 2,
              border: "1px solid #EAEAEA",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#E0E0E0", borderRadius: "4px" },
            }}
          >
            <AmazonFilterSidebar
              categories={sidebarCategories}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              priceRange={priceRange}
              maxPossiblePrice={20000}
              onPriceChange={setPriceRange}
              rentalDuration={rentalDuration}
              onRentalDurationChange={setRentalDuration}
              ratingFilter={ratingFilter}
              onRatingChange={setRatingFilter}
              inStockOnly={inStockOnly}
              onInStockToggle={setInStockOnly}
              onResetAll={handleResetAll}
              hasActiveFilters={hasActiveFilters}
            />
          </Box>

          {/* Mobile Filter Drawer */}
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            PaperProps={{
              sx: { width: "300px", p: 2.5, boxSizing: "border-box" }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} pb={1} borderBottom="1px solid #ECECEC">
              <Typography variant="h6" fontWeight={700} color="#0F1111">
                Filter Outfits
              </Typography>
              <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ overflowY: "auto", maxHeight: "calc(100vh - 90px)" }}>
              <AmazonFilterSidebar
                categories={sidebarCategories}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                priceRange={priceRange}
                maxPossiblePrice={20000}
                onPriceChange={setPriceRange}
                rentalDuration={rentalDuration}
                onRentalDurationChange={setRentalDuration}
                ratingFilter={ratingFilter}
                onRatingChange={setRatingFilter}
                inStockOnly={inStockOnly}
                onInStockToggle={setInStockOnly}
                onResetAll={handleResetAll}
                hasActiveFilters={hasActiveFilters}
              />
            </Box>
          </Drawer>

          {/* Right Column: Search Toolbar, Active Chips & Product Grid */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            
            {/* Toolbar: Search, Sort & Item Count */}
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              justifyContent="space-between" 
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1.5} 
              sx={{ 
                p: 1.8, 
                mb: 2, 
                backgroundColor: "#FFFFFF", 
                borderRadius: 2, 
                border: "1px solid #ECECEC",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                {/* Mobile Filter Trigger Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setMobileDrawerOpen(true)}
                  startIcon={
                    <Badge badgeContent={activeFiltersCount} color="error" sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", height: 16, minWidth: 16 } }}>
                      <FilterListIcon fontSize="small" />
                    </Badge>
                  }
                  sx={{
                    display: { xs: "inline-flex", md: "none" },
                    borderColor: "#D5D9D9",
                    color: "#0F1111",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 1.5,
                    height: "40px"
                  }}
                >
                  Filters
                </Button>

                <TextField
                  size="small"
                  placeholder="Search lehengas, sarees, gowns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: { xs: "100%", sm: "260px", md: "320px" } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "#888" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: "#555", whiteSpace: "nowrap" }}>
                  <strong>{filteredDresses.length}</strong> {filteredDresses.length === 1 ? "result" : "results"}
                </Typography>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="sort-select-label">Sort by</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="recommended">Featured</MenuItem>
                    <MenuItem value="price-asc">Price: Low to High</MenuItem>
                    <MenuItem value="price-desc">Price: High to Low</MenuItem>
                    <MenuItem value="rating-desc">Avg. Customer Review</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {/* Active Filter Chips Bar */}
            {hasActiveFilters && (
              <Box 
                sx={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  alignItems: "center", 
                  gap: 1, 
                  mb: 2.5, 
                  p: 1.2, 
                  backgroundColor: "#FFFFFF", 
                  borderRadius: 2, 
                  border: "1px solid #ECECEC" 
                }}
              >
                <Typography variant="caption" fontWeight={600} sx={{ color: "#666", mr: 0.5 }}>
                  Active Filters:
                </Typography>

                {selectedCategories.map((cat) => (
                  <Chip
                    key={cat}
                    size="small"
                    label={`Category: ${cat}`}
                    onDelete={() => handleCategoryToggle(cat)}
                    sx={{ backgroundColor: "#F3F5F7", fontWeight: 500, "& .MuiChip-deleteIcon": { color: "#555" } }}
                  />
                ))}

                {(priceRange[0] > 0 || priceRange[1] < 20000) && (
                  <Chip
                    size="small"
                    label={`Price: ₹${priceRange[0].toLocaleString()} - ₹${priceRange[1].toLocaleString()}`}
                    onDelete={() => setPriceRange([0, 20000])}
                    sx={{ backgroundColor: "#F3F5F7", fontWeight: 500 }}
                  />
                )}

                {rentalDuration !== "all" && (
                  <Chip
                    size="small"
                    label={`Rental: ${rentalDuration} Days`}
                    onDelete={() => setRentalDuration("all")}
                    sx={{ backgroundColor: "#F3F5F7", fontWeight: 500 }}
                  />
                )}

                {ratingFilter > 0 && (
                  <Chip
                    size="small"
                    label={`${ratingFilter}★ & Up`}
                    onDelete={() => setRatingFilter(0)}
                    sx={{ backgroundColor: "#F3F5F7", fontWeight: 500 }}
                  />
                )}

                {inStockOnly && (
                  <Chip
                    size="small"
                    label="In Stock Only"
                    onDelete={() => setInStockOnly(false)}
                    sx={{ backgroundColor: "#F3F5F7", fontWeight: 500 }}
                  />
                )}

                {searchQuery.trim().length > 0 && (
                  <Chip
                    size="small"
                    label={`"${searchQuery}"`}
                    onDelete={() => setSearchQuery("")}
                    sx={{ backgroundColor: "#F3F5F7", fontWeight: 500 }}
                  />
                )}

                <Button
                  size="small"
                  onClick={handleResetAll}
                  startIcon={<RestartAltIcon fontSize="small" />}
                  sx={{
                    textTransform: "none",
                    color: "#B12704",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    p: "2px 8px",
                    ml: "auto",
                    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                  }}
                >
                  Clear all
                </Button>
              </Box>
            )}

            {/* Product Grid or Loading / Empty States */}
            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12}>
                <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Curating women&apos;s collection...
                </Typography>
              </Box>
            ) : filteredDresses.length > 0 ? (
              <ProductsGrid>
                {filteredDresses.map((dressItem) => (
                  <ProductCard key={dressItem._id} dress={dressItem} />
                ))}
              </ProductsGrid>
            ) : (
              <Box 
                sx={{ 
                  py: 10, 
                  textAlign: "center", 
                  backgroundColor: "#FFFFFF", 
                  borderRadius: 3, 
                  border: "1px dashed #DDD",
                  px: 3
                }}
              >
                <CheckroomIcon sx={{ fontSize: 60, color: "#D1A362", opacity: 0.7, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} color="#222" gutterBottom>
                  No matching outfits found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mb: 3 }}>
                  We couldn&apos;t find any women&apos;s outfits matching your selected filters. Try broadening your price range or clearing some category tags.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={handleResetAll}
                  sx={{ borderColor: "#D1A362", color: "#B88438", textTransform: "none", fontWeight: 600 }}
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      <Fotter />
    </Box>
  );
};

export default Fdress;
