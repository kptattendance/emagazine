/*
Roles in the magazine team, in the order they are shown:
leadership first, then the institute coordinator, then the
department coordinators, then the students.

Keep in step with backend/src/config/teamPositions.js
*/

export const TEAM_POSITIONS = [
  { value: "Principal", memberType: "faculty", rank: 1 },
  { value: "Academic Dean", memberType: "faculty", rank: 1 },
  {
    value: "Magazine Institute Coordinator",
    memberType: "faculty",
    rank: 2,
  },
  {
    value: "Magazine Department Coordinator",
    memberType: "faculty",
    rank: 3,
  },
  {
    value: "Magazine Student Coordinator",
    memberType: "student",
    rank: 4,
  },
];

// Headings for each level on the home page
export const TEAM_TIERS = [
  { rank: 1, title: "Leadership" },
  { rank: 2, title: "Institute Coordinator" },
  { rank: 3, title: "Department Coordinators" },
  { rank: 4, title: "Student Coordinators" },
];

export const positionRank = (position) =>
  TEAM_POSITIONS.find((item) => item.value === position)?.rank ??
  TEAM_POSITIONS.length + 1;

export const positionsFor = (memberType) =>
  TEAM_POSITIONS.filter((item) => item.memberType === memberType);

export const DESIGNATIONS = [
  "Guest Lecturer",
  "Lecturer",
  "Senior Grade Lecturer",
  "Selection Grade Lecturer",
  "HOD",
  "Principal",
];

// Students are listed by year of study
export const STUDENT_YEARS = [1, 2, 3];
