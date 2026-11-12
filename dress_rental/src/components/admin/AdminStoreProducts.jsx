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
  CheckroomOutlined as DressIcon,
  BlockOutlined as SuspendIcon,
  WarningAmberOutlined as DefectIcon,
  EditNoteOutlined as ChangesIcon,
  HistoryOutlined as HistoryIcon,
} from "@mui/icons-material";

export default function AdminStoreProducts({
  products = [],
  onModerate,
  actionLoading = false,
  statusFilter = "all",
  setStatusFilter,
  conditionFilter = "all",
  setConditionFilter,
  searchQuery = "",
  setSearchQuery,
  onRefresh,
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [moderateDialog, setModerateDialog] = useState({ open: false, product: null, action: "" });
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleOpenModerate = (product, action) => {
    setModerateDialog({ open: true, product, action });
    setNotes("");
    setNotesError("");
  };

  const handleConfirmModerate = () => {
    const isNoteMandatory = ["REJECTED", "SUSPENDED", "CHANGES_REQUESTED"].includes(moderateDialog.action);
    if (isNoteMandatory && !notes.trim()) {
      setNotesError(
        moderateDialog.action === "REJECTED"
          ? "Rejection reason is mandatory."
          : moderateDialog.action === "SUSPENDED"
          ? "Suspension reason is mandatory."
          : "Change request instructions are mandatory."
      );
      return;
    }

    if (onModerate && moderateDialog.product) {
      onModerate(moderateDialog.product._id, moderateDialog.action, notes.trim());
      setModerateDialog({ open: false, product: null, action: "" });
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case "APPROVED":
        return <Chip label="Approved & Live" size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700 }} />;
      case "PENDING_REVIEW":
        return <Chip label="Pending Review" size="small" sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 700 }} />;
      case "REJECTED":
        return <Chip label="Rejected" size="small" sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700 }} />;
      case "CHANGES_REQUESTED":
        return <Chip label="Changes Requested" size="small" sx={{ bgcolor: "#E1F5FE", color: "#0288D1", fontWeight: 700 }} />;
      case "DRAFT":
        return <Chip label="Draft" size="small" sx={{ bgcolor: "#F5F5F5", color: "#757575", fontWeight: 700 }} />;
      case "SUSPENDED":
        return <Chip label="Suspended" size="small" sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 700 }} />;
      case "ARCHIVED":
        return <Chip label="Archived" size="small" sx={{ bgcolor: "#E0E0E0", color: "#9E9E9E", fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box>
      {/* Search and Filters */}
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
            placeholder="Search product title, brand, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />,
            }}
            sx={{ minWidth: 260 }}
          />

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="product-status-filter-label">Moderation Status</InputLabel>
            <Select
              labelId="product-status-filter-label"
              value={statusFilter}
              label="Moderation Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="PENDING_REVIEW">Pending Review</MenuItem>
              <MenuItem value="APPROVED">Approved & Live</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="CHANGES_REQUESTED">Changes Requested</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="DRAFT">Drafts</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="product-condition-filter-label">Condition</InputLabel>
            <Select
              labelId="product-condition-filter-label"
              value={conditionFilter}
              label="Condition"
              onChange={(e) => setConditionFilter(e.target.value)}
            >
              <MenuItem value="all">All Conditions</MenuItem>
              <MenuItem value="NEW">Brand New</MenuItem>
              <MenuItem value="PRE_OWNED">Pre-loved Only</MenuItem>
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
          Refresh Products
        </Button>
      </Stack>

      {/* Moderation Table */}
      <Paper elevation={0} sx={{ border: "1px solid #ECE7DE", borderRadius: 2, overflow: "hidden" }}>
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={{ bgcolor: "#FAF8F5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Store / Seller</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Condition</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#1A1817" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  <DressIcon sx={{ fontSize: 48, color: "#ECE7DE", mb: 1, display: "block", mx: "auto" }} />
                  No store products matching moderation criteria.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const isStoreSuspended = p.storeId?.status === "SUSPENDED";
                return (
                  <TableRow key={p._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={p.images?.[0]}
                          variant="rounded"
                          sx={{ width: 44, height: 52, bgcolor: "#FAF8F5", border: "1px solid #ECE7DE" }}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1A1817" }}>
                            {p.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {p.brand ? <strong>{p.brand} • </strong> : null}
                            {p.category} {p.subcategory ? `> ${p.subcategory}` : ""}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.storeId?.storeName || "Unassigned Store"}
                      </Typography>
                      {isStoreSuspended && (
                        <Chip
                          label="Store Suspended"
                          size="small"
                          sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontSize: "0.68rem", fontWeight: 800, mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.condition === "PRE_OWNED" ? "Pre-loved" : "Brand New"}
                        size="small"
                        sx={{
                          bgcolor: p.condition === "PRE_OWNED" ? "#FFF8E1" : "#E8F5E9",
                          color: p.condition === "PRE_OWNED" ? "#F57F17" : "#2E7D32",
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ₹{p.price?.toLocaleString("en-IN")}
                      </Typography>
                      {p.originalRetailPrice && p.originalRetailPrice > p.price && (
                        <Typography variant="caption" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                          ₹{p.originalRetailPrice?.toLocaleString("en-IN")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(p.status)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Inspect Product Details & Images">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProduct(p);
                              setActiveImageIndex(0);
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {["PENDING_REVIEW", "CHANGES_REQUESTED"].includes(p.status) && (
                          <>
                            <Tooltip
                              title={
                                isStoreSuspended
                                  ? "Cannot approve: Seller's store is suspended"
                                  : "Approve and Publish Product"
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={isStoreSuspended}
                                  sx={{ color: isStoreSuspended ? "text.disabled" : "success.main" }}
                                  onClick={() => handleOpenModerate(p, "APPROVED")}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Request Changes">
                              <IconButton
                                size="small"
                                sx={{ color: "info.main" }}
                                onClick={() => handleOpenModerate(p, "CHANGES_REQUESTED")}
                              >
                                <ChangesIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Product with Reason">
                              <IconButton
                                size="small"
                                sx={{ color: "error.main" }}
                                onClick={() => handleOpenModerate(p, "REJECTED")}
                              >
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {p.status === "APPROVED" && (
                          <Tooltip title="Suspend Product">
                            <IconButton
                              size="small"
                              sx={{ color: "warning.main" }}
                              onClick={() => handleOpenModerate(p, "SUSPENDED")}
                            >
                              <SuspendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", borderBottom: "1px solid #ECE7DE" }}>
            Product Inspection: {selectedProduct.title}
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            {/* Store Suspended Warning */}
            {selectedProduct.storeId?.status === "SUSPENDED" && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <strong>Store Suspended:</strong> This product belongs to &quot;{selectedProduct.storeId?.storeName}&quot;,
                which is currently suspended. This product cannot be approved or published until the store is reinstated.
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Product Gallery Inspection */}
              <Grid item xs={12} sm={5}>
                <Box
                  sx={{
                    width: "100%",
                    height: 280,
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid #ECE7DE",
                    mb: 1.5,
                  }}
                >
                  <img
                    src={selectedProduct.images?.[activeImageIndex] || selectedProduct.images?.[0]}
                    alt={selectedProduct.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
                {/* Thumbnails */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                    {selectedProduct.images.map((img, idx) => (
                      <Box
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        sx={{
                          width: 50,
                          height: 60,
                          borderRadius: 1,
                          overflow: "hidden",
                          border: activeImageIndex === idx ? "2px solid #D1A362" : "1px solid #ECE7DE",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <img src={img} alt={`Thumb ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Grid>

              {/* Details Column */}
              <Grid item xs={12} sm={7}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  {selectedProduct.brand ? `${selectedProduct.brand} • ` : ""}
                  {selectedProduct.category} {selectedProduct.subcategory ? `> ${selectedProduct.subcategory}` : ""}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1A1817", mt: 0.5 }}>
                  {selectedProduct.title}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ my: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1A1817" }}>
                    ₹{selectedProduct.price?.toLocaleString("en-IN")}
                  </Typography>
                  {selectedProduct.originalRetailPrice && selectedProduct.originalRetailPrice > selectedProduct.price && (
                    <Typography variant="body2" sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                      MRP: ₹{selectedProduct.originalRetailPrice?.toLocaleString("en-IN")}
                    </Typography>
                  )}
                  <Chip
                    label={selectedProduct.condition === "PRE_OWNED" ? "Pre-loved" : "Brand New"}
                    size="small"
                    sx={{
                      bgcolor: selectedProduct.condition === "PRE_OWNED" ? "#FFF8E1" : "#E8F5E9",
                      color: selectedProduct.condition === "PRE_OWNED" ? "#F57F17" : "#2E7D32",
                      fontWeight: 700,
                    }}
                  />
                  {getStatusChip(selectedProduct.status)}
                </Stack>

                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  {selectedProduct.description}
                </Typography>

                {/* Seller Store Info */}
                <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2, border: "1px solid #ECE7DE", mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block" }}>
                    STORE & SELLER
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {selectedProduct.storeId?.storeName || "Unknown Store"} ({selectedProduct.storeId?.status || "ACTIVE"})
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Seller: {selectedProduct.sellerId?.name || selectedProduct.sellerId?.email}
                  </Typography>
                </Paper>

                {/* Variants & Stock */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mb: 0.5 }}>
                      SIZE & COLOUR VARIANTS ({selectedProduct.variants.length})
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Colour</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedProduct.variants.map((v, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{v.size || "Free Size"}</TableCell>
                            <TableCell>{v.color || "Standard"}</TableCell>
                            <TableCell>{v.stockQuantity}</TableCell>
                            <TableCell>{v.sku || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Grid>

              {/* Pre-owned Disclosures Section */}
              {selectedProduct.condition === "PRE_OWNED" && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2.5, bgcolor: "#FFFDF9", border: "1px solid #FFE082", borderRadius: 2 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <DefectIcon sx={{ color: "#F57F17" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#B78103" }}>
                        Pre-Loved Wear & Flaw Inspection
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: "#4E342E", mb: 2 }}>
                      <strong>Seller Wear Disclosure:</strong> &quot;{selectedProduct.conditionDescription}&quot;
                    </Typography>

                    {/* Defect Images */}
                    {selectedProduct.defectImages && selectedProduct.defectImages.length > 0 ? (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                          Defect / Flaw Photographs ({selectedProduct.defectImages.length}):
                        </Typography>
                        <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto" }}>
                          {selectedProduct.defectImages.map((dimg, didx) => (
                            <Box
                              key={didx}
                              sx={{
                                width: 80,
                                height: 96,
                                borderRadius: 1.5,
                                overflow: "hidden",
                                border: "1px solid #FFE082",
                                flexShrink: 0,
                              }}
                            >
                              <img src={dimg} alt={`Defect ${didx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        No specific defect photographs uploaded.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Review History Audit Trail */}
              {selectedProduct.reviewHistory && selectedProduct.reviewHistory.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <HistoryIcon fontSize="small" sx={{ color: "#D1A362" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Moderation Audit History ({selectedProduct.reviewHistory.length} actions)
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {selectedProduct.reviewHistory.map((h, idx) => (
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
                            {getStatusChip(h.status)}
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
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: "1px solid #ECE7DE" }}>
            <Button onClick={() => setSelectedProduct(null)} sx={{ textTransform: "none", color: "text.secondary" }}>
              Close
            </Button>
            {["PENDING_REVIEW", "CHANGES_REQUESTED"].includes(selectedProduct.status) && (
              <>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => {
                    const target = selectedProduct;
                    setSelectedProduct(null);
                    handleOpenModerate(target, "CHANGES_REQUESTED");
                  }}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Request Changes
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const target = selectedProduct;
                    setSelectedProduct(null);
                    handleOpenModerate(target, "REJECTED");
                  }}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  disabled={selectedProduct.storeId?.status === "SUSPENDED"}
                  sx={{
                    bgcolor: "#1A1817",
                    color: "#D1A362",
                    "&:hover": { bgcolor: "#2C2825" },
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    const target = selectedProduct;
                    setSelectedProduct(null);
                    handleOpenModerate(target, "APPROVED");
                  }}
                >
                  Approve & Publish
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Moderation Confirmation Dialog */}
      <Dialog
        open={moderateDialog.open}
        onClose={() => setModerateDialog({ open: false, product: null, action: "" })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {moderateDialog.action === "APPROVED" && "Approve & Publish Product"}
          {moderateDialog.action === "REJECTED" && "Reject Product Listing"}
          {moderateDialog.action === "CHANGES_REQUESTED" && "Request Product Changes"}
          {moderateDialog.action === "SUSPENDED" && "Suspend Product Listing"}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {moderateDialog.action === "APPROVED" &&
              `Approving "${moderateDialog.product?.title}" will immediately make it publicly visible on the Store marketplace and the seller's storefront.`}
            {moderateDialog.action === "REJECTED" &&
              `Rejecting this product will notify the seller. You must provide a clear rejection reason.`}
            {moderateDialog.action === "CHANGES_REQUESTED" &&
              `Requesting changes will notify the seller with instructions on what needs updating.`}
            {moderateDialog.action === "SUSPENDED" &&
              `Suspending this product will immediately remove it from public search and storefronts.`}
          </Typography>

          <TextField
            label={
              ["REJECTED", "SUSPENDED", "CHANGES_REQUESTED"].includes(moderateDialog.action)
                ? "Review Reason / Instructions (Mandatory)"
                : "Approval Notes (Optional)"
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
              moderateDialog.action === "REJECTED"
                ? "State clear reasons (e.g. counterfeit concerns, inaccurate images, pricing anomalies)..."
                : moderateDialog.action === "CHANGES_REQUESTED"
                ? "State exact changes required (e.g. clearer photo of wear, correct category)..."
                : moderateDialog.action === "SUSPENDED"
                ? "State reason for suspension..."
                : "Internal approval notes (optional)..."
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setModerateDialog({ open: false, product: null, action: "" })}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={
              moderateDialog.action === "APPROVED"
                ? "primary"
                : moderateDialog.action === "REJECTED"
                ? "error"
                : moderateDialog.action === "SUSPENDED"
                ? "warning"
                : "info"
            }
            onClick={handleConfirmModerate}
            disabled={actionLoading}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Confirm {moderateDialog.action}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

AdminStoreProducts.propTypes = {
  products: PropTypes.array,
  onModerate: PropTypes.func,
  actionLoading: PropTypes.bool,
  statusFilter: PropTypes.string,
  setStatusFilter: PropTypes.func,
  conditionFilter: PropTypes.string,
  setConditionFilter: PropTypes.func,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func,
  onRefresh: PropTypes.func,
};
