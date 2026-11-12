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
  Chip,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  ArrowBack as ArrowBackIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import WardrobeWondersLogo from "../components/WardrobeWondersLogo";

const heroImage = "/assets/Women/bridal_03.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = (user.role || user.type || "").toLowerCase();
        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else if (role === "seller") {
          navigate("/store/seller/dashboard", { replace: true });
        } else if (role === "provider") {
          navigate("/provider-dashboard", { replace: true });
        } else {
          const from = location.state?.from || "/";
          navigate(from, { replace: true });
        }
      } catch {
        // Corrupted session, stay on login
      }
    }

    // Auto-fill saved email if rememberMe was previously checked
    const savedEmail = localStorage.getItem("ww_saved_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [navigate, location]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter both your registered email address and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email: trimmedEmail,
        password,
      });

      if (res.data?.status && res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (rememberMe) {
          localStorage.setItem("ww_saved_email", trimmedEmail);
        } else {
          localStorage.removeItem("ww_saved_email");
        }

        window.dispatchEvent(new Event("auth_updated"));

        const user = res.data.user;
        const role = (user.role || user.type || "").toLowerCase();
        const stateFrom = location?.state?.from;

        if (stateFrom && role !== "admin" && role !== "provider" && role !== "seller") {
          navigate(stateFrom, { replace: true });
        } else if (role === "admin") {
          navigate("/admin", { replace: true });
        } else if (role === "seller") {
          navigate("/store/seller/dashboard", { replace: true });
        } else if (role === "provider") {
          navigate("/provider-dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(res.data?.message || "Invalid credentials. Please verify your email and password.");
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
          flex: { xs: "1 1 100%", md: "0 0 50%", lg: "0 0 46%" },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          px: { xs: 3, sm: 6, md: 7, lg: 9 },
          py: { xs: 3.5, sm: 5, md: 6 },
          maxWidth: { md: "560px" },
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          paddingTop: "max(24px, env(safe-area-inset-top, 24px))",
          paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
        }}
      >
        {/* Top Header: Brand Logo & Navigation */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: { xs: 3, sm: 4 },
          }}
        >
          <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <WardrobeWondersLogo size="small" />
          </Link>

          <Button
            component={Link}
            to="/signup"
            size="small"
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
                transform: "translateY(-1px)",
              },
            }}
          >
            Create Account
          </Button>
        </Box>

        {/* Central Authentication Form Content */}
        <Box sx={{ my: "auto", py: { xs: 1, sm: 2 } }}>
          {/* Champagne Pill Tag */}
          <Chip
            icon={<SparkleIcon sx={{ fontSize: 13, color: "#D1A362 !important" }} />}
            label="SECURE CLIENT LOGIN"
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
            Sign in to access your luxury rental bookings, store orders, verified reviews, and bespoke AI stylist recommendations.
          </Typography>

          {/* Error Feedback Alert */}
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

          {/* Form Fields */}
          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              {/* Email Address */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#4A4640",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
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
                  autoComplete="email"
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

              {/* Password */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#4A4640",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      fontSize: "0.78rem",
                    }}
                  >
                    PASSWORD
                  </Typography>

                  <Button
                    onClick={() => setForgotPasswordOpen(true)}
                    size="small"
                    sx={{
                      p: 0,
                      minWidth: "auto",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#9A6F2D",
                      textTransform: "none",
                      "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    Forgot Password?
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
                  autoComplete="current-password"
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

              {/* Remember Me Checkbox */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{
                        color: "#B3ABA0",
                        "&.Mui-checked": { color: "#9A6F2D" },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: "#5E5953", fontSize: "0.85rem", fontWeight: 500 }}>
                      Remember my email
                    </Typography>
                  }
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                endIcon={!isLoading && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.45,
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
                  "SIGN IN TO WARDROBE WONDERS"
                )}
              </Button>
            </Stack>
          </form>

          {/* Navigation to Signup */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="body2" sx={{ color: "#77726A", fontSize: "0.92rem" }}>
              New to Wardrobe Wonders?{" "}
              <Link
                to="/signup"
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

        {/* Bottom Trust Micro-Bar (Mobile & Desktop) */}
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
              "linear-gradient(180deg, rgba(18,16,15,0.42) 0%, rgba(18,16,15,0.72) 50%, rgba(18,16,15,0.96) 100%)",
          },
        }}
      >
        {/* Top Floating Couture Emblem */}
        <Box sx={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "flex-end" }}>
          <Chip
            icon={<DiamondIcon sx={{ fontSize: 14, color: "#D1A362 !important" }} />}
            label="AUTHENTICATED COUTURE & FINE JEWELLERY"
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
              fontSize: { md: "2.4rem", lg: "3.1rem" },
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
            Borrow or purchase authenticated designer lehengas, bespoke tuxedos, and temple jewellery sets for a fraction of retail. Complete with verified door-to-door logistics and refundable security deposit protocol.
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
                  Deposit Safety
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BBB3A5", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Refundable security deposit holds & test payment gateway
              </Typography>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <DeliveryIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem" }}>
                  Pan-India Courier
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#BBB3A5", fontSize: "0.72rem", lineHeight: 1.3, display: "block" }}>
                Multi-seller shipment dispatch with real-time tracking
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
                Groq-powered silhouette, occasion & jewellery pairing
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Forgot Password Information Dialog */}
      <Dialog
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            backgroundColor: "#FCFAF7",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <HelpIcon sx={{ color: "#9A6F2D", fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817" }}>
            Account Password Assistance
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#5E5953", lineHeight: 1.6, mb: 2 }}>
            To safeguard high-value couture orders and account security, password resets are processed through verified account verification.
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: "rgba(209, 163, 98, 0.08)",
              borderRadius: 2,
              border: "1px solid rgba(209, 163, 98, 0.25)",
            }}
          >
            <Typography variant="caption" sx={{ color: "#9A6F2D", fontWeight: 800, display: "block", mb: 0.5 }}>
              CLIENT CONCIERGE DESK
            </Typography>
            <Typography variant="body2" sx={{ color: "#1A1817", fontWeight: 600 }}>
              Email: support@wardrobewonders.com
            </Typography>
            <Typography variant="caption" sx={{ color: "#77726A", display: "block", mt: 0.5 }}>
              Responses processed during business hours with an identity-verified reset link.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setForgotPasswordOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: "#1A1817",
              color: "#FFFFFF",
              fontWeight: 700,
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Understood
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
