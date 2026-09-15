import { Box, Container, Typography, Button, Stack, Card, CardContent, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

// Luxury Hero Section
const HeroSection = styled(Box)({
  background: "linear-gradient(135deg, rgba(18, 20, 24, 0.93) 0%, rgba(26, 31, 38, 0.90) 50%, rgba(36, 43, 53, 0.95) 100%), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600')",
  backgroundSize: "cover",
  backgroundPosition: "center 30%",
  color: "#FFFFFF",
  padding: "60px 0 50px 0",
  position: "relative",
  overflow: "hidden",
});

const StepCard = styled(Card)({
  borderRadius: "14px",
  border: "1px solid #ECECEC",
  boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
  height: "100%",
  transition: "all 0.25s ease",
  backgroundColor: "#FFFFFF",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  },
});

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F9FAFC" }}>
      <ResponsiveAppBar />

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2, color: "#9E9E9E", fontSize: "0.85rem" }}>
            <MuiLink
              underline="hover"
              color="inherit"
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              Home
            </MuiLink>
            <Typography color="#D1A362" fontSize="0.85rem" fontWeight={500}>
              About Wardrobe Wonders
            </Typography>
          </Breadcrumbs>

          <Box sx={{ maxWidth: "750px" }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.22em",
                color: "#D1A362",
                fontWeight: 700,
                display: "inline-block",
                mb: 1,
              }}
            >
              THE ART OF CIRCULAR LUXURY
            </Typography>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                color: "#FFFFFF",
                fontSize: { xs: "2rem", md: "2.8rem" },
                mb: 1.5,
              }}
            >
              Redefining Haute Couture Access
            </Typography>
            <Typography variant="body1" sx={{ color: "#D1D5DB", fontSize: "1.05rem", lineHeight: 1.6 }}>
              Wardrobe Wonders is an exclusive fashion rental marketplace connecting discerning wearers with bespoke designer labels, royal sherwanis, bridal lehengas, and red-carpet gowns.
            </Typography>
          </Box>
        </Container>
      </HeroSection>

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
        
        {/* Section Header: How It Works */}
        <Box textAlign="center" mb={5}>
          <Typography
            variant="overline"
            sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.15em" }}
          >
            SEAMLESS EXPERIENCE
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 600,
              color: "#111827",
              mt: 0.5,
            }}
          >
            How Wardrobe Wonders Works
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "600px", mx: "auto", mt: 1 }}>
            Four effortless steps between you and runway-ready elegance for any milestone celebration.
          </Typography>
        </Box>

        {/* 4 Steps Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 3,
            mb: 7,
          }}
        >
          <StepCard>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 2,
                }}
              >
                <CheckroomIcon />
              </Box>
              <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.1em" }}>
                STEP 01
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#111827" mt={0.5} gutterBottom>
                Discover & Reserve
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Explore our catalog of authentic designer outfits. Select your event dates with our interactive calendar for 3-day or 7-day rentals.
              </Typography>
            </CardContent>
          </StepCard>

          <StepCard>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 2,
                }}
              >
                <LocalShippingOutlinedIcon />
              </Box>
              <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.1em" }}>
                STEP 02
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#111827" mt={0.5} gutterBottom>
                Pre-Steamed Delivery
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Your garment arrives pristine, sanitized, and sealed in an eco-friendly garment bag 1–2 days ahead of your occasion.
              </Typography>
            </CardContent>
          </StepCard>

          <StepCard>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 2,
                }}
              >
                <CelebrationOutlinedIcon />
              </Box>
              <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.1em" }}>
                STEP 03
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#111827" mt={0.5} gutterBottom>
                Steal the Spotlight
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Turn heads at weddings, black-tie galas, festivities, and parties looking like a million dollars at a fraction of retail price.
              </Typography>
            </CardContent>
          </StepCard>

          <StepCard>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 2,
                }}
              >
                <AutorenewOutlinedIcon />
              </Box>
              <Typography variant="caption" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.1em" }}>
                STEP 04
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#111827" mt={0.5} gutterBottom>
                Free Pickup & Clean
              </Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Pack it back in the prepaid box. Our courier picks it up directly from your doorstep. Dry cleaning is always on us!
              </Typography>
            </CardContent>
          </StepCard>
        </Box>

        {/* Brand Values Banner */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #1C2A39 0%, #293B4D 100%)",
            color: "#FFFFFF",
            p: { xs: 3, md: 5 },
            borderRadius: "18px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
            mb: 6,
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="overline" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.15em" }}>
              OUR PROMISE
            </Typography>
            <Typography variant="h4" fontWeight={600} sx={{ fontFamily: '"Playfair Display", "Georgia", serif', mt: 0.5 }}>
              The Wardrobe Wonders Standard
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            <Box>
              <VerifiedOutlinedIcon sx={{ color: "#D1A362", fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                100% Verified Designers
              </Typography>
              <Typography variant="body2" sx={{ color: "#CBD5E1", lineHeight: 1.6 }}>
                Every garment in our catalog undergoes rigorous multi-point inspection for authenticity, embroidery, seam integrity, and immaculate condition.
              </Typography>
            </Box>

            <Box>
              <RecyclingOutlinedIcon sx={{ color: "#D1A362", fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Sustainable Circular Fashion
              </Typography>
              <Typography variant="body2" sx={{ color: "#CBD5E1", lineHeight: 1.6 }}>
                By renting luxury garments instead of one-off purchases, our community dramatically reduces textile waste and carbon footprints.
              </Typography>
            </Box>

            <Box>
              <SecurityOutlinedIcon sx={{ color: "#D1A362", fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Safe Deposits & Prompt Returns
              </Typography>
              <Typography variant="body2" sx={{ color: "#CBD5E1", lineHeight: 1.6 }}>
                Complete transparency with zero hidden fees. Deposits are refunded seamlessly within 24 hours of return garment check-in.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CTA Bar */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems="center">
          <Button
            variant="contained"
            onClick={() => navigate("/w-dress")}
            sx={{
              backgroundColor: "#D1A362",
              color: "#FFFFFF",
              px: 4,
              py: 1.2,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 14px rgba(209, 163, 98, 0.35)",
              "&:hover": { backgroundColor: "#B88438" },
            }}
          >
            Explore Women&apos;s Collection
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/m-dress")}
            sx={{
              borderColor: "#1C2A39",
              color: "#1C2A39",
              px: 4,
              py: 1.2,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { borderColor: "#111", backgroundColor: "#F4F4F6" },
            }}
          >
            Explore Men&apos;s Collection
          </Button>
          <Button
            variant="text"
            onClick={() => navigate("/contact")}
            sx={{
              color: "#666",
              px: 2,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { color: "#111" },
            }}
          >
            Contact Concierge
          </Button>
        </Stack>
      </Container>

      <Fotter />
    </Box>
  );
};

export default AboutUs;
