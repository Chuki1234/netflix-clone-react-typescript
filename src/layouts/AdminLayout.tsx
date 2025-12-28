import { Outlet, Navigate } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import AdminSidebar from "src/components/layouts/AdminSidebar";
import { useAppSelector } from "src/hooks/redux";
import { selectCurrentUser } from "src/store/slices/authSlice";
import { MAIN_PATH } from "src/constant";

export default function AdminLayout() {
  const user = useAppSelector(selectCurrentUser);

  // Redirect if not authenticated or not admin
  if (!user) {
    return <Navigate to={`/${MAIN_PATH.login}`} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to={`/${MAIN_PATH.browse}`} replace />;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AdminSidebar variant="permanent" />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - 240px)` },
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ p: 4, maxWidth: "1400px", mx: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

