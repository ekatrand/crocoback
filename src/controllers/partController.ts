import { Request, Response } from "express";
import Part from "../models/Parts";
import { faker } from "@faker-js/faker";
import { DocumentationType } from "../models/Parts";

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

      const randomPart = {
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
        childParts: faker.helpers.maybe(() => [
          {
            partNumber: `CP-${faker.string.alphanumeric(4)}`,
            partName: `${faker.commerce.productName()}`,
            quantity: faker.number.int({ min: 1, max: 10 }),
          },
          {
            partNumber: `CP-${faker.string.alphanumeric(4)}`,
            partName: `${faker.commerce.productName()}`,
            quantity: faker.number.int({ min: 1, max: 10 }),
          },
        ]),
      };

      parts.push(randomPart);
    }

    const createdParts = await Part.insertMany(parts);
    console.log("Generated parts:", parts);

    res.status(201).json({
      success: true,
      message: "Successfully generated 10 random parts",
      count: createdParts.length,
      data: createdParts,
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
 * Get part by ID
 * @route GET /api/parts/:id
 */
export const getPartById = async (req: Request, res: Response) => {
  try {
    const part = await Part.findById(req.params.id);

    if (!part) {
      return res.status(404).json({
        success: false,
        message: "Part not found",
      });
    }

    res.status(200).json({
      success: true,
      data: part,
    });
  } catch (error) {
    console.error("Error fetching part by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching part",
    });
  }
};
