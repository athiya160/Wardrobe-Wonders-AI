import {
  Box,
  Typography,
  TextField,
  Button,
  styled,
  Stack,
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
  padding: 0,
  height: "90vh",
});

const StyledForm = styled("form")({
  width: 450,
  margin: "100px auto",
  padding: 20,
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  borderRadius: 10,
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
});

const SignUp = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const validateForm = async () => {
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const mobileNumber = document.getElementById("mobileNumber").value;
    const gmail = document.getElementById("gmail").value;
    const password = document.getElementById("password").value;
    const username = document.getElementById("username").value;
    const numericRegex = /^[0-9]+$/;

    // Validation for First Name
    if (firstName.match(numericRegex)) {
      alert("First Name should not contain numeric characters");
      document.getElementById("firstName").focus();
      return false;
    }

    // Validation for Last Name
    if (lastName.match(numericRegex)) {
      alert("Last Name should not contain numeric characters");
      document.getElementById("lastName").focus();
      return false;
    }

    // Validation for Mobile Number
    if (!mobileNumber.match(numericRegex) || mobileNumber.length !== 10) {
      alert("Mobile Number should contain exactly 10 numeric characters");
      document.getElementById("mobileNumber").focus();
      return false;
    }

    // Validation for Gmail
    if (!gmail.endsWith("@gmail.com")) {
      alert("Invalid Gmail format. Please enter a valid Gmail address.");
      document.getElementById("gmail").focus();
      return false;
    }

    // Validation for Password
    if (password.length < 3 || password.length > 15) {
      alert("Password should be between 3 and 15 characters");
      document.getElementById("password").focus();
      return false;
    }

    // Validation for Username
    if (username.length < 3 || username.length > 15) {
      alert("Username should be between 3 and 15 characters");
      document.getElementById("username").focus();
      return false;
    }
    const data = {
      firstname: firstName,
      lastname: lastName,
      phone: mobileNumber,
      email: gmail,
      password,
      username,
    };
    const res = await axios.post(`${BASE_URL}/register`, data);
    console.log(res.status == 200, res.status, res.data.status, data);
    if (!res.data?.status) {
      setError(res.data.message);
    }
    if (res.status == 200) {
      console.log("entering");
      navigate("/login");
    }
    if (res.status == 400) {
      setError(res.data.message);
    }
  };

  return (
    <StyledContainer>
      <StyledForm>
        <Typography my={2} textAlign={"center"} variant="h5" gutterBottom>
          Sign Up
        </Typography>
        <Stack spacing={2}>
          {error && <Typography color="error">{error}</Typography>}
          <TextField
            label="First Name"
            id="firstName"
            name="firstName"
            required
          />
          <TextField label="Last Name" id="lastName" name="lastName" required />
          <TextField
            label="Mobile Number"
            id="mobileNumber"
            name="mobileNumber"
            required
          />

          <TextField
            id="gmail"
            label="Gmail"
            name="gmail"
            type="email"
            required
          />
          <TextField
            label="Password"
            id="password"
            name="password"
            type="password"
            required
          />
          <TextField id="username" label="Username" name="username" required />
          <Button onClick={validateForm} fullWidth variant="contained">
            Sign Up
          </Button>
        </Stack>
        <div style={{ textAlign: "center", marginTop: 15 }}>
          <Typography variant="body1">
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
