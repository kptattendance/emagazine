import express from "express";
import multer from "multer";

import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  requireTeamManager,
  updateTeamMember,
} from "../controllers/teamController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

const managers = [requireAuth, resolveUser, requireTeamManager];

// Public: shown on the home page
router.get("/", getTeamMembers);

router.post("/", managers, upload.single("photo"), createTeamMember);

router.put("/:id", managers, upload.single("photo"), updateTeamMember);

router.delete("/:id", managers, deleteTeamMember);

export default router;
