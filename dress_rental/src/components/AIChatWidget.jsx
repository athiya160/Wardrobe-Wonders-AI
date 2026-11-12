import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  TextField,
  Paper,
  Fab,
  Chip,
  Button,
  Avatar,
  Fade,
  Zoom,
  Tooltip,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import { useNavigate, useLocation } from "react-router-dom";

const quickPrompts = [
  "✨ Wedding Lehengas (Rent)",
  "✨ Designer Outfits (Buy)",
  "✨ Pre-Owned Luxury Fashion",
  "✨ Bridal Kundan Jewellery",
  "✨ Cocktail Gown Under ₹4000",
  "✨ Rent vs Buy Options",
];

const initialWelcome = {
  sender: "ai",
  text: "Welcome to Wardrobe Wonders. I am your personal AI Stylist powered by live catalog intelligence across our Haute Couture Rental collection and designer Store marketplace. Tell me your upcoming occasion, budget, or preferred aesthetic, and I will curate bespoke looks for you.",
  rentalProducts: [],
  storeProducts: [],
  products: [],
  time: "Just now",
};

const AIChatWidget = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([initialWelcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [messages, open]);

  const handleReset = () => {
    setMessages([initialWelcome]);
  };

  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Add user message
    setMessages((prev) => [
      ...prev,
      { sender: "user", text, time: timeString },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/products/chat`, {
        message: text,
      });

      const aiText =
        res.data?.text ||
        "I curated these exclusive pieces from our designer collection for your occasion.";
      const aiRental = Array.isArray(res.data?.rentalProducts)
        ? res.data.rentalProducts
        : [];
      const aiStore = Array.isArray(res.data?.storeProducts)
        ? res.data.storeProducts
        : [];
      const aiProducts = Array.isArray(res.data?.products)
        ? res.data.products
        : [];

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiText,
          intent: res.data?.intent || "HYBRID",
          rentalProducts: aiRental,
          storeProducts: aiStore,
          products: aiProducts,
          source: res.data?.source,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (e) {
      console.error("AI Stylist request error:", e);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I am having a brief moment synchronizing with the couture catalog. Please try asking again or browse our curated collections above!",
          rentalProducts: [],
          storeProducts: [],
          products: [],
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Defensive isolation: Hide floating AI chat on dedicated auth pages
  if (["/login", "/signup", "/sign-up"].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* Floating Action Launcher */}
      {!open && (
        <Zoom in={!open}>
          <Box
            sx={{
              position: "fixed",
              bottom: { xs: 80, sm: 28 },
              right: { xs: 20, sm: 28 },
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {/* Callout Pill */}
            <Paper
              elevation={4}
              onClick={() => setOpen(true)}
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
                py: 1,
                px: 2,
                borderRadius: 5,
                bgcolor: "#1A1817",
                color: "#FFFFFF",
                border: "1px solid rgba(209, 163, 98, 0.4)",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  borderColor: "#D1A362",
                  boxShadow: "0 10px 28px rgba(209, 163, 98, 0.3)",
                },
              }}
            >
              <AutoAwesomeIcon sx={{ color: "#D1A362", fontSize: 18 }} />
              <Typography
                variant="body2"
                fontWeight="600"
                sx={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  letterSpacing: "0.5px",
                }}
              >
                AI Stylist Concierge
              </Typography>
            </Paper>

            {/* Fab Button */}
            <Fab
              aria-label="open ai stylist"
              onClick={() => setOpen(true)}
              sx={{
                width: 60,
                height: 60,
                bgcolor: "#161514",
                color: "#D1A362",
                border: "2px solid #D1A362",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35), 0 0 15px rgba(209, 163, 98, 0.25)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "#24211E",
                  color: "#F5E6C8",
                  transform: "scale(1.06)",
                  boxShadow: "0 12px 35px rgba(209, 163, 98, 0.4)",
                },
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 28 }} />
            </Fab>
          </Box>
        </Zoom>
      )}

      {/* Floating Chat Modal */}
      {open && (
        <Fade in={open}>
          <Paper
            elevation={12}
            sx={{
              position: "fixed",
              bottom: { xs: 74, sm: 24 },
              right: { xs: 12, sm: 24 },
              width: { xs: "calc(100vw - 24px)", sm: 400 },
              height: { xs: "calc(100vh - 36px)", sm: 600 },
              maxHeight: { xs: 680, sm: 640 },
              display: "flex",
              flexDirection: "column",
              borderRadius: "20px",
              overflow: "hidden",
              zIndex: 99999,
              bgcolor: "#FFFFFF",
              border: "1px solid rgba(209, 163, 98, 0.35)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3), 0 0 20px rgba(209, 163, 98, 0.15)",
            }}
          >
            {/* Top Gold Accent Line */}
            <Box
              sx={{
                height: "3px",
                width: "100%",
                background:
                  "linear-gradient(90deg, #9C7238 0%, #D1A362 50%, #F5E6C8 100%)",
              }}
            />

            {/* Luxury Header */}
            <Box
              sx={{
                bgcolor: "#161514",
                color: "#FFFFFF",
                px: 2.5,
                py: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "rgba(209, 163, 98, 0.15)",
                    border: "1.5px solid #D1A362",
                    width: 38,
                    height: 38,
                    color: "#D1A362",
                  }}
                >
                  <SparklesIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        letterSpacing: "0.5px",
                        lineHeight: 1.2,
                        color: "#FAF7F2",
                      }}
                    >
                      AI Stylist Concierge
                    </Typography>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#4CAF50",
                        boxShadow: "0 0 8px #4CAF50",
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255, 255, 255, 0.65)",
                      fontSize: "0.72rem",
                      display: "block",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Wardrobe Wonders • Live Catalog Intelligence
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Reset Chat">
                  <IconButton
                    size="small"
                    onClick={handleReset}
                    sx={{
                      color: "rgba(255, 255, 255, 0.6)",
                      "&:hover": { color: "#D1A362" },
                    }}
                  >
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton
                    size="small"
                    onClick={() => setOpen(false)}
                    sx={{
                      color: "rgba(255, 255, 255, 0.7)",
                      "&:hover": { color: "#FFFFFF" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Chat Messages Body */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                bgcolor: "#FAF8F5",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {messages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                      msg.sender === "user" ? "flex-end" : "flex-start",
                    width: "100%",
                  }}
                >
                  {/* Message Bubble */}
                  <Box
                    sx={{
                      maxWidth: "88%",
                      p: 2,
                      borderRadius:
                        msg.sender === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      bgcolor: msg.sender === "user" ? "#1E1C1A" : "#FFFFFF",
                      color: msg.sender === "user" ? "#FFFFFF" : "#222120",
                      border:
                        msg.sender === "user"
                          ? "1px solid #332F2C"
                          : "1px solid rgba(209, 163, 98, 0.25)",
                      boxShadow:
                        msg.sender === "user"
                          ? "0 4px 12px rgba(0,0,0,0.15)"
                          : "0 2px 10px rgba(0,0,0,0.04)",
                    }}
                  >
                    {msg.sender === "ai" && (
                      <Stack
                        direction="row"
                        spacing={0.8}
                        alignItems="center"
                        mb={0.8}
                      >
                        <SparklesIcon sx={{ color: "#D1A362", fontSize: 14 }} />
                        <Typography
                          variant="caption"
                          fontWeight="700"
                          sx={{
                            color: "#9C7238",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            fontSize: "0.68rem",
                          }}
                        >
                          Couture Advisor
                        </Typography>
                      </Stack>
                    )}

                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.6,
                        whiteSpace: "pre-line",
                        fontSize: "0.88rem",
                      }}
                    >
                      {msg.text}
                    </Typography>

                    {/* Timestamp */}
                    <Box
                      sx={{
                        mt: 0.8,
                        textAlign: "right",
                        fontSize: "0.68rem",
                        color:
                          msg.sender === "user"
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(0,0,0,0.4)",
                      }}
                    >
                      {msg.time}
                    </Box>
                  </Box>

                  {/* Curated Rental Recommendations */}
                  {msg.rentalProducts && msg.rentalProducts.length > 0 && (
                    <Box sx={{ width: "100%", mt: 1.5, pl: 0.5 }}>
                      <Stack direction="row" spacing={0.8} alignItems="center" mb={1}>
                        <CheckroomIcon sx={{ color: "#D1A362", fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          fontWeight="700"
                          sx={{
                            color: "#9C7238",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            fontSize: "0.7rem",
                          }}
                        >
                          Recommended to Rent ({msg.rentalProducts.length})
                        </Typography>
                        <Chip
                          label="Rental"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            bgcolor: "rgba(209, 163, 98, 0.15)",
                            color: "#9C7238",
                            border: "1px solid rgba(209, 163, 98, 0.3)",
                          }}
                        />
                      </Stack>

                      <Stack spacing={1.2}>
                        {msg.rentalProducts.map((p) => (
                          <Paper
                            key={p._id}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: "12px",
                              bgcolor: "#FFFFFF",
                              border: "1px solid #ECE7DE",
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              transition: "all 0.25s ease",
                              "&:hover": {
                                borderColor: "#D1A362",
                                transform: "translateX(3px)",
                                boxShadow: "0 4px 14px rgba(209, 163, 98, 0.15)",
                              },
                            }}
                          >
                            <Box
                              component="img"
                              src={p.image || "/assets/Women/bridal_01.png"}
                              alt={p.name}
                              onError={(e) => {
                                e.target.src = "/assets/Women/bridal_01.png";
                              }}
                              sx={{
                                width: 56,
                                height: 68,
                                objectFit: "cover",
                                borderRadius: "8px",
                                bgcolor: "#F5F3EF",
                                border: "1px solid #ECE7DE",
                              }}
                            />

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight="700"
                                noWrap
                                sx={{ color: "#161514", fontSize: "0.86rem" }}
                              >
                                {p.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                sx={{ display: "block", mb: 0.5 }}
                              >
                                {p.category || "Designer Wear"} •{" "}
                                {p.gender === "men" ? "Men" : "Women"}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight="800"
                                sx={{ color: "#9C7238" }}
                              >
                                ₹{p.price}{" "}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="normal"
                                >
                                  / 3 days
                                </Typography>
                              </Typography>
                            </Box>

                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                navigate(p.url || `/product/${p._id}`);
                                setOpen(false);
                              }}
                              sx={{
                                borderColor: "#D1A362",
                                color: "#9C7238",
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: "600",
                                px: 1.5,
                                fontSize: "0.75rem",
                                minWidth: 64,
                                "&:hover": {
                                  bgcolor: "#161514",
                                  color: "#D1A362",
                                  borderColor: "#161514",
                                },
                              }}
                            >
                              Rent Now
                            </Button>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Curated Store (Buy) Recommendations */}
                  {msg.storeProducts && msg.storeProducts.length > 0 && (
                    <Box sx={{ width: "100%", mt: 1.5, pl: 0.5 }}>
                      <Stack direction="row" spacing={0.8} alignItems="center" mb={1}>
                        <StorefrontIcon sx={{ color: "#2E7D32", fontSize: 16 }} />
                        <Typography
                          variant="caption"
                          fontWeight="700"
                          sx={{
                            color: "#2E7D32",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            fontSize: "0.7rem",
                          }}
                        >
                          Recommended to Buy ({msg.storeProducts.length})
                        </Typography>
                        <Chip
                          label="Store"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            bgcolor: "rgba(46, 125, 50, 0.12)",
                            color: "#2E7D32",
                            border: "1px solid rgba(46, 125, 50, 0.3)",
                          }}
                        />
                      </Stack>

                      <Stack spacing={1.2}>
                        {msg.storeProducts.map((p) => (
                          <Paper
                            key={p._id}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: "12px",
                              bgcolor: "#FFFFFF",
                              border: "1px solid #ECE7DE",
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              transition: "all 0.25s ease",
                              "&:hover": {
                                borderColor: "#2E7D32",
                                transform: "translateX(3px)",
                                boxShadow: "0 4px 14px rgba(46, 125, 50, 0.15)",
                              },
                            }}
                          >
                            <Box
                              component="img"
                              src={p.image || "/assets/Store/store_default.png"}
                              alt={p.title}
                              onError={(e) => {
                                e.target.src = "/assets/Women/bridal_01.png";
                              }}
                              sx={{
                                width: 56,
                                height: 68,
                                objectFit: "cover",
                                borderRadius: "8px",
                                bgcolor: "#F5F3EF",
                                border: "1px solid #ECE7DE",
                              }}
                            />

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" spacing={0.8} alignItems="center" mb={0.3}>
                                <Typography
                                  variant="body2"
                                  fontWeight="700"
                                  noWrap
                                  sx={{ color: "#161514", fontSize: "0.86rem", flex: 1 }}
                                >
                                  {p.title}
                                </Typography>
                                <Chip
                                  label={p.condition === "PRE_OWNED" ? "Pre-Owned" : "New"}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: "0.58rem",
                                    fontWeight: 700,
                                    bgcolor: p.condition === "PRE_OWNED" ? "#FFF8E1" : "#E8F5E9",
                                    color: p.condition === "PRE_OWNED" ? "#F57F17" : "#2E7D32",
                                    border: `1px solid ${p.condition === "PRE_OWNED" ? "#FFE082" : "#A5D6A7"}`,
                                  }}
                                />
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                sx={{ display: "block", mb: 0.5 }}
                              >
                                {p.category} • Sold by {p.storeName}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight="800"
                                sx={{ color: "#2E7D32" }}
                              >
                                ₹{p.price}{" "}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight="normal"
                                >
                                  buy
                                </Typography>
                              </Typography>
                            </Box>

                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                navigate(p.url || `/store/product/${p._id}`);
                                setOpen(false);
                              }}
                              sx={{
                                borderColor: "#2E7D32",
                                color: "#2E7D32",
                                borderRadius: "8px",
                                textTransform: "none",
                                fontWeight: "600",
                                px: 1.5,
                                fontSize: "0.75rem",
                                minWidth: 64,
                                "&:hover": {
                                  bgcolor: "#161514",
                                  color: "#81C784",
                                  borderColor: "#161514",
                                },
                              }}
                            >
                              Buy Now
                            </Button>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Fallback Legacy Products Gallery */}
                  {(!msg.rentalProducts || msg.rentalProducts.length === 0) &&
                    (!msg.storeProducts || msg.storeProducts.length === 0) &&
                    msg.products &&
                    msg.products.length > 0 && (
                      <Box sx={{ width: "100%", mt: 1.5, pl: 0.5 }}>
                        <Typography
                          variant="caption"
                          fontWeight="700"
                          sx={{
                            color: "#9C7238",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            mb: 1,
                            display: "block",
                          }}
                        >
                          Curated Recommendations ({msg.products.length})
                        </Typography>

                        <Stack spacing={1.2}>
                          {msg.products.map((p) => {
                            const isStore = p.type === "STORE" || !!p.storeName;
                            return (
                              <Paper
                                key={p._id}
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  borderRadius: "12px",
                                  bgcolor: "#FFFFFF",
                                  border: "1px solid #ECE7DE",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  transition: "all 0.25s ease",
                                  "&:hover": {
                                    borderColor: isStore ? "#2E7D32" : "#D1A362",
                                    transform: "translateX(3px)",
                                    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                                  },
                                }}
                              >
                                <Box
                                  component="img"
                                  src={p.image || "/assets/Women/bridal_01.png"}
                                  alt={p.name || p.title}
                                  onError={(e) => {
                                    e.target.src = "/assets/Women/bridal_01.png";
                                  }}
                                  sx={{
                                    width: 56,
                                    height: 68,
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    bgcolor: "#F5F3EF",
                                    border: "1px solid #ECE7DE",
                                  }}
                                />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight="700"
                                    noWrap
                                    sx={{ color: "#161514", fontSize: "0.86rem" }}
                                  >
                                    {p.name || p.title}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                    sx={{ display: "block", mb: 0.5 }}
                                  >
                                    {p.category || "Designer Wear"}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    fontWeight="800"
                                    sx={{ color: isStore ? "#2E7D32" : "#9C7238" }}
                                  >
                                    ₹{p.price}{" "}
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color="text.secondary"
                                      fontWeight="normal"
                                    >
                                      {isStore ? "buy" : "/ 3 days"}
                                    </Typography>
                                  </Typography>
                                </Box>

                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    navigate(p.url || (isStore ? `/store/product/${p._id}` : `/product/${p._id}`));
                                    setOpen(false);
                                  }}
                                  sx={{
                                    borderColor: isStore ? "#2E7D32" : "#D1A362",
                                    color: isStore ? "#2E7D32" : "#9C7238",
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    fontWeight: "600",
                                    px: 1.5,
                                    fontSize: "0.75rem",
                                    minWidth: 64,
                                    "&:hover": {
                                      bgcolor: "#161514",
                                      color: isStore ? "#81C784" : "#D1A362",
                                      borderColor: "#161514",
                                    },
                                  }}
                                >
                                  {isStore ? "Buy Now" : "Rent Now"}
                                </Button>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}
                </Box>
              ))}

              {/* Typing Animation */}
              {loading && (
                <Fade in={loading}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      bgcolor: "#FFFFFF",
                      borderRadius: "14px",
                      maxWidth: "85%",
                      border: "1px solid rgba(209, 163, 98, 0.3)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <SparklesIcon
                      sx={{
                        color: "#D1A362",
                        fontSize: 18,
                        animation: "spin 2s linear infinite",
                        "@keyframes spin": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6E6961",
                        fontWeight: "600",
                        letterSpacing: "0.3px",
                      }}
                    >
                      AI Stylist is curating couture pieces...
                    </Typography>
                  </Box>
                </Fade>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Inspiration Chips */}
            <Box
              sx={{
                px: 1.5,
                py: 1,
                bgcolor: "#FFFFFF",
                borderTop: "1px solid #ECE7DE",
                overflowX: "auto",
                whiteSpace: "nowrap",
                display: "flex",
                gap: 1,
                "&::-webkit-scrollbar": { height: 4 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(209, 163, 98, 0.3)",
                  borderRadius: 4,
                },
              }}
            >
              {quickPrompts.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  size="small"
                  clickable
                  onClick={() => sendMessage(prompt.replace(/^✨\s*/, ""))}
                  disabled={loading}
                  sx={{
                    bgcolor: "#F9F6F0",
                    color: "#4A453E",
                    fontWeight: "500",
                    fontSize: "0.74rem",
                    border: "1px solid rgba(209, 163, 98, 0.3)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "#161514",
                      color: "#D1A362",
                      borderColor: "#161514",
                    },
                  }}
                />
              ))}
            </Box>

            {/* Input Composer */}
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              sx={{
                p: 1.5,
                bgcolor: "#FFFFFF",
                borderTop: "1px solid #ECE7DE",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <TextField
                inputRef={inputRef}
                fullWidth
                size="small"
                placeholder="Ask stylist (e.g., 'Wedding cocktail gown under ₹4000')..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: "#FAF8F5",
                    fontSize: "0.85rem",
                    "& fieldset": { borderColor: "#E5DFD5" },
                    "&:hover fieldset": { borderColor: "#D1A362" },
                    "&.Mui-focused fieldset": { borderColor: "#D1A362" },
                  },
                }}
              />
              <IconButton
                type="submit"
                disabled={!input.trim() || loading}
                sx={{
                  bgcolor: "#161514",
                  color: "#D1A362",
                  p: 1.1,
                  borderRadius: "12px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "#2B2621",
                    color: "#F5E6C8",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#EFEAE3",
                    color: "#BDB8B0",
                  },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        </Fade>
      )}
    </>
  );
};

export default AIChatWidget;
