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
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
  Divider,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  CheckCircleOutline as ActiveIcon,
  PauseCircleOutline as InactiveIcon,
  CheckroomOutlined as DressIcon,
} from "@mui/icons-material";

export default function AdminListings({
  listings,
  onModerate,
  actionLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onSearch,
  onRefresh,
}) {
  const [previewListing, setPreviewListing] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, listing: null, action: "" });

  const categories = [
    "All Categories",
    "Evening Gowns",
    "Cocktail",
    "Bridal & Wedding",
    "Lehengas",
    "Sarees",
    "Anarkalis",
    "Indo-Western",
    "Party Wear",
    "Accessories",
  ];

  const handleOpenConfirm = (listing, action) => {
    setConfirmModal({ open: true, listing, action });
  };

  const handleExecuteModerate = async () => {
    if (confirmModal.listing && confirmModal.action) {
      await onModerate(confirmModal.listing._id, confirmModal.action);
      setConfirmModal({ open: false, listing: null, action: "" });
      if (previewListing && previewListing._id === confirmModal.listing._id) {
        setPreviewListing((prev) => ({
          ...prev,
          status: confirmModal.action === "restore" || confirmModal.action === "approve" ? "active" : "inactive",
        }));
      }
    }
  };

  return (
    <Stack spacing={3}>
      {/* Search & Moderation Filter Header */}
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
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          {/* Search Box */}
          <Box display="flex" gap={1.5} flexWrap="wrap" flex={1}>
            <TextField
              size="small"
              placeholder="Search garments by name, brand, or style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#888", mr: 1, fontSize: 20 }} />,
              }}
              sx={{ minWidth: { xs: "100%", sm: 280 }, flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={onSearch}
              sx={{
                bgcolor: "#1A1817",
                color: "#FFFFFF",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                "&:hover": { bgcolor: "#2C2926" },
              }}
            >
              Filter
            </Button>
          </Box>

          {/* Filters & Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active (Available)</MenuItem>
                <MenuItem value="inactive">Paused / Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c === "All Categories" ? "all" : c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Refresh garments">
              <IconButton
                onClick={onRefresh}
                sx={{ border: "1px solid #ECE7DE", borderRadius: 2 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Showing <strong>{listings.length}</strong> catalog pieces
          </Typography>
        </Box>
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
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Garment Piece</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Atelier Provider</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Category & Fit</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Rental & Deposit</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }} align="right">
                Moderation Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                  <DressIcon sx={{ fontSize: 40, color: "#CCC", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No designer garments match the selected filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              listings.map((l) => (
                <TableRow key={l._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        variant="rounded"
                        src={l.image || (l.images && l.images[0]) || "/assets/Cocktail Gown.jpg"}
                        alt={l.title || l.name}
                        sx={{ width: 48, height: 60, borderRadius: 2, objectFit: "cover", bgcolor: "#F5F5F5" }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="#1A1817">
                          {l.title || l.name || "Untitled Garment"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Brand: <strong>{l.brand || "Independent Atelier"}</strong>
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="#1A1817">
                      {l.providerId?.name || "Wardrobe Curated"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {l.providerId?.email || "curated@wardrobewonders.com"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="#1A1817">
                      {l.category || "Designer Wear"}
                    </Typography>
                    <Chip
                      size="small"
                      label={`Size ${l.size || "M"}`}
                      sx={{ mt: 0.5, height: 20, fontSize: "0.7rem", bgcolor: "#F0EAE1", fontWeight: 700 }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={800} color="#1A1817">
                      ₹{(l.rentalPricePerDay || l.price || 0).toLocaleString()}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        / day
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Deposit: ₹{(l.securityDeposit || l.advance || 0).toLocaleString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {l.status === "active" ? (
                      <Chip
                        size="small"
                        icon={<ActiveIcon sx={{ fontSize: "14px !important", color: "#2E7D32 !important" }} />}
                        label="Active"
                        sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.75rem" }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        icon={<InactiveIcon sx={{ fontSize: "14px !important", color: "#616161 !important" }} />}
                        label="Inactive"
                        sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 700, fontSize: "0.75rem" }}
                      />
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      <Tooltip title="Preview Garment Details">
                        <IconButton
                          size="small"
                          onClick={() => setPreviewListing(l)}
                          sx={{ border: "1px solid #ECE7DE", borderRadius: 1.5, color: "#1A1817" }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {l.status === "inactive" ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleOpenConfirm(l, "restore")}
                          disabled={actionLoading}
                          sx={{
                            fontWeight: 700,
                            textTransform: "none",
                            fontSize: "0.75rem",
                            borderRadius: 1.5,
                          }}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleOpenConfirm(l, "deactivate")}
                          disabled={actionLoading}
                          sx={{
                            fontWeight: 700,
                            textTransform: "none",
                            fontSize: "0.75rem",
                            borderRadius: 1.5,
                          }}
                        >
                          Deactivate
                        </Button>
                      )}
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
        {listings.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px solid #ECE7DE" }}>
            <Typography variant="body2" color="text.secondary">
              No garments found matching current filters.
            </Typography>
          </Paper>
        ) : (
          listings.map((l) => (
            <Card
              key={l._id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #ECE7DE",
                bgcolor: "#FFFFFF",
              }}
            >
              <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                  <CardMedia
                    component="img"
                    image={l.image || (l.images && l.images[0]) || "/assets/Cocktail Gown.jpg"}
                    alt={l.title || l.name}
                    sx={{ width: 72, height: 96, borderRadius: 2, objectFit: "cover", bgcolor: "#F5F5F5" }}
                  />
                  <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={800} color="#1A1817">
                      {l.title || l.name || "Untitled Garment"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Brand: {l.brand || "—"} &bull; Size: {l.size || "M"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Category: {l.category || "General"}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {l.status === "active" ? (
                        <Chip
                          size="small"
                          label="Active"
                          sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.7rem", height: 20 }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="Inactive"
                          sx={{ bgcolor: "#EEEEEE", color: "#616161", fontWeight: 700, fontSize: "0.7rem", height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5, borderColor: "#F0EAE1" }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Daily Rate</Typography>
                    <Typography variant="body2" fontWeight={800} color="#1A1817">
                      ₹{(l.rentalPricePerDay || l.price || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Deposit</Typography>
                    <Typography variant="body2" fontWeight={600} color="#1A1817">
                      ₹{(l.securityDeposit || l.advance || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setPreviewListing(l)}
                    sx={{
                      color: "#1A1817",
                      borderColor: "#ECE7DE",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Inspect
                  </Button>

                  {l.status === "inactive" ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleOpenConfirm(l, "restore")}
                      disabled={actionLoading}
                      sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenConfirm(l, "deactivate")}
                      disabled={actionLoading}
                      sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
                    >
                      Deactivate
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* GARMENT PREVIEW MODAL */}
      <Dialog
        open={Boolean(previewListing)}
        onClose={() => setPreviewListing(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", pb: 1 }}>
          Garment Moderation Dossier
        </DialogTitle>
        <DialogContent dividers>
          {previewListing && (
            <Stack spacing={2.5}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  component="img"
                  src={previewListing.image || (previewListing.images && previewListing.images[0]) || "/assets/Cocktail Gown.jpg"}
                  alt={previewListing.title || previewListing.name}
                  sx={{
                    width: "100%",
                    maxHeight: 280,
                    objectFit: "contain",
                    borderRadius: 2,
                    bgcolor: "#FAF8F5",
                  }}
                />
              </Box>

              <Box>
                <Typography variant="h6" fontWeight={800} color="#1A1817">
                  {previewListing.title || previewListing.name || "Untitled Garment"}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Brand: {previewListing.brand || "Independent Atelier"} &bull; Size {previewListing.size || "M"}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body2" fontWeight={600}>{previewListing.category || "Designer Wear"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Moderation Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={previewListing.status === "active" ? "Live in Catalog" : "Deactivated / Paused"}
                      sx={{
                        bgcolor: previewListing.status === "active" ? "#E8F5E9" : "#EEEEEE",
                        color: previewListing.status === "active" ? "#2E7D32" : "#616161",
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Daily Rental Rate</Typography>
                  <Typography variant="body1" fontWeight={800} color="#1A1817">
                    ₹{(previewListing.rentalPricePerDay || previewListing.price || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Escrow Security Deposit</Typography>
                  <Typography variant="body1" fontWeight={800} color="#D1A362">
                    ₹{(previewListing.securityDeposit || previewListing.advance || 0).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {previewListing.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Description & Care</Typography>
                  <Typography variant="body2" sx={{ color: "#444", mt: 0.5, lineHeight: 1.6 }}>
                    {previewListing.description}
                  </Typography>
                </Box>
              )}

              <Paper elevation={0} sx={{ p: 2, bgcolor: "#FAF8F5", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Atelier / Lender Contact
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {previewListing.providerId?.name || "Curated Catalog"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {previewListing.providerId?.email || "curated@wardrobewonders.com"}
                </Typography>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setPreviewListing(null)}
            sx={{ color: "#666", textTransform: "none" }}
          >
            Close
          </Button>
          {previewListing && (
            previewListing.status === "inactive" ? (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleOpenConfirm(previewListing, "restore")}
                disabled={actionLoading}
                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
              >
                Approve & Restore to Catalog
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleOpenConfirm(previewListing, "deactivate")}
                disabled={actionLoading}
                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
              >
                Deactivate & Hide from Catalog
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>

      {/* CONFIRM MODERATION DIALOG */}
      <Dialog
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, listing: null, action: "" })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Confirm Moderation Action
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {confirmModal.action === "deactivate" ? (
              <>
                Are you sure you want to <strong>deactivate</strong> the listing for{" "}
                <strong>{confirmModal.listing?.title || confirmModal.listing?.name}</strong>? It will immediately disappear from marketplace search and browsing.
              </>
            ) : (
              <>
                Are you sure you want to <strong>restore / approve</strong> the listing for{" "}
                <strong>{confirmModal.listing?.title || confirmModal.listing?.name}</strong>? It will be published back to the live customer catalog.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setConfirmModal({ open: false, listing: null, action: "" })}
            sx={{ color: "#666", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmModal.action === "deactivate" ? "error" : "success"}
            onClick={handleExecuteModerate}
            disabled={actionLoading}
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
          >
            {confirmModal.action === "deactivate" ? "Confirm Deactivation" : "Confirm Restoration"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

AdminListings.propTypes = {
  listings: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string,
      name: PropTypes.string,
      brand: PropTypes.string,
      category: PropTypes.string,
      size: PropTypes.string,
      rentalPricePerDay: PropTypes.number,
      price: PropTypes.number,
      securityDeposit: PropTypes.number,
      advance: PropTypes.number,
      image: PropTypes.string,
      images: PropTypes.arrayOf(PropTypes.string),
      status: PropTypes.string,
      availability: PropTypes.bool,
      providerId: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string,
      }),
    })
  ).isRequired,
  onModerate: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  categoryFilter: PropTypes.string.isRequired,
  setCategoryFilter: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
