import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
} from "@mui/material";
import {
  MonetizationOnOutlined as MoneyIcon,
  ReceiptLongOutlined as LedgerIcon,
  AccountBalanceOutlined as BalanceIcon,
  LocalShippingOutlined as ShippingIcon,
  ReplayOutlined as RefundIcon,
  SearchOutlined as SearchIcon,
  CheckCircleOutline as SuccessIcon,
  HourglassEmptyOutlined as PendingIcon,
  CancelOutlined as FailedIcon,
  InfoOutlined as InfoIcon,
  ShieldOutlined as ShieldIcon,
} from "@mui/icons-material";
import axios from "axios";
import { BASE_URL } from "../../config/axiosConfig";

export default function AdminStoreFinances() {
  const token = localStorage.getItem("token");

  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter States
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("");

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const fetchFinancialData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Overview
      const overviewRes = await axios.get(`${BASE_URL}/admin/store/finances/overview`, { headers });
      if (overviewRes.data?.success) {
        setOverview(overviewRes.data.overview);
      }

      // 2. Payments
      const paymentsRes = await axios.get(`${BASE_URL}/admin/store/finances/payments`, {
        headers,
        params: {
          status: paymentStatusFilter || undefined,
          search: paymentSearch || undefined,
          limit: 30,
        },
      });
      if (paymentsRes.data?.success) {
        setPayments(paymentsRes.data.payments || []);
      }

      // 3. Ledger
      const ledgerRes = await axios.get(`${BASE_URL}/admin/store/finances/ledger`, {
        headers,
        params: {
          type: ledgerTypeFilter || undefined,
          limit: 30,
        },
      });
      if (ledgerRes.data?.success) {
        setLedger(ledgerRes.data.entries || []);
      }

      // 4. Refunds
      const refundsRes = await axios.get(`${BASE_URL}/admin/store/finances/refunds`, {
        headers,
        params: { limit: 20 },
      });
      if (refundsRes.data?.success) {
        setRefunds(refundsRes.data.refunds || []);
      }
    } catch (err) {
      console.error("Fetch financial data error:", err);
      setError(err.response?.data?.message || "Failed to load financial data.");
    } finally {
      setLoading(false);
    }
  }, [token, paymentStatusFilter, paymentSearch, ledgerTypeFilter]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const handleOpenRefundModal = (payment) => {
    setSelectedOrder(payment);
    setRefundAmount(payment.amount ? String(payment.amount) : "");
    setRefundReason("");
    setRefundModalOpen(true);
  };

  const handleInitiateRefund = async () => {
    if (!selectedOrder || !refundAmount || !refundReason.trim()) {
      setError("Please specify a valid refund amount and reason.");
      return;
    }

    setRefundSubmitting(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${BASE_URL}/admin/store/refunds/initiate`,
        {
          parentOrderId: selectedOrder.parentOrderId?._id || selectedOrder.parentOrderId,
          amount: Number(refundAmount),
          reason: refundReason.trim(),
          idempotencyKey: `ADMIN-RFND-${selectedOrder._id}-${Date.now()}`,
        },
        { headers }
      );

      if (res.data?.success) {
        setSuccessMsg(`Refund of ₹${refundAmount} recorded successfully.`);
        setRefundModalOpen(false);
        fetchFinancialData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate refund.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "SUCCESS":
      case "SUCCEEDED":
      case "PAID":
        return <Chip icon={<SuccessIcon sx={{ fontSize: 14 }} />} label="Success" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case "PENDING":
      case "INITIATED":
      case "REQUESTED":
        return <Chip icon={<PendingIcon sx={{ fontSize: 14 }} />} label={status} color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case "FAILED":
      case "CANCELLED":
        return <Chip icon={<FailedIcon sx={{ fontSize: 14 }} />} label={status} color="error" size="small" sx={{ fontWeight: 700 }} />;
      case "PARTIALLY_REFUNDED":
      case "REFUNDED":
        return <Chip icon={<RefundIcon sx={{ fontSize: 14 }} />} label={status} color="info" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading && !overview) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress sx={{ color: "#D1A362", mb: 2 }} />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Loading Store Financial Health & Ledgers...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Notifications */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      )}

      {/* Internal Ledger Safety Disclaimer */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 2,
          border: "1px solid #D1A362",
          bgcolor: "#FAF8F5",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <ShieldIcon sx={{ color: "#B8860B", fontSize: 28 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
            Store Financial Ledger & PhonePe Sandbox Integration
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            All seller payable amounts represent internal ledger accounting records. Real-money bank settlement and automated payouts are strictly disabled.
          </Typography>
        </Box>
      </Paper>

      {/* Financial KPIs */}
      {overview && (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                GROSS STORE SALES
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817", mt: 0.5 }}>
                ₹{Number(overview.grossStoreSales || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Total fulfilled volume
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                PLATFORM COMMISSION
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#2E7D32", mt: 0.5 }}>
                ₹{Number(overview.platformCommissionEarned || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Marketplace revenue
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                SHIPPING COLLECTED
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0288D1", mt: 0.5 }}>
                ₹{Number(overview.shippingFeesCollected || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                100% courier pass-through
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                TOTAL REFUNDS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#D32F2F", mt: 0.5 }}>
                ₹{Number(overview.totalRefundsProcessed || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Processed adjustments
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                SELLER PAYABLE BALANCES
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#B8860B", mt: 0.5 }}>
                ₹{Number(overview.totalSellerPayableBalance || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Internal ledger balances
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* SECTION 1: Store Payments Overview & Refund Initiation */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>
              Store Payment Transactions
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              PhonePe sandbox sessions, payment confirmations, and administrative refund controls
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Search order or txn ID..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchFinancialData()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 220 }}
            />

            <TextField
              select
              size="small"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              sx={{ width: 130 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="SUCCESS">Success</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
              <MenuItem value="REFUNDED">Refunded</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              size="small"
              onClick={fetchFinancialData}
              sx={{ borderColor: "#ECE7DE", color: "#1A1817", fontWeight: 700 }}
            >
              Filter
            </Button>
          </Stack>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#FAF8F5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Initiated At</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                  No Store payments recorded matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p._id} hover>
                  <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>{p.orderNumber}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.customerId?.name || "Customer"}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{p.customerId?.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                      {p.merchantTransactionId}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>₹{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>{getStatusChip(p.status)}</TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                    {p.initiatedAt ? new Date(p.initiatedAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell align="right">
                    {p.status === "SUCCESS" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleOpenRefundModal(p)}
                        sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "none" }}
                      >
                        Refund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* SECTION 2: Immutable Store Financial Ledger Audit Trail */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>
              Immutable Financial Ledger Audit Trail
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Double-entry accounting entries for sales, commissions, shipping pass-throughs, and refund reversals
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              select
              size="small"
              value={ledgerTypeFilter}
              onChange={(e) => setLedgerTypeFilter(e.target.value)}
              sx={{ width: 180 }}
            >
              <MenuItem value="">All Entry Types</MenuItem>
              <MenuItem value="SALE">SALE (Item Credit)</MenuItem>
              <MenuItem value="COMMISSION">COMMISSION (Debit)</MenuItem>
              <MenuItem value="SHIPPING">SHIPPING (Pass-Through)</MenuItem>
              <MenuItem value="REFUND">REFUND (Reversal)</MenuItem>
              <MenuItem value="COMMISSION_REVERSAL">COMMISSION_REVERSAL</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              size="small"
              onClick={fetchFinancialData}
              sx={{ borderColor: "#ECE7DE", color: "#1A1817", fontWeight: 700 }}
            >
              Filter
            </Button>
          </Stack>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#FAF8F5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Entry ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Order / Fulfilment #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Seller / Store</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Direction</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Seller Impact</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ledger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                  No ledger entries recorded yet. Complete test orders to generate ledger entries.
                </TableCell>
              </TableRow>
            ) : (
              ledger.map((entry) => (
                <TableRow key={entry._id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "text.secondary" }}>
                    {entry.entryId}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.type}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        bgcolor:
                          entry.type === "SALE"
                            ? "#E8F5E9"
                            : entry.type === "COMMISSION"
                            ? "#FFF3E0"
                            : entry.type === "REFUND"
                            ? "#FFEBEE"
                            : "#E1F5FE",
                        color:
                          entry.type === "SALE"
                            ? "#2E7D32"
                            : entry.type === "COMMISSION"
                            ? "#E65100"
                            : entry.type === "REFUND"
                            ? "#C62828"
                            : "#0277BD",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.parentOrderNumber}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{entry.fulfilmentOrderNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.storeId?.storeName || "Store"}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{entry.sellerId?.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: entry.direction === "CREDIT" ? "#2E7D32" : "#C62828",
                      }}
                    >
                      {entry.direction}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>₹{Number(entry.amount).toLocaleString()}</TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: entry.netSellerImpact >= 0 ? "#2E7D32" : "#C62828",
                    }}
                  >
                    {entry.netSellerImpact >= 0 ? `+₹${entry.netSellerImpact}` : `-₹${Math.abs(entry.netSellerImpact)}`}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* SECTION 3: Refund Records */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #ECE7DE", bgcolor: "#FFFFFF" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif', mb: 2 }}>
          Store Refund Records
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#FAF8F5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Refund ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Requested By</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Processed At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {refunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
                  No refunds initiated.
                </TableCell>
              </TableRow>
            ) : (
              refunds.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{r.refundId}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{r.parentOrderNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#C62828" }}>₹{Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell>{getStatusChip(r.status)}</TableCell>
                  <TableCell>{r.requestedBy?.name || "Admin"}</TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                    {r.processedAt ? new Date(r.processedAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Refund Initiation Dialog */}
      <Dialog open={refundModalOpen} onClose={() => setRefundModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>
          Initiate Store Refund
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 1.5, border: "1px solid #ECE7DE" }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Order: {selectedOrder.orderNumber}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  Original Paid Amount: ₹{Number(selectedOrder.amount).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  Merchant Txn: {selectedOrder.merchantTransactionId}
                </Typography>
              </Box>

              <TextField
                label="Refund Amount (₹)"
                type="number"
                fullWidth
                size="small"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                helperText="Enter full or partial refund amount (cannot exceed original total)"
              />

              <TextField
                label="Refund Reason"
                fullWidth
                multiline
                rows={3}
                size="small"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g., Customer return, merchant stock defect, duplicate charge..."
              />

              <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
                Initiating this refund will record compensating ledger entries for the seller (reversing merchandise sale & commission). Sandbox provider execution will be logged as pending.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRefundModalOpen(false)} disabled={refundSubmitting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleInitiateRefund}
            variant="contained"
            color="error"
            disabled={refundSubmitting}
            sx={{ fontWeight: 700 }}
          >
            {refundSubmitting ? <CircularProgress size={20} color="inherit" /> : "Confirm Refund"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
