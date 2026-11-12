import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  LocalShippingOutlined as ShippingIcon,
  SearchOutlined as SearchIcon,
  CheckCircleOutline as SuccessIcon,
  HourglassEmptyOutlined as PendingIcon,
  CancelOutlined as FailedIcon,
  InfoOutlined as InfoIcon,
  StorefrontOutlined as StoreIcon,
  OpenInNewOutlined as OpenInNewIcon,
  WarningAmberOutlined as DelayedIcon,
  RefreshOutlined as RefreshIcon,
  AdminPanelSettingsOutlined as AdminIcon,
} from "@mui/icons-material";
import axios from "axios";
import { BASE_URL } from "../../config/axiosConfig";

export default function AdminStoreFulfilments() {
  const token = localStorage.getItem("token");

  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [delayedOnly, setDelayedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Modals
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [orderToOverride, setOrderToOverride] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    status: "",
    reason: "",
    courierName: "",
    trackingNumber: "",
    trackingUrl: "",
    deliveryConfirmationNote: "",
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [metricsRes, ordersRes] = await Promise.all([
        axios.get(`${BASE_URL}/admin/store/fulfilments/metrics`, authHeaders),
        axios.get(`${BASE_URL}/admin/store/fulfilments`, {
          ...authHeaders,
          params: {
            status: statusFilter || undefined,
            delayedOnly: delayedOnly ? "true" : undefined,
            search: searchTerm || undefined,
            page,
            limit: 50,
          },
        }),
      ]);

      if (metricsRes.data?.success) {
        setMetrics(metricsRes.data.metrics);
      }
      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.orders || []);
        setTotal(ordersRes.data.total || 0);
      }
    } catch (err) {
      console.error("Fetch admin fulfilments error:", err);
      setError(err.response?.data?.message || "Failed to load store fulfilments.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, delayedOnly, searchTerm, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenTimeline = (order) => {
    setSelectedOrder(order);
    setTimelineModalOpen(true);
  };

  const handleOpenOverride = (order) => {
    setOrderToOverride(order);
    setOverrideForm({
      status: order.status === "DISPATCHED" ? "SHIPPED" : order.status,
      reason: "",
      courierName: order.dispatchDetails?.courierName || "",
      trackingNumber: order.dispatchDetails?.trackingNumber || "",
      trackingUrl: order.dispatchDetails?.trackingUrl || "",
      deliveryConfirmationNote: "",
    });
    setOverrideModalOpen(true);
  };

  const handleSubmitOverride = async () => {
    if (!overrideForm.status) {
      setError("Target status is required.");
      return;
    }
    if (!overrideForm.reason.trim()) {
      setError("Audit reason is required for administrative status override.");
      return;
    }

    setOverrideSubmitting(true);
    setError("");
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/store/fulfilments/${orderToOverride._id}/status`,
        overrideForm,
        authHeaders
      );

      if (res.data?.success) {
        setSuccessMsg(res.data.message || "Fulfilment order updated successfully.");
        setOverrideModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Admin status override error:", err);
      setError(err.response?.data?.message || "Failed to update fulfilment order status.");
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "ORDER_PLACED":
        return <Chip label="ORDER PLACED" size="small" sx={{ bgcolor: "#E3F2FD", color: "#1565C0", fontWeight: 700 }} />;
      case "CONFIRMED":
        return <Chip label="CONFIRMED" size="small" sx={{ bgcolor: "#EDE7F6", color: "#512DA8", fontWeight: 700 }} />;
      case "PROCESSING":
        return <Chip label="PROCESSING" size="small" sx={{ bgcolor: "#FFF8E1", color: "#F57F17", fontWeight: 700 }} />;
      case "SHIPPED":
      case "DISPATCHED":
        return <Chip label="SHIPPED" size="small" sx={{ bgcolor: "#E0F2F1", color: "#00796B", fontWeight: 700 }} />;
      case "DELIVERED":
        return <Chip label="DELIVERED" size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }} />;
      case "CANCELLED":
        return <Chip label="CANCELLED" size="small" sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700 }} />;
      default:
        return <Chip label={status || "PENDING"} size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  return (
    <Box sx={{ width: "100%", p: 1 }}>
      {/* Feedback Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg("")} sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      {/* Header & Refresh */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817" }}>
            Store Deliveries & Multi-Vendor Fulfilments
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Monitor boutique dispatches, courier tracking, SLAs, and order delivery status across all sellers.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
          sx={{ borderColor: "#D1A362", color: "#1A1817", textTransform: "none", fontWeight: 700 }}
        >
          Refresh Data
        </Button>
      </Stack>

      {/* KPI Cards Banner */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              TOTAL SHIPMENTS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", mt: 0.5 }}>
              {metrics?.totalFulfilments ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Across all boutiques
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              AWAITING CONFIRMATION
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1565C0", mt: 0.5 }}>
              {metrics?.awaitingConfirmation ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Needs seller acceptance
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              IN PROCESSING
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#F57F17", mt: 0.5 }}>
              {metrics?.inProcessing ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Packaging & prep
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              IN TRANSIT / SHIPPED
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#00796B", mt: 0.5 }}>
              {metrics?.inTransit ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              With courier partner
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              DELIVERED
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#2E7D32", mt: 0.5 }}>
              {metrics?.delivered ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Successfully received
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: metrics?.delayedOrders > 0 ? "1px solid #D32F2F" : "1px solid #ECE7DE",
              bgcolor: metrics?.delayedOrders > 0 ? "#FFEBEE" : "#FFFFFF",
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <DelayedIcon sx={{ fontSize: 16, color: metrics?.delayedOrders > 0 ? "#D32F2F" : "text.secondary" }} />
              <Typography variant="caption" sx={{ color: metrics?.delayedOrders > 0 ? "#D32F2F" : "text.secondary", fontWeight: 700 }}>
                DELAYED (&gt;48H)
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, color: metrics?.delayedOrders > 0 ? "#D32F2F" : "#1A1817", mt: 0.5 }}>
              {metrics?.delayedOrders ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Undispatched SLA risk
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Fulfilment #, Order #, Courier, Tracking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ORDER_PLACED">Order Placed</MenuItem>
              <MenuItem value="CONFIRMED">Confirmed</MenuItem>
              <MenuItem value="PROCESSING">Processing</MenuItem>
              <MenuItem value="SHIPPED">Shipped / Dispatched</MenuItem>
              <MenuItem value="DELIVERED">Delivered</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={3} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={delayedOnly}
                  onChange={(e) => setDelayedOnly(e.target.checked)}
                  color="error"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Delayed Orders Only
                </Typography>
              }
            />
          </Grid>

          <Grid item xs={12} sm={2} md={2} sx={{ textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              Showing {orders.length} of {total} orders
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #ECE7DE", overflow: "hidden", bgcolor: "#FFFFFF" }}>
        {loading ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading store fulfilment orders...
            </Typography>
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <ShippingIcon sx={{ fontSize: 48, color: "#ECE7DE", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817" }}>
              No fulfilment orders found
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Adjust search query or filter options above.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ bgcolor: "#FAF8F5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Fulfilment / Order #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Boutique Store</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer / Address</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Courier & Tracking</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      {o.fulfilmentOrderNumber}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      Parent: #{o.parentOrderNumber}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StoreIcon sx={{ fontSize: 18, color: "#D1A362" }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {o.storeName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Seller: {o.sellerId?.email || "Seller"}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {o.deliveryAddress?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {o.deliveryAddress?.city}, {o.deliveryAddress?.state} — {o.deliveryAddress?.pincode}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {o.items?.length || 0} item{(o.items?.length || 0) > 1 ? "s" : ""}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", maxWidth: 160 }} noWrap>
                      {o.items?.map((it) => it.title).join(", ")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      ₹{o.totalAmount?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      Shipping: ₹{o.shippingFee}
                    </Typography>
                  </TableCell>

                  <TableCell>{getStatusChip(o.status)}</TableCell>

                  <TableCell>
                    {o.dispatchDetails?.trackingNumber ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {o.dispatchDetails.courierName || "Courier"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          AWB: {o.dispatchDetails.trackingNumber}
                        </Typography>
                        {o.dispatchDetails.trackingUrl && (
                          <Button
                            component="a"
                            href={o.dispatchDetails.trackingUrl}
                            target="_blank"
                            size="small"
                            sx={{ p: 0, minWidth: "auto", display: "block", fontSize: "0.75rem", textTransform: "none", color: "#D1A362" }}
                          >
                            Live Tracking ↗
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                        Not yet dispatched
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ textAlign: "right" }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenTimeline(o)}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5, borderColor: "#ECE7DE", color: "#1A1817" }}
                      >
                        Timeline
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleOpenOverride(o)}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5, bgcolor: "#1A1817", color: "#D1A362", "&:hover": { bgcolor: "#2C2825" } }}
                      >
                        Override
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Modal 1: Audit Timeline & Order Detail Modal */}
      <Dialog
        open={timelineModalOpen}
        onClose={() => setTimelineModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Fulfilment #{selectedOrder?.fulfilmentOrderNumber} — Audit & Timeline
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {selectedOrder && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF9F7", borderRadius: 2, border: "1px solid #ECE7DE" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 1 }}>
                      Delivery Address
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                      <strong>{selectedOrder.deliveryAddress?.name}</strong><br />
                      {selectedOrder.deliveryAddress?.street}<br />
                      {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} — {selectedOrder.deliveryAddress?.pincode}<br />
                      Phone: +91 {selectedOrder.deliveryAddress?.phone}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF9F7", borderRadius: 2, border: "1px solid #ECE7DE" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 1 }}>
                      Shipment Details
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                      Status: <strong>{selectedOrder.status}</strong><br />
                      Courier: <strong>{selectedOrder.dispatchDetails?.courierName || "None"}</strong><br />
                      AWB / Tracking: <strong>{selectedOrder.dispatchDetails?.trackingNumber || "None"}</strong><br />
                      {selectedOrder.dispatchDetails?.dispatchedAt && (
                        <span>Dispatched: {new Date(selectedOrder.dispatchDetails.dispatchedAt).toLocaleString()}<br /></span>
                      )}
                      {selectedOrder.dispatchDetails?.deliveredAt && (
                        <span>Delivered: {new Date(selectedOrder.dispatchDetails.deliveredAt).toLocaleString()}<br /></span>
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Status Audit History Log */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817", mb: 1.5 }}>
                  State Transition History & Audit Log
                </Typography>
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                  <Stack spacing={1.5}>
                    {selectedOrder.statusHistory.map((h, hIdx) => (
                      <Paper
                        key={hIdx}
                        elevation={0}
                        sx={{ p: 1.5, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center">
                            {getStatusChip(h.status)}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                              By: {h.changedByName || h.role} ({h.role})
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {new Date(h.changedAt).toLocaleString("en-IN")}
                          </Typography>
                        </Stack>
                        {h.note && (
                          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
                            {h.note}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                    No audit records logged yet.
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTimelineModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 2: Admin Status Override Modal */}
      <Dialog
        open={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Admin Status Override — #{orderToOverride?.fulfilmentOrderNumber}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            Administrative status modifications are permanently recorded in the immutable audit log. An explicit justification note is mandatory.
          </Alert>

          <Stack spacing={2.5}>
            <TextField
              select
              fullWidth
              label="New Fulfilment Status"
              value={overrideForm.status}
              onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })}
              required
            >
              <MenuItem value="ORDER_PLACED">ORDER_PLACED (Order received by boutique)</MenuItem>
              <MenuItem value="CONFIRMED">CONFIRMED (Accepted by boutique)</MenuItem>
              <MenuItem value="PROCESSING">PROCESSING (In packaging)</MenuItem>
              <MenuItem value="SHIPPED">SHIPPED (In transit with courier)</MenuItem>
              <MenuItem value="DELIVERED">DELIVERED (Successfully delivered)</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED (Revoked / Cancelled)</MenuItem>
            </TextField>

            {overrideForm.status === "SHIPPED" && (
              <>
                <TextField
                  fullWidth
                  label="Courier Partner Name"
                  placeholder="e.g. Blue Dart, Delhivery, DTDC"
                  value={overrideForm.courierName}
                  onChange={(e) => setOverrideForm({ ...overrideForm, courierName: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="AWB / Tracking Number"
                  placeholder="e.g. BD123456789IN"
                  value={overrideForm.trackingNumber}
                  onChange={(e) => setOverrideForm({ ...overrideForm, trackingNumber: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Custom Tracking URL (Optional)"
                  placeholder="https://..."
                  value={overrideForm.trackingUrl}
                  onChange={(e) => setOverrideForm({ ...overrideForm, trackingUrl: e.target.value })}
                />
              </>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Mandatory Audit Reason / Note"
              placeholder="Explain the reason for this administrative intervention..."
              value={overrideForm.reason}
              onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOverrideModalOpen(false)} sx={{ fontWeight: 700, color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitOverride}
            disabled={overrideSubmitting || !overrideForm.reason.trim()}
            sx={{
              bgcolor: "#1A1817",
              color: "#D1A362",
              fontWeight: 700,
              textTransform: "none",
              px: 3,
              "&:hover": { bgcolor: "#2C2825" },
            }}
          >
            {overrideSubmitting ? <CircularProgress size={20} color="inherit" /> : "Confirm Override"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
