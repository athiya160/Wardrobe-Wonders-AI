import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Button, Grid, Paper, Stack, FormControl, RadioGroup, FormControlLabel, Radio, Divider } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import { initPayment } from "../utils/initPayment";
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';

const CheckoutPayment = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [paymentType, setPaymentType] = useState("card"); // card, upi, netbanking, cod
  const [product, setProduct] = useState(location.state?.product || null);

  const qty = location.state?.qty || 1;
  const startDate = location.state?.startDate || null;
  const endDate = location.state?.endDate || null;
  const address = location.state?.address || { houseNo: "", street: "", landmark: "", city: "", zip: "" };

  useEffect(() => {
    if (!product) {
      axios.get(`${BASE_URL}/products/detail/${id}`)
        .then(res => setProduct(res.data))
        .catch(err => console.error("Failed to load product:", err));
    }
  }, [id, product]);

  const dailyPrice = product ? (Number(product.rentalPricePerDay || product.price) || 0) : 0;
  const rentalAmount = dailyPrice * qty;
  const securityDeposit = product ? (Number(product.securityDeposit || product.advance) || 0) : 0;
  const totalPayable = rentalAmount + securityDeposit;

  const handlePayment = async () => {
    if (!product) return alert("Product data missing.");

    if (paymentType !== "cod") {
      // For online payments, init via gateway with dates & total amount
      await initPayment(product, qty, address, startDate, endDate, totalPayable);
    } else {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.email) return alert("User not logged in.");

        const reqData = {
          dressId: product._id,
          quantity: qty,
          startDate: startDate,
          endDate: endDate,
          rentalFee: rentalAmount,
          securityDeposit: securityDeposit,
          totalAmount: totalPayable,
          email: user.email,
          address: address,
        };
        const res = await axios.post(`${BASE_URL}/payment/cod`, reqData);
        if (res.data.success) {
          navigate("/order-success");
        }
      } catch (err) {
        alert("Failed to place order. Please try again.");
      }
    }
  };

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', pb: 12 }}>
      <ResponsiveAppBar />
      <Box p={4} maxWidth="1000px" margin="auto" mt={4}>
        <Typography variant="h4" mb={4} sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
          Checkout
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 4, border: '1px solid #E0E0E0', borderRadius: 2 }}>
              <Typography variant="h6" mb={3} fontWeight="600">
                Payment Method
              </Typography>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup 
                  value={paymentType} 
                  onChange={(e) => setPaymentType(e.target.value)}
                  sx={{ gap: 2 }}
                >
                  <Box sx={{ border: '1px solid #eee', p: 2, borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel 
                      value="card" 
                      control={<Radio color="primary" />} 
                      label={<Typography fontWeight="500">Credit / Debit Card</Typography>} 
                      sx={{ flexGrow: 1 }}
                    />
                    <CreditCardIcon color="action" />
                  </Box>
                  <Box sx={{ border: '1px solid #eee', p: 2, borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel 
                      value="upi" 
                      control={<Radio color="primary" />} 
                      label={<Typography fontWeight="500">UPI (PhonePe, GPay, Paytm)</Typography>} 
                      sx={{ flexGrow: 1 }}
                    />
                    <QrCodeScannerIcon color="action" />
                  </Box>
                  <Box sx={{ border: '1px solid #eee', p: 2, borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel 
                      value="netbanking" 
                      control={<Radio color="primary" />} 
                      label={<Typography fontWeight="500">Net Banking</Typography>} 
                      sx={{ flexGrow: 1 }}
                    />
                    <AccountBalanceIcon color="action" />
                  </Box>
                  <Box sx={{ border: '1px solid #eee', p: 2, borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel 
                      value="cod" 
                      control={<Radio color="primary" />} 
                      label={<Typography fontWeight="500">Cash on Delivery</Typography>} 
                      sx={{ flexGrow: 1 }}
                    />
                    <LocalAtmIcon color="action" />
                  </Box>
                </RadioGroup>
              </FormControl>

              <Box mt={4} pt={4} borderTop="1px solid #eee">
                <Typography variant="subtitle1" fontWeight="600" mb={1}>
                  Delivery Address
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {address.houseNo ? `${address.houseNo}, ` : ''}{address.street}
                </Typography>
                {address.landmark && (
                  <Typography variant="body2" color="text.secondary">
                    Landmark: {address.landmark}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {address.city} - {address.zip}
                </Typography>
                <Button size="small" onClick={() => navigate(-1)} sx={{ mt: 1, textTransform: 'none', p: 0 }}>
                  Edit Address
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #E0E0E0', borderRadius: 2, bgcolor: '#fff' }}>
              <Typography variant="h6" mb={3} fontWeight="600">
                Order Summary
              </Typography>
              {product ? (
                <Stack spacing={2}>
                  <Box display="flex" gap={2}>
                    <img src={product.image} alt={product.name} style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 4 }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="600">{product.name}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Rental Duration: <strong>{qty} Days</strong>
                      </Typography>
                      {startDate && endDate && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {new Date(startDate).toLocaleDateString()} &rarr; {new Date(endDate).toLocaleDateString()}
                        </Typography>
                      )}
                      <Typography variant="body2" fontWeight="600" mt={0.5}>₹{dailyPrice.toLocaleString()} / day</Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Garment Rental ({qty} Days)</Typography>
                    <Typography variant="body2" fontWeight="600">₹{rentalAmount.toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Security Deposit (Refundable)</Typography>
                    <Typography variant="body2" fontWeight="600" color="#2E7D32">₹{securityDeposit.toLocaleString()}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Delivery & Pickup</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="600">Free</Typography>
                  </Box>
                  <Box sx={{ bgcolor: "#F5FBF6", p: 1.2, borderRadius: 1.5, border: "1px solid #C8E6C9" }}>
                    <Typography variant="caption" color="#1B5E20" display="block" lineHeight={1.3}>
                      🛡️ <strong>Deposit Protection:</strong> The ₹{securityDeposit.toLocaleString()} refundable security deposit is tracked on your rental order and credited back to you within 24-48 hours after return inspection.
                    </Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="bold">Total Payable</Typography>
                    <Typography variant="h6" fontWeight="bold" color="#1A1817">₹{totalPayable.toLocaleString()}</Typography>
                  </Box>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    size="large"
                    onClick={handlePayment}
                    sx={{ mt: 2, backgroundColor: '#1A1A1A', color: 'white', '&:hover': { backgroundColor: '#333' } }}
                  >
                    Place Order
                  </Button>
                </Stack>
              ) : (
                <Typography>Loading order details...</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CheckoutPayment;
