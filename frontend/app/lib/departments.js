export const INSTITUTE_DEPARTMENT = "IN";

export const DEPARTMENTS = [
  { value: "AT", label: "Automobile Engineering" },
  { value: "CH", label: "Chemical Engineering" },
  { value: "CE", label: "Civil Engineering" },
  { value: "CS", label: "Computer Science & Engineering" },
  { value: "EE", label: "Electrical & Electronics Engineering" },
  { value: "EC", label: "Electronics & Communication Engineering" },
  { value: "IN", label: "Institute" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "PS", label: "Polymer Technology" },
  { value: "SC", label: "Science" },
];

// Codes used before Automobile became AT and Polymer became PS
const LEGACY_DEPARTMENTS = {
  AE: "AT",
  PT: "PS",
};

export function normalizeDepartment(department) {
  const value = String(department || "")
    .trim()
    .toUpperCase();

  return LEGACY_DEPARTMENTS[value] || value;
}

export function getDepartmentLabel(department) {
  const code = normalizeDepartment(department);

  return (
    DEPARTMENTS.find((item) => item.value === code)?.label ||
    department ||
    "-"
  );
}

export function isInstituteContent(content) {
  return (
    content?.level === "institute" ||
    normalizeDepartment(content?.department) ===
      INSTITUTE_DEPARTMENT
  );
}
