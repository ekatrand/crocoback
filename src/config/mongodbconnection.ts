import mongoose from "mongoose";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGO_DB_CROCO_URI || "";

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error(
        "MONGO_DB_CROCO_URI is not defined in environment variables"
      );
    }
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("🔌 MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB connection error:", err);
});

// Close MongoDB connection when app terminates
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed due to app termination");
  process.exit(0);
});

export default connectDB;
