import { useEffect, useState } from "react";
import { 
  Box, Typography, Paper, Grid, Divider, CircularProgress, 
  Chip, Stack, List, ListItem, ListItemIcon, ListItemText, 
  Avatar, Button, TextField
} from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";

// Icons
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';

const Profile = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [wishlistItems, setWishlistItems] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (user.email && activeTab === "orders") {
      setLoading(true);
      axios.get(`${BASE_URL}/payment/orders/${user.email}`)
        .then(res => setOrders(res.data))
        .catch(err => console.error("Failed to fetch orders", err))
        .finally(() => setLoading(false));
    }
    
    if (activeTab === "wishlist") {
      const items = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistItems(items);
    }
  }, [user.email, activeTab]);

  const handleRemoveFromWishlist = (id) => {
    const updatedWishlist = wishlistItems.filter(item => item._id !== id);
    setWishlistItems(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event('wishlist_updated'));
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'processing': return 'warning';
      case 'shipped': return 'info';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const renderContent = () => {
    switch(activeTab) {
      case "orders":
        return (
          <>
            <Typography variant="h6" fontWeight="bold" mb={3}>My Orders</Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress sx={{ color: '#D1A362' }} />
              </Box>
            ) : orders.length === 0 ? (
              <Box textAlign="center" py={8}>
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="No orders" style={{ width: 150, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" mt={2}>You haven't placed any orders yet</Typography>
                <Button variant="outlined" sx={{ mt: 2, color: '#111', borderColor: '#111' }} onClick={() => window.location.href = '/'}>
                  Start Shopping
                </Button>
              </Box>
            ) : (
              <Stack spacing={3}>
                {orders.map((order, index) => (
                  <Paper key={index} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, overflow: 'hidden', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }, transition: '0.3s' }}>
                    <Box sx={{ bgcolor: '#f9f9f9', px: 3, py: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">ORDER PLACED</Typography>
                        <Typography variant="body2" fontWeight="500">{new Date(order.orderDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary" display="block">TOTAL AMOUNT</Typography>
                        <Typography variant="body2" fontWeight="bold">₹{order.totalAmount}</Typography>
                      </Box>
                      <Box display={{ xs: 'none', sm: 'block' }}>
                        <Typography variant="caption" color="text.secondary" display="block">ORDER ID</Typography>
                        <Typography variant="body2" fontWeight="500">#{order.transactionId ? order.transactionId.substring(0, 10).toUpperCase() : order._id.substring(0, 10).toUpperCase()}</Typography>
                      </Box>
                    </Box>
                    
                    <Box p={3}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Status: <Typography component="span" fontWeight="bold" color={order.status === 'Processing' ? '#ed6c02' : '#2e7d32'}>{order.status}</Typography>
                        </Typography>
                        <Button variant="outlined" size="small" sx={{ color: '#111', borderColor: '#ddd', textTransform: 'none' }}>
                          Track Package
                        </Button>
                      </Box>
                      
                      {order.product ? (
                        <Box display="flex" gap={3}>
                          <img src={order.product.image} alt={order.product.name} style={{ width: 100, height: 130, objectFit: 'cover', borderRadius: 8 }} />
                          <Box flexGrow={1}>
                            <Typography variant="subtitle1" fontWeight="600" mb={0.5}>{order.product.name}</Typography>
                            <Typography variant="body2" color="text.secondary" mb={0.5}>Category: {order.product.category}</Typography>
                            <Typography variant="body2" color="text.secondary" mb={1}>Rental Duration: {order.quantity} Days</Typography>
                            
                            <Box mt={2}>
                              <Button variant="contained" disableElevation size="small" sx={{ bgcolor: '#D1A362', '&:hover': { bgcolor: '#b8860b' }, mr: 2, textTransform: 'none' }}>
                                Buy it again
                              </Button>
                              <Button variant="outlined" size="small" sx={{ color: '#555', borderColor: '#ddd', textTransform: 'none' }} onClick={() => window.location.href = `/product/${order.product._id}`}>
                                View Item
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Typography color="error">Product details unavailable</Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        );
      
      case "profile":
        return (
          <>
            <Typography variant="h6" fontWeight="bold" mb={3}>Profile Information</Typography>
            <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="First Name" defaultValue={user.firstname} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Last Name" defaultValue={user.lastname} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email Address" defaultValue={user.email} variant="outlined" disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Mobile Number" defaultValue={user.phone} variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" disableElevation sx={{ bgcolor: '#111', '&:hover': { bgcolor: '#333' }, mt: 2 }}>
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </>
        );

      case "addresses":
        return (
          <>
            <Typography variant="h6" fontWeight="bold" mb={3}>Manage Addresses</Typography>
            <Button variant="outlined" sx={{ color: '#D1A362', borderColor: '#D1A362', mb: 3, py: 1, borderStyle: 'dashed' }} fullWidth>
              + Add A New Address
            </Button>
            <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, p: 3, position: 'relative' }}>
              <Chip label="Default" size="small" sx={{ position: 'absolute', top: 16, right: 16, bgcolor: '#f0f0f0' }} />
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>{user.firstname} {user.lastname}</Typography>
              <Typography variant="body2" color="text.secondary">1, Chame Gowda Area</Typography>
              <Typography variant="body2" color="text.secondary">Landmark: Shimoga</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Shimoga - 577301</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Phone: {user.phone}</Typography>
              <Box display="flex" gap={2}>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }}>Edit</Typography>
                <Typography variant="body2" color="error" sx={{ cursor: 'pointer', fontWeight: 600 }}>Remove</Typography>
              </Box>
            </Paper>
          </>
        );

      case "wishlist":
        return (
          <>
            <Typography variant="h6" fontWeight="bold" mb={3}>My Wishlist</Typography>
            {wishlistItems.length === 0 ? (
              <Box textAlign="center" py={8}>
                <FavoriteBorderOutlinedIcon sx={{ fontSize: 60, color: '#eee', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Your wishlist is empty</Typography>
                <Typography variant="body2" color="text.secondary">Explore our collections and add items you love!</Typography>
                <Button variant="outlined" sx={{ mt: 2, color: '#111', borderColor: '#111' }} onClick={() => window.location.href = '/'}>
                  Start Browsing
                </Button>
              </Box>
            ) : (
              <List>
                {wishlistItems.map((item, index) => (
                  <Paper key={index} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, mb: 2, p: 2 }}>
                    <ListItem sx={{ px: 0, py: 0 }}>
                      <Box 
                        display="flex" 
                        flexGrow={1} 
                        alignItems="center" 
                        onClick={() => window.location.href = `/product/${item._id}`}
                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                      >
                        <Avatar src={item.image} variant="rounded" sx={{ width: 80, height: 100, mr: 3 }} />
                        <ListItemText 
                          primary={<Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>}
                          secondary={
                            <Box mt={1}>
                              <Typography variant="body2" display="block" color="text.secondary">Category: {item.category}</Typography>
                              <Typography variant="subtitle2" display="block" color="text.primary" mt={0.5}>₹{item.price} / day</Typography>
                            </Box>
                          }
                        />
                      </Box>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Button 
                          variant="contained" 
                          startIcon={<LocalMallOutlinedIcon />} 
                          size="small"
                          sx={{ bgcolor: '#D1A362', '&:hover': { bgcolor: '#b8860b' }, mb: 1, textTransform: 'none' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                            cart.push(item);
                            localStorage.setItem('cart', JSON.stringify(cart));
                            window.dispatchEvent(new Event('cart_updated'));
                            handleRemoveFromWishlist(item._id);
                          }}
                        >
                          Add to Cart
                        </Button>
                        <Button 
                          startIcon={<DeleteOutlineIcon />}
                          color="error"
                          size="small"
                          sx={{ textTransform: 'none' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromWishlist(item._id);
                          }}
                        >
                          Remove
                        </Button>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </>
        );

      case "payments":
        return (
          <>
            <Typography variant="h6" fontWeight="bold" mb={3}>Saved Cards</Typography>
            <Button variant="outlined" sx={{ color: '#D1A362', borderColor: '#D1A362', mb: 3, py: 1, borderStyle: 'dashed' }} fullWidth>
              + Add A New Card
            </Button>
            
            <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, p: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ width: 50, height: 35, bgcolor: '#111', color: '#fff', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontStyle: 'italic' }}>VISA</Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">**** **** **** 4242</Typography>
                  <Typography variant="caption" color="text.secondary">Expires 12/28</Typography>
                </Box>
              </Box>
              <Button size="small" color="error">Remove</Button>
            </Paper>
            
            <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ width: 50, height: 35, bgcolor: '#ff5f00', color: '#fff', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>MC</Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">**** **** **** 5555</Typography>
                  <Typography variant="caption" color="text.secondary">Expires 08/27</Typography>
                </Box>
              </Box>
              <Button size="small" color="error">Remove</Button>
            </Paper>
          </>
        );

      case "reviews":
        return (
          <>
            <Typography variant="h6" fontWeight="bold" mb={3}>My Reviews</Typography>
            
            <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, p: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <img src="/assets/Men/men3.jpg" alt="Product" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Men's Party Wear Suit</Typography>
                    <Typography variant="caption" color="text.secondary">Purchased on July 10, 2026</Typography>
                  </Box>
                </Box>
                <Typography variant="subtitle1" color="#D1A362">★★★★★</Typography>
              </Box>
              <Typography variant="body2">"Absolutely loved this suit! The fit was perfect and the fabric quality was amazing. Highly recommend for any formal event."</Typography>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, p: 3 }}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <img src="/assets/Women/women1.jpg" alt="Product" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Elegant Evening Gown</Typography>
                    <Typography variant="caption" color="text.secondary">Purchased on June 22, 2026</Typography>
                  </Box>
                </Box>
                <Typography variant="subtitle1" color="#D1A362">★★★★☆</Typography>
              </Box>
              <Typography variant="body2">"The dress was beautiful and I received many compliments. It was a tiny bit long for me, but nothing a good pair of heels couldn't fix!"</Typography>
            </Paper>
          </>
        );

      default:
        return (
          <Box textAlign="center" py={8}>
            <AutoAwesomeIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Nothing to see here yet</Typography>
            <Typography variant="body2" color="text.secondary">This section is currently under development.</Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', pb: 12 }}>
      <ResponsiveAppBar />
      <Box p={{ xs: 2, md: 4 }} maxWidth="1200px" margin="auto" mt={2}>
        <Grid container spacing={4}>
          
          {/* LEFT SIDEBAR */}
          <Grid item xs={12} md={3}>
            {/* User Badge */}
            <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 3, borderRadius: 3, border: '1px solid #eee', bgcolor: '#fff' }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#D1A362' }}>
                {user.firstname ? user.firstname[0].toUpperCase() : 'U'}
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Hello,</Typography>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{user.firstname} {user.lastname}</Typography>
              </Box>
            </Paper>

            {/* Navigation Menu */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee', bgcolor: '#fff', overflow: 'hidden' }}>
              <List disablePadding>
                
                {/* Orders Section */}
                <ListItem 
                  button 
                  onClick={() => setActiveTab('orders')}
                  sx={{ bgcolor: activeTab === 'orders' ? '#f5f5f5' : 'transparent', py: 2, borderBottom: '1px solid #eee' }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'orders' ? '#D1A362' : 'action.active' }}>
                    <Inventory2OutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={<Typography fontWeight={activeTab === 'orders' ? 600 : 400} color={activeTab === 'orders' ? '#D1A362' : 'inherit'}>My Orders</Typography>} />
                  <KeyboardArrowRightIcon fontSize="small" sx={{ color: '#ccc' }} />
                </ListItem>

                {/* Account Settings Section */}
                <Box px={2} pt={2} pb={1}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ letterSpacing: 1 }}>ACCOUNT SETTINGS</Typography>
                </Box>
                <ListItem 
                  button 
                  onClick={() => setActiveTab('profile')}
                  sx={{ bgcolor: activeTab === 'profile' ? '#f5f5f5' : 'transparent', py: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'profile' ? '#D1A362' : 'action.active' }}>
                    <PersonOutlineOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" fontWeight={activeTab === 'profile' ? 600 : 400} color={activeTab === 'profile' ? '#D1A362' : 'inherit'}>Profile Information</Typography>} />
                </ListItem>
                <ListItem 
                  button 
                  onClick={() => setActiveTab('addresses')}
                  sx={{ bgcolor: activeTab === 'addresses' ? '#f5f5f5' : 'transparent', py: 1.5, borderBottom: '1px solid #eee' }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'addresses' ? '#D1A362' : 'action.active' }}>
                    <LocationOnOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" fontWeight={activeTab === 'addresses' ? 600 : 400} color={activeTab === 'addresses' ? '#D1A362' : 'inherit'}>Manage Addresses</Typography>} />
                </ListItem>

                {/* Payments Section */}
                <Box px={2} pt={2} pb={1}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ letterSpacing: 1 }}>PAYMENTS</Typography>
                </Box>
                <ListItem 
                  button 
                  onClick={() => setActiveTab('payments')}
                  sx={{ bgcolor: activeTab === 'payments' ? '#f5f5f5' : 'transparent', py: 1.5, borderBottom: '1px solid #eee' }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'payments' ? '#D1A362' : 'action.active' }}>
                    <PaymentOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" fontWeight={activeTab === 'payments' ? 600 : 400} color={activeTab === 'payments' ? '#D1A362' : 'inherit'}>Saved Cards</Typography>} />
                </ListItem>

                {/* My Stuff Section */}
                <Box px={2} pt={2} pb={1}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ letterSpacing: 1 }}>MY STUFF</Typography>
                </Box>
                <ListItem 
                  button 
                  onClick={() => setActiveTab('wishlist')}
                  sx={{ bgcolor: activeTab === 'wishlist' ? '#f5f5f5' : 'transparent', py: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'wishlist' ? '#D1A362' : 'action.active' }}>
                    <FavoriteBorderOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" fontWeight={activeTab === 'wishlist' ? 600 : 400} color={activeTab === 'wishlist' ? '#D1A362' : 'inherit'}>My Wishlist</Typography>} />
                </ListItem>
                <ListItem 
                  button 
                  onClick={() => setActiveTab('reviews')}
                  sx={{ bgcolor: activeTab === 'reviews' ? '#f5f5f5' : 'transparent', py: 1.5, borderBottom: '1px solid #eee' }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'reviews' ? '#D1A362' : 'action.active' }}>
                    <RateReviewOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" fontWeight={activeTab === 'reviews' ? 600 : 400} color={activeTab === 'reviews' ? '#D1A362' : 'inherit'}>My Reviews</Typography>} />
                </ListItem>

                {/* Logout */}
                <ListItem 
                  button 
                  onClick={handleLogout}
                  sx={{ py: 2 }}
                >
                  <ListItemText primary={<Typography variant="body2" fontWeight="600" color="error">Log Out</Typography>} sx={{ pl: 5 }} />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* RIGHT CONTENT AREA */}
          <Grid item xs={12} md={9}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, minHeight: '500px', borderRadius: 3, border: '1px solid #eee', bgcolor: '#fff' }}>
              {renderContent()}
            </Paper>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
};

export default Profile;
