import {
  Box,
  Typography,
  Container,
  Stack,
  Paper,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { useAppSelector } from "src/hooks/redux";
import { selectCurrentUser } from "src/store/slices/authSlice";
import { Navigate, useNavigate } from "react-router-dom";
import { MAIN_PATH, APP_BAR_HEIGHT } from "src/constant";

export function Component() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={`/${MAIN_PATH.login}`} replace />;
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const getPlanPrice = (plan: string | null) => {
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
        pt: `${APP_BAR_HEIGHT + 32}px`,
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ color: "text.primary", mb: 4, fontWeight: 700 }}>
          {user.name}
        </Typography>

        {/* Membership Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ color: "text.primary", mb: 2, fontWeight: 600 }}>
            Membership Information
          </Typography>

          <Card
            sx={{
              mb: 3,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <CardContent>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Member since {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Typography>
            </CardContent>
          </Card>

          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Plan Info */}
              <Box>
                <Typography variant="h6" sx={{ color: "text.primary", mb: 1, fontWeight: 600 }}>
                  {user.subscriptionPlan ? `${user.subscriptionPlan} Plan` : "No Active Plan"}
                </Typography>
                {user.subscriptionPlan && (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {user.subscriptionPlan === "Premium" && "4K + HDR"}
                    {user.subscriptionPlan === "Standard" && "1080p"}
                    {(!user.subscriptionPlan || user.subscriptionPlan === "Basic" || user.subscriptionPlan === "Mobile") && "720p"}
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Next Billing Date */}
              {user.expiresAt && (
                <>
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                      Next billing date
                    </Typography>
                    <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 500 }}>
                      {formatDate(user.expiresAt)}
                    </Typography>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Payment Method */}
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                  Payment method
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CreditCardIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="body1" sx={{ color: "text.primary" }}>
                    •••• 4629
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Monthly Price */}
              {user.subscriptionPlan && (
                <>
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                      Monthly billing
                    </Typography>
                    <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
                      {getPlanPrice(user.subscriptionPlan)}
                      <Typography component="span" variant="body2" sx={{ color: "text.secondary", ml: 0.5 }}>
                        /month
                      </Typography>
                    </Typography>
                  </Box>
                  <Divider />
                </>
              )}

              {/* Status */}
              <Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                  Status
                </Typography>
                <Chip
                  label={user.subscriptionStatus || "Inactive"}
                  color={
                    user.subscriptionStatus === "active"
                      ? "success"
                      : user.subscriptionStatus === "pending"
                      ? "warning"
                      : "default"
                  }
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              {/* Manage Membership Button */}
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(`/${MAIN_PATH.payment}`)}
                sx={{ alignSelf: "flex-start", textTransform: "none" }}
              >
                Manage Membership
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

Component.displayName = "AccountPage";
