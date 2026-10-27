import React from "react";
import { Box, Typography, Button, Container, Stack, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAF8F5",
        color: "#1A1817",
      }}
    >
      <ResponsiveAppBar />

      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          py: { xs: 8, md: 12 },
          px: 3,
        }}
      >
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: "#D1A362 !important" }} />}
          label="404 • ATELIER ARCHIVE"
          sx={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #ECE7DE",
            color: "#A07028",
            fontWeight: 800,
            fontSize: "0.75rem",
            letterSpacing: "0.12em",
            mb: 3,
            py: 0.5,
            px: 1,
          }}
        />

        <Typography
          variant="h1"
          sx={{
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontWeight: 700,
            fontSize: { xs: "2.4rem", sm: "3.2rem", md: "3.8rem" },
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#1A1817",
            mb: 2,
          }}
        >
          This Couture Piece Has Moved.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#777169",
            fontSize: { xs: "0.95rem", sm: "1.05rem" },
            maxWidth: 580,
            lineHeight: 1.6,
            mb: 4.5,
          }}
        >
          The bridal lehenga, tuxedo, or heritage jewellery set you are looking for may be currently reserved, archived, or undergoing white-glove curation.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          width="100%"
          maxWidth="460px"
        >
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate("/w-dress")}
            endIcon={<ArrowForwardIcon />}
            startIcon={<CheckroomOutlinedIcon />}
            sx={{
              backgroundColor: "#1A1817",
              color: "#FFFFFF",
              border: "1px solid #D1A362",
              py: 1.3,
              fontWeight: 700,
              fontSize: "0.9rem",
              borderRadius: 1.8,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              "&:hover": {
                backgroundColor: "#2E2A27",
                borderColor: "#E5C287",
                boxShadow: "0 6px 20px rgba(209, 163, 98, 0.25)",
              },
            }}
          >
            Explore Bridal Couture
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate("/jewellery")}
            startIcon={<DiamondOutlinedIcon />}
            sx={{
              borderColor: "#D1A362",
              color: "#8A6D3B",
              py: 1.3,
              fontWeight: 700,
              fontSize: "0.9rem",
              borderRadius: 1.8,
              textTransform: "none",
              backgroundColor: "#FFFFFF",
              "&:hover": {
                borderColor: "#8A6D3B",
                backgroundColor: "rgba(209, 163, 98, 0.08)",
              },
            }}
          >
            1-Gram Gold Jewellery
          </Button>
        </Stack>

        <Button
          onClick={() => navigate("/")}
          size="small"
          sx={{
            mt: 4,
            color: "#888",
            fontWeight: 600,
            fontSize: "0.85rem",
            textTransform: "none",
            "&:hover": { color: "#1A1817", backgroundColor: "transparent" },
          }}
        >
          ← Return to Storefront Home
        </Button>
      </Container>

      <Fotter />
    </Box>
  );
};

export default NotFound;
