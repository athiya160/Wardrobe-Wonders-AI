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
  Badge,
  Slider
} from "@mui/material";
import axios from "axios";
import { styled } from "@mui/system";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/axiosConfig";
import ProductCard from "../components/ProductCard";
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CleanHandsOutlinedIcon from '@mui/icons-material/CleanHandsOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';

// Hero Banner Container with Royal Gold & Heritage Vignette
const HeroSection = styled(Box)({
  background: "linear-gradient(135deg, #181410 0%, #2A2118 50%, #3D2E1E 100%)",
  color: "#FFFFFF",
  padding: "60px 0 45px 0",
  position: "relative",
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: "480px",
    height: "100%",
    background: "radial-gradient(circle, rgba(209, 163, 98, 0.22) 0%, rgba(0,0,0,0) 70%)",
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
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: "24px",
  width: "100%",
});

const JEWELLERY_CATEGORIES = [
  { key: "All", label: "All Jewellery", icon: "💎" },
  { key: "Temple", label: "Temple Gold (Muhurtham)", icon: "🕉️" },
  { key: "Kundan", label: "Kundan & Jadau (Bridal)", icon: "👑" },
  { key: "American Diamond", label: "American Diamond (Engagement)", icon: "✨" },
  { key: "Antique Matte", label: "Antique Matte Gold", icon: "🔱" },
  { key: "Floral", label: "Haldi & Mehendi Floral", icon: "🌼" },
];

// Offline & fallback mock items ensuring zero blank screen if backend hasn't seeded yet
const FALLBACK_JEWELLERY = [
  {
    _id: "jewel_01",
    name: "Padmavati 1-Gram Gold Lakshmi Temple Nakshi Bridal Set",
    price: 2400,
    rentalPricePerDay: 2400,
    advance: "4000",
    securityDeposit: 4000,
    image: "/assets/Jewellery/image_20261019_002031.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002031.jpg",
      "/assets/Jewellery/image_20261019_002031_1.jpg",
      "/assets/Jewellery/image_20261019_002031_2.jpg",
      "/assets/Jewellery/image_20261019_002031_3.jpg"
    ],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "Antique Gold",
    rating: 4.9,
    description: "Authentic 24K 1-gram micro gold plated temple jewelry set designed with traditional Nakshi craftsmanship and Goddess Lakshmi motifs. Sanitized and sealed for Hindu wedding Muhurtham ceremonies."
  },
  {
    _id: "jewel_02",
    name: "Kempu Ratna 1-Gram Gold Lakshmi Bridal Haram & Jhumka Set",
    price: 2800,
    rentalPricePerDay: 2800,
    advance: "4500",
    securityDeposit: 4500,
    image: "/assets/Jewellery/image_20261019_002033.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002033.jpg",
      "/assets/Jewellery/image_20261019_002033_1.jpg",
      "/assets/Jewellery/image_20261019_002033_2.jpg",
      "/assets/Jewellery/image_20261019_002033_3.jpg"
    ],
    stock: "3",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "Antique Gold & Ruby",
    rating: 5.0,
    description: "Royal South Indian Kemp stone antique matte temple bridal haram set. Features Goddess Lakshmi pendant, peacock carvings, matching earrings, and maang tikka."
  },
  {
    _id: "jewel_03",
    name: "Aura Rose Gold American Diamond (AD) Bridal Choker Set",
    price: 1600,
    rentalPricePerDay: 1600,
    advance: "3000",
    securityDeposit: 3000,
    image: "/assets/Jewellery/image_20261019_002857.jpg",
    images: [
      "/assets/Jewellery/image_20261019_002857.jpg",
      "/assets/Jewellery/image_20261019_002857_1.jpg",
      "/assets/Jewellery/image_20261019_002857_2.jpg"
    ],
    stock: "5",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Engagement",
    style: "American Diamond",
    color: "Rose Gold Diamond",
    rating: 4.8,
    description: "High-grade Cubic Zirconia solitaires encrusted in rose gold finish. Includes contouring choker and pear-cut drop earrings. Designed for Hindu engagements and reception gowns."
  },
  {
    _id: "jewel_04",
    name: "Imperial Kundan & Jadau Royal 7-Piece Bridal Set with Mathapatti & Nath",
    price: 3200,
    rentalPricePerDay: 3200,
    advance: "5000",
    securityDeposit: 5000,
    image: "/assets/Jewellery/image_20261019_003318.jpg",
    images: [
      "/assets/Jewellery/image_20261019_003318.jpg",
      "/assets/Jewellery/image_20261019_003319.jpg",
      "/assets/Jewellery/image_20261019_003319_1.jpg"
    ],
    stock: "3",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Kundan",
    color: "Gold & Emerald Green",
    rating: 4.95,
    description: "Magnificent 7-piece royal bridal collection complete with Kundan choker, rani haar, broad mathapatti, bridal nath with pearl chain, jhumkas, ring, and kadas."
  },
  {
    _id: "jewel_05",
    name: "Mayuri Antique Matte 1-Gram Gold Peacock Waist Belt (Vaddanam) & Haar",
    price: 1900,
    rentalPricePerDay: 1900,
    advance: "3500",
    securityDeposit: 3500,
    image: "/assets/Jewellery/image_20261019_002032.jpg",
    images: ["/assets/Jewellery/image_20261019_002032.jpg", "/assets/Jewellery/image_20261019_002034.jpg"],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Antique Matte",
    color: "Matte Gold",
    rating: 4.7,
    description: "Traditional peacock-motif Nakshi bridal waist belt (Vaddanam/Ottiyanam) and collar necklace. Cast in brass with 1-gram matte gold electroplating."
  },
  {
    _id: "jewel_06",
    name: "Rajputana Uncut Polki & Meenakari Choker Set",
    price: 2100,
    rentalPricePerDay: 2100,
    advance: "3800",
    securityDeposit: 3800,
    image: "/assets/Jewellery/image_20261019_002858.jpg",
    images: ["/assets/Jewellery/image_20261019_002858.jpg", "/assets/Jewellery/image_20261019_002858_1.jpg"],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Sangeet",
    style: "Kundan",
    color: "Gold & Mint Green",
    rating: 4.85,
    description: "Royal uncut Polki stones set in gold foil with reverse turquoise Meenakari artwork. Lightweight and glamorous for Sangeet dances and cocktail evenings."
  },
  {
    _id: "jewel_07",
    name: "Celeste Zirconia & Rhodium Solitaire Waterfall Necklace Set",
    price: 1800,
    rentalPricePerDay: 1800,
    advance: "3200",
    securityDeposit: 3200,
    image: "/assets/Jewellery/image_20261019_002859.jpg",
    images: ["/assets/Jewellery/image_20261019_002859.jpg", "/assets/Jewellery/image_20261019_002859_1.jpg"],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Reception",
    style: "American Diamond",
    color: "Silver Diamond",
    rating: 4.9,
    description: "Dazzling diamond-look waterfall collar necklace with matching chandelier drops. Rhodium electroplated for platinum-like gleam under stage spotlights."
  },
  {
    _id: "jewel_08",
    name: "Sita Kalyanam Heritage Kasu Mala & Lakshmi Choker Combo",
    price: 2600,
    rentalPricePerDay: 2600,
    advance: "4200",
    securityDeposit: 4200,
    image: "/assets/Jewellery/image_20261019_003320.jpg",
    images: ["/assets/Jewellery/image_20261019_003320.jpg", "/assets/Jewellery/image_20261019_003323.jpg"],
    stock: "3",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "1-Gram Yellow Gold",
    rating: 5.0,
    description: "Sacred coin necklace (Kasu Mala) paired with a high choker necklace, embellished with temple deities, South Sea pearl drops, and rich ruby gems."
  },
  {
    _id: "jewel_09",
    name: "Noor Emerald Beaded Jadau Choker with Chandbali Earrings",
    price: 2200,
    rentalPricePerDay: 2200,
    advance: "3600",
    securityDeposit: 3600,
    image: "/assets/Jewellery/image_20261019_002900.jpg",
    images: ["/assets/Jewellery/image_20261019_002900.jpg", "/assets/Jewellery/image_20261019_002901.jpg"],
    stock: "5",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Engagement",
    style: "Kundan",
    color: "Gold & Emerald Green",
    rating: 4.8,
    description: "Traditional Jadau choker featuring hand-strung Colombian emerald beads, delicate floral Kundan panels, and royal crescent Chandbali earrings."
  },
  {
    _id: "jewel_10",
    name: "Vrinda Haldi & Mehendi Yellow Floral Pearl Jewelry Set",
    price: 850,
    rentalPricePerDay: 850,
    advance: "1200",
    securityDeposit: 1200,
    image: "/assets/Jewellery/image_20261019_002905.jpg",
    images: ["/assets/Jewellery/image_20261019_002905.jpg", "/assets/Jewellery/image_20261019_002907.jpg"],
    stock: "8",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Haldi",
    style: "Floral",
    color: "Marigold Yellow & Pearl White",
    rating: 4.75,
    description: "Handcrafted artificial marigold and jasmine flower jewelry set with pearl clusters, floral tiara, earrings, double haathphools, and floral anklets for Haldi rituals."
  },
  {
    _id: "jewel_11",
    name: "Devangana Handcrafted 1-Gram Gold Broad Kadas & Temple Bangles Set",
    price: 950,
    rentalPricePerDay: 950,
    advance: "1800",
    securityDeposit: 1800,
    image: "/assets/Jewellery/image_20261019_002925.jpg",
    images: ["/assets/Jewellery/image_20261019_002925.jpg", "/assets/Jewellery/image_20261019_002926.jpg"],
    stock: "6",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Antique Matte",
    color: "Antique Gold",
    rating: 4.85,
    description: "Set of 4 heavy screw-type bridal bangles with micro-carved elephant and floral motifs in 1-gram antique gold polish. Fits standard 2.4 to 2.8 wrist sizes."
  },
  {
    _id: "jewel_12",
    name: "Ananya Traditional Mathapatti, Borla & Statement Jhumkas Combo",
    price: 1400,
    rentalPricePerDay: 1400,
    advance: "2500",
    securityDeposit: 2500,
    image: "/assets/Jewellery/image_20261019_002040.jpg",
    images: ["/assets/Jewellery/image_20261019_002040.jpg", "/assets/Jewellery/image_20261019_002043.jpg"],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Kundan",
    color: "Gold & Ruby",
    rating: 4.9,
    description: "Regal forehead mathapatti with authentic Rajasthani Borla and 3-tier grand jhumkas. Enriched with ruby cabochons and pearl latkans."
  },
  {
    _id: "jewel_13",
    name: "Meenakshi Divine Temple Vanki (Armlet) & Nethi Chutti Set",
    price: 1200,
    rentalPricePerDay: 1200,
    advance: "2200",
    securityDeposit: 2200,
    image: "/assets/Jewellery/image_20261019_002111.jpg",
    images: ["/assets/Jewellery/image_20261019_002111.jpg", "/assets/Jewellery/image_20261019_002116.jpg"],
    stock: "4",
    category: "Jewellery",
    gender: "jewellery",
    occasion: "Marriage",
    style: "Temple",
    color: "1-Gram Matte Gold",
    rating: 4.9,
    description: "Pair of Vanki (bridal upper-armlets) with snake/peacock carving and matching bridal Maang Tikka (Nethi Chutti). Hand-polished in 1-gram matte gold."
  }
];

const getItemRating = (item) => {
  if (item.rating && typeof item.rating === "number") return item.rating;
  if (item.reviews && item.reviews.length > 0) {
    const sum = item.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return sum / item.reviews.length;
  }
  return 4.9;
};

const Jewellery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters State
  const [selectedStyle, setSelectedStyle] = useState("All");
  const [priceRange, setPriceRange] = useState([500, 6000]);
  const [selectedOccasion, setSelectedOccasion] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sync category from URL param on load/change
  useEffect(() => {
    const styleParam = searchParams.get("style");
    if (styleParam) {
      setSelectedStyle(styleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/products/gender/jewellery`)
      .then((res) => {
        const data = Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_JEWELLERY;
        setItems(data);
      })
      .catch((err) => {
        console.warn("Backend offline or empty, rendering local jewelry collection:", err);
        setItems(FALLBACK_JEWELLERY);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleStyleChange = (styleKey) => {
    setSelectedStyle(styleKey);
    const newParams = new URLSearchParams(searchParams);
    if (styleKey === "All") {
      newParams.delete("style");
    } else {
      newParams.set("style", styleKey);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedStyle("All");
    setPriceRange([500, 6000]);
    setSelectedOccasion("all");
    setSearchQuery("");
    setSortBy("recommended");
    setSearchParams({});
  };

  // Filter and Sort Pipeline
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Style / Collection Filter
        if (selectedStyle !== "All") {
          const itemStyle = (item.style || "").toLowerCase();
          const target = selectedStyle.toLowerCase();
          if (!itemStyle.includes(target) && !(item.name || "").toLowerCase().includes(target)) {
            return false;
          }
        }

        // Occasion Filter
        if (selectedOccasion !== "all") {
          const itemOccasion = (item.occasion || "").toLowerCase();
          if (!itemOccasion.includes(selectedOccasion.toLowerCase())) {
            return false;
          }
        }

        // Price Filter
        const p = item.price || item.rentalPricePerDay || 0;
        if (p < priceRange[0] || p > priceRange[1]) return false;

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = (item.name || "").toLowerCase().includes(q);
          const descMatch = (item.description || "").toLowerCase().includes(q);
          const styleMatch = (item.style || "").toLowerCase().includes(q);
          const tagsMatch = Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q));
          if (!nameMatch && !descMatch && !styleMatch && !tagsMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.price || a.rentalPricePerDay || 0;
        const priceB = b.price || b.rentalPricePerDay || 0;
        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "rating") return getItemRating(b) - getItemRating(a);
        return 0;
      });
  }, [items, selectedStyle, selectedOccasion, priceRange, searchQuery, sortBy]);

  const activeFilterCount = (selectedStyle !== "All" ? 1 : 0) + (selectedOccasion !== "all" ? 1 : 0);

  const filterSidebarContent = (
    <Box sx={{ width: "100%", p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "0.04em", color: "#1A1817" }}>
          REFINE JEWELLERY
        </Typography>
        <Button size="small" onClick={handleResetFilters} startIcon={<RestartAltIcon />} sx={{ color: "#D1A362", fontWeight: 700 }}>
          Reset
        </Button>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Occasion Filter */}
      <Typography variant="caption" sx={{ fontWeight: 800, color: "#8E8880", letterSpacing: "0.08em", display: "block", mb: 1 }}>
        WEDDING CEREMONY
      </Typography>
      <Stack spacing={1} sx={{ mb: 3 }}>
        {[
          { key: "all", label: "All Ceremonies" },
          { key: "marriage", label: "Marriage / Muhurtham" },
          { key: "engagement", label: "Engagement / Roka" },
          { key: "reception", label: "Reception" },
          { key: "sangeet", label: "Sangeet & Cocktails" },
          { key: "haldi", label: "Haldi & Mehendi" }
        ].map((occ) => (
          <Button
            key={occ.key}
            variant={selectedOccasion === occ.key ? "contained" : "text"}
            size="small"
            onClick={() => setSelectedOccasion(occ.key)}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: selectedOccasion === occ.key ? 700 : 500,
              backgroundColor: selectedOccasion === occ.key ? "#D1A362" : "transparent",
              color: selectedOccasion === occ.key ? "#1A1817" : "#333333",
              "&:hover": {
                backgroundColor: selectedOccasion === occ.key ? "#C59653" : "rgba(209, 163, 98, 0.08)",
              }
            }}
          >
            {occ.label}
          </Button>
        ))}
      </Stack>

      <Divider sx={{ mb: 2.5 }} />

      {/* Price Slider */}
      <Typography variant="caption" sx={{ fontWeight: 800, color: "#8E8880", letterSpacing: "0.08em", display: "block", mb: 1 }}>
        DAILY RENTAL RATE
      </Typography>
      <Box sx={{ px: 1, mb: 2 }}>
        <Slider
          value={priceRange}
          onChange={(_, val) => setPriceRange(val)}
          min={500}
          max={6000}
          step={100}
          sx={{
            color: "#D1A362",
            "& .MuiSlider-thumb": {
              backgroundColor: "#D1A362",
            }
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "0.85rem", fontWeight: 600 }}>
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </Box>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Trust & Escrow Guarantee Box */}
      <Box sx={{ p: 2, backgroundColor: "#FAF7F2", borderRadius: 2, border: "1px solid #ECE4D8" }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "#9A6F2D", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <VerifiedUserOutlinedIcon sx={{ fontSize: 16 }} />
          1-GRAM GOLD PROMISE
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "0.78rem", color: "#6C665D", lineHeight: 1.45, mb: 1.2 }}>
          • Micro gold electroplated for authentic heritage glow under photography lights.
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "0.78rem", color: "#6C665D", lineHeight: 1.45, mb: 1.2 }}>
          • Ultrasonically sanitized and UV-cleaned prior to every booking dispatch.
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "0.78rem", color: "#6C665D", lineHeight: 1.45 }}>
          • 100% refundable security deposit held safely in escrow until return.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FCFAF7" }}>
      <ResponsiveAppBar />

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="xl">
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ color: "rgba(255,255,255,0.7)", mb: 2, fontSize: "0.82rem" }}>
            <MuiLink underline="hover" color="inherit" onClick={() => navigate("/")} sx={{ cursor: "pointer" }}>
              Home
            </MuiLink>
            <Typography color="#D1A362" sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
              Bridal Jewellery
            </Typography>
          </Breadcrumbs>

          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={3}>
            <Box sx={{ maxWidth: "780px" }}>
              <Chip
                icon={<DiamondOutlinedIcon sx={{ fontSize: 15, color: "#D1A362 !important" }} />}
                label="PEER-TO-PEER BRIDAL JEWELLERY RENTALS"
                sx={{
                  backgroundColor: "rgba(209, 163, 98, 0.16)",
                  color: "#D1A362",
                  border: "1px solid rgba(209, 163, 98, 0.4)",
                  fontWeight: 800,
                  fontSize: "0.74rem",
                  letterSpacing: "0.08em",
                  mb: 1.5,
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Playfair Display", "Georgia", serif',
                  fontWeight: 700,
                  fontSize: { xs: "2.1rem", sm: "2.8rem" },
                  lineHeight: 1.2,
                  mb: 1.5,
                  textShadow: "0 2px 10px rgba(0,0,0,0.4)"
                }}
              >
                Heritage 1-Gram Gold & Bridal Jewellery.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#E2DACB",
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  lineHeight: 1.6,
                }}
              >
                Rent authentic Nakshi Temple sets, royal Kundan & Jadau chokers, and sparkling American Diamond suites for Hindu weddings, Muhurtham, and Engagements at a fraction of purchase cost.
              </Typography>
            </Box>

            {/* Quick trust metrics */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                backgroundColor: "rgba(0,0,0,0.35)",
                p: 2,
                borderRadius: 2,
                border: "1px solid rgba(209, 163, 98, 0.25)",
                backdropFilter: "blur(6px)"
              }}
            >
              <Box sx={{ textAlign: "center", px: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#D1A362" }}>50+</Typography>
                <Typography variant="caption" sx={{ color: "#E0D7C9" }}>Bridal Sets</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
              <Box sx={{ textAlign: "center", px: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#D1A362" }}>100%</Typography>
                <Typography variant="caption" sx={{ color: "#E0D7C9" }}>Sanitized UV</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.15)" }} />
              <Box sx={{ textAlign: "center", px: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#D1A362" }}>Zero</Typography>
                <Typography variant="caption" sx={{ color: "#E0D7C9" }}>Deposit Loss</Typography>
              </Box>
            </Box>
          </Stack>
        </Container>
      </HeroSection>

      {/* Horizontal Category Pill Bar */}
      <Box sx={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #ECE7DE", py: 2 }}>
        <Container maxWidth="xl">
          <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 0.5, "::-webkit-scrollbar": { display: "none" } }}>
            {JEWELLERY_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.key}
                selected={selectedStyle === cat.key}
                onClick={() => handleStyleChange(cat.key)}
                label={`${cat.icon} ${cat.label}`}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
        {/* Controls Toolbar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
            p: 2,
            backgroundColor: "#FFFFFF",
            borderRadius: 2,
            border: "1px solid #ECE7DE"
          }}
        >
          {/* Search Input */}
          <TextField
            size="small"
            placeholder="Search temple gold, kundan choker, mathapatti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: "360px" } }}
          />

          {/* Right Action Stack */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Mobile Filter Button */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => setMobileDrawerOpen(true)}
              startIcon={<FilterListIcon />}
              sx={{
                display: { xs: "flex", md: "none" },
                borderColor: "#D1A362",
                color: "#1A1817",
                textTransform: "none",
                fontWeight: 700
              }}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>

            {/* Sort Dropdown */}
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="recommended">Recommended</MenuItem>
                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Layout with Sidebar & Products Grid */}
        <Stack direction="row" spacing={4} alignItems="flex-start">
          {/* Desktop Filter Sidebar */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: "280px",
              flexShrink: 0,
              backgroundColor: "#FFFFFF",
              borderRadius: 2,
              border: "1px solid #ECE7DE",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              position: "sticky",
              top: 90
            }}
          >
            {filterSidebarContent}
          </Box>

          {/* Product Grid Area */}
          <Box sx={{ flex: 1, width: "100%" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px" }}>
                <CircularProgress sx={{ color: "#D1A362" }} />
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 2,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 2,
                  border: "1px solid #ECE7DE"
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "#1A1817" }}>
                  No matching jewellery found
                </Typography>
                <Typography variant="body2" sx={{ color: "#777", mb: 3 }}>
                  Try adjusting your price range, ceremony filter, or search keywords.
                </Typography>
                <Button variant="contained" onClick={handleResetFilters} sx={{ backgroundColor: "#D1A362", color: "#1A1817", fontWeight: 700 }}>
                  Reset All Filters
                </Button>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#777", fontWeight: 600 }}>
                    Showing <strong>{filteredItems.length}</strong> authenticated bridal jewellery sets
                  </Typography>
                </Box>
                <ProductsGrid>
                  {filteredItems.map((item) => (
                    <ProductCard key={item._id} dress={item} />
                  ))}
                </ProductsGrid>
              </>
            )}
          </Box>
        </Stack>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{ sx: { width: "300px" } }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ECE7DE" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Filters</Typography>
          <IconButton size="small" onClick={() => setMobileDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        {filterSidebarContent}
      </Drawer>

      <Fotter />
    </Box>
  );
};

export default Jewellery;
