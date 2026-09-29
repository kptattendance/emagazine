"use client";

import Link from "next/link";

import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  GraduationCap,
  Image as ImageIcon,
  Library,
  Search,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { useState } from "react";

// ============================================================
// SAMPLE ACTIVITY DATA
// ============================================================

const activities = [
  {
    id: 1,
    month: "September 2026",
    category: "Technical",
    title:
      "Technical Workshop & Skill Development Programme",
    department:
      "Computer Science & Engineering",
    date: "18 Sep 2026",
    description:
      "A department-level technical programme focused on practical learning, emerging technologies and student skill development.",
  },

  {
    id: 2,
    month: "September 2026",
    category: "Student Activity",
    title:
      "Student Innovation and Project Showcase",
    department:
      "Electronics & Communication Engineering",
    date: "15 Sep 2026",
    description:
      "Students presented innovative project ideas and practical solutions developed as part of their academic activities.",
  },

  {
    id: 3,
    month: "September 2026",
    category: "Seminar",
    title:
      "Expert Lecture on Industry Readiness",
    department:
      "Mechanical Engineering",
    date: "11 Sep 2026",
    description:
      "An expert interaction covering industry expectations, professional skills and opportunities for diploma students.",
  },

  {
    id: 4,
    month: "August 2026",
    category: "Institutional",
    title:
      "Independence Day Celebration",
    department: "Institution",
    date: "15 Aug 2026",
    description:
      "The institution observed Independence Day with student participation, cultural activities and an institutional programme.",
  },

  {
    id: 5,
    month: "August 2026",
    category: "Achievement",
    title:
      "Student Achievement in Technical Competition",
    department: "Civil Engineering",
    date: "08 Aug 2026",
    description:
      "Students represented the institution in an external technical competition and received recognition for their performance.",
  },

  {
    id: 6,
    month: "July 2026",
    category: "Industrial Visit",
    title:
      "Industrial Visit and Industry Interaction",
    department: "Automobile Engineering",
    date: "22 Jul 2026",
    description:
      "Students visited an industrial establishment to gain practical exposure to industrial processes and workplace practices.",
  },
];

// ============================================================
// CATEGORIES
// ============================================================

const categories = [
  "All",
  "Technical",
  "Seminar",
  "Workshop",
  "Industrial Visit",
  "Student Activity",
  "Achievement",
  "Institutional",
  "Sports",
  "Cultural",
];

// ============================================================
// HOME PAGE
// ============================================================

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredActivities = activities.filter(
    (activity) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        activity.title
          .toLowerCase()
          .includes(searchText) ||
        activity.department
          .toLowerCase()
          .includes(searchText) ||
        activity.category
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        category === "All" ||
        activity.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-800">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-teal-100 bg-white">

        <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-teal-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-10 h-[300px] w-[300px] rounded-full bg-amber-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr]">

          {/* HERO LEFT */}

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

              Discover the academic, technical,
              cultural, sports and institutional
              activities happening across Karnataka
              Government Polytechnic, Mangaluru.

            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="#latest"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 hover:shadow-md"
              >
                Explore Activities

                <ArrowRight size={17} />
              </Link>

              <Link
                href="#archive"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
              >
                <Library size={17} />

                Magazine Archive

              </Link>

            </div>

          </div>

          {/* HERO MAGAZINE */}

          <div className="relative">

            <div className="rounded-[2rem] border border-teal-100 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-5 shadow-2xl">

              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur">

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-900">

                    <BookOpen size={24} />

                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-100">
                    September 2026
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

                  Monthly highlights from departments,
                  students, faculty and the institution.

                </p>

                <div className="mt-8 grid grid-cols-3 gap-2">

                  <MagazineMiniStat
                    value="08"
                    label="Departments"
                  />

                  <MagazineMiniStat
                    value="10+"
                    label="Activities"
                  />

                  <MagazineMiniStat
                    value="01"
                    label="Issue"
                  />

                </div>

                <Link
                  href="#archive"
                  className="mt-6 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-800 transition hover:bg-amber-50"
                >

                  Read latest issue

                  <ArrowRight size={17} />

                </Link>

              </div>

            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-amber-200 bg-white p-4 shadow-lg sm:block">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">

                  <Award size={20} />

                </div>

                <div>

                  <p className="text-xs font-bold text-slate-900">
                    Campus Highlights
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Updated every month
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6">

        <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:grid-cols-4">

          <StatCard
            icon={<GraduationCap size={21} />}
            value="08"
            label="Departments"
          />

          <StatCard
            icon={<CalendarDays size={21} />}
            value="Monthly"
            label="Publication"
          />

          <StatCard
            icon={<Camera size={21} />}
            value="100+"
            label="Campus Stories"
          />

          <StatCard
            icon={<Users size={21} />}
            value="KPT"
            label="Community"
          />

        </div>

      </section>

      {/* ======================================================
          LATEST ACTIVITIES
      ====================================================== */}

      <section
        id="latest"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-14 sm:px-6"
      >

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>

            <div className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Latest from campus
            </div>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Recent Activities
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Explore recent academic, technical,
              student and institutional activities
              from across the campus.
            </p>

          </div>

          <Link
            href="#archive"
            className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800"
          >
            View archive

            <ChevronRight size={16} />

          </Link>

        </div>

        {/* SEARCH */}

        <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search activities, departments..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50"
            />

          </div>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-50 sm:w-52"
          >

            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Categories"
                  : item}
              </option>
            ))}

          </select>

        </div>

        {/* ACTIVITY CARDS */}

        {filteredActivities.length === 0 ? (

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <Search
              size={30}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-bold text-slate-700">
              No activities found
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Try changing the search or category.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {filteredActivities.map(
              (activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                />
              )
            )}

          </div>

        )}

      </section>

      {/* ======================================================
          DEPARTMENTS
      ====================================================== */}

      <section
        id="departments"
        className="scroll-mt-24 border-y border-teal-100 bg-teal-50/60"
      >

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6">

          <div className="mb-8">

            <div className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Explore by department
            </div>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              Departments
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Browse activities and achievements
              published by each department.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <DepartmentCard
              code="CSE"
              name="Computer Science & Engineering"
              count="Department activities"
            />

            <DepartmentCard
              code="ECE"
              name="Electronics & Communication Engineering"
              count="Department activities"
            />

            <DepartmentCard
              code="ME"
              name="Mechanical Engineering"
              count="Department activities"
            />

            <DepartmentCard
              code="CE"
              name="Civil Engineering"
              count="Department activities"
            />

            <DepartmentCard
              code="AE"
              name="Automobile Engineering"
              count="Department activities"
            />

            <DepartmentCard
              code="EEE"
              name="Electrical & Electronics Engineering"
              count="Department activities"
            />

            <DepartmentCard
              code="GEN"
              name="General / Institutional"
              count="Institutional activities"
            />

            <DepartmentCard
              code="ALL"
              name="All Departments"
              count="Browse complete archive"
              highlighted
            />

          </div>

        </div>

      </section>

      {/* ======================================================
          ACHIEVEMENTS
      ====================================================== */}

      <section
        id="achievements"
        className="scroll-mt-24 mx-auto max-w-7xl px-5 py-14 sm:px-6"
      >

        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">

          <div className="rounded-[2rem] bg-slate-900 p-7 shadow-xl sm:p-9">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-900">
              <Trophy size={26} />
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              Celebrating KPT
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-white">
              Achievements that deserve a place in our story.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Student achievements, faculty
              accomplishments, competitions, awards
              and institutional milestones can be
              brought together in one searchable
              digital archive.
            </p>

            <Link
              href="#archive"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-50"
            >
              Explore achievements

              <ArrowRight size={17} />

            </Link>

          </div>

          <div>

            <div className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Highlights
            </div>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              What can be featured
            </h2>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              <HighlightCard
                icon={<Trophy size={20} />}
                title="Student Achievements"
                description="Competitions, awards and recognitions."
              />

              <HighlightCard
                icon={<Award size={20} />}
                title="Faculty Achievements"
                description="Professional and academic accomplishments."
              />

              <HighlightCard
                icon={<Sparkles size={20} />}
                title="Innovations"
                description="Projects, ideas and student innovations."
              />

              <HighlightCard
                icon={<GraduationCap size={20} />}
                title="Academic Highlights"
                description="Academic programmes and milestones."
              />

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          ARCHIVE
      ====================================================== */}

      <section
        id="archive"
        className="scroll-mt-24 border-y border-amber-100 bg-amber-50/60"
      >

        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Digital library
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Magazine Archive
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Every monthly issue can become part
                of a permanent institutional archive.
              </p>

            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-amber-800 shadow-sm">

              <Library size={17} />

              Digital Archive

            </div>

          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <IssueCard
              month="September"
              year="2026"
              status="Latest Issue"
            />

            <IssueCard
              month="August"
              year="2026"
              status="Archived"
            />

            <IssueCard
              month="July"
              year="2026"
              status="Archived"
            />

          </div>

        </div>

      </section>

      {/* ======================================================
          CALL TO ACTION
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6">

        <div className="overflow-hidden rounded-[2rem] bg-teal-700 px-6 py-10 sm:px-10">

          <div className="flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">
                KPT E-Magazine
              </p>

              <h2 className="mt-2 max-w-2xl text-3xl font-black text-white">
                Every activity has a story. Every
                story becomes part of our
                institutional memory.
              </h2>

            </div>

            <Link
              href="#latest"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-amber-50"
            >
              Explore Magazine

              <ArrowRight size={17} />

            </Link>

          </div>

        </div>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

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
                  href="#latest"
                  className="block transition hover:text-teal-700"
                >
                  Latest Activities
                </a>

                <a
                  href="#departments"
                  className="block transition hover:text-teal-700"
                >
                  Departments
                </a>

                <a
                  href="#achievements"
                  className="block transition hover:text-teal-700"
                >
                  Achievements
                </a>

                <a
                  href="#archive"
                  className="block transition hover:text-teal-700"
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

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  value,
  label,
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:p-5 sm:last:border-r-0">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        {icon}
      </div>

      <div>

        <p className="text-lg font-black text-slate-900">
          {value}
        </p>

        <p className="text-xs text-slate-500">
          {label}
        </p>

      </div>

    </div>
  );
}

// ============================================================
// MAGAZINE MINI STAT
// ============================================================

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

// ============================================================
// ACTIVITY CARD
// ============================================================

function ActivityCard({
  activity,
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">

      {/* IMAGE AREA */}

      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">

        <div className="absolute inset-0 flex items-center justify-center">

          <ImageIcon
            size={42}
            strokeWidth={1.2}
            className="text-white/30 transition duration-300 group-hover:scale-110 group-hover:text-white/50"
          />

        </div>

        <div className="absolute left-4 top-4">

          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 shadow-sm">
            {activity.category}
          </span>

        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs font-medium text-white/90">

          <CalendarDays size={13} />

          {activity.date}

        </div>

      </div>

      {/* CONTENT */}

      <div className="p-5">

        <p className="text-xs font-bold text-teal-700">
          {activity.department}
        </p>

        <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-slate-900">
          {activity.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
          {activity.description}
        </p>

        <button
          type="button"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 transition group-hover:text-teal-800"
        >
          Read story

          <ArrowRight
            size={15}
            className="transition group-hover:translate-x-1"
          />

        </button>

      </div>

    </article>
  );
}

// ============================================================
// DEPARTMENT CARD
// ============================================================

function DepartmentCard({
  code,
  name,
  count,
  highlighted = false,
}) {
  return (
    <Link
      href="#latest"
      className={`group rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        highlighted
          ? "border-amber-200 bg-amber-50"
          : "border-teal-100 bg-white hover:border-teal-200"
      }`}
    >

      <div className="flex items-start justify-between gap-3">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black ${
            highlighted
              ? "bg-amber-400 text-slate-900"
              : "bg-teal-50 text-teal-700"
          }`}
        >
          {code}
        </div>

        <ChevronRight
          size={17}
          className="mt-2 text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-700"
        />

      </div>

      <h3 className="mt-5 text-sm font-bold leading-5 text-slate-900">
        {name}
      </h3>

      <p className="mt-2 text-xs text-slate-500">
        {count}
      </p>

    </Link>
  );
}

// ============================================================
// HIGHLIGHT CARD
// ============================================================

function HighlightCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}

// ============================================================
// ISSUE CARD
// ============================================================

function IssueCard({
  month,
  year,
  status,
}) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

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
            {month}
          </p>

          <p className="text-sm font-semibold text-amber-300">
            {year}
          </p>

        </div>

      </div>

      <div className="flex items-center justify-between p-5">

        <div>

          <p className="text-sm font-bold text-slate-900">
            {month} {year} Issue
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">

            <Clock3 size={12} />

            {status}

          </p>

        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition hover:bg-teal-700 hover:text-white"
          aria-label={`Read ${month} ${year} issue`}
        >
          <ArrowRight size={16} />
        </button>

      </div>

    </div>
  );
}