import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import {
  addComment,
  deleteComment,
  getArticleComments,
  getCommentsForModeration,
  getLikedArticles,
  toggleLike,
} from "../controllers/feedbackController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";

const router = express.Router();

/*
Readers do not log in, so these limits are per internet
connection. A college network shares one address, so the
like limit is generous.
*/

const byIp = (req) => ipKeyGenerator(req.ip);

const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: byIp,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many comments from this connection. Please try again later.",
  },
});

const likeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 120,
  keyGenerator: byIp,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many likes. Please try again later.",
  },
});

const signedIn = [requireAuth, resolveUser];

// ---------- public
router.get("/articles/:contentId/comments", getArticleComments);

router.post(
  "/articles/:contentId/comments",
  commentLimiter,
  addComment
);

router.post("/articles/:contentId/like", likeLimiter, toggleLike);

router.get("/likes", getLikedArticles);

// ---------- admin, institute coordinator, HOD
router.get("/comments", signedIn, getCommentsForModeration);

router.delete("/comments/:id", signedIn, deleteComment);

export default router;
