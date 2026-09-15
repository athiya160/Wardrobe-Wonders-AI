/* eslint-disable react/prop-types */
import {
  Box,
  Typography,
  Divider,
  Checkbox,
  FormControlLabel,
  Slider,
  Radio,
  RadioGroup,
  FormControl,
  Button,
  Rating,
  Switch,
  TextField,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarIcon from "@mui/icons-material/Star";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useState, useEffect } from "react";

const QUICK_PRICE_RANGES = [
  { label: "All Prices", min: 0, max: 20000 },
  { label: "Under ₹2,000", min: 0, max: 2000 },
  { label: "₹2,000 - ₹4,000", min: 2000, max: 4000 },
  { label: "₹4,000 - ₹8,000", min: 4000, max: 8000 },
  { label: "₹8,000 - ₹12,000", min: 8000, max: 12000 },
  { label: "Above ₹12,000", min: 12000, max: 20000 },
];

const AmazonFilterSidebar = ({
  categories = [],
  selectedCategories = [],
  onCategoryToggle,
  priceRange = [0, 20000],
  maxPossiblePrice = 20000,
  onPriceChange,
  inStockOnly = false,
  onInStockToggle,
  ratingFilter = 0,
  onRatingChange,
  rentalDuration = "all",
  onRentalDurationChange,
  onResetAll,
  hasActiveFilters = false,
}) => {
  const [minInput, setMinInput] = useState(priceRange[0]);
  const [maxInput, setMaxInput] = useState(priceRange[1]);

  useEffect(() => {
    setMinInput(priceRange[0]);
    setMaxInput(priceRange[1]);
  }, [priceRange]);

  const handlePriceApply = () => {
    const min = Math.max(0, Number(minInput) || 0);
    const max = Math.max(min, Number(maxInput) || maxPossiblePrice);
    onPriceChange([min, max]);
  };

  return (
    <Box sx={{ width: "100%", pr: { md: 2 } }}>
      {/* Header with Clear All */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} pb={1} borderBottom="1px solid #E5E5E5">
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#0F1111", letterSpacing: "0.02em" }}>
          Filters
        </Typography>
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={onResetAll}
            startIcon={<RestartAltIcon fontSize="small" />}
            sx={{
              textTransform: "none",
              color: "#B12704",
              fontSize: "0.8rem",
              p: 0,
              minWidth: "auto",
              "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
            }}
          >
            Clear all
          </Button>
        )}
      </Box>

      {/* 1. Category Filter Accordion */}
      <Accordion defaultExpanded disableGutters elevation={0} sx={{ "&:before": { display: "none" }, backgroundColor: "transparent" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ px: 0, minHeight: 40, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
          <Typography variant="body2" fontWeight={700} color="#0F1111">
            Category
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0.5, pb: 1.5 }}>
          <Stack spacing={0.2}>
            {categories.map((cat) => {
              const isChecked = selectedCategories.includes(cat.key);
              return (
                <FormControlLabel
                  key={cat.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onChange={() => onCategoryToggle(cat.key)}
                      sx={{
                        p: 0.5,
                        color: "#666",
                        "&.Mui-checked": { color: "#D1A362" },
                      }}
                    />
                  }
                  label={
                    <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                      <Typography variant="body2" sx={{ fontSize: "0.85rem", color: isChecked ? "#0F1111" : "#444", fontWeight: isChecked ? 600 : 400 }}>
                        {cat.label}
                      </Typography>
                      {cat.count !== undefined && (
                        <Typography variant="caption" sx={{ color: "#888", fontSize: "0.75rem", ml: 1 }}>
                          ({cat.count})
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ mx: 0, width: "100%", justifyContent: "space-between" }}
                />
              );
            })}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 1 }} />

      {/* 2. Price Filter Accordion */}
      <Accordion defaultExpanded disableGutters elevation={0} sx={{ "&:before": { display: "none" }, backgroundColor: "transparent" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ px: 0, minHeight: 40, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
          <Typography variant="body2" fontWeight={700} color="#0F1111">
            Price (₹)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0.5, pb: 1.5 }}>
          {/* Quick Price Ranges */}
          <Stack spacing={0.5} mb={2}>
            {QUICK_PRICE_RANGES.map((r, idx) => {
              const isSelected = priceRange[0] === r.min && priceRange[1] === r.max;
              return (
                <Typography
                  key={idx}
                  variant="body2"
                  onClick={() => {
                    if (isSelected && (r.min !== 0 || r.max !== maxPossiblePrice)) {
                      // Toggle off back to all prices
                      setMinInput(0);
                      setMaxInput(maxPossiblePrice);
                      onPriceChange([0, maxPossiblePrice]);
                    } else {
                      setMinInput(r.min);
                      setMaxInput(r.max);
                      onPriceChange([r.min, r.max]);
                    }
                  }}
                  sx={{
                    cursor: "pointer",
                    fontSize: "0.83rem",
                    color: isSelected ? "#B12704" : "#0F1111",
                    fontWeight: isSelected ? 700 : 400,
                    "&:hover": { color: "#C45500", textDecoration: "underline" },
                  }}
                >
                  {r.label}
                </Typography>
              );
            })}
          </Stack>

          {/* Slider */}
          <Box sx={{ px: 1, mb: 1 }}>
            <Slider
              value={priceRange}
              onChange={(_, newVal) => {
                setMinInput(newVal[0]);
                setMaxInput(newVal[1]);
                onPriceChange(newVal);
              }}
              valueLabelDisplay="auto"
              min={0}
              max={maxPossiblePrice}
              step={200}
              sx={{
                color: "#D1A362",
                height: 4,
                "& .MuiSlider-thumb": {
                  width: 14,
                  height: 14,
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #D1A362",
                  "&:hover, &.Mui-focusVisible": { boxShadow: "0px 0px 0px 8px rgba(209, 163, 98, 0.16)" },
                },
              }}
            />
          </Box>

          {/* Min - Max Input Boxes with Go button */}
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="₹ Min"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              inputProps={{ style: { fontSize: "0.8rem", padding: "6px 8px" } }}
              sx={{ width: "75px" }}
            />
            <Typography variant="caption" color="text.secondary">to</Typography>
            <TextField
              size="small"
              placeholder="₹ Max"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              inputProps={{ style: { fontSize: "0.8rem", padding: "6px 8px" } }}
              sx={{ width: "75px" }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handlePriceApply}
              sx={{
                minWidth: "36px",
                px: 1,
                py: "4px",
                fontSize: "0.75rem",
                color: "#0F1111",
                borderColor: "#D5D9D9",
                borderRadius: "6px",
                "&:hover": { borderColor: "#0F1111", backgroundColor: "#F7FAFA" },
              }}
            >
              Go
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 1 }} />

      {/* 3. Rental Duration */}
      <Accordion defaultExpanded disableGutters elevation={0} sx={{ "&:before": { display: "none" }, backgroundColor: "transparent" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ px: 0, minHeight: 40, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
          <Typography variant="body2" fontWeight={700} color="#0F1111">
            Rental Period
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0.5, pb: 1.5 }}>
          <FormControl component="fieldset">
            <RadioGroup value={rentalDuration} onChange={(e) => onRentalDurationChange(e.target.value)}>
              <FormControlLabel value="all" control={<Radio size="small" sx={{ p: 0.5, "&.Mui-checked": { color: "#D1A362" } }} />} label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>All Durations</Typography>} />
              <FormControlLabel value="3" control={<Radio size="small" sx={{ p: 0.5, "&.Mui-checked": { color: "#D1A362" } }} />} label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>3 Days (Weekend / Event)</Typography>} />
              <FormControlLabel value="7" control={<Radio size="small" sx={{ p: 0.5, "&.Mui-checked": { color: "#D1A362" } }} />} label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>7 Days (Wedding Week)</Typography>} />
            </RadioGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 1 }} />

      {/* 4. Customer Reviews / Ratings */}
      <Accordion defaultExpanded disableGutters elevation={0} sx={{ "&:before": { display: "none" }, backgroundColor: "transparent" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ px: 0, minHeight: 40, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
          <Typography variant="body2" fontWeight={700} color="#0F1111">
            Customer Reviews
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0.5, pb: 1.5 }}>
          <Stack spacing={0.5}>
            {[4, 3].map((stars) => {
              const isSelected = ratingFilter === stars;
              return (
                <Box
                  key={stars}
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  onClick={() => onRatingChange(isSelected ? 0 : stars)}
                  sx={{
                    cursor: "pointer",
                    p: 0.5,
                    borderRadius: 1,
                    backgroundColor: isSelected ? "#F3F7FA" : "transparent",
                    "&:hover": { backgroundColor: "#F7FAFA" },
                  }}
                >
                  <Rating value={stars} readOnly size="small" emptyIcon={<StarIcon fontSize="inherit" />} />
                  <Typography variant="caption" sx={{ color: isSelected ? "#B12704" : "#0F1111", fontWeight: isSelected ? 700 : 400 }}>
                    & Up
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 1 }} />

      {/* 5. Availability Switch */}
      <Box py={1.5} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" fontWeight={700} color="#0F1111">
          In Stock Only
        </Typography>
        <Switch
          size="small"
          checked={inStockOnly}
          onChange={(e) => onInStockToggle(e.target.checked)}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "#D1A362",
              "& + .MuiSwitch-track": { backgroundColor: "#D1A362" },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default AmazonFilterSidebar;
