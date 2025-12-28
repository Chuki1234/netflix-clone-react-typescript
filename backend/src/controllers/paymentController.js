import User from "../models/User.js";

// @desc    Process new subscription payment
// @route   POST /api/payment/process
// @access  Private
export const processPayment = async (req, res) => {
  try {
    const { planId, paymentMethod, paymentInfo } = req.body;

    // Validation
    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }

    const validPlans = ["Mobile", "Basic", "Standard", "Premium"];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update user subscription
    user.subscriptionPlan = planId;
    user.subscriptionStatus = "pending";
    user.paymentStatus = "pending";
    user.paymentDate = new Date();
    user.expiresAt = expiresAt;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Payment received. Waiting for admin approval.",
      subscription: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        paymentStatus: user.paymentStatus,
        paymentDate: user.paymentDate,
        expiresAt: user.expiresAt,
      },
    });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Change subscription plan
// @route   POST /api/payment/change-plan
// @access  Private
export const changePlan = async (req, res) => {
  try {
    const { newPlanId, paymentMethod, paymentInfo } = req.body;

    // Validation
    if (!newPlanId) {
      return res.status(400).json({ message: "New plan ID is required" });
    }

    const validPlans = ["Mobile", "Basic", "Standard", "Premium"];
    if (!validPlans.includes(newPlanId)) {
      return res.status(400).json({ message: "Invalid plan ID" });
    }

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has this plan
    if (user.subscriptionPlan === newPlanId) {
      return res.status(400).json({
        message: "You are already subscribed to this plan",
      });
    }

    // Check if current subscription is active
    if (user.subscriptionStatus !== "active") {
      return res.status(400).json({
        message: "Your current subscription is not active. Please activate it first.",
      });
    }

    const oldPlan = user.subscriptionPlan;

    // Calculate new expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update user subscription (set to pending for admin approval)
    user.subscriptionPlan = newPlanId;
    user.subscriptionStatus = "pending";
    user.paymentStatus = "pending";
    user.paymentDate = new Date();
    user.expiresAt = expiresAt;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Plan change request submitted. Waiting for admin approval.",
      subscription: {
        oldPlan,
        newPlan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        paymentStatus: user.paymentStatus,
        paymentDate: user.paymentDate,
        expiresAt: user.expiresAt,
      },
    });
  } catch (error) {
    console.error("Change plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get payment/subscription status
// @route   GET /api/payment/status
// @access  Private
export const getPaymentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      paymentStatus: user.paymentStatus,
      paymentDate: user.paymentDate,
      activatedAt: user.activatedAt,
      expiresAt: user.expiresAt,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

