import express from "express";
import multer from "multer";

import {
  createMagazineContent,
  getMagazineContents,
  getMyMagazineContents,
  getPublishedMagazineContents,
  getPendingMagazineContents,
  getMagazineContentById,
  updateMagazineContent,
  approveMagazineContent,
  rejectMagazineContent,
  deleteMagazineContent,
  getHODDepartmentMagazineContents,
} from "../controllers/magazineContentController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed."
        ),
        false
      );
    }
  },
});


router.post(
  "/",
  upload.fields([
    {
      name: "studentPhoto",
      maxCount: 1,
    },
    {
      name: "eventPhoto",
      maxCount: 1,
    },
  ]),
  createMagazineContent
);


router.get(
  "/my/:userId",
  getMyMagazineContents
);


router.get(
  "/published",
  getPublishedMagazineContents
);


router.get(
  "/pending",
  getPendingMagazineContents
);


router.get(
  "/department/:userId",
  getHODDepartmentMagazineContents
);


router.get(
  "/hod/:userId",
  getHODDepartmentMagazineContents
);


router.get(
  "/",
  getMagazineContents
);


router.get(
  "/:id",
  getMagazineContentById
);


router.put(
  "/:id",
  upload.fields([
    {
      name: "studentPhoto",
      maxCount: 1,
    },
    {
      name: "eventPhoto",
      maxCount: 1,
    },
  ]),
  updateMagazineContent
);


router.patch(
  "/:id",
  upload.fields([
    {
      name: "studentPhoto",
      maxCount: 1,
    },
    {
      name: "eventPhoto",
      maxCount: 1,
    },
  ]),
  updateMagazineContent
);


router.patch(
  "/:id/approve",
  approveMagazineContent
);


router.patch(
  "/:id/reject",
  rejectMagazineContent
);


router.delete(
  "/:id",
  deleteMagazineContent
);


export default router;