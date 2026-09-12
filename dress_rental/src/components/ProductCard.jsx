/* eslint-disable react/prop-types */
import {
  Typography,
  Card,
  CardContent,
  Box,
  IconButton
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const StyledCard = styled(Card)({
  minWidth: "280px",
  maxWidth: "280px",
  flex: "0 0 auto",
  marginRight: "20px",
  padding: 0,
  border: "none",
  borderRadius: 0,
  overflow: "visible",
  backgroundColor: "transparent",
  boxShadow: "none",
  cursor: "pointer",
  position: "relative",
});

const StyledCardContent = styled(CardContent)({
  padding: "16px 0",
  "&:last-child": {
    paddingBottom: "16px",
  }
});

const ImageContainer = styled(Box)({
  position: "relative",
  width: "100%",
  paddingTop: "135%", // taller aspect ratio like in the mockup
  overflow: "hidden",
  backgroundColor: "#F0F0F0",
});

const StyledCardMedia = styled('img')({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

const WishlistButton = styled(IconButton)({
  position: 'absolute',
  top: 10,
  right: 10,
  color: '#FFFFFF',
  backgroundColor: 'rgba(0,0,0,0.1)',
  padding: '6px',
  '&:hover': {
    backgroundColor: 'rgba(0,0,0,0.3)',
  }
});

const StyledTitle = styled(Typography)({
  fontWeight: 500,
  fontSize: "0.95rem",
  color: "#222",
  marginBottom: "4px",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const StyledPrice = styled(Typography)({
  fontWeight: 700,
  color: "#111",
  fontSize: "1rem",
});

import FavoriteIcon from '@mui/icons-material/Favorite';
import { useState, useEffect } from "react";

const ProductCard = ({ dress }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsLiked(wishlist.some(item => item._id === dress._id));
  }, [dress._id]);

  const handleWishlist = (e) => {
    e.stopPropagation();
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isLiked) {
      wishlist = wishlist.filter(item => item._id !== dress._id);
    } else {
      wishlist.push(dress);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setIsLiked(!isLiked);
    window.dispatchEvent(new Event('wishlist_updated'));
  };
  
  return (
    <StyledCard onClick={() => navigate(`/product/${dress._id}`)}>
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
        <WishlistButton size="small" onClick={handleWishlist}>
          {isLiked ? <FavoriteIcon fontSize="small" sx={{ color: '#FE6B8B' }} /> : <FavoriteBorderIcon fontSize="small" />}
        </WishlistButton>
      </ImageContainer>
      
      <StyledCardContent>
        <StyledTitle>{dress.name}</StyledTitle>
        <StyledPrice>
          ₹{dress.price} <Typography component="span" variant="caption" sx={{ color: '#777', fontWeight: 400 }}>/ 3 Days</Typography>
        </StyledPrice>
      </StyledCardContent>
    </StyledCard>
  );
};

export default ProductCard;
