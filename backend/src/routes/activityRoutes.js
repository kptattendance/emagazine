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

const router = express.Router();

router.get("/", getActivities);

router.get("/active", getActiveActivities);

router.get("/:id", getActivityById);

router.post("/", createActivity);

router.put("/:id", updateActivity);

router.patch("/:id/toggle", toggleActivity);

router.delete("/bulk", deleteMultipleActivities);

router.delete("/:id", deleteActivity);

export default router;