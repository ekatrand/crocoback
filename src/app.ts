import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/mongodbconnection"; // Import your MongoDB connection function

// Import routes
import partsRoutes from "./routes/parts";
import waitlistRoutes from "./routes/waitlist";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 4040;
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security middlewares
app.use(helmet()); // Secure HTTP headers
app.use(
  cors({
    origin: (origin, callback) => {
      // Get allowed origins from env and trim whitespace
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
        o.trim()
      ) || ["http://localhost:3000"];

      // No origin (like curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`Origin ${origin} not allowed by CORS`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(hpp()); // Protect against HTTP Parameter Pollution

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// General middlewares
app.use(morgan("dev")); // Logging
app.use(compression()); // Compress responses
app.use(express.json({ limit: "10kb" })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// API Routes - Direct implementation without additional middleware

// API Routes
app.use("/api/parts", partsRoutes);
app.use("/api/waitlist", waitlistRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
