import mongoose from "mongoose";

import { DEPARTMENTS } from "../config/departments.js";
import {
  DESIGNATIONS,
  STUDENT_YEARS,
  TEAM_POSITIONS,
} from "../config/teamPositions.js";

/*
Magazine team shown on the home page.

Faculty:  name, designation, department, photo
Student:  name, register number, year, department, photo
*/

const teamMemberSchema = new mongoose.Schema(
  {
    memberType: {
      type: String,
      enum: ["faculty", "student"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Role in the magazine, decides where the member is shown
    position: {
      type: String,
      enum: TEAM_POSITIONS.map((item) => item.value),
      required: true,
    },

    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    // Faculty only
    designation: {
      type: String,
      enum: ["", ...DESIGNATIONS],
      default: "",
    },

    registerNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    // Students only: year of study
    year: {
      type: Number,
      min: Math.min(...STUDENT_YEARS),
      max: Math.max(...STUDENT_YEARS),
      default: null,
    },

    photo: {
      type: String,
      default: "",
    },

    // Lower numbers are shown first
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("TeamMember", teamMemberSchema);
