import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  Divider,
  Grid,
  Button,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import {
  PrintOutlined as PrintIcon,
  Close as CloseIcon,
  CheckCircleOutline as PaidIcon,
  ReceiptLongOutlined as InvoiceIcon,
} from "@mui/icons-material";

export default function StoreInvoiceModal({ open, onClose, invoice }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const billing = invoice.billingAddress || {};
  const sellerBreakdown = invoice.sellerBreakdown || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 3,
          p: { xs: 1.5, sm: 3 },
          bgcolor: "#FFFFFF",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, px: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <InvoiceIcon sx={{ color: "#D1A362", fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817", fontFamily: '"Playfair Display", Georgia, serif' }}>
                Store Purchase Invoice
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Immutable Purchase Snapshot • Invoice #{invoice.invoiceNumber}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<PaidIcon sx={{ fontSize: 16 }} />}
            label="PAID"
            color="success"
            size="small"
            sx={{ fontWeight: 800, px: 1 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 1.5, sm: 3 }, py: 2 }}>
        {/* Printable Container */}
        <Box id="store-invoice-printable" sx={{ color: "#1A1817" }}>
          {/* Header Metadata */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="overline" sx={{ color: "#D1A362", fontWeight: 800, letterSpacing: 1 }}>
                Billed To
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {billing.name || "Customer"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.6 }}>
                {billing.houseNo ? `${billing.houseNo}, ` : ""}
                {billing.street}<br />
                {billing.city}, {billing.state} — {billing.pincode}<br />
                Phone: +91 {billing.phone}<br />
                Email: {invoice.customerEmail}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ textAlign: { sm: "right" } }}>
              <Typography variant="overline" sx={{ color: "#D1A362", fontWeight: 800, letterSpacing: 1 }}>
                Invoice Details
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.6 }}>
                <strong>Invoice Date:</strong>{" "}
                {invoice.invoiceDate
                  ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}<br />
                <strong>Order Ref:</strong> #{invoice.orderNumber}<br />
                <strong>Payment Method:</strong> {invoice.paymentMethod || "PHONEPE_SANDBOX"}<br />
                <strong>Txn ID:</strong> {invoice.merchantTransactionId || "N/A"}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3, borderColor: "#ECE7DE" }} />

          {/* Seller Shipments Breakdown */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: "#1A1817" }}>
            Itemized Seller Shipments ({sellerBreakdown.length})
          </Typography>

          <Stack spacing={2.5} sx={{ mb: 3 }}>
            {sellerBreakdown.map((seller, sIdx) => (
              <Paper
                key={sIdx}
                elevation={0}
                sx={{
                  border: "1px solid #ECE7DE",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "#FAF9F7",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      {seller.storeName || "Seller Boutique"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Origin: {seller.originCity}, {seller.originState} • Fulfilment #{seller.fulfilmentOrderNumber}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                    Shipment #{sIdx + 1}
                  </Typography>
                </Stack>

                <Table size="small" sx={{ mb: 1 }}>
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.75rem", color: "text.secondary", borderBottom: "1px solid #ECE7DE" } }}>
                      <TableCell>Item Description</TableCell>
                      <TableCell align="center">Size / Color</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(seller.items || []).map((it, itIdx) => (
                      <TableRow key={itIdx} sx={{ "& td": { fontSize: "0.85rem", borderBottom: "1px solid #F0ECE4" } }}>
                        <TableCell>
                          <strong>{it.title}</strong>
                          {it.brand && (
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                              Brand: {it.brand}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {[it.size, it.color].filter(Boolean).join(" / ") || "Standard"}
                        </TableCell>
                        <TableCell align="center">{it.quantity}</TableCell>
                        <TableCell align="right">₹{it.unitPrice?.toLocaleString("en-IN")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{it.totalPrice?.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Subtotal: ₹{seller.subtotal?.toLocaleString("en-IN")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Shipping: ₹{(seller.shippingFee || 0).toLocaleString("en-IN")}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    Seller Total: ₹{seller.totalAmount?.toLocaleString("en-IN")}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>

          {/* Grand Financial Totals */}
          <Box sx={{ p: 2, bgcolor: "#FFFFFF", border: "1px solid #ECE7DE", borderRadius: 2, mb: 3 }}>
            <Grid container spacing={1} justifyContent="flex-end">
              <Grid item xs={12} sm={5}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Items Subtotal:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{invoice.subtotal?.toLocaleString("en-IN")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Total Shipping Charges:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{(invoice.totalShippingFee || 0).toLocaleString("en-IN")}
                    </Typography>
                  </Stack>
                  {invoice.discountAmount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Promotional Discount:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#2E7D32" }}>
                        -₹{invoice.discountAmount?.toLocaleString("en-IN")}
                      </Typography>
                    </Stack>
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1A1817" }}>
                      Total Paid:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#D1A362" }}>
                      ₹{invoice.grandTotal?.toLocaleString("en-IN")}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Legal / Marketplace Disclaimer */}
          <Box sx={{ p: 1.5, bgcolor: "#F5F2EB", borderRadius: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#777", display: "block", fontSize: "0.75rem", lineHeight: 1.4 }}>
              * This is an automated immutable purchase invoice snapshot issued by Wardrobe Wonders Store Marketplace.
              Store permanent sales are distinct from rental garment bookings. All items are dispatched directly by the respective independent seller boutiques.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={onClose}
          sx={{
            borderColor: "#ECE7DE",
            color: "#1A1817",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{
            bgcolor: "#1A1817",
            color: "#FFFFFF",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { bgcolor: "#333" },
          }}
        >
          Print Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
}
