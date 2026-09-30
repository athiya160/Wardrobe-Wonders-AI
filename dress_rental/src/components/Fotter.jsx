import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Container, Stack, Typography, Divider } from "@mui/material";
import { RecruiterTourModal } from "./RecruiterTourModal";

const Fotter = () => {
  const [archOpen, setArchOpen] = useState(false);

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#161514",
        color: "#CCC",
        pt: 4,
        pb: 3,
        mt: "auto",
        borderTop: "1px solid #2B2826",
        zIndex: 10,
        position: "relative",
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={3}
        >
          <Box sx={{ textAlign: "left", maxWidth: 420 }}>
            <Typography variant="body2" sx={{ color: "#D1A362", fontWeight: 800, letterSpacing: "0.08em" }}>
              WARDROBE WONDERS
            </Typography>
            <Typography variant="caption" sx={{ color: "#888", display: "block", mt: 0.5, lineHeight: 1.5 }}>
              India’s premier peer-to-peer luxury fashion rental marketplace. Authenticated designer bridalwear, couture sherwanis, and red carpet attire delivered with door-to-door sanitization and insured deposit escrow.
            </Typography>
          </Box>

          {/* Legal & Policy Navigation Links */}
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 2.5 }}
            flexWrap="wrap"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            sx={{
              "& a, & span": {
                color: "#9E9E9E",
                fontSize: "0.78rem",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s ease",
                "&:hover": { color: "#D1A362" },
              },
            }}
          >
            <Link to="/about-us">About WW</Link>
            <Link to="/contact">Concierge</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/rental-policy">Rental Policy</Link>
            <Link to="/refund-policy">Deposit Policy</Link>
            <Link to="/provider-terms">Boutique Terms</Link>
            <Link to="/report-listing">Trust & Authenticity</Link>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.07)" }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={1.5}
        >
          <Typography variant="caption" sx={{ color: "#777", fontSize: "0.72rem" }}>
            © {new Date().getFullYear()} Wardrobe Wonders Inc. All rights reserved. Peer-to-Peer Luxury Fashion Rentals.
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography
              component="span"
              onClick={() => setArchOpen(true)}
              sx={{
                color: "#888",
                fontSize: "0.72rem",
                cursor: "pointer",
                transition: "color 0.2s",
                "&:hover": { color: "#D1A362" },
              }}
            >
              System Architecture & Specs ⚙️
            </Typography>
            <Typography variant="caption" sx={{ color: "#444" }}>•</Typography>
            <a
              href="https://wardrobe-wonders-ai.onrender.com/health"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#888", fontSize: "0.72rem", textDecoration: "none" }}
            >
              Live API Status 🟢
            </a>
            <Typography variant="caption" sx={{ color: "#444" }}>•</Typography>
            <Typography variant="caption" sx={{ color: "#888", fontSize: "0.72rem" }}>
              Engineered by Athiya Tabassum
            </Typography>
          </Stack>
        </Stack>
      </Container>

      <RecruiterTourModal open={archOpen} onClose={() => setArchOpen(false)} />
    </Box>
  );
};

export default Fotter;
