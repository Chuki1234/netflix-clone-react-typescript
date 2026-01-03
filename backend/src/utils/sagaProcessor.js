import { Saga } from "../models/index.js";
import User from "../models/User.js";
import { createNotificationForAllAdmins } from "./createNotification.js";

const SAGA_INTERVAL_MS = parseInt(process.env.SAGA_INTERVAL_MS || "5000", 10);
const SAGA_MAX_RETRIES = parseInt(process.env.SAGA_MAX_RETRIES || "5", 10);
const SAGA_BATCH_SIZE = parseInt(process.env.SAGA_BATCH_SIZE || "50", 10);

let sagaWorkerStarted = false;

async function stepMarkPending(context) {
  const { userId, planId } = context || {};
  if (!userId || !planId) throw new Error("Missing userId or planId");

  const validPlans = ["Mobile", "Basic", "Standard", "Premium"];
  if (!validPlans.includes(planId)) throw new Error("Invalid plan");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  user.subscriptionPlan = planId;
  user.subscriptionStatus = "pending";
  user.paymentStatus = "pending";
  user.paymentDate = new Date();
  user.expiresAt = expiresAt;

  await user.save();
}

async function stepNotifyAdmins(context) {
  const { userId, planId } = context || {};
  if (!userId || !planId) throw new Error("Missing userId or planId");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  await createNotificationForAllAdmins({
    type: "payment_pending",
    title: "New Payment Pending Approval",
    message: `${user.name} (${user.email}) has submitted a payment for ${planId} plan. Please review and approve.`,
    metadata: {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      subscriptionPlan: planId,
      paymentDate: user.paymentDate,
    },
  });
}

async function runStep(stepName, context) {
  switch (stepName) {
    case "mark_pending":
      await stepMarkPending(context);
      break;
    case "notify_admins":
      await stepNotifyAdmins(context);
      break;
    default:
      throw new Error(`Unknown saga step: ${stepName}`);
  }
}

async function processSagaBatch() {
  const now = new Date();
  const sagas = await Saga.find({
    status: { $in: ["PENDING", "RUNNING"] },
    availableAt: { $lte: now },
  })
    .sort({ createdAt: 1 })
    .limit(SAGA_BATCH_SIZE);

  for (const saga of sagas) {
    const nextStep = saga.steps.find((s) => s.status === "PENDING");
    if (!nextStep) {
      saga.status = "COMPLETED";
      saga.lastError = undefined;
      await saga.save();
      continue;
    }

    saga.status = "RUNNING";
    await saga.save();

    try {
      await runStep(nextStep.name, saga.context);
      nextStep.status = "DONE";
      nextStep.error = undefined;
      nextStep.updatedAt = new Date();
      saga.lastError = undefined;
      await saga.save();
    } catch (err) {
      nextStep.status = "FAILED";
      nextStep.error = err.message;
      saga.lastError = err.message;
      saga.retryCount += 1;
      saga.status = saga.retryCount > SAGA_MAX_RETRIES ? "FAILED" : "PENDING";
      saga.availableAt = new Date(Date.now() + Math.min(60000, 2000 * saga.retryCount));
      await saga.save();
    }
  }
}

export function startSagaWorker() {
  if (sagaWorkerStarted) return;
  sagaWorkerStarted = true;
  setInterval(() => {
    processSagaBatch().catch((err) => console.error("Saga worker error:", err));
  }, SAGA_INTERVAL_MS);
}

export { processSagaBatch };

