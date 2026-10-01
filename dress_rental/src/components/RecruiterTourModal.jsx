import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  IconButton,
  Divider,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CodeIcon from "@mui/icons-material/Code";
import SecurityIcon from "@mui/icons-material/Security";
import PsychologyIcon from "@mui/icons-material/Psychology";
import StorageIcon from "@mui/icons-material/Storage";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LaunchIcon from "@mui/icons-material/Launch";
import PersonIcon from "@mui/icons-material/Person";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import { useNavigate } from "react-router-dom";

// Configurable Developer Profile Links
const DEVELOPER_GITHUB_URL = "https://github.com/athiya160/Wardrobe-Wonders-AI";
const DEVELOPER_RESUME_PATH = "/Athiya_Tabassum_Resume.pdf";
const DEVELOPER_LINKEDIN_URL = import.meta.env.VITE_DEVELOPER_LINKEDIN_URL || "https://www.linkedin.com/in/athiya-tabassum";

export const RecruiterTourModal = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loadingRole, setLoadingRole] = useState(null);
  const [loginFeedback, setLoginFeedback] = useState(null);
  const navigate = useNavigate();

  const handle1ClickLogin = async (role) => {
    setLoadingRole(role);
    setLoginFeedback(null);

    let email = "customer@wardrobewonders.com";
    let targetRoute = "/";

    if (role === "provider") {
      email = "provider@wardrobewonders.com";
      targetRoute = "/provider-dashboard";
    } else if (role === "admin") {
      email = "admin@wardrobewonders.com";
      targetRoute = "/admin";
    }

    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        email,
        password: "Password123!",
      });

      if (res.data?.status && res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setLoginFeedback({
          type: "success",
          message: `Logged in as ${role.toUpperCase()} successfully! Redirecting...`,
        });
        setTimeout(() => {
          onClose();
          navigate(targetRoute);
          window.location.reload();
        }, 800);
      } else {
        setLoginFeedback({
          type: "error",
          message: res.data?.message || "Login failed.",
        });
      }
    } catch (err) {
      setLoginFeedback({
        type: "error",
        message:
          err.response?.data?.message ||
          "Network error connecting to backend API.",
      });
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: { xs: 1, sm: 2 },
          backgroundColor: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label="System Architecture & Specs"
              size="small"
              sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700, fontSize: "0.75rem" }}
            />
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 600 }}>
              v2.4 Production Release
            </Typography>
          </Stack>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color: "#1A1817" }}>
            Wardrobe Wonders — Engineering & Architecture Specifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Decoupled Multi-Tier Luxury Fashion Marketplace with RAG AI & Deposit Escrow
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#666" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem" },
            "& .Mui-selected": { color: "#A07028" },
            "& .MuiTabs-indicator": { backgroundColor: "#D1A362" },
          }}
        >
          <Tab label="1. System Architecture" />
          <Tab label="2. Sandbox Persona Testing" />
          <Tab label="3. Verified Test Suite & Specs" />
        </Tabs>
      </Box>

      <DialogContent sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        {/* TAB 0: SYSTEM ARCHITECTURE */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            <Alert
              severity="info"
              sx={{
                bgcolor: "#F8F6F2",
                color: "#4A3B22",
                border: "1px solid #E6D8BE",
                "& .MuiAlert-icon": { color: "#A07028" },
              }}
            >
              <strong>Production Ready:</strong> Built as a decoupled multi-tier system with
              independent Single Page Application (Vercel), Express REST backend (Render),
              MongoDB Atlas cluster, and FastAPI Groq/FAISS vector search engine.
            </Alert>

            <Grid container spacing={2}>
              {/* Frontend Card */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB", height: "100%" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                    <CodeIcon sx={{ color: "#A07028" }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Frontend Client (SPA)
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    React 18, Vite, Material UI (MUI v5), React Router v6, Emotion.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.8}>
                    <Chip label="Client RBAC" size="small" variant="outlined" />
                    <Chip label="Vite Fast HMR" size="small" variant="outlined" />
                    <Chip label="Vercel Hosted" size="small" variant="outlined" />
                    <Chip label="Mobile Responsive" size="small" variant="outlined" />
                  </Stack>
                </Paper>
              </Grid>

              {/* Backend Card */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB", height: "100%" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                    <StorageIcon sx={{ color: "#1976D2" }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      REST API & Data Tier
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Node.js, Express, MongoDB Atlas, Mongoose ODM, JWT Token Auth.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.8}>
                    <Chip label="Rate-Limiter" size="small" variant="outlined" />
                    <Chip label="Helmet Headers" size="small" variant="outlined" />
                    <Chip label="Escrow Tracking" size="small" variant="outlined" />
                    <Chip label="Render Hosted" size="small" variant="outlined" />
                  </Stack>
                </Paper>
              </Grid>

              {/* AI Microservice Card */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB", height: "100%" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                    <PsychologyIcon sx={{ color: "#7B1FA2" }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      AI Microservice & RAG
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Python FastAPI, Groq LLM API (openai/gpt-oss-20b), FAISS vector store.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.8}>
                    <Chip label="FastAPI Microservice" size="small" variant="outlined" />
                    <Chip label="Groq Llama-3 & FAISS" size="small" variant="outlined" />
                    <Chip label="Active MongoDB Regex Fallback" size="small" variant="outlined" />
                  </Stack>
                </Paper>
              </Grid>

              {/* Security & Marketplace Card */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB", height: "100%" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                    <SecurityIcon sx={{ color: "#2E7D32" }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Marketplace Security & Escrow
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Garment provenance, rental date conflict prevention, deposit escrow refunds.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.8}>
                    <Chip label="Date Conflict Guard" size="small" variant="outlined" />
                    <Chip label="IP Protection" size="small" variant="outlined" />
                    <Chip label="Deposit Escrow" size="small" variant="outlined" />
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* TAB 1: 1-CLICK ROLE SWITCHER */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            <Alert severity="info" sx={{ bgcolor: "#F5F8FA", color: "#1B3A4B", border: "1px solid #D1E3ED", borderRadius: 2 }}>
              <strong>Safe Synthetic Demo Accounts:</strong> One-click testing executes standard <code>POST /login</code> with real bcrypt hash verification and cryptographically signed JWT sessions. All operations strictly enforce server-side Role-Based Access Control (RBAC) without any backdoors or authentication bypasses.
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Recruiters and hiring managers can test any of the 3 persona workflows with 1 click.
              Pre-seeded with synthetic catalog and transaction data for safe demonstration.
            </Typography>

            {loginFeedback && (
              <Alert severity={loginFeedback.type} sx={{ borderRadius: 2 }}>
                {loginFeedback.message}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Customer Account */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB", textAlign: "center" }}>
                  <PersonIcon sx={{ fontSize: 40, color: "#1A1817", mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Customer Persona
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    customer@wardrobewonders.com
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 60, mb: 2 }}>
                    Browse catalog, select dates, test checkout, and view rentals in Customer Dashboard.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={Boolean(loadingRole)}
                    onClick={() => handle1ClickLogin("customer")}
                    sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#333" } }}
                  >
                    {loadingRole === "customer" ? <CircularProgress size={20} color="inherit" /> : "Sign In as Customer"}
                  </Button>
                </Paper>
              </Grid>

              {/* Boutique Provider Account */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB", textAlign: "center" }}>
                  <StorefrontIcon sx={{ fontSize: 40, color: "#A07028", mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Provider Persona
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    provider@wardrobewonders.com
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 60, mb: 2 }}>
                    Access Provider Studio, create luxury listings, accept/decline rental orders, inspect earnings.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={Boolean(loadingRole)}
                    onClick={() => handle1ClickLogin("provider")}
                    sx={{ bgcolor: "#D1A362", color: "#1A1817", fontWeight: 700, "&:hover": { bgcolor: "#B88438" } }}
                  >
                    {loadingRole === "provider" ? <CircularProgress size={20} color="inherit" /> : "Sign In as Provider"}
                  </Button>
                </Paper>
              </Grid>

              {/* Platform Admin Account */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB", textAlign: "center" }}>
                  <AdminPanelSettingsIcon sx={{ fontSize: 40, color: "#D32F2F", mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Platform Admin Persona
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    admin@wardrobewonders.com
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 60, mb: 2 }}>
                    Access Admin Console, moderate reported listings, inspect platform GMV & 15% revenue commissions.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={Boolean(loadingRole)}
                    onClick={() => handle1ClickLogin("admin")}
                    sx={{ bgcolor: "#D32F2F", color: "#FFF", fontWeight: 700, "&:hover": { bgcolor: "#B71C1C" } }}
                  >
                    {loadingRole === "admin" ? <CircularProgress size={20} color="inherit" /> : "Sign In as Admin"}
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}

        {/* TAB 2: VERIFIED TEST SUITES */}
        {activeTab === 2 && (
          <Stack spacing={2.5}>
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              <strong>100% Automated Regression Pass:</strong> All 20 Security Hardening assertions and
              all 39 Master E2E assertions pass cleanly against MongoDB Atlas & Express.
            </Alert>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #EBEBEB" }}>
              <Typography variant="subtitle2" fontWeight={700} color="#1A1817" mb={1}>
                Production Verification Highlights:
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                    <Typography variant="body2">Security headers (nosniff, sameorigin)</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                    <Typography variant="body2">Rate-limiting brute force protection</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                    <Typography variant="body2">Rental date conflict prevention</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                    <Typography variant="body2">Security deposit escrow refund lifecycle</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                    <Typography variant="body2">Admin moderation & GMV analytics</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                    <Typography variant="body2">Resilient AI search fallback</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                href="https://wardrobe-wonders-ai.onrender.com/health"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ textTransform: "none", color: "#1A1817", borderColor: "#DDD" }}
              >
                Inspect Live API Health (`/health`)
              </Button>
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                href={DEVELOPER_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ textTransform: "none", color: "#1A1817", borderColor: "#DDD" }}
              >
                GitHub Repository
              </Button>
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                href={DEVELOPER_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ textTransform: "none", color: "#0077B5", borderColor: "#B8D4E3" }}
              >
                LinkedIn Profile
              </Button>
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                href={DEVELOPER_RESUME_PATH}
                download="Athiya_Tabassum_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  textTransform: "none",
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#2C2825" },
                }}
              >
                Download Resume
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Lead Engineer: Athiya Tabassum | Production Cloud Architecture
        </Typography>
        <Button onClick={onClose} sx={{ color: "#1A1817", fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
