"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Search,
  RefreshCw,
  Filter,
  X,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  Users,
  Building2,
  Image as ImageIcon,
  ChevronDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEPARTMENTS = [
  { value: "AE", label: "Automobile Engineering" },
  { value: "CH", label: "Chemical Engineering" },
  { value: "CE", label: "Civil Engineering" },
  { value: "CS", label: "Computer Science & Engineering" },
  { value: "EE", label: "Electrical & Electronics Engineering" },
  { value: "EC", label: "Electronics & Communication Engineering" },
  { value: "IN", label: "Institute" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "PT", label: "Polymer Technology" },
  { value: "SC", label: "Science" },
];

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const LEVEL_OPTIONS = [
  { value: "department", label: "Department" },
  { value: "institute", label: "Institute" },
];

const getDepartmentName = (code) => {
  const item = DEPARTMENTS.find(
    (department) =>
      department.value.toLowerCase() ===
      String(code || "").trim().toLowerCase()
  );

  return item ? item.label : code || "—";
};

const getStatusStyle = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "published":
      return {
        label: "Published",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };

    case "pending":
      return {
        label: "Pending",
        className:
          "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock3,
      };

    case "rejected":
      return {
        label: "Rejected",
        className:
          "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      };

    default:
      return {
        label: status || "Unknown",
        className:
          "bg-slate-50 text-slate-600 border-slate-200",
        icon: FileText,
      };
  }
};

const getSubmitterRole = (role) => {
  switch (String(role || "").toLowerCase()) {
    case "student":
      return "Student";

    case "hod":
      return "HOD";

    case "admin":
      return "Admin";

    case "mag_coordinator":
      return "Magazine Coordinator";

    case "principal":
      return "Principal";

    case "staff":
      return "Staff";

    default:
      return role || "—";
  }
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminMagazinePage() {
  const router = useRouter();

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [submitterFilter, setSubmitterFilter] = useState("all");

  const [selectedContent, setSelectedContent] = useState(null);
  const [deleteContent, setDeleteContent] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/magazine-content`
      );

      if (response.data?.success) {
        setContents(response.data.data || []);
      } else {
        setContents([]);
        setError(
          response.data?.message ||
            "Failed to load magazine content."
        );
      }
    } catch (err) {
      console.error("ADMIN MAGAZINE FETCH ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load magazine content."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const activityOptions = useMemo(() => {
    const activities = contents
      .map((item) => {
        if (typeof item.activity === "object") {
          return item.activity?.name;
        }

        return "";
      })
      .filter(Boolean);

    return [...new Set(activities)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [contents]);

  const monthOptions = useMemo(() => {
    const months = contents
      .map((item) => {
        if (!item.eventDate) return null;

        const date = new Date(item.eventDate);

        if (Number.isNaN(date.getTime())) {
          return null;
        }

        return {
          value: `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`,
          label: date.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          }),
        };
      })
      .filter(Boolean);

    const unique = new Map();

    months.forEach((month) => {
      unique.set(month.value, month);
    });

    return [...unique.values()].sort((a, b) =>
      b.value.localeCompare(a.value)
    );
  }, [contents]);

  const submitterOptions = useMemo(() => {
    const roles = contents
      .map((item) => item.submittedBy?.role)
      .filter(Boolean);

    return [...new Set(roles)].sort();
  }, [contents]);

  const filteredContents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return contents.filter((item) => {
      const activityName =
        typeof item.activity === "object"
          ? item.activity?.name || ""
          : "";

      const submitterName =
        item.submittedBy?.name || "";

      const submitterEmail =
        item.submittedBy?.email || "";

      const studentName =
        item.student?.name || "";

      const registerNumber =
        item.student?.registerNumber || "";

      const department =
        String(item.department || "").trim();

      const matchesSearch =
        !searchValue ||
        String(item.title || "")
          .toLowerCase()
          .includes(searchValue) ||
        activityName
          .toLowerCase()
          .includes(searchValue) ||
        department
          .toLowerCase()
          .includes(searchValue) ||
        submitterName
          .toLowerCase()
          .includes(searchValue) ||
        submitterEmail
          .toLowerCase()
          .includes(searchValue) ||
        studentName
          .toLowerCase()
          .includes(searchValue) ||
        registerNumber
          .toLowerCase()
          .includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" ||
        department.toUpperCase() ===
          departmentFilter.toUpperCase();

      const matchesActivity =
        activityFilter === "all" ||
        activityName === activityFilter;

      const matchesStatus =
        statusFilter === "all" ||
        String(item.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesLevel =
        levelFilter === "all" ||
        String(item.level || "").toLowerCase() ===
          levelFilter.toLowerCase();

      let matchesMonth = true;

      if (monthFilter !== "all") {
        if (!item.eventDate) {
          matchesMonth = false;
        } else {
          const date = new Date(item.eventDate);

          if (Number.isNaN(date.getTime())) {
            matchesMonth = false;
          } else {
            const value = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;

            matchesMonth = value === monthFilter;
          }
        }
      }

      const matchesSubmitter =
        submitterFilter === "all" ||
        String(item.submittedBy?.role || "").toLowerCase() ===
          submitterFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesActivity &&
        matchesStatus &&
        matchesLevel &&
        matchesMonth &&
        matchesSubmitter
      );
    });
  }, [
    contents,
    search,
    departmentFilter,
    activityFilter,
    statusFilter,
    levelFilter,
    monthFilter,
    submitterFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    departmentFilter,
    activityFilter,
    statusFilter,
    levelFilter,
    monthFilter,
    submitterFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContents.length / ITEMS_PER_PAGE)
  );

  const paginatedContents = useMemo(() => {
    const start =
      (page - 1) * ITEMS_PER_PAGE;

    return filteredContents.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredContents, page]);

  const statistics = useMemo(() => {
    const published = contents.filter(
      (item) => item.status === "published"
    ).length;

    const pending = contents.filter(
      (item) => item.status === "pending"
    ).length;

    const rejected = contents.filter(
      (item) => item.status === "rejected"
    ).length;

    const students = contents.filter(
      (item) =>
        String(item.submittedBy?.role || "").toLowerCase() ===
        "student"
    ).length;

    const hod = contents.filter(
      (item) =>
        String(item.submittedBy?.role || "").toLowerCase() ===
        "hod"
    ).length;

    const institute = contents.filter(
      (item) =>
        String(item.level || "").toLowerCase() ===
        "institute"
    ).length;

    return {
      total: contents.length,
      published,
      pending,
      rejected,
      students,
      hod,
      institute,
    };
  }, [contents]);

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setActivityFilter("all");
    setStatusFilter("all");
    setLevelFilter("all");
    setMonthFilter("all");
    setSubmitterFilter("all");
  };

  const hasFilters =
    search ||
    departmentFilter !== "all" ||
    activityFilter !== "all" ||
    statusFilter !== "all" ||
    levelFilter !== "all" ||
    monthFilter !== "all" ||
    submitterFilter !== "all";

  const handleDelete = async () => {
    if (!deleteContent?._id) return;

    try {
      setDeleting(true);
      setError("");

      const userResponse = await axios.get(
        `${API_URL}/api/users/me`
      );

      const userId =
        userResponse.data?.data?._id ||
        userResponse.data?._id ||
        userResponse.data?.user?._id;

      if (!userId) {
        throw new Error(
          "Admin user ID could not be determined."
        );
      }

      await axios.delete(
        `${API_URL}/api/magazine-content/${deleteContent._id}`,
        {
          data: {
            userId,
          },
        }
      );

      setContents((previous) =>
        previous.filter(
          (item) =>
            item._id !== deleteContent._id
        )
      );

      setDeleteContent(null);
      setSelectedContent(null);
    } catch (err) {
      console.error("ADMIN DELETE ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete magazine content."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (content) => {
    if (content.status === "published") {
      return;
    }

    router.push(
      `/admin/magazine/edit/${content._id}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1700px] px-3 py-4 sm:px-5 lg:px-7">
        {/* HEADER */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <FileText size={21} />
                </div>

                <div>
                  <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
                    Magazine Management
                  </h1>

                  <p className="text-xs text-slate-500 sm:text-sm">
                    Manage all institutional magazine content
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchContents}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* STATISTICS */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <StatCard
            title="Total"
            value={statistics.total}
            icon={FileText}
          />

          <StatCard
            title="Published"
            value={statistics.published}
            icon={CheckCircle2}
            type="success"
          />

          <StatCard
            title="Pending"
            value={statistics.pending}
            icon={Clock3}
            type="warning"
          />

          <StatCard
            title="Rejected"
            value={statistics.rejected}
            icon={XCircle}
            type="danger"
          />

          <StatCard
            title="Students"
            value={statistics.students}
            icon={Users}
          />

          <StatCard
            title="HOD"
            value={statistics.hod}
            icon={Building2}
          />

          <StatCard
            title="Institute"
            value={statistics.institute}
            icon={FileText}
          />
        </div>

        {/* FILTER CARD */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter size={16} className="text-amber-600" />
              Filters
            </div>
          </div>

          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-2 p-3">
              {/* SEARCH */}
              <div className="relative w-[230px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search magazine..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* DEPARTMENT */}
              <FilterSelect
                value={departmentFilter}
                onChange={setDepartmentFilter}
                options={[
                  {
                    value: "all",
                    label: "All Departments",
                  },
                  ...DEPARTMENTS,
                ]}
              />

              {/* ACTIVITY */}
              <FilterSelect
                value={activityFilter}
                onChange={setActivityFilter}
                options={[
                  {
                    value: "all",
                    label: "All Activities",
                  },
                  ...activityOptions.map((activity) => ({
                    value: activity,
                    label: activity,
                  })),
                ]}
              />

              {/* STATUS */}
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  {
                    value: "all",
                    label: "All Status",
                  },
                  ...STATUS_OPTIONS,
                ]}
              />

              {/* LEVEL */}
              <FilterSelect
                value={levelFilter}
                onChange={setLevelFilter}
                options={[
                  {
                    value: "all",
                    label: "All Levels",
                  },
                  ...LEVEL_OPTIONS,
                ]}
              />

              {/* MONTH */}
              <FilterSelect
                value={monthFilter}
                onChange={setMonthFilter}
                options={[
                  {
                    value: "all",
                    label: "All Months",
                  },
                  ...monthOptions,
                ]}
              />

              {/* SUBMITTER */}
              <FilterSelect
                value={submitterFilter}
                onChange={setSubmitterFilter}
                options={[
                  {
                    value: "all",
                    label: "All Submitters",
                  },
                  ...submitterOptions.map((role) => ({
                    value: role,
                    label: getSubmitterRole(role),
                  })),
                ]}
              />

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Magazine Contents
              </h2>

              <p className="text-xs text-slate-500">
                Showing {filteredContents.length} of{" "}
                {contents.length} records
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              {filteredContents.length} Records
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={28}
                  className="animate-spin text-amber-600"
                />

                <p className="text-sm text-slate-500">
                  Loading magazine content...
                </p>
              </div>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileText size={26} />
              </div>

              <h3 className="text-sm font-bold text-slate-700">
                No magazine content found
              </h3>

              <p className="mt-1 max-w-md text-xs text-slate-500">
                No records match the selected filters.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-600"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full min-w-[1250px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="sticky left-0 z-20 w-[70px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        #
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Magazine
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Activity
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Department
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Level
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Event Date
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Submitted By
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Created
                      </th>

                      <th className="border-b border-slate-200 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedContents.map(
                      (content, index) => {
                        const status = getStatusStyle(
                          content.status
                        );

                        const StatusIcon =
                          status.icon;

                        const activityName =
                          typeof content.activity ===
                          "object"
                            ? content.activity?.name
                            : "—";

                        const rowNumber =
                          (page - 1) *
                            ITEMS_PER_PAGE +
                          index +
                          1;

                        return (
                          <tr
                            key={content._id}
                            className="group transition hover:bg-amber-50/40"
                          >
                            <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-500 group-hover:bg-amber-50/40">
                              {rowNumber}
                            </td>

                            <td className="max-w-[280px] border-b border-slate-100 px-4 py-3">
                              <div className="flex items-center gap-3">
                                {content.eventPhoto ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImage(
                                        content.eventPhoto
                                      )
                                    }
                                    className="group/photo relative h-11 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                  >
                                    <img
                                      src={
                                        content.eventPhoto
                                      }
                                      alt=""
                                      className="h-full w-full object-cover transition duration-200 group-hover/photo:scale-105"
                                    />

                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition group-hover/photo:bg-black/30">
                                      <ImageIcon
                                        size={15}
                                        className="opacity-0 transition group-hover/photo:opacity-100"
                                      />
                                    </div>
                                  </button>
                                ) : (
                                  <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                    <ImageIcon
                                      size={18}
                                    />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-slate-800">
                                    {content.title ||
                                      "Untitled"}
                                  </p>

                                  <p className="mt-0.5 truncate text-xs text-slate-400">
                                    ID:{" "}
                                    {content._id?.slice(
                                      -8
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3">
                              <span className="inline-flex max-w-[190px] truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                                {activityName ||
                                  "—"}
                              </span>
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {getDepartmentName(
                                    content.department
                                  )}
                                </p>

                                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                  {content.department ||
                                    "—"}
                                </p>
                              </div>
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3">
                              <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold capitalize text-amber-700">
                                {content.level ||
                                  "—"}
                              </span>
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <CalendarDays
                                  size={14}
                                  className="text-slate-400"
                                />

                                {formatDate(
                                  content.eventDate
                                )}
                              </div>
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {content.submittedBy
                                    ?.name ||
                                    "—"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  {getSubmitterRole(
                                    content
                                      .submittedBy
                                      ?.role
                                  )}
                                </p>
                              </div>
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold ${status.className}`}
                              >
                                <StatusIcon
                                  size={13}
                                />

                                {status.label}
                              </span>
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                              {formatDate(
                                content.createdAt
                              )}
                            </td>

                            <td className="border-b border-slate-100 px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedContent(
                                      content
                                    )
                                  }
                                  title="View"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                                >
                                  <Eye size={16} />
                                </button>

                                {content.status !==
                                  "published" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEdit(
                                        content
                                      )
                                    }
                                    title="Edit"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Pencil
                                      size={16}
                                    />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteContent(
                                      content
                                    )
                                  }
                                  title="Delete"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredContents.length === 0
                      ? 0
                      : (page - 1) *
                          ITEMS_PER_PAGE +
                        1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      page * ITEMS_PER_PAGE,
                      filteredContents.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredContents.length}
                  </span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((previous) =>
                        Math.max(1, previous - 1)
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                    {page} / {totalPages}
                  </div>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((previous) =>
                        Math.min(
                          totalPages,
                          previous + 1
                        )
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {selectedContent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={() =>
            setSelectedContent(null)
          }
        >
          <div
            className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Magazine Details
                </h2>

                <p className="text-xs text-slate-500">
                  Complete content information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedContent(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <div>
                  <div className="mb-5">
                    <span className="mb-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                      {selectedContent.status ||
                        "—"}
                    </span>

                    <h3 className="text-xl font-bold leading-tight text-slate-800">
                      {selectedContent.title ||
                        "Untitled"}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {typeof selectedContent.activity ===
                      "object"
                        ? selectedContent.activity
                            ?.name
                        : "—"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Department"
                      value={getDepartmentName(
                        selectedContent.department
                      )}
                    />

                    <DetailItem
                      label="Level"
                      value={
                        selectedContent.level ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Event Date"
                      value={formatDate(
                        selectedContent.eventDate
                      )}
                    />

                    <DetailItem
                      label="Created"
                      value={formatDateTime(
                        selectedContent.createdAt
                      )}
                    />

                    <DetailItem
                      label="Submitted By"
                      value={
                        selectedContent
                          .submittedBy?.name ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Role"
                      value={getSubmitterRole(
                        selectedContent
                          .submittedBy?.role
                      )}
                    />

                    <DetailItem
                      label="Email"
                      value={
                        selectedContent
                          .submittedBy?.email ||
                        "—"
                      }
                    />

                    <DetailItem
                      label="Register Number"
                      value={
                        selectedContent.student
                          ?.registerNumber ||
                        "—"
                      }
                    />
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Description
                    </p>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {selectedContent.description ||
                        "No description available."}
                    </div>
                  </div>

                  {selectedContent.rejectionReason && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-red-500">
                        Rejection Reason
                      </p>

                      <p className="text-sm leading-6 text-red-700">
                        {
                          selectedContent.rejectionReason
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedContent.eventPhoto && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Event Photo
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage(
                            selectedContent.eventPhoto
                          )
                        }
                        className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={
                            selectedContent.eventPhoto
                          }
                          alt=""
                          className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.02]"
                        />
                      </button>
                    </div>
                  )}

                  {selectedContent.student?.photo && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Student Photo
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage(
                            selectedContent.student
                              .photo
                          )
                        }
                        className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={
                            selectedContent.student
                              .photo
                          }
                          alt=""
                          className="aspect-square w-full object-cover transition duration-300 hover:scale-[1.02]"
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                {selectedContent.status !==
                  "published" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContent(null);
                      handleEdit(
                        selectedContent
                      );
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setDeleteContent(
                      selectedContent
                    );
                    setSelectedContent(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedContent(null)
                  }
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteContent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-5 sm:p-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={23} />
              </div>

              <h2 className="text-center text-lg font-bold text-slate-800">
                Delete Magazine Content?
              </h2>

              <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                This will permanently delete:
              </p>

              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="truncate text-sm font-bold text-red-800">
                  {deleteContent.title ||
                    "Untitled"}
                </p>

                <p className="mt-1 text-xs text-red-600">
                  The magazine record and uploaded
                  images will be removed.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setDeleteContent(null)
                  }
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          onClick={() =>
            setPreviewImage(null)
          }
        >
          <button
            type="button"
            onClick={() =>
              setPreviewImage(null)
            }
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <X size={20} />
          </button>

          <img
            src={previewImage}
            alt=""
            onClick={(e) =>
              e.stopPropagation()
            }
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  type = "default",
}) {
  const styles = {
    default: {
      icon: "bg-amber-50 text-amber-700",
      value: "text-slate-800",
    },
    success: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-700",
    },
    warning: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-700",
    },
    danger: {
      icon: "bg-red-50 text-red-600",
      value: "text-red-700",
    },
  };

  const style = styles[type];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-[11px]">
            {title}
          </p>

          <p
            className={`mt-1 text-xl font-bold sm:text-2xl ${style.value}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-10 min-w-[155px] appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-sm font-medium text-slate-600 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
      >
        {options.map((option) => (
          <option
            key={`${option.value}-${option.label}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value || "—"}
      </p>
    </div>
  );
}