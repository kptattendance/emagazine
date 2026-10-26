import { normalizeDepartment } from "./departments";
import { achievementSummary } from "./achievement";

/*
============================================================
Formatting helpers shared by the public magazine pages.
============================================================
*/

/*
Adds the display fields the article cards and the
full-article view use.
*/
export function normalizeArticle(article) {
          const activityName =
            typeof article.activity ===
            "object"
              ? article.activity?.name
              : article.activity;

          const student =
            article.student || {};

          const faculty =
            article.faculty || {};

          const departmentName =
            normalizeDepartment(
              article.department ||
                student.department
            ) || "IN";

          const issueMonth =
            article.magazineMonth ||
            getMonthFromDate(
              article.eventDate
            );

          const issueYear =
            article.magazineYear ||
            getYearFromDate(
              article.eventDate
            );

          return {
            ...article,

            activityName:
              activityName ||
              "General Activity",

            departmentName:
              departmentName ||
              "IN",

            issueMonth:
              Number(issueMonth) ||
              null,

            issueYear:
              Number(issueYear) ||
              null,

            contentType:
              article.contentType ||
              "activity",

            studentName:
              student.name ||
              faculty.name ||
              "",

            designation:
              faculty.designation ||
              "",

            achievementText:
              achievementSummary(
                article.achievement
              ),

            registerNumber:
              student.registerNumber ||
              "",

            semester:
              student.semester ??
              null,

            studentPhoto:
              student.photo ||
              faculty.photo ||
              "",

            eventPhoto:
              article.eventPhoto || "",

            title:
              article.title ||
              "Untitled Article",

            description:
              article.description ||
              "",

            eventDate:
              article.eventDate ||
              article.createdAt,
          };
}

export function getIssueKey(article) {
  if (
    !article.issueMonth ||
    !article.issueYear
  ) {
    return "";
  }

  return `${article.issueYear}-${String(
    article.issueMonth
  ).padStart(2, "0")}`;
}

export function getMonthFromDate(date) {
  if (!date) return null;

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return (
    parsed.getMonth() + 1
  );
}

export function getYearFromDate(date) {
  if (!date) return null;

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed.getFullYear();
}

export function getMonthName(month) {
  if (!month) return "";

  return new Date(
    2020,
    Number(month) - 1,
    1
  ).toLocaleString(
    "en-US",
    {
      month: "long",
    }
  );
}

export function formatDate(date) {
  if (!date) return "";

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export function getOrdinal(number) {
  const n =
    Number(number);

  if (
    n % 100 >= 11 &&
    n % 100 <= 13
  ) {
    return "th";
  }

  switch (n % 10) {
    case 1:
      return "st";

    case 2:
      return "nd";

    case 3:
      return "rd";

    default:
      return "th";
  }
}

export function getDepartmentCode(
  department
) {
  const value =
    String(
      department || ""
    )
      .trim()
      .toUpperCase();

  const codes = {
    AT: "AT",
    AE: "AT",
    CE: "CE",
    ME: "ME",
    EE: "EE",
    CH: "CH",
    PS: "PS",
    PT: "PS",
    EC: "EC",
    CS: "CS",
    SC: "SC",
    IN: "IN",
  };

  if (codes[value]) {
    return codes[value];
  }

  if (
    value.includes("AUTOMOBILE")
  ) {
    return "AT";
  }

  if (
    value.includes("CIVIL")
  ) {
    return "CE";
  }

  if (
    value.includes("MECHANICAL")
  ) {
    return "ME";
  }

  if (
    value.includes("ELECTRICAL")
  ) {
    return "EE";
  }

  if (
    value.includes("CHEMICAL")
  ) {
    return "CH";
  }

  if (
    value.includes("POLYMER")
  ) {
    return "PS";
  }

  if (
    value.includes("ELECTRONICS") &&
    value.includes("COMMUNICATION")
  ) {
    return "EC";
  }

  if (
    value.includes("COMPUTER")
  ) {
    return "CS";
  }

  if (
    value.includes("SCIENCE")
  ) {
    return "SC";
  }

  if (
    value.includes("INSTITUTION") ||
    value.includes("GENERAL")
  ) {
    return "IN";
  }

  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word[0]
    )
    .join("");
}

export function getDepartmentLabel(
  department
) {
  const value =
    String(
      department || ""
    )
      .trim()
      .toUpperCase();

  const labels = {
    AT: "Automobile Engineering",
    AE: "Automobile Engineering",
    CE: "Civil Engineering",
    ME: "Mechanical Engineering",
    EE: "Electrical & Electronics Engineering",
    CH: "Chemical Engineering",
    PS: "Polymer Technology",
    PT: "Polymer Technology",
    EC: "Electronics & Communication Engineering",
    CS: "Computer Science & Engineering",
    SC: "Science",
    IN: "Institute",
  };

  return (
    labels[value] ||
    department ||
    "Institution"
  );
}