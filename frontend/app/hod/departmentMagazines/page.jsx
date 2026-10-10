"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth, useUser } from "@clerk/nextjs";

import {
  Search,
  Trash2,
  Loader2,
  Newspaper,
  RefreshCw,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function HODDepartmentMagazinePage() {
  const router = useRouter();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const { user } = useUser();

  const [mongoUser, setMongoUser] = useState(null);
  const [magazines, setMagazines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [activityNames, setActivityNames] =
    useState([]);

  const [activityFilter, setActivityFilter] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [selectedIds, setSelectedIds] =
    useState([]);

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      router.replace("/");
      return;
    }

    loadData();
  }, [isLoaded, isSignedIn, user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        router.replace("/");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // -------------------------------------------------
      // GET MONGO USER
      // -------------------------------------------------

      const userResponse =
        await axios.get(
          `${API_URL}/api/users/me`,
          { headers }
        );

      const userData =
        userResponse.data?.data ||
        userResponse.data?.user ||
        userResponse.data;

      if (!userData) {
        throw new Error(
          "Unable to load user information."
        );
      }

      const role = String(
        userData.role || ""
      )
        .trim()
        .toLowerCase();

      if (role !== "hod") {
        await Swal.fire({
          icon: "error",
          title: "Access Denied",
          text:
            "Only HOD can access department magazine content.",
          confirmButtonColor: "#d4a017",
        });

        router.replace("/");
        return;
      }

      setMongoUser(userData);

      // -------------------------------------------------
      // GET DEPARTMENT CONTENT
      // -------------------------------------------------

      const response =
        await axios.get(
          `${API_URL}/api/magazine-content/department/${userData._id}`,
          { headers }
        );

      const data =
        response.data?.data || [];

      setMagazines(
        Array.isArray(data)
          ? data
          : []
      );

      // -------------------------------------------------
      // GET ALL ACTIVITIES FOR THE FILTER
      // -------------------------------------------------

      const activityResponse =
        await axios.get(
          `${API_URL}/api/activities`,
          { headers }
        );

      setActivityNames(
        (
          activityResponse.data?.data ||
          []
        ).map(
          (activity) => activity.name
        )
      );
    } catch (error) {
      console.error(
        "Department magazine load error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to Load",
        text:
          error.response?.data?.message ||
          "Unable to load department magazine content.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ACTIVITIES
  // =====================================================

  const activities = useMemo(() => {
    const names = magazines
      .map((item) => {
        if (
          item.activity &&
          typeof item.activity === "object"
        ) {
          return item.activity.name;
        }

        return (
          item.activityName ||
          ""
        );
      })
      .filter(Boolean);

    return [
      ...new Set([
        ...activityNames,
        ...names,
      ]),
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [magazines, activityNames]);

  // =====================================================
  // YEARS
  // =====================================================

  const years = useMemo(() => {
    const values = magazines
      .map((item) =>
        item.magazineYear
      )
      .filter(Boolean);

    return [
      ...new Set(values),
    ].sort((a, b) => b - a);
  }, [magazines]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredMagazines =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return magazines.filter(
        (item) => {
          const title =
            String(
              item.title || ""
            ).toLowerCase();

          const activity =
            item.activity &&
            typeof item.activity ===
              "object"
              ? String(
                  item.activity.name ||
                    ""
                ).toLowerCase()
              : String(
                  item.activityName ||
                    ""
                ).toLowerCase();

          const matchesSearch =
            !text ||
            title.includes(text) ||
            activity.includes(text);

          const matchesMonth =
            !monthFilter ||
            String(
              item.magazineMonth
            ) === monthFilter;

          const matchesYear =
            !yearFilter ||
            String(
              item.magazineYear
            ) === yearFilter;

          const activityName =
            item.activity &&
            typeof item.activity ===
              "object"
              ? item.activity.name || ""
              : item.activityName || "";

          const matchesActivity =
            !activityFilter ||
            activityName ===
              activityFilter;

          const matchesStatus =
            !statusFilter ||
            String(
              item.status || ""
            ).toLowerCase() ===
              statusFilter;

          return (
            matchesSearch &&
            matchesMonth &&
            matchesYear &&
            matchesActivity &&
            matchesStatus
          );
        }
      );
    }, [
      magazines,
      search,
      monthFilter,
      yearFilter,
      activityFilter,
      statusFilter,
    ]);

  // =====================================================
  // SELECT ALL
  // =====================================================

  const allSelected =
    filteredMagazines.length > 0 &&
    filteredMagazines.every(
      (item) =>
        selectedIds.includes(
          item._id
        )
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(
        (previous) =>
          previous.filter(
            (id) =>
              !filteredMagazines.some(
                (item) =>
                  item._id === id
              )
          )
      );
    } else {
      setSelectedIds(
        (previous) => [
          ...new Set([
            ...previous,
            ...filteredMagazines.map(
              (item) =>
                item._id
            ),
          ]),
        ]
      );
    }
  };

  // =====================================================
  // SELECT ONE
  // =====================================================

  const toggleSelect = (id) => {
    setSelectedIds(
      (previous) => {
        if (
          previous.includes(id)
        ) {
          return previous.filter(
            (item) =>
              item !== id
          );
        }

        return [
          ...previous,
          id,
        ];
      }
    );
  };

  // =====================================================
  // DELETE ONE
  // =====================================================

  const deleteOne = async (
    item
  ) => {
    const result =
      await Swal.fire({
        icon: "warning",
        title:
          "Delete Magazine Content?",
        text:
          "This content will be permanently deleted, including its uploaded images.",
        showCancelButton: true,
        confirmButtonText:
          "Delete",
        cancelButtonText:
          "Cancel",
        confirmButtonColor:
          "#dc2626",
        cancelButtonColor:
          "#64748b",
      });

    if (
      !result.isConfirmed
    ) {
      return;
    }

    try {
      const token =
        await getToken();

      await axios.delete(
        `${API_URL}/api/magazine-content/${item._id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          data: {
            userId:
              mongoUser._id,
          },
        }
      );

      setMagazines(
        (previous) =>
          previous.filter(
            (magazine) =>
              magazine._id !==
              item._id
          )
      );

      setSelectedIds(
        (previous) =>
          previous.filter(
            (id) =>
              id !== item._id
          )
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text:
          "Magazine content deleted successfully.",
        confirmButtonColor:
          "#d4a017",
      });
    } catch (error) {
      console.error(
        "Delete magazine error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error.response?.data
            ?.message ||
          "Unable to delete magazine content.",
        confirmButtonColor:
          "#d4a017",
      });
    }
  };

  // =====================================================
  // DELETE SELECTED
  // =====================================================

  const deleteSelected =
    async () => {
      if (
        selectedIds.length ===
        0
      ) {
        return;
      }

      const result =
        await Swal.fire({
          icon: "warning",
          title:
            "Delete Selected Content?",
          text:
            `${selectedIds.length} magazine item(s) will be permanently deleted.`,
          showCancelButton: true,
          confirmButtonText:
            "Delete Selected",
          cancelButtonText:
            "Cancel",
          confirmButtonColor:
            "#dc2626",
          cancelButtonColor:
            "#64748b",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      try {
        setDeleting(true);

        const token =
          await getToken();

        let successCount = 0;
        let failedCount = 0;

        for (
          const id of selectedIds
        ) {
          try {
            await axios.delete(
              `${API_URL}/api/magazine-content/${id}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
                data: {
                  userId:
                    mongoUser._id,
                },
              }
            );

            successCount++;
          } catch (error) {
            failedCount++;
            console.error(
              `Failed to delete ${id}:`,
              error
            );
          }
        }

        setMagazines(
          (previous) =>
            previous.filter(
              (item) =>
                !selectedIds.includes(
                  item._id
                )
            )
        );

        setSelectedIds([]);

        if (
          failedCount === 0
        ) {
          await Swal.fire({
            icon: "success",
            title: "Deleted",
            text:
              `${successCount} magazine item(s) deleted successfully.`,
            confirmButtonColor:
              "#d4a017",
          });
        } else {
          await Swal.fire({
            icon: "warning",
            title:
              "Partially Deleted",
            text:
              `${successCount} deleted successfully and ${failedCount} could not be deleted.`,
            confirmButtonColor:
              "#d4a017",
          });
        }
      } catch (error) {
        console.error(
          "Bulk delete error:",
          error
        );

        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text:
            "Unable to delete selected content.",
          confirmButtonColor:
            "#d4a017",
        });
      } finally {
        setDeleting(false);
      }
    };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setMonthFilter("");
    setYearFilter("");
    setActivityFilter("");
    setStatusFilter("");
  };

  const hasFilters =
    search ||
    monthFilter ||
    yearFilter ||
    activityFilter ||
    statusFilter;

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    value
  ) => {
    if (!value) return "-";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // ACTIVITY NAME
  // =====================================================

  const getActivityName =
    (item) => {
      if (
        item.activity &&
        typeof item.activity ===
          "object"
      ) {
        return (
          item.activity.name ||
          "-"
        );
      }

      return (
        item.activityName ||
        "-"
      );
    };

  // =====================================================
  // STATUS
  // =====================================================

  const statusClass = (
    status
  ) => {
    switch (
      String(
        status || ""
      ).toLowerCase()
    ) {
      case "published":
        return "border-green-200 bg-green-50 text-green-700";

      case "pending":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading department magazine...
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="mx-auto max-w-7xl">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-amber-600" />

            <h1 className="text-2xl font-bold text-slate-800">
              Department Magazine
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            All magazine activities belonging to the department.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* FILTERS */}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">

          {/* SEARCH */}

          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search title or activity..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* MONTH */}

          <select
            value={monthFilter}
            onChange={(e) =>
              setMonthFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          >
            <option value="">
              All Months
            </option>

            {MONTHS.map(
              (month) => (
                <option
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </option>
              )
            )}
          </select>

          {/* YEAR */}

          <select
            value={yearFilter}
            onChange={(e) =>
              setYearFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          >
            <option value="">
              All Years
            </option>

            {years.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}
          </select>

          {/* ACTIVITY */}

          <select
            value={activityFilter}
            onChange={(e) =>
              setActivityFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          >
            <option value="">
              All Activities
            </option>

            {activities.map(
              (activity) => (
                <option
                  key={activity}
                  value={activity}
                >
                  {activity}
                </option>
              )
            )}
          </select>

        </div>

        {/* SECOND FILTER ROW */}

        <div className="mt-3 flex flex-wrap items-center gap-3">

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          >
            <option value="">
              All Status
            </option>

            <option value="published">
              Published
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="rejected">
              Rejected
            </option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          )}

          <div className="ml-auto text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {
                filteredMagazines.length
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {magazines.length}
            </span>
          </div>
        </div>
      </div>

      {/* DELETE BAR */}

      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-red-700">
            {selectedIds.length} selected
          </p>

          <button
            type="button"
            onClick={deleteSelected}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            Delete Selected
          </button>
        </div>
      )}

      {/* TABLE */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">

                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={
                      toggleSelectAll
                    }
                    disabled={
                      filteredMagazines.length ===
                      0
                    }
                    className="h-4 w-4 accent-amber-600"
                  />
                </th>

                <th className="w-12 px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  #
                </th>

                <th className="w-20 px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Image
                </th>

                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Magazine Title
                </th>

                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Activity
                </th>

                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Event Date
                </th>

                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Issue
                </th>

                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>

                <th className="w-16 px-3 py-3 text-center text-xs font-semibold uppercase text-slate-500">
                  Delete
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredMagazines.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center"
                  >
                    <Newspaper className="mx-auto h-10 w-10 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No magazine content found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMagazines.map(
                  (item, index) => (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-amber-50/30"
                    >

                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(
                            item._id
                          )}
                          onChange={() =>
                            toggleSelect(
                              item._id
                            )
                          }
                          className="h-4 w-4 accent-amber-600"
                        />
                      </td>

                      <td className="px-3 py-3 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-3 py-3">
                        {item.eventPhoto ? (
                          <img
                            src={
                              item.eventPhoto
                            }
                            alt={
                              item.title ||
                              "Magazine"
                            }
                            className="h-12 w-16 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-100">
                            <Newspaper className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </td>

                      <td className="max-w-[300px] px-3 py-3">
                        <p
                          className="truncate text-sm font-semibold text-slate-800"
                          title={
                            item.title
                          }
                        >
                          {item.title ||
                            "-"}
                        </p>
                      </td>

                      <td className="px-3 py-3 text-sm text-slate-600">
                        {getActivityName(
                          item
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                        {formatDate(
                          item.eventDate
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                        {item.magazineMonth &&
                        item.magazineYear
                          ? `${
                              MONTHS.find(
                                (m) =>
                                  Number(
                                    m.value
                                  ) ===
                                  Number(
                                    item.magazineMonth
                                  )
                              )?.label ||
                              item.magazineMonth
                            } ${
                              item.magazineYear
                            }`
                          : "-"}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(
                            item.status
                          )}`}
                        >
                          {item.status ||
                            "-"}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            deleteOne(
                              item
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}