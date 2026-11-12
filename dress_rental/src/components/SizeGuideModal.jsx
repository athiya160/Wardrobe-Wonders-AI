import { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StraightenIcon from "@mui/icons-material/Straighten";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const WOMEN_CHART = [
  { size: "XS (34)", bustIn: 32, bustCm: 81, waistIn: 26, waistCm: 66, hipsIn: 35, hipsCm: 89, skirtLenIn: 41, skirtLenCm: 104 },
  { size: "S (36)",  bustIn: 34, bustCm: 86, waistIn: 28, waistCm: 71, hipsIn: 37, hipsCm: 94, skirtLenIn: 42, skirtLenCm: 107 },
  { size: "M (38)",  bustIn: 36, bustCm: 91, waistIn: 30, waistCm: 76, hipsIn: 39, hipsCm: 99, skirtLenIn: 42, skirtLenCm: 107 },
  { size: "L (40)",  bustIn: 38, bustCm: 97, waistIn: 32, waistCm: 81, hipsIn: 41, hipsCm: 104, skirtLenIn: 43, skirtLenCm: 109 },
  { size: "XL (42)", bustIn: 40, bustCm: 102, waistIn: 34, waistCm: 86, hipsIn: 43, hipsCm: 109, skirtLenIn: 43, skirtLenCm: 109 },
  { size: "2XL (44)", bustIn: 42, bustCm: 107, waistIn: 36, waistCm: 91, hipsIn: 45, hipsCm: 114, skirtLenIn: 44, skirtLenCm: 112 },
  { size: "3XL (46)", bustIn: 44, bustCm: 112, waistIn: 38, waistCm: 97, hipsIn: 47, hipsCm: 119, skirtLenIn: 44, skirtLenCm: 112 },
];

const MEN_CHART = [
  { size: "36 (XS)", chestIn: 36, chestCm: 91, shoulderIn: 16.5, shoulderCm: 42, waistIn: 30, waistCm: 76, lengthIn: 42, lengthCm: 107 },
  { size: "38 (S)",  chestIn: 38, chestCm: 97, shoulderIn: 17.0, shoulderCm: 43, waistIn: 32, waistCm: 81, lengthIn: 43, lengthCm: 109 },
  { size: "40 (M)",  chestIn: 40, chestCm: 102, shoulderIn: 17.5, shoulderCm: 44.5, waistIn: 34, waistCm: 86, lengthIn: 44, lengthCm: 112 },
  { size: "42 (L)",  chestIn: 42, chestCm: 107, shoulderIn: 18.0, shoulderCm: 46, waistIn: 36, waistCm: 91, lengthIn: 44, lengthCm: 112 },
  { size: "44 (XL)", chestIn: 44, chestCm: 112, shoulderIn: 18.5, shoulderCm: 47, waistIn: 38, waistCm: 97, lengthIn: 45, lengthCm: 114 },
  { size: "46 (2XL)", chestIn: 46, chestCm: 117, shoulderIn: 19.0, shoulderCm: 48, waistIn: 40, waistCm: 102, lengthIn: 45, lengthCm: 114 },
];

const GOWN_CHART = [
  { size: "UK 6 / US 2 (XS)", bustIn: 32, bustCm: 81, waistIn: 25, waistCm: 63.5, hipsIn: 35, hipsCm: 89, fullLenIn: 58, fullLenCm: 147 },
  { size: "UK 8 / US 4 (S)",  bustIn: 34, bustCm: 86, waistIn: 27, waistCm: 68.5, hipsIn: 37, hipsCm: 94, fullLenIn: 59, fullLenCm: 150 },
  { size: "UK 10 / US 6 (M)", bustIn: 36, bustCm: 91, waistIn: 29, waistCm: 73.5, hipsIn: 39, hipsCm: 99, fullLenIn: 59, fullLenCm: 150 },
  { size: "UK 12 / US 8 (L)", bustIn: 38, bustCm: 97, waistIn: 31, waistCm: 79, hipsIn: 41, hipsCm: 104, fullLenIn: 60, fullLenCm: 152 },
  { size: "UK 14 / US 10 (XL)", bustIn: 40, bustCm: 102, waistIn: 33, waistCm: 84, hipsIn: 43, hipsCm: 109, fullLenIn: 60, fullLenCm: 152 },
  { size: "UK 16 / US 12 (2XL)", bustIn: 42, bustCm: 107, waistIn: 35, waistCm: 89, hipsIn: 45, hipsCm: 114, fullLenIn: 61, fullLenCm: 155 },
];

const JEWELLERY_CHART = [
  { item: "Choker / Collar", fit: "12 - 14 inches", note: "Sits snugly around the base of the throat with adjustable dori (thread drawstring)." },
  { item: "Princess / Short Necklace", fit: "16 - 18 inches", note: "Rests elegantly near the collarbone; complements scoop and sweetheart necklines." },
  { item: "Matinee / Rani Haar", fit: "20 - 24 inches", note: "Plunging statement necklace resting over the center bust; paired with bridal lehengas." },
  { item: "Bangle Size 2.4", fit: "2.25 inch inner diameter", note: "Best for petite wrists (wrist circumference 6.5 to 7.0 inches)." },
  { item: "Bangle Size 2.6", fit: "2.375 inch inner diameter", note: "Standard Indian bridal bangle size (wrist circumference 7.0 to 7.5 inches)." },
  { item: "Bangle Size 2.8", fit: "2.5 inch inner diameter", note: "Comfortable fit for medium-to-broad wrists (wrist circumference 7.5 to 8.0 inches)." },
];

export default function SizeGuideModal({ open, onClose, defaultGender = "women" }) {
  const [tab, setTab] = useState(() => {
    if (defaultGender === "men") return 1;
    if (defaultGender === "jewellery") return 3;
    return 0;
  });
  const [unit, setUnit] = useState("in");

  const handleUnitChange = (event, newUnit) => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="size-guide-modal-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          backgroundImage: "none",
          border: "1px solid #ECE7DE",
          boxShadow: "0 24px 48px rgba(26,24,23,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        id="size-guide-modal-title"
        sx={{
          bgcolor: "#1A1817",
          color: "#FFFFFF",
          py: 2.2,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <StraightenIcon sx={{ color: "#D1A362", fontSize: 26 }} />
          <Box>
            <Typography variant="h6" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: "#FCFAF7" }}>
              Atelier Size & Measurement Guide
            </Typography>
            <Typography variant="caption" sx={{ color: "#D1A362", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Precision Sizing for Flawless Occasion Wear
            </Typography>
          </Box>
        </Stack>
        <IconButton
          aria-label="close size guide"
          onClick={onClose}
          sx={{
            color: "#FFF",
            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#FAFAFA" }}>
        {/* Controls Strip: Tabs and Unit Switcher */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Tabs
            value={tab}
            onChange={(e, val) => setTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Garment category sizing tabs"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.9rem",
                color: "#666",
                minHeight: 40,
                py: 0.5,
                "&.Mui-selected": { color: "#1A1817", fontWeight: 700 },
              },
              "& .MuiTabs-indicator": {
                bgcolor: "#D1A362",
                height: 3,
                borderRadius: 1,
              },
            }}
          >
            <Tab label="Women's Ethnic (Lehenga / Saree)" />
            <Tab label="Men's Royal (Sherwani / Kurta)" />
            <Tab label="Evening Gowns & Western" />
            <Tab label="Jewellery & Bangles" />
          </Tabs>

          {tab !== 3 && (
            <ToggleButtonGroup
              value={unit}
              exclusive
              onChange={handleUnitChange}
              size="small"
              aria-label="Measurement units"
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: 2,
                border: "1px solid #ECE7DE",
                "& .MuiToggleButton-root": {
                  px: 2,
                  py: 0.4,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#666",
                  "&.Mui-selected": {
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    "&:hover": { bgcolor: "#1A1817" },
                  },
                },
              }}
            >
              <ToggleButton value="in" aria-label="inches">Inches (in)</ToggleButton>
              <ToggleButton value="cm" aria-label="centimeters">Centimeters (cm)</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>

        {/* Tab 0: Women's Ethnic */}
        {tab === 0 && (
          <Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2 }}>
              <Table size="small" aria-label="Women sizing chart">
                <TableHead sx={{ bgcolor: "#F5F2EC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Standard Size</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Bust ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Waist ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Hips ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Skirt Length ({unit})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {WOMEN_CHART.map((row) => (
                    <TableRow key={row.size} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: "#1A1817" }}>
                        {row.size}
                      </TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.bustIn}"` : `${row.bustCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.waistIn}"` : `${row.waistCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.hipsIn}"` : `${row.hipsCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.skirtLenIn}"` : `${row.skirtLenCm} cm`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 1: Men's Attire */}
        {tab === 1 && (
          <Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2 }}>
              <Table size="small" aria-label="Men sizing chart">
                <TableHead sx={{ bgcolor: "#F5F2EC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Size</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Chest ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Shoulder ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Waist ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Garment Length ({unit})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MEN_CHART.map((row) => (
                    <TableRow key={row.size} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: "#1A1817" }}>
                        {row.size}
                      </TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.chestIn}"` : `${row.chestCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.shoulderIn}"` : `${row.shoulderCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.waistIn}"` : `${row.waistCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.lengthIn}"` : `${row.lengthCm} cm`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Evening Gowns */}
        {tab === 2 && (
          <Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2 }}>
              <Table size="small" aria-label="Gown sizing chart">
                <TableHead sx={{ bgcolor: "#F5F2EC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Size</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Bust ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Waist ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Hips ({unit})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Full Gown Length ({unit})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {GOWN_CHART.map((row) => (
                    <TableRow key={row.size} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: "#1A1817" }}>
                        {row.size}
                      </TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.bustIn}"` : `${row.bustCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.waistIn}"` : `${row.waistCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.hipsIn}"` : `${row.hipsCm} cm`}</TableCell>
                      <TableCell align="right">{unit === "in" ? `${row.fullLenIn}"` : `${row.fullLenCm} cm`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: Jewellery */}
        {tab === 3 && (
          <Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2 }}>
              <Table size="small" aria-label="Jewellery dimensions">
                <TableHead sx={{ bgcolor: "#F5F2EC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Ornaments & Pieces</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Fit / Dimensions</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Styling & Placement Guidance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {JEWELLERY_CHART.map((row) => (
                    <TableRow key={row.item} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: "#1A1817" }}>
                        {row.item}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#D1A362" }}>{row.fit}</TableCell>
                      <TableCell sx={{ color: "#555", fontSize: "0.85rem" }}>{row.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* How to Measure & Tailoring Margin Note */}
        <Box sx={{ mt: 3, p: 2.2, bgcolor: "#FFFFFF", borderRadius: 2, border: "1px solid #ECE7DE" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <InfoOutlinedIcon sx={{ color: "#D1A362", fontSize: 20 }} />
            How to Measure for Perfect Occasion Wear Fit
          </Typography>

          <Stack spacing={1} sx={{ color: "#444", fontSize: "0.85rem", pl: 0.5 }}>
            <Box>
              <strong>Bust / Chest:</strong> Measure around the fullest circumference across your chest with your arms relaxed at your sides.
            </Box>
            <Box>
              <strong>Natural Waist:</strong> Measure around the narrowest point of your torso, typically 1 to 2 inches above your navel.
            </Box>
            <Box>
              <strong>Hips:</strong> Stand with feet together and measure around the widest point of your hips and buttocks.
            </Box>
            <Box>
              <strong>Footwear Allowance:</strong> For bridal lehengas and evening gowns, consider the heel height you intend to wear during your ceremony.
            </Box>
          </Stack>

          <Divider sx={{ my: 1.5, borderColor: "#F0EAE1" }} />

          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <CheckCircleOutlineIcon sx={{ color: "#2E7D32", fontSize: 20, mt: 0.2 }} />
            <Typography variant="caption" sx={{ color: "#2E7D32", fontWeight: 600, lineHeight: 1.5 }}>
              <strong>Alterations & Temporary Fit:</strong> Seam margins vary by designer and specific garment. Any temporary basting stitches must be non-destructive (no cutting of fabric or permanent alterations) and should be confirmed with the lender.
            </Typography>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.8, bgcolor: "#FFFFFF", borderTop: "1px solid #ECE7DE" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: "#1A1817",
            color: "#D1A362",
            fontWeight: 700,
            px: 3.5,
            py: 0.8,
            "&:hover": { bgcolor: "#2E2A27" },
          }}
        >
          Got It, Close Guide
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SizeGuideModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  defaultGender: PropTypes.string,
};
