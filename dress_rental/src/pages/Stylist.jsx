import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Button, CircularProgress, Grid, Slider, IconButton, Chip, Avatar, Paper } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import DiamondIcon from '@mui/icons-material/Diamond';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import FestivalIcon from '@mui/icons-material/Festival';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CircularProgressWithLabel from '@mui/material/CircularProgress';

const colors = [
  { name: 'Blue', hex: '#1E3A8A' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Purple', hex: '#7E22CE' },
  { name: 'Black', hex: '#171717' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Pink', hex: '#F472B6' },
];

const styles = ["Elegant", "Trendy", "Minimal", "Traditional", "Luxury"];

const Stylist = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    gender: "Women",
    occasion: "Wedding",
    budget: [1000, 3000],
    color: "Blue",
    season: "Summer",
    style: "Elegant",
  });
  
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  
  const [likes, setLikes] = useState({});

  React.useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const likesMap = {};
    wishlist.forEach(item => {
      likesMap[item._id] = true;
    });
    setLikes(likesMap);
  }, []);

  const handleLike = (product) => {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isLiked = likes[product._id];
    
    if (isLiked) {
      wishlist = wishlist.filter(item => item._id !== product._id);
    } else {
      wishlist.push(product);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setLikes(prev => ({ ...prev, [product._id]: !prev[product._id] }));
    window.dispatchEvent(new Event('wishlist_updated'));
  };

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart_updated'));
  };

  const handleUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRecommend = async () => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await axios.post(`${BASE_URL}/products/recommend-outfit`, {
        gender: formData.gender.toLowerCase(),
        occasion: formData.occasion,
        budget: formData.budget[1], // Use max budget
        color: formData.color,
        season: formData.season,
        style: formData.style
      });
      setRecommendations(response.data.outfit || []);
    } catch (error) {
      console.error("Stylist recommendation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecs = recommendations.filter(item => {
    if (activeTab === "Women") return item.product.gender === "women";
    if (activeTab === "Men") return item.product.gender === "men";
    return true;
  });

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', pb: 8 }}>
      <ResponsiveAppBar />
      <Box p={{ xs: 2, md: 4 }} maxWidth="1600px" margin="auto">
        <Grid container spacing={4}>
          
          {/* LEFT COLUMN: Create Your Look */}
          <Grid item xs={12} md={3}>
            <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AutoAwesomeIcon sx={{ color: '#D1A362' }} />
                <Typography variant="h6" fontWeight="bold">Create Your Look</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={4}>
                Tell us your preferences and let our AI find the perfect outfit for you.
              </Typography>

              {/* Gender */}
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>Gender</Typography>
              <Grid container spacing={2} mb={4}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={formData.gender === "Women" ? "outlined" : "text"}
                    onClick={() => handleUpdate("gender", "Women")}
                    sx={{
                      borderColor: formData.gender === "Women" ? '#D1A362' : '#eee',
                      color: formData.gender === "Women" ? '#D1A362' : '#555',
                      bgcolor: formData.gender === "Women" ? '#fffbf5' : '#f9f9f9',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1
                    }}
                    startIcon={<FemaleIcon />}
                  >
                    Women
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={formData.gender === "Men" ? "outlined" : "text"}
                    onClick={() => handleUpdate("gender", "Men")}
                    sx={{
                      borderColor: formData.gender === "Men" ? '#D1A362' : '#eee',
                      color: formData.gender === "Men" ? '#D1A362' : '#555',
                      bgcolor: formData.gender === "Men" ? '#fffbf5' : '#f9f9f9',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1
                    }}
                    startIcon={<MaleIcon />}
                  >
                    Men
                  </Button>
                </Grid>
              </Grid>

              {/* Occasion */}
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>Occasion</Typography>
              <Grid container spacing={1} mb={4}>
                {[
                  { name: "Wedding", icon: <DiamondIcon fontSize="small"/> },
                  { name: "Party", icon: <LocalBarIcon fontSize="small"/> },
                  { name: "Festival", icon: <FestivalIcon fontSize="small"/> },
                  { name: "Casual", icon: <CheckroomIcon fontSize="small"/> },
                  { name: "Office", icon: <WorkOutlineIcon fontSize="small"/> },
                ].map((occ) => (
                  <Grid item xs={4} key={occ.name}>
                    <Box
                      onClick={() => handleUpdate("occasion", occ.name)}
                      sx={{
                        border: formData.occasion === occ.name ? '2px solid #D1A362' : '1px solid #eee',
                        bgcolor: formData.occasion === occ.name ? '#fffbf5' : '#fff',
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: '0.2s',
                        color: formData.occasion === occ.name ? '#D1A362' : '#777',
                        '&:hover': { borderColor: '#D1A362' }
                      }}
                    >
                      {occ.icon}
                      <Typography variant="caption" sx={{ mt: 0.5, fontWeight: formData.occasion === occ.name ? 600 : 400 }}>
                        {occ.name}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Budget */}
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>Budget Range</Typography>
              <Box px={1} mb={4}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" color="text.secondary">₹500</Typography>
                  <Typography variant="caption" color="text.secondary">₹5000+</Typography>
                </Box>
                <Slider
                  value={formData.budget}
                  onChange={(e, val) => handleUpdate("budget", val)}
                  valueLabelDisplay="auto"
                  min={500}
                  max={5000}
                  step={100}
                  sx={{
                    color: '#D1A362',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#fff',
                      border: '2px solid #D1A362',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    },
                  }}
                />
                <Box textAlign="center" mt={-1}>
                  <Chip size="small" label={`₹${formData.budget[0]} - ₹${formData.budget[1]}`} sx={{ bgcolor: '#D1A362', color: 'white', fontWeight: 600 }} />
                </Box>
              </Box>

              {/* Color */}
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>Preferred Color</Typography>
              <Box display="flex" flexWrap="wrap" gap={1.5} mb={4}>
                {colors.map(c => (
                  <Box
                    key={c.name}
                    onClick={() => handleUpdate("color", c.name)}
                    sx={{
                      width: 32, height: 32, borderRadius: '50%', bgcolor: c.hex,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: c.hex === '#FFFFFF' ? '1px solid #ccc' : 'none',
                      boxShadow: formData.color === c.name ? '0 0 0 2px white, 0 0 0 4px #D1A362' : 'none',
                    }}
                  >
                    {formData.color === c.name && (
                      <CheckIcon sx={{ color: c.hex === '#FFFFFF' ? '#000' : '#fff', fontSize: 16 }} />
                    )}
                  </Box>
                ))}
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#777'
                  }}
                >
                  <AddIcon fontSize="small" />
                </Box>
              </Box>

              {/* Season */}
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>Season</Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
                {[
                  { name: "Summer", icon: <WbSunnyIcon fontSize="small"/> },
                  { name: "Monsoon", icon: <InvertColorsIcon fontSize="small"/> },
                  { name: "Winter", icon: <AcUnitIcon fontSize="small"/> },
                  { name: "All", icon: null },
                ].map(s => (
                  <Chip
                    key={s.name}
                    icon={s.icon}
                    label={s.name}
                    clickable
                    onClick={() => handleUpdate("season", s.name)}
                    sx={{
                      bgcolor: formData.season === s.name ? '#fffbf5' : '#f5f5f5',
                      border: formData.season === s.name ? '1px solid #D1A362' : '1px solid transparent',
                      color: formData.season === s.name ? '#D1A362' : '#555',
                      fontWeight: formData.season === s.name ? 600 : 400,
                      px: 0.5
                    }}
                  />
                ))}
              </Box>

              {/* Style */}
              <Typography variant="subtitle2" fontWeight="600" mb={1.5}>Style</Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
                {styles.map(st => (
                  <Chip
                    key={st}
                    label={st}
                    clickable
                    onClick={() => handleUpdate("style", st)}
                    sx={{
                      bgcolor: formData.style === st ? '#fffbf5' : '#f5f5f5',
                      border: formData.style === st ? '1px solid #D1A362' : '1px solid transparent',
                      color: formData.style === st ? '#D1A362' : '#555',
                      fontWeight: formData.style === st ? 600 : 400,
                    }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRecommend}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  color: 'white',
                  fontWeight: 'bold',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.05rem',
                  boxShadow: '0 4px 14px rgba(254, 107, 139, 0.4)'
                }}
                startIcon={!loading && <AutoAwesomeIcon />}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Find My Outfit"}
              </Button>
              <Typography variant="caption" display="block" textAlign="center" mt={2} color="text.secondary">
                Powered by AI
              </Typography>
            </Box>
          </Grid>

          {/* CENTER COLUMN: Results */}
          <Grid item xs={12} md={6}>
            {!hasSearched ? (
              <Box height="100%" display="flex" flexDirection="column" justifyContent="center" alignItems="center" color="text.secondary">
                <AutoAwesomeIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h5" color="#ccc">Your curated outfits will appear here</Typography>
              </Box>
            ) : (
              <Box sx={{ bgcolor: '#fff', p: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AutoAwesomeIcon sx={{ color: '#D1A362' }} />
                    <Typography variant="h6" fontWeight="bold">Recommended for You</Typography>
                  </Box>
                  <Button size="small" variant="outlined" sx={{ color: '#555', borderColor: '#ddd', textTransform: 'none', borderRadius: 2 }}>
                    Sort by: <strong>Best Match</strong>
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Outfits curated by our AI stylist
                </Typography>

                <Box display="flex" gap={1} mb={4}>
                  {["All", "Women", "Men"].map(tab => (
                    <Chip
                      key={tab}
                      label={`${tab} (${tab === "All" ? recommendations.length : recommendations.filter(r => r.product.gender === tab.toLowerCase()).length})`}
                      clickable
                      onClick={() => setActiveTab(tab)}
                      sx={{
                        bgcolor: activeTab === tab ? '#111' : '#fff',
                        color: activeTab === tab ? '#fff' : '#555',
                        border: '1px solid',
                        borderColor: activeTab === tab ? '#111' : '#eee',
                        fontWeight: activeTab === tab ? 600 : 400
                      }}
                    />
                  ))}
                </Box>

                <Grid container spacing={3} mb={4}>
                  {filteredRecs.map((item, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', bgcolor: '#f9f9f9', border: '1px solid #eee', transition: '0.3s', '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.08)' } }}>
                        {/* Image */}
                        <Box sx={{ position: 'relative', paddingTop: '135%' }}>
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <Chip 
                            label={`${95 - idx}% Match`} 
                            size="small" 
                            sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(255,255,255,0.9)', color: '#2e7d32', fontWeight: 'bold', fontSize: '0.7rem' }} 
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleLike(item.product)}
                            sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: '#fff' } }}
                          >
                            {likes[item.product._id] ? <FavoriteIcon fontSize="small" sx={{ color: '#FE6B8B' }} /> : <FavoriteBorderIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                        
                        {/* Content */}
                        <Box p={2}>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap mb={0.5}>{item.product.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            {item.product.category} • {formData.color}
                          </Typography>
                          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                            ₹{item.product.price} <Typography component="span" variant="caption" color="text.secondary">/ 3 Days</Typography>
                          </Typography>
                          
                          <Stack direction="row" spacing={1} mb={2}>
                            <Chip size="small" icon={<WbSunnyIcon sx={{ fontSize: '12px !important', color: '#f57c00' }}/>} label={`Perfect for ${formData.season}`} sx={{ fontSize: '0.65rem', bgcolor: '#fff3e0' }} />
                          </Stack>
                          <Stack direction="row" spacing={1} mb={2}>
                            <Chip size="small" icon={<DiamondIcon sx={{ fontSize: '12px !important', color: '#9c27b0' }}/>} label={`${formData.style} Style`} sx={{ fontSize: '0.65rem', bgcolor: '#f3e5f5' }} />
                          </Stack>

                          <Box display="flex" gap={1}>
                            <Button 
                              variant="contained" 
                              disableElevation 
                              fullWidth 
                              onClick={() => navigate(`/product/${item.product._id}`)}
                              sx={{ bgcolor: '#111', color: '#fff', textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#333' } }}
                            >
                              View Details
                            </Button>
                            <IconButton 
                              onClick={() => handleAddToCart(item.product)}
                              sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}
                            >
                              <ShoppingCartOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                
                {filteredRecs.length > 0 && (
                  <>
                    <Button fullWidth variant="outlined" sx={{ color: '#555', borderColor: '#ddd', textTransform: 'none', borderRadius: 2, py: 1, mb: 4 }}>
                      View More Outfits →
                    </Button>
                    
                    <Typography variant="h6" fontWeight="bold" mb={0.5}>Why These Outfits?</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>AI analysis based on your preferences</Typography>
                    
                    <Box display="flex" flexWrap="wrap" gap={1.5}>
                      <Chip icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: formData.color, ml: 1 }}/>} label="Matches your preferred color" sx={{ bgcolor: '#fff', border: '1px solid #eee' }} />
                      <Chip icon={<WbSunnyIcon sx={{ color: '#f57c00' }}/>} label={`Perfect for ${formData.season} season`} sx={{ bgcolor: '#fff', border: '1px solid #eee' }} />
                      <Chip icon={<DiamondIcon sx={{ color: '#9c27b0' }}/>} label={`${formData.style} style suits you`} sx={{ bgcolor: '#fff', border: '1px solid #eee' }} />
                      <Chip label="Within your budget range" sx={{ bgcolor: '#fff', border: '1px solid #eee' }} />
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Grid>

          {/* RIGHT COLUMN: AI Stylist Dashboard */}
          <Grid item xs={12} md={3}>
            <Box sx={{ bgcolor: '#fcf8fa', p: 3, borderRadius: 3, height: '100%', position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AutoAwesomeIcon sx={{ color: '#FE6B8B' }} />
                  <Typography variant="h6" fontWeight="bold">AI Stylist</Typography>
                </Box>
                <Chip label="Beta" size="small" sx={{ bgcolor: '#fff', color: '#555', fontWeight: 600, border: '1px solid #eee' }} />
              </Box>

              <Typography variant="h6" fontWeight="bold" mb={0.5}>Hi Athiya! 👋</Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>I'm your personal AI stylist.</Typography>

              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid #ffeef2' }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={2}>Your Preferences</Typography>
                <Stack spacing={2.5}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <FemaleIcon sx={{ color: '#888' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Gender</Typography>
                      <Typography variant="body2" fontWeight="500">{formData.gender}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <DiamondIcon sx={{ color: '#888' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Occasion</Typography>
                      <Typography variant="body2" fontWeight="500">{formData.occasion}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LocalBarIcon sx={{ color: '#888' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Budget</Typography>
                      <Typography variant="body2" fontWeight="500">₹{formData.budget[0]} - ₹{formData.budget[1]}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <InvertColorsIcon sx={{ color: '#888' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Color</Typography>
                      <Typography variant="body2" fontWeight="500">{formData.color}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <WbSunnyIcon sx={{ color: '#888' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Season</Typography>
                      <Typography variant="body2" fontWeight="500">{formData.season}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckroomIcon sx={{ color: '#888' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Style</Typography>
                      <Typography variant="body2" fontWeight="500">{formData.style}</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid #ffeef2', position: 'relative', overflow: 'hidden' }}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>Stylist's Note</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  I've handpicked outfits that match your style and preferences. These outfits are trending and perfect for your occasion.
                </Typography>
                <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.1 }}>
                  <CheckroomIcon sx={{ fontSize: 80 }} />
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #ffeef2', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress variant="determinate" value={95} size={60} thickness={4} sx={{ color: '#FE6B8B' }} />
                  <Box
                    sx={{
                      top: 0, left: 0, bottom: 0, right: 0,
                      position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" fontWeight="bold">
                      95%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Excellent Match!</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>
                    These outfits match your preferences perfectly.
                  </Typography>
                </Box>
              </Paper>

              <IconButton 
                sx={{ 
                  position: 'absolute', bottom: -20, right: -20, 
                  bgcolor: '#FF8E53', color: 'white', p: 2, 
                  boxShadow: '0 4px 12px rgba(255, 142, 83, 0.4)',
                  '&:hover': { bgcolor: '#FE6B8B' }
                }}
              >
                <ChatBubbleIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Stylist;
