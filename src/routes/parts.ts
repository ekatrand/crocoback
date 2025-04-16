import express, { Router, Request, Response, NextFunction } from "express";
import {
  getAllParts,
  getPartById,
  generateRandomParts,
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
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  getPartById(req, res);
});

/**
 * @route   POST /api/parts/generate
 * @desc    Generate 10 random parts
 * @access  Public (should be protected in production)
 */
router.post("/generate", (req: Request, res: Response, next: NextFunction) =>
  generateRandomParts(req, res)
);

export default router;
