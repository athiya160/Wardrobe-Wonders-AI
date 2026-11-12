import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function ProviderAddDress({
  formData,
  setFormData,
  onSubmit,
  onFileUpload,
  uploading,
  onGenerateAi,
  aiLoading,
  actionLoading,
}) {
  return (
    <Box maxWidth="900px" mx="auto">
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            color: "#1A1817",
          }}
        >
          Publish a Garment to the Rental Collection
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Provide accurate garment specs, set your daily rental tariff, and upload clear boutique photography.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        component="form"
        onSubmit={onSubmit}
        sx={{
          p: { xs: 2.5, sm: 4 },
          bgcolor: "#FFFFFF",
          border: "1px solid #ECE7DE",
          borderRadius: 3,
        }}
      >
        <Stack spacing={4}>
          {/* SECTION 1: ESSENTIAL DETAILS */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              1. Garment Details & Classification
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Garment Title / Outfit Name"
                  placeholder="e.g. Sabyasachi Crimson Velvet Bridal Lehenga"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="Wedding">Wedding / Bridal Couture</MenuItem>
                    <MenuItem value="Traditional">Festive & Traditional Ethnic</MenuItem>
                    <MenuItem value="Party">Party & Cocktail Gowns</MenuItem>
                    <MenuItem value="Formal">Formal & Black-Tie</MenuItem>
                    <MenuItem value="Jewellery">Temple & Fine Jewellery</MenuItem>
                    <MenuItem value="Casual">Casual / Contemporary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Wardrobe Department</InputLabel>
                  <Select
                    value={formData.gender}
                    label="Wardrobe Department"
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <MenuItem value="women">{"Women's Couture"}</MenuItem>
                    <MenuItem value="men">{"Men's Royal Attire"}</MenuItem>
                    <MenuItem value="jewellery">Jewellery & Accessories</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Size</InputLabel>
                  <Select
                    value={formData.size}
                    label="Size"
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  >
                    <MenuItem value="XS">XS (34 / UK 6)</MenuItem>
                    <MenuItem value="S">S (36 / UK 8)</MenuItem>
                    <MenuItem value="M">M (38 / UK 10)</MenuItem>
                    <MenuItem value="L">L (40 / UK 12)</MenuItem>
                    <MenuItem value="XL">XL (42 / UK 14)</MenuItem>
                    <MenuItem value="2XL">2XL (44 / UK 16)</MenuItem>
                    <MenuItem value="Free Size">Free Size (Adjustable Dori)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Designer / Brand / Atelier"
                  placeholder="e.g. Manish Malhotra, Anita Dongre, Self-Crafted"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Condition Assessment</InputLabel>
                  <Select
                    value={formData.condition}
                    label="Condition Assessment"
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <MenuItem value="Brand New with Tags">Brand New with Tags</MenuItem>
                    <MenuItem value="Like New">Like New (Worn 1-2 times)</MenuItem>
                    <MenuItem value="Excellent">Excellent (No visible wear)</MenuItem>
                    <MenuItem value="Gently Used">Gently Used (Maintained)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: "#ECE7DE" }} />

          {/* SECTION 2: AI COPYWRITER & DESCRIPTION */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                2. Editorial Description & Fashion Story
              </Typography>

              <Button
                size="small"
                variant="outlined"
                startIcon={<AutoAwesomeIcon sx={{ color: "#D1A362" }} />}
                onClick={onGenerateAi}
                disabled={aiLoading}
                sx={{
                  borderColor: "#D1A362",
                  color: "#8C6D3B",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  "&:hover": { borderColor: "#1A1817", bgcolor: "#FAF8F5" },
                }}
              >
                {aiLoading ? "Generating AI Copy..." : "AI Fashion Stylist Assistant"}
              </Button>
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Garment Description & Styling Notes"
              placeholder="Describe the fabric, embroidery, drape, silhouette, and occasions best suited for this piece..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Color / Palette"
                  placeholder="e.g. Royal Burgundy, Raw Silk Gold"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Occasion"
                  placeholder="e.g. Sangeet, Muhurtham, Grand Reception"
                  value={formData.occasion}
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: "#ECE7DE" }} />

          {/* SECTION 3: RENTAL PRICING & GUARANTEE */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              3. Rental Economics & Deposit
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  required
                  label="Daily Rental Tariff (₹ / Day)"
                  placeholder="e.g. 2500"
                  value={formData.rentalPricePerDay}
                  onChange={(e) => setFormData({ ...formData, rentalPricePerDay: e.target.value })}
                  helperText="You earn 85% of this daily fee on completed bookings."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  required
                  label="Refundable Security Deposit (₹)"
                  placeholder="e.g. 3000"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                  helperText="Returned to renter post-inspection without damage."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Dispatch / Pickup Hub"
                  placeholder="e.g. Mumbai, Bandra West Atelier"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ borderColor: "#ECE7DE" }} />

          {/* SECTION 4: BOUTIQUE PHOTOGRAPHY */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 1, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              4. Garment Photography
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 2 }}>
              Upload high-resolution photography (Front, Back, Embroidery details up to 5 photos):
            </Typography>

            {/* Dropzone */}
            <Box
              sx={{
                border: "2px dashed #D1A362",
                borderRadius: 2.5,
                p: 3,
                textAlign: "center",
                bgcolor: "#FAF8F5",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": { bgcolor: "#F5F2EB", borderColor: "#B58847" },
                mb: 2.5,
              }}
              onClick={() => document.getElementById("photo-upload-input")?.click()}
            >
              <input
                id="photo-upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                style={{ display: "none" }}
                onChange={(e) => onFileUpload(e.target.files)}
              />

              {uploading ? (
                <Stack spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                  <CircularProgress size={32} sx={{ color: "#D1A362" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Uploading boutique photography to secure cloud CDN...
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1} alignItems="center">
                  <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: "#D1A362" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                    Click or Drag Photos Here to Upload
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#777" }}>
                    PNG, JPG, or WEBP up to 10MB each
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Photo Preview Strip */}
            {formData.images?.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#888", display: "block", mb: 1 }}>
                  UPLOADED IMAGES ({formData.images.length}/5) &bull; Click to set primary cover photo
                </Typography>
                <Grid container spacing={1.5}>
                  {formData.images.map((imgUrl, idx) => (
                    <Grid item xs={6} sm={2.4} key={idx}>
                      <Box
                        onClick={() => setFormData({ ...formData, image: imgUrl })}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          border: formData.image === imgUrl ? "2px solid #D1A362" : "1px solid #ECE7DE",
                          aspectRatio: "3/4",
                          cursor: "pointer",
                        }}
                      >
                        <Box
                          component="img"
                          src={imgUrl}
                          alt={`Uploaded outfit ${idx + 1}`}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        {formData.image === imgUrl && (
                          <Chip
                            label="Cover"
                            size="small"
                            sx={{
                              position: "absolute",
                              bottom: 6,
                              left: 6,
                              height: 18,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              bgcolor: "#1A1817",
                              color: "#D1A362",
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: "#ECE7DE" }} />

          {/* SECTION 5: PROVENANCE & OWNERSHIP CONFIRMATION */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 1.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              5. Provenance & Ownership Verification
            </Typography>

            <TextField
              fullWidth
              size="small"
              label="Designer / Retail Verification URL (Optional)"
              placeholder="https://example.com/designer-product-page"
              value={formData.externalRefUrl}
              onChange={(e) => setFormData({ ...formData, externalRefUrl: e.target.value })}
              helperText="Optional link to official designer portfolio or retail catalogue for authentic provenance."
              sx={{ mb: 2 }}
            />

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "#FAF8F5",
                borderColor: "#ECE7DE",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.ownershipConfirmed}
                    onChange={(e) => setFormData({ ...formData, ownershipConfirmed: e.target.checked })}
                    sx={{
                      color: "#999",
                      "&.Mui-checked": { color: "#1A1817" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "#333", fontWeight: 600 }}>
                    I legally own or have explicit boutique authorization to rent this garment on Wardrobe Wonders. I confirm that all photos, condition descriptions, and specifications are truthful.
                  </Typography>
                }
              />
            </Paper>
          </Box>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={actionLoading || !formData.ownershipConfirmed}
            startIcon={actionLoading ? <CircularProgress size={20} sx={{ color: "#D1A362" }} /> : <LockOutlinedIcon />}
            sx={{
              bgcolor: "#1A1817",
              color: "#D1A362",
              fontWeight: 700,
              py: 1.5,
              borderRadius: 2,
              fontSize: "0.95rem",
              "&:hover": { bgcolor: "#2E2A27" },
              "&.Mui-disabled": { bgcolor: "#ECE7DE", color: "#9E9E9E" },
            }}
          >
            {actionLoading ? "Publishing Garment..." : "Publish Garment to Marketplace"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

ProviderAddDress.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  uploading: PropTypes.bool.isRequired,
  onGenerateAi: PropTypes.func.isRequired,
  aiLoading: PropTypes.bool.isRequired,
  actionLoading: PropTypes.bool.isRequired,
};
