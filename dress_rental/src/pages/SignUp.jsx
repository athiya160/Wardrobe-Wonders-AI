import { useState, useEffect } from "react";
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
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  CheckroomOutlined as CustomerIcon,
  StorefrontOutlined as ProviderIcon,
  PersonOutline as PersonIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  LockOutlined as LockIcon,
  ArrowForward as ArrowForwardIcon,
  VerifiedUserOutlined as ShieldIcon,
  LocalShippingOutlined as DeliveryIcon,
  DiamondOutlined as DiamondIcon,
  AutoAwesome as SparkleIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import WardrobeWondersLogo from "../components/WardrobeWondersLogo";

const heroImage = "/assets/Women/look_01.png";

// Password strength calculation utility
const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: "", color: "#E0E0E0" };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

  switch (score) {
    case 1:
      return { score: 25, label: "Weak (add mixed case, numbers)", color: "#E53935" };
    case 2:
      return { score: 50, label: "Fair (add numbers or symbols)", color: "#FB8C00" };
    case 3:
      return { score: 75, label: "Good (meets security standard)", color: "#C5A059" };
    case 4:
      return { score: 100, label: "Strong & Secure", color: "#2E7D32" };
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
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const userRole = (user.role || user.type || "").toLowerCase();
        if (userRole === "admin") {
          navigate("/admin", { replace: true });
        } else if (userRole === "seller") {
          navigate("/store/seller/dashboard", { replace: true });
        } else if (userRole === "provider") {
          navigate("/provider-dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        // Session corrupted, stay on signup
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      setError("Passwords do not match. Please verify your passwords.");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service & Privacy Policy to continue.");
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
            navigate("/provider-dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }, 1200);
      } else {
        setError(res.data?.message || "Registration could not be completed. Please try again.");
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
        width: "100%",
        display: "flex",
        backgroundColor: "#FCFAF7",
        color: "#1A1817",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* =====================================================================
          LEFT / LUXURY FORM PANEL
         ===================================================================== */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", md: "0 0 52%", lg: "0 0 48%" },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          px: { xs: 2.5, sm: 5, md: 6, lg: 8 },
          py: { xs: 3, sm: 4.5, md: 5 },
          maxWidth: { md: "640px" },
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
          paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        }}
      >
        {/* Top Header: Brand Logo & Navigation */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: { xs: 2.5, sm: 3 },
          }}
        >
          <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <WardrobeWondersLogo size="small" />
          </Link>

          <Button
            component={Link}
            to="/login"
            size="small"
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            sx={{
              color: "#8A6D3B",
              fontWeight: 700,
              fontSize: "0.82rem",
              textTransform: "none",
              borderRadius: 2,
              px: 1.6,
              py: 0.6,
              backgroundColor: "rgba(209, 163, 98, 0.08)",
              border: "1px solid rgba(209, 163, 98, 0.25)",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(209, 163, 98, 0.16)",
                borderColor: "#D1A362",
                transform: "translateX(-2px)",
              },
            }}
          >
            Log In
          </Button>
        </Box>

        {/* Central Registration Form Content */}
        <Box sx={{ my: "auto", py: { xs: 1, sm: 1.5 } }}>
          {/* Champagne Pill Tag */}
          <Chip
            icon={<SparkleIcon sx={{ fontSize: 13, color: "#D1A362 !important" }} />}
            label="EXCLUSIVE MEMBERSHIP ENROLLMENT"
            sx={{
              backgroundColor: "rgba(209, 163, 98, 0.12)",
              color: "#9A6F2D",
              border: "1px solid rgba(209, 163, 98, 0.3)",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              mb: 1.5,
              py: 0.4,
              px: 1,
            }}
          />

          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              fontSize: { xs: "1.85rem", sm: "2.2rem" },
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
              color: "#6E6961",
              fontSize: { xs: "0.9rem", sm: "0.95rem" },
              lineHeight: 1.5,
              mb: 3,
            }}
          >
            Join India's curated luxury fashion & jewellery network for bespoke rentals and purchases.
          </Typography>

          {/* Success Banner */}
          {success && (
            <Alert
              icon={<SuccessIcon sx={{ color: "#2E7D32" }} />}
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: "rgba(46, 125, 50, 0.12)",
                color: "#1B5E20",
                fontWeight: 600,
              }}
            >
              Account created successfully! Preparing your personalized wardrobe...
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError("")}
              sx={{
                mb: 3,
                borderRadius: 2,
                border: "1px solid rgba(211, 47, 47, 0.2)",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              {/* Account Type Selector Toggle */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#4A4640",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    fontSize: "0.75rem",
                    display: "block",
                    mb: 0.8,
                  }}
                >
                  ACCOUNT MEMBERSHIP TYPE
                </Typography>

                <ToggleButtonGroup
                  value={role}
                  exclusive
                  onChange={(e, newRole) => newRole && setRole(newRole)}
                  fullWidth
                  size="small"
                  sx={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 2,
                    p: 0.5,
                    border: "1px solid #ECE7DE",
                    "& .MuiToggleButton-root": {
                      border: "none",
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      py: 0.8,
                      color: "#6E6961",
                      transition: "all 0.2s ease",
                      "&.Mui-selected": {
                        backgroundColor: "#1A1817",
                        color: "#FFFFFF",
                        "&:hover": { backgroundColor: "#2C2825" },
                      },
                    },
                  }}
                >
                  <ToggleButton value="customer">
                    <CustomerIcon sx={{ fontSize: 18, mr: 1, color: role === "customer" ? "#D1A362" : "inherit" }} />
                    Customer & Buyer
                  </ToggleButton>
                  <ToggleButton value="provider">
                    <ProviderIcon sx={{ fontSize: 18, mr: 1, color: role === "provider" ? "#D1A362" : "inherit" }} />
                    Boutique Designer
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Full Name */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#4A4640",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    fontSize: "0.75rem",
                    display: "block",
                    mb: 0.6,
                  }}
                >
                  FULL LEGAL NAME
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Radhika Sharma"
                  required
                  autoComplete="name"
                  disabled={isLoading || success}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: "#9A948B", fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.92rem",
                      border: "1px solid #ECE7DE",
                      transition: "all 0.2s ease",
                      "&:hover": { borderColor: "#D1A362" },
                      "&.Mui-focused": {
                        borderColor: "#D1A362",
                        boxShadow: "0 0 0 3px rgba(209, 163, 98, 0.18)",
                      },
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
              </Box>

              {/* Email & Mobile Split Grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                {/* Email Address */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#4A4640",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      fontSize: "0.75rem",
                      display: "block",
                      mb: 0.6,
                    }}
                  >
                    EMAIL ADDRESS
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    disabled={isLoading || success}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: "#9A948B", fontSize: 19 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.92rem",
                        border: "1px solid #ECE7DE",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#D1A362" },
                        "&.Mui-focused": {
                          borderColor: "#D1A362",
                          boxShadow: "0 0 0 3px rgba(209, 163, 98, 0.18)",
                        },
                        "& fieldset": { border: "none" },
                      },
                    }}
                  />
                </Box>

                {/* Mobile Number */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#4A4640",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      fontSize: "0.75rem",
                      display: "block",
                      mb: 0.6,
                    }}
                  >
                    MOBILE NUMBER
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    required
                    autoComplete="tel"
                    disabled={isLoading || success}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: "#9A948B", fontSize: 19 }} />
                          <Typography variant="caption" sx={{ color: "#6E6961", fontWeight: 700, ml: 0.5, mr: 0.5 }}>
                            +91
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.92rem",
                        border: "1px solid #ECE7DE",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#D1A362" },
                        "&.Mui-focused": {
                          borderColor: "#D1A362",
                          boxShadow: "0 0 0 3px rgba(209, 163, 98, 0.18)",
                        },
                        "& fieldset": { border: "none" },
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Password & Confirm Password Split Grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                {/* Password */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#4A4640",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      fontSize: "0.75rem",
                      display: "block",
                      mb: 0.6,
                    }}
                  >
                    CREATE PASSWORD
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    autoComplete="new-password"
                    disabled={isLoading || success}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: "#9A948B", fontSize: 19 }} />
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
                              <VisibilityOff sx={{ fontSize: 18, color: "#888" }} />
                            ) : (
                              <Visibility sx={{ fontSize: 18, color: "#888" }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.92rem",
                        border: "1px solid #ECE7DE",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#D1A362" },
                        "&.Mui-focused": {
                          borderColor: "#D1A362",
                          boxShadow: "0 0 0 3px rgba(209, 163, 98, 0.18)",
                        },
                        "& fieldset": { border: "none" },
                      },
                    }}
                  />
                </Box>

                {/* Confirm Password */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#4A4640",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      fontSize: "0.75rem",
                      display: "block",
                      mb: 0.6,
                    }}
                  >
                    CONFIRM PASSWORD
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                    disabled={isLoading || success}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: "#9A948B", fontSize: 19 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff sx={{ fontSize: 18, color: "#888" }} />
                            ) : (
                              <Visibility sx={{ fontSize: 18, color: "#888" }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.92rem",
                        border: "1px solid #ECE7DE",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#D1A362" },
                        "&.Mui-focused": {
                          borderColor: "#D1A362",
                          boxShadow: "0 0 0 3px rgba(209, 163, 98, 0.18)",
                        },
                        "& fieldset": { border: "none" },
                      },
                    }}
                  />
                </Box>
              </Box>

              {/* Password Strength Indicator */}
              {password && (
                <Box sx={{ mt: 0.5 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.4}>
                    <Typography variant="caption" sx={{ color: "#77726A", fontSize: "0.72rem" }}>
                      Security Strength:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: passwordStrength.color, fontWeight: 700, fontSize: "0.72rem" }}
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
                      backgroundColor: "#ECE7DE",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: passwordStrength.color,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              )}

              {/* Terms of Service & Privacy Policy Agreement */}
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      size="small"
                      sx={{
                        color: "#B3ABA0",
                        "&.Mui-checked": { color: "#9A6F2D" },
                        p: 0.5,
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ color: "#6E6961", fontSize: "0.78rem" }}>
                      I agree to the{" "}
                      <Link to="/terms" style={{ color: "#9A6F2D", fontWeight: 700, textDecoration: "none" }}>
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" style={{ color: "#9A6F2D", fontWeight: 700, textDecoration: "none" }}>
                        Privacy Policy
                      </Link>
                      .
                    </Typography>
                  }
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading || success}
                endIcon={!isLoading && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.4,
                  mt: 1,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  borderRadius: 2,
                  backgroundColor: "#1A1817",
                  color: "#FFFFFF",
                  border: "1px solid #1A1817",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    backgroundColor: "#2C2825",
                    borderColor: "#D1A362",
                    boxShadow: "0 8px 24px rgba(209, 163, 98, 0.25)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={22} sx={{ color: "#D1A362" }} />
                ) : (
                  "CREATE WARDROBE ACCOUNT"
                )}
              </Button>
            </Stack>
          </form>

          {/* Navigation to Login */}
          <Box sx={{ textAlign: "center", mt: 3.5 }}>
            <Typography variant="body2" sx={{ color: "#77726A", fontSize: "0.92rem" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{
                  color: "#9A6F2D",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Sign in here →
              </Link>
            </Typography>
          </Box>
        </Box>

        {/* Bottom Trust Micro-Bar */}
        <Box
          sx={{
            pt: 2,
            borderTop: "1px solid #EFEAE2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" sx={{ color: "#9E978E", fontSize: "0.74rem" }}>
            © {new Date().getFullYear()} Wardrobe Wonders. All rights reserved.
          </Typography>
          <Box display="flex" gap={1.5}>
            <Link to="/terms" style={{ color: "#9E978E", fontSize: "0.74rem", textDecoration: "none" }}>
              Terms
            </Link>
            <Typography variant="caption" sx={{ color: "#D1C9BE" }}>•</Typography>
            <Link to="/privacy" style={{ color: "#9E978E", fontSize: "0.74rem", textDecoration: "none" }}>
              Privacy
            </Link>
          </Box>
        </Box>
      </Box>

      {/* =====================================================================
          RIGHT / EDITORIAL SHOWCASE (Desktop Viewports)
         ===================================================================== */}
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
              "linear-gradient(180deg, rgba(18,16,15,0.4) 0%, rgba(18,16,15,0.7) 50%, rgba(18,16,15,0.96) 100%)",
          },
        }}
      >
        {/* Top Floating Tag */}
        <Box sx={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "flex-end" }}>
          <Chip
            icon={<DiamondIcon sx={{ fontSize: 14, color: "#D1A362 !important" }} />}
            label="PEER-TO-PEER LUXURY & ATELIER STORE"
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(10px)",
              color: "#E5DEC9",
              border: "1px solid rgba(209, 163, 98, 0.35)",
              fontWeight: 700,
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
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
              fontSize: { md: "2.3rem", lg: "2.9rem" },
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              mb: 2,
              textShadow: "0 2px 14px rgba(0,0,0,0.5)",
            }}
          >
            Sustainable Luxury. Infinite Wardrobe Possibilities.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#E5DEC9",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              maxWidth: 500,
              mb: 4,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          >
            Experience handpicked heritage wear, 1-gram gold jewellery, and couture silhouettes without the burden of one-time purchase waste.
          </Typography>

          {/* Trust Matrix Strip */}
          <Box
            sx={{
              pt: 3,
              borderTop: "1px solid rgba(255,255,255,0.18)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2.5,
            }}
          >
            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <ShieldIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  Verified Identity
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BBB3A5", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Zero KYC leakage with encrypted account protection
              </Typography>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <DeliveryIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  Tracked Delivery
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BBB3A5", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Professional dry-cleaning & secure courier handoff
              </Typography>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <SparkleIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  AI Stylist
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BBB3A5", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Instant size and occasion matchmaking engine
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;
