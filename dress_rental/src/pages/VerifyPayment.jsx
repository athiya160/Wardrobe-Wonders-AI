import ResponsiveAppBar from "../components/Navbar";
import { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, CircularProgress, Stack } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";

const VerifyPayment = () => {
  const [success, setSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const getPaymentStatus = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const address = JSON.parse(localStorage.getItem("address") || "{}");

      try {
        const req = await axios.post(`${BASE_URL}/payment/check-status`, {
          transactionId: localStorage.getItem("tID"),
          dressId: localStorage.getItem("dressId"),
          quantity: localStorage.getItem("quantity"),
          startDate: localStorage.getItem("startDate") || undefined,
          endDate: localStorage.getItem("endDate") || undefined,
          totalAmount: localStorage.getItem("totalAmount") ? Number(localStorage.getItem("totalAmount")) : undefined,
          email: user.email,
          address: address,
        });

        if (req.data?.code === "PAYMENT_SUCCESS" || req.data?.success) {
          setSuccess(true);
          localStorage.removeItem("tID");
          localStorage.removeItem("dressId");
          localStorage.removeItem("quantity");
          localStorage.removeItem("startDate");
          localStorage.removeItem("endDate");
          localStorage.removeItem("totalAmount");
          localStorage.removeItem("address");
          setTimeout(() => {
            navigate("/order-success");
          }, 1200);
        } else {
          setSuccess(false);
          setErrorMessage(req.data?.message || "Payment could not be verified with gateway.");
        }
      } catch (err) {
        setSuccess(false);
        setErrorMessage("Network or gateway error while verifying payment.");
      }
    };
    getPaymentStatus();
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
      <ResponsiveAppBar />
      <Box
        sx={{
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
        }}
      >
        <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, maxWidth: 500, width: "100%", textAlign: "center", borderRadius: 3, border: "1px solid #EBEBEB", bgcolor: "#FFF" }}>
          {success == null ? (
            <Stack spacing={2} alignItems="center">
              <CircularProgress sx={{ color: "#D1A362" }} size={48} />
              <Typography variant="h6" fontWeight={700}>
                Verifying Your Payment...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please do not refresh or close this window while we secure your rental order.
              </Typography>
            </Stack>
          ) : success ? (
            <Stack spacing={2} alignItems="center">
              <CheckCircleOutlineIcon sx={{ fontSize: 72, color: "#2E7D32" }} />
              <Typography variant="h5" fontWeight={800} color="#1B5E20">
                Payment Verified!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting you to your order confirmation...
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2.5} alignItems="center">
              <ErrorOutlineIcon sx={{ fontSize: 72, color: "#D32F2F" }} />
              <Typography variant="h5" fontWeight={800} color="#C62828">
                Payment Incomplete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {errorMessage || "We could not verify payment for this transaction. No funds were captured."}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/")}
                  sx={{ borderColor: "#E0E0E0", color: "#333", textTransform: "none", fontWeight: 600 }}
                >
                  Return to Home
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate(-1)}
                  sx={{ bgcolor: "#1A1817", "&:hover": { bgcolor: "#333" }, textTransform: "none", fontWeight: 600 }}
                >
                  Try Again
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default VerifyPayment;
