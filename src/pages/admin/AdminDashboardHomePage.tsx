import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { useGetDashboardStatsQuery } from "src/store/slices/adminApiSlice";

export function Component() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();

  return (
    <Box>
      <Typography variant="h4" sx={{ color: "text.primary", mb: 4, fontWeight: 700 }}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      {statsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <Grid container spacing={3}>
          {/* Top Row - Main Stats */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h4">{stats.totalUsers}</Typography>
                  <TrendingUpIcon sx={{ color: "success.main", fontSize: 20 }} />
                </Stack>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                  All registered users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Active Subscriptions
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h4">{stats.activeSubscriptions}</Typography>
                  <TrendingUpIcon sx={{ color: "success.main", fontSize: 20 }} />
                </Stack>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                  Currently active plans
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Pending Payments
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingPayments}
                  </Typography>
                  <TrendingDownIcon sx={{ color: "warning.main", fontSize: 20 }} />
                </Stack>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                  Awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h4">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(stats.totalRevenue)}
                  </Typography>
                  <TrendingUpIcon sx={{ color: "success.main", fontSize: 20 }} />
                </Stack>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                  Lifetime revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Plan Distribution */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "text.primary", mb: 2, fontWeight: 600 }}>
                  Plan Distribution
                </Typography>
                {stats.planDistribution && stats.planDistribution.length > 0 ? (
                  <Stack spacing={2}>
                    {stats.planDistribution.map((plan) => (
                      <Box key={plan._id}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 500 }}>
                            {plan._id}
                          </Typography>
                          <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 600 }}>
                            {plan.count} users
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: "100%",
                            height: 8,
                            bgcolor: "background.default",
                            borderRadius: 1,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${(plan.count / stats.totalUsers) * 100}%`,
                              height: "100%",
                              bgcolor: "primary.main",
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No plan data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity Summary */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "text.primary", mb: 2, fontWeight: 600 }}>
                  Subscription Status Summary
                </Typography>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body1" sx={{ color: "text.primary" }}>
                      Active Subscriptions
                    </Typography>
                    <Typography variant="h6" sx={{ color: "success.main", fontWeight: 600 }}>
                      {stats.activeSubscriptions}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body1" sx={{ color: "text.primary" }}>
                      Pending Payments
                    </Typography>
                    <Typography variant="h6" sx={{ color: "warning.main", fontWeight: 600 }}>
                      {stats.pendingPayments}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body1" sx={{ color: "text.primary" }}>
                      Total Users
                    </Typography>
                    <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
                      {stats.totalUsers}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}
