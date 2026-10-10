import { getAuth } from "@clerk/express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/*
Many students share one college network address,
so logged-in users are counted by account, not by IP.
*/

const byUserOrIp = (req) =>
  getAuth(req).userId || ipKeyGenerator(req.ip);

const tooManyRequests = (message) => ({
  success: false,
  message,
});

// Everything under /api.
// Visitors who are not logged in are counted by IP, and a whole
// college lab can share one IP, so their allowance is larger.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: (req) => (getAuth(req).userId ? 600 : 3000),
  keyGenerator: byUserOrIp,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests(
    "Too many requests. Please try again after a few minutes."
  ),
});

// New magazine submissions (each one uploads photos)
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: byUserOrIp,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests(
    "You have submitted too many items. Please try again after an hour."
  ),
});
