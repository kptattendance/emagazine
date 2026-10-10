import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import multer from "multer";
import { clerkMiddleware } from "@clerk/express";
import {
  apiLimiter,
  submissionLimiter,
} from "./middleware/rateLimiters.js";
import activityRoutes from "./routes/activityRoutes.js";
import magazineContentRoutes from "./routes/magazineContentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// The server runs behind the hosting provider proxy,
// so the visitor IP comes from the forwarded header.
app.set("trust proxy", 1);

// --------------------------------------------------
// Security headers
// --------------------------------------------------

app.use(helmet());

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use(
  cors({
    origin: [
      "https://emag.kptmangaluru.in",
      "https://local.emag.kptmangaluru.in",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());

app.use(clerkMiddleware());

// --------------------------------------------------
// Rate limits
// --------------------------------------------------

app.use("/api", apiLimiter);

app.post("/api/magazine-content", submissionLimiter);

// --------------------------------------------------
// Test route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KPT E-MAGAZINE Management API is running",
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------


app.use(
  "/api/magazine-content",
  magazineContentRoutes
);


app.use("/api/activities", activityRoutes);

app.use(
  "/api/users",
  userRoutes
);

// --------------------------------------------------
// Unknown route
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// --------------------------------------------------
// Errors
// Internal details are logged, never sent to the browser.
// --------------------------------------------------

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "The image must be smaller than 10 MB."
          : "The uploaded file could not be accepted.",
    });
  }

  if (error?.message === "Only image files are allowed.") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid request data.",
    });
  }

  console.error("UNHANDLED ERROR:", error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();