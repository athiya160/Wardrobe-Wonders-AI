import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
import { styled } from "@mui/system";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const StripContainer = styled(Box)({
  backgroundColor: "#FFFFFF",
  padding: "24px 0",
  borderBottom: "1px solid #ECE7DE",
  borderTop: "1px solid #F5EFE6",
});

const FeatureCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "12px",
  backgroundColor: "#FAF9F6",
  border: "1px solid #EFEAE1",
  height: "100%",
  transition: "all 0.25s ease",
  "&:hover": {
    borderColor: "#D1A362",
    backgroundColor: "#F7F2E9",
    transform: "translateY(-2px)",
  },
  [theme.breakpoints.up("md")]: {
    backgroundColor: "transparent",
    border: "none",
    padding: "0 20px",
    borderRadius: 0,
    "&:hover": {
      backgroundColor: "transparent",
      transform: "none",
    },
    position: "relative",
    "&:not(:last-child)::after": {
      content: '""',
      position: "absolute",
      right: 0,
      top: "15%",
      height: "70%",
      width: "1px",
      backgroundColor: "#ECE7DE",
    },
  },
}));

const IconBadge = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 40,
  height: 40,
  borderRadius: "10px",
  backgroundColor: "rgba(209, 163, 98, 0.12)",
  color: "#9C7238",
  "& svg": {
    fontSize: "1.35rem",
  },
});

const FeaturesStrip = () => {
  const features = [
    {
      icon: <DiamondOutlinedIcon />,
      title: "Haute Couture",
      subtitle: "Authenticated designer outfits",
    },
    {
      icon: <SecurityOutlinedIcon />,
      title: "Escrow Protection",
      subtitle: "Safe payments & refund guarantee",
    },
    {
      icon: <EventAvailableOutlinedIcon />,
      title: "Flexible Rentals",
      subtitle: "3-day or 7-day bookings",
    },
    {
      icon: <AutoAwesomeIcon />,
      title: "AI Fit Concierge",
      subtitle: "Instant size & style advice",
    },
  ];

  return (
    <StripContainer>
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {features.map((feature, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <FeatureCard>
                <IconBadge>{feature.icon}</IconBadge>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: "#1A1817",
                      fontSize: { xs: "0.8rem", sm: "0.88rem" },
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#7A7369",
                      display: "block",
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      lineHeight: 1.3,
                      mt: 0.3,
                      whiteSpace: { xs: "nowrap", sm: "normal" },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {feature.subtitle}
                  </Typography>
                </Box>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </StripContainer>
  );
};

export default FeaturesStrip;
