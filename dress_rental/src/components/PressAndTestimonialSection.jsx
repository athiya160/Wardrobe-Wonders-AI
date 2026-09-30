import React from "react";
import { Box, Typography, Container, Grid, Card, CardContent, Stack, Avatar, Rating } from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import VerifiedIcon from "@mui/icons-material/Verified";

const pressLogos = [
  "VOGUE",
  "HARPER'S BAZAAR",
  "ELLE LUXURY",
  "GQ STYLE",
  "FORBES CIRCULAR",
];

const reviews = [
  {
    name: "Ananya Kulkarni",
    role: "Verified Renter • Mumbai",
    occasion: "Sister's Wedding Sangeet",
    text: "Rented an authentic Sabyasachi heritage lehenga that retailed for ₹1,80,000 for only ₹14,000. It arrived fresh, pristine, and fitted like a dream. Returning it in the prepaid bag was zero hassle!",
    rating: 5,
    avatar: "A",
  },
  {
    name: "Rohan Malhotra",
    role: "Boutique Partner • Delhi NCR",
    occasion: "Designer Sherwani Owner",
    text: "I had three bespoke wedding sherwanis sitting unworn in my closet. Through Wardrobe Wonders' Provider Studio, I've earned over ₹58,000 this season while knowing my garments are fully insured.",
    rating: 5,
    avatar: "R",
  },
  {
    name: "Dr. Meera Sen",
    role: "Verified Renter • Bangalore",
    occasion: "Medical Gala Reception",
    text: "The AI Stylist matched my event dress code and suggested an emerald silk gown that stole the show. Delivered on Friday, picked up Monday, deposit returned within hours. Exceptional service.",
    rating: 5,
    avatar: "M",
  },
];

export const PressAndTestimonialSection = () => {
  return (
    <Box sx={{ py: 9, backgroundColor: "#FAF8F5" }}>
      <Container maxWidth="xl">
        {/* Press Bar */}
        <Box sx={{ textAlign: "center", mb: 8, pb: 4, borderBottom: "1px solid #E8DFCF" }}>
          <Typography
            variant="overline"
            sx={{
              color: "#8A6D3B",
              fontWeight: 800,
              letterSpacing: "0.2em",
              fontSize: "0.78rem",
              display: "block",
              mb: 3,
            }}
          >
            AS FEATURED IN LUXURY & TECH EDITORIALS
          </Typography>
          <Stack
            direction="row"
            spacing={{ xs: 3, md: 7 }}
            justifyContent="center"
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            {pressLogos.map((brand, i) => (
              <Typography
                key={i}
                variant="h6"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#A89F91",
                  fontSize: { xs: "0.95rem", md: "1.25rem" },
                  transition: "color 0.2s ease",
                  "&:hover": { color: "#1A1817" },
                }}
              >
                {brand}
              </Typography>
            ))}
          </Stack>
        </Box>

        {/* Testimonials Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="overline"
            sx={{
              color: "#A07028",
              fontWeight: 800,
              letterSpacing: "0.18em",
              fontSize: "0.8rem",
              display: "block",
              mb: 1,
            }}
          >
            COMMUNITY STORIES
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 600,
              color: "#1A1817",
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.9rem", md: "2.5rem" },
            }}
          >
            Loved by Renters & Boutique Curators
          </Typography>
        </Box>

        {/* Reviews Grid */}
        <Grid container spacing={3.5}>
          {reviews.map((rev, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  p: 3.5,
                  borderRadius: 3,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DFCF",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
                    borderColor: "#D1A362",
                  },
                }}
              >
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Rating value={rev.rating} readOnly size="small" sx={{ color: "#D1A362" }} />
                    <FormatQuoteIcon sx={{ color: "#E0D7C6", fontSize: 32 }} />
                  </Stack>

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "#A07028",
                      display: "block",
                      mb: 1.2,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Event: {rev.occasion}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#444444",
                      fontStyle: "italic",
                      lineHeight: 1.7,
                      fontSize: "0.94rem",
                      mb: 3,
                    }}
                  >
                    "{rev.text}"
                  </Typography>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: "#1A1817",
                        color: "#D1A362",
                        fontWeight: 700,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {rev.avatar}
                    </Avatar>
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700} color="#1A1817">
                          {rev.name}
                        </Typography>
                        <VerifiedIcon sx={{ fontSize: 16, color: "#43A047" }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {rev.role}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default PressAndTestimonialSection;
