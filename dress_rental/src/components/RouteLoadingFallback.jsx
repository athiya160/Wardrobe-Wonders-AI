import { Box, CircularProgress, Typography } from "@mui/material";

const RouteLoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: 2,
    }}
  >
    <CircularProgress size={36} sx={{ color: "#D1A362" }} />
    <Typography
      variant="body2"
      sx={{
        color: "#8E8880",
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontSize: "0.75rem",
      }}
    >
      Loading Experience...
    </Typography>
  </Box>
);

export default RouteLoadingFallback;
