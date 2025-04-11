# Crocoback - Parts Management API

## Project Overview
Crocoback is a backend API for a parts management system that allows tracking parts, specifications, documentation, and assemblies. The system is designed as a SaaS application for managing mechanical, electrical, and other industrial parts.

## Tech Stack
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication (planned)
- Deployed on Render

## Project Structure
- `/src/models` - Database models
- `/src/controllers` - API route handlers
- `/src/routes` - Express routes
- `/src/middleware` - Custom middleware
- `/src/services` - Business logic
- `/src/config` - Configuration files
- `/src/scripts` - Utility scripts like seeders

## Database Models
- Parts: Stores information about parts including specifications and documentation
- Categories: (planned) Categorization of parts with required specifications
- Users: (planned) User authentication and permissions

## Key Features
- Flexible parts specifications system using Schema.Types.Mixed
- Structured documentation with predefined types
- Assembly tracking (parts containing other parts)

## Environment Variables
- PORT - Server port
- MONGO_DB_CROCO_URI - MongoDB connection string
- ALLOWED_ORIGINS - CORS allowed origins (comma-separated)