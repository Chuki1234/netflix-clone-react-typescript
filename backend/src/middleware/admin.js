import { protect } from "./auth.js";

// Admin middleware - must be used after protect middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

// Combined protect + admin middleware
export const protectAdmin = [protect, admin];

