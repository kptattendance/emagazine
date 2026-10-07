"use client";

import axios from "axios";
import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clock3,
  Library,
  Search,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tableSearch, setTableSearch] = useState("");
  const [tableDepartment, setTableDepartment] = useState("all");
  const [tableMonth, setTableMonth] = useState("all");

  useEffect(() => {
    let cancelled = false;

    const loadPublishedArticles = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/api/magazine-content/published`
        );

        const data =
          response.data?.data ||
          response.data?.contents ||
          response.data?.articles ||
          response.data ||
          [];

        const list = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setArticles(list);
        }
      } catch (error) {
        console.error(
          "Failed to load published magazine articles:",
          error
        );

        if (!cancelled) {
          setArticles([]);
          setError(
            "Unable to load published magazine data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPublishedArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedArticles = useMemo(() => {
    return articles.map((article) => {
      const activity =
        typeof article.activity === "object"
          ? article.activity?.name
          : article.activity;

      const student = article.student || {};

      const department =
        article.department ||
        student.department ||
        "IN";

      const month =
        article.magazineMonth ||
        getMonthFromDate(article.eventDate);

      const year =
        article.magazineYear ||
        getYearFromDate(article.eventDate);

      return {
        ...article,
        activityName:
          activity || "General Activity",
        departmentName:
          department || "IN",
        issueMonth: Number(month) || null,
        issueYear: Number(year) || null,
      };
    });
  }, [articles]);

  const monthOptions = useMemo(() => {
    const map = new Map();

    normalizedArticles.forEach((article) => {
      if (
        !article.issueMonth ||
        !article.issueYear
      ) {
        return;
      }

      const value =
        `${article.issueYear}-${String(
          article.issueMonth
        ).padStart(2, "0")}`;

      map.set(value, {
        value,
        month: article.issueMonth,
        year: article.issueYear,
        label:
          `${getMonthName(
            article.issueMonth
          )} ${article.issueYear}`,
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }

        return b.month - a.month;
      }
    );
  }, [normalizedArticles]);

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set(
        normalizedArticles
          .map(
            (article) =>
              article.departmentName
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [normalizedArticles]);

  const publicationTable = useMemo(() => {
    let source = normalizedArticles;

    if (tableMonth !== "all") {
      source = source.filter(
        (article) =>
          getIssueKey(article) ===
          tableMonth
      );
    }

    if (
      tableDepartment !== "all"
    ) {
      source = source.filter(
        (article) =>
          article.departmentName ===
          tableDepartment
      );
    }

    const departmentSet = new Set();

    source.forEach((article) => {
      if (
        article.departmentName
      ) {
        departmentSet.add(
          article.departmentName
        );
      }
    });

    const departments =
      Array.from(
        departmentSet
      ).sort((a, b) =>
        getDepartmentCode(
          a
        ).localeCompare(
          getDepartmentCode(b)
        )
      );

    const activityMap =
      new Map();

    source.forEach((article) => {
      const activity =
        article.activityName ||
        "General Activity";

      const department =
        article.departmentName ||
        "IN";

      if (
        !activityMap.has(
          activity
        )
      ) {
        activityMap.set(
          activity,
          {}
        );
      }

      const row =
        activityMap.get(
          activity
        );

      row[department] =
        (row[department] || 0) +
        1;
    });

    let activities =
      Array.from(
        activityMap.keys()
      ).sort((a, b) =>
        a.localeCompare(b)
      );

    const searchText =
      tableSearch
        .trim()
        .toLowerCase();

    if (searchText) {
      activities =
        activities.filter(
          (activity) =>
            activity
              .toLowerCase()
              .includes(
                searchText
              )
        );
    }

    return {
      departments,
      activities,
      activityMap,
    };
  }, [
    normalizedArticles,
    tableMonth,
    tableDepartment,
    tableSearch,
  ]);

  const clearTableFilters = () => {
    setTableSearch("");
    setTableDepartment("all");
    setTableMonth("all");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7faf9] text-slate-800">

      {/* ARCHIVE */}

      <section
        id="archive"
        className="border-b border-amber-100 bg-gradient-to-b from-amber-50/80 via-white to-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2 text-amber-700">
                <Library size={17} />

                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-xs">
                  Digital Library
                </p>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Magazine Archive
              </h1>

              <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
                Select an issue to open the magazine.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-xs font-bold text-amber-800 shadow-sm sm:px-4 sm:text-sm">
              <BookOpen size={16} />
              Digital Archive
            </div>

          </div>

          {monthOptions.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {monthOptions.map(
                (issue, index) => (
                  <Link
                    key={issue.value}
                    href={`/magazine?month=${issue.value}`}
                    className="group overflow-hidden rounded-2xl border border-amber-100 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
                  >

                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-teal-800 via-teal-800 to-slate-900 sm:h-48">

                      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl" />

                      <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-teal-400/10 blur-2xl" />

                      <div className="relative text-center">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/10">
                          <BookOpen
                            size={27}
                            strokeWidth={1.5}
                          />
                        </div>

                        <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-200 sm:text-[10px]">
                          KPT E-Magazine
                        </p>

                        <p className="mt-1 text-2xl font-black text-white sm:text-3xl">
                          {getMonthName(
                            issue.month
                          )}
                        </p>

                        <p className="text-sm font-semibold text-amber-300">
                          {issue.year}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center justify-between gap-3 p-4 sm:p-5">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                          {getMonthName(
                            issue.month
                          )}{" "}
                          {issue.year} Issue
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock3 size={12} />

                          {index === 0
                            ? "Latest Issue"
                            : "Archived"}
                        </p>

                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition duration-300 group-hover:bg-teal-700 group-hover:text-white">
                        <ArrowRight
                          size={16}
                        />
                      </div>

                    </div>

                  </Link>
                )
              )}

            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-white px-5 py-12 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-400">
                <BookOpen size={30} />
              </div>

              <p className="mt-4 font-bold text-slate-700">
                No magazine issues published yet.
              </p>

            </div>
          )}

        </div>
      </section>

      {/* PUBLICATION SUMMARY */}

      <section
        id="publication-summary"
        className="border-b border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

          <div className="mb-6">

            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-700 sm:text-xs">
              Publication Summary
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Department-wise Publications
            </h2>

          

          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
              <p className="text-sm text-slate-500">
                Loading publication data...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
              <p className="font-bold text-red-700">
                {error}
              </p>
            </div>
          ) : (
            <>

              {/* FILTERS */}

              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_210px_190px_auto]">

                  <div className="relative sm:col-span-2 lg:col-span-1">

                    <Search
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) =>
                        setTableSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search activity..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                    />

                  </div>

                  <div className="relative">

                    <select
                      value={
                        tableDepartment
                      }
                      onChange={(e) =>
                        setTableDepartment(
                          e.target.value
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                    >

                      <option value="all">
                        All Departments
                      </option>

                      {departmentOptions.map(
                        (department) => (
                          <option
                            key={department}
                            value={department}
                          >
                            {getDepartmentCode(
                              department
                            )}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                  <div className="relative">

                    <select
                      value={tableMonth}
                      onChange={(e) =>
                        setTableMonth(
                          e.target.value
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
                    >

                      <option value="all">
                        All Months
                      </option>

                      {monthOptions.map(
                        (issue) => (
                          <option
                            key={issue.value}
                            value={issue.value}
                          >
                            {issue.label}
                          </option>
                        )
                      )}

                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                  {(tableSearch ||
                    tableDepartment !==
                      "all" ||
                    tableMonth !==
                      "all") && (
                    <button
                      type="button"
                      onClick={
                        clearTableFilters
                      }
                      className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                    >
                      Clear
                    </button>
                  )}

                </div>

              </div>

              {publicationTable.activities
                .length > 0 ? (

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[720px] border-collapse text-sm">

                      <thead>

                        <tr className="bg-slate-50">

                          <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500 sm:px-5">
                            Activity
                          </th>

                          {publicationTable.departments.map(
                            (department) => (
                              <th
                                key={
                                  department
                                }
                                title={getDepartmentLabel(
                                  department
                                )}
                                className="border-b border-slate-200 px-3 py-3.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-500"
                              >
                                {getDepartmentCode(
                                  department
                                )}
                              </th>
                            )
                          )}

                          <th className="border-b border-slate-200 px-4 py-3.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            Total
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {publicationTable.activities.map(
                          (activity) => {

                            const row =
                              publicationTable
                                .activityMap
                                .get(
                                  activity
                                ) || {};

                            const total =
                              publicationTable
                                .departments
                                .reduce(
                                  (
                                    sum,
                                    department
                                  ) =>
                                    sum +
                                    (
                                      row[
                                        department
                                      ] || 0
                                    ),
                                  0
                                );

                            return (
                              <tr
                                key={
                                  activity
                                }
                                className="transition hover:bg-teal-50/40"
                              >

                                <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-4 py-3.5 font-semibold text-slate-700 sm:px-5">
                                  <span className="block max-w-[240px] truncate">
                                    {activity}
                                  </span>
                                </td>

                                {publicationTable.departments.map(
                                  (
                                    department
                                  ) => {

                                    const count =
                                      row[
                                        department
                                      ] || 0;

                                    return (
                                      <td
                                        key={
                                          department
                                        }
                                        className="border-b border-slate-100 px-3 py-3.5 text-center"
                                      >
                                        {count >
                                        0 ? (
                                          <span className="inline-flex min-w-7 items-center justify-center rounded-lg bg-teal-50 px-2 py-1 font-bold text-teal-700">
                                            {
                                              count
                                            }
                                          </span>
                                        ) : (
                                          <span className="text-slate-300">
                                            —
                                          </span>
                                        )}
                                      </td>
                                    );
                                  }
                                )}

                                <td className="border-b border-slate-100 px-4 py-3.5 text-center font-black text-slate-800">
                                  {total}
                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                      <tfoot>

                        <tr className="bg-slate-50">

                          <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-4 py-3.5 font-black text-slate-800 sm:px-5">
                            Total
                          </td>

                          {publicationTable.departments.map(
                            (
                              department
                            ) => {

                              const total =
                                publicationTable
                                  .activities
                                  .reduce(
                                    (
                                      sum,
                                      activity
                                    ) =>
                                      sum +
                                      (
                                        publicationTable
                                          .activityMap
                                          .get(
                                            activity
                                          )?.[
                                            department
                                          ] ||
                                        0
                                      ),
                                    0
                                  );

                              return (
                                <td
                                  key={
                                    department
                                  }
                                  className="px-3 py-3.5 text-center font-black text-teal-700"
                                >
                                  {total}
                                </td>
                              );
                            }
                          )}

                          <td className="px-4 py-3.5 text-center font-black text-slate-900">
                            {publicationTable.activities.reduce(
                              (
                                grandTotal,
                                activity
                              ) =>
                                grandTotal +
                                publicationTable
                                  .departments
                                  .reduce(
                                    (
                                      sum,
                                      department
                                    ) =>
                                      sum +
                                      (
                                        publicationTable
                                          .activityMap
                                          .get(
                                            activity
                                          )?.[
                                            department
                                          ] ||
                                        0
                                      ),
                                    0
                                  ),
                              0
                            )}
                          </td>

                        </tr>

                      </tfoot>

                    </table>

                  </div>

                  <div className="border-t border-slate-100 bg-white px-4 py-2.5 text-center text-[11px] text-slate-400 sm:hidden">
                    Swipe horizontally to view all departments
                  </div>

                </div>

              ) : (

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                    <BookOpen size={30} />
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    No published articles found.
                  </p>

                </div>

              )}

            </>
          )}

        </div>

      </section>
<footer className="border-t border-slate-200 bg-white">
  <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
    <p className="text-center text-[11px] leading-5 text-slate-400 sm:text-xs">
      © {new Date().getFullYear()} Karnataka (Govt.) Polytechnic,
      Mangaluru. KPT E-Magazine.
    </p>
  </div>
</footer>
    </main>
  );
}

function getIssueKey(article) {
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

function getMonthFromDate(date) {
  if (!date) return null;

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed.getMonth() + 1;
}

function getYearFromDate(date) {
  if (!date) return null;

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed.getFullYear();
}

function getMonthName(month) {
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

function getDepartmentCode(
  department
) {
  const value =
    String(
      department || ""
    )
      .trim()
      .toUpperCase();

  const codes = {
    AE: "AE",
    CE: "CE",
    ME: "ME",
    EE: "EE",
    CH: "CH",
    PT: "PT",
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
    return "AE";
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
    return "PT";
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
      (word) => word[0]
    )
    .join("");
}

function getDepartmentLabel(
  department
) {
  const value =
    String(
      department || ""
    )
      .trim()
      .toUpperCase();

  const labels = {
    AE: "Automobile Engineering",
    CE: "Civil Engineering",
    ME: "Mechanical Engineering",
    EE: "Electrical & Electronics Engineering",
    CH: "Chemical Engineering",
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