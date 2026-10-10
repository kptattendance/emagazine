export const INSTITUTE_DEPARTMENT = "IN";

export const DEPARTMENTS = [
  "AT", // Automobile Engineering
  "CE", // Civil Engineering
  "ME", // Mechanical Engineering
  "EE", // Electrical & Electronics Engineering
  "CH", // Chemical Engineering
  "PS", // Polymer Technology
  "EC", // Electronics & Communication Engineering
  "CS", // Computer Science & Engineering
  "SC", // Science
  INSTITUTE_DEPARTMENT, // Institute / Institutional Activities
];

// Codes used before Automobile became AT and Polymer became PS
const LEGACY_DEPARTMENTS = {
  AE: "AT",
  PT: "PS",
};

export const normalizeDepartment = (department) => {
  const value = String(department || "")
    .trim()
    .toUpperCase();

  return LEGACY_DEPARTMENTS[value] || value;
};

// All codes a department may be stored under, old and new
export const departmentAliases = (department) => {
  const code = normalizeDepartment(department);

  const legacy = Object.keys(LEGACY_DEPARTMENTS).filter(
    (key) => LEGACY_DEPARTMENTS[key] === code
  );

  return [code, ...legacy];
};
