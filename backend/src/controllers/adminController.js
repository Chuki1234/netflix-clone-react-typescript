import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Please add email and password" });
    }

    // Check for admin user
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Check password
    if (await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter options
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.subscriptionStatus) {
      filter.subscriptionStatus = req.query.subscriptionStatus;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user subscription (approve/reject/activate)
// @route   PUT /api/admin/users/:id/subscription
// @access  Private/Admin
export const updateUserSubscription = async (req, res) => {
  try {
    const { action, subscriptionStatus, paymentStatus } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (action === "approve") {
      // Approve payment and activate subscription
      user.subscriptionStatus = "active";
      user.paymentStatus = "confirmed";
      user.activatedAt = new Date();
      
      // Calculate expiration date (30 days from activation)
      if (!user.expiresAt || user.expiresAt < new Date()) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        user.expiresAt = expiresAt;
      }
    } else if (action === "reject") {
      // Reject payment
      user.subscriptionStatus = "inactive";
      user.paymentStatus = "failed";
    } else if (action === "cancel") {
      // Cancel subscription
      user.subscriptionStatus = "cancelled";
    } else if (action === "update") {
      // Manual update
      if (subscriptionStatus) {
        user.subscriptionStatus = subscriptionStatus;
      }
      if (paymentStatus) {
        user.paymentStatus = paymentStatus;
      }
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await user.save();

    res.json({
      success: true,
      message: `Subscription ${action}ed successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        paymentStatus: user.paymentStatus,
        paymentDate: user.paymentDate,
        activatedAt: user.activatedAt,
        expiresAt: user.expiresAt,
      },
    });
  } catch (error) {
    console.error("Update user subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get pending payments
// @route   GET /api/admin/payments/pending
// @access  Private/Admin
export const getPendingPayments = async (req, res) => {
  try {
    const users = await User.find({
      paymentStatus: "pending",
      subscriptionStatus: "pending",
    })
      .select("-password")
      .sort({ paymentDate: -1 });

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get pending payments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await User.countDocuments({
      subscriptionStatus: "active",
    });
    const pendingPayments = await User.countDocuments({
      paymentStatus: "pending",
    });
    const totalRevenue = await User.aggregate([
      {
        $match: {
          paymentStatus: "confirmed",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$subscriptionPlan", "Mobile"] }, then: 70000 },
                  { case: { $eq: ["$subscriptionPlan", "Basic"] }, then: 180000 },
                  { case: { $eq: ["$subscriptionPlan", "Standard"] }, then: 220000 },
                  { case: { $eq: ["$subscriptionPlan", "Premium"] }, then: 260000 },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ]);

    const planDistribution = await User.aggregate([
      {
        $match: {
          subscriptionPlan: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$subscriptionPlan",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalUsers,
      activeSubscriptions,
      pendingPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      planDistribution,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

