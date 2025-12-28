import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Movie as MovieIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { MAIN_PATH } from "src/constant";
import Logo from "../Logo";

const drawerWidth = 240;

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant?: "permanent" | "persistent" | "temporary";
}

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: `/${MAIN_PATH.adminDashboard}`,
  },
  {
    text: "Account Management",
    icon: <PeopleIcon />,
    path: `/${MAIN_PATH.adminDashboard}/accounts`,
  },
  {
    text: "Movie Management",
    icon: <MovieIcon />,
    path: `/${MAIN_PATH.adminDashboard}/movies`,
  },
  {
    text: "Category Management",
    icon: <CategoryIcon />,
    path: `/${MAIN_PATH.adminDashboard}/categories`,
  },
];

export default function AdminSidebar({
  open = true,
  onClose,
  variant = "permanent",
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === "temporary" && onClose) {
      onClose();
    }
  };

  const drawerContent = (
    <div>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: [1],
          minHeight: "64px !important",
        }}
      >
        <Logo to={`/${MAIN_PATH.browse}`} />
      </Toolbar>
      <Box sx={{ py: 1 }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === `/${MAIN_PATH.adminDashboard}` && location.pathname === `/${MAIN_PATH.adminDashboard}`);
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    py: 1.5,
                    "&.Mui-selected": {
                      backgroundColor: "action.selected",
                      "&:hover": {
                        backgroundColor: "action.selected",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                      "& .MuiListItemText-primary": {
                        fontWeight: 600,
                        color: "primary.main",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "primary.main" : "text.secondary",
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.95rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </div>
  );

  if (variant === "permanent") {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            position: "relative",
            height: "100%",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

