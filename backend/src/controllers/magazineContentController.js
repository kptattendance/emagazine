import MagazineContent from "../models/MagazineContent.js";
import Activity from "../models/Activity.js";
import {
  deleteImage,
  uploadImage,
} from "../config/storage.js";

import { ACHIEVEMENT_LEVELS } from "../config/achievement.js";
import { deleteFeedbackFor } from "./feedbackController.js";

import {
  DEPARTMENTS,
  INSTITUTE_DEPARTMENT,
  departmentAliases,
  normalizeDepartment,
} from "../config/departments.js";

/*
=====================================================
PERMISSION HELPERS
=====================================================

Every content item has exactly one approver,
decided by where it is posted:

Department content:
    HOD of that department

Institute content:
    Magazine Coordinator

Admin:
    anything
=====================================================
*/

const getRole = (user) =>
  String(user?.role || "")
    .trim()
    .toLowerCase();

const isInstituteContent = (content) =>
  content.level === "institute" ||
  normalizeDepartment(content.department) ===
    INSTITUTE_DEPARTMENT;

const DEPT_COORDINATOR = "dept_coordinator";
const CLUB_INCHARGE = "club_incharge";

/*
Student Welfare Officer: publishes directly, anywhere,
without approval. Does not review anyone else's content.
*/
const WELFARE_OFFICER = "welfare_officer";

// Faculty roles: they give name and designation with a submission
const FACULTY_ROLES = [
  "staff",
  DEPT_COORDINATOR,
  CLUB_INCHARGE,
  WELFARE_OFFICER,
];

const sameDepartment = (user, content) => {
  const userDepartment = normalizeDepartment(user.department);

  return (
    Boolean(userDepartment) &&
    userDepartment === normalizeDepartment(content.department)
  );
};

/*
Final approval: publishes the content.
The HOD may also approve student content that is still
waiting for the department coordinator, so nothing gets
stuck in a department without a coordinator.
*/
const canReview = (user, content) => {
  const role = getRole(user);

  if (role === "admin") {
    return true;
  }

  if (role === "mag_coordinator") {
    return isInstituteContent(content);
  }

  if (role === "hod") {
    return sameDepartment(user, content);
  }

  return false;
};

/*
First step for every student submission: the department
coordinator approves it and forwards it to the HOD
(department content) or the institute coordinator
(institute content).

For institute content the coordinator is the one of the
student's own department.
*/
const coordinatorDepartmentOf = (content) =>
  isInstituteContent(content)
    ? content.student?.department
    : content.department;

const canCoordinatorReview = (user, content) =>
  getRole(user) === DEPT_COORDINATOR &&
  content.status === "pending" &&
  content.approvalStage === "department_coordinator" &&
  sameDepartment(user, {
    department: coordinatorDepartmentOf(content),
  });

/*
Level and prize of an achievement, or an error message.
*/
const readAchievement = (level, award) => {
  const cleanLevel = String(level || "").trim();
  const cleanAward = String(award || "").trim();

  if (!ACHIEVEMENT_LEVELS.includes(cleanLevel)) {
    return { error: "Please choose the level of the achievement." };
  }

  if (!cleanAward) {
    return { error: "Please enter the prize or position." };
  }

  return { achievement: { level: cleanLevel, award: cleanAward } };
};

// Where new or resubmitted content starts
const initialStage = (submitterRole) =>
  submitterRole === "student"
    ? "department_coordinator"
    : "final";

const isOwner = (user, content) => {
  const submittedEmail = String(
    content.submittedBy?.email || ""
  )
    .trim()
    .toLowerCase();

  const userEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  return (
    Boolean(submittedEmail) &&
    submittedEmail === userEmail
  );
};

const isStudentContent = (content) =>
  getRole(content.submittedBy) === "student";

// Who acts on the content next (or who gives final approval)
const finalApproverLabel = (content) =>
  isInstituteContent(content)
    ? "Magazine Institute Coordinator"
    : "HOD";

const getApproverLabel = (content) =>
  content.approvalStage === "department_coordinator"
    ? "Department Coordinator"
    : finalApproverLabel(content);

const pendingFilterFor = (user) => {
  const role = getRole(user);

  if (role === "admin") {
    return {};
  }

  if (role === "mag_coordinator") {
    return {
      $or: [
        { level: "institute" },
        { department: INSTITUTE_DEPARTMENT },
      ],
    };
  }

  if (role === "hod" && user.department) {
    return {
      department: {
        $in: departmentAliases(user.department),
      },
    };
  }

  if (role === DEPT_COORDINATOR && user.department) {
    const departments = departmentAliases(user.department);

    return {
      approvalStage: "department_coordinator",
      $or: [
        // Department content of this department
        {
          level: { $ne: "institute" },
          department: { $in: departments },
        },
        // Institute content from students of this department
        {
          level: "institute",
          "student.department": { $in: departments },
        },
      ],
    };
  }

  return null;
};


/*
=====================================================
CREATE MAGAZINE CONTENT
=====================================================

Published directly when the submitter is the
approver of that content (see canReview).

Everything else:
    pending
=====================================================
*/

export const createMagazineContent = async (
  req,
  res
) => {
  try {
    const user = req.user;

    const {
      title,
      activity,
      eventDate,
      description,
      originalWork,
      achievementLevel,
      achievementAward,

      studentName,
      registerNumber,
      studentDepartment,
      semester,
      phone,

      facultyName,
      designation,
    } = req.body;

    let { level } = req.body;

    let department = normalizeDepartment(
      req.body.department
    );

    // Club activities are always reviewed by the institute coordinator
    if (getRole(user) === CLUB_INCHARGE) {
      level = "institute";
      department = INSTITUTE_DEPARTMENT;
    }


    /*
    =================================================
    VALIDATION
    =================================================
    */

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required.",
      });
    }

    if (!activity) {
      return res.status(400).json({
        success: false,
        message: "Activity is required.",
      });
    }

    if (
      !level ||
      !["department", "institute"].includes(level)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid content level.",
      });
    }

    /*
    Institute content always uses the
    institute department code, and vice versa.
    */

    if (
      level === "institute" ||
      department === INSTITUTE_DEPARTMENT
    ) {
      level = "institute";
      department = INSTITUTE_DEPARTMENT;
    }

    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        success: false,
        message: "Valid department is required.",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required.",
      });
    }


    /*
    =================================================
    ACTIVITY
    =================================================
    */

    const activityDocument =
      await Activity.findById(activity);

    if (!activityDocument) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    if (!activityDocument.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "The selected activity is inactive.",
      });
    }

    const contentType =
      activityDocument.type || "activity";

    const isCreative =
      contentType === "creative";

    // Students post their own work and achievements only
    if (
      getRole(user) === "student" &&
      ["activity", "club"].includes(contentType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "College activities are posted by the department coordinator. Please choose a category for your own work or achievement.",
      });
    }

    if (!isCreative && !eventDate) {
      return res.status(400).json({
        success: false,
        message:
          contentType === "achievement"
            ? "Date of the achievement is required."
            : "Event date is required.",
      });
    }

    let achievementDetails = { level: "", award: "" };

    if (contentType === "achievement") {
      const { achievement, error } = readAchievement(
        achievementLevel,
        achievementAward
      );

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      achievementDetails = achievement;
    }

    if (
      isCreative &&
      String(originalWork) !== "true"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please confirm that this is your own original work.",
      });
    }


    /*
    =================================================
    DETERMINE USER TYPE
    =================================================
    */

    const role = getRole(user);

    const isStudent = role === "student";

    const isStaff = FACULTY_ROLES.includes(role);


    /*
    =================================================
    STUDENT DETAILS
    =================================================
    */

    if (isStudent) {
      if (!studentName?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Student name is required.",
        });
      }

      if (!registerNumber?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Register number is required.",
        });
      }

      if (!studentDepartment?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Student department is required.",
        });
      }

      if (!semester) {
        return res.status(400).json({
          success: false,
          message:
            "Student semester is required.",
        });
      }

      if (!phone?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Student phone number is required.",
        });
      }

      if (!req.files?.studentPhoto?.[0]) {
        return res.status(400).json({
          success: false,
          message:
            "Student photo is required.",
        });
      }
    }


    /*
    =================================================
    FACULTY DETAILS
    =================================================
    */

    if (isStaff) {
      if (!facultyName?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Faculty name is required.",
        });
      }

      if (!designation?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Designation is required.",
        });
      }
    }


    /*
    =================================================
    EVENT PHOTO
    =================================================

    Always required for activity reports.
    For own work it depends on the category.
    */

    const imageRequired =
      !isCreative ||
      activityDocument.imageRequired !== false;

    if (
      imageRequired &&
      !req.files?.eventPhoto?.[0]
    ) {
      return res.status(400).json({
        success: false,
        message: isCreative
          ? "An image is required for this category."
          : "Event photo is required.",
      });
    }


    /*
    =================================================
    UPLOAD PHOTOS
    =================================================
    */

    let eventPhotoUrl = "";

    if (req.files?.eventPhoto?.[0]) {
      const eventPhotoUpload =
        await uploadImage(
          req.files.eventPhoto[0],
          "kpt-emagazine/magazine/events",
          { watermark: true }
        );

      eventPhotoUrl =
        eventPhotoUpload;
    }

    let studentPhotoUrl = "";

    if (
      isStudent &&
      req.files?.studentPhoto?.[0]
    ) {
      const studentPhotoUpload =
        await uploadImage(
          req.files.studentPhoto[0],
          "kpt-emagazine/magazine/students"
        );

      studentPhotoUrl =
        studentPhotoUpload;
    }

    let facultyPhotoUrl = "";

    if (
      !isStudent &&
      req.files?.facultyPhoto?.[0]
    ) {
      const facultyPhotoUpload =
        await uploadImage(
          req.files.facultyPhoto[0],
          "kpt-emagazine/magazine/faculty"
        );

      facultyPhotoUrl =
        facultyPhotoUpload;
    }


    /*
    =================================================
    INITIAL STATUS
    =================================================
    */

    const status =
      role === WELFARE_OFFICER ||
      canReview(user, {
        level,
        department,
      })
        ? "published"
        : "pending";

    const approvalStage =
      status === "published"
        ? "final"
        : initialStage(role);


    /*
    =================================================
    STUDENT SNAPSHOT
    =================================================
    */

    const studentDetails = isStudent
      ? {
          name: studentName.trim(),

          registerNumber:
            registerNumber
              .trim()
              .toUpperCase(),

          department: normalizeDepartment(
            studentDepartment
          ),

          semester: Number(semester),

          phone: phone.trim(),

          photo: studentPhotoUrl,
        }
      : {
          name: "",
          registerNumber: "",
          department: "",
          semester: null,
          phone: "",
          photo: "",
        };


    /*
    =================================================
    FACULTY SNAPSHOT
    =================================================
    */

    const facultyDetails =
      !isStudent && facultyName?.trim()
        ? {
            name: facultyName.trim(),
            designation:
              designation?.trim() || "",
            photo: facultyPhotoUrl,
          }
        : {
            name: "",
            designation: "",
            photo: "",
          };


    /*
    =================================================
    SUBMITTER SNAPSHOT
    =================================================
    */

    const submittedBy = {
      name: user.name || "",
      role: user.role || "",
      email: user.email || "",
    };


    /*
    =================================================
    CREATE
    =================================================
    */

    const content =
      await MagazineContent.create({
        title: title.trim(),

        activity:
          activityDocument._id,

        contentType,

        achievement: achievementDetails,

        level,

        department,

        eventDate: eventDate
          ? new Date(eventDate)
          : new Date(),

        description:
          description.trim(),

        eventPhoto: eventPhotoUrl,

        student: studentDetails,

        faculty: facultyDetails,

        submittedBy,

        status,

        approvalStage,

        approvedBy:
          status === "published"
            ? {
                name:
                  user.name || "",
                role:
                  user.role || "",
              }
            : {
                name: "",
                role: "",
              },

        approvedAt:
          status === "published"
            ? new Date()
            : null,

        rejectionReason: "",
      });


    /*
    =================================================
    RESPONSE
    =================================================
    */

    const result =
      await MagazineContent.findById(
        content._id
      ).populate(
        "activity",
        "name order type"
      );

    return res.status(201).json({
      success: true,

      message:
        status === "published"
          ? "Magazine content published successfully."
          : `Magazine content submitted successfully and sent to the ${getApproverLabel(
              content
            )} for approval.`,

      data: result,
    });
  } catch (error) {
    console.error(
      "CREATE MAGAZINE CONTENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create magazine content.",
    });
  }
};


/*
=====================================================
GET ALL
=====================================================

Admin only.
=====================================================
*/

export const getMagazineContents = async (
  req,
  res
) => {
  try {
    const contents =
      await MagazineContent.find()
        .populate(
          "activity",
          "name order type"
        )
        .sort({
          eventDate: -1,
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: contents.length,
      data: contents,
    });
  } catch (error) {
    console.error(
      "GET MAGAZINE CONTENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch magazine contents.",
    });
  }
};


/*
=====================================================
GET MY CONTENT
=====================================================

Used by student and faculty.

Because MagazineContent does NOT store User ID,
we identify the submitter's content using the
snapshot:

submittedBy.email
=====================================================
*/

export const getMyMagazineContents = async (
  req,
  res
) => {
  try {
    const contents =
      await MagazineContent.find({
        "submittedBy.email":
          req.user.email,
      })
        .populate(
          "activity",
          "name order type"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: contents.length,
      data: contents,
    });
  } catch (error) {
    console.error(
      "GET MY MAGAZINE CONTENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch your magazine contents.",
    });
  }
};


/*
=====================================================
GET PUBLISHED
=====================================================

Public. Contact details are never sent.
=====================================================
*/

export const getPublishedMagazineContents =
  async (req, res) => {
    try {
      const contents =
        await MagazineContent.find({
          status: "published",
        })
          .select(
            "-student.phone -submittedBy.email -commentCount"
          )
          .populate(
            "activity",
            "name order type"
          )
          .sort({
            eventDate: -1,
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        count: contents.length,
        data: contents,
      });
    } catch (error) {
      console.error(
        "GET PUBLISHED CONTENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch published content.",
      });
    }
  };


/*
=====================================================
ONE PUBLISHED ARTICLE (PUBLIC)
=====================================================

Used for the preview a shared link shows in WhatsApp
and other apps.
=====================================================
*/

export const getPublishedArticle = async (req, res) => {
  try {
    const article = await MagazineContent.findOne({
      _id: req.params.id,
      status: "published",
    })
      .select(
        "title description eventPhoto department contentType achievement eventDate student.name faculty.name"
      )
      .populate("activity", "name")
      .lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    // An invalid id is simply "not found"
    return res.status(404).json({
      success: false,
      message: "Article not found.",
    });
  }
};


/*
=====================================================
GET PENDING
=====================================================

HOD:
    pending content of own department

Magazine Coordinator:
    pending institute content

Admin:
    all pending content
=====================================================
*/

export const getPendingMagazineContents = async (req, res) => {
  try {
    const role = getRole(req.user);

    if (
      role === "hod" &&
      !req.user.department
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department is not assigned to this HOD.",
      });
    }

    const filter = pendingFilterFor(req.user);

    if (!filter) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to view pending magazine content.",
      });
    }

    const contents = await MagazineContent.find({
      ...filter,
      status: "pending",
    })
      .populate("activity", "name order type")
      .sort({
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: contents.length,
      data: contents,
    });
  } catch (error) {
    console.error(
      "GET PENDING CONTENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch pending content.",
    });
  }
};

/*
=====================================================
GET SINGLE
=====================================================

Unpublished content is visible only to its
submitter and its approver.
=====================================================
*/

export const getMagazineContentById =
  async (req, res) => {
    try {
      const content =
        await MagazineContent.findById(
          req.params.id
        )
          .populate(
            "activity",
            "name order type imageRequired"
          )
          .lean();

      if (!content) {
        return res.status(404).json({
          success: false,
          message:
            "Magazine content not found.",
        });
      }

      if (
        content.status !== "published" &&
        !isOwner(req.user, content) &&
        !canReview(req.user, content) &&
        !canCoordinatorReview(req.user, content)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this content.",
        });
      }

      return res.status(200).json({
        success: true,
        data: content,
      });
    } catch (error) {
      console.error(
        "GET MAGAZINE CONTENT BY ID ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch magazine content.",
      });
    }
  };


/*
=====================================================
UPDATE MAGAZINE CONTENT
=====================================================

Submitter (student / faculty):
    Can edit own pending/rejected content.

Approver (HOD / Magazine Coordinator / Admin):
    Can edit pending/rejected content they review.

Published:
    Cannot be edited through this endpoint.
=====================================================
*/

export const updateMagazineContent =
  async (req, res) => {
    try {
      const user = req.user;

      const {
        title,
        activity,
        level,
        department,
        eventDate,
        description,

        studentName,
        registerNumber,
        studentDepartment,
        semester,
        phone,

        facultyName,
        designation,

        achievementLevel,
        achievementAward,
      } = req.body;


      /*
      =================================================
      CONTENT
      =================================================
      */

      const content =
        await MagazineContent.findById(
          req.params.id
        );

      if (!content) {
        return res.status(404).json({
          success: false,
          message:
            "Magazine content not found.",
        });
      }


      /*
      =================================================
      PUBLISHED CONTENT CANNOT BE EDITED
      =================================================
      */

      if (
        content.status === "published"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Published magazine content cannot be edited.",
        });
      }


      /*
      =================================================
      PERMISSION
      =================================================
      */

      if (
        !isOwner(user, content) &&
        !canReview(user, content) &&
        !canCoordinatorReview(user, content)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to edit this content.",
        });
      }


      /*
      =================================================
      ACTIVITY
      =================================================
      */

      if (activity) {
        const activityDocument =
          await Activity.findById(
            activity
          );

        if (!activityDocument) {
          return res.status(404).json({
            success: false,
            message:
              "Selected activity not found.",
          });
        }

        if (
          !activityDocument.isActive
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Selected activity is inactive.",
          });
        }

        // A student may not move a post into a college activity
        const changesCategory =
          String(content.activity) !==
          String(activityDocument._id);

        if (
          getRole(user) === "student" &&
          changesCategory &&
          ["activity", "club"].includes(
            activityDocument.type || "activity"
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "College activities are posted by the department coordinator.",
          });
        }

        content.activity =
          activityDocument._id;

        content.contentType =
          activityDocument.type ||
          "activity";
      }


      /*
      =================================================
      BASIC FIELDS
      =================================================
      */

      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "Title cannot be empty.",
          });
        }

        content.title =
          title.trim();
      }

      if (level !== undefined) {
        if (
          !["department", "institute"].includes(
            level
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid content level.",
          });
        }

        content.level = level;
      }

      if (department !== undefined) {
        content.department =
          normalizeDepartment(department);
      }

      /*
      Institute content always uses the
      institute department code, and vice versa.
      */

      if (
        level !== undefined ||
        department !== undefined
      ) {
        const isInstitute =
          level === "institute" ||
          content.department ===
            INSTITUTE_DEPARTMENT;

        content.level = isInstitute
          ? "institute"
          : "department";

        if (isInstitute) {
          content.department =
            INSTITUTE_DEPARTMENT;
        }

        if (
          !DEPARTMENTS.includes(
            content.department
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Valid department is required.",
          });
        }
      }

      if (
        eventDate !== undefined &&
        eventDate !== ""
      ) {
        content.eventDate =
          new Date(eventDate);
      }

      if (description !== undefined) {
        if (!description.trim()) {
          return res.status(400).json({
            success: false,
            message:
              "Description cannot be empty.",
          });
        }

        content.description =
          description.trim();
      }

      /*
      Achievement details: required for achievements,
      cleared for everything else.
      */

      if (content.contentType === "achievement") {
        const { achievement, error } = readAchievement(
          achievementLevel ?? content.achievement?.level,
          achievementAward ?? content.achievement?.award
        );

        if (error) {
          return res.status(400).json({
            success: false,
            message: error,
          });
        }

        content.achievement = achievement;
      } else {
        content.achievement = { level: "", award: "" };
      }


      /*
      =================================================
      STUDENT DETAILS
      =================================================

      Only for content submitted by a student.
      =================================================
      */

      if (isStudentContent(content)) {
        if (
          studentName !== undefined
        ) {
          content.student.name =
            studentName.trim();
        }

        if (
          registerNumber !== undefined
        ) {
          content.student.registerNumber =
            registerNumber
              .trim()
              .toUpperCase();
        }

        if (
          studentDepartment !==
          undefined
        ) {
          content.student.department =
            normalizeDepartment(
              studentDepartment
            );
        }

        if (
          semester !== undefined
        ) {
          content.student.semester =
            Number(semester);
        }

        if (
          phone !== undefined
        ) {
          content.student.phone =
            phone.trim();
        }
      }


      /*
      =================================================
      NEW STUDENT PHOTO
      =================================================
      */

      if (
        isStudentContent(content) &&
        req.files?.studentPhoto?.[0]
      ) {
        const oldPhoto =
          content.student?.photo;

        const uploaded =
          await uploadImage(
            req.files.studentPhoto[0],
            "kpt-emagazine/magazine/students"
          );

        content.student.photo =
          uploaded;

        /*
        Delete old magazine student photo
        only after new upload succeeds.
        */

        if (oldPhoto) {
          await deleteImage(
            oldPhoto
          );
        }
      }


      /*
      =================================================
      FACULTY DETAILS
      =================================================

      Only for content submitted by faculty.
      =================================================
      */

      if (!isStudentContent(content)) {
        if (facultyName !== undefined) {
          content.faculty.name =
            facultyName.trim();
        }

        if (designation !== undefined) {
          content.faculty.designation =
            designation.trim();
        }

        if (req.files?.facultyPhoto?.[0]) {
          const oldPhoto =
            content.faculty?.photo;

          const uploaded =
            await uploadImage(
              req.files.facultyPhoto[0],
              "kpt-emagazine/magazine/faculty"
            );

          content.faculty.photo =
            uploaded;

          if (oldPhoto) {
            await deleteImage(
              oldPhoto
            );
          }
        }
      }


      /*
      =================================================
      NEW EVENT PHOTO
      =================================================
      */

      if (
        req.files?.eventPhoto?.[0]
      ) {
        const oldEventPhoto =
          content.eventPhoto;

        const uploaded =
          await uploadImage(
            req.files.eventPhoto[0],
            "kpt-emagazine/magazine/events",
            { watermark: true }
          );

        content.eventPhoto =
          uploaded;

        if (oldEventPhoto) {
          await deleteImage(
            oldEventPhoto
          );
        }
      }


      /*
      =================================================
      REJECTED → PENDING
      =================================================

      If rejected content is edited,
      it is automatically sent back for approval.
      =================================================
      */

      if (
        content.status === "rejected"
      ) {
        content.status = "pending";

        content.rejectionReason = "";

        content.approvedBy = {
          name: "",
          role: "",
        };

        content.approvedAt = null;
      }

      /*
      When the submitter changes their own content, it goes
      through the full approval again.
      */

      if (
        content.status === "pending" &&
        isOwner(user, content)
      ) {
        content.approvalStage = initialStage(
          getRole(content.submittedBy)
        );

        content.coordinatorApproval = {
          name: "",
          approvedAt: null,
        };
      }


      /*
      =================================================
      SAVE
      =================================================
      */

      await content.save();


      const result =
        await MagazineContent.findById(
          content._id
        ).populate(
          "activity",
          "name order type"
        );


      return res.status(200).json({
        success: true,
        message:
          "Magazine content updated successfully.",
        data: result,
      });
    } catch (error) {
      console.error(
        "UPDATE MAGAZINE CONTENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update magazine content.",
      });
    }
  };


/*
=====================================================
APPROVE MAGAZINE CONTENT
=====================================================
*/

export const approveMagazineContent = async (
  req,
  res
) => {
  try {
    const approver = req.user;

    const content =
      await MagazineContent.findById(
        req.params.id
      );

    if (!content) {
      return res.status(404).json({
        success: false,
        message:
          "Magazine content not found.",
      });
    }

    if (
      content.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending content can be approved.",
      });
    }

    /*
    Department coordinator: forward to the HOD
    */

    if (
      !canReview(approver, content) &&
      canCoordinatorReview(approver, content)
    ) {
      content.approvalStage = "final";

      content.coordinatorApproval = {
        name: approver.name || "",
        approvedAt: new Date(),
      };

      await content.save();

      return res.status(200).json({
        success: true,
        message:
          `Approved and sent to the ${finalApproverLabel(
            content
          )} for publishing.`,
        data: content,
      });
    }

    if (!canReview(approver, content)) {
      return res.status(403).json({
        success: false,
        message: `Only the ${getApproverLabel(
          content
        )} or admin can approve this content.`,
      });
    }

    content.status =
      "published";

    content.approvalStage = "final";

    content.approvedBy = {
      name:
        approver.name || "",
      role:
        approver.role || "",
    };

    content.approvedAt =
      new Date();

    content.rejectionReason =
      "";

    await content.save();

    const result =
      await MagazineContent.findById(
        content._id
      ).populate(
        "activity",
        "name order type"
      );

    return res.status(200).json({
      success: true,
      message:
        "Magazine content approved and published successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "APPROVE MAGAZINE CONTENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve magazine content.",
    });
  }
};


/*
=====================================================
REJECT MAGAZINE CONTENT
=====================================================
*/

export const rejectMagazineContent = async (
  req,
  res
) => {
  try {
    const approver = req.user;

    const {
      rejectionReason,
    } = req.body;

    if (
      !rejectionReason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required.",
      });
    }

    const content =
      await MagazineContent.findById(
        req.params.id
      );

    if (!content) {
      return res.status(404).json({
        success: false,
        message:
          "Magazine content not found.",
      });
    }

    if (
      content.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending content can be rejected.",
      });
    }

    if (
      !canReview(approver, content) &&
      !canCoordinatorReview(approver, content)
    ) {
      return res.status(403).json({
        success: false,
        message: `Only the ${getApproverLabel(
          content
        )} or admin can reject this content.`,
      });
    }

    content.status =
      "rejected";

    content.rejectionReason =
      rejectionReason.trim();

    content.approvedBy = {
      name:
        approver.name || "",
      role:
        approver.role || "",
    };

    content.approvedAt =
      new Date();

    await content.save();

    const result =
      await MagazineContent.findById(
        content._id
      ).populate(
        "activity",
        "name order type"
      );

    return res.status(200).json({
      success: true,
      message:
        "Magazine content rejected successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "REJECT MAGAZINE CONTENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject magazine content.",
    });
  }
};

// =====================================================
// DELETE MAGAZINE CONTENT
//
// APPROVER (ADMIN / HOD / MAGAZINE COORDINATOR):
//   Can delete anything they review,
//   including published content.
//
// SUBMITTER (STUDENT / FACULTY):
//   Can delete only own pending/rejected content.
// =====================================================

export const deleteMagazineContent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const user = req.user;

    const content =
      await MagazineContent.findById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Magazine content not found.",
      });
    }

    if (!canReview(user, content)) {
      if (!isOwner(user, content)) {
        return res.status(403).json({
          success: false,
          message:
            "You can delete only your own magazine content.",
        });
      }

      // Direct publishers may remove what they published themselves
      if (
        content.status === "published" &&
        getRole(user) !== WELFARE_OFFICER
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Published magazine content can be deleted only by its approver.",
        });
      }
    }

    // =================================================
    // DELETE CLOUDINARY PHOTOS
    // =================================================

    await deleteImage(
      content.eventPhoto
    );

    await deleteImage(
      content.student?.photo
    );

    await deleteImage(
      content.faculty?.photo
    );

    // =================================================
    // DELETE MONGO DOCUMENT
    // =================================================

    await MagazineContent.findByIdAndDelete(id);

    await deleteFeedbackFor(id);

    return res.status(200).json({
      success: true,
      message:
        "Magazine content deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE MAGAZINE CONTENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete magazine content.",
    });
  }
};


// =====================================================
// GET ALL MAGAZINE CONTENT AN APPROVER REVIEWS
//
// HOD:
//   everything of own department
//
// MAGAZINE COORDINATOR:
//   everything at institute level
//
// Includes pending, rejected and published.
// =====================================================

export const getHODDepartmentMagazineContents = async (
  req,
  res
) => {
  try {
    const role = getRole(req.user);

    if (
      !["hod", "mag_coordinator"].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only HOD or Magazine Coordinator can access this magazine content.",
      });
    }

    const filter = pendingFilterFor(req.user);

    if (!filter) {
      return res.status(400).json({
        success: false,
        message:
          "Department is not assigned to this HOD.",
      });
    }

    const contents = await MagazineContent.find(
      filter
    )
      .populate("activity", "name type")
      .sort({
        eventDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      department:
        role === "hod"
          ? normalizeDepartment(
              req.user.department
            )
          : INSTITUTE_DEPARTMENT,
      count: contents.length,
      data: contents,
    });
  } catch (error) {
    console.error(
      "GET HOD DEPARTMENT MAGAZINE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load department magazine content.",
    });
  }
};
