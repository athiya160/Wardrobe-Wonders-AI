import { Box, Typography, Button, Container, Stack } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";

const HeroContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "70vh", // Adjusted height
  minHeight: "500px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
}));

// We can use a single background image that has both men and women, or two absolute positioned divs.
// For the closest match to the mockup, let's use two split background divs with a dark gradient overlay in the center.

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
  background: "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.3) 100%)", // Dark center
  zIndex: 2,
});

const ContentWrapper = styled(Box)({
  position: "relative",
  zIndex: 3,
  textAlign: "center",
  color: "#FFFFFF",
  padding: "0 20px",
});

const WomenButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#D1A362", // Gold/Tan color
  color: "#FFFFFF",
  padding: "12px 36px",
  fontSize: "1rem",
  borderRadius: "4px", // slight rounding
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: "#B88E54",
  },
}));

const MenButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1C2A39", // Dark Blue color
  color: "#FFFFFF",
  padding: "12px 42px",
  fontSize: "1rem",
  borderRadius: "4px",
  border: "1px solid #4A5A69",
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: "#15202B",
  },
}));

const CarouselDots = styled(Box)({
  position: "absolute",
  bottom: "30px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "10px",
  zIndex: 3,
});

const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <HeroContainer>
      {/* Background Images */}
      <SplitBackground side="left" sx={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1200")' }} />
      <SplitBackground side="right" sx={{ backgroundImage: 'url("https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&q=80&w=1200")' }} />
      
      {/* Dark Overlay for Text Readability */}
      <Overlay />

      <ContentWrapper>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 500, mb: 3 }}>
          Elevate Your Style.<br />
          Rent. Wear. Repeat.
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 400, color: "#E0E0E0", mb: 5, fontSize: "1.1rem" }}>
          Designer outfits for every occasion.<br />
          For Women. For Men. For You.
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
          <WomenButton onClick={() => navigate("/w-dress")}>
            Explore Women
          </WomenButton>
          <MenButton onClick={() => navigate("/m-dress")}>
            Explore Men
          </MenButton>
        </Stack>
      </ContentWrapper>

      <CarouselDots>
        {[1, 2, 3].map((dot, index) => (
          <Box 
            key={index} 
            sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: index === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer'
            }} 
          />
        ))}
      </CarouselDots>
    </HeroContainer>
  );
};

export default HeroBanner;
