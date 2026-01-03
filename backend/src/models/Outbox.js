import mongoose from "mongoose";

const outboxSchema = new mongoose.Schema(
  {
    aggregateType: { type: String, required: true }, // e.g., "movie"
    aggregateId: { type: String, required: true }, // e.g., movie._id
    eventType: { type: String, required: true }, // e.g., "movie_added"
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
      index: true,
    },
    retries: { type: Number, default: 0 },
    availableAt: { type: Date, default: Date.now, index: true },
    error: { type: String },
  },
  { timestamps: true }
);

// Fast lookup for pending items
outboxSchema.index({ status: 1, availableAt: 1, createdAt: 1 });

const Outbox = mongoose.model("Outbox", outboxSchema);

export default Outbox;

