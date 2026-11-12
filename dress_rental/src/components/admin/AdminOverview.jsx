import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  PeopleAltOutlined as UsersIcon,
  CheckroomOutlined as DressesIcon,
  ReceiptLongOutlined as OrdersIcon,
  ReportProblemOutlined as ReportsIcon,
  WarningAmberRounded as AlertIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  ShieldOutlined as ShieldIcon,
  StorefrontOutlined as StoreIcon,
  LocalOfferOutlined as StoreProductIcon,
} from "@mui/icons-material";

export default function AdminOverview({ overview, storeOverview, onNavigateTab, onRefresh }) {
  if (!overview) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 3,
          border: "1px solid #ECE7DE",
          bgcolor: "#FFFFFF",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No overview analytics currently available.
        </Typography>
        <Button
          variant="outlined"
          onClick={onRefresh}
          sx={{ mt: 2, borderColor: "#1A1817", color: "#1A1817", borderRadius: 2 }}
        >
          Reload Analytics
        </Button>
      </Paper>
    );
  }

  const { finance, users, listings, rentals, reports } = overview;
  const pendingReportsCount = reports?.pending || 0;
  const pendingRentalsCount = rentals?.pending || 0;

  return (
    <Stack spacing={3.5}>
      {/* Priority Action Banner */}
      {(pendingReportsCount > 0 || pendingRentalsCount > 0) && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: "1px solid #F5C6CB",
            bgcolor: "#FFF8F8",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AlertIcon sx={{ color: "#D32F2F", fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#721C24">
                  Operational Attention Required
                </Typography>
                <Typography variant="caption" color="#721C24">
                  {pendingReportsCount > 0 && `${pendingReportsCount} compliance dispute(s) pending review. `}
                  {pendingRentalsCount > 0 && `${pendingRentalsCount} rental reservation(s) awaiting provider fulfillment.`}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              {pendingReportsCount > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onNavigateTab("reports")}
                  sx={{
                    bgcolor: "#D32F2F",
                    color: "#FFF",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#B71C1C" },
                  }}
                >
                  Review Disputes
                </Button>
              )}
              {pendingRentalsCount > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onNavigateTab("orders")}
                  sx={{
                    borderColor: "#1A1817",
                    color: "#1A1817",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2,
                  }}
                >
                  Inspect Bookings
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Financial Metrics Panel */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          border: "1px solid #2B2825",
          bgcolor: "#1A1817",
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <WalletIcon sx={{ color: "#D1A362", fontSize: 20 }} />
            <Typography
              variant="caption"
              sx={{
                color: "#D1A362",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Marketplace Economics & Financial Volume
            </Typography>
          </Stack>
          <Chip
            size="small"
            label="Gross Completed GMV"
            sx={{
              bgcolor: "rgba(209, 163, 98, 0.15)",
              color: "#D1A362",
              fontWeight: 700,
              fontSize: "0.75rem",
              border: "1px solid rgba(209, 163, 98, 0.3)",
            }}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: "#A09E9B" }}>
              Total Marketplace Volume (GMV)
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 0.5,
                color: "#FFFFFF",
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              ₹{(finance?.marketplaceVolume || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#777", display: "block", mt: 0.5 }}>
              Includes rental fees + refundable deposits
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: "#A09E9B" }}>
              Net Rental Fees Volume
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 0.5,
                color: "#D1A362",
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              ₹{(finance?.rentalFeesVolume || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#777", display: "block", mt: 0.5 }}>
              Clean rental fees (security deposits deducted)
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ color: "#A09E9B" }}>
              Estimated Platform Take (15%)
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 0.5,
                color: "#81C784",
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              ₹{(finance?.estimatedPlatformRevenue || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#777", display: "block", mt: 0.5 }}>
              15% commission on completed net rental fees
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.1)" }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography variant="caption" sx={{ color: "#8E8B85", fontSize: "0.75rem" }}>
            * Note: Platform commission is strictly assessed against completed rental fees. Security deposits are managed in escrow and never counted as revenue.
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            onClick={() => onNavigateTab("orders")}
            sx={{
              color: "#D1A362",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              p: 0,
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
            }}
          >
            Inspect Order Ledger
          </Button>
        </Stack>
      </Paper>

      {/* Operational KPI Grid */}
      <Grid container spacing={3}>
        {/* USERS CARD */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              },
            }}
          >
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography
                  variant="caption"
                  sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}
                >
                  User Community
                </Typography>
                <UsersIcon sx={{ color: "#D1A362", fontSize: 22 }} />
              </Stack>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "#1A1817",
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {users?.total || 0}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                <Chip
                  size="small"
                  label={`${users?.customers || 0} Customers`}
                  sx={{ bgcolor: "#E3F2FD", color: "#0D47A1", fontWeight: 600, fontSize: "0.72rem" }}
                />
                <Chip
                  size="small"
                  label={`${users?.providers || 0} Ateliers`}
                  sx={{ bgcolor: "#FFF8E1", color: "#F57F17", fontWeight: 600, fontSize: "0.72rem" }}
                />
              </Stack>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              onClick={() => onNavigateTab("users")}
              sx={{
                mt: 3,
                justifyContent: "flex-start",
                color: "#1A1817",
                fontWeight: 700,
                textTransform: "none",
                p: 0,
                fontSize: "0.8rem",
              }}
            >
              Manage Users & Roles
            </Button>
          </Paper>
        </Grid>

        {/* LISTINGS CARD */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              },
            }}
          >
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography
                  variant="caption"
                  sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}
                >
                  Garment Catalog
                </Typography>
                <DressesIcon sx={{ color: "#D1A362", fontSize: 22 }} />
              </Stack>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "#1A1817",
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {listings?.total || 0}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                <Chip
                  size="small"
                  label={`${listings?.active || 0} Active`}
                  sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 600, fontSize: "0.72rem" }}
                />
                <Chip
                  size="small"
                  label={`${listings?.inactive || 0} Paused`}
                  sx={{ bgcolor: "#F5F5F5", color: "#616161", fontWeight: 600, fontSize: "0.72rem" }}
                />
              </Stack>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              onClick={() => onNavigateTab("listings")}
              sx={{
                mt: 3,
                justifyContent: "flex-start",
                color: "#1A1817",
                fontWeight: 700,
                textTransform: "none",
                p: 0,
                fontSize: "0.8rem",
              }}
            >
              Moderate Garments
            </Button>
          </Paper>
        </Grid>

        {/* ORDERS CARD */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              },
            }}
          >
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography
                  variant="caption"
                  sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}
                >
                  Rental Bookings
                </Typography>
                <OrdersIcon sx={{ color: "#D1A362", fontSize: 22 }} />
              </Stack>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "#1A1817",
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {rentals?.total || 0}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                <Chip
                  size="small"
                  label={`${rentals?.active || 0} Active`}
                  sx={{ bgcolor: "#E3F2FD", color: "#0D47A1", fontWeight: 600, fontSize: "0.72rem" }}
                />
                <Chip
                  size="small"
                  label={`${rentals?.completed || 0} Done`}
                  sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 600, fontSize: "0.72rem" }}
                />
                <Chip
                  size="small"
                  label={`${rentals?.pending || 0} Pending`}
                  sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 600, fontSize: "0.72rem" }}
                />
              </Stack>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              onClick={() => onNavigateTab("orders")}
              sx={{
                mt: 3,
                justifyContent: "flex-start",
                color: "#1A1817",
                fontWeight: 700,
                textTransform: "none",
                p: 0,
                fontSize: "0.8rem",
              }}
            >
              View Order Ledger
            </Button>
          </Paper>
        </Grid>

        {/* REPORTS CARD */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: pendingReportsCount > 0 ? "1px solid #FFCDD2" : "1px solid #ECE7DE",
              bgcolor: pendingReportsCount > 0 ? "#FFFBFA" : "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              },
            }}
          >
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: pendingReportsCount > 0 ? "#D32F2F" : "#888",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Trust & Compliance
                </Typography>
                <ReportsIcon sx={{ color: pendingReportsCount > 0 ? "#D32F2F" : "#D1A362", fontSize: 22 }} />
              </Stack>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: pendingReportsCount > 0 ? "#D32F2F" : "#2E7D32",
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {pendingReportsCount}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.5 }}>
                {reports?.total || 0} total disputes filed across platform
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              onClick={() => onNavigateTab("reports")}
              sx={{
                mt: 3,
                justifyContent: "flex-start",
                color: pendingReportsCount > 0 ? "#D32F2F" : "#1A1817",
                fontWeight: 700,
                textTransform: "none",
                p: 0,
                fontSize: "0.8rem",
              }}
            >
              Resolve Disputes
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* STORE MARKETPLACE OPERATIONS SECTION */}
      {storeOverview && (
        <Box sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <StoreIcon sx={{ color: "#D1A362", fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', color: "#1A1817" }}>
              Store Marketplace Operations & Moderation Queue
            </Typography>
          </Stack>

          <Grid container spacing={2.5}>
            {/* SELLER APPLICATIONS OVERVIEW */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: (storeOverview.applications?.pending || 0) > 0 ? "1px solid #FFE082" : "1px solid #ECE7DE",
                  bgcolor: (storeOverview.applications?.pending || 0) > 0 ? "#FFFDF9" : "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
                      Seller Onboarding
                    </Typography>
                    <StoreIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                  </Stack>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "#1A1817", fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {storeOverview.applications?.total || 0}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={`${storeOverview.applications?.pending || 0} Awaiting Review`}
                      sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 700, fontSize: "0.72rem" }}
                    />
                    <Chip
                      size="small"
                      label={`${storeOverview.applications?.approved || 0} Approved`}
                      sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 600, fontSize: "0.72rem" }}
                    />
                    <Chip
                      size="small"
                      label={`${storeOverview.applications?.rejected || 0} Rejected`}
                      sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 600, fontSize: "0.72rem" }}
                    />
                  </Stack>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onNavigateTab("store_apps")}
                  sx={{ mt: 3, justifyContent: "flex-start", color: "#1A1817", fontWeight: 700, textTransform: "none", p: 0, fontSize: "0.8rem" }}
                >
                  Review Applications
                </Button>
              </Paper>
            </Grid>

            {/* PRODUCT MODERATION OVERVIEW */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: (storeOverview.products?.pending || 0) > 0 ? "1px solid #FFE082" : "1px solid #ECE7DE",
                  bgcolor: (storeOverview.products?.pending || 0) > 0 ? "#FFFDF9" : "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
                      Store Product Catalog
                    </Typography>
                    <StoreProductIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                  </Stack>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "#1A1817", fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {storeOverview.products?.total || 0}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={`${storeOverview.products?.pending || 0} Pending Moderation`}
                      sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 700, fontSize: "0.72rem" }}
                    />
                    <Chip
                      size="small"
                      label={`${storeOverview.products?.approved || 0} Live`}
                      sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 600, fontSize: "0.72rem" }}
                    />
                    <Chip
                      size="small"
                      label={`${storeOverview.products?.rejected || 0} Rejected`}
                      sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 600, fontSize: "0.72rem" }}
                    />
                  </Stack>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onNavigateTab("store_products")}
                  sx={{ mt: 3, justifyContent: "flex-start", color: "#1A1817", fontWeight: 700, textTransform: "none", p: 0, fontSize: "0.8rem" }}
                >
                  Moderate Catalog
                </Button>
              </Paper>
            </Grid>

            {/* ACTIVE STORES NETWORK OVERVIEW */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid #ECE7DE",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
                      Multi-Vendor Storefronts
                    </Typography>
                    <StoreIcon sx={{ color: "#D1A362", fontSize: 20 }} />
                  </Stack>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "#1A1817", fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {storeOverview.stores?.total || 0}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={`${storeOverview.stores?.active || 0} Active Stores`}
                      sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.72rem" }}
                    />
                    <Chip
                      size="small"
                      label={`${storeOverview.stores?.suspended || 0} Suspended`}
                      sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 600, fontSize: "0.72rem" }}
                    />
                  </Stack>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onNavigateTab("store_apps")}
                  sx={{ mt: 3, justifyContent: "flex-start", color: "#1A1817", fontWeight: 700, textTransform: "none", p: 0, fontSize: "0.8rem" }}
                >
                  View Storefronts
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Trust & Safety Assurance Note */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid #ECE7DE",
          bgcolor: "#FDFBF7",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <ShieldIcon sx={{ color: "#D1A362", fontSize: 32 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#1A1817">
              Enterprise Booking Safety & Escrow Integrity
            </Typography>
            <Typography variant="caption" color="text.secondary">
              All transactions in Wardrobe Wonders are protected with atomic calendar reservation locks and gateway checksum validation. Security deposits remain segregated from platform revenue until inspection and return authorization.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

AdminOverview.propTypes = {
  overview: PropTypes.shape({
    finance: PropTypes.shape({
      marketplaceVolume: PropTypes.number,
      rentalFeesVolume: PropTypes.number,
      estimatedPlatformRevenue: PropTypes.number,
    }),
    users: PropTypes.shape({
      total: PropTypes.number,
      customers: PropTypes.number,
      providers: PropTypes.number,
    }),
    listings: PropTypes.shape({
      total: PropTypes.number,
      active: PropTypes.number,
      inactive: PropTypes.number,
    }),
    rentals: PropTypes.shape({
      total: PropTypes.number,
      pending: PropTypes.number,
      active: PropTypes.number,
      completed: PropTypes.number,
      cancelled: PropTypes.number,
    }),
    reports: PropTypes.shape({
      total: PropTypes.number,
      pending: PropTypes.number,
    }),
  }),
  onNavigateTab: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
