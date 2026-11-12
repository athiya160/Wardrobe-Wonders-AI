import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import WardrobeWondersLogo from "./WardrobeWondersLogo";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { styled } from "@mui/material/styles";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Badge from "@mui/material/Badge";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import StoreIcon from "@mui/icons-material/Store";
import Collapse from "@mui/material/Collapse";
import CloseIcon from "@mui/icons-material/Close";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: 8,
  backgroundColor: "#FAFAFA",
  "&:hover": {
    backgroundColor: "#F5F5F5",
  },
  marginRight: theme.spacing(1.5),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(2),
    width: "auto",
  },
  border: "1px solid #ECE7DE",
  transition: "all 0.2s ease",
  "&:focus-within": {
    borderColor: "#D1A362",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 0 0 2px rgba(209, 163, 98, 0.15)",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 1.5),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  fontSize: "0.88rem",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(3)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "280px",
    },
    [theme.breakpoints.up("lg")]: {
      width: "340px",
    },
  },
}));

function ResponsiveAppBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isStoreMode = location.pathname.startsWith("/store");

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  const [cartItems, setCartItems] = React.useState([]);
  const [storeCartCount, setStoreCartCount] = React.useState(0);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishlistOpen, setWishlistOpen] = React.useState(false);
  const [wishlistItems, setWishlistItems] = React.useState([]);

  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const [token, setToken] = React.useState(() => localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(cart);
    };
    const updateStoreCart = async () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        try {
          const res = await axios.get(`${BASE_URL}/store/cart`, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (res.data?.success && res.data.cart) {
            setStoreCartCount(res.data.cart.itemCount || 0);
            return;
          }
        } catch {
          // ignore
        }
      }
      setStoreCartCount(0);
    };
    const updateWishlist = async () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        try {
          const res = await axios.get(`${BASE_URL}/user/wishlist`, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (res.data?.success && Array.isArray(res.data.wishlist)) {
            setWishlistItems(res.data.wishlist);
            localStorage.setItem("wishlist", JSON.stringify(res.data.wishlist));
            return;
          }
        } catch {
          // Fall back to localStorage
        }
      }
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistItems(wishlist);
    };
    const updateAuth = () => {
      setToken(localStorage.getItem("token"));
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setCurrentUser(null);
      }
    };

    updateCart();
    updateStoreCart();
    updateWishlist();
    updateAuth();

    window.addEventListener("cart_updated", updateCart);
    window.addEventListener("store_cart_updated", updateStoreCart);
    window.addEventListener("wishlist_updated", updateWishlist);
    window.addEventListener("auth_updated", updateAuth);
    window.addEventListener("storage", updateAuth);
    return () => {
      window.removeEventListener("cart_updated", updateCart);
      window.removeEventListener("store_cart_updated", updateStoreCart);
      window.removeEventListener("wishlist_updated", updateWishlist);
      window.removeEventListener("auth_updated", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_addresses");
    localStorage.removeItem("wishlist");
    window.dispatchEvent(new Event("auth_updated"));
    window.dispatchEvent(new Event("wishlist_updated"));
    setUserMenuAnchor(null);
    navigate("/");
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cart_updated"));
  };

  const handleRemoveFromWishlist = async (id) => {
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      try {
        await axios.delete(`${BASE_URL}/user/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err) {
        console.error("Failed to delete wishlist item on server:", err);
      }
    }
    let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    wishlist = wishlist.filter((item) => (item._id || item) !== id);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("wishlist_updated"));
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (isStoreMode) {
        navigate(`/store?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const totalCartPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  // Categories configuration for desktop sub-bar
  const subCategories = [
    {
      label: "Women",
      path: isStoreMode ? "/store?category=Women" : "/w-dress",
    },
    {
      label: "Men",
      path: isStoreMode ? "/store?category=Men" : "/m-dress",
    },
    {
      label: "Dresses",
      path: isStoreMode ? "/store?category=Dresses" : "/w-dress?category=Dresses",
    },
    {
      label: "Jewellery",
      path: isStoreMode ? "/store?category=Jewellery" : "/jewellery",
      badge: "1-Gram Gold",
    },
    {
      label: "Accessories",
      path: "/store?category=Accessories",
    },
    {
      label: "Footwear",
      path: "/store?category=Footwear",
    },
    {
      label: "Pre-loved / Vintage",
      path: "/store?condition=PRE_OWNED",
      badge: "Shop",
    },
    {
      label: "AI Stylist",
      path: "/stylist",
      isAi: true,
    },
    {
      label: "Atelier",
      path: "/about-us",
    },
  ];

  return (
    <>
      {/* Top Editorial Luxury Strip */}
      <Box
        sx={{
          backgroundColor: "#1A1817",
          color: "#E2DACB",
          py: 0.6,
          px: 2,
          textAlign: "center",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderBottom: "1px solid rgba(209, 163, 98, 0.25)",
          display: { xs: "none", sm: "block" },
        }}
      >
        Authenticated Bridal Couture & 1-Gram Gold Jewellery • Doorstep Delivery & Refundable Security Deposit
      </Box>

      {/* Main Top Navigation Header */}
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: "#FFFFFF",
          color: "#1A1817",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          borderBottom: "1px solid #ECE7DE",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: "62px !important", md: "74px !important" },
              px: { xs: 1, sm: 2 },
              justifyContent: "space-between",
            }}
          >
            {/* Left: Mobile Menu Button & Brand Logo */}
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="medium"
                onClick={() => setMobileMenuOpen(true)}
                color="inherit"
                sx={{ display: { xs: "inline-flex", md: "none" } }}
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </IconButton>

              <Box
                component={RouterLink}
                to="/"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  mr: { xs: 1, md: 3 },
                }}
              >
                <WardrobeWondersLogo size="small" />
              </Box>

              {/* Primary Experience Mode Switcher (RENT vs BUY / STORE) */}
              <Box
                sx={{
                  display: { xs: "none", md: "inline-flex" },
                  p: 0.4,
                  backgroundColor: "#F7F5F0",
                  borderRadius: 2.5,
                  border: "1px solid #ECE7DE",
                }}
              >
                <Button
                  onClick={() => navigate("/")}
                  size="small"
                  startIcon={<CheckroomIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    letterSpacing: "0.05em",
                    borderRadius: 2,
                    textTransform: "none",
                    px: 2,
                    py: 0.6,
                    backgroundColor: !isStoreMode ? "#1A1817" : "transparent",
                    color: !isStoreMode ? "#FFFFFF" : "#6E685F",
                    boxShadow: !isStoreMode ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: !isStoreMode ? "#2C2825" : "rgba(209, 163, 98, 0.12)",
                      color: !isStoreMode ? "#FFFFFF" : "#1A1817",
                    },
                  }}
                >
                  RENT
                </Button>

                <Button
                  onClick={() => navigate("/store")}
                  size="small"
                  startIcon={<StoreIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    letterSpacing: "0.05em",
                    borderRadius: 2,
                    textTransform: "none",
                    px: 2,
                    py: 0.6,
                    backgroundColor: isStoreMode ? "#9C7238" : "transparent",
                    color: isStoreMode ? "#FFFFFF" : "#6E685F",
                    boxShadow: isStoreMode ? "0 2px 8px rgba(156, 114, 56, 0.25)" : "none",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: isStoreMode ? "#855E2B" : "rgba(209, 163, 98, 0.12)",
                      color: isStoreMode ? "#FFFFFF" : "#1A1817",
                    },
                  }}
                >
                  BUY / STORE
                </Button>
              </Box>
            </Box>

            {/* Center: Search Field */}
            <Search sx={{ display: { xs: "none", md: "block" } }}>
              <SearchIconWrapper>
                <SearchIcon sx={{ color: "#9E9E9E", fontSize: "1.15rem" }} />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder={
                  isStoreMode
                    ? "Search verified boutique store products & brands..."
                    : "Search bridal lehengas, 1-gram gold, tuxedos..."
                }
                inputProps={{ "aria-label": "search catalog" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </Search>

            {/* Right: Actions, Bags, and User Profile */}
            <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1.2 }}>
              {/* Mobile Search Toggle */}
              <IconButton
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                sx={{ display: { xs: "inline-flex", md: "none" }, color: mobileSearchOpen ? "#D1A362" : "#1A1817" }}
                aria-label="Toggle search"
              >
                <SearchIcon fontSize="small" />
              </IconButton>

              {/* Wishlist */}
              <Tooltip title="Saved Wishlist">
                <IconButton onClick={() => setWishlistOpen(true)} sx={{ color: "#1A1817", "&:hover": { color: "#D1A362" } }}>
                  <FavoriteBorderIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Rental Bag (Separate) */}
              <Tooltip title="Rental Bookings Cart">
                <IconButton
                  onClick={() => setCartOpen(true)}
                  sx={{ color: "#1A1817", "&:hover": { color: "#D1A362" } }}
                  aria-label="Rental Cart"
                >
                  <Badge badgeContent={cartItems.length} sx={{ "& .MuiBadge-badge": { backgroundColor: "#1A1817", color: "#FFF" } }}>
                    <LocalMallOutlinedIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Store Shopping Bag (Separate) */}
              <Tooltip title="Store Shopping Bag">
                <IconButton
                  onClick={() => navigate("/store/cart")}
                  sx={{ color: "#1A1817", "&:hover": { color: "#9C7238" } }}
                  aria-label="Store Shopping Bag"
                >
                  <Badge
                    badgeContent={storeCartCount}
                    sx={{
                      "& .MuiBadge-badge": {
                        backgroundColor: "#9C7238",
                        color: "#FFFFFF",
                        fontWeight: 800,
                      },
                    }}
                  >
                    <StorefrontOutlinedIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Authenticated User or Login/Signup Actions */}
              {token && currentUser ? (
                <Box display="flex" alignItems="center" sx={{ ml: 0.5 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.8}
                    sx={{
                      cursor: "pointer",
                      px: 1.2,
                      py: 0.5,
                      borderRadius: 2,
                      backgroundColor: "#F9F8F6",
                      border: "1px solid #ECE7DE",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#D1A362",
                        backgroundColor: "#F5EFE6",
                      },
                    }}
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "#1A1817",
                        color: "#D1A362",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                      }}
                    >
                      {currentUser?.firstname ? currentUser.firstname[0].toUpperCase() : "U"}
                    </Avatar>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        color: "#1A1817",
                        fontSize: "0.85rem",
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      {currentUser?.firstname || "Account"}
                    </Typography>
                    <KeyboardArrowDownIcon fontSize="small" sx={{ color: "#666" }} />
                  </Box>

                  {/* User Dropdown Menu */}
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        minWidth: 240,
                        borderRadius: 2.5,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                        border: "1px solid #ECE7DE",
                        py: 1,
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1A1817" }}>
                        {currentUser?.name || `${currentUser?.firstname || ""} ${currentUser?.lastname || ""}`.trim() || "User"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#777", display: "block", mb: 0.8 }}>
                        {currentUser?.email}
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          currentUser?.role === "admin"
                            ? "Platform Admin"
                            : currentUser?.role === "seller"
                            ? "Verified Seller"
                            : currentUser?.role === "provider"
                            ? "Boutique Partner"
                            : "Verified Customer"
                        }
                        sx={{
                          fontSize: "0.68rem",
                          height: 20,
                          fontWeight: 700,
                          bgcolor:
                            currentUser?.role === "admin"
                              ? "#7A1C1C"
                              : currentUser?.role === "seller"
                              ? "#9C7238"
                              : currentUser?.role === "provider"
                              ? "#A07028"
                              : "#1A1817",
                          color: "#FFF",
                        }}
                      />
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/profile"); }}>
                      <Typography variant="body2">My Account Profile</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/my-rentals"); }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#9C7238" }}>
                        My Rentals & Bookings
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/store/orders"); }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        My Store Purchases
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/store/cart"); }}>
                      <Typography variant="body2">Store Bag ({storeCartCount})</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/store/become-seller"); }}>
                      <Typography variant="body2">Seller Hub / My Store</Typography>
                    </MenuItem>
                    {(currentUser?.role === "provider" || currentUser?.role === "admin") && (
                      <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/provider-dashboard"); }}>
                        <Typography variant="body2" color="#A07028" fontWeight={600}>
                          Provider Studio
                        </Typography>
                      </MenuItem>
                    )}
                    {currentUser?.role === "admin" && (
                      <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/admin"); }}>
                        <Typography variant="body2" color="#7A1C1C" fontWeight={600}>
                          Admin Console
                        </Typography>
                      </MenuItem>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleLogout} sx={{ color: "#D32F2F" }}>
                      <Typography variant="body2" fontWeight={600}>Sign Out</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    onClick={() => navigate("/login")}
                    sx={{
                      color: "#1A1817",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      px: 1.5,
                      py: 0.6,
                      borderRadius: 1.5,
                      "&:hover": { color: "#D1A362", backgroundColor: "rgba(209, 163, 98, 0.08)" },
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/signup")}
                    sx={{
                      bgcolor: "#1A1817",
                      color: "#FFFFFF",
                      border: "1px solid #1A1817",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      px: 2,
                      py: 0.6,
                      borderRadius: 1.5,
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#2C2825",
                        borderColor: "#D1A362",
                      },
                    }}
                  >
                    Join
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>

          {/* Mobile Search Input Drawer Bar */}
          <Collapse in={mobileSearchOpen}>
            <Box sx={{ pb: 1.5, pt: 0.5, display: { xs: "block", md: "none" } }}>
              <Search sx={{ mr: 0 }}>
                <SearchIconWrapper>
                  <SearchIcon sx={{ color: "#9E9E9E", fontSize: "1.1rem" }} />
                </SearchIconWrapper>
                <StyledInputBase
                  fullWidth
                  placeholder={
                    isStoreMode
                      ? "Search verified boutique store..."
                      : "Search bridal lehengas, 1-gram gold, tuxedos..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </Search>
            </Box>
          </Collapse>
        </Container>

        {/* Desktop Category Sub-Navigation Strip */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            borderTop: "1px solid #F0ECE4",
            backgroundColor: "#FCFAF7",
            py: 0.8,
          }}
        >
          <Container maxWidth="xl">
            <Box display="flex" alignItems="center" justifyContent="center" gap={1.2}>
              {subCategories.map((cat) => (
                <Button
                  key={cat.label}
                  onClick={() => navigate(cat.path)}
                  sx={{
                    color: "#3A3631",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.84rem",
                    letterSpacing: "0.02em",
                    px: 1.4,
                    py: 0.4,
                    borderRadius: 1.5,
                    "&:hover": {
                      color: isStoreMode ? "#9C7238" : "#A07028",
                      backgroundColor: "rgba(209, 163, 98, 0.08)",
                    },
                  }}
                >
                  {cat.label}
                  {cat.badge && (
                    <Chip
                      label={cat.badge}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        bgcolor: "#D1A362",
                        color: "#1A1817",
                        ml: 0.8,
                        px: 0.2,
                      }}
                    />
                  )}
                  {cat.isAi && <AutoAwesomeIcon sx={{ fontSize: 13, color: "#D1A362", ml: 0.6 }} />}
                </Button>
              ))}
            </Box>
          </Container>
        </Box>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: { width: "300px", p: 2.5, backgroundColor: "#FAF8F5", color: "#1A1817" },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <WardrobeWondersLogo size="small" />
          <IconButton size="small" onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Primary Sections Toggle on Mobile */}
        <Stack spacing={1} mb={2.5}>
          <Typography variant="caption" sx={{ color: "#9E978E", fontWeight: 800, letterSpacing: "0.08em" }}>
            MARKETPLACE SECTIONS
          </Typography>
          <Button
            fullWidth
            variant={!isStoreMode ? "contained" : "outlined"}
            startIcon={<CheckroomIcon />}
            onClick={() => { setMobileMenuOpen(false); navigate("/"); }}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: !isStoreMode ? "#1A1817" : "transparent",
              color: !isStoreMode ? "#FFF" : "#1A1817",
              borderColor: "#1A1817",
            }}
          >
            RENT COUTURE
          </Button>
          <Button
            fullWidth
            variant={isStoreMode ? "contained" : "outlined"}
            startIcon={<StoreIcon />}
            onClick={() => { setMobileMenuOpen(false); navigate("/store"); }}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: isStoreMode ? "#9C7238" : "transparent",
              color: isStoreMode ? "#FFF" : "#9C7238",
              borderColor: "#9C7238",
            }}
          >
            BUY / STORE
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Categories List */}
        <Typography variant="caption" sx={{ color: "#9E978E", fontWeight: 800, letterSpacing: "0.08em", mb: 1, display: "block" }}>
          DEPARTMENTS & CATEGORIES
        </Typography>
        <List dense sx={{ p: 0 }}>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate(isStoreMode ? "/store?category=Women" : "/w-dress"); }}>
            <ListItemText primary="Women's Couture" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
          </ListItem>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate(isStoreMode ? "/store?category=Men" : "/m-dress"); }}>
            <ListItemText primary="Men's Tailoring & Sherwanis" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
          </ListItem>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate(isStoreMode ? "/store?category=Dresses" : "/w-dress?category=Dresses"); }}>
            <ListItemText primary="Dresses & Evening Gowns" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
          </ListItem>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate(isStoreMode ? "/store?category=Jewellery" : "/jewellery"); }}>
            <ListItemText primary="Bridal & 1-Gram Gold Jewellery" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem", color: "#9C7238" }} />
          </ListItem>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate("/store?category=Accessories"); }}>
            <ListItemText primary="Accessories" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
          </ListItem>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate("/store?category=Footwear"); }}>
            <ListItemText primary="Footwear & Juttis" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
          </ListItem>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate("/store?condition=PRE_OWNED"); }}>
            <ListItemText primary="Pre-loved / Vintage Collection" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
          </ListItem>
          <ListItem button onClick={() => { setMobileMenuOpen(false); navigate("/stylist"); }}>
            <ListItemText primary="✨ AI Fashion Stylist" primaryTypographyProps={{ fontWeight: 700, fontSize: "0.9rem", color: "#D1A362" }} />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        {/* User Account / Auth Actions */}
        {token && currentUser ? (
          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: "#9E978E", fontWeight: 800 }}>
              SIGNED IN AS {currentUser?.firstname?.toUpperCase() || "USER"}
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}
              sx={{ textTransform: "none", color: "#1A1817", borderColor: "#DDD" }}
            >
              My Account Profile
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => { setMobileMenuOpen(false); navigate("/my-rentals"); }}
              sx={{ textTransform: "none", color: "#9C7238", borderColor: "#D1A362" }}
            >
              My Rentals
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => { setMobileMenuOpen(false); navigate("/store/orders"); }}
              sx={{ textTransform: "none", color: "#1A1817", borderColor: "#DDD" }}
            >
              My Store Purchases
            </Button>
            <Button
              fullWidth
              color="error"
              size="small"
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Sign Out
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
              sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700, textTransform: "none" }}
            >
              Log In
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { setMobileMenuOpen(false); navigate("/signup"); }}
              sx={{ borderColor: "#D1A362", color: "#9C7238", fontWeight: 700, textTransform: "none" }}
            >
              Join Wardrobe Wonders
            </Button>
          </Stack>
        )}
      </Drawer>

      {/* Rental Cart Slide-out Drawer */}
      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: "400px" }, p: 3, backgroundColor: "#FAF8F5" },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalMallOutlinedIcon sx={{ color: "#1A1817" }} />
            <Typography variant="h6" fontWeight={700}>
              Rental Bookings Bag ({cartItems.length})
            </Typography>
          </Box>
          <IconButton onClick={() => setCartOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {cartItems.length === 0 ? (
          <Box textAlign="center" py={8}>
            <LocalMallOutlinedIcon sx={{ fontSize: 60, color: "#DDD", mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Your rental cart is empty.
            </Typography>
            <Button
              variant="contained"
              onClick={() => { setCartOpen(false); navigate("/w-dress"); }}
              sx={{ bgcolor: "#1A1817", color: "#D1A362", mt: 2, textTransform: "none" }}
            >
              Browse Rental Couture
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" height="100%">
            <List sx={{ flexGrow: 1, overflowY: "auto" }}>
              {cartItems.map((item, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleRemoveFromCart(index)} size="small">
                      <DeleteOutlineIcon />
                    </IconButton>
                  }
                  sx={{ borderBottom: "1px solid #ECE7DE", py: 1.5 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={item.image || "/assets/Women/bridal_01.png"}
                      sx={{ width: 50, height: 60, mr: 1 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.name}
                    secondary={`₹${Number(item.price || 0).toLocaleString("en-IN")} / rental`}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }}
                  />
                </ListItem>
              ))}
            </List>
            <Box pt={2} borderTop="1px solid #ECE7DE">
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1" fontWeight={700}>Subtotal</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#1A1817">
                  ₹{totalCartPrice.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setCartOpen(false);
                  if (cartItems.length > 0 && cartItems[0]._id) {
                    navigate(`/checkout/address/${cartItems[0]._id}`);
                  }
                }}
                sx={{ bgcolor: "#1A1817", color: "#FFFFFF", py: 1.2, fontWeight: 700 }}
              >
                Proceed to Checkout
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Wishlist Slide-out Drawer */}
      <Drawer
        anchor="right"
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: "400px" }, p: 3, backgroundColor: "#FAF8F5" },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FavoriteBorderIcon sx={{ color: "#E53935" }} />
            <Typography variant="h6" fontWeight={700}>
              Saved Wishlist ({wishlistItems.length})
            </Typography>
          </Box>
          <IconButton onClick={() => setWishlistOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {wishlistItems.length === 0 ? (
          <Box textAlign="center" py={8}>
            <FavoriteBorderIcon sx={{ fontSize: 60, color: "#DDD", mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No saved items yet.
            </Typography>
          </Box>
        ) : (
          <List sx={{ overflowY: "auto" }}>
            {wishlistItems.map((item, index) => (
              <ListItem
                key={item._id || index}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemoveFromWishlist(item._id || item)} size="small">
                    <DeleteOutlineIcon />
                  </IconButton>
                }
                sx={{ borderBottom: "1px solid #ECE7DE", py: 1.5 }}
              >
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    src={item.image || (item.images && item.images[0]) || "/assets/Women/bridal_01.png"}
                    sx={{ width: 50, height: 60, mr: 1 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={item.name || item.title}
                  secondary={`₹${Number(item.price || 0).toLocaleString("en-IN")}`}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Drawer>
    </>
  );
}

export default ResponsiveAppBar;
