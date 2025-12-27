#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";

// Load env vars
dotenv.config();

const testConnection = async () => {
  try {
    console.log("🔌 Testing MongoDB connection...");
    console.log(`📍 Connection string: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//****:****@") : "NOT SET"}\n`);

    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set in .env file");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`\n🎉 Connection test passed! You can now run 'npm run dev'\n`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Connection failed:`);
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes("authentication")) {
      console.log("💡 Tip: Check your username and password in MONGODB_URI");
    } else if (error.message.includes("IP")) {
      console.log("💡 Tip: Make sure your IP is whitelisted in Network Access");
    } else if (error.message.includes("ENOTFOUND")) {
      console.log("💡 Tip: Check your cluster name in connection string");
    }
    
    process.exit(1);
  }
};

testConnection();

