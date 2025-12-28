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
  CircularProgress,
} from "@mui/material";
import Logo from "src/components/Logo";
import { MAIN_PATH } from "src/constant";
import { useRegisterMutation } from "src/store/slices/authApiSlice";
import { setCredentials } from "src/store/slices/authSlice";
import { useAppDispatch } from "src/hooks/redux";

export function Component() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [register, { isLoading }] = useRegisterMutation();

  // Get email from URL params and set it
  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setFormData((prev) => ({
        ...prev,
        emailOrPhone: emailFromUrl,
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.emailOrPhone || !formData.password || !formData.confirmPassword || !formData.name) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Check if password confirmation matches
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    // Determine if input is email or phone number
    const isEmail = formData.emailOrPhone.includes("@");
    const email = isEmail ? formData.emailOrPhone : `${formData.emailOrPhone}@phone.netflix`;

    try {
      const result = await register({
        name: formData.name,
        email: email,
        password: formData.password,
      }).unwrap();
      dispatch(
        setCredentials({
          user: {
            _id: result._id,
            name: result.name,
            email: result.email,
            subscriptionPlan: result.subscriptionPlan,
            subscriptionStatus: result.subscriptionStatus,
          },
          token: result.token,
        })
      );
      // New user must select a plan
      navigate(`/${MAIN_PATH.payment}?newUser=true`);
    } catch (err: any) {
      setError(err?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
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

      {/* Register Form */}
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
            Đăng ký
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
              label="Tên của bạn"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiOutlinedInput-input": {
                  color: "white",
                },
              }}
            />

            <TextField
              fullWidth
              label="Email hoặc số điện thoại"
              type="text"
              name="emailOrPhone"
              value={formData.emailOrPhone}
              onChange={handleChange}
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
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiOutlinedInput-input": {
                  color: "white",
                },
              }}
            />

            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiOutlinedInput-input": {
                  color: "white",
                },
                "& .MuiFormHelperText-root": {
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
            />

            <TextField
              fullWidth
              label="Xác nhận mật khẩu"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
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
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiOutlinedInput-input": {
                  color: "white",
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
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "Đăng ký"}
            </Button>
          </Stack>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Đã có tài khoản?
              </Typography>
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Đăng nhập ngay
              </Link>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

Component.displayName = "RegisterPage";

