import express from "express";
import {
  getPreferences,
  toggleMyList,
  toggleLike,
  checkMyList,
  checkLike,
} from "../controllers/preferencesController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", getPreferences);
router.post("/my-list", toggleMyList);
router.post("/likes", toggleLike);
router.get("/my-list/:movieId/:mediaType", checkMyList);
router.get("/likes/:movieId/:mediaType", checkLike);

export default router;

