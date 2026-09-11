import {
  Box,
  Typography,
  TextField,
  Button,
  styled,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/axiosConfig";
import { useState } from "react";

const StyledContainer = styled(Box)({
  backgroundSize: "cover",
  backgroundPosition: "center",
  fontFamily: "Arial, sans-serif",
  margin: 0,
  padding: "20px 0",
  minHeight: "100vh",
});

const StyledForm = styled("form")({
  width: 450,
  maxWidth: "90%",
  margin: "40px auto",
  padding: 24,
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderRadius: 10,
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
});

const SignUp = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [role, setRole] = useState("customer");

  const validateForm = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const mobileNumber = document.getElementById("mobileNumber").value.trim();
    const gmail = document.getElementById("gmail").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const username = document.getElementById("username").value.trim();
    const numericRegex = /^[0-9]+$/;

    // Validation for First Name
    if (firstName.match(numericRegex)) {
      setError("First Name should not contain numeric characters");
      document.getElementById("firstName").focus();
      return false;
    }

    // Validation for Last Name
    if (lastName.match(numericRegex)) {
      setError("Last Name should not contain numeric characters");
      document.getElementById("lastName").focus();
      return false;
    }

    // Validation for Mobile Number
    if (!mobileNumber.match(numericRegex) || mobileNumber.length !== 10) {
      setError("Mobile Number should contain exactly 10 numeric characters");
      document.getElementById("mobileNumber").focus();
      return false;
    }

    // Validation for Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gmail)) {
      setError("Invalid email format. Please enter a valid email address.");
      document.getElementById("gmail").focus();
      return false;
    }

    // Validation for Password
    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      document.getElementById("password").focus();
      return false;
    }

    // Validation for Confirm Password
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      document.getElementById("confirmPassword").focus();
      return false;
    }

    // Validation for Username
    if (username.length < 3 || username.length > 20) {
      setError("Username should be between 3 and 20 characters");
      document.getElementById("username").focus();
      return false;
    }

    const data = {
      name: `${firstName} ${lastName}`.trim(),
      firstname: firstName,
      lastname: lastName,
      phone: mobileNumber,
      email: gmail,
      password,
      username,
      role,
    };

    try {
      const res = await axios.post(`${BASE_URL}/register`, data);
      if (res.data?.status || res.status === 200) {
        navigate("/login");
      } else {
        setError(res.data?.message || "Registration failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <StyledContainer>
      <StyledForm onSubmit={validateForm}>
        <Typography my={2} textAlign={"center"} variant="h5" gutterBottom fontWeight="bold">
          Sign Up
        </Typography>
        <Stack spacing={2}>
          {error && <Typography color="error" textAlign="center">{error}</Typography>}
          <TextField
            label="First Name"
            id="firstName"
            name="firstName"
            required
            size="small"
          />
          <TextField label="Last Name" id="lastName" name="lastName" required size="small" />
          <TextField
            label="Mobile Number"
            id="mobileNumber"
            name="mobileNumber"
            required
            size="small"
          />

          <TextField
            id="gmail"
            label="Email"
            name="gmail"
            type="email"
            required
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel id="role-select-label">Account Type</InputLabel>
            <Select
              labelId="role-select-label"
              id="role"
              value={role}
              label="Account Type"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="customer">Customer — Rent Clothes</MenuItem>
              <MenuItem value="provider">Provider — Lend Clothes & Earn</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Password"
            id="password"
            name="password"
            type="password"
            required
            size="small"
          />
          <TextField
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            size="small"
          />
          <TextField id="username" label="Username" name="username" required size="small" />
          <Button onClick={validateForm} fullWidth variant="contained" sx={{ mt: 1 }}>
            Sign Up
          </Button>
        </Stack>
        <div style={{ textAlign: "center", marginTop: 15 }}>
          <Typography variant="body2">
            Already User ?{" "}
            <Link to="/login" color="primary">
              Login
            </Link>
          </Typography>
        </div>
      </StyledForm>
    </StyledContainer>
  );
};

export default SignUp;
