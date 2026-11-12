import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  Chip,
  Avatar,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

export default function ProviderRentalRequests({
  orders,
  orderFilter,
  setOrderFilter,
  onAcceptClick,
  onDeclineClick,
  onUpdateStatus,
  actionLoading,
}) {
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "Pending") return o.requestStatus === "Pending";
    if (orderFilter === "Confirmed")
      return o.requestStatus === "Accepted" || o.requestStatus === "Confirmed" || o.status === "Confirmed";
    if (orderFilter === "Active")
      return o.requestStatus === "Active" || o.status === "Delivered";
    if (orderFilter === "Completed")
      return o.requestStatus === "Completed" || o.status === "Completed";
    if (orderFilter === "Declined")
      return o.requestStatus === "Declined" || o.requestStatus === "Cancelled" || o.status === "Cancelled";
    return true;
  });

  const filterTabs = [
    { id: "all", label: `All Requests (${orders.length})` },
    { id: "Pending", label: "Pending Approval" },
    { id: "Confirmed", label: "Confirmed" },
    { id: "Active", label: "Active on Rent" },
    { id: "Completed", label: "Completed" },
    { id: "Declined", label: "Declined / Cancelled" },
  ];

  const statusColors = {
    Pending: { bg: "#FFF4E5", text: "#B76E00" },
    Accepted: { bg: "#EDF7ED", text: "#1E4620" },
    Confirmed: { bg: "#EDF7ED", text: "#1E4620" },
    Declined: { bg: "#FDEDED", text: "#5F2120" },
    Cancelled: { bg: "#FDEDED", text: "#5F2120" },
    Active: { bg: "#E5F6FD", text: "#014361" },
    Completed: { bg: "#E8F5E9", text: "#2E7D32" },
  };

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
          Customer Rental Bookings ({orders.length})
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Review incoming requests, approve date windows, and track dispatch through to return inspection.
        </Typography>
      </Box>

      {/* Filter Tabs */}
      <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1, mb: 3 }}>
        {filterTabs.map((tab) => {
          const selected = orderFilter === tab.id;
          return (
            <Chip
              key={tab.id}
              label={tab.label}
              clickable
              onClick={() => setOrderFilter(tab.id)}
              sx={{
                bgcolor: selected ? "#1A1817" : "#FFFFFF",
                color: selected ? "#D1A362" : "#666",
                border: selected ? "1px solid #1A1817" : "1px solid #ECE7DE",
                fontWeight: selected ? 700 : 500,
                fontSize: "0.8rem",
                borderRadius: 2,
                "&:hover": { bgcolor: selected ? "#1A1817" : "#F5F2EB" },
              }}
            />
          );
        })}
      </Stack>

      {/* Requests List */}
      {filteredOrders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed #ECE7DE",
            bgcolor: "#FFFFFF",
          }}
        >
          <CalendarMonthOutlinedIcon sx={{ fontSize: 50, color: "#D6CEC2", mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1817", mb: 0.5 }}>
            No {orderFilter !== "all" ? orderFilter : ""} rental requests
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            New client reservations and schedule approvals will appear here in real time.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {filteredOrders.map((order) => {
            const prod = order.product || {};
            const sDate = order.rentalStartDate ? new Date(order.rentalStartDate).toLocaleDateString() : "Flexible";
            const eDate = order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString() : "Flexible";
            const reqStatus = order.requestStatus || "Pending";
            const currentStatusColor = statusColors[reqStatus] || statusColors.Pending;
            const rentalFeeOnly = order.rentalFee || Math.max(0, (order.totalAmount || 0) - (order.securityDeposit || 0));
            const netEarningsEstimate = Math.round(rentalFeeOnly * 0.85);

            return (
              <Paper
                key={order._id}
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  border: "1px solid #ECE7DE",
                  bgcolor: "#FFFFFF",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <Grid container spacing={2.5} alignItems="center">
                  {/* Outfit Preview */}
                  <Grid item xs={12} sm={3} md={2}>
                    <Avatar
                      src={prod.image || "/assets/Cocktail Gown.jpg"}
                      variant="rounded"
                      sx={{
                        width: "100%",
                        height: 110,
                        borderRadius: 2,
                        border: "1px solid #ECE7DE",
                        bgcolor: "#F7F5F2",
                      }}
                    />
                  </Grid>

                  {/* Customer & Window Info */}
                  <Grid item xs={12} sm={5} md={6}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontWeight: 700,
                        color: "#1A1817",
                        mb: 0.5,
                      }}
                    >
                      {prod.title || prod.name || "Designer Garment"}
                    </Typography>

                    <Typography variant="caption" sx={{ color: "#777", display: "block", mb: 1 }}>
                      Renter: <strong>{order.userEmail}</strong> &bull; Order #{order.transactionId ? order.transactionId.slice(-8).toUpperCase() : order._id?.slice(-8).toUpperCase()}
                    </Typography>

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        bgcolor: "#FAF8F5",
                        borderColor: "#ECE7DE",
                        display: "inline-block",
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#8C6D3B", display: "block" }}>
                        RENTAL WINDOW ({order.rentalDays || order.quantity || 1} DAYS)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1817" }}>
                        {sDate} &rarr; {eDate}
                      </Typography>
                    </Paper>

                    {/* Decline Reason Callout */}
                    {order.declineReason && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#D32F2F",
                          bgcolor: "#FDEDED",
                          px: 1,
                          py: 0.4,
                          borderRadius: 1,
                          display: "inline-block",
                          mt: 1,
                          fontWeight: 600,
                        }}
                      >
                        Decline Reason: {order.declineReason}
                      </Typography>
                    )}

                    {/* Inspection Notes Callout */}
                    {order.inspectionNotes && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#2E7D32",
                          bgcolor: "#E8F5E9",
                          px: 1,
                          py: 0.4,
                          borderRadius: 1,
                          display: "inline-block",
                          mt: 1,
                          fontWeight: 600,
                        }}
                      >
                        Inspection: {order.inspectionNotes}
                      </Typography>
                    )}
                  </Grid>

                  {/* Pricing & Decision Actions */}
                  <Grid item xs={12} sm={4} md={4}>
                    <Box sx={{ textAlign: { xs: "left", sm: "right" }, mb: 2 }}>
                      <Typography variant="caption" sx={{ color: "#888", display: "block" }}>
                        CUSTOMER TOTAL
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                        ₹{order.totalAmount?.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#2E7D32", fontWeight: 700, display: "block" }}>
                        Est. Provider Payout (85%): ₹{netEarningsEstimate.toLocaleString()}
                      </Typography>

                      <Chip
                        label={reqStatus}
                        size="small"
                        sx={{
                          bgcolor: currentStatusColor.bg,
                          color: currentStatusColor.text,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          mt: 0.8,
                        }}
                      />
                    </Box>

                    {/* Decision Controls */}
                    {reqStatus === "Pending" && (
                      <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => onAcceptClick(order)}
                          sx={{
                            bgcolor: "#2E7D32",
                            color: "#FFF",
                            fontWeight: 700,
                            borderRadius: 1.5,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#1B5E20" },
                          }}
                        >
                          Review & Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CloseIcon />}
                          onClick={() => onDeclineClick(order)}
                          sx={{
                            borderColor: "#D32F2F",
                            color: "#D32F2F",
                            fontWeight: 700,
                            borderRadius: 1.5,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#FFEBEE" },
                          }}
                        >
                          Decline
                        </Button>
                      </Stack>
                    )}

                    {(reqStatus === "Accepted" || reqStatus === "Confirmed") && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<LocalShippingOutlinedIcon />}
                        disabled={actionLoading}
                        onClick={() => onUpdateStatus(order._id, "Active")}
                        sx={{
                          bgcolor: "#1A1817",
                          color: "#D1A362",
                          fontWeight: 700,
                          borderRadius: 1.5,
                          textTransform: "none",
                          width: { xs: "100%", sm: "auto" },
                          "&:hover": { bgcolor: "#2E2A27" },
                        }}
                      >
                        Mark as Dispatched
                      </Button>
                    )}

                    {reqStatus === "Active" && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<TaskAltOutlinedIcon />}
                        disabled={actionLoading}
                        onClick={() => onUpdateStatus(order._id, "Completed")}
                        sx={{
                          bgcolor: "#2E7D32",
                          color: "#FFF",
                          fontWeight: 700,
                          borderRadius: 1.5,
                          textTransform: "none",
                          width: { xs: "100%", sm: "auto" },
                          "&:hover": { bgcolor: "#1B5E20" },
                        }}
                      >
                        Mark Returned & Inspected
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

ProviderRentalRequests.propTypes = {
  orders: PropTypes.array.isRequired,
  orderFilter: PropTypes.string.isRequired,
  setOrderFilter: PropTypes.func.isRequired,
  onAcceptClick: PropTypes.func.isRequired,
  onDeclineClick: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
};
