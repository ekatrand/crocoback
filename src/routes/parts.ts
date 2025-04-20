import express, { Router, Request, Response, NextFunction } from "express";
import {
  getAllParts,
  // getPartById,
  generateRandomParts,
  deleteAllParts,
  replaceChildPartsData, // Import the new controller function
  getPartByChildReference, // Add this import
} from "../controllers/partController";

const router: Router = express.Router();

/**
 * @route   GET /api/parts
 * @desc    Get all parts with pagination
 * @access  Public
 */
router.get("/", (req: Request, res: Response, next: NextFunction) =>
  getAllParts(req, res)
);

/**
 * @route   GET /api/parts/:id
 * @desc    Get part by ID
 * @access  Public
 */
// CURRENTY NOT IN USE
// router.get(
//   "/getpart/:id",
//   async (req: Request, res: Response, next: NextFunction) => {
//     getPartById(req, res);
//   }
// );

/**
 * @route   POST /api/parts/generate
 * @desc    Generate 10 random parts
 * @access  Public (should be protected in production)
 */
router.post("/generate", (req: Request, res: Response, next: NextFunction) =>
  generateRandomParts(req, res)
);

/**
 * @route   PUT /api/parts/replace-child-parts
 * @desc    Replace randomly generated child part data with existing part data
 * @access  Public (should be protected in production)
 */
router.put(
  "/replace-child-parts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await replaceChildPartsData(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/parts/child/:mainPartId
 * @desc    Get a part by its child part's mainPartId reference
 * @access  Public
 */
router.get(
  "/child/:mainPartId",
  async (req: Request, res: Response, next: NextFunction) => {
    getPartByChildReference(req, res);
  }
);

/**
 * @route   DELETE /api/parts/all
 * @desc    Delete all parts from database (development purposes only)
 * @access  Public (should be protected in production)
 */
router.delete("/all", (req: Request, res: Response, next: NextFunction) =>
  deleteAllParts(req, res)
);

export default router;
