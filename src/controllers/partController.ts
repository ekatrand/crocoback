import { Request, Response } from "express";
import Part, { IPart } from "../models/Parts"; // Import IPart
import { faker } from "@faker-js/faker";
import { DocumentationType } from "../models/Parts";
import mongoose from "mongoose";

/**
 * Get all parts with pagination and filtering
 * @route GET /api/parts
 */
export const getAllParts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Build filter object from query parameters
    const filter: Record<string, any> = {};

    // Global search parameter that searches across multiple fields
    if (req.query.globalSearch) {
      // Use elemMatch for array fields to ensure proper matching
      filter.$or = [
        { partNumber: { $regex: req.query.globalSearch, $options: "i" } },
        { partName: { $regex: req.query.globalSearch, $options: "i" } },
        { partDescription: { $regex: req.query.globalSearch, $options: "i" } },
        { category: { $regex: req.query.globalSearch, $options: "i" } },
        { subCategory: { $regex: req.query.globalSearch, $options: "i" } },
        { supplier: { $regex: req.query.globalSearch, $options: "i" } },
        {
          alternativePartNumbers: {
            $regex: req.query.globalSearch,
            $options: "i",
          },
        },
      ];
    } else {
      // Individual field filters (these will be ignored if globalSearch is provided)

      // Filter by partNumber (exact match or partial match)
      if (req.query.partNumber) {
        filter.partNumber = { $regex: req.query.partNumber, $options: "i" };
      }

      // Filter by partName (partial match)
      if (req.query.partName) {
        filter.partName = { $regex: req.query.partName, $options: "i" };
      }

      // Filter by categories (match exactly against array)
      if (req.query.category) {
        try {
          // Parse as JSON array if it's a string representation of array
          const categories =
            typeof req.query.category === "string" &&
            req.query.category.startsWith("[")
              ? JSON.parse(req.query.category as string)
              : req.query.category;

          // Handle both single category and array of categories
          if (Array.isArray(categories)) {
            filter.category = { $all: categories }; // Match all categories in the array
          } else {
            filter.category = { $in: [categories] }; // Match if array contains this category
          }
        } catch (err) {
          // Fall back to simple string matching if JSON parsing fails
          filter.category = { $in: [req.query.category] };
        }
      }

      // Filter by subCategories
      if (req.query.subCategory) {
        try {
          // Parse as JSON array if it's a string representation of array
          const subCategories =
            typeof req.query.subCategory === "string" &&
            req.query.subCategory.startsWith("[")
              ? JSON.parse(req.query.subCategory as string)
              : req.query.subCategory;

          // Handle both single subCategory and array of subCategories
          if (Array.isArray(subCategories)) {
            filter.subCategory = { $all: subCategories }; // Match all subCategories in the array
          } else {
            filter.subCategory = { $in: [subCategories] }; // Match if array contains this subCategory
          }
        } catch (err) {
          // Fall back to simple string matching if JSON parsing fails
          filter.subCategory = { $in: [req.query.subCategory] };
        }
      }

      // Filter by suppliers
      if (req.query.supplier) {
        try {
          // Parse as JSON array if it's a string representation of array
          const suppliers =
            typeof req.query.supplier === "string" &&
            req.query.supplier.startsWith("[")
              ? JSON.parse(req.query.supplier as string)
              : req.query.supplier;

          // Handle both single supplier and array of suppliers
          if (Array.isArray(suppliers)) {
            filter.supplier = { $all: suppliers }; // Match all suppliers in the array
          } else {
            filter.supplier = { $in: [suppliers] }; // Match if array contains this supplier
          }
        } catch (err) {
          // Fall back to simple string matching if JSON parsing fails
          filter.supplier = { $in: [req.query.supplier] };
        }
      }

      // Filter by alternative part numbers (array contains)
      if (req.query.alternativePartNumber) {
        filter.alternativePartNumbers = {
          $regex: req.query.alternativePartNumber,
          $options: "i",
        };
      }

      // Search in description
      if (req.query.description) {
        filter.partDescription = {
          $regex: req.query.description,
          $options: "i",
        };
      }
    }

    // Filter by date range (created between dates)
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    // Get total count based on filters
    const total = await Part.countDocuments(filter);

    // Apply filters and pagination to the query with a stable sort
    // Using _id as a secondary sort ensures stable pagination even when createdAt values are identical
    const parts = await Part.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: parts.length,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + parts.length < total,
      },
      filters: Object.keys(filter).length > 0 ? filter : "None",
      data: parts,
    });
  } catch (error) {
    console.error("Error fetching parts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching parts",
    });
  }
};

/**
 * Generate 10 random parts
 * @route POST /api/parts/generate
 */
export const generateRandomParts = async (req: Request, res: Response) => {
  try {
    const parts = [];
    const categories = [
      "Electronics",
      "Mechanical",
      "Hydraulics",
      "Electrical",
      "Structural",
    ];
    const suppliers = [
      "ABC Corp",
      "XYZ Industries",
      "Global Parts",
      "Tech Solutions",
      "Engineering Supplies",
    ];
    const materials = [
      "Steel",
      "Aluminum",
      "Plastic",
      "Copper",
      "Titanium",
      "Composite",
    ];

    // First, create a map to store part numbers and their corresponding IDs
    const partNumberMap = new Map();

    for (let i = 0; i < 1000; i++) {
      const partNumber = `P${faker.string.alphanumeric(2)}-${faker.number.int({
        min: 1000,
        max: 9999,
      })}`;
      const partName = `${faker.commerce.productAdjective()} ${faker.commerce.product()} Component`;

      // Generate 1-3 random categories
      const categoriesCount = faker.number.int({ min: 1, max: 3 });
      const randomCategories = Array.from({ length: categoriesCount }, () =>
        faker.helpers.arrayElement(categories)
      ).filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      // Generate 1-3 random suppliers
      const suppliersCount = faker.number.int({ min: 1, max: 3 });
      const randomSuppliers = Array.from({ length: suppliersCount }, () =>
        faker.helpers.arrayElement(suppliers)
      ).filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      // Generate random subCategories based on the categories
      const randomSubCategories = faker.helpers.maybe(() =>
        randomCategories.map(
          (category) => `${category} Type ${faker.string.alpha(1)}`
        )
      );

      // Create a temporary ID for this part to reference in child parts
      const tempId = new mongoose.Types.ObjectId();
      partNumberMap.set(partNumber, tempId);

      const randomPart = {
        _id: tempId, // Assign the temporary ID
        partNumber,
        partName,
        alternativePartNumbers: faker.helpers.maybe(() => [
          `ALT-${faker.string.alphanumeric(6)}`,
          `ALT-${faker.string.alphanumeric(6)}`,
        ]),
        partDescription: faker.commerce.productDescription(),
        category: randomCategories,
        subCategory: randomSubCategories,
        supplier: randomSuppliers,
        supplierContact: faker.helpers.maybe(() => faker.internet.email()),
        internalContact: faker.helpers.maybe(() => faker.person.fullName()),
        specifications: {
          weight: `${faker.number.float({
            min: 0.1,
            max: 10,
            fractionDigits: 1,
          })} kg`,
          material: faker.helpers.arrayElement(materials),
          dimensions: `${faker.number.int({
            min: 5,
            max: 100,
          })}x${faker.number.int({ min: 5, max: 100 })}x${faker.number.int({
            min: 5,
            max: 100,
          })} mm`,
          color: faker.color.human(),
          voltage: faker.helpers.maybe(
            () => `${faker.number.int({ min: 3, max: 240 })}V`
          ),
        },
        documentation: [
          {
            type: faker.helpers.arrayElement(Object.values(DocumentationType)),
            value: faker.lorem.paragraph(),
            dateAdded: faker.date.past(),
            fileReferences: faker.helpers.maybe(() => [
              `${faker.system.commonFileName()}.pdf`,
              `${faker.system.commonFileName()}.docx`,
            ]),
            answeredBy: faker.helpers.maybe(() => faker.person.fullName()),
          },
        ],
        childParts: faker.helpers.maybe(() => {
          // Randomize number of child parts (0-10)
          const numChildParts = faker.number.int({ min: 0, max: 10 });

          // Return empty array if 0 parts
          if (numChildParts === 0) return [];

          // Generate random child parts
          return Array.from({ length: numChildParts }, () => {
            const childPartNumber = `CP-${faker.string.alphanumeric(4)}`;
            // Reference existing parts when possible
            let mainPartId = null;

            // Use an existing part from our map, or null if not found
            // Here we'll assign mainPartId as null for now, but it will be updated
            // after inserting all parts to the database when we know all actual IDs

            return {
              partNumber: childPartNumber,
              partName: `${faker.commerce.productName()}`,
              partDescription: faker.commerce.productDescription(),
              supplier: faker.helpers.arrayElement(suppliers),
              quantity: faker.number.int({ min: 1, max: 10 }),
              mainPartId: null, // Will be replaced after insertion
            };
          });
        }),
      };

      parts.push(randomPart);
    }

    // Insert the parts to the database (without child parts mainPartId for now)
    let createdParts = await Part.insertMany(parts);

    // Create a map of actual inserted document IDs keyed by part number
    const actualPartNumberToIdMap = new Map();

    createdParts.forEach((part) => {
      actualPartNumberToIdMap.set(part.partNumber, part._id);
    });

    // Now go back and update each part's child parts with appropriate mainPartId references
    const updateOps = [];

    for (const part of createdParts) {
      if (part.childParts && part.childParts.length > 0) {
        // Update the mainPartId for each child part using the actual IDs from the database
        const updatedChildParts = part.childParts.map((childPart) => {
          // Try to find a real part with this part number
          const mainPartId =
            actualPartNumberToIdMap.get(childPart.partNumber) || null;
          return {
            ...childPart,
            mainPartId: mainPartId,
          };
        });

        // Update the part in the database with the updated child parts
        updateOps.push(
          Part.findByIdAndUpdate(part._id, { childParts: updatedChildParts })
        );
      }
    }

    // Execute all update operations
    if (updateOps.length > 0) {
      await Promise.all(updateOps);
    }

    // Get the updated parts
    createdParts = await Part.find({
      _id: { $in: createdParts.map((p) => p._id) },
    });

    res.status(201).json({
      success: true,
      message:
        "Successfully generated 1000 random parts with proper references",
      count: createdParts.length,
      data: createdParts.slice(0, 10), // Return just first 10 parts to avoid large response
    });
  } catch (error: any) {
    console.error("Error generating random parts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while generating random parts",
    });
  }
};

/**
 * Replace randomly generated child part data with data from existing parts
 * @route PUT /api/parts/replace-child-parts
 */
export const replaceChildPartsData = async (req: Request, res: Response) => {
  try {
    // 1. Fetch a sample of existing parts to use as a data pool (limit to 100 as suggested)
    const existingPartsPool = await Part.find(
      {},
      "partNumber partName partDescription _id"
    )
      .limit(100)
      .lean(); // Use lean for performance

    if (existingPartsPool.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No existing parts found to use as a data source.",
      });
    }

    // Create a map for quick lookup of parts by partNumber
    const partNumberToIdMap = new Map();
    existingPartsPool.forEach((part) => {
      partNumberToIdMap.set(part.partNumber, part._id);
    });

    // 2. Find all parts that have childParts
    const parentPartsToUpdate = await Part.find({
      childParts: { $exists: true, $ne: [] }, // Find parts where childParts exists and is not empty
    });

    if (parentPartsToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No parts with child parts found to update.",
        updatedCount: 0,
      });
    }

    let updatedCount = 0;
    const updatePromises = [];

    // 3. Iterate through parent parts and update child parts
    for (const parentPart of parentPartsToUpdate) {
      let needsUpdate = false;
      if (parentPart.childParts && parentPart.childParts.length > 0) {
        // Create new child parts objects instead of modifying in place
        // This ensures new _id fields are generated for each child part
        const newChildParts = parentPart.childParts.map((child) => {
          // 4. Randomly select an existing part from the pool
          const randomExistingPart =
            existingPartsPool[
              Math.floor(Math.random() * existingPartsPool.length)
            ];

          // Create a new child part object to ensure a new _id is generated
          // While preserving the quantity from the original child part
          if (randomExistingPart) {
            // Check if data is actually different to avoid unnecessary updates
            if (
              child.partNumber !== randomExistingPart.partNumber ||
              child.partName !== randomExistingPart.partName ||
              child.partDescription !== randomExistingPart.partDescription ||
              !child.mainPartId
            ) {
              needsUpdate = true;
              // Get the main part ID from our map if it exists
              const mainPartId =
                partNumberToIdMap.get(randomExistingPart.partNumber) ||
                randomExistingPart._id;

              // Create a new object (will get a new _id when added to the document)
              return {
                partNumber: randomExistingPart.partNumber,
                partName: randomExistingPart.partName,
                partDescription: randomExistingPart.partDescription || "",
                quantity: child.quantity, // Preserve the original quantity
                supplier: child.supplier, // Preserve the original supplier if it exists
                mainPartId: mainPartId, // Add reference to the main part
              };
            }
          }
          // If no change needed, still create a new object to get a new _id
          // Make sure we preserve or set the mainPartId
          const existingMainPartId =
            child.mainPartId ||
            (child.partNumber && partNumberToIdMap.get(child.partNumber));

          return {
            partNumber: child.partNumber,
            partName: child.partName,
            partDescription: child.partDescription || "",
            quantity: child.quantity,
            supplier: child.supplier,
            mainPartId: existingMainPartId,
          };
        });

        // Replace the entire childParts array with the new one
        parentPart.childParts = newChildParts;
        needsUpdate = true;

        if (needsUpdate) {
          // Add the save operation to a list of promises
          updatePromises.push(parentPart.save());
          updatedCount++;
        }
      }
    }

    // Execute all save operations concurrently
    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Successfully processed parts. Updated child part data for ${updatedCount} parent parts.`,
      updatedCount: updatedCount,
    });
  } catch (error: any) {
    console.error("Error replacing child part data:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while replacing child part data",
    });
  }
};

/**
 * Get part by ID
 * @route GET /api/parts/:id
 */
// export const getPartById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     console.log("Searching for part with ID:", id);

//     // Validate if the ID is in a valid MongoDB ObjectId format
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       console.log("Invalid MongoDB ObjectId format");
//       return res.status(400).json({
//         success: false,
//         message: "Invalid ID format",
//       });
//     }

//     const part = await Part.findById(id);
//     console.log("Part found:", part ? "Yes" : "No");

//     if (!part) {
//       return res.status(404).json({
//         success: false,
//         message: "Part not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: part,
//     });
//   } catch (error: any) {
//     console.error("Error fetching part by ID:", error);
//     res.status(500).json({
//       success: false,
//       message: `Server error while fetching part: ${error.message}`,
//     });
//   }
// };

/**
 * Get a part by its child part's mainPartId
 * @route GET /api/parts/by-child/:mainPartId
 */
export const getPartByChildReference = async (req: Request, res: Response) => {
  try {
    const { mainPartId } = req.params;

    console.log("Searching for part with mainPartId:", mainPartId);

    // Validate if the ID is in a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(mainPartId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format for mainPartId",
      });
    }

    // Find the referenced part
    const part = await Part.findById(mainPartId);
    console.log("Part found:", part ? "Yes" : "No");

    if (!part) {
      return res.status(404).json({
        success: false,
        message: "Referenced part not found",
      });
    }

    // Return the full part data
    res.status(200).json({
      success: true,
      data: part,
    });
  } catch (error: any) {
    console.error("Error fetching part by child reference:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching referenced part",
    });
  }
};

/**
 * Delete all parts from the database
 * @route DELETE /api/parts/all
 * @description For development purposes only
 */
export const deleteAllParts = async (req: Request, res: Response) => {
  try {
    const result = await Part.deleteMany({});

    res.status(200).json({
      success: true,
      message: "Successfully deleted all parts",
      count: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Error deleting all parts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting all parts",
    });
  }
};
