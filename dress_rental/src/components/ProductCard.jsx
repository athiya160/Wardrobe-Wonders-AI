/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardContent,
  Box,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const StyledCard = styled(Card)({
  minWidth: "270px",
  maxWidth: "100%",
  flex: "0 0 auto",
  padding: 0,
  border: "1px solid #ECE7DE",
  borderRadius: "10px",
  overflow: "hidden",
  backgroundColor: "#FFFFFF",
  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
  cursor: "pointer",
  position: "relative",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 14px 32px rgba(0,0,0,0.09)",
    borderColor: "#D1A362",
  },
});

const ImageContainer = styled(Box)({
  position: "relative",
  width: "100%",
  paddingTop: "135%", // 3:4 portrait aspect ratio
  overflow: "hidden",
  backgroundColor: "#F7F5F2",
});

const StyledCardMedia = styled("img")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "top center",
  transition: "transform 0.4s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
});

const WishlistButton = styled(IconButton)({
  position: "absolute",
  top: 10,
  right: 10,
  color: "#FFFFFF",
  backgroundColor: "rgba(0,0,0,0.35)",
  backdropFilter: "blur(4px)",
  padding: "6px",
  zIndex: 3,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(0,0,0,0.6)",
    transform: "scale(1.1)",
  },
});

const ProductCard = ({ dress, sx }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!dress?._id) return;
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setIsLiked(wishlist.some((item) => item._id === dress._id));
  }, [dress?._id]);

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!dress?._id) return;
    let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (isLiked) {
      wishlist = wishlist.filter((item) => item._id !== dress._id);
    } else {
      wishlist.push(dress);
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    setIsLiked(!isLiked);
    window.dispatchEvent(new Event("wishlist_updated"));
  };

  if (!dress) return null;

  return (
    <StyledCard sx={sx} onClick={() => navigate(`/product/${dress._id}`)}>
      <ImageContainer>
        <StyledCardMedia
          src={dress.image || "/assets/Cocktail Gown.jpg"}
          alt={dress.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/assets/Cocktail Gown.jpg";
          }}
        />

        {/* Wishlist Button */}
        <WishlistButton size="small" onClick={handleWishlist}>
          {isLiked ? (
            <FavoriteIcon fontSize="small" sx={{ color: "#E53935" }} />
          ) : (
            <FavoriteBorderIcon fontSize="small" />
          )}
        </WishlistButton>

        {/* Top Badges */}
        <Box sx={{ position: "absolute", top: 10, left: 10, zIndex: 3, display: "flex", gap: 0.8 }}>
          <Chip
            size="small"
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 13, color: "#1A1817 !important" }} />}
            label="Verified"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              color: "#1A1817",
              fontWeight: 700,
              fontSize: "0.68rem",
              backdropFilter: "blur(4px)",
              height: 22,
            }}
          />
          {dress.gender && (
            <Chip
              size="small"
              label={dress.gender.toUpperCase()}
              sx={{
                backgroundColor: "rgba(26, 24, 23, 0.75)",
                color: "#D1A362",
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 22,
              }}
            />
          )}
        </Box>
      </ImageContainer>

      <CardContent sx={{ p: 2, pb: "16px !important" }}>
        {/* Category / Subtitle */}
        <Typography
          variant="caption"
          sx={{
            color: "#A07028",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontSize: "0.72rem",
            display: "block",
            mb: 0.4,
          }}
        >
          {dress.category || "Designer Collection"}
        </Typography>

        {/* Garment Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: "0.98rem",
            color: "#1A1817",
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.3,
          }}
        >
          {dress.name}
        </Typography>

        {/* Price & Deposit Line */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 800,
                color: "#1A1817",
                fontSize: "1.1rem",
                lineHeight: 1.2,
              }}
            >
              ₹{dress.price?.toLocaleString()}
              <Typography
                component="span"
                variant="caption"
                sx={{ color: "#777", fontWeight: 500, ml: 0.5 }}
              >
                / 3 Days
              </Typography>
            </Typography>

            <Typography
              variant="caption"
              sx={{ color: "#8A6D3B", fontSize: "0.72rem", display: "block" }}
            >
              ₹{(dress.advance || 2500)?.toLocaleString()} refundable deposit
            </Typography>
          </Box>

          <Button
            size="small"
            variant="outlined"
            sx={{
              borderColor: "#1A1817",
              color: "#1A1817",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.74rem",
              py: 0.4,
              px: 1.2,
              borderRadius: 1.5,
              "&:hover": {
                backgroundColor: "#1A1817",
                color: "#FFFFFF",
                borderColor: "#1A1817",
              },
            }}
          >
            Rent Now
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default ProductCard;
