import { Request, Response } from "express";
import Waitlist, { IWaitlist } from "../models/Waitlist";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";

/**
 * @desc    Add a new email to the waitlist
 * @route   POST /api/waitlist
 * @access  Public
 */
export const addToWaitlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
        message: "Validation failed",
      });
      return;
    }

    const { email } = req.body;

    // Check if email already exists on waitlist
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      res.status(400).json({
        success: false,
        message: "This email is already on our waitlist",
      });
      return;
    } // Create new waitlist entry
    const waitlistEntry = await Waitlist.create({
      email,
      status: "pending",
    });

    // Setup email transporter
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      // Send notification email
      await transporter.sendMail({
        from: '"Croco Waitlist" <support@sourcecraft.io>',
        to: "oscarekstrand@hotmail.com",
        subject: "New Waitlist Registration",
        text: `New waitlist registration: ${email}`,
        html: `
          <h1>New Waitlist Registration</h1>
          <p>A new user has joined the waitlist:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Time:</strong> ${waitlistEntry.createdAt}</p>
        `,
      });
      console.log("Notification email sent successfully");
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Error sending notification email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Successfully added to waitlist",
      data: {
        email: waitlistEntry.email,
        status: waitlistEntry.status,
        createdAt: waitlistEntry.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in addToWaitlist:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing waitlist request",
    });
  }
};

// /**
//  * @desc    Get all waitlist entries
//  * @route   GET /api/waitlist
//  * @access  Admin only
//  */
// export const getAllWaitlist = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     // Get page and limit from query params or use defaults
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 50;
//     const skip = (page - 1) * limit;

//     // Get total count
//     const total = await Waitlist.countDocuments();

//     // Get waitlist entries with pagination
//     const waitlistEntries = await Waitlist.find()
//       .sort({ createdAt: -1 }) // Most recent first
//       .skip(skip)
//       .limit(limit);

//     res.status(200).json({
//       success: true,
//       count: waitlistEntries.length,
//       total,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalEntries: total,
//         entriesPerPage: limit,
//       },
//       data: waitlistEntries.map((entry) => ({
//         id: entry._id,
//         email: entry.email,
//         status: entry.status,
//         createdAt: entry.createdAt,
//         updatedAt: entry.updatedAt,
//         lastContactedAt: entry.lastContactedAt,
//         notes: entry.notes,
//       })),
//     });
//   } catch (error) {
//     console.error("Error in getAllWaitlist:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while retrieving waitlist",
//     });
//   }
// };

// /**
//  * @desc    Update waitlist entry status
//  * @route   PUT /api/waitlist/:id
//  * @access  Admin only
//  */
// export const updateWaitlistStatus = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const { status, notes } = req.body;

//     // Check if status is valid
//     if (!["pending", "contacted", "invited", "declined"].includes(status)) {
//       res.status(400).json({
//         success: false,
//         message: "Invalid status value",
//       });
//       return;
//     }

//     // Find and update the waitlist entry
//     const updatedEntry = await Waitlist.findByIdAndUpdate(
//       id,
//       {
//         status,
//         notes,
//         ...(status === "contacted" && { lastContactedAt: new Date() }),
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedEntry) {
//       res.status(404).json({
//         success: false,
//         message: "Waitlist entry not found",
//       });
//       return;
//     }

//     res.status(200).json({
//       success: true,
//       message: "Waitlist entry updated successfully",
//       data: {
//         id: updatedEntry._id,
//         email: updatedEntry.email,
//         status: updatedEntry.status,
//         createdAt: updatedEntry.createdAt,
//         updatedAt: updatedEntry.updatedAt,
//         lastContactedAt: updatedEntry.lastContactedAt,
//         notes: updatedEntry.notes,
//       },
//     });
//   } catch (error) {
//     console.error("Error in updateWaitlistStatus:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating waitlist entry",
//     });
//   }
// };
