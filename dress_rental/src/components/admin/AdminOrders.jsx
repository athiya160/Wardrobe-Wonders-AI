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
  Grid,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  WarningAmberRounded as WarningIcon,
  CheckCircleOutline as CheckIcon,
  AssignmentReturnOutlined as RefundIcon,
  ReceiptLongOutlined as LedgerIcon,
} from "@mui/icons-material";

export default function AdminOrders({
  orders,
  onConfirmRefund,
  actionLoading,
  statusFilter,
  setStatusFilter,
  onRefresh,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundDialog, setRefundDialog] = useState({ open: false, order: null, notes: "" });

  const getRequestStatusChip = (status) => {
    switch (status) {
      case "Completed":
        return (
          <Chip
            size="small"
            label="Completed"
            sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.72rem" }}
          />
        );
      case "Active":
        return (
          <Chip
            size="small"
            label="Active on Rent"
            sx={{ bgcolor: "#E3F2FD", color: "#0D47A1", fontWeight: 700, fontSize: "0.72rem" }}
          />
        );
      case "Accepted":
        return (
          <Chip
            size="small"
            label="Accepted"
            sx={{ bgcolor: "#F3E5F5", color: "#6A1B9A", fontWeight: 700, fontSize: "0.72rem" }}
          />
        );
      case "Pending":
        return (
          <Chip
            size="small"
            label="Pending Approval"
            sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 700, fontSize: "0.72rem" }}
          />
        );
      case "Cancelled":
      case "Declined":
        return (
          <Chip
            size="small"
            label={status}
            sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700, fontSize: "0.72rem" }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            label={status || "Unknown"}
            sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 700, fontSize: "0.72rem" }}
          />
        );
    }
  };

  const getPaymentAndRefundChip = (order) => {
    const isRefundRequired =
      order.paymentStatus === "REFUND_REQUIRED" ||
      order.refundStatus === "PENDING" ||
      order.depositStatus === "REFUND_PENDING";

    if (order.refundStatus === "SUCCEEDED" || order.paymentStatus === "REFUNDED") {
      return (
        <Chip
          size="small"
          icon={<CheckIcon sx={{ fontSize: "13px !important" }} />}
          label="Refunded"
          sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.72rem" }}
        />
      );
    }

    if (isRefundRequired) {
      return (
        <Chip
          size="small"
          icon={<WarningIcon sx={{ fontSize: "13px !important" }} />}
          label="Refund Attention"
          sx={{
            bgcolor: "#FFEBEE",
            color: "#C62828",
            fontWeight: 800,
            fontSize: "0.72rem",
            border: "1px solid #FFCDD2",
          }}
        />
      );
    }

    if (order.paymentStatus === "PAID") {
      return (
        <Chip
          size="small"
          label={order.paymentMethod === "COD" ? "COD Verified" : "Paid Online"}
          sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.72rem" }}
        />
      );
    }

    return (
      <Chip
        size="small"
        label={order.paymentStatus || "Pending"}
        sx={{ bgcolor: "#FFF8E1", color: "#F57F17", fontWeight: 700, fontSize: "0.72rem" }}
      />
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "refund_attention") {
      return (
        o.paymentStatus === "REFUND_REQUIRED" ||
        o.refundStatus === "PENDING" ||
        o.depositStatus === "REFUND_PENDING"
      );
    }
    return o.requestStatus === statusFilter;
  });

  const handleOpenRefundModal = (order) => {
    setRefundDialog({
      open: true,
      order,
      notes: order.manualRefundNotes || `Confirmed manual refund of ₹${order.totalAmount} for transaction ${order.transactionId || order._id}`,
    });
  };

  const handleConfirmRefundSubmit = async () => {
    if (refundDialog.order) {
      await onConfirmRefund(refundDialog.order._id, refundDialog.notes);
      setRefundDialog({ open: false, order: null, notes: "" });
    }
  };

  const refundAttentionCount = orders.filter(
    (o) =>
      o.paymentStatus === "REFUND_REQUIRED" ||
      o.refundStatus === "PENDING" ||
      o.depositStatus === "REFUND_PENDING"
  ).length;

  return (
    <Stack spacing={3}>
      {/* Ledger Header & Status Selector */}
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
              <LedgerIcon sx={{ color: "#D1A362", fontSize: 24 }} />
              <Typography variant="subtitle1" fontWeight={800} color="#1A1817">
                Marketplace Rental Operations Ledger
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Track rental fees vs escrow security deposits, fulfillment states, and refund finalization.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Order Status</InputLabel>
              <Select
                value={statusFilter}
                label="Order Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Bookings ({orders.length})</MenuItem>
                <MenuItem value="refund_attention">
                  ⚠️ Refund Attention ({refundAttentionCount})
                </MenuItem>
                <MenuItem value="Pending">Pending Approval</MenuItem>
                <MenuItem value="Accepted">Accepted</MenuItem>
                <MenuItem value="Active">Active on Rent</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="Declined">Declined</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh ledger">
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
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Order Ref</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Garment & Atelier</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Renter Contact</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Rental Dates</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>
                Financial Breakdown
                <Typography variant="caption" color="text.secondary" display="block">
                  (Fee + Escrow Deposit)
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Request Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Payment / Refund</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No orders match the selected status filter.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((o) => {
                const rentalFee = Number(o.rentalFee) || Math.max(0, (Number(o.totalAmount) || 0) - (Number(o.securityDeposit) || 0));
                const deposit = Number(o.securityDeposit) || 0;
                const total = Number(o.totalAmount) || rentalFee + deposit;
                const needsRefundAttention =
                  (o.paymentStatus === "REFUND_REQUIRED" || o.refundStatus === "PENDING" || o.depositStatus === "REFUND_PENDING") &&
                  o.refundStatus !== "SUCCEEDED";

                return (
                  <TableRow key={o._id} hover sx={{ bgcolor: needsRefundAttention ? "rgba(255, 235, 238, 0.2)" : "inherit" }}>
                    <TableCell>
                      <Typography variant="caption" fontWeight={800} color="#1A1817" display="block">
                        #{o.transactionId ? o.transactionId.slice(-8).toUpperCase() : o._id.slice(-8).toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          variant="rounded"
                          src={o.product?.image || "/assets/Cocktail Gown.jpg"}
                          sx={{ width: 36, height: 46, borderRadius: 1.5, bgcolor: "#F5F5F5" }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#1A1817">
                            {o.product?.title || o.product?.name || "Garment Piece"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Lender: {o.providerId?.name || "Atelier"}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="#1A1817">
                        {o.userName || o.userEmail?.split("@")[0] || "Customer"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {o.userEmail}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="#1A1817">
                        {o.rentalStartDate ? new Date(o.rentalStartDate).toLocaleDateString() : "—"} &rarr;{" "}
                        {o.rentalEndDate ? new Date(o.rentalEndDate).toLocaleDateString() : "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({o.rentalDays || o.quantity || 1} day duration)
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="#1A1817">
                        ₹{total.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Fee: ₹{rentalFee.toLocaleString()} &bull; Deposit: ₹{deposit.toLocaleString()}
                      </Typography>
                    </TableCell>

                    <TableCell>{getRequestStatusChip(o.requestStatus || o.status)}</TableCell>

                    <TableCell>{getPaymentAndRefundChip(o)}</TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <Tooltip title="Inspect Full Booking Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedOrder(o)}
                            sx={{ border: "1px solid #ECE7DE", borderRadius: 1.5, color: "#1A1817" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {needsRefundAttention && (
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<RefundIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleOpenRefundModal(o)}
                            disabled={actionLoading}
                            sx={{
                              fontWeight: 700,
                              textTransform: "none",
                              fontSize: "0.72rem",
                              borderRadius: 1.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Confirm Refund
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* MOBILE CARDS VIEW */}
      <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
        {filteredOrders.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px solid #ECE7DE" }}>
            <Typography variant="body2" color="text.secondary">
              No orders found matching selected filter.
            </Typography>
          </Paper>
        ) : (
          filteredOrders.map((o) => {
            const rentalFee = Number(o.rentalFee) || Math.max(0, (Number(o.totalAmount) || 0) - (Number(o.securityDeposit) || 0));
            const deposit = Number(o.securityDeposit) || 0;
            const total = Number(o.totalAmount) || rentalFee + deposit;
            const needsRefundAttention =
              (o.paymentStatus === "REFUND_REQUIRED" || o.refundStatus === "PENDING" || o.depositStatus === "REFUND_PENDING") &&
              o.refundStatus !== "SUCCEEDED";

            return (
              <Card
                key={o._id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: needsRefundAttention ? "1px solid #FFCDD2" : "1px solid #ECE7DE",
                  bgcolor: needsRefundAttention ? "#FFFBFA" : "#FFFFFF",
                }}
              >
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Box>
                      <Typography variant="caption" fontWeight={800} color="#1A1817" display="block">
                        #{o.transactionId ? o.transactionId.slice(-8).toUpperCase() : o._id.slice(-8).toUpperCase()}
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="#1A1817">
                        {o.product?.title || o.product?.name || "Garment Piece"}
                      </Typography>
                    </Box>
                    <Box>{getRequestStatusChip(o.requestStatus || o.status)}</Box>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Renter: {o.userEmail}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Dates: {o.rentalStartDate ? new Date(o.rentalStartDate).toLocaleDateString() : "—"} &rarr;{" "}
                    {o.rentalEndDate ? new Date(o.rentalEndDate).toLocaleDateString() : "—"} ({o.rentalDays || o.quantity || 1}d)
                  </Typography>

                  <Divider sx={{ my: 1.5, borderColor: "#F0EAE1" }} />

                  {/* Financial Breakdown Pill */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#FAF8F5",
                      border: "1px solid #EBE5DB",
                      mb: 1.5,
                    }}
                  >
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Rental Fee
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          ₹{rentalFee.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Deposit
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#D1A362">
                          ₹{deposit.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Paid
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>
                          ₹{total.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>{getPaymentAndRefundChip(o)}</Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedOrder(o)}
                        sx={{
                          color: "#1A1817",
                          borderColor: "#ECE7DE",
                          textTransform: "none",
                          borderRadius: 2,
                          fontSize: "0.75rem",
                        }}
                      >
                        Inspect
                      </Button>
                      {needsRefundAttention && (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleOpenRefundModal(o)}
                          disabled={actionLoading}
                          sx={{
                            fontWeight: 700,
                            textTransform: "none",
                            borderRadius: 2,
                            fontSize: "0.75rem",
                          }}
                        >
                          Refund
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })
        )}
      </Stack>

      {/* ORDER INSPECTION MODAL */}
      <Dialog
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", pb: 1 }}>
          Booking & Escrow Ledger Detail
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">Order & Transaction ID</Typography>
                <Typography variant="body2" fontWeight={700}>
                  ID: {selectedOrder._id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gateway Ref: {selectedOrder.transactionId || "N/A (Cash On Delivery or Pending)"}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Customer / Renter</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedOrder.userName || "Customer"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {selectedOrder.userEmail}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedOrder.userPhone || "No phone provided"}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Lender / Atelier</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedOrder.providerId?.name || "Curated Atelier"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {selectedOrder.providerId?.email || "curated@wardrobewonders.com"}
                  </Typography>
                </Grid>
              </Grid>

              <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight={700}>
                  Financial Accounting Breakdown
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Net Rental Fee</Typography>
                    <Typography variant="body1" fontWeight={700}>
                      ₹{(selectedOrder.rentalFee || Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.securityDeposit || 0))).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Escrow Security Deposit</Typography>
                    <Typography variant="body1" fontWeight={700} color="#D1A362">
                      ₹{(selectedOrder.securityDeposit || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Total Amount Paid</Typography>
                    <Typography variant="body1" fontWeight={800} color="#1A1817">
                      ₹{(selectedOrder.totalAmount || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                  <Box sx={{ mt: 0.5 }}>{getPaymentAndRefundChip(selectedOrder)}</Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Fulfillment Status</Typography>
                  <Box sx={{ mt: 0.5 }}>{getRequestStatusChip(selectedOrder.requestStatus || selectedOrder.status)}</Box>
                </Grid>
              </Grid>

              {selectedOrder.manualRefundNotes && (
                <Box sx={{ p: 1.5, bgcolor: "#FFF8E1", borderRadius: 2, border: "1px solid #FFE082" }}>
                  <Typography variant="caption" fontWeight={700} color="#B78103" display="block">
                    Manual Refund Audit Trail:
                  </Typography>
                  <Typography variant="body2" color="#5D4037">
                    {selectedOrder.manualRefundNotes}
                  </Typography>
                  {selectedOrder.refundCompletedAt && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Completed: {new Date(selectedOrder.refundCompletedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setSelectedOrder(null)}
            sx={{ color: "#1A1817", fontWeight: 700, textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM MANUAL REFUND MODAL */}
      <Dialog
        open={refundDialog.open}
        onClose={() => setRefundDialog({ open: false, order: null, notes: "" })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Confirm Manual Refund Finalization
        </DialogTitle>
        <DialogContent dividers>
          {refundDialog.order && (
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, bgcolor: "#FFEBEE", borderRadius: 2, border: "1px solid #FFCDD2" }}>
                <Typography variant="subtitle2" fontWeight={800} color="#C62828">
                  Authorizing Refund of ₹{Number(refundDialog.order.totalAmount || 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="#721C24" display="block">
                  Order Ref: #{refundDialog.order.transactionId || refundDialog.order._id} &bull; Customer: {refundDialog.order.userEmail}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                This action records that the refund has been completed via the banking gateway or provider escrow, sets the order state to <strong>REFUNDED</strong>, and finalizes the financial audit ledger.
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Admin Audit Notes & Bank Transfer Reference"
                placeholder="e.g. PhonePe gateway refund processed via merchant portal, UTR ref #123456789"
                value={refundDialog.notes}
                onChange={(e) => setRefundDialog({ ...refundDialog, notes: e.target.value })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setRefundDialog({ open: false, order: null, notes: "" })}
            sx={{ color: "#666", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRefundSubmit}
            disabled={actionLoading}
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
          >
            Finalize Refund
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

AdminOrders.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      transactionId: PropTypes.string,
      userId: PropTypes.string,
      userEmail: PropTypes.string,
      userName: PropTypes.string,
      userPhone: PropTypes.string,
      rentalStartDate: PropTypes.string,
      rentalEndDate: PropTypes.string,
      rentalDays: PropTypes.number,
      quantity: PropTypes.number,
      rentalFee: PropTypes.number,
      securityDeposit: PropTypes.number,
      totalAmount: PropTypes.number,
      paymentStatus: PropTypes.string,
      paymentMethod: PropTypes.string,
      refundStatus: PropTypes.string,
      refundCompletedAt: PropTypes.string,
      manualRefundNotes: PropTypes.string,
      requestStatus: PropTypes.string,
      depositStatus: PropTypes.string,
      orderDate: PropTypes.string,
      product: PropTypes.shape({
        _id: PropTypes.string,
        title: PropTypes.string,
        name: PropTypes.string,
        image: PropTypes.string,
      }),
      providerId: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string,
      }),
    })
  ).isRequired,
  onConfirmRefund: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
