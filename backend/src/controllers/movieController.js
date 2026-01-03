import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Outbox from "../models/Outbox.js";

// List movies (paginated)
export const listMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = search
      ? { title: { $regex: search, $options: "i" } }
      : {};

    const [items, total] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Movie.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("List movies error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Public list (for end users) - newest first, optional limit
export const listPublicMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const movies = await Movie.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(movies);
  } catch (err) {
    console.error("List public movies error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create or upsert by tmdbId, and notify users on new movie
export const createMovie = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const filter = payload.tmdbId ? { tmdbId: payload.tmdbId } : { title: payload.title };

    const session = await mongoose.startSession();
    let movie;
    let isNew = false;

    await session.withTransaction(async () => {
      // Check if exists to determine "new" for notification
      const existing = await Movie.findOne(filter).session(session);

      if (existing) {
        movie = await Movie.findOneAndUpdate(filter, { $set: payload }, { new: true, session });
      } else {
        movie = await Movie.create([{ ...payload }], { session });
        movie = movie[0];
        isNew = true;
      }

      if (isNew) {
        await Outbox.create(
          [
            {
              aggregateType: "movie",
              aggregateId: movie._id.toString(),
              eventType: "movie_added",
              payload: {
                movieId: movie._id.toString(),
                tmdbId: movie.tmdbId,
                title: movie.title,
                mediaType: movie.mediaType || "movie",
                target: "all-non-admin",
              },
            },
          ],
          { session }
        );
      }
    });

    res.status(201).json(movie);
  } catch (err) {
    console.error("Create movie error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update by id
export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (err) {
    console.error("Update movie error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete by id
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete movie error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

