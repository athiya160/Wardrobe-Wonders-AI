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
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";
import heroImage from "../assets/Cocktail Gown.jpg";

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
    const username = email.split("@")[0];

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
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setError(res.data?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. An account with this email may already exist."
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
          flex: { xs: "1 1 100%", md: "0 0 54%", lg: "0 0 50%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 2.5, sm: 6, md: 7, lg: 9 },
          py: { xs: 4, sm: 6 },
          maxWidth: { md: "680px" },
          mx: "auto",
        }}
      >
        {/* Brand Header */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Link to="/" style={{ display: "inline-block" }}>
            <img
              src={logo}
              alt="Wardrobe Wonders"
              style={{ height: 36, objectFit: "contain" }}
            />
          </Link>
        </Box>

        {/* Editorial Titles */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", sm: "2.1rem" },
              letterSpacing: "-0.02em",
              color: "#1A1A1A",
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            Your wardrobe. Your way.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#666666",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              lineHeight: 1.5,
            }}
          >
            Rent the looks you love or turn your wardrobe into income.
          </Typography>
        </Box>

        {/* ROLE SELECTION CARDS */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#888888",
              display: "block",
              mb: 1.5,
            }}
          >
            Choose your account type
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ width: "100%" }}
          >
            {/* Customer Card */}
            <Box
              role="button"
              tabIndex={0}
              aria-pressed={role === "customer"}
              onClick={() => setRole("customer")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setRole("customer");
              }}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2.5,
                cursor: "pointer",
                border:
                  role === "customer"
                    ? "2px solid #D1A362"
                    : "1.5px solid #EAEAEA",
                backgroundColor:
                  role === "customer"
                    ? "rgba(209, 163, 98, 0.06)"
                    : "#FFFFFF",
                boxShadow:
                  role === "customer"
                    ? "0 6px 20px rgba(209, 163, 98, 0.15)"
                    : "0 2px 8px rgba(0,0,0,0.02)",
                transition: "all 0.25s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                "&:hover": {
                  borderColor: "#D1A362",
                  transform: "translateY(-2px)",
                },
                "&:focus-visible": {
                  outline: "2px solid #D1A362",
                  outlineOffset: 2,
                },
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        role === "customer" ? "#D1A362" : "#F5F5F5",
                      color: role === "customer" ? "#FFFFFF" : "#1A1A1A",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <CustomerIcon fontSize="small" />
                  </Box>
                  {role === "customer" && (
                    <CheckIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                  )}
                </Box>

                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#1A1A1A", mb: 0.5 }}
                >
                  Rent Clothes
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#666666", fontSize: "0.85rem", lineHeight: 1.4 }}
                >
                  Discover beautiful outfits for every occasion without buying them.
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  py: 0.6,
                  px: 1.5,
                  borderRadius: 1.5,
                  display: "inline-block",
                  alignSelf: "flex-start",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  backgroundColor:
                    role === "customer" ? "#1A1A1A" : "transparent",
                  color: role === "customer" ? "#FFFFFF" : "#888888",
                  border:
                    role === "customer" ? "none" : "1px solid #E0E0E0",
                  transition: "all 0.2s ease",
                }}
              >
                I’m a Customer
              </Box>
            </Box>

            {/* Provider Card */}
            <Box
              role="button"
              tabIndex={0}
              aria-pressed={role === "provider"}
              onClick={() => setRole("provider")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setRole("provider");
              }}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2.5,
                cursor: "pointer",
                border:
                  role === "provider"
                    ? "2px solid #D1A362"
                    : "1.5px solid #EAEAEA",
                backgroundColor:
                  role === "provider"
                    ? "rgba(209, 163, 98, 0.06)"
                    : "#FFFFFF",
                boxShadow:
                  role === "provider"
                    ? "0 6px 20px rgba(209, 163, 98, 0.15)"
                    : "0 2px 8px rgba(0,0,0,0.02)",
                transition: "all 0.25s ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                "&:hover": {
                  borderColor: "#D1A362",
                  transform: "translateY(-2px)",
                },
                "&:focus-visible": {
                  outline: "2px solid #D1A362",
                  outlineOffset: 2,
                },
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        role === "provider" ? "#D1A362" : "#F5F5F5",
                      color: role === "provider" ? "#FFFFFF" : "#1A1A1A",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <ProviderIcon fontSize="small" />
                  </Box>
                  {role === "provider" && (
                    <CheckIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                  )}
                </Box>

                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#1A1A1A", mb: 0.5 }}
                >
                  Lend Clothes & Earn
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#666666", fontSize: "0.85rem", lineHeight: 1.4 }}
                >
                  Share pieces from your wardrobe and earn from every rental.
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  py: 0.6,
                  px: 1.5,
                  borderRadius: 1.5,
                  display: "inline-block",
                  alignSelf: "flex-start",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  backgroundColor:
                    role === "provider" ? "#1A1A1A" : "transparent",
                  color: role === "provider" ? "#FFFFFF" : "#888888",
                  border:
                    role === "provider" ? "none" : "1px solid #E0E0E0",
                  transition: "all 0.2s ease",
                }}
              >
                I’m a Provider
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* FEEDBACK ALERTS */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ mb: 2.5, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
            Account created successfully! Preparing your experience...
          </Alert>
        )}

        {/* SIGNUP FORM */}
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.2}>
            {/* Full Name */}
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sophia Miller"
              required
              disabled={isLoading || success}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: "#888", fontSize: 20 }} />
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

            {/* Email & Phone */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={isLoading || success}
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

              <TextField
                fullWidth
                label="Mobile Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                required
                disabled={isLoading || success}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: "#888", fontSize: 20 }} />
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
            </Stack>

            {/* Password */}
            <Box>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                disabled={isLoading || success}
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

              {/* Password Strength Indicator */}
              {password && (
                <Box sx={{ mt: 1, px: 0.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#777" }}>
                      Password Strength
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: passwordStrength.color,
                      }}
                    >
                      {passwordStrength.label}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.score}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#EBEBEB",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: passwordStrength.color,
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              disabled={isLoading || success}
              error={Boolean(confirmPassword && password !== confirmPassword)}
              helperText={
                confirmPassword && password !== confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#888", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? (
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
              disabled={isLoading || success}
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
                "Create Account"
              )}
            </Button>
          </Stack>
        </form>

        {/* Footer Link */}
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography variant="body2" sx={{ color: "#666666" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#D1A362",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* RIGHT / EDITORIAL SHOWCASE PANEL (Desktop Only) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: { md: "0 0 46%", lg: "0 0 50%" },
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
              "linear-gradient(180deg, rgba(26,26,26,0.3) 0%, rgba(26,26,26,0.85) 100%)",
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
            Sustainable Luxury Fashion
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
            Wear the runway. Monetize your closet.
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
            Join India’s premier peer-to-peer designer wardrobe collective. Rent
            iconic outfits for celebrations, or earn effortlessly from garments you already own.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ pt: 1, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#D1A362" }}>
                1,000+
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Curated Styles
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#D1A362" }}>
                100%
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Verified Quality
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#D1A362" }}>
                Doorstep
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Delivery & Return
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
