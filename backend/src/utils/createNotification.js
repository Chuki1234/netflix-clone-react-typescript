import Notification from "../models/Notification.js";

/**
 * Helper function to create notifications
 * @param {Object} params
 * @param {String} params.userId - User ID to send notification to
 * @param {String} params.type - Notification type (payment_approved, movie_updated, user_registered)
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.metadata - Additional metadata (optional)
 */
export const createNotification = async ({ userId, type, title, message, metadata = {} }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      metadata,
    });
    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
};

/**
 * Helper function to create notifications for all admin users
 */
export const createNotificationForAllAdmins = async ({ type, title, message, metadata = {} }) => {
  try {
    const { User } = await import("../models/index.js");
    const admins = await User.find({ role: "admin" }).select("_id");
    
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      type,
      title,
      message,
      metadata,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Create notification for all admins error:", error);
    throw error;
  }
};

/**
 * Helper function to create notifications for all users (for movie updates)
 * Usage: When admin adds/updates a movie, call this function to notify all users
 * 
 * Example:
 * await createNotificationForAllUsers({
 *   type: "movie_updated",
 *   title: "New Movie Added",
 *   message: "A new movie has been added: [Movie Title]",
 *   metadata: { movieId: "123", movieTitle: "Example Movie" }
 * });
 */
export const createNotificationForAllUsers = async ({ type, title, message, metadata = {} }) => {
  try {
    const { User } = await import("../models/index.js");
    const users = await User.find({ role: "user" }).select("_id");
    
    const notifications = users.map((user) => ({
      userId: user._id,
      type,
      title,
      message,
      metadata,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Create notification for all users error:", error);
    throw error;
  }
};

