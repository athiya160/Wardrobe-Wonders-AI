import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

// Password strength calculation
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

export const AuthModal = ({ open, onClose, initialTab = "login" }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab === "signup" ? 1 : 0);

  // Sync tab if initialTab changes when opening
  useEffect(() => {
    setTab(initialTab === "signup" ? 1 : 0);
  }, [initialTab, open]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupRole, setSignupRole] = useState("customer");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const passwordStrength = getPasswordStrength(signupPassword);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setLoginError("");
    setSignupError("");
    setSignupSuccess(false);
  };

  // Demo profile filler
  const fillDemo = (role) => {
    setTab(0);
    setLoginError("");
    if (role === "customer") {
      setLoginEmail("customer@wardrobewonders.com");
      setLoginPassword("Password123!");
    } else if (role === "provider") {
      setLoginEmail("provider@wardrobewonders.com");
      setLoginPassword("Password123!");
    } else if (role === "admin") {
      setLoginEmail("admin@wardrobewonders.com");
      setLoginPassword("Password123!");
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both your email and password.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      if (res.data?.status && res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("auth_updated"));
        onClose();

        const role = res.data.user.role || res.data.user.type;
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "provider") {
          navigate("/provider-dashboard");
        }
      } else {
        setLoginError(res.data?.message || "Invalid email or password.");
      }
    } catch (err) {
      if (!err.response) {
        setLoginError("Network connection error: Unable to reach the server. Please try again.");
      } else {
        setLoginError(err.response?.data?.message || "Unable to sign in. Please check your credentials.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e) => {
    if (e) e.preventDefault();
    setSignupError("");

    if (!signupName.trim()) {
      setSignupError("Please enter your full name.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setSignupError("Please enter a valid email address.");
      return;
    }
    const cleanPhone = signupPhone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setSignupError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match. Please verify.");
      return;
    }

    const nameParts = signupName.trim().split(" ");
    const firstname = nameParts[0] || "";
    const lastname = nameParts.slice(1).join(" ") || "";
    const username = signupEmail.split("@")[0];

    const payload = {
      name: signupName.trim(),
      firstname,
      lastname,
      phone: cleanPhone,
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
      username,
      role: signupRole,
    };

    setSignupLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/register`, payload);
      if (res.data?.status || res.status === 200) {
        // If server returned token, log in directly
        if (res.data?.token && res.data?.user) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          window.dispatchEvent(new Event("auth_updated"));
          setSignupSuccess(true);
          setTimeout(() => {
            onClose();
            if (signupRole === "provider") navigate("/provider-dashboard");
          }, 800);
        } else {
          // Switch to login tab and prefill
          setSignupSuccess(true);
          setLoginEmail(signupEmail);
          setTimeout(() => {
            setTab(0);
          }, 1200);
        }
      } else {
        setSignupError(res.data?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      if (!err.response) {
        setSignupError("Network connection error: Unable to reach the server.");
      } else {
        setSignupError(err.response?.data?.message || "Registration failed. An account with this email may already exist.");
      }
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          position: "relative",
        },
      }}
    >
      {/* Luxury Gold Accent Top Border */}
      <Box
        sx={{
          height: 4,
          background: "linear-gradient(90deg, #D1A362 0%, #E8C88A 50%, #D1A362 100%)",
        }}
      />

      {/* Close Button */}
      <IconButton
        onClick={onClose}
        size="small"
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          color: "#888",
          "&:hover": { color: "#1A1817", backgroundColor: "#F5F5F5" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ px: { xs: 3, sm: 4 }, pt: 3.5, pb: 4 }}>
        {/* Brand Header */}
        <Box sx={{ textAlign: "center", mb: 2.5 }}>
          <img
            src={logo}
            alt="Wardrobe Wonders"
            style={{ height: 32, objectFit: "contain", marginBottom: 6 }}
          />
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              color: "#1A1817",
              letterSpacing: "-0.01em",
            }}
          >
            {tab === 0 ? "Welcome to Wardrobe Wonders" : "Join Wardrobe Wonders"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#777", fontSize: "0.85rem", mt: 0.5 }}>
            {tab === 0
              ? "Sign in to access your wardrobe, rentals, and AI stylist."
              : "Discover & rent peer-to-peer luxury fashion across the nation."}
          </Typography>
        </Box>

        {/* Tab Toggle: Sign In vs Create Account */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2.5 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#D1A362",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab
              label="Sign In"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.92rem",
                color: tab === 0 ? "#1A1817" : "#777",
                "&.Mui-selected": { color: "#1A1817" },
              }}
            />
            <Tab
              label="Create Account"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.92rem",
                color: tab === 1 ? "#1A1817" : "#777",
                "&.Mui-selected": { color: "#1A1817" },
              }}
            />
          </Tabs>
        </Box>

        {/* ===================== TAB 0: SIGN IN ===================== */}
        {tab === 0 && (
          <Box component="form" onSubmit={handleLoginSubmit} noValidate>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: "0.82rem" }}>
                {loginError}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#888", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showLoginPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#888", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        edge="end"
                      >
                        {showLoginPassword ? (
                          <VisibilityOff sx={{ fontSize: 18 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                  },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loginLoading}
                sx={{
                  mt: 1,
                  py: 1.2,
                  bgcolor: "#1A1817",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  textTransform: "none",
                  borderRadius: 1.5,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  "&:hover": {
                    bgcolor: "#2C2825",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                  },
                }}
              >
                {loginLoading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
              </Button>
            </Stack>

            {/* Switch to Signup */}
            <Box sx={{ textAlign: "center", mt: 2.5 }}>
              <Typography variant="body2" sx={{ color: "#666", fontSize: "0.85rem" }}>
                Don't have an account?{" "}
                <Typography
                  component="span"
                  variant="body2"
                  onClick={() => setTab(1)}
                  sx={{
                    color: "#A07028",
                    fontWeight: 700,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Create one now
                </Typography>
              </Typography>
            </Box>

            {/* Discreet Platform Sandbox Credentials Helper */}
            <Box sx={{ textAlign: "center", mt: 3, pt: 2, borderTop: "1px solid #EEEEEE" }}>
              <Typography variant="caption" sx={{ color: "#9E9E9E", fontSize: "0.74rem" }}>
                Platform Demo Profiles:{" "}
                <Typography
                  component="span"
                  variant="caption"
                  onClick={() => fillDemo("customer")}
                  sx={{
                    color: "#8A6D3B",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Customer
                </Typography>
                {" • "}
                <Typography
                  component="span"
                  variant="caption"
                  onClick={() => fillDemo("provider")}
                  sx={{
                    color: "#8A6D3B",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Boutique Partner
                </Typography>
                {" • "}
                <Typography
                  component="span"
                  variant="caption"
                  onClick={() => fillDemo("admin")}
                  sx={{
                    color: "#8A6D3B",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Platform Admin
                </Typography>
              </Typography>
            </Box>
          </Box>
        )}

        {/* ===================== TAB 1: CREATE ACCOUNT ===================== */}
        {tab === 1 && (
          <Box component="form" onSubmit={handleSignupSubmit} noValidate>
            {signupError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: "0.82rem" }}>
                {signupError}
              </Alert>
            )}

            {signupSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5, fontSize: "0.82rem" }}>
                Welcome to Wardrobe Wonders! Signing you in...
              </Alert>
            )}

            <Stack spacing={1.8}>
              {/* Role Selector */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#666", fontWeight: 700, mb: 0.8, display: "block" }}
                >
                  I want to:
                </Typography>
                <ToggleButtonGroup
                  value={signupRole}
                  exclusive
                  onChange={(e, val) => val && setSignupRole(val)}
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      py: 0.8,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      borderRadius: 1.5,
                      borderColor: "#E0E0E0",
                      "&.Mui-selected": {
                        backgroundColor: "#1A1817",
                        color: "#FFFFFF",
                        borderColor: "#1A1817",
                        "&:hover": { backgroundColor: "#2C2825" },
                      },
                    },
                  }}
                >
                  <ToggleButton value="customer">
                    <CheckroomOutlinedIcon sx={{ fontSize: 18, mr: 0.8, color: "#D1A362" }} />
                    Rent Outfits
                  </ToggleButton>
                  <ToggleButton value="provider">
                    <StorefrontOutlinedIcon sx={{ fontSize: 18, mr: 0.8, color: "#D1A362" }} />
                    List Wardrobe
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Full Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: "#888", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                label="Email Address"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="name@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#888", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                label="Mobile Number"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                placeholder="10-digit mobile number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlinedIcon sx={{ color: "#888", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                  },
                }}
              />

              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Password"
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: "#888", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          edge="end"
                        >
                          {showSignupPassword ? (
                            <VisibilityOff sx={{ fontSize: 18 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                    },
                  }}
                />
                {signupPassword && (
                  <Box sx={{ mt: 0.8, px: 0.5 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.4}>
                      <Typography variant="caption" sx={{ color: "#888", fontSize: "0.72rem" }}>
                        Strength:
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
                        backgroundColor: "#E0E0E0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: passwordStrength.color,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Confirm Password"
                type={showSignupPassword ? "text" : "password"}
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#888", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                  },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={signupLoading}
                sx={{
                  mt: 1.5,
                  py: 1.2,
                  bgcolor: "#1A1817",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  textTransform: "none",
                  borderRadius: 1.5,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  "&:hover": {
                    bgcolor: "#2C2825",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                  },
                }}
              >
                {signupLoading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Create Account & Explore"
                )}
              </Button>
            </Stack>

            {/* Switch to Sign In */}
            <Box sx={{ textAlign: "center", mt: 2.5 }}>
              <Typography variant="body2" sx={{ color: "#666", fontSize: "0.85rem" }}>
                Already have an account?{" "}
                <Typography
                  component="span"
                  variant="body2"
                  onClick={() => setTab(0)}
                  sx={{
                    color: "#A07028",
                    fontWeight: 700,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Sign in
                </Typography>
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
