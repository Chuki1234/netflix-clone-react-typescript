import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAppSelector } from "src/hooks/redux";
import { selectCurrentUser } from "src/store/slices/authSlice";
import { Navigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";
import {
  useProcessPaymentMutation,
  useChangePlanMutation,
} from "src/store/slices/paymentApiSlice";

interface Plan {
  id: "Mobile" | "Basic" | "Standard" | "Premium";
  name: string;
  price: string;
}

const plans: Plan[] = [
  { id: "Mobile", name: "Mobile", price: "4.99" },
  { id: "Basic", name: "Basic", price: "9.99" },
  { id: "Standard", name: "Standard", price: "15.99" },
  { id: "Premium", name: "Premium", price: "19.99" },
];

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAppSelector(selectCurrentUser);
  const planId = searchParams.get("planId") as Plan["id"] | null;
  const isNewUser = searchParams.get("newUser") === "true";
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState("");

  const [processPayment, { isLoading: isProcessing }] = useProcessPaymentMutation();
  const [changePlan, { isLoading: isChanging }] = useChangePlanMutation();

  // Redirect if not authenticated or no plan selected
  if (!user) {
    return <Navigate to={`/${MAIN_PATH.login}`} replace />;
  }

  if (!planId || !plans.find((p) => p.id === planId)) {
    return <Navigate to={`/${MAIN_PATH.payment}`} replace />;
  }

  const selectedPlan = plans.find((p) => p.id === planId)!;
  const isLoading = isProcessing || isChanging;

  const handleConfirmPayment = async () => {
    setError("");
    try {
      if (isNewUser || !user.subscriptionPlan) {
        // New user: process payment
        await processPayment({ planId }).unwrap();
      } else {
        // Existing user: change plan
        await changePlan({ newPlanId: planId }).unwrap();
      }
      setPaymentConfirmed(true);
      // Navigate to account page after 3 seconds
      setTimeout(() => {
        navigate(`/${MAIN_PATH.account}`);
      }, 3000);
    } catch (err: any) {
      setError(err?.data?.message || "An error occurred. Please try again.");
    }
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
      <Container maxWidth="sm" sx={{ pt: 4 }}>

        {/* User Info */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              mb: 1,
              textTransform: "uppercase",
            }}
          >
            {user.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {user.email}
          </Typography>
        </Box>

        {/* Payment Card */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: "#FFF5F5",
            border: "1px solid #E0E0E0",
          }}
        >
          {/* Payment Methods Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              mb: 3,
              pb: 2,
              borderBottom: "1px solid",
              borderColor: "#D0D0D0",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                MoMo
              </Typography>
            </Box>
            <Box
              sx={{
                width: 1,
                height: 30,
                bgcolor: "#D0D0D0",
              }}
            />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                VIETQR
              </Typography>
            </Box>
            <Box
              sx={{
                width: 1,
                height: 30,
                bgcolor: "#D0D0D0",
              }}
            />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                Napas 247
              </Typography>
            </Box>
          </Box>

          {/* QR Code */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 4,
            }}
          >
            <Box
              component="img"
              src="/assets/Payment_qr.jpeg"
              alt="Payment QR Code"
              sx={{
                width: "100%",
                maxWidth: 350,
                height: "auto",
                borderRadius: 2,
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Plan Details */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body1" sx={{ color: "#666" }}>
                Plan
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
                {selectedPlan.name}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body1" sx={{ color: "#666" }}>
                Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#e50914" }}>
                ${selectedPlan.price}
                <Typography component="span" variant="body2" sx={{ ml: 0.5, color: "#666" }}>
                  /month
                </Typography>
              </Typography>
            </Box>
          </Stack>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {paymentConfirmed && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ mb: 3 }}
            >
              Payment confirmed! Your subscription is pending approval. Redirecting...
            </Alert>
          )}

          {/* Confirm Payment Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleConfirmPayment}
            disabled={paymentConfirmed || isLoading}
            sx={{
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 600,
              bgcolor: "#e50914",
              "&:hover": {
                bgcolor: "#f40612",
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : paymentConfirmed ? (
              "Payment Confirmed"
            ) : (
              "I have completed the payment"
            )}
          </Button>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              color: "#666",
              mt: 2,
            }}
          >
            Please scan the QR code to complete your payment, then click the button above to
            confirm.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

Component.displayName = "PaymentCheckoutPage";

