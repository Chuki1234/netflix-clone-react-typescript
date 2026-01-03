import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, index: true, unique: true, sparse: true },
    title: { type: String, required: true, index: true },
    overview: { type: String },
    posterPath: { type: String },
    backdropPath: { type: String },
    mediaType: { type: String, enum: ["movie", "tv"], default: "movie" },
    releaseDate: { type: String },
    genres: [{ id: Number, name: String }],
    voteAverage: { type: Number },
    voteCount: { type: Number },
    runtime: { type: Number },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;

