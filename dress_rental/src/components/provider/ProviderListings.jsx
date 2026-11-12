import { useState } from "react";
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
  CardActions,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import { Link as RouterLink } from "react-router-dom";

export default function ProviderListings({
  listings,
  onAddClick,
  onToggleAvailability,
  onOpenDelete,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredListings = listings.filter((item) => {
    const titleMatch = (item.title || item.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const categoryMatch =
      filterCategory === "all" ||
      (item.category || "").toLowerCase() === filterCategory.toLowerCase();
    return titleMatch && categoryMatch;
  });

  const categories = ["all", "Wedding", "Traditional", "Party", "Formal", "Jewellery"];

  return (
    <Box>
      {/* Top Header & Actions */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              color: "#1A1817",
            }}
          >
            Wardrobe Listings ({listings.length})
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            Control live rental availability, view bookings, and manage your boutique garments.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddClick}
          sx={{
            bgcolor: "#1A1817",
            color: "#D1A362",
            fontWeight: 700,
            borderRadius: 2,
            textTransform: "none",
            px: 2.5,
            py: 1,
            "&:hover": { bgcolor: "#2E2A27" },
          }}
        >
          + Add New Garment
        </Button>
      </Stack>

      {/* Filter Chips & Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "#FFFFFF",
          border: "1px solid #ECE7DE",
          borderRadius: 2.5,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, brand, or occasion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#999", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
              {categories.map((cat) => {
                const selected = filterCategory === cat;
                return (
                  <Chip
                    key={cat}
                    label={cat === "all" ? "All Collections" : cat}
                    clickable
                    onClick={() => setFilterCategory(cat)}
                    sx={{
                      bgcolor: selected ? "#1A1817" : "#FAF8F5",
                      color: selected ? "#D1A362" : "#666",
                      border: selected ? "1px solid #1A1817" : "1px solid #ECE7DE",
                      fontWeight: selected ? 700 : 500,
                      fontSize: "0.8rem",
                      borderRadius: 1.5,
                    }}
                  />
                );
              })}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817", mb: 1 }}>
            No matching garments found
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mb: 2.5 }}>
            {listings.length === 0
              ? "Your studio wardrobe is empty. Publish your first piece to start earning."
              : "Try adjusting your search query or collection filter."}
          </Typography>
          {listings.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddClick}
              sx={{ bgcolor: "#1A1817", color: "#D1A362", fontWeight: 700 }}
            >
              List A Garment Now
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredListings.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #ECE7DE",
                  borderRadius: 3,
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "#FFFFFF",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#D1A362",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                  },
                }}
              >
                {/* Image & Status Badge */}
                <Box sx={{ position: "relative" }}>
                  <CardMedia
                    component="img"
                    height="240"
                    image={item.image || "/assets/Cocktail Gown.jpg"}
                    alt={item.title || item.name}
                    sx={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/Cocktail Gown.jpg";
                    }}
                  />
                  <Chip
                    icon={
                      item.availability ? (
                        <CheckCircleIcon sx={{ fontSize: 14, color: "#FFF !important" }} />
                      ) : (
                        <PauseCircleOutlineIcon sx={{ fontSize: 14, color: "#FFF !important" }} />
                      )
                    }
                    label={item.availability ? "Active on Storefront" : "Paused"}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      bgcolor: item.availability ? "rgba(46,125,50,0.92)" : "rgba(117,117,117,0.92)",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      backdropFilter: "blur(4px)",
                    }}
                  />
                </Box>

                <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
                    {item.category} &bull; {item.brand || "Atelier"}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontWeight: 700,
                      color: "#1A1817",
                      mt: 0.5,
                      mb: 1,
                      lineHeight: 1.3,
                    }}
                    noWrap
                  >
                    {item.title || item.name}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip label={`Size: ${item.size || "M"}`} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                    <Chip label={item.condition || "Like New"} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                  </Stack>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: "#FAF8F5",
                      borderColor: "#ECE7DE",
                      borderRadius: 2,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Daily Tariff:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                        ₹{(item.rentalPricePerDay || item.price)?.toLocaleString()} / day
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Deposit Guarantee:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#2E7D32" }}>
                        ₹{(item.securityDeposit || item.advance || 0)?.toLocaleString()}
                      </Typography>
                    </Stack>
                  </Paper>
                </CardContent>

                {/* Card Actions */}
                <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: "space-between" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={Boolean(item.availability)}
                        onChange={() => onToggleAvailability(item)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: "#2E7D32" },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#2E7D32" },
                        }}
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontWeight: 600 }}>{item.availability ? "Active" : "Paused"}</Typography>}
                  />

                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      component={RouterLink}
                      to={`/product/${item._id}`}
                      target="_blank"
                      size="small"
                      title="View Customer Page"
                      sx={{ color: "#777", "&:hover": { color: "#1A1817" } }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 18 }} />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => onOpenDelete(item)}
                      title="Delete Garment"
                      sx={{ color: "#888", "&:hover": { color: "#D32F2F" } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

ProviderListings.propTypes = {
  listings: PropTypes.array.isRequired,
  onAddClick: PropTypes.func.isRequired,
  onToggleAvailability: PropTypes.func.isRequired,
  onOpenDelete: PropTypes.func.isRequired,
};
