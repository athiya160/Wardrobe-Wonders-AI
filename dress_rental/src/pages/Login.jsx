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
  Chip,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  EmailOutlined as EmailIcon,
  LockOutlined as LockIcon,
  ArrowForward as ArrowForwardIcon,
  VerifiedUserOutlined as ShieldIcon,
  LocalShippingOutlined as DeliveryIcon,
  DiamondOutlined as DiamondIcon,
  AutoAwesome as SparkleIcon,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";

const heroImage = "/assets/Women/bridal_03.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fillDemo = (role) => {
    setError("");
    if (role === "customer") {
      setEmail("customer@wardrobewonders.com");
      setPassword("Password123!");
    } else if (role === "provider") {
      setEmail("provider@wardrobewonders.com");
      setPassword("Password123!");
    } else if (role === "admin") {
      setEmail("admin@wardrobewonders.com");
      setPassword("Password123!");
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
        window.dispatchEvent(new Event("auth_updated"));

        const role = res.data.user.role || res.data.user.type;
        const stateFrom = location?.state?.from;
        if (stateFrom && role !== "admin" && role !== "provider") {
          navigate(stateFrom);
        } else if (role === "admin") {
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
      if (!err.response) {
        setError(
          "Network connection error: Unable to reach the server. Please check your internet connection or try again shortly."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to sign in. Please verify your email and password."
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
          flex: { xs: "1 1 100%", md: "0 0 50%", lg: "0 0 46%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          px: { xs: 3, sm: 6, md: 7, lg: 9 },
          py: { xs: 4, sm: 6 },
          maxWidth: { md: "560px" },
          mx: "auto",
        }}
      >
        {/* Top Bar with Brand Logo and Back Navigation */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: { xs: 4, sm: 5 },
          }}
        >
          <Link to="/" style={{ display: "inline-flex", alignItems: "center" }}>
            <img
              src={logo}
              alt="Wardrobe Wonders"
              style={{ height: 38, objectFit: "contain" }}
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
              borderRadius: 2,
              px: 1.8,
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
            ← Storefront
          </Button>
        </Box>

        {/* Central Content Box */}
        <Box sx={{ my: "auto" }}>
          {/* Subtle Tag */}
          <Chip
            icon={<SparkleIcon sx={{ fontSize: 13, color: "#D1A362 !important" }} />}
            label="MEMBERS ATELIER PORTAL"
            sx={{
              backgroundColor: "rgba(209, 163, 98, 0.12)",
              color: "#9A6F2D",
              border: "1px solid rgba(209, 163, 98, 0.3)",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              mb: 2,
              py: 0.4,
              px: 1,
            }}
          />

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              fontSize: { xs: "2rem", sm: "2.4rem" },
              letterSpacing: "-0.02em",
              color: "#1A1817",
              lineHeight: 1.2,
              mb: 1.2,
            }}
          >
            Welcome Back.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#6E6961",
              fontSize: { xs: "0.95rem", sm: "1rem" },
              lineHeight: 1.5,
              mb: 3.5,
            }}
          >
            Sign in to access your luxury rental orders, wishlist, and AI outfit recommendations.
          </Typography>

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
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#4A4640",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    fontSize: "0.78rem",
                    display: "block",
                    mb: 0.8,
                  }}
                >
                  EMAIL ADDRESS
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "#9A948B", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.95rem",
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

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#4A4640",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      fontSize: "0.78rem",
                    }}
                  >
                    PASSWORD
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#9A948B", fontSize: 20 }} />
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
                            <VisibilityOff sx={{ fontSize: 19, color: "#888" }} />
                          ) : (
                            <Visibility sx={{ fontSize: 19, color: "#888" }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.95rem",
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

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                endIcon={!isLoading && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.4,
                  mt: 1,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
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
                  "SIGN IN TO YOUR WARDROBE"
                )}
              </Button>
            </Stack>
          </form>

          {/* Footer Callout */}
          <Box sx={{ textAlign: "center", mt: 3.5 }}>
            <Typography variant="body2" sx={{ color: "#77726A", fontSize: "0.9rem" }}>
              New to Wardrobe Wonders?{" "}
              <Link
                to="/sign-up"
                style={{
                  color: "#9A6F2D",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Create your account →
              </Link>
            </Typography>
          </Box>
        </Box>

        {/* Demo Credentials Helper Pill Strip */}
        <Box
          sx={{
            mt: 4,
            pt: 2.5,
            borderTop: "1px solid #ECE7DE",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#999288",
              fontSize: "0.76rem",
              fontWeight: 600,
              display: "block",
              mb: 1.2,
            }}
          >
            QUICK DEMO PROFILES (1-CLICK FILL):
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip
              label="Customer"
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
              label="Boutique Partner"
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
            <Chip
              label="Platform Admin"
              size="small"
              onClick={() => fillDemo("admin")}
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

      {/* RIGHT / EDITORIAL BRIDAL SHOWCASE (Desktop Viewports) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: { md: "0 0 50%", lg: "0 0 54%" },
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
            label="PEER-TO-PEER LUXURY ON DEMAND"
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
            Haute Couture & 1-Gram Gold for Unforgettable Moments.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#E5DEC9",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              maxWidth: 520,
              mb: 4,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          >
            Borrow authenticated bridal lehengas, bespoke tuxedos, and temple jewellery sets for 10% of retail price. Complete with door-to-door dry cleaning and escrow protection.
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
              <Typography variant="caption" sx={{ color: "#BBB3A5", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Insured refundable security deposit holds
              </Typography>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <DeliveryIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  Pan-India
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BBB3A5", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Guaranteed doorstep delivery & reverse pickup
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
                Groq-powered silhouette & jewellery pairing
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
