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
  ListItemIcon,
  ListItemText,
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

interface NotificationMenuProps {
  authenticated: boolean;
}

export default function NotificationMenu({ authenticated }: NotificationMenuProps) {
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
    if (!notification.read) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
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
            width: 360,
            maxHeight: 500,
            mt: 1.5,
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
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
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
                  py: 1.5,
                  px: 2,
                  backgroundColor: notification.read
                    ? "transparent"
                    : "action.hover",
                  "&:hover": {
                    backgroundColor: "action.selected",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {!notification.read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                      }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.read ? 400 : 600,
                        mb: 0.5,
                      }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem" }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem", mt: 0.5, display: "block" }}
                      >
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleDelete(e, notification._id)}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
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

