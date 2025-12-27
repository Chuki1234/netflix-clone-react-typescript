import mongoose from "mongoose";

const movieItemSchema = new mongoose.Schema(
  {
    movieId: {
      type: Number,
      required: true,
    },
    mediaType: {
      type: String,
      required: true,
      enum: ["movie", "tv"],
    },
  },
  { _id: false, timestamps: true }
);

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    myList: [
      {
        movieId: {
          type: Number,
          required: true,
        },
        mediaType: {
          type: String,
          required: true,
          enum: ["movie", "tv"],
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likedMovies: [
      {
        movieId: {
          type: Number,
          required: true,
        },
        mediaType: {
          type: String,
          required: true,
          enum: ["movie", "tv"],
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
userPreferencesSchema.index({ userId: 1 }, { unique: true });
userPreferencesSchema.index({ "myList.movieId": 1 });
userPreferencesSchema.index({ "likedMovies.movieId": 1 });

const UserPreferences = mongoose.model("UserPreferences", userPreferencesSchema);

export default UserPreferences;

