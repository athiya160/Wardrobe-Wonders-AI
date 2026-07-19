import { Box, Container, Typography, Button, styled } from "@mui/material";
import BackgroundImage from "../assets/f.jpg";
import ResponsiveAppBar from "../components/Navbar";

const StyledContainer = styled(Container)({
  maxWidth: "800px",
  textAlign: "center",
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  borderRadius: "20px",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
  padding: "20px",
  marginTop: "20px",
});

const StyledTypography = styled(Typography)({
  marginTop: "20px",
});

const StyledButton = styled(Button)({
  backgroundColor: "#4CAF50",
  color: "white",
  borderRadius: "8px",
  marginTop: "20px",
});

const AboutUs = () => {
  const goBack = () => {
    window.history.back();
  };

  return (
    <>
      <ResponsiveAppBar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          backgroundImage: `url(${BackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "20px",
          position: "relative",
        }}
      >
        <StyledContainer>
          <Typography variant="h4">Wardrobe Wonders</Typography>
          <Typography variant="subtitle1" sx={{ marginTop: "20px" }}>
            <u>About Us</u>
          </Typography>
          <StyledTypography variant="subtitle2">
            How Dress Rental Works
          </StyledTypography>
          <Typography variant="body1" sx={{ marginTop: "20px" }}>
            Dress rental is a convenient and cost-effective way to access
            designer clothing for special occasions without the need to purchase
            expensive items that may only be worn once. Here's how it works:
          </Typography>
          <ul
            style={{ marginTop: "20px", lineHeight: "1.7", textAlign: "left" }}
          >
            <li>
              <strong>Browse:</strong> Browse our collection of dresses and
              choose the one that suits your style and occasion.
            </li>
            <li>
              <strong>Reserve:</strong> Reserve the dress for your desired
              rental period. You can typically rent dresses for a few days or up
              to a week, depending on your needs.
            </li>
            <li>
              <strong>Try On:</strong> Once reserved, the dress will be shipped
              to your address. Try on the dress to ensure it fits perfectly and
              meets your expectations.
            </li>
            <li>
              <strong>Wear:</strong> Wear the dress to your event and enjoy
              looking stunning in designer attire.
            </li>
            <li>
              <strong>Return:</strong> After your event, simply return the dress
              using the provided packaging and shipping label. No need to worry
              about dry cleaning—we take care of that for you!
            </li>
          </ul>
          <Typography variant="body1" sx={{ marginTop: "20px" }}>
            At Dress Rental, we strive to make the dress rental process as
            seamless as possible, providing high-quality designer dresses and
            excellent customer service.
          </Typography>
          <StyledButton variant="contained" onClick={goBack}>
            Back
          </StyledButton>
        </StyledContainer>
      </Box>
    </>
  );
};

export default AboutUs;
