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


/*
=====================================================
MULTER
=====================================================
*/

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


/*
=====================================================
CREATE
=====================================================
*/

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


/*
=====================================================
MY CONTENT
=====================================================
*/

router.get(
  "/my/:userId",
  getMyMagazineContents
);


/*
=====================================================
PUBLISHED
=====================================================
*/

router.get(
  "/published",
  getPublishedMagazineContents
);


/*
=====================================================
PENDING
=====================================================
*/

router.get(
  "/pending",
  getPendingMagazineContents
);


/*
=====================================================
ALL
=====================================================
*/

router.get(
  "/",
  getMagazineContents
);

router.get(
  "/department/:userId",
  getHODDepartmentMagazineContents
);
/*
=====================================================
SINGLE
=====================================================
*/

router.get(
  "/:id",
  getMagazineContentById
);


/*
=====================================================
UPDATE
=====================================================

Can receive:

studentPhoto
eventPhoto
=====================================================
*/

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


/*
=====================================================
APPROVE
=====================================================
*/

router.patch(
  "/:id/approve",
  approveMagazineContent
);


/*
=====================================================
REJECT
=====================================================
*/

router.patch(
  "/:id/reject",
  rejectMagazineContent
);


/*
=====================================================
DELETE
=====================================================
*/

router.delete(
  "/:id",
  deleteMagazineContent
);


export default router;