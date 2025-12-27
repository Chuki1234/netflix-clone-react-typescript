import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Stack,
  AppBar,
  Toolbar,
} from "@mui/material";
import Logo from "src/components/Logo";
import { MAIN_PATH } from "src/constant";

export function Component() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    // Navigate to login page with email as query parameter
    navigate(`/${MAIN_PATH.login}?email=${encodeURIComponent(email)}`);
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
      {/* Header with Logo and Login Button */}
      <AppBar
        sx={{
          bgcolor: "transparent",
          boxShadow: 0,
          position: "absolute",
          top: 0,
          width: "100%",
          zIndex: 10,
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, sm: 4 },
            justifyContent: "space-between",
          }}
        >
          <Logo to="/" />
          <Button
            variant="contained"
            onClick={() => navigate(`/${MAIN_PATH.login}`)}
            sx={{
              bgcolor: "#e50914",
              "&:hover": {
                bgcolor: "#f40612",
              },
              fontWeight: 500,
            }}
          >
            Đăng nhập
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: { xs: 2, sm: 4 },
          py: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Stack spacing={4} sx={{ width: "100%", maxWidth: 900 }}>
          <Typography
            variant="h2"
            sx={{
              color: "text.primary",
              fontWeight: 700,
              fontSize: { xs: "2rem", sm: "3rem", md: "4rem" },
            }}
          >
            Phim, series không giới hạn và nhiều nội dung khác
          </Typography>

          <Typography
            variant="h5"
            sx={{
              color: "text.primary",
              fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
            }}
          >
            Giá từ 74.000 đ. Hủy bất kỳ lúc nào.
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: "text.primary",
              fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
              mb: 2,
            }}
          >
            Bạn đã sẵn sàng xem chưa? Nhập email để tạo hoặc kích hoạt lại tư cách thành viên
            của bạn.
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              maxWidth: 900,
              width: "100%",
              mx: "auto",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Địa chỉ email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 auto" },
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    borderWidth: 2,
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.6)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "white",
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.5) inset",
                    WebkitTextFillColor: "white",
                    caretColor: "white",
                    transition: "background-color 5000s ease-in-out 0s",
                  },
                  "& input:-webkit-autofill:hover": {
                    WebkitBoxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.5) inset",
                    WebkitTextFillColor: "white",
                  },
                  "& input:-webkit-autofill:focus": {
                    WebkitBoxShadow: "0 0 0 1000px rgba(0, 0, 0, 0.5) inset",
                    WebkitTextFillColor: "white",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  py: 1.5,
                  fontSize: "1rem",
                  "&::placeholder": {
                    color: "rgba(255, 255, 255, 0.9)",
                    opacity: 1,
                    fontWeight: 400,
                  },
                },
                "& .MuiOutlinedInput-root:focus-within": {
                  outline: "none",
                  "& fieldset": {
                    outline: "none",
                  },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#e50914",
                "&:hover": {
                  bgcolor: "#f40612",
                },
                fontWeight: 600,
                fontSize: "1.125rem",
                px: { xs: 4, sm: 6 },
                py: 1.5,
                width: { xs: "100%", sm: "auto" },
                minWidth: { xs: "100%", sm: 200 },
                whiteSpace: "nowrap",
              }}
            >
              BẮT ĐẦU
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

Component.displayName = "LandingPage";


