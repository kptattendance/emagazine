"use client";

import Link from "next/link";
import {
  CalendarDays,
  Newspaper,
  Building2,
  Users,
  Trophy,
  Image,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  FileText,
  Plus,
} from "lucide-react";

const statistics = [
  {
    title: "Total Activities",
    value: "128",
    description: "Activities recorded",
    icon: CalendarDays,
  },
  {
    title: "Published",
    value: "96",
    description: "Published activities",
    icon: CheckCircle2,
  },
  {
    title: "Pending Review",
    value: "18",
    description: "Awaiting approval",
    icon: Clock3,
  },
  {
    title: "Magazine Issues",
    value: "12",
    description: "Issues published",
    icon: Newspaper,
  },
];

const recentActivities = [
  {
    title: "Independence Day Celebration",
    department: "General",
    date: "15 Aug 2026",
    status: "Published",
  },
  {
    title: "Technical Skill Development Workshop",
    department: "CSE",
    date: "12 Aug 2026",
    status: "Published",
  },
  {
    title: "Inter Department Sports Meet",
    department: "Sports",
    date: "10 Aug 2026",
    status: "Pending",
  },
  {
    title: "Industrial Visit",
    department: "Mechanical Engineering",
    date: "08 Aug 2026",
    status: "Published",
  },
  {
    title: "Student Project Exhibition",
    department: "ECE",
    date: "05 Aug 2026",
    status: "Pending",
  },
];

const departments = [
  {
    name: "Computer Science & Engineering",
    shortName: "CSE",
    activities: 24,
  },
  {
    name: "Electronics & Communication Engineering",
    shortName: "ECE",
    activities: 19,
  },
  {
    name: "Mechanical Engineering",
    shortName: "ME",
    activities: 21,
  },
  {
    name: "Civil Engineering",
    shortName: "CE",
    activities: 17,
  },
  {
    name: "Electrical & Electronics Engineering",
    shortName: "EEE",
    activities: 15,
  },
  {
    name: "Automobile Engineering",
    shortName: "AE",
    activities: 12,
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-[1600px]">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-teal-700">
            Administration
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage KPT Mangaluru eMagazine activities and publications.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/activities/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            <Plus size={18} />
            Add Activity
          </Link>

          <Link
            href="/admin/magazine/new"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
          >
            <Newspaper size={18} />
            New Magazine
          </Link>
        </div>
      </div>

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ================================================= */}
      {/* QUICK ACTIONS */}
      {/* ================================================= */}

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="text-sm text-slate-500">
            Frequently used administration functions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/admin/activities/new"
            icon={CalendarDays}
            title="Add Activity"
            description="Record a new institutional activity"
          />

          <QuickAction
            href="/admin/magazine/new"
            icon={Newspaper}
            title="Create Issue"
            description="Create a new monthly magazine"
          />

          <QuickAction
            href="/admin/media"
            icon={Image}
            title="Manage Media"
            description="View and manage uploaded images"
          />

          <QuickAction
            href="/admin/reports"
            icon={FileText}
            title="Reports"
            description="View activity and publication reports"
          />
        </div>
      </div>

      {/* ================================================= */}
      {/* RECENT ACTIVITIES + SIDE PANEL */}
      {/* ================================================= */}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Recent Activities */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="font-bold text-slate-900">
                Recent Activities
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest activities submitted to the eMagazine.
              </p>
            </div>

            <Link
              href="/admin/activities"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              View All
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <CalendarDays size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {activity.title}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{activity.department}</span>
                      <span>{activity.date}</span>
                    </div>
                  </div>
                </div>

                <StatusBadge status={activity.status} />
              </div>
            ))}
          </div>
        </section>

        {/* Magazine */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5">
            <h2 className="font-bold text-slate-900">
              Current Magazine
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest monthly publication.
            </p>
          </div>

          <div className="p-5">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 p-6 text-white">
              <div className="flex items-center gap-2 text-amber-300">
                <Newspaper size={18} />

                <span className="text-xs font-bold uppercase tracking-wider">
                  Monthly Issue
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold">
                August 2026
              </h3>

              <p className="mt-2 text-sm leading-6 text-teal-100">
                Academic activities, achievements, events and campus
                highlights.
              </p>

              <Link
                href="/admin/magazine"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-amber-50"
              >
                Manage Issue
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ================================================= */}
      {/* DEPARTMENTS */}
      {/* ================================================= */}

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Department Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Activity contribution by department.
            </p>
          </div>

          <Link
            href="/admin/departments"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Manage
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <div
              key={department.shortName}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700">
                  {department.shortName}
                </div>

                <Building2
                  size={18}
                  className="text-slate-300 transition group-hover:text-teal-600"
                />
              </div>

              <h3 className="mt-4 text-sm font-bold leading-5 text-slate-800">
                {department.name}
              </h3>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">
                  Activities
                </span>

                <span className="text-sm font-bold text-teal-700">
                  {department.activities}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <div className="mt-10 border-t border-slate-200 pt-6 text-center">
        <p className="text-xs text-slate-400">
          KPT Mangaluru eMagazine Administration
        </p>
      </div>
    </div>
  );
}

/* ===================================================== */
/* QUICK ACTION */
/* ===================================================== */

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
        <Icon size={21} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-700">
        Open
        <ArrowUpRight size={14} />
      </div>
    </Link>
  );
}

/* ===================================================== */
/* STATUS BADGE */
/* ===================================================== */

function StatusBadge({ status }) {
  const published = status === "Published";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        published
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published
            ? "bg-emerald-500"
            : "bg-amber-500"
        }`}
      />

      {status}
    </span>
  );
}