import React from "react";
import { Box, Typography, Container, Grid, Card, CardMedia, CardContent, Chip } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const CategoryCard = styled(Card)({
  position: "relative",
  borderRadius: "12px",
  overflow: "hidden",
  cursor: "pointer",
  border: "none",
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
    "& .category-media": {
      transform: "scale(1.08)",
    },
    "& .category-arrow": {
      transform: "translateX(4px)",
      color: "#D1A362",
    },
  },
});

const CardOverlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background:
    "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(18,16,15,0.4) 50%, rgba(18,16,15,0.88) 100%)",
  zIndex: 1,
});

const categories = [
  {
    title: "Bridal & Heritage Lehengas",
    subtitle: "Sabyasachi, Manish Malhotra & Raw Silk Sets",
    tag: "36+ PIECES",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
    link: "/w-dress",
  },
  {
    title: "Black-Tie Tuxedos & Suits",
    subtitle: "Italian Wool, Satin Shawl Lapels & 3-Piece Sets",
    tag: "24+ PIECES",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
    link: "/m-dress",
  },
  {
    title: "Cocktail & Red Carpet Gowns",
    subtitle: "Silk Maxis, Sequined Gowns & Evening Wear",
    tag: "42+ PIECES",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800",
    link: "/w-dress",
  },
  {
    title: "Royal Sherwanis & Bandhgalas",
    subtitle: "Hand-Embroidered Zari & Raw Silk Kurtas",
    tag: "28+ PIECES",
    image:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&q=80&w=800",
    link: "/m-dress",
  },
];

export const CategorySection = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 9, backgroundColor: "#FAF8F5" }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
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
            CURATED COUTURE DEPARTMENTS
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
            Explore by Occasion & Category
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} mt={2}>
            <Box sx={{ width: 36, height: 1, backgroundColor: "#D1A362" }} />
            <Box sx={{ width: 6, height: 6, transform: "rotate(45deg)", backgroundColor: "#D1A362" }} />
            <Box sx={{ width: 36, height: 1, backgroundColor: "#D1A362" }} />
          </Box>
        </Box>

        {/* Categories Grid */}
        <Grid container spacing={3.5}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <CategoryCard onClick={() => navigate(category.link)}>
                <CardMedia
                  component="img"
                  height="380"
                  image={category.image}
                  alt={category.title}
                  className="category-media"
                  sx={{
                    transition: "transform 0.5s ease",
                    objectFit: "cover",
                  }}
                />
                <CardOverlay />

                {/* Content Box overlaid at bottom */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    p: 3,
                    zIndex: 2,
                    color: "#FFFFFF",
                  }}
                >
                  <Chip
                    size="small"
                    label={category.tag}
                    sx={{
                      backgroundColor: "rgba(209, 163, 98, 0.9)",
                      color: "#1A1817",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      mb: 1.5,
                      height: 22,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.15rem",
                      lineHeight: 1.25,
                      mb: 0.5,
                    }}
                  >
                    {category.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: "0.82rem",
                      lineHeight: 1.4,
                      mb: 1.5,
                    }}
                  >
                    {category.subtitle}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                      }}
                    >
                      Browse Outfits
                    </Typography>
                    <ArrowForwardIcon
                      className="category-arrow"
                      sx={{
                        fontSize: 16,
                        color: "#FFFFFF",
                        transition: "all 0.2s ease",
                      }}
                    />
                  </Box>
                </Box>
              </CategoryCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default CategorySection;
