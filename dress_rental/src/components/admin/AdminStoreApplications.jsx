import { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  CheckCircleOutline as ApproveIcon,
  CancelOutlined as RejectIcon,
  StorefrontOutlined as StoreIcon,
  BlockOutlined as SuspendIcon,
  HelpOutline as MoreInfoIcon,
  HistoryOutlined as HistoryIcon,
} from "@mui/icons-material";

export default function AdminStoreApplications({
  applications = [],
  onReview,
  actionLoading = false,
  statusFilter = "all",
  setStatusFilter,
  searchQuery = "",
  setSearchQuery,
  onRefresh,
}) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewDialog, setReviewDialog] = useState({ open: false, app: null, action: "" });
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");

  const handleOpenReview = (app, action) => {
    setReviewDialog({ open: true, app, action });
    setNotes("");
    setNotesError("");
  };

  const handleConfirmReview = () => {
    const isNoteMandatory = ["REJECTED", "SUSPENDED", "MORE_INFORMATION_REQUIRED"].includes(reviewDialog.action);
    if (isNoteMandatory && !notes.trim()) {
      setNotesError(
        reviewDialog.action === "REJECTED"
          ? "Rejection reason is mandatory."
          : reviewDialog.action === "SUSPENDED"
          ? "Suspension reason is mandatory."
          : "Instructions for applicant are mandatory."
      );
      return;
    }

    if (onReview && reviewDialog.app) {
      onReview(reviewDialog.app._id, reviewDialog.action, notes.trim());
      setReviewDialog({ open: false, app: null, action: "" });
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "APPROVED":
        return <Chip label="Approved" size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }} />;
      case "PENDING_REVIEW":
        return <Chip label="Pending Review" size="small" sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 700 }} />;
      case "REJECTED":
        return <Chip label="Rejected" size="small" sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700 }} />;
      case "MORE_INFORMATION_REQUIRED":
        return <Chip label="More Info Needed" size="small" sx={{ bgcolor: "#E1F5FE", color: "#0288D1", fontWeight: 700 }} />;
      case "SUSPENDED":
        return <Chip label="Suspended" size="small" sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box>
      {/* Controls & Filter Bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flex={1}>
          <TextField
            size="small"
            placeholder="Search store name, city, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />,
            }}
            sx={{ minWidth: 260 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="status-filter-label">Application Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Application Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Applications</MenuItem>
              <MenuItem value="PENDING_REVIEW">Pending Review</MenuItem>
              <MenuItem value="APPROVED">Approved Sellers</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="MORE_INFORMATION_REQUIRED">More Info Needed</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={actionLoading}
          sx={{ textTransform: "none", borderColor: "#D1A362", color: "#1A1817", fontWeight: 700 }}
        >
          Refresh Applications
        </Button>
      </Stack>

      {/* Applications Table */}
      <Paper elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2, overflow: "hidden" }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: "#FAF8F5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Store / Applicant</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Seller Type</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Submitted</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  <StoreIcon sx={{ fontSize: 48, color: "#ECE7DE", mb: 1, display: "block", mx: "auto" }} />
                  No seller applications matching this criteria.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={app.logo}
                        sx={{ bgcolor: "#D1A362", color: "#1A1817", fontWeight: 700, width: 40, height: 40 }}
                      >
                        {app.storeName ? app.storeName[0].toUpperCase() : "S"}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                          {app.storeName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                          {app.sellerId?.name || app.contact?.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                      {app.sellerType?.replace("_", " ")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {app.location?.city}, {app.location?.state}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      PIN: {app.location?.pincode}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(app.status)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Application Details">
                        <IconButton size="small" onClick={() => setSelectedApp(app)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {["PENDING_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(app.status) && (
                        <>
                          <Tooltip title="Approve Application">
                            <IconButton
                              size="small"
                              sx={{ color: "success.main" }}
                              onClick={() => handleOpenReview(app, "APPROVED")}
                            >
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Request More Info">
                            <IconButton
                              size="small"
                              sx={{ color: "info.main" }}
                              onClick={() => handleOpenReview(app, "MORE_INFORMATION_REQUIRED")}
                            >
                              <MoreInfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Application with Reason">
                            <IconButton
                              size="small"
                              sx={{ color: "error.main" }}
                              onClick={() => handleOpenReview(app, "REJECTED")}
                            >
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {app.status === "APPROVED" && (
                        <Tooltip title="Suspend Seller Store">
                          <IconButton
                            size="small"
                            sx={{ color: "warning.main" }}
                            onClick={() => handleOpenReview(app, "SUSPENDED")}
                          >
                            <SuspendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Application Detail View Modal */}
      {selectedApp && (
        <Dialog open={Boolean(selectedApp)} onClose={() => setSelectedApp(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", borderBottom: "1px solid #ECE7DE" }}>
            Seller Application: {selectedApp.storeName}
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  SELLER APPLICANT
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {selectedApp.sellerId?.name || "Customer User"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Email: {selectedApp.contact?.email}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Phone: {selectedApp.contact?.phone}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  STORE PROFILE
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {selectedApp.storeName} ({selectedApp.sellerType})
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Current Status: {selectedApp.status}
                </Typography>
                {selectedApp.contact?.website && (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Website: {selectedApp.contact?.website}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  DESCRIPTION
                </Typography>
                <Typography variant="body2">
                  {selectedApp.storeDescription || "No store description provided."}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  LOCATION
                </Typography>
                <Typography variant="body2">
                  {selectedApp.location?.address && `${selectedApp.location?.address}, `}
                  {selectedApp.location?.city}, {selectedApp.location?.state} - {selectedApp.location?.pincode}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  BUSINESS / KYC VERIFICATION METADATA
                </Typography>
                <Typography variant="body2">
                  ID Type: {selectedApp.verificationMetadata?.idProofType || "Not specified"}
                </Typography>
                <Typography variant="body2">
                  Tax / Reg No: {selectedApp.verificationMetadata?.taxId || selectedApp.verificationMetadata?.businessRegNumber || "None submitted"}
                </Typography>
                {selectedApp.verificationMetadata?.notes && (
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Notes: {selectedApp.verificationMetadata?.notes}
                  </Typography>
                )}
              </Grid>

              {/* Review History Audit Trail */}
              {selectedApp.reviewHistory && selectedApp.reviewHistory.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <HistoryIcon fontSize="small" sx={{ color: "#D1A362" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Moderation Audit History ({selectedApp.reviewHistory.length} actions)
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {selectedApp.reviewHistory.map((h, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.5,
                          bgcolor: "#FAF8F5",
                          borderRadius: 1.5,
                          border: "1px solid #ECE7DE",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {getStatusChip(h.newStatus || h.action)}
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {new Date(h.reviewedAt).toLocaleString()}
                            </Typography>
                          </Stack>
                          {h.notes && (
                            <Typography variant="body2" sx={{ mt: 0.5, color: "#1A1817" }}>
                              <strong>Note:</strong> {h.notes}
                            </Typography>
                          )}
                        </Box>
                        {h.reviewedBy?.name && (
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Admin: {h.reviewedBy.name}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              )}

              {selectedApp.adminReviewNotes && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: "#FFF8E1", borderRadius: 1.5, border: "1px solid #FFE082" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#795548" }}>
                      Current Admin Review Feedback:
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#4E342E" }}>
                      {selectedApp.adminReviewNotes}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: "1px solid #ECE7DE" }}>
            <Button onClick={() => setSelectedApp(null)} sx={{ textTransform: "none", color: "text.secondary" }}>
              Close
            </Button>
            {["PENDING_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(selectedApp.status) && (
              <>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => {
                    const target = selectedApp;
                    setSelectedApp(null);
                    handleOpenReview(target, "MORE_INFORMATION_REQUIRED");
                  }}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Request Info
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const target = selectedApp;
                    setSelectedApp(null);
                    handleOpenReview(target, "REJECTED");
                  }}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#1A1817", color: "#D1A362", "&:hover": { bgcolor: "#2C2825" }, textTransform: "none", fontWeight: 700 }}
                  onClick={() => {
                    const target = selectedApp;
                    setSelectedApp(null);
                    handleOpenReview(target, "APPROVED");
                  }}
                >
                  Approve Application
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Action Review Confirmation Dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, app: null, action: "" })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {reviewDialog.action === "APPROVED" && "Approve Seller Application"}
          {reviewDialog.action === "REJECTED" && "Reject Seller Application"}
          {reviewDialog.action === "MORE_INFORMATION_REQUIRED" && "Request Additional Information"}
          {reviewDialog.action === "SUSPENDED" && "Suspend Seller Store"}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {reviewDialog.action === "APPROVED" &&
              `Approving this application will activate the storefront for "${reviewDialog.app?.storeName}" and allow the seller to submit product listings.`}
            {reviewDialog.action === "REJECTED" &&
              `Rejecting this application will notify the applicant. You must specify a clear rejection reason.`}
            {reviewDialog.action === "MORE_INFORMATION_REQUIRED" &&
              `Requesting additional information will notify the applicant with your specific requirements.`}
            {reviewDialog.action === "SUSPENDED" &&
              `Suspending this seller will deactivate their store and hide all their products from public search.`}
          </Typography>

          <TextField
            label={
              ["REJECTED", "SUSPENDED", "MORE_INFORMATION_REQUIRED"].includes(reviewDialog.action)
                ? "Review Reason / Instructions (Mandatory)"
                : "Review Notes (Optional)"
            }
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (e.target.value.trim()) setNotesError("");
            }}
            error={Boolean(notesError)}
            helperText={notesError}
            placeholder={
              reviewDialog.action === "REJECTED"
                ? "State clear reasons (e.g. invalid tax documentation, prohibited items)..."
                : reviewDialog.action === "MORE_INFORMATION_REQUIRED"
                ? "Specify exact documents or clarifications required from applicant..."
                : reviewDialog.action === "SUSPENDED"
                ? "State policy violation reason for suspension..."
                : "Internal approval notes (optional)..."
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewDialog({ open: false, app: null, action: "" })} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={
              reviewDialog.action === "APPROVED"
                ? "primary"
                : reviewDialog.action === "REJECTED"
                ? "error"
                : reviewDialog.action === "SUSPENDED"
                ? "warning"
                : "info"
            }
            onClick={handleConfirmReview}
            disabled={actionLoading}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Confirm {reviewDialog.action}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

AdminStoreApplications.propTypes = {
  applications: PropTypes.array,
  onReview: PropTypes.func,
  actionLoading: PropTypes.bool,
  statusFilter: PropTypes.string,
  setStatusFilter: PropTypes.func,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func,
  onRefresh: PropTypes.func,
};
