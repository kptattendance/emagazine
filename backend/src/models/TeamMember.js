import mongoose from "mongoose";

import { DEPARTMENTS } from "../config/departments.js";

/*
Magazine team shown on the home page.

Faculty:  name, designation, department, photo
Student:  name, register number, semester, department, photo
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

    // Role in the magazine, e.g. Chief Editor, Student Coordinator
    position: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    designation: {
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

    semester: {
      type: Number,
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
