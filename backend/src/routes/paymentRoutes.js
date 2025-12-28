import express from "express";
import {
  processPayment,
  changePlan,
  getPaymentStatus,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/process", protect, processPayment);
router.post("/change-plan", protect, changePlan);
router.get("/status", protect, getPaymentStatus);

export default router;

