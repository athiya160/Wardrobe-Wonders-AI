import PropTypes from "prop-types";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  CheckCircleOutline as ApprovedIcon,
  WarningAmberOutlined as DefectIcon,
  RemoveShoppingCartOutlined as OutOfStockIcon,
  CollectionsOutlined as CollectionsIcon,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { resolveProductImage, getCategoryFallbackImage } from "../../utils/imageOptimizer";

export default function StoreProductCard({ product }) {
  const navigate = useNavigate();

  if (!product) return null;

  const isOutOfStock = Number(product.stockQuantity) <= 0;
  const isPreOwned = product.condition === "PRE_OWNED";
  const primaryImage = resolveProductImage(product, 600);
  const imageCount = Array.isArray(product.images) ? product.images.length : (product.image ? 1 : 0);
  const storeName = product.storeId?.storeName || "Verified Partner";
  const storeSlug = product.storeId?.storeSlug;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: "1px solid #ECE7DE",
        bgcolor: "#FFFFFF",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "all 0.25s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          borderColor: "#D1A362",
        },
      }}
      onClick={() => navigate(`/store/product/${product._id}`)}
    >
      {/* Product Image Area */}
      <Box sx={{ position: "relative", overflow: "hidden", pt: "125%" /* 4:5 luxury aspect ratio */ }}>
        <CardMedia
          component="img"
          image={primaryImage}
          alt={product.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getCategoryFallbackImage("store", product.category);
          }}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            bgcolor: "#FAF8F5",
            transition: "transform 0.4s ease",
            filter: isOutOfStock ? "grayscale(80%) opacity(0.8)" : "none",
            "&:hover": {
              transform: isOutOfStock ? "none" : "scale(1.04)",
            },
          }}
        />

        {/* Condition Badge */}
        <Chip
          label={isPreOwned ? "Pre-loved" : "Brand New"}
          size="small"
          icon={isPreOwned ? <DefectIcon sx={{ fontSize: "14px !important" }} /> : <ApprovedIcon sx={{ fontSize: "14px !important" }} />}
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            bgcolor: isPreOwned ? "rgba(255, 248, 225, 0.95)" : "rgba(26, 24, 23, 0.9)",
            color: isPreOwned ? "#F57F17" : "#FFFFFF",
            fontWeight: 800,
            fontSize: "0.68rem",
            letterSpacing: "0.04em",
            backdropFilter: "blur(4px)",
            border: isPreOwned ? "1px solid #FFE082" : "1px solid rgba(209, 163, 98, 0.4)",
          }}
        />

        {/* Out of Stock Overlay Pill */}
        {isOutOfStock ? (
          <Chip
            label="Out of Stock"
            size="small"
            icon={<OutOfStockIcon sx={{ fontSize: "14px !important" }} />}
            sx={{
              position: "absolute",
              bottom: 10,
              right: 10,
              bgcolor: "rgba(211, 47, 47, 0.95)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.7rem",
            }}
          />
        ) : imageCount > 1 ? (
          <Chip
            label={`${imageCount} Photos`}
            size="small"
            icon={<CollectionsIcon sx={{ fontSize: "12px !important", color: "#FFFFFF !important" }} />}
            sx={{
              position: "absolute",
              bottom: 10,
              right: 10,
              bgcolor: "rgba(26, 24, 23, 0.8)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.65rem",
              backdropFilter: "blur(4px)",
              height: 20,
              px: 0.2,
            }}
          />
        ) : null}
      </Box>

      {/* Card Content */}
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
        {/* Store Attribution Link */}
        <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 0.6 }}>
          <StoreIcon sx={{ fontSize: 14, color: "#D1A362" }} />
          {storeSlug ? (
            <Typography
              component={RouterLink}
              to={`/store/storefront/${storeSlug}`}
              onClick={(e) => e.stopPropagation()}
              variant="caption"
              sx={{
                color: "#8C6D37",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline", color: "#1A1817" },
              }}
            >
              {storeName}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "#8C6D37", fontWeight: 700, textTransform: "uppercase" }}>
              {storeName}
            </Typography>
          )}
        </Stack>

        {/* Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: "#1A1817",
            lineHeight: 1.3,
            mb: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            fontSize: "0.95rem",
          }}
        >
          {product.title}
        </Typography>

        {/* Pricing & Stock Footer */}
        <Box sx={{ mt: "auto", pt: 1, borderTop: "1px solid #FAF4EB" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817", fontSize: "1.1rem" }}>
                ₹{Number(product.price).toLocaleString("en-IN")}
              </Typography>
              {product.originalRetailPrice && Number(product.originalRetailPrice) > Number(product.price) && (
                <Typography variant="caption" sx={{ color: "text.disabled", textDecoration: "line-through", mr: 1 }}>
                  ₹{Number(product.originalRetailPrice).toLocaleString("en-IN")}
                </Typography>
              )}
            </Box>

            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: isOutOfStock ? "error.main" : "text.secondary",
              }}
            >
              {isOutOfStock ? "Sold Out" : `${product.stockQuantity} in stock`}
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

StoreProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    originalRetailPrice: PropTypes.number,
    stockQuantity: PropTypes.number,
    condition: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    storeId: PropTypes.shape({
      storeName: PropTypes.string,
      storeSlug: PropTypes.string,
    }),
  }),
};
