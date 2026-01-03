import express from "express";
import { listPublicMovies } from "../controllers/movieController.js";

const router = express.Router();

// Public endpoint to list newest movies
router.get("/", listPublicMovies);

export default router;

