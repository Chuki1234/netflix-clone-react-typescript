import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
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
import { useAppSelector, useAppDispatch } from "src/hooks/redux";
import { selectCurrentUser, logout } from "src/store/slices/authSlice";
import { Navigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";
import {
  useGetDashboardStatsQuery,
  useGetAllUsersQuery,
  useGetPendingPaymentsQuery,
  useUpdateUserSubscriptionMutation,
  AdminUser,
} from "src/store/slices/adminApiSlice";

export function Component() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  
  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery({
    page,
    limit: 10,
    search: search || undefined,
    subscriptionStatus: subscriptionFilter || undefined,
    paymentStatus: paymentFilter || undefined,
  });
  const { data: pendingPayments, isLoading: pendingLoading } = useGetPendingPaymentsQuery();
  const [updateSubscription, { isLoading: updating }] = useUpdateUserSubscriptionMutation();

  // Redirect if not authenticated or not admin
  if (!user) {
    return <Navigate to={`/${MAIN_PATH.login}`} replace />;
  }
  
  // Check if user is admin
  if (user.role !== "admin") {
    return <Navigate to={`/${MAIN_PATH.browse}`} replace />;
  }

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

  const handleLogout = () => {
    dispatch(logout());
    navigate(`/${MAIN_PATH.login}`);
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
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          px: { xs: "30px", sm: "60px" },
          pb: 4,
          pt: 4,
        }}
      >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ color: "text.primary" }}>
          Admin Dashboard
        </Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* Stats Cards */}
      {statsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Subscriptions
                </Typography>
                <Typography variant="h4">{stats.activeSubscriptions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Payments
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingPayments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(stats.totalRevenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      {/* Pending Payments Alert */}
      {pendingPayments && pendingPayments.count > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {pendingPayments.count} pending payment(s) that need approval.
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search by name or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
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
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
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
          </Grid>
        </Grid>
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
      </Container>
    </Box>
  );
}

