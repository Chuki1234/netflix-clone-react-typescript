import { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
  Stack,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import Logo from "src/components/Logo";
import { MAIN_PATH } from "src/constant";
import { useLoginMutation } from "src/store/slices/authApiSlice";
import { setCredentials } from "src/store/slices/authSlice";
import { useAppDispatch } from "src/hooks/redux";

export function Component() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  // Get email from URL params and set it
  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Determine if input is email or phone number
    const isEmail = email.includes("@");
    const emailOrPhone = isEmail ? email : `${email}@phone.netflix`;

    try {
      const result = await login({ email: emailOrPhone, password }).unwrap();
      dispatch(
        setCredentials({
          user: {
            _id: result._id,
            name: result.name,
            email: result.email,
            role: result.role,
            subscriptionPlan: result.subscriptionPlan,
            subscriptionStatus: result.subscriptionStatus,
            paymentStatus: result.paymentStatus,
          },
          token: result.token,
        })
      );
      
      // Check if user is admin
      if (result.role === "admin") {
        // Admin always goes to home, no payment needed
        navigate(`/${MAIN_PATH.browse}`);
      } else {
        // Regular user flow
        // Check subscription status
        // Only redirect to payment if user has NO subscription at all
        // If user has subscription (even pending), allow access to home
        if (!result.subscriptionPlan && !result.subscriptionStatus) {
          // No subscription at all, redirect to payment
          navigate(`/${MAIN_PATH.payment}?newUser=true`);
        } else {
          // User has subscription (active, pending, etc.) - go to home
          navigate(`/${MAIN_PATH.browse}`);
        }
      }
    } catch (err: any) {
      setError(err?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.8) 100%), url('/assets/netflix_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        },
      }}
    >
      {/* Header with Logo */}
      <Box sx={{ px: { xs: 2, sm: 4 }, pt: 2, position: "relative", zIndex: 1 }}>
        <Logo to="/" />
      </Box>

      {/* Login Form */}
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 450,
            bgcolor: "rgba(0, 0, 0, 0.75)",
            borderRadius: 1,
            px: { xs: 3, sm: 5 },
            py: 5,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "text.primary",
              fontWeight: 700,
              mb: 4,
            }}
          >
            Đăng nhập
          </Typography>

          {error && (
            <Box
              sx={{
                bgcolor: "error.dark",
                color: "error.main",
                p: 1.5,
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}

          <Stack spacing={3}>
            <TextField
              fullWidth
              placeholder="Email hoặc số điện thoại di động"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "white",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  color: "white",
                  py: 1.5,
                  "&::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 1,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              placeholder="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "white",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  color: "white",
                  py: 1.5,
                  "&::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 1,
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                bgcolor: "#e50914",
                "&:hover": {
                  bgcolor: "#f40612",
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "Đăng nhập"}
            </Button>
          </Stack>

          {/* Remember me and Forgot password */}
          <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: "white",
                    "&.Mui-checked": {
                      color: "#e50914",
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "white" }}>
                  Ghi nhớ tôi
                </Typography>
              }
            />
            <Link
              component={RouterLink}
              to="#"
              sx={{
                color: "white",
                textDecoration: "none",
                fontSize: "0.875rem",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Bạn quên mật khẩu?
            </Link>
          </Box>

          {/* Sign up link */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Typography variant="body2" sx={{ color: "white" }}>
                Bạn mới sử dụng Netflix?
              </Typography>
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 700,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Đăng ký ngay.
              </Link>
            </Stack>
          </Box>

          {/* reCAPTCHA notice */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.75rem",
                display: "block",
                textAlign: "center",
              }}
            >
              Trang này được Google reCAPTCHA bảo vệ để đảm bảo bạn không phải là robot.
            </Typography>
            <Link
              href="https://www.google.com/recaptcha/about/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "#0071eb",
                textDecoration: "none",
                fontSize: "0.75rem",
                display: "block",
                textAlign: "center",
                mt: 0.5,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Tìm hiểu thêm.
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

Component.displayName = "LoginPage";

