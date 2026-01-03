import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { createNotificationForAllAdmins } from "../utils/createNotification.js";

// @desc    Check if email exists
// @route   GET /api/auth/check-email
// @access  Public
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    res.json({
      exists: !!user,
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      // Subscription fields remain null until payment
      subscriptionPlan: null,
      subscriptionStatus: null,
      paymentStatus: null,
    });

    if (user) {
      // Notify all admins about new user registration
      try {
        await createNotificationForAllAdmins({
          type: "user_registered",
          title: "New User Registered",
          message: `${user.name} (${user.email}) has just registered.`,
          metadata: {
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
          },
        });
        console.log(`✅ Notification sent to admins for new user ${user.email}`);
      } catch (notificationError) {
        console.error("⚠️ Failed to send notification to admins:", notificationError);
        // Don't fail the request if notification fails
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Please add email and password" });
    }

    // Check for user email
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        paymentStatus: user.paymentStatus,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      paymentStatus: user.paymentStatus,
      paymentDate: user.paymentDate,
      activatedAt: user.activatedAt,
      expiresAt: user.expiresAt,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
