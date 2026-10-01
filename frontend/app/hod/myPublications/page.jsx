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
  X,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HODMyMagazinePage() {
  const router = useRouter();

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [mongoUser, setMongoUser] = useState(null);
  const [magazines, setMagazines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState([]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

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

      /* -----------------------------------------------------
         GET MONGO USER
      ----------------------------------------------------- */

      const userResponse = await axios.get(
        `${API_URL}/api/users/me`,
        { headers }
      );

      const userData =
        userResponse.data?.data ||
        userResponse.data?.user ||
        userResponse.data;

      if (!userData) {
        throw new Error("User information could not be loaded.");
      }

      const role = String(userData.role || "")
        .trim()
        .toLowerCase();

      if (role !== "hod") {
        await Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "Only HOD users can access this page.",
          confirmButtonColor: "#d4a017",
        });

        router.replace("/");
        return;
      }

      setMongoUser(userData);

      /* -----------------------------------------------------
         GET HOD MAGAZINE CONTENT
      ----------------------------------------------------- */

      const response = await axios.get(
        `${API_URL}/api/magazine-content/my/${userData._id}`,
        { headers }
      );

      const data =
        response.data?.data ||
        response.data?.contents ||
        response.data?.magazines ||
        response.data ||
        [];

      setMagazines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("HOD magazine loading error:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to Load",
        text:
          error.response?.data?.message ||
          "Unable to load your magazine submissions.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     ACTIVITY LIST
  ========================================================= */

  const activities = useMemo(() => {
    const values = magazines
      .map((item) => {
        if (typeof item.activity === "object") {
          return item.activity?.name || "";
        }

        return item.activityName || "";
      })
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [magazines]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredMagazines = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return magazines.filter((item) => {
      const title = String(item.title || "").toLowerCase();

      const activity =
        typeof item.activity === "object"
          ? String(item.activity?.name || "").toLowerCase()
          : String(item.activityName || "").toLowerCase();

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        activity.includes(searchText);

      const activityName =
        typeof item.activity === "object"
          ? item.activity?.name || ""
          : item.activityName || "";

      const matchesActivity =
        activityFilter === "all" ||
        activityName === activityFilter;

      return matchesSearch && matchesActivity;
    });
  }, [magazines, search, activityFilter]);

  /* =========================================================
     SELECT ALL
  ========================================================= */

  const allFilteredSelected =
    filteredMagazines.length > 0 &&
    filteredMagazines.every((item) =>
      selectedIds.includes(item._id)
    );

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) =>
            !filteredMagazines.some(
              (item) => item._id === id
            )
        )
      );
    } else {
      setSelectedIds((previous) => {
        const ids = filteredMagazines.map(
          (item) => item._id
        );

        return [...new Set([...previous, ...ids])];
      });
    }
  };

  /* =========================================================
     SELECT ONE
  ========================================================= */

  const toggleSelect = (id) => {
    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (selectedId) => selectedId !== id
        );
      }

      return [...previous, id];
    });
  };

  /* =========================================================
     CLEAR SELECTION
  ========================================================= */

  const clearSelection = () => {
    setSelectedIds([]);
  };

  /* =========================================================
     DELETE ONE
  ========================================================= */

  const deleteOne = async (item) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Magazine?",
      text: `"${item.title}" will be deleted.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      const token = await getToken();

      await axios.delete(
        `${API_URL}/api/magazine-content/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            userId: mongoUser._id,
          },
        }
      );

      setMagazines((previous) =>
        previous.filter(
          (magazine) => magazine._id !== item._id
        )
      );

      setSelectedIds((previous) =>
        previous.filter((id) => id !== item._id)
      );

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Magazine content deleted successfully.",
        confirmButtonColor: "#d4a017",
      });
    } catch (error) {
      console.error("Delete magazine error:", error);

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error.response?.data?.message ||
          "Unable to delete this magazine content.",
        confirmButtonColor: "#d4a017",
      });
    }
  };

  /* =========================================================
     DELETE MULTIPLE
  ========================================================= */

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Selected Magazine Content?",
      text: `${selectedIds.length} item(s) will be deleted.`,
      showCancelButton: true,
      confirmButtonText: "Delete Selected",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      setDeleting(true);

      const token = await getToken();

      const deleteResults = await Promise.allSettled(
        selectedIds.map((id) =>
          axios.delete(
            `${API_URL}/api/magazine-content/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              data: {
                userId: mongoUser._id,
              },
            }
          )
        )
      );

      const deletedIds = [];

      deleteResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          deletedIds.push(selectedIds[index]);
        }
      });

      setMagazines((previous) =>
        previous.filter(
          (item) => !deletedIds.includes(item._id)
        )
      );

      setSelectedIds([]);

      const failedCount =
        selectedIds.length - deletedIds.length;

      if (failedCount === 0) {
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: `${deletedIds.length} magazine item(s) deleted successfully.`,
          confirmButtonColor: "#d4a017",
        });
      } else {
        await Swal.fire({
          icon: "warning",
          title: "Partially Deleted",
          text: `${deletedIds.length} deleted successfully. ${failedCount} could not be deleted.`,
          confirmButtonColor: "#d4a017",
        });
      }
    } catch (error) {
      console.error("Multiple delete error:", error);

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error.response?.data?.message ||
          "Unable to delete selected items.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     ACTIVITY NAME
  ========================================================= */

  const getActivityName = (item) => {
    if (typeof item.activity === "object") {
      return item.activity?.name || "-";
    }

    return item.activityName || "-";
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusStyle = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "published":
        return "bg-green-50 text-green-700 border-green-200";

      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading magazine submissions...
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="mx-auto max-w-7xl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-amber-600" />

            <h1 className="text-2xl font-bold text-slate-800">
              My Magazine
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Magazine content submitted by the HOD.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or activity..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Activity Filter */}

          <select
            value={activityFilter}
            onChange={(e) =>
              setActivityFilter(e.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          >
            <option value="all">
              All Activities
            </option>

            {activities.map((activity) => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>

          {/* Result Count */}

          <div className="text-sm text-slate-500 lg:whitespace-nowrap">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredMagazines.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {magazines.length}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          SELECTION BAR
      ===================================================== */}

      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-red-700">
            {selectedIds.length} item
            {selectedIds.length > 1 ? "s" : ""} selected
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              disabled={deleting}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={deleteSelected}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {/* SELECT */}

                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    disabled={filteredMagazines.length === 0}
                    className="h-4 w-4 cursor-pointer accent-amber-600"
                  />
                </th>

                {/* SERIAL */}

                <th className="w-14 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  #
                </th>

                {/* IMAGE */}

                <th className="w-20 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Image
                </th>

                {/* TITLE */}

                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Magazine Title
                </th>

                {/* ACTIVITY */}

                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Activity
                </th>

                {/* DATE */}

                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Event Date
                </th>

                {/* ISSUE */}

                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue
                </th>

                {/* STATUS */}

                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                {/* DELETE */}

                <th className="w-16 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Delete
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredMagazines.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center"
                  >
                    <Newspaper className="mx-auto h-10 w-10 text-slate-300" />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No magazine content found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing the search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMagazines.map((item, index) => {
                  const isSelected =
                    selectedIds.includes(item._id);

                  return (
                    <tr
                      key={item._id}
                      className={`border-b border-slate-100 transition last:border-0 hover:bg-amber-50/30 ${
                        isSelected
                          ? "bg-amber-50"
                          : "bg-white"
                      }`}
                    >
                      {/* SELECT */}

                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleSelect(item._id)
                          }
                          className="h-4 w-4 cursor-pointer accent-amber-600"
                        />
                      </td>

                      {/* SERIAL */}

                      <td className="px-3 py-3 text-sm text-slate-500">
                        {index + 1}
                      </td>

                      {/* IMAGE */}

                      <td className="px-3 py-3">
                        {item.eventPhoto ? (
                          <img
                            src={item.eventPhoto}
                            alt={item.title || "Magazine"}
                            className="h-12 w-16 rounded-lg border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-100">
                            <Newspaper className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </td>

                      {/* TITLE */}

                      <td className="max-w-[300px] px-3 py-3">
                        <p
                          className="truncate text-sm font-semibold text-slate-800"
                          title={item.title}
                        >
                          {item.title || "-"}
                        </p>
                      </td>

                      {/* ACTIVITY */}

                      <td className="px-3 py-3">
                        <span className="text-sm text-slate-600">
                          {getActivityName(item)}
                        </span>
                      </td>

                      {/* EVENT DATE */}

                      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                        {formatDate(item.eventDate)}
                      </td>

                      {/* ISSUE */}

                      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                        {item.magazineMonth &&
                        item.magazineYear
                          ? `${String(
                              item.magazineMonth
                            ).padStart(2, "0")}/${item.magazineYear}`
                          : "-"}
                      </td>

                      {/* STATUS */}

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status || "-"}
                        </span>
                      </td>

                      {/* DELETE */}

                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => deleteOne(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}