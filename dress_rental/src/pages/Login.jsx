import { Box, Typography, TextField, Button, Link } from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/axiosConfig";
const StyledContainer = styled(Box)({
  maxWidth: "400px",
  margin: "100px auto",
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
});

const StyledForm = styled("form")({
  textAlign: "center",
});

const StyledInputGroup = styled("div")({
  marginBottom: 15,
});

const StyledButtonGroup = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 20,
});

const StyledButton = styled(Button)({
  padding: "10px 20px",
  textTransform: "capitalize",
  color: "#fff",
  borderRadius: 5,
  cursor: "pointer",
});

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState("");
  const loginFrom = useRef();
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Handle form submission logic here
    const req = await axios.post(`${BASE_URL}/login`, form);
    if (req.data?.status) {
      localStorage.setItem("token", req.data.token);
      localStorage.setItem("user", JSON.stringify(req.data.user));
      if (req.data.user.type === "admin") navigate("/admin");
      else navigate("/");
    } else {
      setErrors("Invalid Username or password");
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  return (
    <>
      <StyledContainer>
        <StyledForm onSubmit={handleSubmit} ref={loginFrom}>
          <Typography variant="h4" gutterBottom>
            Login
          </Typography>
          <StyledInputGroup>
            <TextField
              id="email"
              label="Email"
              variant="outlined"
              fullWidth
              required
              error={errors ? true : false}
              helperText={errors}
              onChange={handleChange}
            />
          </StyledInputGroup>
          <StyledInputGroup>
            <TextField
              id="password"
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              required
              onChange={handleChange}
            />
          </StyledInputGroup>
          <StyledButtonGroup>
            <StyledButton fullWidth variant="contained" type="submit">
              Sign In
            </StyledButton>
          </StyledButtonGroup>
        </StyledForm>
        <div style={{ textAlign: "center", marginTop: 15 }}>
          <Typography variant="body1">
            New User?{" "}
            <Link href="/sign-up" color="primary">
              Sign Up
            </Link>
          </Typography>
        </div>
      </StyledContainer>
      <Typography>Devloped by</Typography>
    </>
  );
};

export default Login;
