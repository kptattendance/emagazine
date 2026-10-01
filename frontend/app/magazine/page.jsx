"use client";

import axios from "axios";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function MagazinePage() {
  const searchParams =
    useSearchParams();

  const selectedIssue =
    searchParams.get("month") ||
    "all";

  const [articles, setArticles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [department, setDepartment] =
    useState("all");

  const [activity, setActivity] =
    useState("all");

  const [selectedArticle, setSelectedArticle] =
    useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadArticles = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            `${API_URL}/api/magazine-content/published`
          );

        const data =
          response.data?.data ||
          response.data?.contents ||
          response.data?.articles ||
          response.data ||
          [];

        const list =
          Array.isArray(data)
            ? data
            : [];

        if (!cancelled) {
          setArticles(list);
        }
      } catch (error) {
        console.error(
          "Failed to load magazine:",
          error
        );

        if (!cancelled) {
          setArticles([]);
          setError(
            "Unable to load magazine articles."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedArticles =
    useMemo(() => {
      return articles.map(
        (article) => {
          const activityName =
            typeof article.activity ===
            "object"
              ? article.activity?.name
              : article.activity;

          const student =
            article.student || {};

          const departmentName =
            article.department ||
            student.department ||
            "IN";

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

            studentName:
              student.name || "",

            registerNumber:
              student.registerNumber ||
              "",

            semester:
              student.semester ??
              null,

            studentPhoto:
              student.photo || "",

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
      );
    }, [articles]);

  const issueArticles =
    useMemo(() => {
      if (
        selectedIssue ===
        "all"
      ) {
        return normalizedArticles;
      }

      return normalizedArticles.filter(
        (article) =>
          getIssueKey(article) ===
          selectedIssue
      );
    }, [
      normalizedArticles,
      selectedIssue,
    ]);

  const issueInfo =
    useMemo(() => {
      const article =
        issueArticles.find(
          (item) =>
            getIssueKey(item) ===
            selectedIssue
        );

      if (!article) {
        return null;
      }

      return {
        month:
          article.issueMonth,
        year:
          article.issueYear,
      };
    }, [
      issueArticles,
      selectedIssue,
    ]);

  const departmentOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          issueArticles
            .map(
              (article) =>
                article.departmentName
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        getDepartmentCode(a).localeCompare(
          getDepartmentCode(b)
        )
      );
    }, [issueArticles]);

  const activityOptions =
    useMemo(() => {
      let source =
        issueArticles;

      if (
        department !== "all"
      ) {
        source =
          source.filter(
            (article) =>
              article.departmentName ===
              department
          );
      }

      return Array.from(
        new Set(
          source
            .map(
              (article) =>
                article.activityName
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [
      issueArticles,
      department,
    ]);

  const filteredArticles =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return issueArticles.filter(
        (article) => {

          if (
            department !==
              "all" &&
            article.departmentName !==
              department
          ) {
            return false;
          }

          if (
            activity !==
              "all" &&
            article.activityName !==
              activity
          ) {
            return false;
          }

          if (searchText) {
            const searchable =
              [
                article.title,
                article.description,
                article.activityName,
                article.departmentName,
                article.studentName,
                article.registerNumber,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            if (
              !searchable.includes(
                searchText
              )
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      issueArticles,
      search,
      department,
      activity,
    ]);

  useEffect(() => {
    if (
      department !== "all" &&
      !departmentOptions.includes(
        department
      )
    ) {
      setDepartment("all");
    }
  }, [
    department,
    departmentOptions,
  ]);

  useEffect(() => {
    if (
      activity !== "all" &&
      !activityOptions.includes(
        activity
      )
    ) {
      setActivity("all");
    }
  }, [
    activity,
    activityOptions,
  ]);

  const clearFilters = () => {
    setSearch("");
    setDepartment("all");
    setActivity("all");
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-800">

      {/* HEADER */}

      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">

          <Link
            href="/#archive"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800"
          >
            <ArrowLeft size={16} />
            Back to Magazine Archive
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                KPT E-Magazine
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">

                {issueInfo
                  ? `${getMonthName(
                      issueInfo.month
                    )} ${issueInfo.year}`
                  : selectedIssue !==
                    "all"
                  ? "Magazine Issue"
                  : "Magazine"}

              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Published articles from this
                magazine issue.
              </p>

            </div>

            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">

              {filteredArticles.length}
              {" "}
              Article
              {filteredArticles.length ===
              1
                ? ""
                : "s"}

            </div>

          </div>

        </div>

      </section>

      {/* CONTENT */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6">

        {/* FILTERS */}

        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">

          <div className="relative">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search articles..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
            />

          </div>

          <div className="relative">

            <select
              value={department}
              onChange={(e) =>
                setDepartment(
                  e.target.value
                )
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
            >

              <option value="all">
                All Departments
              </option>

              {departmentOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {getDepartmentCode(
                      item
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
              value={activity}
              onChange={(e) =>
                setActivity(
                  e.target.value
                )
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
            >

              <option value="all">
                All Activities
              </option>

              {activityOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}

            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>

          {(search ||
            department !== "all" ||
            activity !== "all") && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              Clear
            </button>
          )}

        </div>

        {/* ARTICLES */}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <p className="text-sm text-slate-500">
              Loading magazine...
            </p>

          </div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 px-6 py-16 text-center">

            <p className="font-bold text-red-700">
              {error}
            </p>

          </div>
        ) : filteredArticles.length >
          0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {filteredArticles.map(
              (article) => (
                <ArticleCard
                  key={article._id}
                  article={article}
                  onRead={() =>
                    setSelectedArticle(
                      article
                    )
                  }
                />
              )
            )}

          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <BookOpen
              size={38}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-bold text-slate-700">
              No articles found.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              No published articles match
              the selected filters.
            </p>

          </div>
        )}

      </section>

      {selectedArticle && (
        <ArticleModal
          article={
            selectedArticle
          }
          onClose={() =>
            setSelectedArticle(
              null
            )
          }
        />
      )}

    </main>
  );
}

function ArticleCard({
  article,
  onRead,
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">

      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">

        {article.eventPhoto ? (
          <img
            src={article.eventPhoto}
            alt={article.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon
              size={46}
              className="text-white/30"
            />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute left-4 top-4">

          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 shadow-sm">
            {article.activityName}
          </span>

        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-white">

          <CalendarDays size={13} />

          {formatDate(
            article.eventDate
          )}

        </div>

      </div>

      <div className="p-5">

        <p className="text-xs font-bold text-teal-700">
          {getDepartmentLabel(
            article.departmentName
          )}
        </p>

        <h2 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-slate-900">
          {article.title}
        </h2>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
          {article.description}
        </p>

        {article.studentName && (
          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">

            {article.studentPhoto ? (
              <img
                src={
                  article.studentPhoto
                }
                alt={
                  article.studentName
                }
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <GraduationCap
                  size={17}
                />
              </div>
            )}

            <div className="min-w-0">

              <p className="truncate text-xs font-bold text-slate-800">
                {article.studentName}
              </p>

              <p className="text-[11px] text-slate-500">

                {article.registerNumber &&
                  article.registerNumber}

                {article.registerNumber &&
                  article.semester &&
                  " • "}

                {article.semester &&
                  `${article.semester}${getOrdinal(
                    article.semester
                  )} Semester`}

              </p>

            </div>

          </div>
        )}

        <button
          type="button"
          onClick={onRead}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-800"
        >
          Read article
          <ArrowRight size={15} />
        </button>

      </div>

    </article>
  );
}

function ArticleModal({
  article,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-red-50 hover:text-red-600"
        >
          <X size={20} />
        </button>

        <div className="max-h-[92vh] overflow-y-auto">

          {article.eventPhoto && (
            <div className="relative h-64 overflow-hidden bg-slate-900 sm:h-80">

              <img
                src={
                  article.eventPhoto
                }
                alt={
                  article.title
                }
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="absolute bottom-5 left-5 right-16">

                <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">
                  {
                    article.activityName
                  }
                </span>

              </div>

            </div>
          )}

          <div className="p-6 sm:p-8">

            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              {getDepartmentLabel(
                article.departmentName
              )}
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {article.title}
            </h2>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">

              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {formatDate(
                  article.eventDate
                )}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={14} />
                {getMonthName(
                  article.issueMonth
                )}{" "}
                {article.issueYear}
              </span>

            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">

              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {
                  article.description
                }
              </p>

            </div>

            {article.studentName && (
              <div className="mt-7 rounded-2xl border border-teal-100 bg-teal-50/60 p-5">

                <div className="flex items-center gap-4">

                  {article.studentPhoto ? (
                    <img
                      src={
                        article.studentPhoto
                      }
                      alt={
                        article.studentName
                      }
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-700">
                      <GraduationCap
                        size={28}
                      />
                    </div>
                  )}

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      Submitted by
                    </p>

                    <p className="mt-1 text-base font-black text-slate-900">
                      {
                        article.studentName
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">

                      {
                        article.registerNumber
                      }

                      {article.registerNumber &&
                        article.semester &&
                        " • "}

                      {article.semester &&
                        `${article.semester}${getOrdinal(
                          article.semester
                        )} Semester`}

                    </p>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

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

function getYearFromDate(date) {
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

function formatDate(date) {
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

function getOrdinal(number) {
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
      (word) =>
        word[0]
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