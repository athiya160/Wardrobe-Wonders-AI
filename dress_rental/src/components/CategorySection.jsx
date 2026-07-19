import { Box, Typography, Container, Grid, Card, CardMedia, CardContent } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Custom diamond divider
const DiamondDivider = () => (
  <Box display="flex" alignItems="center" justifyContent="center" mb={4}>
    <Box sx={{ width: 40, height: 1, backgroundColor: '#D1A362', opacity: 0.5 }} />
    <Box sx={{ width: 6, height: 6, transform: 'rotate(45deg)', backgroundColor: '#D1A362', mx: 2 }} />
    <Box sx={{ width: 40, height: 1, backgroundColor: '#D1A362', opacity: 0.5 }} />
  </Box>
);

const CategoryCard = styled(Card)(({ theme }) => ({
  border: "1px solid #E0E0E0",
  boxShadow: "none",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
}));

const categories = [
  {
    title: "Women",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600",
    link: "/w-dress",
  },
  {
    title: "Men",
    image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&q=80&w=600",
    link: "/m-dress",
  },
  {
    title: "Lehenga",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
    link: "/w-dress?category=Wedding",
  },
  {
    title: "Suits & Blazers",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=600",
    link: "/m-dress?category=Formal",
  },
];

const CategorySection = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 8, backgroundColor: "#FFFFFF" }}>
      <Container maxWidth="xl">
        <Typography 
          variant="h3" 
          align="center" 
          gutterBottom 
          sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: "#1A1A1A" }}
        >
          Browse By Category
        </Typography>
        <DiamondDivider />
        
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Typography 
            variant="body2" 
            sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { color: '#D1A362' } }}
          >
            View All
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <CategoryCard onClick={() => navigate(category.link)}>
                <CardMedia
                  component="img"
                  height="300"
                  image={category.image}
                  alt={category.title}
                />
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle1" fontWeight="600" mb={0.5}>
                    {category.title}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Explore Collection
                    </Typography>
                    <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                </CardContent>
              </CategoryCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default CategorySection;
