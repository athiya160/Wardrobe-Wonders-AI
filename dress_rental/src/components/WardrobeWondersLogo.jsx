import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * WardrobeWondersIcon
 * Minimalist luxury clothes hanger seamlessly integrated with the monogram 'W'.
 * Rendered using precision SVG vectors with champagne gold & dark charcoal gradients.
 */
export const WardrobeWondersIcon = ({
  size = 40,
  theme = "light",
  className = "",
}) => {
  const isDark = theme === "dark";
  const charcoalColor = isDark ? "#FFFFFF" : "#1A1817";
  const primaryStroke = isDark ? "#FFFFFF" : "#1E1B18";

  // Unique gradient IDs per instance to prevent SVG ID collisions
  const gradId = React.useId().replace(/:/g, "_");
  const goldGradId = `goldGrad_${gradId}`;
  const darkGradId = `darkGrad_${gradId}`;

  return (
    <svg
      width={size}
      height={Math.round(size * 0.85)}
      viewBox="0 0 100 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <defs>
        {/* Champagne Gold Luxury Gradient */}
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E7C4" />
          <stop offset="35%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#C5A059" />
          <stop offset="100%" stopColor="#9E7B35" />
        </linearGradient>

        {/* Charcoal Depth Gradient */}
        <linearGradient id={darkGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#FFFFFF" : "#2E2A27"} />
          <stop offset="100%" stopColor={charcoalColor} />
        </linearGradient>

        {/* Subtle drop shadow filter for floating luxury feel */}
        <filter id={`shadow_${gradId}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter={`url(#shadow_${gradId})`}>
        {/* TOP HOOK: Curving brass hanger hook with rounded jewel finial */}
        <path
          d="M 45 19 C 45 11, 54.5 9, 58 14 C 61 19, 53 25, 50 31 L 50 35"
          stroke={`url(#${goldGradId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Hook neck accent bead */}
        <circle cx="50" cy="35" r="2.2" fill={`url(#${goldGradId})`} />

        {/* MAIN HANGER SHOULDERS: Softly sloping bespoke tailoring frame */}
        <path
          d="M 50 35 C 43 38, 28 45, 12 53 C 9.5 54.3, 10 57, 12.5 57.5 L 20 59"
          stroke={`url(#${darkGradId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 50 35 C 57 38, 72 45, 88 53 C 90.5 54.3, 90 57, 87.5 57.5 L 80 59"
          stroke={`url(#${darkGradId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* INTEGRATED 'W' MONOGRAM: Sculpted champagne-gold struts spanning the hanger base */}
        {/* Left 'V' of the W */}
        <path
          d="M 23 57.5 L 37.5 77 C 38.3 78, 39.7 78, 40.5 76.8 L 50 62"
          stroke={`url(#${goldGradId})`}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right 'V' of the W */}
        <path
          d="M 50 62 L 59.5 76.8 C 60.3 78, 61.7 78, 62.5 77 L 77 57.5"
          stroke={`url(#${goldGradId})`}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Apex Diamond Stud: Subtle couture jewel at W intersection */}
        <polygon
          points="50,56 52.8,60 50,64 47.2,60"
          fill={`url(#${goldGradId})`}
        />

        {/* Base horizontal strut with soft arch for structural silhouette */}
        <path
          d="M 14 56.5 Q 50 60.5 86 56.5"
          stroke={primaryStroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isDark ? "0.6" : "0.45"}
        />
      </g>
    </svg>
  );
};

/**
 * WardrobeWondersLogo
 * Full responsive brand logo component combining the hanger 'W' mark with
 * high-fashion typography. Supports light, dark, stacked, and icon-only variants.
 */
export const WardrobeWondersLogo = ({
  variant = "horizontal", // "horizontal" | "stacked" | "icon"
  theme = "light",        // "light" | "dark"
  size = "medium",        // "small" | "medium" | "large" | custom number
  showSubtitle = true,
  onClick = null,
  sx = {},
}) => {
  const isDark = theme === "dark";

  // Determine pixel sizes
  let iconSize = 42;
  let titleFontSize = "1.15rem";
  let subtitleFontSize = "0.58rem";
  let spacing = 1.4;

  if (typeof size === "number") {
    iconSize = size;
    titleFontSize = `${Math.max(0.85, size * 0.026)}rem`;
    subtitleFontSize = `${Math.max(0.5, size * 0.013)}rem`;
  } else if (size === "small") {
    iconSize = 32;
    titleFontSize = "0.98rem";
    subtitleFontSize = "0.52rem";
    spacing = 1;
  } else if (size === "large") {
    iconSize = 58;
    titleFontSize = "1.65rem";
    subtitleFontSize = "0.68rem";
    spacing = 1.8;
  }

  if (variant === "icon") {
    return (
      <Box
        onClick={onClick}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: onClick ? "pointer" : "default",
          ...sx,
        }}
      >
        <WardrobeWondersIcon size={iconSize} theme={theme} />
      </Box>
    );
  }

  const isStacked = variant === "stacked";

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        flexDirection: isStacked ? "column" : "row",
        textAlign: isStacked ? "center" : "left",
        gap: spacing,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        textDecoration: "none",
        ...sx,
      }}
    >
      <WardrobeWondersIcon size={iconSize} theme={theme} />

      <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <Typography
          component="span"
          sx={{
            fontFamily: '"Playfair Display", "Cinzel", "Georgia", serif',
            fontWeight: 800,
            fontSize: titleFontSize,
            letterSpacing: "0.14em",
            color: isDark ? "#FFFFFF" : "#1A1817",
            textTransform: "uppercase",
            lineHeight: 1.15,
            whiteSpace: "nowrap",
          }}
        >
          Wardrobe{" "}
          <Box
            component="span"
            sx={{
              background: "linear-gradient(135deg, #D4AF37 0%, #C5A059 50%, #9E7B35 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Wonders
          </Box>
        </Typography>

        {showSubtitle && (
          <Typography
            component="span"
            sx={{
              fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
              fontWeight: 600,
              fontSize: subtitleFontSize,
              letterSpacing: "0.26em",
              color: isDark ? "#D4AF37" : "#8A7355",
              textTransform: "uppercase",
              mt: 0.35,
              opacity: 0.9,
              whiteSpace: "nowrap",
            }}
          >
            Haute Couture & Rentals
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default WardrobeWondersLogo;
