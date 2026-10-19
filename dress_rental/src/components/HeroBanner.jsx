import React from "react";
import { Box, Typography, Button, Container, Stack, Chip } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import LocalLaundryServiceOutlinedIcon from "@mui/icons-material/LocalLaundryServiceOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";

const HeroContainer = styled(Box)({
  position: "relative",
  width: "100%",
  minHeight: "680px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  paddingTop: "60px",
  paddingBottom: "80px",
});

const SplitBackground = styled(Box)(({ side }) => ({
  position: "absolute",
  top: 0,
  [side]: 0,
  width: "50%",
  height: "100%",
  backgroundSize: "cover",
  backgroundPosition: "center",
  zIndex: 1,
}));

const Overlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background:
    "linear-gradient(180deg, rgba(18,16,15,0.72) 0%, rgba(18,16,15,0.85) 60%, rgba(18,16,15,0.95) 100%)",
  zIndex: 2,
});

const ContentWrapper = styled(Box)({
  position: "relative",
  zIndex: 3,
  textAlign: "center",
  color: "#FFFFFF",
  maxWidth: "960px",
  padding: "0 24px",
});

const TrustBadge = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "rgba(255, 255, 255, 0.9)",
  fontSize: "0.82rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
});

export const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <HeroContainer>
      {/* Editorial Split Backgrounds */}
      <SplitBackground
        side="left"
        sx={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1200")',
        }}
      />
      <SplitBackground
        side="right"
        sx={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&q=80&w=1200")',
        }}
      />

      {/* Dark Luxury Vignette Overlay */}
      <Overlay />

      {/* Main Content */}
      <ContentWrapper>
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: "#D1A362 !important" }} />}
          label="CIRCULAR LUXURY COUTURE & HERITAGE JEWELLERY"
          sx={{
            backgroundColor: "rgba(209, 163, 98, 0.16)",
            color: "#D1A362",
            border: "1px solid rgba(209, 163, 98, 0.4)",
            fontWeight: 800,
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            mb: 3,
            py: 0.5,
            px: 1.5,
          }}
        />

        <Typography
          variant="h1"
          sx={{
            fontFamily: '"Playfair Display", "Georgia", serif',
            fontWeight: 700,
            fontSize: { xs: "2.3rem", sm: "3.2rem", md: "4.1rem" },
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            mb: 2.5,
            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          }}
        >
          Haute Couture & Heritage Jewellery. <br />
          <Typography
            component="span"
            variant="inherit"
            sx={{
              background: "linear-gradient(90deg, #FFFFFF 0%, #E8DFCF 40%, #D1A362 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Rent Iconic Designer Wear for 10% of Retail.
          </Typography>
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#E2DACB",
            fontSize: { xs: "1rem", sm: "1.15rem" },
            lineHeight: 1.6,
            maxWidth: "760px",
            mx: "auto",
            mb: 4.5,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          Borrow authenticated bridal lehengas, bespoke tuxedos, and authentic 1-gram gold jewellery. Guaranteed doorstep delivery, verified escrow protection, and AI-powered fit consultation.
        </Typography>

        {/* Primary CTA Buttons */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          flexWrap="wrap"
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/w-dress")}
            endIcon={<ArrowForwardIcon />}
            sx={{
              backgroundColor: "#D1A362",
              color: "#1A1817",
              fontWeight: 800,
              fontSize: "0.92rem",
              letterSpacing: "0.02em",
              px: 3.5,
              py: 1.4,
              borderRadius: 1.5,
              textTransform: "none",
              boxShadow: "0 6px 20px rgba(209,163,98,0.35)",
              "&:hover": {
                backgroundColor: "#B8863A",
                boxShadow: "0 8px 26px rgba(209,163,98,0.5)",
              },
            }}
          >
            Explore Bridal Couture
          </Button>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/jewellery")}
            sx={{
              backgroundColor: "rgba(209, 163, 98, 0.22)",
              border: "1px solid #D1A362",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.92rem",
              letterSpacing: "0.02em",
              px: 3,
              py: 1.4,
              borderRadius: 1.5,
              textTransform: "none",
              backdropFilter: "blur(6px)",
              "&:hover": {
                backgroundColor: "#D1A362",
                color: "#1A1817",
              },
            }}
          >
            1-Gram Gold Jewellery
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/m-dress")}
            sx={{
              borderColor: "rgba(255,255,255,0.45)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.92rem",
              px: 3,
              py: 1.4,
              borderRadius: 1.5,
              textTransform: "none",
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0,0,0,0.3)",
              "&:hover": {
                borderColor: "#D1A362",
                backgroundColor: "rgba(209,163,98,0.15)",
                color: "#D1A362",
              },
            }}
          >
            Men's Tailoring
          </Button>

          <Button
            variant="text"
            size="large"
            onClick={() => navigate("/stylist")}
            startIcon={<AutoAwesomeIcon sx={{ color: "#D1A362" }} />}
            sx={{
              color: "#E2DACB",
              fontWeight: 700,
              fontSize: "0.92rem",
              textTransform: "none",
              "&:hover": { color: "#D1A362", backgroundColor: "transparent" },
            }}
          >
            AI Outfit Concierge
          </Button>
        </Stack>

        {/* Live Trust Badges Strip */}
        <Box
          sx={{
            mt: 7,
            pt: 3,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { xs: 2.5, md: 5 },
          }}
        >
          <TrustBadge>
            <VerifiedOutlinedIcon sx={{ fontSize: 18, color: "#D1A362" }} />
            100% Verified Authenticity
          </TrustBadge>
          <TrustBadge>
            <SecurityOutlinedIcon sx={{ fontSize: 18, color: "#D1A362" }} />
            Insured Security Deposit Escrow
          </TrustBadge>
          <TrustBadge>
            <LocalLaundryServiceOutlinedIcon sx={{ fontSize: 18, color: "#D1A362" }} />
            Eco-Friendly Dry Cleaning Included
          </TrustBadge>
          <TrustBadge>
            <BoltOutlinedIcon sx={{ fontSize: 18, color: "#D1A362" }} />
            Groq LLM AI Fit Concierge
          </TrustBadge>
        </Box>
      </ContentWrapper>
    </HeroContainer>
  );
};

export default HeroBanner;
