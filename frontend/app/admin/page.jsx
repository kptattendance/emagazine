"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import {
  DEPARTMENTS,
  getDepartmentLabel,
  normalizeDepartment,
} from "../lib/departments";
import {
  CalendarDays,
  Newspaper,
  Building2,
  Users,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Plus,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUS_LABELS = {
  published: "Published",
  pending: "Pending",
  rejected: "Rejected",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

export default function AdminPage() {
  const [contents, setContents] = useState([]);
  const [totalUsers, setTotalUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================================================= */
  /* LOAD REAL DATA */
  /* ================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [contentResponse, userResponse] =
          await Promise.all([
            axios.get(`${API_URL}/api/magazine-content`),
            axios.get(`${API_URL}/api/users`, {
              params: { limit: 1 },
            }),
          ]);

        if (cancelled) return;

        setContents(contentResponse.data?.data || []);

        setTotalUsers(
          userResponse.data?.pagination?.totalUsers ?? null
        );
      } catch (err) {
        console.error("ADMIN DASHBOARD LOAD ERROR:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================================================= */
  /* FIGURES */
  /* ================================================= */

  const countByStatus = (status) =>
    contents.filter((item) => item.status === status).length;

  const show = (value) =>
    loading || value === null ? "—" : value;

  const statistics = [
    {
      title: "Total Submissions",
      value: show(contents.length),
      description: "Activities and own work received",
      icon: CalendarDays,
    },
    {
      title: "Published",
      value: show(countByStatus("published")),
      description: "Visible in the magazine",
      icon: CheckCircle2,
    },
    {
      title: "Pending Review",
      value: show(countByStatus("pending")),
      description: "Awaiting HOD or coordinator approval",
      icon: Clock3,
    },
    {
      title: "Users",
      value: show(totalUsers),
      description: "Registered accounts",
      icon: Users,
    },
  ];

  const recentActivities = [...contents]
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 5)
    .map((item) => ({
      id: item._id,
      title: item.title,
      department: getDepartmentLabel(item.department),
      date: formatDate(item.createdAt),
      status: STATUS_LABELS[item.status] || item.status,
    }));

  const departments = DEPARTMENTS.map((department) => ({
    name: department.label,
    shortName: department.value,
    activities: contents.filter(
      (item) =>
        normalizeDepartment(item.department) ===
        department.value
    ).length,
  }));

  /*
  Latest issue = month of the most recent published content
  */

  const published = contents.filter(
    (item) => item.status === "published" && item.eventDate
  );

  const latestDate = published.length
    ? new Date(
        Math.max(
          ...published.map((item) =>
            new Date(item.eventDate).getTime()
          )
        )
      )
    : null;

  const latestIssueCount = latestDate
    ? published.filter((item) => {
        const date = new Date(item.eventDate);

        return (
          date.getMonth() === latestDate.getMonth() &&
          date.getFullYear() === latestDate.getFullYear()
        );
      }).length
    : 0;

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
            href="/admin/activity"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            <Plus size={18} />
            Add Activity
          </Link>

          <Link
            href="/admin/users?add=staff"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
          >
            <Users size={18} />
            Add Faculty
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

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
            href="/admin/activity"
            icon={CalendarDays}
            title="Activities & Categories"
            description="Add activities and own work categories (poem, article, drawing)"
          />

          <QuickAction
            href="/admin/users?add=staff"
            icon={Users}
            title="Add Faculty"
            description="Create a faculty login"
          />

          <QuickAction
            href="/admin/users"
            icon={Building2}
            title="Manage Users"
            description="HODs, coordinator, faculty and students"
          />

          <QuickAction
            href="/admin/magazine"
            icon={Newspaper}
            title="Magazine Content"
            description="View and manage all submissions"
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
                Recent Submissions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest content submitted to the eMagazine.
              </p>
            </div>

            <Link
              href="/admin/magazine"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              View All
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                {loading
                  ? "Loading..."
                  : "No submissions yet."}
              </p>
            )}

            {recentActivities.map((activity) => (
              <div
                key={activity.id}
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
                {latestDate
                  ? latestDate.toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })
                  : loading
                    ? "Loading..."
                    : "No issue yet"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-teal-100">
                {latestDate
                  ? `${latestIssueCount} published item${
                      latestIssueCount === 1 ? "" : "s"
                    } in this issue.`
                  : "The first issue appears once content is published."}
              </p>

              <Link
                href="/admin/magazine"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-amber-50"
              >
                Manage Content
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
              Submissions received from each department.
            </p>
          </div>

          <Link
            href="/admin/users"
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
                  Submissions
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
  const styles = {
    Published: ["bg-emerald-50 text-emerald-700", "bg-emerald-500"],
    Rejected: ["bg-red-50 text-red-700", "bg-red-500"],
  };

  const [badge, dot] = styles[status] || [
    "bg-amber-50 text-amber-700",
    "bg-amber-500",
  ];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />

      {status}
    </span>
  );
}
