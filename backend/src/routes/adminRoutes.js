import express from "express";
import {
  adminLogin,
  getAllUsers,
  getUserById,
  updateUserSubscription,
  getPendingPayments,
  getDashboardStats,
} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";

const router = express.Router();

// Admin login (public)
router.post("/login", adminLogin);

// All routes below require admin authentication
router.get("/stats", protect, admin, getDashboardStats);
router.get("/users", protect, admin, getAllUsers);
router.get("/users/:id", protect, admin, getUserById);
router.put("/users/:id/subscription", protect, admin, updateUserSubscription);
router.get("/payments/pending", protect, admin, getPendingPayments);

export default router;

