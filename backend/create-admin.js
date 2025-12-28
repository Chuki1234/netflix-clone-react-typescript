#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./src/config/database.js";
import User from "./src/models/User.js";

// Load env vars
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    const email = process.argv[2] || "admin@netflix.com";
    const password = process.argv[3] || "admin123";
    const name = process.argv[4] || "Admin User";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = "admin";
      existingAdmin.name = name;
      // Update password (will be hashed by pre-save hook)
      existingAdmin.password = password;
      await existingAdmin.save();
      console.log(`✅ Updated existing user to admin:`);
      console.log(`   Email: ${email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Password: ${password}`);
    } else {
      // Create new admin user
      const admin = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: "admin",
      });

      console.log(`✅ Admin user created successfully:`);
      console.log(`   Email: ${email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Password: ${password}`);
      console.log(`   ID: ${admin._id}`);
    }

    console.log(`\n🎉 You can now login at: http://localhost:5173/admin/login`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();

