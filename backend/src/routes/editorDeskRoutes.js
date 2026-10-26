import express from "express";
import multer from "multer";

import {
  getEditorDesk,
  saveEditorDesk,
} from "../controllers/editorDeskController.js";

import { requireTeamManager } from "../controllers/teamController.js";

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

// Public: shown on the home page
router.get("/", getEditorDesk);

// Same people who manage the magazine team
router.put(
  "/",
  requireAuth,
  resolveUser,
  requireTeamManager,
  upload.single("photo"),
  saveEditorDesk
);

export default router;
