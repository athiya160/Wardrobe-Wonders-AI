import ResponsiveAppBar from "../components/Navbar";
import { useEffect, useState } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
const VerifyPayment = () => {
  const [success, setSuccess] = useState(null);
  useEffect(() => {
    const getPaymentStatus = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const address = JSON.parse(localStorage.getItem("address") || "{}");

      const req = await axios.post(`${BASE_URL}/payment/check-status`, {
        transactionId: localStorage.getItem("tID"),
        dressId: localStorage.getItem("dressId"),
        quantity: localStorage.getItem("quantity"),
        email: user.email,
        address: address,
      });
      if (req.data.code === "PAYMENT_SUCCESS") {
        setSuccess(true);
        localStorage.removeItem("tID");
        localStorage.removeItem("dressId");
        localStorage.removeItem("quantity");
        localStorage.removeItem("address");
        setTimeout(() => {
          window.location.href = "/order-success";
        }, 1000);
      } else {
        setSuccess(false);
      }
    };
    getPaymentStatus();
  }, []);
  return (
    <>
      <ResponsiveAppBar />
      <Box
        sx={{
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {success == null ? (
          <>
            <CircularProgress />
            <Typography>Verifying Your Payment</Typography>
          </>
        ) : success ? (
          <>
            <Avatar
              sx={{
                width: 200,
                height: 200,
                margin: "10px 0",
                background: "green",
              }}
              variant="circle"
              src="https://www.freeiconspng.com/uploads/success-icon-10.png"
            />
            <Typography variant="subtitle1">Payment Successful</Typography>
          </>
        ) : (
          <>
            <Avatar
              sx={{
                width: 200,
                height: 200,
                margin: "10px 0",
                background: "green",
              }}
              variant="circle"
              src="https://www.freeiconspng.com/uploads/failure-icon-29.png"
            />
            <Typography>Payment Failed</Typography>
          </>
        )}
      </Box>
    </>
  );
};

export default VerifyPayment;
