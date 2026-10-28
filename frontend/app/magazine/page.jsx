"use client";

import axios from "axios";
import Link from "next/link";

import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArticleCard,
  ArticleModal,
} from "../components/Article";

import {
  normalizeArticle,
  getIssueKey,
  getMonthName,
  getDepartmentCode,
} from "../lib/magazineFormat";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

const SECTIONS = [
  { value: "all", label: "All" },
  { value: "activity", label: "College Activities" },
  { value: "club", label: "Club Activities" },
  { value: "creative", label: "Creative Corner" },
  { value: "achievement", label: "Achievements" },
];

export default function MagazinePage() {
  const [section, setSection] =
    useState("all");

  const [selectedIssue, setSelectedIssue] =
    useState("all");

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

  // A shared link (?article=<id>) opens that article
  const [linkedArticleId, setLinkedArticleId] =
    useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const month =
      params.get("month");

    if (month) {
      setSelectedIssue(month);
    }

    setLinkedArticleId(params.get("article") || "");
  }, []);

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
    useMemo(
      () => articles.map(normalizeArticle),
      [articles]
    );

  useEffect(() => {
    if (!linkedArticleId) return;

    const article = normalizedArticles.find(
      (item) => String(item._id) === linkedArticleId
    );

    if (article) {
      setSelectedArticle(article);
      setLinkedArticleId("");
    }
  }, [linkedArticleId, normalizedArticles]);

  const issueArticles =
    useMemo(() => {
      return normalizedArticles.filter(
        (article) =>
          (selectedIssue === "all" ||
            getIssueKey(article) ===
              selectedIssue) &&
          (section === "all" ||
            article.contentType ===
              section)
      );
    }, [
      normalizedArticles,
      selectedIssue,
      section,
    ]);

  const issueInfo =
    useMemo(() => {
      if (
        selectedIssue === "all"
      ) {
        return null;
      }

      const article =
        normalizedArticles.find(
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
      normalizedArticles,
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

      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">

          <Link
            href="/#archive"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 transition hover:text-teal-800"
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
              {filteredArticles.length}{" "}
              Article
              {filteredArticles.length ===
              1
                ? ""
                : "s"}
            </div>

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6">

        <div className="mb-4 flex flex-wrap gap-2">
          {SECTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                setSection(item.value)
              }
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                section === item.value
                  ? "bg-teal-700 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

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
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
            >
              Clear
            </button>
          )}

        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />

            <p className="mt-4 text-sm text-slate-500">
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
