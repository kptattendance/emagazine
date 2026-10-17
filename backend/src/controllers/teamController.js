import TeamMember from "../models/TeamMember.js";

import {
  DEPARTMENTS,
  INSTITUTE_DEPARTMENT,
  normalizeDepartment,
} from "../config/departments.js";

import {
  deleteImage,
  uploadImage,
} from "../config/storage.js";

const TEAM_FOLDER = "kpt-emagazine/team";

/*
=====================================================
WHO CAN MANAGE THE TEAM
=====================================================

Admin, and the HOD of the institute department
(the magazine office).
=====================================================
*/

export const requireTeamManager = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();

  const isInstituteHod =
    role === "hod" &&
    normalizeDepartment(req.user.department) ===
      INSTITUTE_DEPARTMENT;

  if (role !== "admin" && !isInstituteHod) {
    return res.status(403).json({
      success: false,
      message:
        "Only the admin or the institute HOD can manage the magazine team.",
    });
  }

  next();
};


/*
=====================================================
READ AND CHECK THE FORM
=====================================================

Returns the cleaned fields, or an error message.
=====================================================
*/

const readMember = (body) => {
  const memberType = body.memberType;

  if (!["faculty", "student"].includes(memberType)) {
    return { error: "Please choose faculty or student." };
  }

  const name = String(body.name || "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const department = normalizeDepartment(body.department);

  if (!DEPARTMENTS.includes(department)) {
    return { error: "Valid department is required." };
  }

  const member = {
    memberType,
    name,
    department,
    position: String(body.position || "").trim(),
    order: Number(body.order) || 0,
    designation: "",
    registerNumber: "",
    semester: null,
  };

  if (memberType === "faculty") {
    member.designation = String(body.designation || "").trim();

    if (!member.designation) {
      return { error: "Designation is required." };
    }
  } else {
    member.registerNumber = String(body.registerNumber || "")
      .trim()
      .toUpperCase();

    member.semester = Number(body.semester) || null;

    if (!member.registerNumber) {
      return { error: "Register number is required." };
    }

    if (!member.semester) {
      return { error: "Semester is required." };
    }
  }

  return { member };
};


/*
=====================================================
LIST (PUBLIC)
=====================================================

Faculty first, then students, each in display order.
=====================================================
*/

export const getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find()
      .sort({ memberType: 1, order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    console.error("GET TEAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load the magazine team.",
    });
  }
};


/*
=====================================================
ADD
=====================================================
*/

export const createTeamMember = async (req, res) => {
  try {
    const { member, error } = readMember(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    if (req.file) {
      member.photo = await uploadImage(req.file, TEAM_FOLDER);
    }

    const created = await TeamMember.create(member);

    return res.status(201).json({
      success: true,
      message: "Team member added.",
      data: created,
    });
  } catch (error) {
    console.error("CREATE TEAM MEMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add the team member.",
    });
  }
};


/*
=====================================================
UPDATE
=====================================================
*/

export const updateTeamMember = async (req, res) => {
  try {
    const existing = await TeamMember.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Team member not found.",
      });
    }

    const { member, error } = readMember(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const oldPhoto = existing.photo;

    if (req.file) {
      member.photo = await uploadImage(req.file, TEAM_FOLDER);
    }

    existing.set(member);

    await existing.save();

    // Remove the replaced photo only after the save succeeded
    if (req.file && oldPhoto) {
      await deleteImage(oldPhoto);
    }

    return res.status(200).json({
      success: true,
      message: "Team member updated.",
      data: existing,
    });
  } catch (error) {
    console.error("UPDATE TEAM MEMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update the team member.",
    });
  }
};


/*
=====================================================
DELETE
=====================================================
*/

export const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(
      req.params.id
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found.",
      });
    }

    await deleteImage(member.photo);

    return res.status(200).json({
      success: true,
      message: "Team member removed.",
    });
  } catch (error) {
    console.error("DELETE TEAM MEMBER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove the team member.",
    });
  }
};
