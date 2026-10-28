import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import {
  getLikedArticles,
  toggleLike,
} from "../controllers/feedbackController.js";

const router = express.Router();

/*
Readers do not log in, so the limit is per internet
connection. A college network shares one address, so it
is generous.
*/

const likeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 120,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many likes. Please try again later.",
  },
});

router.post("/articles/:contentId/like", likeLimiter, toggleLike);

router.get("/likes", getLikedArticles);

export default router;
