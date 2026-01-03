import { Outbox, Notification, User } from "../models/index.js";

const WORKER_INTERVAL_MS = parseInt(process.env.OUTBOX_INTERVAL_MS || "5000", 10);
const MAX_RETRIES = parseInt(process.env.OUTBOX_MAX_RETRIES || "5", 10);
const BATCH_SIZE = parseInt(process.env.OUTBOX_BATCH_SIZE || "50", 10);

let workerStarted = false;

async function handleMovieAdded(payload) {
  const { movieId, tmdbId, title, mediaType = "movie" } = payload || {};
  if (!movieId || !title) return;

  const users = await User.find({ role: { $ne: "admin" } }).select("_id");
  if (!users.length) return;

  const docs = users.map((u) => ({
    userId: u._id,
    type: "movie_updated",
    title: "New movie available",
    message: `We just added "${title}". Check it out!`,
    metadata: { movieId, tmdbId, mediaType },
  }));

  await Notification.insertMany(docs, { ordered: false });
}

async function processOutboxBatch() {
  const now = new Date();
  const items = await Outbox.find({
    status: "PENDING",
    availableAt: { $lte: now },
  })
    .sort({ createdAt: 1 })
    .limit(BATCH_SIZE);

  for (const item of items) {
    try {
      switch (item.eventType) {
        case "movie_added":
          await handleMovieAdded(item.payload);
          break;
        default:
          // Unknown event types are skipped but marked sent to avoid blocking
          console.warn(`Outbox: unhandled eventType ${item.eventType}`);
      }

      item.status = "SENT";
      item.error = undefined;
      await item.save();
    } catch (error) {
      item.retries += 1;
      item.status = item.retries > MAX_RETRIES ? "FAILED" : "PENDING";
      item.error = error.message;

      // simple backoff: retry sooner early, slower later
      const delay = Math.min(60000, 2000 * item.retries);
      item.availableAt = new Date(Date.now() + delay);
      await item.save();
      console.error("Outbox processing error:", error);
    }
  }
}

export function startOutboxWorker() {
  if (workerStarted) return;
  workerStarted = true;

  // fire-and-forget interval worker
  setInterval(() => {
    processOutboxBatch().catch((err) => console.error("Outbox worker error:", err));
  }, WORKER_INTERVAL_MS);
}

// Exported for manual triggering/testing
export { processOutboxBatch };

