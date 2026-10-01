import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VerifiedIcon from "@mui/icons-material/Verified";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import { useNavigate } from "react-router-dom";

// Configurable Developer Profile Links
const DEVELOPER_GITHUB_URL = "https://github.com/athiya160/Wardrobe-Wonders-AI";
const DEVELOPER_RESUME_PATH = "/Athiya_Tabassum_Resume.pdf";
const DEVELOPER_LINKEDIN_URL = import.meta.env.VITE_DEVELOPER_LINKEDIN_URL || "https://www.linkedin.com/in/athiya-tabassum";

export const RecruiterTourModal = ({ open, onClose }) => {
  const [loadingRole, setLoadingRole] = useState(null);
  const [loginFeedback, setLoginFeedback] = useState(null);
  const [techSpecsExpanded, setTechSpecsExpanded] = useState(false);
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
          message: `Logged in as ${role.toUpperCase()} successfully! Redirecting to ${role === "provider" ? "Provider Studio" : role === "admin" ? "Admin Console" : "Storefront"}...`,
        });
        setTimeout(() => {
          onClose();
          navigate(targetRoute);
          window.location.reload();
        }, 600);
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
          borderRadius: 3.5,
          backgroundColor: "#161514",
          color: "#FAF8F5",
          border: "1px solid #332F2A",
          boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
          p: { xs: 1.5, sm: 2.5 },
          backgroundImage: "radial-gradient(ellipse at top right, rgba(209,163,98,0.12) 0%, transparent 60%)",
        },
      }}
    >
      {/* Top Header */}
      <DialogTitle sx={{ m: 0, p: { xs: 1.5, sm: 2 }, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: "0.85rem !important", color: "#D1A362 !important" }} />}
              label="RECRUITER & HIRING MANAGER FAST-TRACK"
              size="small"
              sx={{
                bgcolor: "rgba(209, 163, 98, 0.15)",
                color: "#E5C287",
                border: "1px solid rgba(209, 163, 98, 0.35)",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
              }}
            />
            <Chip
              label="v2.4 Production"
              size="small"
              sx={{ bgcolor: "#24211E", color: "#8E8880", fontSize: "0.7rem", fontWeight: 600 }}
            />
          </Stack>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 700,
              color: "#FAF8F5",
              fontSize: { xs: "1.45rem", sm: "1.9rem" },
              letterSpacing: "-0.01em",
            }}
          >
            Experience Wardrobe Wonders in 1 Click
          </Typography>
          <Typography variant="body2" sx={{ color: "#A8A29A", mt: 0.5, fontSize: "0.88rem" }}>
            Select a live persona below to launch an instant authenticated session with real JWT tokens & pre-seeded data.
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close dialog"
          sx={{
            color: "#A8A29A",
            border: "1px solid #332F2A",
            borderRadius: 2,
            "&:hover": { color: "#FFF", bgcolor: "rgba(255,255,255,0.08)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 1.5, px: { xs: 1.5, sm: 2 } }}>
        {loginFeedback && (
          <Alert
            severity={loginFeedback.type}
            sx={{
              mb: 2.5,
              borderRadius: 2,
              bgcolor: loginFeedback.type === "success" ? "rgba(46, 125, 50, 0.2)" : "rgba(211, 47, 47, 0.2)",
              color: loginFeedback.type === "success" ? "#A5D6A7" : "#FFCDD2",
              border: `1px solid ${loginFeedback.type === "success" ? "#2E7D32" : "#D32F2F"}`,
            }}
          >
            {loginFeedback.message}
          </Alert>
        )}

        {/* 1-CLICK PERSONA CARDS (FRONT AND CENTER) */}
        <Grid container spacing={2} mb={3}>
          {/* 1. Customer Persona */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.5,
                bgcolor: "#1E1C1A",
                border: "1px solid #332F2A",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.25s ease",
                "&:hover": {
                  borderColor: "#D1A362",
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 30px rgba(209, 163, 98, 0.15)",
                },
              }}
            >
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PersonIcon sx={{ color: "#FAF8F5", fontSize: 24 }} />
                  </Box>
                  <Chip
                    label="Customer Journey"
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#CCC", fontSize: "0.7rem", fontWeight: 700 }}
                  />
                </Stack>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#FAF8F5", fontSize: "1.05rem" }}>
                  Customer Storefront
                </Typography>
                <Typography variant="caption" sx={{ color: "#8E8880", display: "block", mb: 1.5 }}>
                  customer@wardrobewonders.com
                </Typography>
                <Typography variant="body2" sx={{ color: "#A8A29A", fontSize: "0.84rem", lineHeight: 1.5, mb: 2 }}>
                  Browse curated bridal wear, pick rental dates, test COD checkout, and inspect security deposit escrow status.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                disabled={Boolean(loadingRole)}
                onClick={() => handle1ClickLogin("customer")}
                endIcon={loadingRole !== "customer" && <ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderColor: "#4A443E",
                  color: "#FAF8F5",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  py: 0.9,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { borderColor: "#D1A362", bgcolor: "rgba(209, 163, 98, 0.1)", color: "#D1A362" },
                }}
              >
                {loadingRole === "customer" ? <CircularProgress size={20} color="inherit" /> : "Launch Customer Demo"}
              </Button>
            </Paper>
          </Grid>

          {/* 2. Boutique Provider Persona */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.5,
                bgcolor: "#1E1C1A",
                border: "1px solid #4A3E2F",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                transition: "all 0.25s ease",
                "&:hover": {
                  borderColor: "#E5C287",
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 30px rgba(209, 163, 98, 0.25)",
                },
              }}
            >
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: "rgba(209, 163, 98, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <StorefrontIcon sx={{ color: "#D1A362", fontSize: 24 }} />
                  </Box>
                  <Chip
                    label="Vendor Studio"
                    size="small"
                    sx={{ bgcolor: "rgba(209, 163, 98, 0.15)", color: "#D1A362", fontSize: "0.7rem", fontWeight: 700 }}
                  />
                </Stack>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#D1A362", fontSize: "1.05rem" }}>
                  Provider Studio
                </Typography>
                <Typography variant="caption" sx={{ color: "#8E8880", display: "block", mb: 1.5 }}>
                  provider@wardrobewonders.com
                </Typography>
                <Typography variant="body2" sx={{ color: "#A8A29A", fontSize: "0.84rem", lineHeight: 1.5, mb: 2 }}>
                  Manage boutique inventory, publish luxury listings with AI tag extractor, accept rental orders & inspect net payouts.
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                disabled={Boolean(loadingRole)}
                onClick={() => handle1ClickLogin("provider")}
                endIcon={loadingRole !== "provider" && <ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#D1A362",
                  color: "#161514",
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  py: 0.9,
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: "0 4px 15px rgba(209, 163, 98, 0.3)",
                  "&:hover": { bgcolor: "#E5C287", boxShadow: "0 6px 20px rgba(209, 163, 98, 0.4)" },
                }}
              >
                {loadingRole === "provider" ? <CircularProgress size={20} color="inherit" /> : "Launch Provider Studio"}
              </Button>
            </Paper>
          </Grid>

          {/* 3. Platform Admin Persona */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.5,
                bgcolor: "#1E1C1A",
                border: "1px solid #442222",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.25s ease",
                "&:hover": {
                  borderColor: "#FF8A80",
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 30px rgba(211, 47, 47, 0.2)",
                },
              }}
            >
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: "rgba(211, 47, 47, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AdminPanelSettingsIcon sx={{ color: "#EF5350", fontSize: 24 }} />
                  </Box>
                  <Chip
                    label="Platform Ops"
                    size="small"
                    sx={{ bgcolor: "rgba(211, 47, 47, 0.15)", color: "#EF5350", fontSize: "0.7rem", fontWeight: 700 }}
                  />
                </Stack>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#EF5350", fontSize: "1.05rem" }}>
                  Admin Moderation
                </Typography>
                <Typography variant="caption" sx={{ color: "#8E8880", display: "block", mb: 1.5 }}>
                  admin@wardrobewonders.com
                </Typography>
                <Typography variant="body2" sx={{ color: "#A8A29A", fontSize: "0.84rem", lineHeight: 1.5, mb: 2 }}>
                  Oversee GMV analytics, 15% platform commissions, resolve counterfeit reports & audit live user permissions.
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                disabled={Boolean(loadingRole)}
                onClick={() => handle1ClickLogin("admin")}
                endIcon={loadingRole !== "admin" && <ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#C62828",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  py: 0.9,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#D32F2F" },
                }}
              >
                {loadingRole === "admin" ? <CircularProgress size={20} color="inherit" /> : "Launch Admin Console"}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* VERIFIED SYSTEM TRUST METRICS RIBBON */}
        <Paper
          elevation={0}
          sx={{
            p: 1.8,
            borderRadius: 2,
            bgcolor: "#1A1817",
            border: "1px solid #2B2824",
            mb: 2,
          }}
        >
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <VerifiedIcon sx={{ color: "#D1A362", fontSize: 18 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 800, display: "block" }}>
                    59 / 59 PASSED
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#8E8880", fontSize: "0.7rem" }}>
                    Automated Test Suite
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SecurityIcon sx={{ color: "#81C784", fontSize: 18 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#81C784", fontWeight: 800, display: "block" }}>
                    JWT + BCRYPT
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#8E8880", fontSize: "0.7rem" }}>
                    Strict Multi-Role RBAC
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <StorageIcon sx={{ color: "#64B5F6", fontSize: 18 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#64B5F6", fontWeight: 800, display: "block" }}>
                    ESCROW LEDGER
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#8E8880", fontSize: "0.7rem" }}>
                    Security Deposit Protection
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PsychologyIcon sx={{ color: "#BA68C8", fontSize: 18 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "#BA68C8", fontWeight: 800, display: "block" }}>
                    MULTI-TIER ARCH
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#8E8880", fontSize: "0.7rem" }}>
                    Vercel + Render + Atlas
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* EXPANDABLE DEEP ARCHITECTURE SPECIFICATIONS */}
        <Accordion
          expanded={techSpecsExpanded}
          onChange={() => setTechSpecsExpanded(!techSpecsExpanded)}
          sx={{
            bgcolor: "#1A1817",
            color: "#FAF8F5",
            border: "1px solid #2B2824",
            borderRadius: "10px !important",
            boxShadow: "none",
            "&:before": { display: "none" },
            overflow: "hidden",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#D1A362" }} />}
            sx={{ px: 2, minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.8 } }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <CodeIcon sx={{ color: "#D1A362", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#FAF8F5", fontSize: "0.86rem" }}>
                Deep Architecture & Security Specifications
              </Typography>
              <Chip
                label="Click to expand"
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#888", fontSize: "0.68rem" }}
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: "#22201D", borderRadius: 1.5, border: "1px solid #332F2A" }}>
                  <Typography variant="caption" fontWeight={700} color="#D1A362" display="block">
                    1. Frontend SPA (Vercel)
                  </Typography>
                  <Typography variant="caption" color="#A8A29A" display="block" mt={0.5}>
                    React 18, Vite, Material UI (MUI v5), React Router v6, ProtectedRoute role guards.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: "#22201D", borderRadius: 1.5, border: "1px solid #332F2A" }}>
                  <Typography variant="caption" fontWeight={700} color="#64B5F6" display="block">
                    2. REST API & Data Tier (Render)
                  </Typography>
                  <Typography variant="caption" color="#A8A29A" display="block" mt={0.5}>
                    Express.js, MongoDB Atlas (Mongoose ODM), Helmet headers, API rate limiting, JWT token verification.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: "#22201D", borderRadius: 1.5, border: "1px solid #332F2A" }}>
                  <Typography variant="caption" fontWeight={700} color="#BA68C8" display="block">
                    3. AI Stylist & Microservice Architecture
                  </Typography>
                  <Typography variant="caption" color="#A8A29A" display="block" mt={0.5}>
                    Python FastAPI, Groq LLM API, FAISS vector indexing with resilient MongoDB regex search fallback.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, bgcolor: "#22201D", borderRadius: 1.5, border: "1px solid #332F2A" }}>
                  <Typography variant="caption" fontWeight={700} color="#81C784" display="block">
                    4. Marketplace Safety & Escrow Lifecycle
                  </Typography>
                  <Typography variant="caption" color="#A8A29A" display="block" mt={0.5}>
                    Rental date conflict prevention, refundable deposit tracking (HELD_IN_ESCROW → REFUNDED).
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      {/* FOOTER ACTIONS: RESUME, GITHUB, LIVE HEALTH, LINKEDIN */}
      <DialogActions
        sx={{
          px: { xs: 1.5, sm: 2 },
          pb: 1.5,
          pt: 1.5,
          borderTop: "1px solid #2B2824",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            href={DEVELOPER_RESUME_PATH}
            download="Athiya_Tabassum_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              bgcolor: "#D1A362",
              color: "#161514",
              fontWeight: 800,
              fontSize: "0.8rem",
              textTransform: "none",
              borderRadius: 1.8,
              px: 1.8,
              py: 0.6,
              "&:hover": { bgcolor: "#E5C287" },
            }}
          >
            Download Resume (Athiya)
          </Button>

          <Button
            variant="outlined"
            startIcon={<LaunchIcon />}
            href={DEVELOPER_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: "#FAF8F5",
              borderColor: "#4A443E",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              borderRadius: 1.8,
              "&:hover": { borderColor: "#D1A362", color: "#D1A362" },
            }}
          >
            GitHub Repo
          </Button>

          <Button
            variant="outlined"
            startIcon={<LaunchIcon />}
            href="https://wardrobe-wonders-ai.onrender.com/health"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: "#81C784",
              borderColor: "rgba(129, 199, 132, 0.4)",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              borderRadius: 1.8,
              "&:hover": { borderColor: "#81C784", bgcolor: "rgba(129, 199, 132, 0.08)" },
            }}
          >
            Live API Health 🟢
          </Button>

          <Button
            variant="outlined"
            startIcon={<LaunchIcon />}
            href={DEVELOPER_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: "#64B5F6",
              borderColor: "rgba(100, 181, 246, 0.4)",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              borderRadius: 1.8,
              "&:hover": { borderColor: "#64B5F6", bgcolor: "rgba(100, 181, 246, 0.08)" },
            }}
          >
            LinkedIn
          </Button>
        </Stack>

        <Button
          onClick={onClose}
          sx={{
            color: "#A8A29A",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { color: "#FFF" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
