import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Button,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Rating,
  Grid,
} from "@mui/material";
import {
  CancelOutlined as CancelIcon,
  AssignmentReturnOutlined as ReturnIcon,
  RateReviewOutlined as ReviewIcon,
  CheckCircleOutline as ApproveIcon,
  HighlightOff as RejectIcon,
  Refresh as RefreshIcon,
  Inventory2Outlined as WarehouseIcon,
} from "@mui/icons-material";
import axios from "axios";
import { BASE_URL } from "../../config/axiosConfig";

export default function AdminStorePostPurchase() {
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [activeTab, setActiveTab] = useState(0); // 0: Cancellations, 1: Returns, 2: Reviews
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Data states
  const [cancellations, setCancellations] = useState([]);
  const [returns, setReturns] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Status Filters
  const [cancellationFilter, setCancellationFilter] = useState("ALL");
  const [returnFilter, setReturnFilter] = useState("ALL");
  const [reviewFilter, setReviewFilter] = useState("ALL");

  // Dialog States
  const [reviewCancelDialog, setReviewCancelDialog] = useState({ open: false, item: null, decision: "APPROVED", reason: "" });
  const [reviewReturnDialog, setReviewReturnDialog] = useState({ open: false, item: null, decision: "APPROVED", reason: "" });
  const [receiveItemDialog, setReceiveItemDialog] = useState({ open: false, item: null, note: "", courierName: "", awb: "" });
  const [moderateReviewDialog, setModerateReviewDialog] = useState({ open: false, item: null, status: "PUBLISHED", notes: "" });

  const fetchCancellations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${BASE_URL}/admin/store/cancellations?status=${cancellationFilter}`,
        authHeaders
      );
      if (res.data?.success) {
        setCancellations(res.data.cancellations || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cancellation requests.");
    } finally {
      setLoading(false);
    }
  }, [cancellationFilter]);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${BASE_URL}/admin/store/returns?status=${returnFilter}`,
        authHeaders
      );
      if (res.data?.success) {
        setReturns(res.data.returns || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load return requests.");
    } finally {
      setLoading(false);
    }
  }, [returnFilter]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${BASE_URL}/admin/store/reviews?status=${reviewFilter}`,
        authHeaders
      );
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load store reviews.");
    } finally {
      setLoading(false);
    }
  }, [reviewFilter]);

  useEffect(() => {
    if (activeTab === 0) fetchCancellations();
    else if (activeTab === 1) fetchReturns();
    else if (activeTab === 2) fetchReviews();
  }, [activeTab, fetchCancellations, fetchReturns, fetchReviews]);

  // Handle Cancellation Review
  const handleReviewCancellation = async () => {
    if (!reviewCancelDialog.reason.trim()) {
      setError("Audit reason is required for cancellation review.");
      return;
    }
    setActionLoading(true);
    try {
      const id = reviewCancelDialog.item._id || reviewCancelDialog.item.cancellationId;
      const res = await axios.put(
        `${BASE_URL}/admin/store/cancellations/${id}/review`,
        {
          decision: reviewCancelDialog.decision,
          reason: reviewCancelDialog.reason.trim(),
        },
        authHeaders
      );
      if (res.data?.success) {
        setSuccessMsg(`Cancellation #${reviewCancelDialog.item.cancellationId} marked as ${reviewCancelDialog.decision}.`);
        setReviewCancelDialog({ open: false, item: null, decision: "APPROVED", reason: "" });
        fetchCancellations();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review cancellation.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Return Review
  const handleReviewReturn = async () => {
    if (!reviewReturnDialog.reason.trim()) {
      setError("Audit reason is required for return review.");
      return;
    }
    setActionLoading(true);
    try {
      const id = reviewReturnDialog.item._id || reviewReturnDialog.item.returnId;
      const res = await axios.put(
        `${BASE_URL}/admin/store/returns/${id}/review`,
        {
          decision: reviewReturnDialog.decision,
          reason: reviewReturnDialog.reason.trim(),
        },
        authHeaders
      );
      if (res.data?.success) {
        setSuccessMsg(`Return #${reviewReturnDialog.item.returnId} marked as ${reviewReturnDialog.decision}.`);
        setReviewReturnDialog({ open: false, item: null, decision: "APPROVED", reason: "" });
        fetchReturns();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review return request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Return Item Receipt
  const handleReceiveReturnItem = async () => {
    setActionLoading(true);
    try {
      const id = receiveItemDialog.item._id || receiveItemDialog.item.returnId;
      const res = await axios.put(
        `${BASE_URL}/admin/store/returns/${id}/receive`,
        {
          returnTracking: {
            courierName: receiveItemDialog.courierName,
            trackingNumber: receiveItemDialog.awb,
          },
          note: receiveItemDialog.note.trim() || "Warehouse return inspection verified.",
        },
        authHeaders
      );
      if (res.data?.success) {
        setSuccessMsg(`Return #${receiveItemDialog.item.returnId} confirmed received. Refund process initiated.`);
        setReceiveItemDialog({ open: false, item: null, note: "", courierName: "", awb: "" });
        fetchReturns();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record return item receipt.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Review Moderation
  const handleModerateReview = async () => {
    setActionLoading(true);
    try {
      const id = moderateReviewDialog.item._id || moderateReviewDialog.item.reviewId;
      const res = await axios.put(
        `${BASE_URL}/admin/store/reviews/${id}/moderate`,
        {
          status: moderateReviewDialog.status,
          moderationNotes: moderateReviewDialog.notes.trim(),
        },
        authHeaders
      );
      if (res.data?.success) {
        setSuccessMsg(`Review updated to ${moderateReviewDialog.status}.`);
        setModerateReviewDialog({ open: false, item: null, status: "PUBLISHED", notes: "" });
        fetchReviews();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to moderate review.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF", mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817", fontFamily: '"Playfair Display", Georgia, serif' }}>
              Store Post-Purchase Operations
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Oversee customer cancellations, multi-seller returns, warehouse item receipts, and verified product reviews.
            </Typography>
          </Box>

          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              if (activeTab === 0) fetchCancellations();
              else if (activeTab === 1) fetchReturns();
              else if (activeTab === 2) fetchReviews();
            }}
            variant="outlined"
            size="small"
            sx={{ borderColor: "#ECE7DE", color: "#1A1817", fontWeight: 700, borderRadius: 2 }}
          >
            Refresh Data
          </Button>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            mt: 2,
            borderBottom: "1px solid #ECE7DE",
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none", fontSize: "0.9rem" },
            "& .Mui-selected": { color: "#D1A362 !important" },
            "& .MuiTabs-indicator": { bgcolor: "#D1A362" },
          }}
        >
          <Tab icon={<CancelIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Cancellations" />
          <Tab icon={<ReturnIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Returns & Refunds" />
          <Tab icon={<ReviewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Product Reviews" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* TAB 0: CANCELLATIONS */}
      {activeTab === 0 && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Cancellation Requests ({cancellations.length})
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={cancellationFilter}
                label="Status Filter"
                onChange={(e) => setCancellationFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="REQUESTED">Requested</MenuItem>
                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <Box textAlign="center" py={4}><CircularProgress size={32} sx={{ color: "#D1A362" }} /></Box>
          ) : cancellations.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No cancellation requests found for this filter.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#FAF9F7" } }}>
                  <TableCell>Request Ref</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Seller / Boutique</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cancellations.map((c) => (
                  <TableRow key={c._id} hover>
                    <TableCell>
                      <strong>{c.cancellationId}</strong>
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        Parent #{c.parentOrderId?.orderNumber || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {c.customerId?.name || "Customer"}<br />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{c.customerId?.email}</Typography>
                    </TableCell>
                    <TableCell>{c.sellerId?.name || "Seller"}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{c.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: c.status === "APPROVED" ? "#E8F5E9" : c.status === "REJECTED" ? "#FFEBEE" : "#FFF8E1",
                          color: c.status === "APPROVED" ? "#2E7D32" : c.status === "REJECTED" ? "#C62828" : "#F57F17",
                        }}
                      />
                    </TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell align="right">
                      {["REQUESTED", "UNDER_REVIEW"].includes(c.status) && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => setReviewCancelDialog({ open: true, item: c, decision: "APPROVED", reason: "" })}
                          sx={{ bgcolor: "#1A1817", color: "#FFF", textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                        >
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* TAB 1: RETURNS & REFUNDS */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Return Requests ({returns.length})
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={returnFilter}
                label="Status Filter"
                onChange={(e) => setReturnFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="REQUESTED">Requested</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="ITEM_RETURNED">Item Returned</MenuItem>
                <MenuItem value="REFUND_PENDING">Refund Pending</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <Box textAlign="center" py={4}><CircularProgress size={32} sx={{ color: "#D1A362" }} /></Box>
          ) : returns.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No return requests found for this filter.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#FAF9F7" } }}>
                  <TableCell>Return Ref</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Refund (₹)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returns.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      <strong>{r.returnId}</strong>
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        Fulfilment #{r.fulfilmentOrderId?.fulfilmentOrderNumber || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.customerId?.name || "Customer"}</TableCell>
                    <TableCell>
                      {(r.items || []).map((it, idx) => (
                        <Typography key={idx} variant="caption" sx={{ display: "block" }}>
                          • {it.title} (x{it.quantity})
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <strong>{r.reason}</strong>
                      {r.description && <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>{r.description}</Typography>}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      ₹{r.requestedRefundAmount?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: r.status === "REFUNDED" || r.status === "APPROVED" ? "#E8F5E9" : r.status === "REJECTED" ? "#FFEBEE" : "#FFF8E1",
                          color: r.status === "REFUNDED" || r.status === "APPROVED" ? "#2E7D32" : r.status === "REJECTED" ? "#C62828" : "#F57F17",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {["REQUESTED", "UNDER_REVIEW"].includes(r.status) && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setReviewReturnDialog({ open: true, item: r, decision: "APPROVED", reason: "" })}
                            sx={{ bgcolor: "#1A1817", color: "#FFF", textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                          >
                            Review
                          </Button>
                        )}
                        {r.status === "APPROVED" && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<WarehouseIcon />}
                            onClick={() => setReceiveItemDialog({ open: true, item: r, note: "", courierName: "", awb: "" })}
                            sx={{ borderColor: "#2E7D32", color: "#2E7D32", textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                          >
                            Item Received
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* TAB 2: REVIEWS */}
      {activeTab === 2 && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Product Reviews ({reviews.length})
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={reviewFilter}
                label="Status Filter"
                onChange={(e) => setReviewFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PUBLISHED">Published</MenuItem>
                <MenuItem value="PENDING_MODERATION">Pending Moderation</MenuItem>
                <MenuItem value="HIDDEN">Hidden</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <Box textAlign="center" py={4}><CircularProgress size={32} sx={{ color: "#D1A362" }} /></Box>
          ) : reviews.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              No reviews found for this filter.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "#FAF9F7" } }}>
                  <TableCell>Product</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Review Title & Comment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((rev) => (
                  <TableRow key={rev._id} hover>
                    <TableCell>
                      <strong>{rev.productId?.title || "Product"}</strong>
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        ₹{rev.productId?.price} • {rev.storeId?.storeName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {rev.customerName || rev.customerId?.name || "Customer"}<br />
                      <Chip label="Verified Purchase" size="small" sx={{ fontSize: "0.65rem", height: 18, bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Rating value={rev.rating} readOnly size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      {rev.title && <strong>{rev.title}<br /></strong>}
                      <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#444" }}>
                        {rev.comment}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rev.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: rev.status === "PUBLISHED" ? "#E8F5E9" : rev.status === "REJECTED" ? "#FFEBEE" : "#FFF8E1",
                          color: rev.status === "PUBLISHED" ? "#2E7D32" : rev.status === "REJECTED" ? "#C62828" : "#F57F17",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setModerateReviewDialog({ open: true, item: rev, status: rev.status, notes: rev.moderationNotes || "" })}
                        sx={{ borderColor: "#ECE7DE", color: "#1A1817", textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                      >
                        Moderate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* DIALOG: REVIEW CANCELLATION */}
      <Dialog
        open={reviewCancelDialog.open}
        onClose={() => !actionLoading && setReviewCancelDialog({ ...reviewCancelDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Review Cancellation Request</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Request Ref: <strong>{reviewCancelDialog.item?.cancellationId}</strong><br />
              Reason provided by customer: <em>"{reviewCancelDialog.item?.reason}"</em>
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Decision</InputLabel>
              <Select
                value={reviewCancelDialog.decision}
                label="Decision"
                onChange={(e) => setReviewCancelDialog({ ...reviewCancelDialog, decision: e.target.value })}
              >
                <MenuItem value="APPROVED">APPROVE Cancellation</MenuItem>
                <MenuItem value="REJECTED">REJECT Cancellation</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mandatory Audit Reason / Note *"
              placeholder="State clear operational reason for approval or rejection..."
              value={reviewCancelDialog.reason}
              onChange={(e) => setReviewCancelDialog({ ...reviewCancelDialog, reason: e.target.value })}
              helperText="This reason will be logged in immutable audit history."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewCancelDialog({ ...reviewCancelDialog, open: false })} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReviewCancellation}
            disabled={actionLoading}
            sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Submit Decision"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: REVIEW RETURN */}
      <Dialog
        open={reviewReturnDialog.open}
        onClose={() => !actionLoading && setReviewReturnDialog({ ...reviewReturnDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Review Return Request</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Return Ref: <strong>{reviewReturnDialog.item?.returnId}</strong><br />
              Reason: <strong>{reviewReturnDialog.item?.reason}</strong><br />
              Description: <em>"{reviewReturnDialog.item?.description}"</em>
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Decision</InputLabel>
              <Select
                value={reviewReturnDialog.decision}
                label="Decision"
                onChange={(e) => setReviewReturnDialog({ ...reviewReturnDialog, decision: e.target.value })}
              >
                <MenuItem value="APPROVED">APPROVE Return</MenuItem>
                <MenuItem value="REJECTED">REJECT Return</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mandatory Audit Reason / Instructions *"
              placeholder="Enter instructions for return shipping or reason for rejection..."
              value={reviewReturnDialog.reason}
              onChange={(e) => setReviewReturnDialog({ ...reviewReturnDialog, reason: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewReturnDialog({ ...reviewReturnDialog, open: false })} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReviewReturn}
            disabled={actionLoading}
            sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Submit Decision"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: LOG RETURN ITEM RECEIVED */}
      <Dialog
        open={receiveItemDialog.open}
        onClose={() => !actionLoading && setReceiveItemDialog({ ...receiveItemDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Return Item Received</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
              Confirming item receipt moves the return to <strong>ITEM_RETURNED</strong> and creates compensating ledger records. In sandbox mode, refund remains safely in <strong>PENDING_PROVIDER</strong> status.
            </Alert>

            <TextField
              fullWidth
              size="small"
              label="Return Courier Name (Optional)"
              placeholder="e.g. Blue Dart, Delhivery"
              value={receiveItemDialog.courierName}
              onChange={(e) => setReceiveItemDialog({ ...receiveItemDialog, courierName: e.target.value })}
            />

            <TextField
              fullWidth
              size="small"
              label="Return Tracking / AWB Number (Optional)"
              placeholder="e.g. RTN12345678"
              value={receiveItemDialog.awb}
              onChange={(e) => setReceiveItemDialog({ ...receiveItemDialog, awb: e.target.value })}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Warehouse Inspection Notes"
              placeholder="e.g. Item received in unworn condition with tags attached."
              value={receiveItemDialog.note}
              onChange={(e) => setReceiveItemDialog({ ...receiveItemDialog, note: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReceiveItemDialog({ ...receiveItemDialog, open: false })} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleReceiveReturnItem}
            disabled={actionLoading}
            sx={{ fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Confirm Receipt & Initiate Refund"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: MODERATE REVIEW */}
      <Dialog
        open={moderateReviewDialog.open}
        onClose={() => !actionLoading && setModerateReviewDialog({ ...moderateReviewDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Moderate Customer Review</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Box>
              <Rating value={moderateReviewDialog.item?.rating || 5} readOnly size="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {moderateReviewDialog.item?.title || "Review"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                "{moderateReviewDialog.item?.comment}"
              </Typography>
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>Moderation Status</InputLabel>
              <Select
                value={moderateReviewDialog.status}
                label="Moderation Status"
                onChange={(e) => setModerateReviewDialog({ ...moderateReviewDialog, status: e.target.value })}
              >
                <MenuItem value="PUBLISHED">PUBLISHED (Visible to all customers)</MenuItem>
                <MenuItem value="PENDING_MODERATION">PENDING MODERATION</MenuItem>
                <MenuItem value="HIDDEN">HIDDEN (Removed from public catalog)</MenuItem>
                <MenuItem value="REJECTED">REJECTED (Violates policy)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Moderation Notes (Optional)"
              placeholder="Reason for hiding or rejecting review..."
              value={moderateReviewDialog.notes}
              onChange={(e) => setModerateReviewDialog({ ...moderateReviewDialog, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModerateReviewDialog({ ...moderateReviewDialog, open: false })} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleModerateReview}
            disabled={actionLoading}
            sx={{ bgcolor: "#1A1817", color: "#FFF", fontWeight: 700 }}
          >
            {actionLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
