import { Box, Typography, Button, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ResponsiveAppBar from "../components/Navbar";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', pb: 12 }}>
      <ResponsiveAppBar />
      <Box p={4} maxWidth="600px" margin="auto" mt={10} textAlign="center">
        <Paper elevation={0} sx={{ p: 6, border: '1px solid #E0E0E0', borderRadius: 2 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" mb={2} sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>
            Order Placed Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Thank you for your order. We have received your request and are processing it right now. You can track your order status in your profile.
          </Typography>
          
          <Box display="flex" gap={2} justifyContent="center">
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate("/")}
              sx={{ textTransform: 'none', px: 4, borderColor: '#1A1A1A', color: '#1A1A1A', '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)', borderColor: '#1A1A1A' } }}
            >
              Back to Home
            </Button>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate("/profile")}
              sx={{ textTransform: 'none', px: 4, backgroundColor: '#1A1A1A', color: 'white', '&:hover': { backgroundColor: '#333' } }}
            >
              View Orders
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default OrderSuccess;
