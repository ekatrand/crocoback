import mongoose, { Document, Schema } from "mongoose";

/**
 * Interface for Waitlist document
 */
export interface IWaitlist extends Document {
  email: string;
  status: "pending" | "contacted" | "invited" | "declined";
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  notes?: string;
}

/**
 * Schema for the Waitlist model
 */
const WaitlistSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "invited", "declined"],
      default: "pending",
    },
    lastContactedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically create createdAt and updatedAt fields
  }
);

// Create and export the Waitlist model
export default mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);
