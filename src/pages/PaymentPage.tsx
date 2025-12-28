import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useAppSelector } from "src/hooks/redux";
import { selectCurrentUser } from "src/store/slices/authSlice";
import { Navigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

interface Plan {
  id: "Mobile" | "Basic" | "Standard" | "Premium";
  name: string;
  price: string;
  quality: string;
  resolution: string;
  devices: string;
  concurrentStreams: number;
  downloadDevices: number;
  headerColor: string;
}

const plans: Plan[] = [
  {
    id: "Mobile",
    name: "Mobile",
    price: "4.99",
    quality: "Fair",
    resolution: "480p",
    devices: "Mobile phone, Tablet",
    concurrentStreams: 1,
    downloadDevices: 1,
    headerColor: "#0071eb",
  },
  {
    id: "Basic",
    name: "Basic",
    price: "9.99",
    quality: "Good",
    resolution: "720p (HD)",
    devices: "TV, Computer, Mobile phone, Tablet",
    concurrentStreams: 1,
    downloadDevices: 1,
    headerColor: "#9b59b6",
  },
  {
    id: "Standard",
    name: "Standard",
    price: "15.99",
    quality: "Excellent",
    resolution: "1080p (Full HD)",
    devices: "TV, Computer, Mobile phone, Tablet",
    concurrentStreams: 2,
    downloadDevices: 2,
    headerColor: "#34495e",
  },
  {
    id: "Premium",
    name: "Premium",
    price: "19.99",
    quality: "Best",
    resolution: "4K (Ultra HD) + HDR",
    devices: "TV, Computer, Mobile phone, Tablet",
    concurrentStreams: 4,
    downloadDevices: 6,
    headerColor: "#e50914",
  },
];

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAppSelector(selectCurrentUser);
  const isNewUser = searchParams.get("newUser") === "true";
  
  const [selectedPlan, setSelectedPlan] = useState<Plan["id"] | null>(null);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={`/${MAIN_PATH.login}`} replace />;
  }

  // Set initial selected plan
  useEffect(() => {
    if (isNewUser) {
      // New user: no plan selected yet
      setSelectedPlan(null);
    } else {
      // Existing user: show current plan or default
      const currentPlanId = (user?.subscriptionPlan as Plan["id"]) || null;
      setSelectedPlan(currentPlanId);
    }
  }, [isNewUser, user?.subscriptionPlan]);

  const currentPlanId = (user?.subscriptionPlan as Plan["id"]) || null;
  const currentPlan = currentPlanId ? plans.find((p) => p.id === currentPlanId) : null;

  const handleContinue = () => {
    if (!selectedPlan) {
      setError("Please select a plan");
      return;
    }

    // Navigate to payment checkout page with selected plan
    const params = new URLSearchParams();
    params.set("planId", selectedPlan);
    if (isNewUser) {
      params.set("newUser", "true");
    }
    navigate(`/${MAIN_PATH.paymentCheckout}?${params.toString()}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        pt: 4,
        pb: 8,
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 4, md: 6 }, pt: 4 }}>

        {/* Title Section */}
        <Box sx={{ mb: 6, textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              color: "text.primary",
              fontWeight: 700,
              mb: 2,
            }}
          >
            Change Plan
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Try a new plan. You can always change back if you don't like it.
          </Typography>
        </Box>

        {/* Current Plan Banner */}
        {currentPlan && (
          <Box
            sx={{
              position: "relative",
              mb: 2,
              textAlign: "center",
            }}
          >
            <Chip
              label={`Current plan: ${currentPlan.name}`}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                fontWeight: 600,
                px: 2,
                py: 3,
                fontSize: "0.875rem",
              }}
            />
          </Box>
        )}

        {/* Plan Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isSelected = selectedPlan === plan.id;

            return (
              <Grid item xs={12} sm={6} md={3} key={plan.id}>
                <Paper
                  elevation={isSelected ? 8 : 2}
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: isSelected ? `2px solid ${plan.headerColor}` : "2px solid transparent",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {/* Plan Header */}
                  <Box
                    sx={{
                      bgcolor: plan.headerColor,
                      color: "white",
                      p: 2,
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {plan.name}
                      </Typography>
                      {isCurrentPlan && (
                        <CheckIcon sx={{ fontSize: 24, color: "white" }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                      {plan.resolution.split(" ")[0]}
                    </Typography>
                  </Box>

                  {/* Plan Content */}
                  <Box sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    {/* Price */}
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", textTransform: "uppercase" }}
                      >
                        Monthly price
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                        <Typography variant="h4" sx={{ color: "text.primary", fontWeight: 700 }}>
                          ${plan.price}
                        </Typography>
                      </Box>
                      {isCurrentPlan && (
                        <Chip
                          label="Current plan"
                          size="small"
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>

                    <Stack spacing={2} sx={{ flexGrow: 1 }}>
                      {/* Quality */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", textTransform: "uppercase" }}
                        >
                          Video and audio quality
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
                          {plan.quality}
                        </Typography>
                      </Box>

                      {/* Resolution */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", textTransform: "uppercase" }}
                        >
                          Resolution
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
                          {plan.resolution}
                        </Typography>
                      </Box>

                      {/* Devices */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", textTransform: "uppercase" }}
                        >
                          Supported devices
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
                          {plan.devices}
                        </Typography>
                      </Box>

                      {/* Concurrent Streams */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", textTransform: "uppercase" }}
                        >
                          Number of devices you can watch at the same time
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
                          {plan.concurrentStreams}
                        </Typography>
                      </Box>

                      {/* Download Devices */}
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", textTransform: "uppercase" }}
                        >
                          Number of devices for downloads
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
                          {plan.downloadDevices}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Continue Button */}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleContinue}
            disabled={!selectedPlan || selectedPlan === currentPlanId}
            sx={{
              minWidth: 200,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {isNewUser ? "Continue to Payment" : "Change Plan"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

Component.displayName = "PaymentPage";

