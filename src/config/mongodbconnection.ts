import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_DB_CROCO_URI;

if (!MONGODB_URI) {
  console.error("❌ No MongoDB URI found in environment variables!");
  process.exit(1);
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("🔌 MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB connection error:", err);
});

export default connectDB;
