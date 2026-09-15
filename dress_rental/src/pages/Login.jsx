import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  EmailOutlined as EmailIcon,
  LockOutlined as LockIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";
const heroImage = "/assets/Women/bridal_03.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fillDemo = (role) => {
    setError("");
    if (role === "customer") {
      setEmail("customer@wardrobewonders.com");
      setPassword("WondersDemo#2026!");
    } else if (role === "provider") {
      setEmail("provider@wardrobewonders.com");
      setPassword("WondersDemo#2026!");
    } else if (role === "admin") {
      setEmail("admin@wardrobewonders.com");
      setPassword("WondersDemo#2026!");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data?.status && res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const role = res.data.user.role || res.data.user.type;
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "provider") {
          navigate("/provider-dashboard");
        } else {
          navigate("/");
        }
      } else {
        setError(res.data?.message || "Invalid email or password.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to sign in. Please verify your email and password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#FAFAFA",
        color: "#1A1A1A",
      }}
    >
      {/* LEFT / MAIN FORM PANEL */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", md: "0 0 52%", lg: "0 0 48%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 2.5, sm: 6, md: 7, lg: 9 },
          py: { xs: 5, sm: 8 },
          maxWidth: { md: "580px" },
          mx: "auto",
        }}
      >
        {/* Brand Header */}
        <Box sx={{ mb: { xs: 4, sm: 5 } }}>
          <Link to="/" style={{ display: "inline-block" }}>
            <img
              src={logo}
              alt="Wardrobe Wonders"
              style={{ height: 38, objectFit: "contain" }}
            />
          </Link>
        </Box>

        {/* Editorial Titles */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.85rem", sm: "2.3rem" },
              letterSpacing: "-0.02em",
              color: "#1A1A1A",
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            Welcome back.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#666666",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.5,
            }}
          >
            Your next look is waiting.
          </Typography>
        </Box>

        {/* Recruiter / Quick Demo Access */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: "#FBF8F2",
            borderRadius: 2,
            border: "1px dashed #D1A362",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "#8A6D3B",
              display: "block",
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            ⚡ Recruiter / Demo 1-Click Access
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              onClick={() => fillDemo("customer")}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                py: 0.5,
                borderColor: "#D1A362",
                color: "#1A1A1A",
                "&:hover": { borderColor: "#8A6D3B", backgroundColor: "rgba(209,163,98,0.1)" },
              }}
            >
              👤 Customer Demo
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => fillDemo("provider")}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                py: 0.5,
                borderColor: "#D1A362",
                color: "#1A1A1A",
                "&:hover": { borderColor: "#8A6D3B", backgroundColor: "rgba(209,163,98,0.1)" },
              }}
            >
              👗 Provider Studio Demo
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => fillDemo("admin")}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                py: 0.5,
                borderColor: "#D1A362",
                color: "#1A1A1A",
                "&:hover": { borderColor: "#8A6D3B", backgroundColor: "rgba(209,163,98,0.1)" },
              }}
            >
              🛡️ Admin Console Demo
            </Button>
          </Stack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "#888", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "#FFFFFF",
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#888", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "#FFFFFF",
                },
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{
                py: 1.5,
                mt: 1,
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.02em",
                borderRadius: 2,
                backgroundColor: "#1A1A1A",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": {
                  backgroundColor: "#333333",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </Stack>
        </form>

        {/* Footer Link */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="body2" sx={{ color: "#666666" }}>
            New to Wardrobe Wonders?{" "}
            <Link
              to="/sign-up"
              style={{
                color: "#D1A362",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Create an account
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* RIGHT / EDITORIAL SHOWCASE PANEL (Desktop Only) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: { md: "0 0 48%", lg: "0 0 52%" },
          position: "relative",
          backgroundImage: `url("${heroImage}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexDirection: "column",
          justifyContent: "flex-end",
          p: { md: 6, lg: 8 },
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(26,26,26,0.2) 0%, rgba(26,26,26,0.85) 100%)",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, color: "#FFFFFF" }}>
          <Typography
            variant="caption"
            sx={{
              display: "inline-block",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: "rgba(209, 163, 98, 0.9)",
              color: "#1A1A1A",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              mb: 2,
            }}
          >
            Wardrobe Wonders
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { md: "2.3rem", lg: "2.8rem" },
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              mb: 2,
            }}
          >
            Curated fashion for unforgettable moments.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "rgba(255, 255, 255, 0.82)",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              maxWidth: 480,
              mb: 3,
            }}
          >
            Experience designer attire at a fraction of the retail price. Seamless
            rentals, insured garments, and hassle-free returns right at your doorstep.
          </Typography>

          <Box sx={{ pt: 2, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>
              "The most seamless luxury rental experience in India."
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
