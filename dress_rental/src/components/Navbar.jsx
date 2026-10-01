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
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { styled, alpha } from "@mui/material/styles";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GitHubIcon from '@mui/icons-material/GitHub';
import AuthModal from './AuthModal';
import { RecruiterTourModal } from './RecruiterTourModal';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 4,
  backgroundColor: "#FAFAFA",
  '&:hover': {
    backgroundColor: "#F5F5F5",
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  border: "1px solid #E0E0E0",
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  fontSize: '0.9rem',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '350px',
    },
  },
}));

const pages = [
  { name: "AI Stylist ✨", path: "/stylist" },
  { name: "Men's", path: "/m-dress" },
  { name: "Women's", path: "/w-dress" },
  { name: "About Us", path: "/about-us" },
  { name: "Contact", path: "/contact" },
];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = useNavigate();

  const [cartItems, setCartItems] = React.useState([]);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishlistOpen, setWishlistOpen] = React.useState(false);
  const [wishlistItems, setWishlistItems] = React.useState([]);

  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authModalTab, setAuthModalTab] = React.useState("login");
  const [recruiterTourOpen, setRecruiterTourOpen] = React.useState(false);
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
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
    };
    const updateWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
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
    updateWishlist();
    updateAuth();
    
    window.addEventListener('cart_updated', updateCart);
    window.addEventListener('wishlist_updated', updateWishlist);
    window.addEventListener('auth_updated', updateAuth);
    window.addEventListener('storage', updateAuth);
    return () => {
      window.removeEventListener('cart_updated', updateCart);
      window.removeEventListener('wishlist_updated', updateWishlist);
      window.removeEventListener('auth_updated', updateAuth);
      window.removeEventListener('storage', updateAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth_updated"));
    setUserMenuAnchor(null);
    navigate("/");
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart_updated'));
  };

  const handleRemoveFromWishlist = (id) => {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    wishlist = wishlist.filter(item => item._id !== id);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlist_updated'));
  };

  const handleOpenNavMenu = (event) => setAnchorElNav(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const totalCartPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: '#FFFFFF', color: '#1A1A1A', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '80px !important' }}>
            <Box component="a" href="/" sx={{ mr: 4, display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
            </Box>

            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{ display: { xs: "block", md: "none" } }}
              >
                {/* Mobile Recruiter Quick Tour Action */}
                <MenuItem
                  onClick={() => {
                    handleCloseNavMenu();
                    setRecruiterTourOpen(true);
                  }}
                  aria-label="Open Recruiter Quick Tour and System Specifications"
                  sx={{
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    borderRadius: 1.5,
                    mx: 1,
                    mb: 1.5,
                    py: 1,
                    "&:hover": { bgcolor: "#2C2825" },
                    "&:focus-visible": { outline: "2px solid #D1A362" },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" width="100%" justifyContent="center">
                    <AutoAwesomeIcon sx={{ fontSize: 18, color: "#D1A362" }} />
                    <Typography textAlign="center" fontWeight={800} fontSize="0.88rem" color="#D1A362">
                      Recruiter Quick Tour ⚙️
                    </Typography>
                  </Stack>
                </MenuItem>

                {pages.map((page) => (
                  <MenuItem onClick={() => { handleCloseNavMenu(); navigate(page.path); }} key={page.name}>
                    <Typography textAlign="center">{page.name}</Typography>
                  </MenuItem>
                ))}
                <Divider sx={{ my: 1 }} />
                {token && currentUser ? (
                  <>
                    <MenuItem onClick={() => { handleCloseNavMenu(); navigate("/profile"); }}>
                      <Typography textAlign="center" fontWeight={600}>My Profile ({currentUser?.firstname || "User"})</Typography>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleCloseNavMenu();
                        navigate(currentUser?.role === "provider" ? "/provider-dashboard" : "/my-rentals");
                      }}
                    >
                      <Typography textAlign="center" fontWeight={700} color="#D1A362">
                        {currentUser?.role === "provider" ? "Provider Studio" : "My Rentals"}
                      </Typography>
                    </MenuItem>
                    {currentUser?.role === "admin" && (
                      <MenuItem onClick={() => { handleCloseNavMenu(); navigate("/admin"); }}>
                        <Typography textAlign="center" fontWeight={700} color="#7A1C1C">Admin Console</Typography>
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => { handleCloseNavMenu(); handleLogout(); }}>
                      <Typography textAlign="center" color="error.main" fontWeight={600}>Sign Out</Typography>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => { handleCloseNavMenu(); setAuthModalTab("login"); setAuthModalOpen(true); }}>
                      <Typography textAlign="center" fontWeight={600}>Log In</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { handleCloseNavMenu(); setAuthModalTab("signup"); setAuthModalOpen(true); }}>
                      <Typography textAlign="center" fontWeight={700} color="#D1A362">Sign Up / Join</Typography>
                    </MenuItem>
                  </>
                )}
              </Menu>
            </Box>

            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 2 }}>
              {pages.map((page) => (
                <Button key={page.name} onClick={() => navigate(page.path)} sx={{ color: "#1A1A1A", display: "block", textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', '&:hover': { color: '#D1A362', backgroundColor: 'transparent' } }}>
                  {page.name}
                </Button>
              ))}
            </Box>

            <Search>
              <SearchIconWrapper>
                <SearchIcon sx={{ color: '#9e9e9e', fontSize: '1.2rem' }} />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Ask AI (e.g. Red wedding dress under 3000)"
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </Search>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
              <IconButton onClick={() => setWishlistOpen(true)} sx={{ color: '#1A1A1A', '&:hover': { color: '#D1A362' } }}>
                <FavoriteBorderIcon />
              </IconButton>
              <IconButton onClick={() => setCartOpen(true)} sx={{ color: '#1A1A1A', '&:hover': { color: '#D1A362' } }}>
                <Badge badgeContent={cartItems.length} sx={{ '& .MuiBadge-badge': { backgroundColor: '#1A1A1A', color: '#FFF' } }}>
                  <LocalMallOutlinedIcon />
                </Badge>
              </IconButton>

              {/* Desktop Recruiter Quick Tour Action */}
              <Button
                variant="contained"
                size="small"
                onClick={() => setRecruiterTourOpen(true)}
                startIcon={<AutoAwesomeIcon sx={{ color: "#D1A362", fontSize: "1.05rem" }} />}
                aria-label="Open Recruiter Quick Tour and System Specifications"
                sx={{
                  bgcolor: "#1A1817",
                  color: "#FFFFFF",
                  border: "1px solid #D1A362",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  textTransform: "none",
                  borderRadius: 1.8,
                  px: 1.6,
                  py: 0.6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  display: { xs: "none", lg: "inline-flex" },
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "#2C2825",
                    borderColor: "#E5C287",
                    boxShadow: "0 4px 14px rgba(209, 163, 98, 0.3)",
                    transform: "translateY(-1px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #D1A362",
                    outlineOffset: "2px",
                  },
                }}
              >
                Recruiter Tour ⚙️
              </Button>

              {/* Compact Recruiter Tour for Medium Viewports */}
              <Tooltip title="Recruiter Quick Tour & Architecture Specs">
                <IconButton
                  onClick={() => setRecruiterTourOpen(true)}
                  aria-label="Open Recruiter Quick Tour and System Specifications"
                  sx={{
                    display: { xs: "none", md: "inline-flex", lg: "none" },
                    color: "#A07028",
                    border: "1px solid #D1A362",
                    borderRadius: 1.8,
                    p: 0.8,
                    bgcolor: "#FAF8F5",
                    "&:hover": { bgcolor: "#F5EFE6" },
                    "&:focus-visible": { outline: "2px solid #D1A362", outlineOffset: "2px" },
                  }}
                >
                  <AutoAwesomeIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Direct GitHub Source Link */}
              <Tooltip title="View Verified Source Code on GitHub">
                <IconButton
                  component="a"
                  href="https://github.com/athiya160/Wardrobe-Wonders-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View verified source code on GitHub"
                  sx={{
                    color: "#4A4A4A",
                    display: { xs: "none", xl: "inline-flex" },
                    "&:hover": { color: "#1A1A1A" },
                    "&:focus-visible": { outline: "2px solid #D1A362", outlineOffset: "2px" },
                  }}
                >
                  <GitHubIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {token && currentUser ? (
                <Box display="flex" alignItems="center" gap={1.5} sx={{ ml: 1 }}>
                  {currentUser?.role === 'provider' ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate("/provider-dashboard")}
                      sx={{
                        borderColor: "#D1A362",
                        color: "#A07028",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        textTransform: "none",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.4,
                        display: { xs: "none", sm: "inline-flex" },
                        "&:hover": { backgroundColor: "rgba(209, 163, 98, 0.1)", borderColor: "#D1A362" }
                      }}
                    >
                      Provider Studio
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate("/my-rentals")}
                      sx={{
                        borderColor: "#1A1817",
                        color: "#1A1817",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        textTransform: "none",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.4,
                        display: { xs: "none", sm: "inline-flex" },
                        "&:hover": { backgroundColor: "#F5F5F5", borderColor: "#1A1817" }
                      }}
                    >
                      My Rentals
                    </Button>
                  )}

                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.8}
                    sx={{
                      cursor: 'pointer',
                      px: 1.5,
                      py: 0.6,
                      borderRadius: 2,
                      backgroundColor: "#F9F8F6",
                      border: "1px solid #E8E3D9",
                      transition: "all 0.2s ease",
                      '&:hover': {
                        borderColor: '#D1A362',
                        backgroundColor: '#F5EFE6',
                      }
                    }}
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  >
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        bgcolor: '#1A1817',
                        color: '#D1A362',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {currentUser?.firstname ? currentUser.firstname[0].toUpperCase() : "U"}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1A1817', fontSize: '0.85rem' }}>
                      {currentUser?.firstname || "Account"}
                    </Typography>
                    <KeyboardArrowDownIcon fontSize="small" sx={{ color: '#666' }} />
                  </Box>

                  {/* Luxury User Dropdown Menu */}
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        minWidth: 230,
                        borderRadius: 2,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                        border: "1px solid #E8E3D9",
                        py: 1,
                      }
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1A1817' }}>
                        {currentUser?.name || `${currentUser?.firstname || ''} ${currentUser?.lastname || ''}`.trim() || "User"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.8 }}>
                        {currentUser?.email}
                      </Typography>
                      <Chip
                        size="small"
                        label={currentUser?.role === 'admin' ? 'Platform Admin' : currentUser?.role === 'provider' ? 'Boutique Partner' : 'Customer Member'}
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          fontWeight: 700,
                          bgcolor: currentUser?.role === 'admin' ? '#7A1C1C' : currentUser?.role === 'provider' ? '#A07028' : '#1A1817',
                          color: '#FFF'
                        }}
                      />
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/profile"); }}>
                      <Typography variant="body2">My Profile</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/my-rentals"); }}>
                      <Typography variant="body2">My Rentals & Bookings</Typography>
                    </MenuItem>
                    {(currentUser?.role === 'provider' || currentUser?.role === 'admin') && (
                      <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/provider-dashboard"); }}>
                        <Typography variant="body2" color="#A07028" fontWeight={600}>Provider Studio</Typography>
                      </MenuItem>
                    )}
                    {currentUser?.role === 'admin' && (
                      <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/admin"); }}>
                        <Typography variant="body2" color="#7A1C1C" fontWeight={600}>Admin Console</Typography>
                      </MenuItem>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleLogout} sx={{ color: '#D32F2F' }}>
                      <Typography variant="body2" fontWeight={600}>Sign Out</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={1.2} sx={{ ml: 1 }}>
                  <Button
                    onClick={() => {
                      setAuthModalTab("login");
                      setAuthModalOpen(true);
                    }}
                    startIcon={<PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      color: "#1A1817",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      px: 1.5,
                      py: 0.6,
                      borderRadius: 1.5,
                      "&:hover": {
                        color: "#D1A362",
                        backgroundColor: "rgba(209, 163, 98, 0.08)",
                      },
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setAuthModalTab("signup");
                      setAuthModalOpen(true);
                    }}
                    sx={{
                      bgcolor: "#1A1817",
                      color: "#FFFFFF",
                      border: "1px solid #D1A362",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      px: 2,
                      py: 0.6,
                      borderRadius: 1.5,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "#2C2825",
                        borderColor: "#E5C287",
                        boxShadow: "0 4px 14px rgba(209, 163, 98, 0.25)",
                      },
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Cart Drawer */}
      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: 350, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Shopping Cart</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {cartItems.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Your cart is empty.</Typography>
            ) : (
              <List>
                {cartItems.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 2 }}>
                    <Box 
                      display="flex" 
                      flexGrow={1} 
                      alignItems="center" 
                      onClick={() => {
                        setCartOpen(false);
                        navigate(`/product/${item._id}`);
                      }}
                      sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    >
                      <ListItemAvatar>
                        <Avatar src={item.image} variant="rounded" sx={{ width: 60, height: 80, mr: 2 }} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" fontWeight="bold">{item.name}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">₹{item.price} / day</Typography>
                          </Box>
                        }
                      />
                    </Box>
                    <IconButton size="small" onClick={() => handleRemoveFromCart(index)} sx={{ color: 'error.main' }}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          
          {cartItems.length > 0 && (
            <Box mt={2} pt={2} sx={{ borderTop: '1px solid #eee' }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography fontWeight="bold">Subtotal:</Typography>
                <Typography fontWeight="bold">₹{totalCartPrice}</Typography>
              </Box>
              <Button 
                fullWidth 
                variant="contained" 
                sx={{ bgcolor: '#111', py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#333' } }}
                onClick={() => {
                  setCartOpen(false);
                  navigate(`/checkout/address/${cartItems[0]._id}`, { state: { product: cartItems[0], qty: 1 } });
                }}
              >
                Checkout Now
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Wishlist Drawer */}
      <Drawer anchor="right" open={wishlistOpen} onClose={() => setWishlistOpen(false)}>
        <Box sx={{ width: 350, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Your Wishlist</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {wishlistItems.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={4}>Your wishlist is empty.</Typography>
            ) : (
              <List>
                {wishlistItems.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 2 }}>
                    <Box 
                      display="flex" 
                      flexGrow={1} 
                      alignItems="center" 
                      onClick={() => {
                        setWishlistOpen(false);
                        navigate(`/product/${item._id}`);
                      }}
                      sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    >
                      <ListItemAvatar>
                        <Avatar src={item.image} variant="rounded" sx={{ width: 60, height: 80, mr: 2 }} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" fontWeight="bold">{item.name}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">₹{item.price} / day</Typography>
                          </Box>
                        }
                      />
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <IconButton size="small" onClick={() => handleRemoveFromWishlist(item._id)} sx={{ color: 'error.main', mb: 1 }}>
                        <DeleteOutlineIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => {
                        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        cart.push(item);
                        localStorage.setItem('cart', JSON.stringify(cart));
                        window.dispatchEvent(new Event('cart_updated'));
                        setWishlistOpen(false);
                        setCartOpen(true);
                      }} sx={{ color: '#D1A362' }}>
                        <LocalMallOutlinedIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Luxury Auth Modal for Storefront Sign In / Sign Up */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Recruiter Quick Tour & Architecture Specs Modal */}
      <RecruiterTourModal
        open={recruiterTourOpen}
        onClose={() => setRecruiterTourOpen(false)}
      />
    </>
  );
}
export default ResponsiveAppBar;
