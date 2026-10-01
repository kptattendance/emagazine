import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import activityRoutes from "./routes/activityRoutes.js";
import magazineContentRoutes from "./routes/magazineContentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

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