import express, { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { addToWaitlist } from "../controllers/waitlistController";

const router: Router = express.Router();

// Specific rate limit for waitlist submission to prevent abuse
const waitlistRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 waitlist submissions per hour
  message: {
    success: false,
    message:
      "Too many waitlist submissions from this IP, please try again after an hour",
  },
});

// Validation middleware
const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
      message: "Validation failed",
    });
    return;
  }
  next();
};

/**
 * @route   POST /api/waitlist
 * @desc    Add a new email to the waitlist
 * @access  Public
 */
router.post(
  "/",
  waitlistRateLimiter,
  [
    // Sanitize and validate email
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Must be a valid email address")
      .normalizeEmail({
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
      })
      .trim()
      .escape(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await addToWaitlist(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
