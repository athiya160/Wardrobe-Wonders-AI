import React from "react";
import { Box, Typography, Container, Button, Stack, Chip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BoltIcon from "@mui/icons-material/Bolt";
import { useNavigate } from "react-router-dom";

export const AIFeatureBanner = () => {
  const navigate = useNavigate();

  const samplePrompts = [
    "Emerald green bridal lehenga under ₹14,000",
    "Italian velvet tuxedo for reception gala",
    "Blush pink cocktail gown for destination wedding",
    "Heritage embroidered bandhgala for brother's sangeet",
  ];

  return (
    <Box
      sx={{
        my: 8,
        py: { xs: 6, md: 8 },
        px: { xs: 2.5, md: 6 },
        borderRadius: 4,
        background: "linear-gradient(135deg, #1A1817 0%, #24201D 50%, #171514 100%)",
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(209, 163, 98, 0.3)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
      }}
    >
      {/* Decorative Gold Radial Glow */}
      <Box
        sx={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(209,163,98,0.18) 0%, rgba(0,0,0,0) 70%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Chip
            icon={<BoltIcon sx={{ fontSize: 16, color: "#1A1817 !important" }} />}
            label="POWERED BY GROQ LLM • <250MS LATENCY"
            sx={{
              backgroundColor: "#D1A362",
              color: "#1A1817",
              fontWeight: 800,
              fontSize: "0.74rem",
              letterSpacing: "0.08em",
              py: 0.5,
              px: 1,
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 600,
              fontSize: { xs: "1.85rem", md: "2.8rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              maxWidth: 780,
            }}
          >
            Meet Your Personal AI Stylist. <br />
            <Typography
              component="span"
              variant="inherit"
              sx={{ color: "#D1A362" }}
            >
              Haute Couture Tailored in Seconds.
            </Typography>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#CCCCCC",
              maxWidth: 680,
              fontSize: { xs: "0.95rem", md: "1.08rem" },
              lineHeight: 1.6,
            }}
          >
            Describe your event vibe, venue, dress code, or color palette in conversational English. Our intelligent stylist filters real-time availability and curates your complete designer ensemble.
          </Typography>

          {/* Sample Prompts */}
          <Stack
            direction="row"
            spacing={1.2}
            flexWrap="wrap"
            justifyContent="center"
            useFlexGap
            sx={{ pt: 1, pb: 1 }}
          >
            {samplePrompts.map((prompt, i) => (
              <Chip
                key={i}
                label={`"${prompt}"`}
                onClick={() => navigate(`/search?q=${encodeURIComponent(prompt)}`)}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "#E8DFCF",
                  border: "1px solid rgba(209,163,98,0.25)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(209,163,98,0.18)",
                    borderColor: "#D1A362",
                    color: "#FFFFFF",
                  },
                }}
              />
            ))}
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/stylist")}
            endIcon={<ArrowForwardIcon />}
            startIcon={<AutoAwesomeIcon sx={{ color: "#1A1817" }} />}
            sx={{
              mt: 2,
              px: 4,
              py: 1.5,
              backgroundColor: "#D1A362",
              color: "#1A1817",
              fontWeight: 800,
              fontSize: "0.98rem",
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "0 6px 20px rgba(209,163,98,0.35)",
              "&:hover": {
                backgroundColor: "#B8863A",
                boxShadow: "0 8px 24px rgba(209,163,98,0.5)",
              },
            }}
          >
            Launch AI Stylist Consultation
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default AIFeatureBanner;
