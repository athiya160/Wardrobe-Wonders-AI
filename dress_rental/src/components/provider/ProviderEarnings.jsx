import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function ProviderEarnings({ stats, orders }) {
  const completedOrders = orders.filter((o) => o.requestStatus === "Completed" || o.status === "Completed");
  const activeOrders = orders.filter((o) => o.requestStatus !== "Completed" && o.requestStatus !== "Declined" && o.requestStatus !== "Cancelled");

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            color: "#1A1817",
          }}
        >
          Earnings & Payout Ledger
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Transparent financial ledger tracking your 85% rental earnings, upcoming payouts, and completed settlements.
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Total Earnings Accrued
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1A1817", my: 1 }}>
              ₹{(stats?.totalEarnings || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666" }}>
              Combined completed & ongoing rentals
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Settled / Payable Payouts
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#2E7D32", my: 1 }}>
              ₹{(stats?.payableEarnings || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#2E7D32", fontWeight: 600 }}>
              From {completedOrders.length} completed rental(s)
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: 3,
              border: "1px solid #ECE7DE",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Pending In-Progress Rentals
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#D1A362", my: 1 }}>
              ₹{(stats?.pendingEarnings || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "#8C6D3B", fontWeight: 600 }}>
              From {activeOrders.length} active/confirmed booking(s)
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Truthful Financial Callout */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{
          mb: 4,
          borderRadius: 2.5,
          bgcolor: "#FAF8F5",
          border: "1px solid #ECE7DE",
          color: "#444",
        }}
      >
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          <strong>Revenue Share & Security Guarantee Policy:</strong> Boutique providers receive <strong>85%</strong> of the net garment rental tariff upon successful completion and check-in inspection. The 15% platform commission covers digital storefront hosting, AI fashion concierge matching, and customer service. Refundable customer security deposits are held as temporary damage guarantees and are returned directly to the renter following inspection.
        </Typography>
      </Alert>

      {/* Payout Ledger Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #ECE7DE",
          bgcolor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: "1px solid #ECE7DE" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccountBalanceWalletOutlinedIcon sx={{ color: "#D1A362", fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
              Order Revenue & Settlement Ledger
            </Typography>
          </Stack>
        </Box>

        {orders.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="body1" sx={{ color: "#666" }}>
              No rental transactions recorded yet.
            </Typography>
            <Typography variant="caption" sx={{ color: "#999" }}>
              As customer orders are confirmed and completed, itemized payout records will be logged here.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="provider earnings ledger">
              <TableHead sx={{ bgcolor: "#FBF9F6" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Order ID & Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Garment</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Customer</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Rental Fee</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Your Share (85%)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#1A1817" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => {
                  const fee = Number(order.rentalFee) || Math.max(0, (Number(order.totalAmount) || 0) - (Number(order.securityDeposit) || 0));
                  const share = Math.round(fee * 0.85);
                  const isCompleted = order.requestStatus === "Completed" || order.status === "Completed";
                  const isCancelled = order.requestStatus === "Cancelled" || order.requestStatus === "Declined";

                  return (
                    <TableRow key={order._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                          #{order.transactionId ? order.transactionId.slice(-8).toUpperCase() : order._id?.slice(-8).toUpperCase()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1817" }}>
                          {order.product?.name || order.product?.title || "Garment"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#888" }}>
                          {order.rentalDays || order.quantity || 1} day rental
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#555" }}>
                          {order.userEmail}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ₹{fee.toLocaleString()}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: isCompleted ? "#2E7D32" : isCancelled ? "#9E9E9E" : "#D1A362",
                          }}
                        >
                          {isCancelled ? "₹0 (Cancelled)" : `₹${share.toLocaleString()}`}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={isCompleted ? "Settled" : isCancelled ? "Cancelled" : "Pending Return"}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            bgcolor: isCompleted ? "#E8F5E9" : isCancelled ? "#F5F5F5" : "#FFF8E1",
                            color: isCompleted ? "#2E7D32" : isCancelled ? "#757575" : "#B76E00",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

ProviderEarnings.propTypes = {
  stats: PropTypes.shape({
    totalEarnings: PropTypes.number,
    payableEarnings: PropTypes.number,
    pendingEarnings: PropTypes.number,
  }),
  orders: PropTypes.array.isRequired,
};
