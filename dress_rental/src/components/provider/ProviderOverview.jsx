import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  Card,
  CardMedia,
  CardContent,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export default function ProviderOverview({ stats, listings, user, onNavigateTab }) {
  return (
    <Box>
      {/* Greeting Banner */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#1A1817",
            mb: 0.5,
          }}
        >
          Welcome to your Atelier Studio, {user?.name ? user.name.split(" ")[0] : "Lender"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Monitor your active garment listings, upcoming event reservations, and rental earnings.
        </Typography>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Estimated Earnings
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", my: 1 }}>
              ₹{(stats?.totalEarnings || 0).toLocaleString()}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "#2E7D32" }}>
              <TrendingUpIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                85% Provider Share
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Total Garments
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", my: 1 }}>
              {stats?.totalListings || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666" }}>
              In your portfolio
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Available for Rent
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#D1A362", my: 1 }}>
              {stats?.activeListings || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666" }}>
              Live in marketplace
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Rental Orders
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", my: 1 }}>
              {stats?.totalOrders || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666" }}>
              Customer bookings
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Action Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: "1px solid #ECE7DE",
          bgcolor: "#FAF8F5",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2.5,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#1A1817", mb: 0.5 }}>
            Monetize Your Luxury Wardrobe
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            List wedding lehengas, sherwanis, and luxury accessories. Earn recurring rental revenue while retaining full ownership.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onNavigateTab("add-dress")}
          sx={{
            bgcolor: "#1A1817",
            color: "#D1A362",
            fontWeight: 700,
            px: 3,
            py: 1.2,
            borderRadius: 2,
            textTransform: "none",
            flexShrink: 0,
            "&:hover": { bgcolor: "#2E2A27" },
          }}
        >
          List New Garment
        </Button>
      </Paper>

      {/* Recent Listings Preview */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, color: "#1A1817" }}>
            Recent Wardrobe Pieces
          </Typography>
          <Button
            size="small"
            onClick={() => onNavigateTab("listings")}
            sx={{ color: "#8C6D3B", fontWeight: 700, textTransform: "none" }}
          >
            View All ({listings.length}) &rarr;
          </Button>
        </Stack>

        {listings.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A1817", mb: 1 }}>
              No garments listed yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
              Publish your first couture ensemble to start receiving rental requests from verified clients.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => onNavigateTab("add-dress")}
              sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700 }}
            >
              List Your First Garment
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {listings.slice(0, 4).map((listing) => (
              <Grid item xs={12} sm={6} md={3} key={listing._id}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #ECE7DE",
                    borderRadius: 2.5,
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={listing.image || "/assets/Cocktail Gown.jpg"}
                    alt={listing.title || listing.name}
                    sx={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/Cocktail Gown.jpg";
                    }}
                  />
                  <CardContent sx={{ p: 2, flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
                        {listing.category}
                      </Typography>
                      <Chip
                        label={listing.availability ? "Active" : "Paused"}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          bgcolor: listing.availability ? "#E8F5E9" : "#F5F5F5",
                          color: listing.availability ? "#2E7D32" : "#757575",
                        }}
                      />
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817", mb: 1 }} noWrap>
                      {listing.title || listing.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      ₹{(listing.rentalPricePerDay || listing.price)?.toLocaleString()}
                      <Typography component="span" variant="caption" sx={{ color: "#666" }}>
                        {" "}
                        / day
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

ProviderOverview.propTypes = {
  stats: PropTypes.shape({
    totalEarnings: PropTypes.number,
    totalListings: PropTypes.number,
    activeListings: PropTypes.number,
    totalOrders: PropTypes.number,
  }),
  listings: PropTypes.array.isRequired,
  user: PropTypes.object,
  onNavigateTab: PropTypes.func.isRequired,
};
