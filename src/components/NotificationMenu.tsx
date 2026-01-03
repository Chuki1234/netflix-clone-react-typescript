import * as React from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  Notification,
} from "src/store/slices/notificationApiSlice";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MAIN_PATH } from "src/constant";
import { useAppSelector } from "src/hooks/redux";
import { selectCurrentUser } from "src/store/slices/authSlice";

interface NotificationMenuProps {
  authenticated: boolean;
}

export default function NotificationMenu({ authenticated }: NotificationMenuProps) {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Fetch notifications and unread count
  const { data: notificationsData, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 10 },
    { skip: !authenticated || !open }
  );
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !authenticated,
    pollingInterval: 30000, // Poll every 30 seconds for new notifications
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.notifications || [];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Close the menu
    handleClose();

    // Navigate based on notification type
    if (notification.type === "movie_updated") {
      navigate(`/${MAIN_PATH.news}`);
      return;
    }
    if (user?.role === "admin" && (notification.type === "user_registered" || notification.type === "payment_pending")) {
      navigate(`/${MAIN_PATH.adminDashboard}/accounts`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId).unwrap();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  if (!authenticated) {
    return null;
  }

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ position: "relative" }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 600,
            mt: 1.5,
            overflowX: "hidden",
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              startIcon={<CheckCircleIcon />}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 480, overflowY: "auto", overflowX: "hidden" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 2,
                  px: 2,
                  backgroundColor: notification.read
                    ? "transparent"
                    : "action.hover",
                  "&:hover": {
                    backgroundColor: "action.selected",
                  },
                  flexDirection: "column",
                  alignItems: "flex-start",
                  position: "relative",
                }}
              >
                <Box sx={{ display: "flex", width: "100%", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ minWidth: 32, mt: 0.5, display: "flex", alignItems: "flex-start" }}>
                    {!notification.read && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.read ? 500 : 700,
                        mb: 0.75,
                        color: notification.read ? "text.primary" : "text.primary",
                        wordBreak: "break-word",
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: "0.875rem",
                        mb: 1,
                        wordBreak: "break-word",
                        whiteSpace: "normal",
                        lineHeight: 1.5,
                        display: "block",
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: "0.75rem",
                        display: "block",
                      }}
                    >
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(e, notification._id)}
                    sx={{
                      mt: -0.5,
                      color: "text.secondary",
                      "&:hover": {
                        color: "error.main",
                        backgroundColor: "error.light",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
        {notifications.length > 0 && notificationsData && notificationsData.pagination.pages > 1 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Showing {notifications.length} of {notificationsData.pagination.total}
              </Typography>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}

