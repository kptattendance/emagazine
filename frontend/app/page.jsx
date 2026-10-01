"use client";

import axios from "axios";
import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  ChevronDown,
  Clock3,
  Library,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tableSearch, setTableSearch] = useState("");
  const [tableDepartment, setTableDepartment] =
    useState("all");
  const [tableMonth, setTableMonth] =
    useState("all");

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

        const list = Array.isArray(data)
          ? data
          : [];

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

      const student =
        article.student || {};

      const department =
        article.department ||
        student.department ||
        "IN";

      const month =
        article.magazineMonth ||
        getMonthFromDate(
          article.eventDate
        );

      const year =
        article.magazineYear ||
        getYearFromDate(
          article.eventDate
        );

      return {
        ...article,

        activityName:
          activity ||
          "General Activity",

        departmentName:
          department || "IN",

        issueMonth:
          Number(month) || null,

        issueYear:
          Number(year) || null,
      };
    });
  }, [articles]);

  const monthOptions = useMemo(() => {
    const map = new Map();

    normalizedArticles.forEach(
      (article) => {
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
          month:
            article.issueMonth,
          year:
            article.issueYear,
          label:
            `${getMonthName(
              article.issueMonth
            )} ${article.issueYear}`,
        });
      }
    );

    return Array.from(
      map.values()
    ).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }

      return b.month - a.month;
    });
  }, [normalizedArticles]);

  const departmentOptions =
    useMemo(() => {
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

  const publicationTable =
    useMemo(() => {
      let source =
        normalizedArticles;

      if (tableMonth !== "all") {
        source = source.filter(
          (article) =>
            getIssueKey(article) ===
            tableMonth
        );
      }

      if (
        tableDepartment !==
        "all"
      ) {
        source = source.filter(
          (article) =>
            article.departmentName ===
            tableDepartment
        );
      }

      const departmentSet =
        new Set();

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
          getDepartmentCode(a).localeCompare(
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

  const departmentCount =
    new Set(
      normalizedArticles
        .map(
          (article) =>
            article.departmentName
        )
        .filter(Boolean)
    ).size;

  const issueCount =
    monthOptions.length;

  const latestIssue =
    monthOptions.length
      ? monthOptions[0]
      : null;

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-800">

      {/* HERO */}

      <section className="relative overflow-hidden border-b border-teal-100 bg-white">

        <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-teal-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-10 h-[300px] w-[300px] rounded-full bg-amber-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr]">

          <div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Sparkles size={15} />
              Official Digital Magazine
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
              Stories, Activities &
              <span className="block text-teal-700">
                Achievements of KPT
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Discover published academic,
              technical, cultural, sports and
              institutional activities from
              Karnataka Government Polytechnic,
              Mangaluru.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="#archive"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
              >
                Explore Magazine
                <ArrowRight size={17} />
              </Link>

              <Link
                href="#publication-summary"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
              >
                <BookOpen size={17} />
                Publications
              </Link>

            </div>

          </div>

          <div>

            <div className="rounded-[2rem] border border-teal-100 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-5 shadow-2xl">

              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-900">
                    <BookOpen size={24} />
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-100">
                    {latestIssue
                      ? latestIssue.label
                      : "Digital Archive"}
                  </span>

                </div>

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                  KPT E-Magazine
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight text-white">
                  Campus
                  <br />
                  Chronicle
                </h2>

                <p className="mt-4 text-sm leading-6 text-teal-100">
                  Monthly published stories from
                  departments, students, faculty
                  and the institution.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-2">

                  <MagazineMiniStat
                    value={String(
                      departmentCount
                    ).padStart(2, "0")}
                    label="Departments"
                  />

                  <MagazineMiniStat
                    value={String(
                      normalizedArticles.length
                    )}
                    label="Articles"
                  />

                  <MagazineMiniStat
                    value={String(
                      issueCount
                    ).padStart(2, "0")}
                    label="Issues"
                  />

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* PUBLICATION SUMMARY */}

      <section
        id="publication-summary"
        className="border-b border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">

          <div className="mb-6">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Publication Summary
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900">
              Department-wise Publications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Published article count by activity
              and department.
            </p>

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

              <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">

                <div className="relative">

                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
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
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                  >
                    Clear
                  </button>
                )}

              </div>

              {publicationTable.activities
                .length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">

                  <table className="w-full min-w-[700px] border-collapse text-sm">

                    <thead>

                      <tr className="bg-slate-50">

                        <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
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
                              className="border-b border-slate-200 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600"
                            >
                              {getDepartmentCode(
                                department
                              )}
                            </th>
                          )
                        )}

                        <th className="border-b border-slate-200 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
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
                                  (row[
                                    department
                                  ] || 0),
                                0
                              );

                          return (
                            <tr
                              key={
                                activity
                              }
                              className="hover:bg-teal-50/40"
                            >

                              <td className="sticky left-0 z-[1] border-b border-r border-slate-100 bg-white px-4 py-3 font-semibold text-slate-700">
                                {activity}
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
                                      className="border-b border-slate-100 px-3 py-3 text-center"
                                    >
                                      {count >
                                      0 ? (
                                        <span className="font-bold text-teal-700">
                                          {count}
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

                              <td className="border-b border-slate-100 px-4 py-3 text-center font-black text-slate-800">
                                {total}
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                    <tfoot>

                      <tr className="bg-slate-50">

                        <td className="sticky left-0 z-[1] border-r border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-800">
                          Total
                        </td>

                        {publicationTable.departments.map(
                          (department) => {

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
                                        ] || 0
                                    ),
                                  0
                                );

                            return (
                              <td
                                key={
                                  department
                                }
                                className="px-3 py-3 text-center font-black text-teal-700"
                              >
                                {total}
                              </td>
                            );
                          }
                        )}

                        <td className="px-4 py-3 text-center font-black text-slate-900">
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
                                        ] || 0
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
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                  <BookOpen
                    size={32}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    No published articles
                    found.
                  </p>
                </div>
              )}

            </>
          )}

        </div>

      </section>

      {/* ARCHIVE */}

      <section
        id="archive"
        className="border-y border-amber-100 bg-amber-50/60"
      >

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Digital Library
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Magazine Archive
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Select an issue to open the magazine.
              </p>

            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-amber-800 shadow-sm">
              <Library size={17} />
              Digital Archive
            </div>

          </div>

          {monthOptions.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {monthOptions.map(
                (issue, index) => (
                  <Link
                    key={issue.value}
                    href={`/magazine?month=${issue.value}`}
                    className="group overflow-hidden rounded-3xl border border-amber-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >

                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-teal-800 to-slate-900">

                      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl" />

                      <div className="relative text-center">

                        <BookOpen
                          size={38}
                          strokeWidth={1.2}
                          className="mx-auto text-amber-300"
                        />

                        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">
                          KPT E-Magazine
                        </p>

                        <p className="mt-1 text-2xl font-black text-white">
                          {getMonthName(
                            issue.month
                          )}
                        </p>

                        <p className="text-sm font-semibold text-amber-300">
                          {issue.year}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center justify-between p-5">

                      <div>

                        <p className="text-sm font-bold text-slate-900">
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

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
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
            <div className="mt-8 rounded-3xl border border-amber-200 bg-white px-6 py-12 text-center">

              <BookOpen
                size={32}
                className="mx-auto text-amber-400"
              />

              <p className="mt-4 font-bold text-slate-700">
                No magazine issues published yet.
              </p>

            </div>
          )}

        </div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">

          <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
                  <BookOpen size={20} />
                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    KPT E-Magazine
                  </p>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
                    Karnataka Government Polytechnic
                  </p>

                </div>

              </div>

              <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
                A digital platform for documenting
                and sharing the academic, technical,
                cultural, sports and institutional
                activities of KPT Mangaluru.
              </p>

            </div>

            <div>

              <p className="text-sm font-bold text-slate-900">
                Explore
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-500">

                <a
                  href="#publication-summary"
                  className="block hover:text-teal-700"
                >
                  Publications
                </a>

                <a
                  href="#archive"
                  className="block hover:text-teal-700"
                >
                  Magazine Archive
                </a>

              </div>

            </div>

            <div>

              <p className="text-sm font-bold text-slate-900">
                Magazine
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-500">

                <p className="flex items-center gap-2">
                  <CalendarDays size={15} />
                  Monthly publication
                </p>

                <p className="flex items-center gap-2">
                  <Camera size={15} />
                  Activity photo gallery
                </p>

                <p className="flex items-center gap-2">
                  <BookOpen size={15} />
                  Digital archive
                </p>

                <p className="flex items-center gap-2">
                  <Trophy size={15} />
                  Achievements
                </p>

              </div>

            </div>

          </div>

          <div className="mt-9 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Karnataka Government Polytechnic,
            Mangaluru. KPT E-Magazine.
          </div>

        </div>

      </footer>

    </main>
  );
}

function MagazineMiniStat({
  value,
  label,
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-center">

      <p className="text-lg font-black text-white">
        {value}
      </p>

      <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-teal-100">
        {label}
      </p>

    </div>
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