import { Request, Response } from "express";
import Part from "../models/Parts";
import { faker } from "@faker-js/faker";
import { DocumentationType } from "../models/Parts";

/**
 * Get all parts with pagination
 * @route GET /api/parts
 */
export const getAllParts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const parts = await Part.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Part.countDocuments();

    res.status(200).json({
      success: true,
      count: parts.length,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + parts.length < total,
      },
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
      const category = faker.helpers.arrayElement(categories);
      const supplier = faker.helpers.arrayElement(suppliers);

      const randomPart = {
        partNumber,
        partName,
        alternativePartNumbers: faker.helpers.maybe(() => [
          `ALT-${faker.string.alphanumeric(6)}`,
          `ALT-${faker.string.alphanumeric(6)}`,
        ]),
        partDescription: faker.commerce.productDescription(),
        category,
        subCategory: faker.helpers.maybe(
          () => `${category} Type ${faker.string.alpha(1)}`
        ),
        supplier,
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
