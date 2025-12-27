import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
    mediaType: {
      type: String,
      required: true,
      enum: ["movie", "tv"],
    },
    progress: {
      type: Number,
      default: 0, // seconds watched
      min: 0,
    },
    duration: {
      type: Number,
      default: 0, // total duration in seconds
      min: 0,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one user can only have one watch history per movie
watchHistorySchema.index({ userId: 1, movieId: 1, mediaType: 1 }, { unique: true });
watchHistorySchema.index({ userId: 1, lastWatchedAt: -1 }); // For sorting by last watched

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

export default WatchHistory;

