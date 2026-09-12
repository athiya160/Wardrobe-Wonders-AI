import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Divider,
  Stack,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Gavel as LegalIcon,
  Security as SecurityIcon,
  Checkroom as GarmentIcon,
  MonetizationOn as RefundIcon,
  Storefront as ProviderIcon,
  Copyright as CopyrightIcon,
  Flag as ReportIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import ResponsiveAppBar from "../components/Navbar";

const LEGAL_SECTIONS = [
  { id: "terms", path: "/terms", label: "Terms of Service", icon: <LegalIcon fontSize="small" /> },
  { id: "privacy", path: "/privacy", label: "Privacy Policy", icon: <SecurityIcon fontSize="small" /> },
  { id: "rental-policy", path: "/rental-policy", label: "Rental & Care Policy", icon: <GarmentIcon fontSize="small" /> },
  { id: "refund-policy", path: "/refund-policy", label: "Refund & Deposit Escrow", icon: <RefundIcon fontSize="small" /> },
  { id: "provider-terms", path: "/provider-terms", label: "Provider Agreement", icon: <ProviderIcon fontSize="small" /> },
  { id: "copyright", path: "/copyright", label: "IP & Copyright", icon: <CopyrightIcon fontSize="small" /> },
  { id: "report-listing", path: "/report-listing", label: "Trust & Reporting", icon: <ReportIcon fontSize="small" /> },
];

const Legal = ({ defaultTab = "terms" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve active section from URL path or prop
  const currentPath = location.pathname.replace("/", "");
  const matchedSection = LEGAL_SECTIONS.find((s) => s.id === currentPath || s.path === location.pathname);
  const [activeTab, setActiveTab] = useState(matchedSection ? matchedSection.id : defaultTab);

  useEffect(() => {
    if (matchedSection) {
      setActiveTab(matchedSection.id);
    }
  }, [location.pathname]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/${newValue}`);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#FAFAFA", pb: 8 }}>
      <ResponsiveAppBar />

      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Navigation Breadcrumbs */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: "#666", textTransform: "none", fontWeight: 600 }}
          >
            Back
          </Button>
          <Typography variant="body2" color="text.secondary">
            /
          </Typography>
          <Link to="/" style={{ textDecoration: "none", color: "#666", fontSize: "0.875rem" }}>
            Home
          </Link>
          <Typography variant="body2" color="text.secondary">
            /
          </Typography>
          <Typography variant="body2" color="#D1A362" fontWeight={600}>
            Legal & Trust Center
          </Typography>
        </Stack>

        {/* Mandatory Legal Notice Alert */}
        <Alert
          severity="info"
          sx={{
            mb: 4,
            borderRadius: 2,
            border: "1px solid #cce5ff",
            backgroundColor: "#F4F9FF",
            color: "#1c3d5a",
            "& .MuiAlert-icon": { color: "#2b6cb0" },
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Demonstration Marketplace Legal Notice:
          </Typography>
          <Typography variant="caption" display="block">
            This document is provided for operational and demonstration purposes for the Wardrobe Wonders
            marketplace MVP. It does not constitute formal legal advice.
          </Typography>
        </Alert>

        {/* Header Title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} color="#1A1817" gutterBottom>
            Wardrobe Wonders Trust, Safety & Legal Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Clear standards, transparent deposit protections, and intellectual property compliance for our luxury fashion community.
          </Typography>
        </Box>

        {/* Tabs Bar */}
        <Paper elevation={0} sx={{ border: "1px solid #EBEBEB", borderRadius: 3, mb: 4, overflow: "hidden" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              backgroundColor: "#FFF",
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                minHeight: 56,
                color: "#666",
                "&.Mui-selected": { color: "#1A1817", fontWeight: 700 },
              },
              "& .MuiTabs-indicator": { backgroundColor: "#D1A362", height: 3 },
            }}
          >
            {LEGAL_SECTIONS.map((sec) => (
              <Tab key={sec.id} value={sec.id} label={sec.label} icon={sec.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Paper>

        {/* TAB CONTENTS */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, border: "1px solid #EBEBEB", borderRadius: 3, backgroundColor: "#FFF" }}>
          {/* 1. TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1A1817" mb={1}>
                Terms of Service
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                Last updated: September 2026 • Effective for all Wardrobe Wonders rentals
              </Typography>

              <Typography variant="body1" paragraph color="#333" sx={{ lineHeight: 1.8 }}>
                Welcome to <strong>Wardrobe Wonders</strong>, a peer-to-peer luxury fashion rental marketplace connecting garment owners (Providers) with fashion enthusiasts (Customers). By accessing or using our platform, you agree to comply with and be bound by these Terms of Service.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                1. Eligibility & Account Security
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Users must be at least 18 years of age to initiate rental contracts or publish wardrobe listings. You are responsible for safeguarding your credentials and all activities occurring under your account.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                2. Marketplace Role
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Wardrobe Wonders operates as a technology marketplace facilitating discovery, calendar reservations, condition recording, and payment facilitation between independent users.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                3. User Conduct & Truthful Representations
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                All participants agree to provide genuine garments, accurate condition descriptions, and adhere to agreed pickup and return delivery timelines. Tampering, fraudulent rental requests, or unauthorized commercial reproduction is strictly prohibited.
              </Typography>
            </Box>
          )}

          {/* 2. PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1A1817" mb={1}>
                Privacy & Data Protection Policy
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                Compliance with data minimization and responsible user privacy standards
              </Typography>

              <Typography variant="body1" paragraph color="#333" sx={{ lineHeight: 1.8 }}>
                At Wardrobe Wonders, we respect your personal privacy. This policy outlines how information is gathered, utilized, and protected when booking rentals or hosting boutique items.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                1. Information We Collect
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                We collect your registered name, verified email address, shipping delivery address, garment preferences, and transaction history. Payment card details are tokenized securely through licensed payment processors; raw CVV numbers are never saved on our servers.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                2. How We Use Your Information
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Information is strictly used to facilitate rental fulfillment, calculate courier deliveries, issue refundable security deposits, and power personalized AI stylist recommendations with user consent.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                3. Data Retention & Deletion Rights
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Users may request export or deletion of their personal profile data at any time by contacting safety@wardrobewonders.com or through account settings.
              </Typography>
            </Box>
          )}

          {/* 3. RENTAL & CARE POLICY */}
          {activeTab === "rental-policy" && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1A1817" mb={1}>
                Rental Policy & Garment Care Guidelines
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                Standardized rental windows, gentle wear guidelines, and return timelines
              </Typography>

              <Typography variant="body1" paragraph color="#333" sx={{ lineHeight: 1.8 }}>
                Wardrobe Wonders garments are high-value designer creations, lehengas, tuxedos, and evening gowns. Maintaining their pristine condition ensures a sustainable and delightful experience for everyone.
              </Typography>

              <Accordion defaultExpanded sx={{ mb: 1.5, border: "1px solid #EBEBEB", boxShadow: "none" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={700} color="#1A1817">
                    Rental Duration & Date Selection
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="#555" sx={{ lineHeight: 1.8 }}>
                    Rentals are booked based on exact date windows selected in the calendar. Garments are scheduled to arrive by 12:00 PM on the rental start date and must be dispatched back or collected by 12:00 PM on the agreed return date.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mb: 1.5, border: "1px solid #EBEBEB", boxShadow: "none" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={700} color="#1A1817">
                    Garment Care & Dry Cleaning Rules
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="#555" sx={{ lineHeight: 1.8 }}>
                    Customers should <strong>NOT</strong> attempt home washing or iron delicate silks, velvets, or embroidered zari work without provider consent. Professional eco dry-cleaning is managed by the provider or marketplace sanitization partners between bookings.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mb: 1.5, border: "1px solid #EBEBEB", boxShadow: "none" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={700} color="#1A1817">
                    Alterations & Modifications
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="#555" sx={{ lineHeight: 1.8 }}>
                    Permanent alterations (cutting, re-stitching, gluing) are strictly prohibited. Temporary non-damaging adjustments (such as reversible safety fashion tape or temporary tailor basting) must be restored before return.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {/* 4. REFUND & SECURITY DEPOSIT ESCROW */}
          {activeTab === "refund-policy" && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1A1817" mb={1}>
                Refund & Security Deposit Escrow Policy
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                Transparent breakdown of rental fees, refundable deposits, and damage assessments
              </Typography>

              <Typography variant="body1" paragraph color="#333" sx={{ lineHeight: 1.8 }}>
                Wardrobe Wonders maintains a transparent three-line pricing structure: <strong>Garment Rental Fee</strong>, <strong>Delivery & Cleaning</strong>, and <strong>Refundable Security Deposit</strong>.
              </Typography>

              <Stack spacing={2} sx={{ my: 3 }}>
                <Paper sx={{ p: 2.5, bgcolor: "#FBF9F5", border: "1px solid #F0E6D6", borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#8C6D3B">
                    🛡️ Security Deposit Escrow Guarantee
                  </Typography>
                  <Typography variant="body2" color="#555" sx={{ mt: 1, lineHeight: 1.7 }}>
                    The security deposit is held in escrow during the active rental period. Once the garment is returned and verified by the provider within 48 hours, the deposit is automatically released back to the customer's original payment method in full.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2.5, bgcolor: "#FFF", border: "1px solid #EBEBEB", borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#1A1817">
                    Minor Wear vs. Damage Deductions
                  </Typography>
                  <Typography variant="body2" color="#555" sx={{ mt: 1, lineHeight: 1.7 }}>
                    Normal minor wear (light dust, easily removable stains) is covered by our standard sanitization. Deductions occur only in cases of irreversible tears, major wine/oil stains requiring specialized restoration, or missing embellishments. All deductions require documented photographic evidence and audit review.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2.5, bgcolor: "#FFF", border: "1px solid #EBEBEB", borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#1A1817">
                    Customer Cancellation Refunds
                  </Typography>
                  <Typography variant="body2" color="#555" sx={{ mt: 1, lineHeight: 1.7 }}>
                    Cancellations initiated more than 48 hours prior to the rental start date receive a 100% refund of both the rental fee and the security deposit.
                  </Typography>
                </Paper>
              </Stack>
            </Box>
          )}

          {/* 5. PROVIDER AGREEMENT */}
          {activeTab === "provider-terms" && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1A1817" mb={1}>
                Provider Partnership & Boutique Agreement
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                Earnings structure, listing truthfulness, and fulfillment commitments
              </Typography>

              <Typography variant="body1" paragraph color="#333" sx={{ lineHeight: 1.8 }}>
                As a Wardrobe Wonders provider, you monetize your personal luxury collection while retaining full ownership of your physical pieces.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                1. Earnings & Commission Structure
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Providers earn <strong>85%</strong> of the garment rental fee for completed bookings. Wardrobe Wonders retains a 15% marketplace commission covering secure hosting, payment infrastructure, and customer support. <em>Security deposits are excluded from commission calculations and belong solely to the customer unless claimed for documented damages.</em>
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                2. Mandatory Ownership Confirmation
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Prior to publishing any listing, providers must explicitly confirm that they possess legal ownership or licensed authorization for the garment and photography submitted, and that condition ratings are accurate.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                3. Order Acceptance SLA
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Providers agree to respond to customer rental requests within 24 hours. If unavailable, providers must decline promptly to release reserved calendar dates for other users.
              </Typography>
            </Box>
          )}

          {/* 6. INTELLECTUAL PROPERTY & COPYRIGHT */}
          {activeTab === "copyright" && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1A1817" mb={1}>
                Intellectual Property, Photo Rights & DMCA Policy
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                Protecting creators, fashion designers, and original photography rights
              </Typography>

              <Typography variant="body1" paragraph color="#333" sx={{ lineHeight: 1.8 }}>
                Wardrobe Wonders respects intellectual property and expects all community members to do the same. We take unauthorized photography copying, trademark counterfeiting, and design theft seriously.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                1. Original Photography Requirements
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                Providers must only upload photos they have captured themselves or have explicit commercial permission to use. Downloading and reusing watermarked brand campaign photography without authorization is prohibited.
              </Typography>

              <Typography variant="h6" fontWeight={700} color="#1A1817" mt={3} mb={1}>
                2. Takedown Notices & Counter-Notices
              </Typography>
              <Typography variant="body2" color="#555" paragraph sx={{ lineHeight: 1.8 }}>
                If you believe a listing infringes your copyright or trademark, submit a formal report via our Trust & Reporting portal or email ip-safety@wardrobewonders.com with proof of ownership. Verified infringing listings are deactivated within 24 hours.
              </Typography>
            </Box>
          )}

          {/* 7. TRUST & REPORTING */}
          {activeTab === "report-listing" && (
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1A1817" mb={1}>
                Marketplace Trust & Listing Reporting Guidelines
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                How community moderation keeps Wardrobe Wonders safe and authentic
              </Typography>

              <Typography variant="body1" paragraph color="#333" sx={{ lineHeight: 1.8 }}>
                Every garment page features a <strong>"Report Listing"</strong> action allowing members to flag suspicious listings, copyright infringements, or misleading condition representations directly to our trust team.
              </Typography>

              <Stack spacing={2} sx={{ my: 3 }}>
                <Paper sx={{ p: 2.5, bgcolor: "#FFF", border: "1px solid #EBEBEB", borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#1A1817">
                    Valid Reasons for Reporting:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <Chip label="Copyright / IP Violation" color="error" variant="outlined" size="small" />
                    <Chip label="Misleading Listing / Stock Photos" color="warning" variant="outlined" size="small" />
                    <Chip label="Inappropriate Content" color="error" variant="outlined" size="small" />
                    <Chip label="Fraud / Suspicious Pricing" color="warning" variant="outlined" size="small" />
                    <Chip label="Incorrect Condition Rating" color="info" variant="outlined" size="small" />
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2.5, bgcolor: "#FBF9F5", border: "1px solid #F0E6D6", borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#8C6D3B">
                    Moderation Process & Resolution SLA
                  </Typography>
                  <Typography variant="body2" color="#555" sx={{ mt: 1, lineHeight: 1.7 }}>
                    Submitted reports are queued directly into our Admin Executive Moderation Console. Listings receiving multiple valid reports are temporarily suspended pending provider verification.
                  </Typography>
                </Paper>
              </Stack>

              <Button
                variant="contained"
                onClick={() => navigate("/")}
                sx={{
                  mt: 2,
                  bgcolor: "#1A1817",
                  color: "#FFF",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                Browse Marketplace Garments
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Legal;
