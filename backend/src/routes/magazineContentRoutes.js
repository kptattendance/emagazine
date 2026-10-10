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

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";

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


const uploadPhotos = upload.fields([
  {
    name: "studentPhoto",
    maxCount: 1,
  },
  {
    name: "facultyPhoto",
    maxCount: 1,
  },
  {
    name: "eventPhoto",
    maxCount: 1,
  },
]);


/*
Only the published list is public.
Everything else needs a logged-in application user.
*/

router.get(
  "/published",
  getPublishedMagazineContents
);

router.use(requireAuth, resolveUser);


router.post(
  "/",
  uploadPhotos,
  createMagazineContent
);


router.get(
  "/my",
  getMyMagazineContents
);

router.get(
  "/my/:userId",
  getMyMagazineContents
);


router.get(
  "/review",
  getHODDepartmentMagazineContents
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
  requireRole("admin"),
  getMagazineContents
);


router.get(
  "/:id",
  getMagazineContentById
);


router.put(
  "/:id",
  uploadPhotos,
  updateMagazineContent
);


router.patch(
  "/:id",
  uploadPhotos,
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