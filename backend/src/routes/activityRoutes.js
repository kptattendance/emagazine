import express from "express";

import {
  getActivities,
  getActiveActivities,
  getActivityById,
  createActivity,
  updateActivity,
  toggleActivity,
  deleteActivity,
  deleteMultipleActivities,
} from "../controllers/activityController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";

const router = express.Router();

const adminOnly = [
  requireAuth,
  resolveUser,
  requireRole("admin"),
];

router.get("/", getActivities);

router.get("/active", getActiveActivities);

router.get("/:id", getActivityById);

router.post("/", adminOnly, createActivity);

router.put("/:id", adminOnly, updateActivity);

router.patch("/:id/toggle", adminOnly, toggleActivity);

router.delete("/bulk", adminOnly, deleteMultipleActivities);

router.delete("/:id", adminOnly, deleteActivity);

export default router;