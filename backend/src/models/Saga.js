import mongoose from "mongoose";

const sagaStepSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "DONE", "FAILED"],
      default: "PENDING",
    },
    error: { type: String },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const sagaSchema = new mongoose.Schema(
  {
    sagaType: { type: String, required: true }, // e.g., "subscription_activation"
    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    steps: { type: [sagaStepSchema], default: [] },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    retryCount: { type: Number, default: 0 },
    availableAt: { type: Date, default: Date.now, index: true },
    lastError: { type: String },
  },
  { timestamps: true }
);

sagaSchema.index({ status: 1, availableAt: 1, createdAt: 1 });

const Saga = mongoose.model("Saga", sagaSchema);

export default Saga;

