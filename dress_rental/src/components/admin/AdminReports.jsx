import { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
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
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  ReportProblemOutlined as ReportsIcon,
  CheckCircleOutline as ResolvedIcon,
  HelpOutline as PendingIcon,
  GavelOutlined as GavelIcon,
} from "@mui/icons-material";

export default function AdminReports({
  reports,
  onResolveReport,
  actionLoading,
  statusFilter,
  setStatusFilter,
  onRefresh,
}) {
  const [resolveModal, setResolveModal] = useState({
    open: false,
    report: null,
    status: "resolved",
    adminNotes: "",
    deactivateListing: false,
  });

  const getStatusChip = (status) => {
    switch (status) {
      case "resolved":
        return (
          <Chip
            size="small"
            icon={<ResolvedIcon sx={{ fontSize: "14px !important" }} />}
            label="Resolved"
            sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      case "dismissed":
        return (
          <Chip
            size="small"
            label="Dismissed"
            sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            icon={<PendingIcon sx={{ fontSize: "14px !important" }} />}
            label="Pending Review"
            sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 800, fontSize: "0.75rem" }}
          />
        );
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const handleOpenResolve = (rep) => {
    setResolveModal({
      open: true,
      report: rep,
      status: rep.status === "dismissed" ? "dismissed" : "resolved",
      adminNotes: rep.adminNotes || "",
      deactivateListing: false,
    });
  };

  const handleExecuteResolve = async () => {
    if (!resolveModal.report) return;
    await onResolveReport(resolveModal.report._id, {
      status: resolveModal.status,
      adminNotes: resolveModal.adminNotes,
      deactivateListing: resolveModal.deactivateListing,
    });
    setResolveModal({
      open: false,
      report: null,
      status: "resolved",
      adminNotes: "",
      deactivateListing: false,
    });
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <Stack spacing={3}>
      {/* Header & Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid #ECE7DE",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GavelIcon sx={{ color: "#D1A362", fontSize: 24 }} />
              <Typography variant="subtitle1" fontWeight={800} color="#1A1817">
                Trust, Safety & Compliance Disputes
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Review garment quality flags, counterfeit reports, and intellectual property claims.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Disputes ({reports.length})</MenuItem>
                <MenuItem value="pending">
                  ⚠️ Pending Action ({pendingCount})
                </MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="dismissed">Dismissed</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh compliance queue">
              <IconButton
                onClick={onRefresh}
                sx={{ border: "1px solid #ECE7DE", borderRadius: 2 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* DESKTOP TABLE VIEW */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #ECE7DE",
          bgcolor: "#FFFFFF",
          overflow: "hidden",
          display: { xs: "none", md: "block" },
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#FAF8F5" }}>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Reported Garment</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Reporter</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Alleged Issue</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Complaint Details</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }} align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                  <ReportsIcon sx={{ fontSize: 40, color: "#CCC", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No compliance disputes found matching current filter.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        variant="rounded"
                        src={r.listingId?.image || "/assets/Cocktail Gown.jpg"}
                        sx={{ width: 38, height: 50, borderRadius: 1.5, bgcolor: "#F5F5F5" }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="#1A1817">
                          {r.listingId?.title || r.listingId?.name || "Garment Piece"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Brand: {r.listingId?.brand || "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="#1A1817">
                      {r.reporterEmail || "Anonymous"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={r.reason || "Policy Violation"}
                      sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700, fontSize: "0.75rem" }}
                    />
                  </TableCell>

                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.details || "No additional notes provided by reporter."}
                    </Typography>
                  </TableCell>

                  <TableCell>{getStatusChip(r.status)}</TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      <Button
                        size="small"
                        variant={r.status === "pending" ? "contained" : "outlined"}
                        onClick={() => handleOpenResolve(r)}
                        disabled={actionLoading}
                        sx={{
                          bgcolor: r.status === "pending" ? "#1A1817" : "transparent",
                          color: r.status === "pending" ? "#FFFFFF" : "#1A1817",
                          borderColor: "#ECE7DE",
                          fontWeight: 700,
                          textTransform: "none",
                          fontSize: "0.75rem",
                          borderRadius: 1.5,
                          "&:hover": {
                            bgcolor: r.status === "pending" ? "#2C2926" : "#FAF8F5",
                          },
                        }}
                      >
                        {r.status === "pending" ? "Resolve Dispute" : "Edit Resolution"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* MOBILE CARDS VIEW */}
      <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
        {filteredReports.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px solid #ECE7DE" }}>
            <Typography variant="body2" color="text.secondary">
              No disputes found matching current filter.
            </Typography>
          </Paper>
        ) : (
          filteredReports.map((r) => (
            <Card
              key={r._id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: r.status === "pending" ? "1px solid #FFCDD2" : "1px solid #ECE7DE",
                bgcolor: r.status === "pending" ? "#FFFBFA" : "#FFFFFF",
              }}
            >
              <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} color="#1A1817">
                      {r.listingId?.title || r.listingId?.name || "Garment Piece"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reporter: {r.reporterEmail}
                    </Typography>
                  </Box>
                  <Box>{getStatusChip(r.status)}</Box>
                </Stack>

                <Box sx={{ my: 1 }}>
                  <Chip
                    size="small"
                    label={r.reason || "Policy Violation"}
                    sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700, fontSize: "0.75rem" }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
                  {r.details || "No additional commentary provided."}
                </Typography>

                <Divider sx={{ my: 1.5, borderColor: "#F0EAE1" }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                  </Typography>

                  <Button
                    size="small"
                    variant={r.status === "pending" ? "contained" : "outlined"}
                    onClick={() => handleOpenResolve(r)}
                    disabled={actionLoading}
                    sx={{
                      bgcolor: r.status === "pending" ? "#1A1817" : "transparent",
                      color: r.status === "pending" ? "#FFFFFF" : "#1A1817",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: "0.75rem",
                    }}
                  >
                    {r.status === "pending" ? "Resolve Dispute" : "Edit Resolution"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* RESOLUTION DIALOG */}
      <Dialog
        open={resolveModal.open}
        onClose={() =>
          setResolveModal({
            open: false,
            report: null,
            status: "resolved",
            adminNotes: "",
            deactivateListing: false,
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Resolve Trust & Safety Dispute
        </DialogTitle>
        <DialogContent dividers>
          {resolveModal.report && (
            <Stack spacing={2.5}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Target Garment
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} color="#1A1817">
                  {resolveModal.report.listingId?.title || resolveModal.report.listingId?.name || "Garment Piece"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Filed by: {resolveModal.report.reporterEmail} &bull; Reason: <strong>{resolveModal.report.reason}</strong>
                </Typography>
                {resolveModal.report.details && (
                  <Typography variant="body2" sx={{ mt: 1, color: "#444" }}>
                    &ldquo;{resolveModal.report.details}&rdquo;
                  </Typography>
                )}
              </Paper>

              <FormControl fullWidth size="small">
                <InputLabel>Determination</InputLabel>
                <Select
                  value={resolveModal.status}
                  label="Determination"
                  onChange={(e) => setResolveModal({ ...resolveModal, status: e.target.value })}
                >
                  <MenuItem value="resolved">Mark Resolved (Action Taken / Verified)</MenuItem>
                  <MenuItem value="dismissed">Dismiss Complaint (No Violation Found)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Compliance Action Notes & Findings"
                placeholder="Detail the rationale, provider communication, or inspection results..."
                value={resolveModal.adminNotes}
                onChange={(e) => setResolveModal({ ...resolveModal, adminNotes: e.target.value })}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={resolveModal.deactivateListing}
                    onChange={(e) => setResolveModal({ ...resolveModal, deactivateListing: e.target.checked })}
                    color="error"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600} color="#C62828">
                    Deactivate & Unpublish Garment Listing immediately
                  </Typography>
                }
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() =>
              setResolveModal({
                open: false,
                report: null,
                status: "resolved",
                adminNotes: "",
                deactivateListing: false,
              })
            }
            sx={{ color: "#666", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExecuteResolve}
            disabled={actionLoading}
            sx={{
              bgcolor: "#1A1817",
              color: "#FFFFFF",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#2C2926" },
            }}
          >
            Submit Determination
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

AdminReports.propTypes = {
  reports: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      reporterEmail: PropTypes.string,
      reason: PropTypes.string,
      details: PropTypes.string,
      status: PropTypes.string,
      adminNotes: PropTypes.string,
      createdAt: PropTypes.string,
      listingId: PropTypes.shape({
        _id: PropTypes.string,
        title: PropTypes.string,
        name: PropTypes.string,
        image: PropTypes.string,
        brand: PropTypes.string,
      }),
    })
  ).isRequired,
  onResolveReport: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
