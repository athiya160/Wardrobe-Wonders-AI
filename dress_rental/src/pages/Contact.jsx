import { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  Stack,
  Card,
  CardContent,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { styled } from "@mui/system";
import {
  LocationOnOutlined as LocationIcon,
  PhoneInTalkOutlined as PhoneIcon,
  EmailOutlined as EmailIcon,
  AccessTimeOutlined as TimeIcon,
  Send as SendIcon,
  CheckCircleOutline as CheckIcon,
  AutoAwesome as SparklesIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  Checkroom as CheckroomIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ResponsiveAppBar from "../components/Navbar";
import Fotter from "../components/Fotter";

// Luxury Hero Section with blended editorial backdrop
const HeroSection = styled(Box)({
  background: "linear-gradient(135deg, rgba(17, 19, 23, 0.92) 0%, rgba(26, 31, 38, 0.90) 50%, rgba(36, 43, 53, 0.95) 100%), url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600')",
  backgroundSize: "cover",
  backgroundPosition: "center 35%",
  color: "#FFFFFF",
  padding: "60px 0 50px 0",
  position: "relative",
  overflow: "hidden",
});

const ContactCard = styled(Card)({
  height: "100%",
  borderRadius: "14px",
  border: "1px solid #ECECEC",
  boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
  transition: "all 0.25s ease",
  backgroundColor: "#FFFFFF",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
  },
});

const INQUIRY_TOPICS = [
  "Sizing & Custom Fitting Advice",
  "Reservation & Booking Inquiry",
  "Order & Delivery Tracking",
  "Security Deposit & Returns",
  "Lender & Wardrobe Partnership",
  "Corporate & Event Group Rentals",
  "General Support",
];

const ContactUs = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    topic: "Sizing & Custom Fitting Advice",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        topic: "Sizing & Custom Fitting Advice",
        message: "",
      });
    }, 700);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F9FAFC" }}>
      <ResponsiveAppBar />

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2, color: "#9E9E9E", fontSize: "0.85rem" }}>
            <MuiLink
              underline="hover"
              color="inherit"
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              Home
            </MuiLink>
            <Typography color="#D1A362" fontSize="0.85rem" fontWeight={500}>
              Client Services & Concierge
            </Typography>
          </Breadcrumbs>

          <Box sx={{ maxWidth: "750px" }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.22em",
                color: "#D1A362",
                fontWeight: 700,
                display: "inline-block",
                mb: 1,
              }}
            >
              WARDROBE WONDERS CONCIERGE
            </Typography>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                color: "#FFFFFF",
                fontSize: { xs: "2rem", md: "2.8rem" },
                mb: 1.5,
              }}
            >
              We&apos;re Here to Elevate Your Style
            </Typography>
            <Typography variant="body1" sx={{ color: "#D1D5DB", fontSize: "1.05rem", lineHeight: 1.6 }}>
              Whether you need fitting consultations, custom event reservations, or order assistance, our dedicated fashion curators are at your service 7 days a week.
            </Typography>
          </Box>
        </Container>
      </HeroSection>

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ py: 5, flex: 1 }}>
        
        {/* 4 Feature Highlights */}
        <Box 
          sx={{ 
            display: "grid", 
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, 
            gap: 2.5, 
            mb: 5 
          }}
        >
          <ContactCard>
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 1.5,
                }}
              >
                <PhoneIcon />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} color="#111827">
                Concierge Line
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.85rem" }}>
                +1 (800) 555-DRESS
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3 }}>
                Mon – Sun: 9AM – 9PM EST
              </Typography>
            </CardContent>
          </ContactCard>

          <ContactCard>
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 1.5,
                }}
              >
                <EmailIcon />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} color="#111827">
                Direct Email Desk
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.85rem" }}>
                concierge@wardrobewonders.com
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3 }}>
                stylist@wardrobewonders.com
              </Typography>
            </CardContent>
          </ContactCard>

          <ContactCard>
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 1.5,
                }}
              >
                <LocationIcon />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} color="#111827">
                Flagship Atelier
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.85rem" }}>
                120 Fashion Blvd, Atelier 4B
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3 }}>
                New York, NY 10018
              </Typography>
            </CardContent>
          </ContactCard>

          <ContactCard>
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  backgroundColor: "rgba(209, 163, 98, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D1A362",
                  mb: 1.5,
                }}
              >
                <TimeIcon />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} color="#111827">
                Rapid Turnaround
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.85rem" }}>
                Typical reply: &lt; 15 mins
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3 }}>
                Priority response for active rentals
              </Typography>
            </CardContent>
          </ContactCard>
        </Box>

        {/* 2-Column Section: Inquiry Form & Atelier Details */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" }, gap: 4 }}>
          
          {/* Column 1: Interactive Inquiry Form */}
          <Box
            sx={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              p: { xs: 3, sm: 4 },
              border: "1px solid #ECECEC",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: "#111827", mb: 0.5, fontFamily: '"Playfair Display", "Georgia", serif' }}
            >
              Send Our Concierge a Message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fill in your details below and an experienced style specialist will connect with you promptly.
            </Typography>

            {submitted && (
              <Alert
                icon={<CheckIcon fontSize="inherit" />}
                severity="success"
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setSubmitted(false)}
              >
                <strong>Thank you!</strong> Your message has been received by our concierge desk. We will review your request and reply shortly.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    required
                    label="Your Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    size="small"
                  />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Phone / WhatsApp (Optional)"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    size="small"
                  />
                  <TextField
                    select
                    fullWidth
                    label="Inquiry Topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    size="small"
                  >
                    {INQUIRY_TOPICS.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label="How can we assist you?"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Provide event date, dress preferences, sizing queries, or rental booking details..."
                />

                <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                  <Typography variant="caption" color="text.secondary">
                    🔒 All information is encrypted & handled confidentially.
                  </Typography>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<SendIcon />}
                    sx={{
                      backgroundColor: "#D1A362",
                      color: "#FFFFFF",
                      px: 3.5,
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 14px rgba(209, 163, 98, 0.35)",
                      "&:hover": {
                        backgroundColor: "#B88438",
                      },
                    }}
                  >
                    {loading ? "Sending..." : "Submit Inquiry"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Box>

          {/* Column 2: Stylist Consultation & FAQs */}
          <Stack spacing={3}>
            
            {/* AI Stylist & Fitting Banner Card */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #1C2A39 0%, #293B4D 100%)",
                color: "#FFFFFF",
                p: 3,
                borderRadius: "16px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SparklesIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                <Typography variant="overline" sx={{ color: "#D1A362", fontWeight: 700, letterSpacing: "0.15em" }}>
                  PERSONAL STYLING
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: '"Playfair Display", "Georgia", serif' }}>
                Need Help Finding the Perfect Outfit?
              </Typography>
              <Typography variant="body2" sx={{ color: "#CBD5E1", mb: 2.5, lineHeight: 1.6 }}>
                Try our AI Style Consultant for curated designer looks matching your body profile, wedding theme, gala dress code, and budget.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate("/stylist")}
                startIcon={<SparklesIcon />}
                sx={{
                  color: "#FFFFFF",
                  borderColor: "#D1A362",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(209, 163, 98, 0.15)",
                    borderColor: "#D1A362",
                  },
                }}
              >
                Launch AI Style Consultant
              </Button>
            </Box>

            {/* Frequently Asked Questions */}
            <Box
              sx={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                p: 3,
                border: "1px solid #ECECEC",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} color="#111827" mb={1.5}>
                Quick Answers
              </Typography>

              <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 0, minHeight: 42 }}>
                  <Typography variant="body2" fontWeight={600} color="#222">
                    How do rental security deposits work?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0, pb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                    A refundable security deposit is held at checkout and released back to your original payment method within 24 hours of the outfit being inspected upon return.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Divider />

              <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 0, minHeight: 42 }}>
                  <Typography variant="body2" fontWeight={600} color="#222">
                    What if the dress doesn&apos;t fit?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0, pb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                    Notify our concierge within 24 hours of delivery. We will courier an emergency replacement size or issue a 100% rental credit.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Divider />

              <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ px: 0, minHeight: 42 }}>
                  <Typography variant="body2" fontWeight={600} color="#222">
                    Do I have to dry-clean before returning?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0, pb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
                    No cleaning is required! All professional eco-friendly dry-cleaning and garment sanitation are handled by Wardrobe Wonders upon return.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>

            {/* Quick Navigation Links */}
            <Stack direction="row" spacing={1.5}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/")}
                sx={{
                  borderColor: "#D5D9D9",
                  color: "#333",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { borderColor: "#111", backgroundColor: "#F9FAFC" },
                }}
              >
                Back to Home
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CheckroomIcon />}
                onClick={() => navigate("/w-dress")}
                sx={{
                  borderColor: "#D1A362",
                  color: "#B88438",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { borderColor: "#B88438", backgroundColor: "rgba(209, 163, 98, 0.05)" },
                }}
              >
                Explore Outfits
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>

      <Fotter />
    </Box>
  );
};

export default ContactUs;
