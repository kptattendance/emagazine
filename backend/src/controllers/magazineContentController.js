import MagazineContent from "../models/MagazineContent.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

/*
=====================================================
CLOUDINARY UPLOAD
=====================================================
*/

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(file.buffer);
  });
};


/*
=====================================================
GET CLOUDINARY PUBLIC ID
=====================================================
*/

const getCloudinaryPublicId = (url) => {
  if (!url) return null;

  try {
    const match = url.match(
      /\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/
    );

    if (!match) return null;

    return match[1];
  } catch (error) {
    return null;
  }
};


/*
=====================================================
DELETE CLOUDINARY IMAGE
=====================================================
*/

const deleteCloudinaryImage = async (url) => {
  const publicId = getCloudinaryPublicId(url);

  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      }
    );
  } catch (error) {
    console.error(
      "CLOUDINARY DELETE ERROR:",
      error
    );
  }
};


/*
=====================================================
CREATE MAGAZINE CONTENT
=====================================================

Student:
    pending

HOD:
    published

Magazine Coordinator:
    institute content → published

Admin:
    published
=====================================================
*/

export const createMagazineContent = async (
  req,
  res
) => {
  try {
    const {
      userId,
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
    } = req.body;


    /*
    =================================================
    VALIDATION
    =================================================
    */

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

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

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        message: "Event date is required.",
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
    USER
    =================================================
    */

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
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


    /*
    =================================================
    DETERMINE USER TYPE
    =================================================
    */

    const isStudent =
      user.role === "student";

    const isHod =
      user.role === "hod";

    const isAdmin =
      user.role === "admin";

    const isMagazineCoordinator =
      user.role === "mag_coordinator";


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
    EVENT PHOTO
    =================================================
    */

    if (!req.files?.eventPhoto?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Event photo is required.",
      });
    }


    /*
    =================================================
    UPLOAD EVENT PHOTO
    =================================================
    */

    const eventPhotoUpload =
      await uploadToCloudinary(
        req.files.eventPhoto[0],
        "kpt-emagazine/magazine/events"
      );


    /*
    =================================================
    UPLOAD STUDENT PHOTO
    =================================================
    */

    let studentPhotoUrl = "";

    if (
      isStudent &&
      req.files?.studentPhoto?.[0]
    ) {
      const studentPhotoUpload =
        await uploadToCloudinary(
          req.files.studentPhoto[0],
          "kpt-emagazine/magazine/students"
        );

      studentPhotoUrl =
        studentPhotoUpload.secure_url;
    }


    /*
    =================================================
    INITIAL STATUS
    =================================================
    */

    let status = "pending";

    if (isHod || isAdmin) {
      status = "published";
    }

    if (
      isMagazineCoordinator &&
      level === "institute"
    ) {
      status = "published";
    }


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

          department:
            studentDepartment.trim(),

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

        level,

        department:
          department?.trim() || "",

        eventDate:
          new Date(eventDate),

        description:
          description.trim(),

        eventPhoto:
          eventPhotoUpload.secure_url,

        student: studentDetails,

        submittedBy,

        status,

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
        "name order"
      );

    return res.status(201).json({
      success: true,

      message:
        status === "published"
          ? "Magazine content published successfully."
          : "Magazine content submitted successfully and sent to the HOD for approval.",

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
      error: error.message,
    });
  }
};


/*
=====================================================
GET ALL
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
          "name order"
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
      error: error.message,
    });
  }
};


/*
=====================================================
GET MY CONTENT
=====================================================

Used by student.

Because MagazineContent does NOT store User ID,
we identify the student's content using the
snapshot:

submittedBy.email

The logged-in User is used only to find the
current email.
=====================================================
*/

export const getMyMagazineContents = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const contents =
      await MagazineContent.find({
        "submittedBy.email":
          user.email,
      })
        .populate(
          "activity",
          "name order"
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
      error: error.message,
    });
  }
};


/*
=====================================================
GET PUBLISHED
=====================================================
*/

export const getPublishedMagazineContents =
  async (req, res) => {
    try {
      const contents =
        await MagazineContent.find({
          status: "published",
        })
          .populate(
            "activity",
            "name order"
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
        error: error.message,
      });
    }
  };


export const getPendingMagazineContents = async (req, res) => {
  try {
    const { userId } = req.query;

    let filter = {
      status: "pending",
    };

    if (userId) {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const role = String(user.role || "")
        .trim()
        .toLowerCase();

      if (role === "hod") {
        const hodDepartment = String(
          user.department || ""
        )
          .trim()
          .toUpperCase();

        if (!hodDepartment) {
          return res.status(400).json({
            success: false,
            message:
              "Department is not assigned to this HOD.",
          });
        }

        filter.department = hodDepartment;
      } else if (role === "admin") {
        filter = {
          status: "pending",
        };
      } else {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view pending magazine content.",
        });
      }
    }

    const contents = await MagazineContent.find(filter)
      .populate("activity", "name order")
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
      error: error.message,
    });
  }
};

/*
=====================================================
GET SINGLE
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
            "name order"
          )
          .lean();

      if (!content) {
        return res.status(404).json({
          success: false,
          message:
            "Magazine content not found.",
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
        error: error.message,
      });
    }
  };


/*
=====================================================
UPDATE MAGAZINE CONTENT
=====================================================

Student:
    Can edit own pending/rejected content.

HOD:
    Can edit pending/rejected content.

Admin:
    Can edit pending/rejected content.

Published:
    Cannot be edited through this endpoint.
=====================================================
*/

export const updateMagazineContent =
  async (req, res) => {
    try {
      const {
        userId,

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
      } = req.body;


      /*
      =================================================
      USER
      =================================================
      */

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }


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

      const isHod =
        user.role === "hod";

      const isAdmin =
        user.role === "admin";

      const isStudent =
        user.role === "student";


      /*
      -------------------------------------------------
      STUDENT CAN EDIT ONLY OWN CONTENT
      -------------------------------------------------
      */

      if (isStudent) {
        if (
          content.submittedBy?.email !==
          user.email
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You are not allowed to edit this content.",
          });
        }
      }

      /*
      -------------------------------------------------
      ONLY STUDENT / HOD / ADMIN
      -------------------------------------------------
      */

      if (
        !isStudent &&
        !isHod &&
        !isAdmin
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to edit magazine content.",
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

        content.activity =
          activityDocument._id;
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
          department.trim();
      }

      if (eventDate !== undefined) {
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
      =================================================
      STUDENT DETAILS
      =================================================

      Only modify these when the request contains
      student information.
      =================================================
      */

      const studentInformationProvided =
        studentName !== undefined ||
        registerNumber !== undefined ||
        studentDepartment !== undefined ||
        semester !== undefined ||
        phone !== undefined ||
        req.files?.studentPhoto?.[0];


      if (
        studentInformationProvided
      ) {
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
            studentDepartment.trim();
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
        req.files?.studentPhoto?.[0]
      ) {
        const oldPhoto =
          content.student?.photo;

        const uploaded =
          await uploadToCloudinary(
            req.files.studentPhoto[0],
            "kpt-emagazine/magazine/students"
          );

        content.student.photo =
          uploaded.secure_url;

        /*
        Delete old magazine student photo
        only after new upload succeeds.
        */

        if (oldPhoto) {
          await deleteCloudinaryImage(
            oldPhoto
          );
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
          await uploadToCloudinary(
            req.files.eventPhoto[0],
            "kpt-emagazine/magazine/events"
          );

        content.eventPhoto =
          uploaded.secure_url;

        if (oldEventPhoto) {
          await deleteCloudinaryImage(
            oldEventPhoto
          );
        }
      }


      /*
      =================================================
      REJECTED → PENDING
      =================================================

      If student edits rejected content,
      it is automatically sent back to HOD.
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
          "name order"
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
        error: error.message,
      });
    }
  };


/*
=====================================================
APPROVE
=====================================================
*/

export const approveMagazineContent =
  async (req, res) => {
    try {
      const {
        approverId,
      } = req.body;

      const approver =
        await User.findById(
          approverId
        );

      if (!approver) {
        return res.status(404).json({
          success: false,
          message:
            "Approver not found.",
        });
      }

      if (
        !["hod", "admin"].includes(
          approver.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only HOD or admin can approve content.",
        });
      }

      if (approverRole === "hod") {
  const hodDepartment = String(
    approver.department || ""
  )
    .trim()
    .toUpperCase();

  const contentDepartment = String(
    content.department || ""
  )
    .trim()
    .toUpperCase();

  if (!hodDepartment) {
    return res.status(400).json({
      success: false,
      message:
        "Department is not assigned to this HOD.",
    });
  }

  if (
    !contentDepartment ||
    hodDepartment !== contentDepartment
  ) {
    return res.status(403).json({
      success: false,
      message:
        "You can approve only magazine content belonging to your department.",
    });
  }
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
            "Only pending content can be approved.",
        });
      }


      content.status =
        "published";

      content.approvedBy = {
        name:
          approver.name || "",
        role:
          approver.role || "",
      };

      content.approvedAt =
        new Date();

      content.rejectionReason = "";

      await content.save();


      const result =
        await MagazineContent.findById(
          content._id
        ).populate(
          "activity",
          "name order"
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
        error: error.message,
      });
    }
  };


/*
=====================================================
REJECT
=====================================================
*/

export const rejectMagazineContent =
  async (req, res) => {
    try {
      const {
        approverId,
        rejectionReason,
      } = req.body;


      if (!rejectionReason?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Rejection reason is required.",
        });
      }


      const approver =
        await User.findById(
          approverId
        );

      if (!approver) {
        return res.status(404).json({
          success: false,
          message:
            "Approver not found.",
        });
      }


      if (
        !["hod", "admin"].includes(
          approver.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only HOD or admin can reject content.",
        });
      }

if (approverRole === "hod") {
  const hodDepartment = String(
    approver.department || ""
  )
    .trim()
    .toUpperCase();

  const contentDepartment = String(
    content.department || ""
  )
    .trim()
    .toUpperCase();

  if (!hodDepartment) {
    return res.status(400).json({
      success: false,
      message:
        "Department is not assigned to this HOD.",
    });
  }

  if (
    !contentDepartment ||
    hodDepartment !== contentDepartment
  ) {
    return res.status(403).json({
      success: false,
      message:
        "You can reject only magazine content belonging to your department.",
    });
  }
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


      return res.status(200).json({
        success: true,
        message:
          "Magazine content rejected successfully.",
        data: content,
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
        error: error.message,
      });
    }
  };

// =====================================================
// DELETE MAGAZINE CONTENT
//
// ADMIN:
//   Can delete anything.
//
// HOD:
//   Can delete anything belonging to his department,
//   including published content.
//
// STUDENT:
//   Can delete only own pending/rejected content.
//
// PUBLISHED:
//   HOD can delete if it belongs to his department.
// =====================================================

export const deleteMagazineContent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message:
          "Magazine content ID and user ID are required.",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // -------------------------------------------------
    // FIND CONTENT
    // -------------------------------------------------

    const content =
      await MagazineContent.findById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Magazine content not found.",
      });
    }

    const role = String(
      user.role || ""
    )
      .trim()
      .toLowerCase();

    // =================================================
    // ADMIN
    // =================================================

    if (role === "admin") {
      // Admin can delete anything.
    }

    // =================================================
    // HOD
    // =================================================

    else if (role === "hod") {
      const hodDepartment = String(
        user.department || ""
      ).trim();

      const contentDepartment = String(
        content.department || ""
      ).trim();

      if (!hodDepartment) {
        return res.status(400).json({
          success: false,
          message:
            "Department is not assigned to this HOD.",
        });
      }

      if (
        !contentDepartment ||
        hodDepartment.toLowerCase() !==
          contentDepartment.toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can delete only magazine content belonging to your department.",
        });
      }

      // HOD can delete published content.
    }

    // =================================================
    // STUDENT
    // =================================================

    else if (role === "student") {
      const submittedEmail = String(
        content.submittedBy?.email || ""
      )
        .trim()
        .toLowerCase();

      const userEmail = String(
        user.email || ""
      )
        .trim()
        .toLowerCase();

      if (
        !submittedEmail ||
        submittedEmail !== userEmail
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can delete only your own magazine content.",
        });
      }

      if (
        content.status === "published"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Published magazine content cannot be deleted by a student.",
        });
      }
    }

    // =================================================
    // OTHER ROLES
    // =================================================

    else {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete magazine content.",
      });
    }

    // =================================================
    // DELETE CLOUDINARY EVENT PHOTO
    // =================================================

    if (content.eventPhoto) {
      try {
        const publicId =
          getCloudinaryPublicId(
            content.eventPhoto
          );

        if (publicId) {
          await cloudinary.uploader.destroy(
            publicId
          );
        }
      } catch (error) {
        console.error(
          "Event photo deletion failed:",
          error
        );
      }
    }

    // =================================================
    // DELETE CLOUDINARY STUDENT PHOTO
    // =================================================

    if (content.student?.photo) {
      try {
        const publicId =
          getCloudinaryPublicId(
            content.student.photo
          );

        if (publicId) {
          await cloudinary.uploader.destroy(
            publicId
          );
        }
      } catch (error) {
        console.error(
          "Student photo deletion failed:",
          error
        );
      }
    }

    // =================================================
    // DELETE MONGO DOCUMENT
    // =================================================

    await MagazineContent.findByIdAndDelete(id);

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
      error: error.message,
    });
  }
};


  // =====================================================
// GET ALL MAGAZINE CONTENT FOR HOD'S DEPARTMENT
// Includes:
// - HOD created content
// - Student created content
// - Pending
// - Rejected
// - Published
// =====================================================

export const getHODDepartmentMagazineContents = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // -------------------------------------------------
    // FIND HOD
    // -------------------------------------------------

    const hod = await User.findById(userId);

    if (!hod) {
      return res.status(404).json({
        success: false,
        message: "HOD user not found.",
      });
    }

    // -------------------------------------------------
    // CHECK ROLE
    // -------------------------------------------------

    if (String(hod.role).toLowerCase() !== "hod") {
      return res.status(403).json({
        success: false,
        message:
          "Only HOD can access department magazine content.",
      });
    }

    // -------------------------------------------------
    // GET HOD DEPARTMENT
    // -------------------------------------------------

    const department = String(
      hod.department || ""
    ).trim();

    if (!department) {
      return res.status(400).json({
        success: false,
        message:
          "Department is not assigned to this HOD.",
      });
    }

    // -------------------------------------------------
    // GET ALL CONTENT FOR THIS DEPARTMENT
    // -------------------------------------------------

    const contents = await MagazineContent.find({
      department: department,
    })
      .populate("activity", "name")
      .sort({
        magazineYear: -1,
        magazineMonth: -1,
        eventDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      department,
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
      error: error.message,
    });
  }
};