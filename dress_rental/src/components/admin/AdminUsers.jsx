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
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  ShieldOutlined as AdminBadgeIcon,
  PersonOutline as CustomerIcon,
  StorefrontOutlined as ProviderIcon,
  CheckCircleOutline as ActiveIcon,
  ErrorOutline as InactiveIcon,
} from "@mui/icons-material";

export default function AdminUsers({
  users,
  currentUser,
  onToggleStatus,
  actionLoading,
  userQuery,
  setUserQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onSearch,
  onRefresh,
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null });

  const getRoleChip = (role) => {
    switch (role) {
      case "admin":
        return (
          <Chip
            size="small"
            icon={<AdminBadgeIcon sx={{ fontSize: "14px !important" }} />}
            label="Admin"
            sx={{ bgcolor: "#EDE7F6", color: "#512DA8", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      case "provider":
        return (
          <Chip
            size="small"
            icon={<ProviderIcon sx={{ fontSize: "14px !important" }} />}
            label="Provider"
            sx={{ bgcolor: "#FFF8E1", color: "#B78103", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            icon={<CustomerIcon sx={{ fontSize: "14px !important" }} />}
            label="Customer"
            sx={{ bgcolor: "#E3F2FD", color: "#0D47A1", fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
    }
  };

  const getStatusChip = (isActive) => {
    return isActive ? (
      <Chip
        size="small"
        icon={<ActiveIcon sx={{ fontSize: "14px !important", color: "#2E7D32 !important" }} />}
        label="Active"
        sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 700, fontSize: "0.75rem" }}
      />
    ) : (
      <Chip
        size="small"
        icon={<InactiveIcon sx={{ fontSize: "14px !important", color: "#C62828 !important" }} />}
        label="Deactivated"
        sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 700, fontSize: "0.75rem" }}
      />
    );
  };

  const handleOpenConfirm = (u) => {
    setConfirmModal({ open: true, user: u });
  };

  const handleConfirmToggle = async () => {
    if (confirmModal.user) {
      await onToggleStatus(confirmModal.user);
      setConfirmModal({ open: false, user: null });
    }
  };

  return (
    <Stack spacing={3}>
      {/* Search & Filter Header Bar */}
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
              placeholder="Search by name, email, or contact..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
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

          {/* Filters & Refresh */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="customer">Customers</MenuItem>
                <MenuItem value="provider">Providers</MenuItem>
                <MenuItem value="admin">Admins</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Deactivated</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh accounts">
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
            Showing <strong>{users.length}</strong> matching user accounts
          </Typography>
        </Box>
      </Paper>

      {/* DESKTOP TABLE VIEW (md and up) */}
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
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>User Details</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }}>Member Since</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#1A1817" }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No users found matching current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSelf = String(currentUser?._id) === String(u._id);
                return (
                  <TableRow key={u._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: u.role === "admin" ? "#512DA8" : u.role === "provider" ? "#D1A362" : "#1A1817",
                            width: 36,
                            height: 36,
                            fontSize: "0.85rem",
                            fontWeight: 700,
                          }}
                        >
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#1A1817">
                            {u.name || `${u.firstname || ""} ${u.lastname || ""}`.trim() || "Unnamed Member"}
                            {isSelf && (
                              <Chip
                                size="small"
                                label="You"
                                sx={{
                                  ml: 1,
                                  height: 18,
                                  fontSize: "0.68rem",
                                  bgcolor: "#1A1817",
                                  color: "#FFFFFF",
                                  fontWeight: 700,
                                }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>{getRoleChip(u.role)}</TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.phone || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>{getStatusChip(u.isActive)}</TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <Tooltip title="View Profile Information">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedUser(u)}
                            sx={{ color: "#1A1817", border: "1px solid #ECE7DE", borderRadius: 1.5 }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {isSelf ? (
                          <Tooltip title="Self-deactivation disabled for administrative safety">
                            <span>
                              <Button
                                size="small"
                                disabled
                                variant="outlined"
                                sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 1.5 }}
                              >
                                Protected
                              </Button>
                            </span>
                          </Tooltip>
                        ) : (
                          <Button
                            size="small"
                            variant={u.isActive ? "outlined" : "contained"}
                            color={u.isActive ? "error" : "success"}
                            onClick={() => handleOpenConfirm(u)}
                            disabled={actionLoading}
                            sx={{
                              fontWeight: 700,
                              textTransform: "none",
                              fontSize: "0.75rem",
                              borderRadius: 1.5,
                            }}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
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

      {/* MOBILE CARDS VIEW (screens below md) */}
      <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
        {users.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px solid #ECE7DE" }}>
            <Typography variant="body2" color="text.secondary">
              No users found matching current filters.
            </Typography>
          </Paper>
        ) : (
          users.map((u) => {
            const isSelf = String(currentUser?._id) === String(u._id);
            return (
              <Card
                key={u._id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #ECE7DE",
                  bgcolor: "#FFFFFF",
                }}
              >
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: u.role === "admin" ? "#512DA8" : u.role === "provider" ? "#D1A362" : "#1A1817",
                          width: 40,
                          height: 40,
                          fontSize: "0.9rem",
                          fontWeight: 700,
                        }}
                      >
                        {u.name ? u.name[0].toUpperCase() : "U"}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} color="#1A1817">
                          {u.name || `${u.firstname || ""} ${u.lastname || ""}`.trim() || "Unnamed Member"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {u.email}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box>{getStatusChip(u.isActive)}</Box>
                  </Stack>

                  <Divider sx={{ my: 1.5, borderColor: "#F0EAE1" }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Role
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>{getRoleChip(u.role)}</Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" display="block">
                        Contact Phone
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#1A1817">
                        {u.phone || "—"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedUser(u)}
                      sx={{
                        color: "#1A1817",
                        borderColor: "#ECE7DE",
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                      }}
                    >
                      Inspect Profile
                    </Button>

                    {isSelf ? (
                      <Button
                        size="small"
                        disabled
                        variant="outlined"
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        Admin (Protected)
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant={u.isActive ? "outlined" : "contained"}
                        color={u.isActive ? "error" : "success"}
                        onClick={() => handleOpenConfirm(u)}
                        disabled={actionLoading}
                        sx={{
                          fontWeight: 700,
                          textTransform: "none",
                          borderRadius: 2,
                        }}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })
        )}
      </Stack>

      {/* USER DETAIL INSPECTION DIALOG */}
      <Dialog
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817", pb: 1 }}>
          Member Dossier
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: selectedUser.role === "admin" ? "#512DA8" : selectedUser.role === "provider" ? "#D1A362" : "#1A1817",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                  }}
                >
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : "U"}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#1A1817">
                    {selectedUser.name || "Unnamed"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Account ID: {selectedUser._id}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary">Email Address</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedUser.email}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Contact Phone</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedUser.phone || "Not recorded"}</Typography>
              </Box>

              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Assigned Role</Typography>
                  <Box sx={{ mt: 0.5 }}>{getRoleChip(selectedUser.role)}</Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Account Status</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedUser.isActive)}</Box>
                </Box>
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary">Registration Date</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "Unknown"}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setSelectedUser(null)}
            sx={{ color: "#1A1817", fontWeight: 700, textTransform: "none" }}
          >
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM STATUS TOGGLE DIALOG */}
      <Dialog
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1A1817" }}>
          Confirm Account {confirmModal.user?.isActive ? "Deactivation" : "Reactivation"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {confirmModal.user?.isActive ? (
              <>
                Are you sure you want to deactivate the account for <strong>{confirmModal.user?.name || confirmModal.user?.email}</strong>? They will be unable to log in, create bookings, or access atelier tools until reactivated.
              </>
            ) : (
              <>
                Are you sure you want to reactivate the account for <strong>{confirmModal.user?.name || confirmModal.user?.email}</strong>? Their login clearance will be immediately restored.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setConfirmModal({ open: false, user: null })}
            sx={{ color: "#666", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmModal.user?.isActive ? "error" : "success"}
            onClick={handleConfirmToggle}
            disabled={actionLoading}
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
          >
            {confirmModal.user?.isActive ? "Deactivate Account" : "Activate Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

AdminUsers.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      firstname: PropTypes.string,
      lastname: PropTypes.string,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string,
      role: PropTypes.string,
      isActive: PropTypes.bool,
      createdAt: PropTypes.string,
    })
  ).isRequired,
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
  }),
  onToggleStatus: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  userQuery: PropTypes.string.isRequired,
  setUserQuery: PropTypes.func.isRequired,
  roleFilter: PropTypes.string.isRequired,
  setRoleFilter: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
