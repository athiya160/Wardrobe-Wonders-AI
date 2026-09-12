import { Link } from "react-router-dom";
import { Box, Container, Stack, Typography, Divider } from "@mui/material";

const Fotter = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1A1817",
        color: "#CCC",
        pt: 3,
        pb: 3,
        mt: "auto",
        borderTop: "1px solid #2B2826",
        zIndex: 10,
        position: "relative",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography variant="body2" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.05em" }}>
              WARDROBE WONDERS
            </Typography>
            <Typography variant="caption" sx={{ color: "#888", display: "block", mt: 0.5 }}>
              Peer-to-Peer Luxury Fashion Rental & Boutique Rental Marketplace
            </Typography>
          </Box>

          {/* Legal & Policy Navigation Links */}
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 2.5 }}
            flexWrap="wrap"
            justifyContent="center"
            sx={{
              "& a": {
                color: "#AAA",
                fontSize: "0.75rem",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s ease",
                "&:hover": { color: "#D1A362" },
              },
            }}
          >
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/rental-policy">Rental Policy</Link>
            <Link to="/refund-policy">Deposit Policy</Link>
            <Link to="/provider-terms">Provider Terms</Link>
            <Link to="/copyright">IP & Copyright</Link>
            <Link to="/report-listing">Trust & Reporting</Link>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="caption" sx={{ color: "#777", fontSize: "0.7rem" }}>
            © {new Date().getFullYear()} Wardrobe Wonders. All rights reserved. Demonstration MVP.
          </Typography>
          <Typography variant="caption" sx={{ color: "#777", fontSize: "0.7rem" }}>
            Developed by: Athiya Tabassum
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Fotter;
