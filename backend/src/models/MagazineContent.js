import mongoose from "mongoose";

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
    */

    contentType: {
      type: String,
      enum: ["activity", "creative"],
      default: "activity",
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

const MagazineContent = mongoose.model(
  "MagazineContent",
  magazineContentSchema
);

export default MagazineContent;