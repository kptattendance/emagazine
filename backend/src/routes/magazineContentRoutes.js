import express from "express";
import multer from "multer";

import {
  createMagazineContent,
  getMagazineContents,
  getMyMagazineContents,
  getPublishedMagazineContents,
  getPublishedArticle,
  getPendingMagazineContents,
  getMagazineContentById,
  updateMagazineContent,
  approveMagazineContent,
  rejectMagazineContent,
  deleteMagazineContent,
  getHODDepartmentMagazineContents,
} from "../controllers/magazineContentController.js";

import {
  getIssueImage,
  getIssueMonths,
  getMonthlyIssue,
} from "../controllers/issueController.js";

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

router.get(
  "/published/:id",
  getPublishedArticle
);

router.use(requireAuth, resolveUser);


// Monthly issue PDF: data, months, and photos for it
router.get("/issue/months", getIssueMonths);

router.get("/issue/image", getIssueImage);

router.get("/issue", getMonthlyIssue);


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


// Every submission: admin, and the magazine's institute coordinator
router.get(
  "/",
  requireRole("admin", "mag_coordinator"),
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