#!/usr/bin/env node

import crypto from "crypto";

// Generate a random JWT secret
const jwtSecret = crypto.randomBytes(64).toString("hex");

console.log("\n✅ JWT Secret generated successfully!\n");
console.log("Copy this secret and add it to your .env file:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`JWT_SECRET=${jwtSecret}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

