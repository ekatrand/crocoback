import mongoose, { Document, Schema } from "mongoose";

export interface IExample extends Document {
  name: string;
  description: string;
  createdAt: Date;
}

const ExampleSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IExample>("Example", ExampleSchema);
