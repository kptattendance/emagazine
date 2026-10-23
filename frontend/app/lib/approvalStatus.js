import { isInstituteContent } from "./departments";

/*
============================================================
Plain-language status of a magazine submission, including
who has to act next while it is pending.
============================================================
*/

export function statusLabel(content) {
  if (content?.status === "published") {
    return "Published";
  }

  if (content?.status === "rejected") {
    return "Rejected";
  }

  // Every student submission is checked by a department coordinator first
  if (content?.approvalStage === "department_coordinator") {
    return "Waiting for Department Coordinator";
  }

  return isInstituteContent(content)
    ? "Waiting for Institute Coordinator"
    : "Waiting for HOD";
}

// Readable names for user roles
export const ROLE_LABELS = {
  admin: "Admin",
  hod: "HOD",
  principal: "Principal",
  staff: "Staff",
  mag_coordinator: "Magazine Institute Coordinator",
  dept_coordinator: "Department Coordinator",
  club_incharge: "Club In-charge",
  welfare_officer: "Student Welfare Officer",
  student: "Student",
};
