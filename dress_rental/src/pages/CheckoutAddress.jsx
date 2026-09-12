import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box, Typography, TextField, Button, Grid, Paper, Stack } from "@mui/material";
import ResponsiveAppBar from "../components/Navbar";

const CheckoutAddress = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ houseNo: "", street: "", landmark: "", city: "", zip: "" });

  // Get qty, dates, and product from location state
  const qty = location.state?.qty || 1;
  const startDate = location.state?.startDate || null;
  const endDate = location.state?.endDate || null;
  const product = location.state?.product;

  const handleContinue = () => {
    if (!address.houseNo || !address.street || !address.city || !address.zip) {
      return alert("Please fill out your complete address.");
    }
    navigate(`/checkout/payment/${id}`, { state: { qty, startDate, endDate, address, product } });
  };

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', pb: 12 }}>
      <ResponsiveAppBar />
      <Box p={4} maxWidth="800px" margin="auto" mt={4}>
        <Paper elevation={0} sx={{ p: 4, border: '1px solid #E0E0E0', borderRadius: 2 }}>
          <Typography variant="h4" mb={4} sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
            Delivery Address
          </Typography>
          
          <Stack spacing={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="House No. / Building Name" 
                  fullWidth 
                  variant="outlined"
                  value={address.houseNo} 
                  onChange={e => setAddress({...address, houseNo: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Street Address / Area" 
                  fullWidth 
                  variant="outlined"
                  value={address.street} 
                  onChange={e => setAddress({...address, street: e.target.value})} 
                />
              </Grid>
            </Grid>
            <TextField 
              label="Landmark (Optional)" 
              fullWidth 
              variant="outlined"
              value={address.landmark} 
              onChange={e => setAddress({...address, landmark: e.target.value})} 
            />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="City" 
                  fullWidth 
                  variant="outlined"
                  value={address.city} 
                  onChange={e => setAddress({...address, city: e.target.value})} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="ZIP Code" 
                  fullWidth 
                  variant="outlined"
                  value={address.zip} 
                  onChange={e => setAddress({...address, zip: e.target.value})} 
                />
              </Grid>
            </Grid>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
              <Button onClick={() => navigate(-1)} color="inherit">
                Back to Product
              </Button>
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleContinue}
                sx={{ backgroundColor: '#1A1A1A', color: 'white', px: 4, '&:hover': { backgroundColor: '#333' } }}
              >
                Continue to Payment
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default CheckoutAddress;
