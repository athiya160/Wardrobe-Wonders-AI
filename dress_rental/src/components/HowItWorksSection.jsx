import React from "react";
import { Box, Typography, Container, Grid, Card, CardContent, Stack } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";

const steps = [
  {
    step: "01",
    title: "Discover & Style",
    desc: "Browse 1,200+ authenticated couture pieces or get instant recommendations from our Groq AI Stylist.",
    icon: <SearchOutlinedIcon sx={{ fontSize: 28, color: "#D1A362" }} />,
  },
  {
    step: "02",
    title: "Select Rental Dates",
    desc: "Choose 3, 5, or 7-day rental periods with automated date conflict locking and transparent deposits.",
    icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 28, color: "#D1A362" }} />,
  },
  {
    step: "03",
    title: "Pristine Delivery",
    desc: "Receive freshly dry-cleaned, hand-steamed luxury garments right at your doorstep before your event.",
    icon: <LocalShippingOutlinedIcon sx={{ fontSize: 28, color: "#D1A362" }} />,
  },
  {
    step: "04",
    title: "Effortless Return",
    desc: "Slip the garment into our prepaid return kit. Your refundable security deposit is released automatically.",
    icon: <AssignmentReturnOutlinedIcon sx={{ fontSize: 28, color: "#D1A362" }} />,
  },
];

export const HowItWorksSection = () => {
  return (
    <Box sx={{ py: 10, backgroundColor: "#FFFFFF", borderTop: "1px solid #F0ECE1", borderBottom: "1px solid #F0ECE1" }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: "center", mb: 7 }}>
          <Typography
            variant="overline"
            sx={{
              color: "#A07028",
              fontWeight: 800,
              letterSpacing: "0.18em",
              fontSize: "0.82rem",
              display: "block",
              mb: 1,
            }}
          >
            HOW WARDROBE WONDERS WORKS
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontWeight: 600,
              color: "#1A1817",
              letterSpacing: "-0.02em",
              fontSize: { xs: "2rem", md: "2.6rem" },
            }}
          >
            The New Era of Circular Luxury
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} mt={2}>
            <Box sx={{ width: 36, height: 1, backgroundColor: "#D1A362" }} />
            <Box sx={{ width: 6, height: 6, transform: "rotate(45deg)", backgroundColor: "#D1A362" }} />
            <Box sx={{ width: 36, height: 1, backgroundColor: "#D1A362" }} />
          </Box>
          <Typography
            variant="body1"
            sx={{
              color: "#666666",
              maxWidth: 640,
              mx: "auto",
              mt: 2,
              fontSize: "1.05rem",
              lineHeight: 1.6,
            }}
          >
            Access million-rupee wardrobes for a fraction of retail. Premium designer fashion, insured escrow protection, and zero commitment.
          </Typography>
        </Box>

        {/* 4 Step Cards */}
        <Grid container spacing={3.5}>
          {steps.map((item, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "#FAF8F5",
                  border: "1px solid #EFEAE0",
                  boxShadow: "none",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.06)",
                    borderColor: "#D1A362",
                    backgroundColor: "#FFFFFF",
                  },
                }}
              >
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8DFCF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(209,163,98,0.12)",
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        color: "#E2DACB",
                        lineHeight: 1,
                      }}
                    >
                      {item.step}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#1A1817",
                      fontSize: "1.15rem",
                      mb: 1.2,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666666",
                      lineHeight: 1.65,
                      fontSize: "0.92rem",
                    }}
                  >
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HowItWorksSection;
