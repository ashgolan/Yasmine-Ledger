import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingUser = await User.findOne({ username: process.env.ADMIN_USERNAME });

    if (existingUser) {
      console.log("Admin user already exists.");
      await mongoose.connection.close();
      process.exit(0);
    }

    const user = await User.create({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      lockCode: process.env.ADMIN_LOCK_CODE,
      role: "admin",
    });

    console.log(`Admin created: ${user.username}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed admin error:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();