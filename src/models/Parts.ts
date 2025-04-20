import mongoose, { Document, Schema } from "mongoose";

export interface IPartDocumentation {
  type: string;
  value: string;
  dateAdded: Date;
  fileReferences?: string[];
  answeredBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPart extends Document {
  partNumber: string;
  alternativePartNumbers?: string[];
  partName: string;
  partDescription?: string;
  category: string[]; // Changed from string to string[]
  subCategory?: string[]; // Changed from string to string[]
  supplier: string[]; // Changed from string to string[]
  supplierContact?: string;
  internalContact?: string;
  specifications: Record<string, any>;
  documentation: IPartDocumentation[];
  createdAt?: Date;
  updatedAt?: Date;
  childParts?: IChildPart[];
}

// First, update the interface
export interface IChildPart {
  partNumber: string;
  partName: string;
  quantity: number;
  partDescription?: string; // Added to match schema
  supplier?: string; // Added to match schema
  mainPartId?: mongoose.Types.ObjectId; // Reference to the main part
}
// Define documentation types enum
export enum DocumentationType {
  RAW_MATERIAL_CERT = "Raw Material Certificate",
  COUNTRY_OF_ORIGIN = "Country of Origin",
  MANUFACTURING_CERT = "Manufacturing Certificate",
  QUALITY_INSPECTION = "Quality Inspection Report",
  SAFETY_DATA_SHEET = "Safety Data Sheet",
  INSTALLATION_GUIDE = "Installation Guide",
  MAINTENANCE_MANUAL = "Maintenance Manual",
  COMPLIANCE_CERT = "Compliance Certificate",
  CALIBRATION_CERT = "Calibration Certificate",
  WARRANTY_DOC = "Warranty Document",
}

const partDocumentationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(DocumentationType),
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    fileReferences: {
      type: [String],
      validate: [
        (v: string[]) => !v || v.length <= 5,
        "Cannot have more than 5 file references",
      ],
    },
    answeredBy: {
      type: String,
      max: 200,
      min: 5,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt to each documentation item
  }
);

const PartSchema: Schema = new Schema(
  {
    partNumber: {
      type: String,
      required: [true, "Part number is required"],
      unique: true,
      trim: true,
      index: true, // Individual field index
    },
    alternativePartNumbers: {
      type: [String], // Array of strings
      required: false,
      index: true,
    },
    partName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true, // Individual field index
    },
    partDescription: {
      type: String,
      trim: true,
    },
    category: {
      type: [String], // Changed from String to [String]
      required: [true, "Category is required"],
      trim: true,
      index: true, // Index for category lookups
    },

    subCategory: {
      type: [String], // Changed from String to [String]
      required: false,
      trim: true,
    },
    supplier: {
      type: [String], // Changed from String to [String]
      required: [true, "supplier is required"],
      trim: true,
      index: true, // Index for supplier lookups
    },
    supplierContact: {
      type: String,
      required: false,
      trim: true,
    },

    internalContact: {
      type: String,
      required: false,
      trim: true,
    },
    // Child parts with details
    childParts: [
      {
        partNumber: {
          type: String,
          required: true,
          trim: true,
        },
        partName: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        partDescription: {
          type: String,
          required: false,
          trim: true,
        },
        supplier: {
          type: String,
          required: false,
          trim: true,
        },
        mainPartId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
        },
      },
    ],

    // Dynamic specifications - can hold any specifications
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    documentation: [partDocumentationSchema],
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
PartSchema.index({
  partName: "text",
  partDescription: "text",
  partNumber: "text",
});

export default mongoose.model<IPart>("Part", PartSchema);
