import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email or phone number"],
      unique: true,
      lowercase: true,
      trim: true,
      // Allow email format or phone number format (phone numbers will be stored as phone@phone.netflix)
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Subscription fields
    subscriptionPlan: {
      type: String,
      enum: ["Mobile", "Basic", "Standard", "Premium"],
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["pending", "active", "inactive", "cancelled"],
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: null,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

