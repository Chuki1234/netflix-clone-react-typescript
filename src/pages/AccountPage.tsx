import {
  Container,
  Typography,
  Box,
  Avatar,
  Divider,
  Stack,
  Paper,
  Grid,
  Chip,
  Button,
} from "@mui/material";
import { useAppSelector } from "src/hooks/redux";
import { selectCurrentUser } from "src/store/slices/authSlice";
import { selectMyList, selectLikedMovies } from "src/store/slices/userPreferences";
import { Navigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

export function Component() {
  const user = useAppSelector(selectCurrentUser);
  const myList = useAppSelector(selectMyList);
  const likedMovies = useAppSelector(selectLikedMovies);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={`/${MAIN_PATH.login}`} replace />;
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        px: { xs: "30px", sm: "60px" },
        pb: 4,
        pt: "150px",
        bgcolor: "inherit",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="h4" sx={{ color: "text.primary", mb: 4 }}>
        Account
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          bgcolor: "background.paper",
          borderRadius: 2,
          maxWidth: 800,
          width: "100%",
        }}
      >
        <Stack spacing={4}>
          {/* Avatar Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Avatar
              alt={user.name || "User"}
              src="/avatar.png"
              sx={{
                width: 100,
                height: 100,
                bgcolor: "primary.main",
                fontSize: "2.5rem",
              }}
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: "text.primary", mb: 1 }}>
                {user.name || "User"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Member
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* User Information */}
          <Box>
            <Typography variant="h6" sx={{ color: "text.primary", mb: 3 }}>
              Account Information
            </Typography>

            <Stack spacing={3}>
              {/* Name */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: 1,
                  }}
                >
                  Name
                </Typography>
                <Typography variant="body1" sx={{ color: "text.primary", mt: 0.5 }}>
                  {user.name || "Not set"}
                </Typography>
              </Box>

              {/* Email */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: 1,
                  }}
                >
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: "text.primary", mt: 0.5 }}>
                  {user.email}
                </Typography>
              </Box>

              {/* User ID */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: 1,
                  }}
                >
                  Account ID
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5, fontFamily: "monospace" }}
                >
                  {user._id}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Statistics */}
          <Box>
            <Typography variant="h6" sx={{ color: "text.primary", mb: 3 }}>
              Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "background.default",
                    borderRadius: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ color: "primary.main", mb: 1 }}>
                    {myList.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    My List
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "background.default",
                    borderRadius: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ color: "primary.main", mb: 1 }}>
                    {likedMovies.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Liked Movies
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Payment & Subscription */}
          <Box>
            <Typography variant="h6" sx={{ color: "text.primary", mb: 3 }}>
              Subscription
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: "background.default",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ color: "text.primary", mb: 0.5 }}>
                      {user.subscriptionPlan ? `${user.subscriptionPlan} Plan` : "Basic Plan"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {user.subscriptionPlan === "Premium" && "4K + HDR"}
                      {user.subscriptionPlan === "Standard" && "1080p"}
                      {(!user.subscriptionPlan || user.subscriptionPlan === "Basic") &&
                        "720p"}
                    </Typography>
                  </Box>
                  <Chip
                    label={user.subscriptionStatus || "Active"}
                    color={
                      (user.subscriptionStatus || "Active") === "Active"
                        ? "success"
                        : "default"
                    }
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    Monthly billing
                  </Typography>
                  <Typography variant="h5" sx={{ color: "text.primary" }}>
                    $
                    {user.subscriptionPlan === "Premium"
                      ? "15.99"
                      : user.subscriptionPlan === "Standard"
                      ? "9.99"
                      : "4.99"}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: "text.secondary", ml: 0.5 }}
                    >
                      /month
                    </Typography>
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  sx={{ mt: 2, alignSelf: "flex-start" }}
                  disabled
                >
                  Change Plan
                </Button>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Plan management features coming soon
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

Component.displayName = "AccountPage";

