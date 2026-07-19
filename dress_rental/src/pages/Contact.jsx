import React from "react";
import {
  Container,
  Typography,
  Link,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import ResponsiveAppBar from "../components/Navbar";

const ContactUs = () => {
  const goToHomePage = () => {
    // Replace 'index.php' with the URL of your home page
    window.location.href = "/";
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
          backgroundImage: 'url("assets/k.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "20px",
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: "black",
            fontFamily: "Allerta Stencil, sans-serif",
            fontSize: "25px",
            marginBottom: "20px",
          }}
        >
          Wardrobe Wonders
        </Typography>
        <Container
          sx={{
            width: "450px",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            borderRadius: "20px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Typography variant="h2" sx={{ color: "#333", marginBottom: "20px" }}>
            Contact Us
          </Typography>
          <Box sx={{ marginBottom: "20px" }}>
            <Typography variant="body1">
              <i className="fas fa-building"></i> Wardrobe Wonders
            </Typography>
            <Typography variant="body1">
              <i className="fas fa-phone"></i> +1234567890
            </Typography>
            <Typography variant="body1">
              <i className="fas fa-map-marker-alt"></i> 123 Street, City,
              Country
            </Typography>
            <Typography variant="body1">
              <i className="fas fa-envelope"></i>{" "}
              <Link href="mailto:info@wardrobewonders.com">
                info@wardrobewonders.com
              </Link>
            </Typography>
            <Typography variant="body1">
              <i className="fab fa-instagram"></i>{" "}
              <Link href="https://www.instagram.com/wardrobewonders">
                wardrobewonders
              </Link>
            </Typography>
            <Typography variant="body1">
              <i className="fas fa-globe"></i>{" "}
              <Link href="http://www.wardrobewonders.com">
                www.wardrobewonders.com
              </Link>
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#4CAF50",
              color: "white",
              borderRadius: "8px",
            }}
            onClick={goToHomePage}
          >
            Back to Home
          </Button>
        </Container>
      </Box>
    </>
  );
};

export default ContactUs;
