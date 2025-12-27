import express from "express";
import {
  getWatchHistory,
  getContinueWatching,
  getMovieWatchHistory,
  saveWatchHistory,
  markAsCompleted,
  deleteWatchHistory,
} from "../controllers/watchHistoryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", getWatchHistory);
router.get("/continue", getContinueWatching);
router.get("/:movieId/:mediaType", getMovieWatchHistory);
router.post("/", saveWatchHistory);
router.put("/:movieId/:mediaType/complete", markAsCompleted);
router.delete("/:movieId/:mediaType", deleteWatchHistory);

export default router;

