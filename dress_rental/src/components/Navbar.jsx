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

  React.useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
    };
    const updateWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistItems(wishlist);
    };
    
    updateCart();
    updateWishlist();
    
    window.addEventListener('cart_updated', updateCart);
    window.addEventListener('wishlist_updated', updateWishlist);
    return () => {
      window.removeEventListener('cart_updated', updateCart);
      window.removeEventListener('wishlist_updated', updateWishlist);
    };
  }, []);

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
                {pages.map((page) => (
                  <MenuItem onClick={() => { handleCloseNavMenu(); navigate(page.path); }} key={page.name}>
                    <Typography textAlign="center">{page.name}</Typography>
                  </MenuItem>
                ))}
                {localStorage.getItem("token") && (
                  <MenuItem
                    onClick={() => {
                      handleCloseNavMenu();
                      const u = JSON.parse(localStorage.getItem("user") || "{}");
                      navigate(u.role === "provider" ? "/provider-dashboard" : "/my-rentals");
                    }}
                  >
                    <Typography textAlign="center" fontWeight={700} color="#D1A362">
                      {JSON.parse(localStorage.getItem("user") || "{}").role === "provider" ? "Provider Studio" : "My Rentals"}
                    </Typography>
                  </MenuItem>
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
              
              {localStorage.getItem("token") ? (
                <Box display="flex" alignItems="center" gap={1.5} sx={{ ml: 1 }}>
                  {(() => {
                    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                    if (currentUser?.role === 'provider' || currentUser?.type === 'provider') {
                      return (
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
                      );
                    }
                    return (
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
                    );
                  })()}

                  <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer', '&:hover': { color: '#D1A362' } }} onClick={() => navigate("/profile")}>
                    <PersonOutlineOutlinedIcon />
                    <Typography variant="body2" fontWeight={600}>
                      Hello {JSON.parse(localStorage.getItem("user") || "{}")?.firstname || "User"}
                    </Typography>
                    <KeyboardArrowDownIcon fontSize="small" />
                  </Box>
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={1} sx={{ cursor: 'pointer', ml: 1, '&:hover': { color: '#D1A362' } }} onClick={() => navigate("/login")}>
                  <PersonOutlineOutlinedIcon />
                  <Typography variant="body2" fontWeight={600}>Login</Typography>
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
    </>
  );
}
export default ResponsiveAppBar;
