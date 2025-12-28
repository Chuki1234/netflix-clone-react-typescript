import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Typography,
} from "@mui/material";
import {
  Home as HomeIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  Devices as DevicesIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { MAIN_PATH } from "src/constant";

const menuItems = [
  {
    text: "Overview",
    icon: <HomeIcon />,
    path: `/${MAIN_PATH.account}`,
    id: "overview",
  },
  {
    text: "Membership",
    icon: <CreditCardIcon />,
    path: `/${MAIN_PATH.account}/membership`,
    id: "membership",
  },
  {
    text: "Security",
    icon: <SecurityIcon />,
    path: `/${MAIN_PATH.account}/security`,
    id: "security",
  },
  {
    text: "Devices",
    icon: <DevicesIcon />,
    path: `/${MAIN_PATH.account}/devices`,
    id: "devices",
  },
  {
    text: "Profiles",
    icon: <PersonIcon />,
    path: `/${MAIN_PATH.account}/profiles`,
    id: "profiles",
  },
];

interface AccountSidebarProps {
  onNavigate?: (path: string) => void;
}

export default function AccountSidebar({ onNavigate }: AccountSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleBackToNetflix = () => {
    navigate(`/${MAIN_PATH.browse}`);
  };

  // Determine active menu based on current path
  const getActiveId = () => {
    const path = location.pathname;
    if (path === `/${MAIN_PATH.account}` || path === `/${MAIN_PATH.account}/overview`) {
      return "overview";
    }
    const menuItem = menuItems.find((item) => path.startsWith(item.path));
    return menuItem?.id || "overview";
  };

  const activeId = getActiveId();

  return (
    <Box
      sx={{
        width: 240,
        minHeight: "100vh",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Back to Netflix Button */}
      <Box sx={{ p: 2 }}>
        <Button
          onClick={handleBackToNetflix}
          startIcon={<span>←</span>}
          sx={{
            textTransform: "none",
            color: "text.primary",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          Back to Netflix
        </Button>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigation(item.path)}
                sx={{
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
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

