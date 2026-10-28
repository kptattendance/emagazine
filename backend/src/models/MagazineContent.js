import mongoose from "mongoose";

import { ACHIEVEMENT_LEVELS } from "../config/achievement.js";

const magazineContentSchema = new mongoose.Schema(
  {
    /*
    =================================================
    MAGAZINE CONTENT
    =================================================
    */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },

    /*
    Copied from the selected activity.

    activity → college event / activity report
    creative → own work (article, poem, drawing...)
    achievement → a prize, rank or selection someone won
    club        → an activity of a college club
    */

    contentType: {
      type: String,
      enum: ["activity", "club", "creative", "achievement"],
      default: "activity",
    },

    // Filled only for achievements
    achievement: {
      level: {
        type: String,
        enum: ["", ...ACHIEVEMENT_LEVELS],
        default: "",
      },

      // e.g. First Prize, Selected, Gold Medal
      award: {
        type: String,
        default: "",
        trim: true,
      },
    },

    level: {
      type: String,
      enum: ["department", "institute"],
      required: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    /*
    =================================================
    EVENT PHOTO
    =================================================
    */

    eventPhoto: {
      type: String,
      default: "",
    },

    /*
    =================================================
    STUDENT DETAILS
    =================================================

    Filled only when the content is submitted
    by a student.

    These are permanently stored here.
    */

    student: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      registerNumber: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      department: {
        type: String,
        default: "",
        trim: true,
      },

      semester: {
        type: Number,
        default: null,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      photo: {
        type: String,
        default: "",
      },
    },

    /*
    =================================================
    FACULTY DETAILS
    =================================================

    Filled only when the content is submitted
    by a faculty member.
    */

    faculty: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      designation: {
        type: String,
        default: "",
        trim: true,
      },

      photo: {
        type: String,
        default: "",
      },
    },

    /*
    =================================================
    SUBMITTER INFORMATION
    =================================================

    Snapshot only.
    No User ObjectId.

    This allows User/Clerk records to be deleted
    later without affecting the magazine.
    */

    submittedBy: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      role: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
      },
    },

    /*
    =================================================
    CONTENT STATUS
    =================================================
    */

    status: {
      type: String,
      enum: [
        "pending",
        "rejected",
        "published",
      ],
      default: "pending",
    },

    /*
    Who has to act on pending content next.

    department_coordinator → student content waiting for the
                             department coordinator
    final                  → waiting for the HOD (or the
                             institute coordinator)
    */

    approvalStage: {
      type: String,
      enum: ["department_coordinator", "final"],
      default: "final",
    },

    // Filled when the department coordinator forwards it
    coordinatorApproval: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      approvedAt: {
        type: Date,
        default: null,
      },
    },

    /*
    =================================================
    APPROVAL INFORMATION
    =================================================

    Snapshot only.
    No User ObjectId.
    */

    approvedBy: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      role: {
        type: String,
        default: "",
        trim: true,
      },
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // Reader feedback, kept up to date as it changes
    likeCount: {
      type: Number,
      default: 0,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Public magazine, review lists, and "my submissions"
magazineContentSchema.index({ status: 1, eventDate: -1 });
magazineContentSchema.index({ department: 1, status: 1 });
magazineContentSchema.index({ "submittedBy.email": 1 });

const MagazineContent = mongoose.model(
  "MagazineContent",
  magazineContentSchema
);

export default MagazineContent;