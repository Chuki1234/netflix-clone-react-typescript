import express from "express";
import { protect } from "../middleware/auth.js";
import { admin } from "../middleware/admin.js";
import {
  listMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../controllers/movieController.js";

const router = express.Router();

router.use(protect, admin);

router.get("/", listMovies);
router.post("/", createMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

export default router;

