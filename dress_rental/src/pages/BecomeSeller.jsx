import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Snackbar,
  Card,
  CardContent,
} from "@mui/material";
import {
  StorefrontOutlined as StoreIcon,
  CheckCircleOutline as ApprovedIcon,
  HourglassEmptyOutlined as PendingIcon,
  CancelOutlined as RejectedIcon,
  ArrowForward as ArrowIcon,
  BusinessOutlined as BusinessIcon,
  LockOutlined as LockIcon,
  InfoOutlined as InfoIcon,
  EditOutlined as EditIcon,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";

export default function BecomeSeller() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [hasActiveStore, setHasActiveStore] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    sellerType: "boutique",
    storeName: "",
    storeDescription: "",
    logo: "",
    banner: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    email: user.email || "",
    phone: user.phone || "",
    website: "",
    instagram: "",
    idProofType: "GSTIN",
    businessRegNumber: "",
    taxId: "",
    notes: "",
  });

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const checkExistingApplication = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/store/seller/application`, authHeaders);
        if (res.data?.success) {
          if (res.data.isApprovedSeller) {
            setHasActiveStore(true);
          }
          if (res.data.application) {
            setExistingApp(res.data.application);
            // Pre-fill form in case they need to update/resubmit
            const app = res.data.application;
            setFormData({
              sellerType: app.sellerType || "boutique",
              storeName: app.storeName || "",
              storeDescription: app.storeDescription || "",
              logo: app.logo || "",
              banner: app.banner || "",
              address: app.location?.address || "",
              city: app.location?.city || "",
              state: app.location?.state || "",
              pincode: app.location?.pincode || "",
              email: app.contact?.email || user.email || "",
              phone: app.contact?.phone || user.phone || "",
              website: app.contact?.website || "",
              instagram: app.contact?.instagram || "",
              idProofType: app.verificationMetadata?.idProofType || "GSTIN",
              businessRegNumber: app.verificationMetadata?.businessRegNumber || "",
              taxId: app.verificationMetadata?.taxId || "",
              notes: app.verificationMetadata?.notes || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to check seller status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingApplication();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeName || !formData.city || !formData.state || !formData.pincode || !formData.phone) {
      setNotification({ open: true, message: "Please fill in all mandatory fields.", severity: "warning" });
      return;
    }

    setSubmitting(true);
    const payload = {
      sellerType: formData.sellerType,
      storeName: formData.storeName,
      storeDescription: formData.storeDescription,
      logo: formData.logo,
      banner: formData.banner,
      location: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: "India",
      },
      contact: {
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        instagram: formData.instagram,
      },
      verificationMetadata: {
        idProofType: formData.idProofType,
        businessRegNumber: formData.businessRegNumber,
        taxId: formData.taxId,
        notes: formData.notes,
      },
    };

    try {
      if (existingApp && (existingApp.status === "REJECTED" || existingApp.status === "MORE_INFORMATION_REQUIRED" || isEditing)) {
        // Resubmit / update
        const res = await axios.put(`${BASE_URL}/store/seller/application`, payload, authHeaders);
        if (res.data?.success) {
          setExistingApp(res.data.application);
          setIsEditing(false);
          setNotification({ open: true, message: "Application resubmitted successfully for admin review.", severity: "success" });
        }
      } else {
        // First submission
        const res = await axios.post(`${BASE_URL}/store/seller/apply`, payload, authHeaders);
        if (res.data?.success) {
          setExistingApp(res.data.application);
          setNotification({ open: true, message: "Application submitted successfully!", severity: "success" });
        }
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.message || "Failed to submit application. Please verify details.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container sx={{ py: 12, textAlign: "center" }}>
          <CircularProgress sx={{ color: "#D1A362" }} />
        </Container>
      </Box>
    );
  }

  // If user is not logged in
  if (!token) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}>
          <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <LockIcon sx={{ fontSize: 56, color: "#D1A362", mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 1.5 }}>
              Open Your Store
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
              You don&apos;t need a second account! Existing Wardrobe Wonders members can apply to sell using their existing login.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/login"
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 4,
                py: 1.2,
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              Sign In to Apply
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // If seller is already approved
  if (hasActiveStore) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF", textAlign: "center" }}>
            <ApprovedIcon sx={{ fontSize: 64, color: "#2E7D32", mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 1 }}>
              Your Storefront is Active!
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", mb: 3, maxWidth: 540, mx: "auto" }}>
              Your application was approved by our curation administrators. You can create product drafts, manage stock, and track moderation in your Seller Dashboard.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/store/seller/dashboard"
              endIcon={<ArrowIcon />}
              sx={{
                bgcolor: "#1A1817",
                color: "#D1A362",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3.5,
                py: 1.2,
                "&:hover": { bgcolor: "#2C2825" },
              }}
            >
              Enter Seller Dashboard
            </Button>
          </Paper>
        </Container>
        <Fotter />
      </Box>
    );
  }

  // If an application is pending or rejected and not currently editing
  if (existingApp && !isEditing) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
        <ResponsiveAppBar />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              {existingApp.status === "PENDING_REVIEW" && <PendingIcon sx={{ fontSize: 44, color: "#E65100" }} />}
              {existingApp.status === "REJECTED" && <RejectedIcon sx={{ fontSize: 44, color: "#C62828" }} />}
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>
                  Application Status: {existingApp.status.replace("_", " ")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Submitted on {new Date(existingApp.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>

            {existingApp.status === "PENDING_REVIEW" && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Your application for <strong>{existingApp.storeName}</strong> is undergoing verification. Our curation team reviews business identity, tax credentials, and category fit. You will be notified once reviewed.
              </Alert>
            )}

            {existingApp.status === "REJECTED" && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Application Not Approved
                </Typography>
                <Typography variant="body2">
                  {existingApp.adminReviewNotes || "Please review your business details and provide updated documents."}
                </Typography>
              </Alert>
            )}

            <Card elevation={0} sx={{ bgcolor: "#FAF8F5", borderRadius: 2, mb: 3, border: "1px solid #ECE7DE" }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      STORE NAME
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {existingApp.storeName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      SELLER TYPE
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                      {existingApp.sellerType?.replace("_", " ")}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      LOCATION
                    </Typography>
                    <Typography variant="body2">
                      {existingApp.location?.city}, {existingApp.location?.state} ({existingApp.location?.pincode})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                      CONTACT
                    </Typography>
                    <Typography variant="body2">
                      {existingApp.contact?.email} • {existingApp.contact?.phone}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {(existingApp.status === "REJECTED" || existingApp.status === "MORE_INFORMATION_REQUIRED") && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{
                  bgcolor: "#1A1817",
                  color: "#D1A362",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  "&:hover": { bgcolor: "#2C2825" },
                }}
              >
                Update Details & Resubmit
              </Button>
            )}
          </Paper>
        </Container>
        <Fotter />
      </Box>
    );
  }

  // Application Submission / Resubmission Form
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FAF8F5" }}>
      <ResponsiveAppBar />

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Chip
              label="MULTI-VENDOR STORE ONBOARDING"
              size="small"
              sx={{ bgcolor: "#FAF8F5", color: "#A07028", fontWeight: 800, mb: 1, border: "1px solid #ECE7DE" }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', color: "#1A1817" }}>
              {isEditing ? "Update & Resubmit Seller Application" : "Apply to Become a Store Seller"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 580, mx: "auto", mt: 1 }}>
              Boutiques, designer ateliers, jewellery crafters, home businesses, and verified pre-loved resellers welcome.
              Admin moderation ensures quality and trust across the platform.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Section 1: Business Classification */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817", mb: 0.5 }}>
                  1. Business Classification
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="seller-type-label">Seller Type *</InputLabel>
                  <Select
                    labelId="seller-type-label"
                    name="sellerType"
                    value={formData.sellerType}
                    label="Seller Type *"
                    onChange={handleChange}
                  >
                    <MenuItem value="boutique">Fashion Boutique / Retailer</MenuItem>
                    <MenuItem value="jewellery">Artisanal & Bridal Jewellery</MenuItem>
                    <MenuItem value="designer">Independent Fashion Designer</MenuItem>
                    <MenuItem value="home_business">Home-Based Business</MenuItem>
                    <MenuItem value="individual">Individual Fashion Seller</MenuItem>
                    <MenuItem value="reseller">Pre-loved Fashion Reseller</MenuItem>
                    <MenuItem value="creator">Instagram Stylist / Creator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Storefront Name *"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="e.g. Maya Heritage Atelier"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Store Description & Aesthetic"
                  name="storeDescription"
                  value={formData.storeDescription}
                  onChange={handleChange}
                  placeholder="Describe your brand, specializations, craftsmanship, and products..."
                />
              </Grid>

              {/* Section 2: Operating Location & Dispatch */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817", mt: 2, mb: 0.5 }}>
                  2. Dispatch & Origin Location
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Street / Commercial Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, Studio or Suite number"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="City *"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="State *"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="PIN Code *"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                />
              </Grid>

              {/* Section 3: Contact Channels */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817", mt: 2, mb: 0.5 }}>
                  3. Contact Channels
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Business Email *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Phone *"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Website / Portfolio URL"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Instagram Handle"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@yourbrand"
                />
              </Grid>

              {/* Section 4: Seller Verification & Compliance */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817", mt: 2, mb: 0.5 }}>
                  4. Seller Verification Metadata
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="id-type-label">ID Proof Type</InputLabel>
                  <Select
                    labelId="id-type-label"
                    name="idProofType"
                    value={formData.idProofType}
                    label="ID Proof Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="GSTIN">GSTIN (Business)</MenuItem>
                    <MenuItem value="PAN">PAN Card</MenuItem>
                    <MenuItem value="AADHAAR">Aadhaar (Individual)</MenuItem>
                    <MenuItem value="PASSPORT">Passport</MenuItem>
                    <MenuItem value="OTHER">Other Official ID</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tax / GSTIN / PAN Number"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Business Reg / Trade License"
                  name="businessRegNumber"
                  value={formData.businessRegNumber}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Verification Notes & Document Reference"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Link to hosted catalog, certifications, or license details..."
                />
              </Grid>

              {/* Submit CTA */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  {isEditing && (
                    <Button variant="outlined" onClick={() => setIsEditing(false)} sx={{ textTransform: "none" }}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{
                      bgcolor: "#1A1817",
                      color: "#D1A362",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                      px: 4,
                      py: 1.2,
                      "&:hover": { bgcolor: "#2C2825" },
                    }}
                  >
                    {submitting ? "Submitting Application..." : isEditing ? "Resubmit Application" : "Submit Seller Application"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>

      {/* Snackbar Toast */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>

      <Fotter />
    </Box>
  );
}
