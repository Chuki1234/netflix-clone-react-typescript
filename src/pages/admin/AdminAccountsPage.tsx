import { useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Pagination,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import {
  useGetDashboardStatsQuery,
  useGetAllUsersQuery,
  useGetPendingPaymentsQuery,
  useUpdateUserSubscriptionMutation,
  AdminUser,
} from "src/store/slices/adminApiSlice";

export function Component() {
  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Queries
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery({
    page,
    limit: 10,
    search: search || undefined,
    subscriptionStatus: subscriptionFilter || undefined,
    paymentStatus: paymentFilter || undefined,
  });
  const { data: pendingPayments } = useGetPendingPaymentsQuery();
  const [updateSubscription, { isLoading: updating }] = useUpdateUserSubscriptionMutation();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: AdminUser) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    try {
      await updateSubscription({
        userId: selectedUser._id,
        data: { action: "approve" },
      }).unwrap();
      handleMenuClose();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    try {
      await updateSubscription({
        userId: selectedUser._id,
        data: { action: "reject" },
      }).unwrap();
      handleMenuClose();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const handleCancel = async () => {
    if (!selectedUser) return;
    try {
      await updateSubscription({
        userId: selectedUser._id,
        data: { action: "cancel" },
      }).unwrap();
      handleMenuClose();
    } catch (error) {
      console.error("Failed to cancel:", error);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "inactive":
      case "failed":
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const formatPrice = (plan: string | null) => {
    const prices: Record<string, string> = {
      Mobile: "70,000₫",
      Basic: "180,000₫",
      Standard: "220,000₫",
      Premium: "260,000₫",
    };
    return plan ? prices[plan] || "N/A" : "N/A";
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: "text.primary", mb: 4 }}>
        Account Management
      </Typography>

      {/* Pending Payments Alert */}
      {pendingPayments && pendingPayments.count > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {pendingPayments.count} pending payment(s) that need approval.
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            fullWidth
            label="Search by name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            variant="outlined"
            sx={{ flex: { xs: "1 1 100%", md: "1 1 auto" } }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Subscription Status</InputLabel>
            <Select
              value={subscriptionFilter}
              label="Subscription Status"
              onChange={(e) => {
                setSubscriptionFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={paymentFilter}
              label="Payment Status"
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Subscription Status</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Monthly Price</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : usersData && usersData.users.length > 0 ? (
                usersData.users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.subscriptionPlan || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.subscriptionStatus || "N/A"}
                        color={getStatusColor(user.subscriptionStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.paymentStatus || "N/A"}
                        color={getStatusColor(user.paymentStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatPrice(user.subscriptionPlan)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                        disabled={updating}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {usersData && usersData.pagination.pages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <Pagination
              count={usersData.pagination.pages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedUser?.paymentStatus === "pending" && (
          <>
            <MenuItem onClick={handleApprove} disabled={updating}>
              <CheckCircleIcon sx={{ mr: 1, color: "success.main" }} />
              Approve Payment
            </MenuItem>
            <MenuItem onClick={handleReject} disabled={updating}>
              <CancelIcon sx={{ mr: 1, color: "error.main" }} />
              Reject Payment
            </MenuItem>
          </>
        )}
        {selectedUser?.subscriptionStatus === "active" && (
          <MenuItem onClick={handleCancel} disabled={updating}>
            <BlockIcon sx={{ mr: 1, color: "warning.main" }} />
            Cancel Subscription
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

