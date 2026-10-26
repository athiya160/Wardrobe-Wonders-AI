import React, { useState } from "react";
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
  LinearProgress,
  Chip,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckroomOutlined as CustomerIcon,
  StorefrontOutlined as ProviderIcon,
  CheckCircle as CheckIcon,
  PersonOutline as PersonIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  LockOutlined as LockIcon,
  ArrowForward as ArrowForwardIcon,
  VerifiedUserOutlined as ShieldIcon,
  LocalShippingOutlined as DeliveryIcon,
  DiamondOutlined as DiamondIcon,
  AutoAwesome as SparkleIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";

const heroImage = "/assets/Women/look_01.png";

// Password strength calculator
const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: "", color: "#E0E0E0" };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

  switch (score) {
    case 1:
      return { score: 25, label: "Weak", color: "#E53935" };
    case 2:
      return { score: 50, label: "Fair", color: "#FB8C00" };
    case 3:
      return { score: 75, label: "Good", color: "#FDD835" };
    case 4:
      return { score: 100, label: "Strong", color: "#43A047" };
    default:
      return { score: 0, label: "", color: "#E0E0E0" };
  }
};

const SignUp = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const fillDemo = (demoRole) => {
    setError("");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    if (demoRole === "customer") {
      setRole("customer");
      setFullName("Priya Sharma");
      setEmail(`priya.client${randomSuffix}@wardrobewonders.com`);
      setPhone("9876543210");
      setPassword("Password123!");
      setConfirmPassword("Password123!");
    } else if (demoRole === "provider") {
      setRole("provider");
      setFullName("Heritage Bridal Studio");
      setEmail(`boutique${randomSuffix}@wardrobewonders.com`);
      setPhone("9812345678");
      setPassword("Password123!");
      setConfirmPassword("Password123!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Field Validations
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    const nameParts = fullName.trim().split(" ");
    const firstname = nameParts[0] || "";
    const lastname = nameParts.slice(1).join(" ") || "";
    const username = email.split("@")[0] + "_" + Math.floor(10 + Math.random() * 90);

    const payload = {
      name: fullName.trim(),
      firstname,
      lastname,
      phone: cleanPhone,
      email: email.trim().toLowerCase(),
      password,
      username,
      role,
    };

    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/register`, payload);
      if (res.data?.status || res.status === 200) {
        if (res.data?.token && res.data?.user) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          window.dispatchEvent(new Event("auth_updated"));
        }
        setSuccess(true);
        setTimeout(() => {
          if (role === "provider") {
            navigate("/provider-dashboard");
          } else {
            navigate("/");
          }
        }, 1200);
      } else {
        setError(res.data?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      if (!err.response) {
        setError(
          "Network connection error: Unable to reach the server. Please check your internet connection or try again shortly."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. An account with this email may already exist."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: "#FCFAF7",
        color: "#1A1817",
      }}
    >
      {/* LEFT / LUXURY FORM PANEL */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", md: "0 0 52%", lg: "0 0 48%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 2.5, sm: 5, md: 6, lg: 8 },
          py: { xs: 3.5, sm: 5 },
          maxWidth: { md: "640px" },
          mx: "auto",
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            mb: { xs: 2.5, sm: 3.5 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link to="/" style={{ display: "inline-block" }}>
            <img
              src={logo}
              alt="Wardrobe Wonders"
              style={{ height: 36, objectFit: "contain" }}
            />
          </Link>
          <Button
            component={Link}
            to="/"
            size="small"
            sx={{
              color: "#8A6D3B",
              fontWeight: 700,
              fontSize: "0.82rem",
              textTransform: "none",
              borderRadius: 1.5,
              px: 1.5,
              "&:hover": { backgroundColor: "rgba(209, 163, 98, 0.08)" },
            }}
          >
            ← Return to Storefront
          </Button>
        </Box>

        {/* Editorial Titles */}
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.8}>
            <SparkleIcon sx={{ color: "#D1A362", fontSize: 18 }} />
            <Typography
              variant="caption"
              sx={{
                color: "#A07028",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontSize: "0.74rem",
              }}
            >
              Exclusive Membership
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              fontSize: { xs: "1.75rem", sm: "2.1rem" },
              letterSpacing: "-0.02em",
              color: "#1A1817",
              lineHeight: 1.2,
              mb: 0.8,
            }}
          >
            Create Your Account.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#6E685F",
              fontSize: "0.92rem",
              lineHeight: 1.5,
            }}
          >
            Rent authenticated bridal couture and 1-gram gold jewellery, or monetize your designer closet.
          </Typography>
        </Box>

        {/* ROLE SELECTION CARDS */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#8E8880",
              display: "block",
              mb: 1.2,
              fontSize: "0.72rem",
            }}
          >
            Select Your Membership Type:
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {/* Customer Role */}
            <Box
              role="button"
              tabIndex={0}
              onClick={() => setRole("customer")}
              sx={{
                flex: 1,
                p: 1.8,
                borderRadius: 2,
                cursor: "pointer",
                border:
                  role === "customer"
                    ? "2px solid #D1A362"
                    : "1px solid #ECE7DE",
                backgroundColor:
                  role === "customer"
                    ? "rgba(209, 163, 98, 0.08)"
                    : "#FFFFFF",
                boxShadow:
                  role === "customer"
                    ? "0 4px 16px rgba(209, 163, 98, 0.15)"
                    : "none",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                "&:hover": {
                  borderColor: "#D1A362",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: role === "customer" ? "#1A1817" : "#F7F5F0",
                  color: role === "customer" ? "#D1A362" : "#777",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CustomerIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: "#1A1817",
                      fontSize: "0.85rem",
                    }}
                  >
                    Client / Renter
                  </Typography>
                  {role === "customer" && (
                    <CheckIcon sx={{ fontSize: 16, color: "#D1A362" }} />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: "#777", fontSize: "0.72rem", display: "block" }}>
                  Borrow couture for 10% of retail
                </Typography>
              </Box>
            </Box>

            {/* Boutique Lender Role */}
            <Box
              role="button"
              tabIndex={0}
              onClick={() => setRole("provider")}
              sx={{
                flex: 1,
                p: 1.8,
                borderRadius: 2,
                cursor: "pointer",
                border:
                  role === "provider"
                    ? "2px solid #D1A362"
                    : "1px solid #ECE7DE",
                backgroundColor:
                  role === "provider"
                    ? "rgba(209, 163, 98, 0.08)"
                    : "#FFFFFF",
                boxShadow:
                  role === "provider"
                    ? "0 4px 16px rgba(209, 163, 98, 0.15)"
                    : "none",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                "&:hover": {
                  borderColor: "#D1A362",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: role === "provider" ? "#1A1817" : "#F7F5F0",
                  color: role === "provider" ? "#D1A362" : "#777",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ProviderIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: "#1A1817",
                      fontSize: "0.85rem",
                    }}
                  >
                    Boutique Lender
                  </Typography>
                  {role === "provider" && (
                    <CheckIcon sx={{ fontSize: 16, color: "#D1A362" }} />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: "#777", fontSize: "0.72rem", display: "block" }}>
                  List outfits & earn rental income
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Feedback Alerts */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{
              mb: 2.5,
              borderRadius: 2,
              backgroundColor: "#FFF5F5",
              color: "#C53030",
              border: "1px solid #FED7D7",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2.5,
              borderRadius: 2,
              backgroundColor: "#F0FFF4",
              color: "#276749",
              border: "1px solid #C6F6D5",
              fontSize: "0.85rem",
            }}
          >
            Welcome to Wardrobe Wonders! Your account has been registered. Redirecting...
          </Alert>
        )}

        {/* Registration Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {/* Full Name */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "#3D3935",
                  mb: 0.6,
                  display: "block",
                  fontSize: "0.78rem",
                }}
              >
                Full Name
              </Typography>
              <TextField
                required
                fullWidth
                size="small"
                placeholder="e.g. Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: "#9E968B", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "& fieldset": { borderColor: "#E5DFD5" },
                    "&:hover fieldset": { borderColor: "#D1A362" },
                    "&.Mui-focused fieldset": { borderColor: "#D1A362", borderWidth: 1.5 },
                  },
                }}
              />
            </Box>

            {/* Email & Phone Dual Row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "#3D3935",
                    mb: 0.6,
                    display: "block",
                    fontSize: "0.78rem",
                  }}
                >
                  Email Address
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="priya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "#9E968B", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "#E5DFD5" },
                      "&:hover fieldset": { borderColor: "#D1A362" },
                      "&.Mui-focused fieldset": { borderColor: "#D1A362", borderWidth: 1.5 },
                    },
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "#3D3935",
                    mb: 0.6,
                    display: "block",
                    fontSize: "0.78rem",
                  }}
                >
                  Mobile Number
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: "#9E968B", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "#E5DFD5" },
                      "&:hover fieldset": { borderColor: "#D1A362" },
                      "&.Mui-focused fieldset": { borderColor: "#D1A362", borderWidth: 1.5 },
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Password & Confirm Password */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "#3D3935",
                    mb: 0.6,
                    display: "block",
                    fontSize: "0.78rem",
                  }}
                >
                  Password
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#9E968B", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "#E5DFD5" },
                      "&:hover fieldset": { borderColor: "#D1A362" },
                      "&.Mui-focused fieldset": { borderColor: "#D1A362", borderWidth: 1.5 },
                    },
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "#3D3935",
                    mb: 0.6,
                    display: "block",
                    fontSize: "0.78rem",
                  }}
                >
                  Confirm Password
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#9E968B", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          aria-label="toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "#E5DFD5" },
                      "&:hover fieldset": { borderColor: "#D1A362" },
                      "&.Mui-focused fieldset": { borderColor: "#D1A362", borderWidth: 1.5 },
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Password Strength Meter */}
            {password && (
              <Box sx={{ mt: -0.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.4}>
                  <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#888" }}>
                    Password Strength:
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.72rem", fontWeight: 700, color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength.score}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "#EAEAEA",
                    "& .MuiLinearProgress-bar": { bgcolor: passwordStrength.color, borderRadius: 2 },
                  }}
                />
              </Box>
            )}

            {/* Submit CTA */}
            <Button
              type="submit"
              fullWidth
              disabled={isLoading || success}
              endIcon={!isLoading && <ArrowForwardIcon />}
              sx={{
                mt: 1.5,
                py: 1.3,
                backgroundColor: "#1A1817",
                color: "#FFFFFF",
                border: "1px solid #D1A362",
                fontWeight: 700,
                fontSize: "0.92rem",
                textTransform: "none",
                borderRadius: 1.5,
                boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                transition: "all 0.25s ease",
                "&:hover": {
                  backgroundColor: "#2E2A27",
                  borderColor: "#E5C287",
                  boxShadow: "0 8px 24px rgba(209, 163, 98, 0.3)",
                  transform: "translateY(-1px)",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#E2DCD2",
                  color: "#9C958A",
                  borderColor: "transparent",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={22} sx={{ color: "#D1A362" }} />
              ) : (
                "Create Account & Explore Collection"
              )}
            </Button>
          </Stack>
        </Box>

        {/* Link to Sign In */}
        <Box sx={{ mt: 2.5, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#777", fontSize: "0.85rem" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#A07028",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign In here →
            </Link>
          </Typography>
        </Box>

        {/* 1-Click Demo Profiles Helper Strip */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: "1px solid #ECE7DE",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#999288",
              fontSize: "0.74rem",
              fontWeight: 600,
              display: "block",
              mb: 1,
            }}
          >
            QUICK TEST PROFILES (1-CLICK FILL):
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip
              label="New Client Demo"
              size="small"
              onClick={() => fillDemo("customer")}
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid #E2DCD2",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
                "&:hover": { borderColor: "#D1A362", bgcolor: "#FAF6F0" },
              }}
            />
            <Chip
              label="Boutique Lender Demo"
              size="small"
              onClick={() => fillDemo("provider")}
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid #E2DCD2",
                fontWeight: 700,
                fontSize: "0.72rem",
                cursor: "pointer",
                "&:hover": { borderColor: "#D1A362", bgcolor: "#FAF6F0" },
              }}
            />
          </Stack>
        </Box>
      </Box>

      {/* RIGHT / EDITORIAL SHOWCASE (Desktop Viewports) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: { md: "0 0 48%", lg: "0 0 52%" },
          position: "relative",
          backgroundImage: `url("${heroImage}")`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 6, lg: 8 },
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(18,16,15,0.45) 0%, rgba(18,16,15,0.7) 50%, rgba(18,16,15,0.95) 100%)",
          },
        }}
      >
        {/* Top Floating Tag */}
        <Box sx={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "flex-end" }}>
          <Chip
            icon={<DiamondIcon sx={{ fontSize: 14, color: "#D1A362 !important" }} />}
            label="AUTHENTICATED CIRCULAR COUTURE"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(8px)",
              color: "#E2DACB",
              border: "1px solid rgba(209, 163, 98, 0.4)",
              fontWeight: 700,
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
            }}
          />
        </Box>

        {/* Bottom Editorial Content & Trust Accolades */}
        <Box sx={{ position: "relative", zIndex: 2, color: "#FFFFFF" }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              fontSize: { md: "2.4rem", lg: "3rem" },
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              mb: 2,
              textShadow: "0 2px 14px rgba(0,0,0,0.5)",
            }}
          >
            Rent the Iconic. <br />
            Monetize the Timeless.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#E5DEC9",
              fontSize: "1.02rem",
              lineHeight: 1.6,
              maxWidth: 520,
              mb: 4,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          >
            Access million-rupee wardrobes for wedding festivities, galas, and celebrations at 10% of retail price. Complete with doorstep white-glove delivery, sanitization, and escrow protection.
          </Typography>

          {/* Trust Matrix Strip */}
          <Box
            sx={{
              pt: 3,
              borderTop: "1px solid rgba(255,255,255,0.18)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <ShieldIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  100% Escrow
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BFB8A9", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Funds released to lender only after you inspect & approve.
              </Typography>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <DeliveryIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  Doorstep Delivery
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BFB8A9", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Sanitized & pressed, delivered 48h before your event.
              </Typography>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <SparkleIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  AI Fit Match
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BFB8A9", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Precision measurements and stylist consultation included.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
