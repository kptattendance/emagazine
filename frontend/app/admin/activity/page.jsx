"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Power,
  Search,
  X,
  Activity as ActivityIcon,
  Trash2,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ActivityPage() {
  const { getToken } = useAuth();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const [form, setForm] = useState({
    name: "",
    order: 0,
  });

  // =====================================================
  // FETCH ACTIVITIES
  // =====================================================

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const response = await axios.get(
        `${API_URL}/api/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setActivities(response.data.data || []);
      } else {
        throw new Error(
          response.data?.message ||
            "Failed to fetch activities."
        );
      }
    } catch (error) {
      console.error("FETCH ACTIVITIES ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          error.response?.data?.message ||
          "Unable to load activities.",
        confirmButtonColor: "#d97706",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // =====================================================
  // SELECT / DESELECT
  // =====================================================

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredActivities.map(
      (activity) => activity._id
    );

    const allSelected = visibleIds.every((id) =>
      selectedIds.includes(id)
    );

    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => [
        ...new Set([...prev, ...visibleIds]),
      ]);
    }
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddModal = () => {
    setEditingActivity(null);

    setForm({
      name: "",
      order: 0,
    });

    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = (activity) => {
    setEditingActivity(activity);

    setForm({
      name: activity.name || "",
      order: activity.order ?? 0,
    });

    setShowModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingActivity(null);

    setForm({
      name: "",
      order: 0,
    });
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // ADD / UPDATE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = form.name.trim();

    if (!cleanName) {
      Swal.fire({
        icon: "warning",
        title: "Activity name required",
        text: "Please enter an activity name.",
        confirmButtonColor: "#d97706",
      });

      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const payload = {
        name: cleanName,
        order: Number(form.order) || 0,
      };

      let response;

      if (editingActivity) {
        response = await axios.put(
          `${API_URL}/api/activities/${editingActivity._id}`,
          payload,
          config
        );
      } else {
        response = await axios.post(
          `${API_URL}/api/activities`,
          payload,
          config
        );
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Operation failed."
        );
      }

      await Swal.fire({
        icon: "success",
        title: editingActivity
          ? "Activity updated"
          : "Activity added",
        text:
          response.data?.message ||
          "Operation completed successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      closeModal();

      await fetchActivities();
    } catch (error) {
      console.error(
        editingActivity
          ? "UPDATE ACTIVITY ERROR:"
          : "CREATE ACTIVITY ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Operation failed",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to complete the operation.",
        confirmButtonColor: "#d97706",
      });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TOGGLE ACTIVE / INACTIVE
  // =====================================================

  const handleToggle = async (activity) => {
    const willActivate = !activity.isActive;

    const result = await Swal.fire({
      icon: willActivate ? "question" : "warning",
      title: willActivate
        ? "Activate activity?"
        : "Deactivate activity?",
      text: willActivate
        ? `"${activity.name}" will appear in the activity dropdown.`
        : `"${activity.name}" will no longer appear for new submissions.`,
      showCancelButton: true,
      confirmButtonText: willActivate
        ? "Yes, activate"
        : "Yes, deactivate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = await getToken();

      const response = await axios.patch(
        `${API_URL}/api/activities/${activity._id}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to change activity status."
        );
      }

      await Swal.fire({
        icon: "success",
        title: activity.isActive
          ? "Activity deactivated"
          : "Activity activated",
        text: response.data.message,
        timer: 1300,
        showConfirmButton: false,
      });

      await fetchActivities();
    } catch (error) {
      console.error("TOGGLE ACTIVITY ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          error.response?.data?.message ||
          "Unable to change activity status.",
        confirmButtonColor: "#d97706",
      });
    }
  };

  // =====================================================
  // DELETE SINGLE
  // =====================================================

  const handleDelete = async (activity) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete activity?",
      html: `
        <div style="font-size:14px">
          <strong>${activity.name}</strong>
          <br/>
          <br/>
          This activity will be permanently deleted if it
          has not been used by any magazine content.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = await getToken();

      const response = await axios.delete(
        `${API_URL}/api/activities/${activity._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to delete activity."
        );
      }

      setSelectedIds((prev) =>
        prev.filter((id) => id !== activity._id)
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: response.data.message,
        timer: 1400,
        showConfirmButton: false,
      });

      await fetchActivities();
    } catch (error) {
      console.error("DELETE ACTIVITY ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Cannot delete",
        text:
          error.response?.data?.message ||
          "Unable to delete activity.",
        confirmButtonColor: "#d97706",
      });
    }
  };

  // =====================================================
  // DELETE SELECTED
  // =====================================================

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No activities selected",
        text: "Please select at least one activity.",
        confirmButtonColor: "#d97706",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: `Delete ${selectedIds.length} activities?`,
      text:
        "Activities already used by magazine content will not be deleted.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete selected",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = await getToken();

      const response = await axios.delete(
        `${API_URL}/api/activities/bulk`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            ids: selectedIds,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to delete activities."
        );
      }

      setSelectedIds([]);

      await Swal.fire({
        icon: response.data.blockedCount > 0
          ? "info"
          : "success",
        title: "Delete completed",
        text: response.data.message,
        confirmButtonColor: "#d97706",
      });

      await fetchActivities();
    } catch (error) {
      console.error(
        "DELETE MULTIPLE ACTIVITIES ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          error.response?.data?.message ||
          "Unable to delete selected activities.",
        confirmButtonColor: "#d97706",
      });
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = activity.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = showInactive
      ? true
      : activity.isActive;

    return matchesSearch && matchesStatus;
  });

  const visibleIds = filteredActivities.map(
    (activity) => activity._id
  );

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) =>
      selectedIds.includes(id)
    );

  // =====================================================
  // COUNTS
  // =====================================================

  const activeCount = activities.filter(
    (item) => item.isActive
  ).length;

  const inactiveCount = activities.filter(
    (item) => !item.isActive
  ).length;

  return (
    <div className="min-h-screen">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Activities
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage activities available for magazine submissions.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
        >
          <Plus size={18} />
          Add Activity
        </button>
      </div>

      {/* SUMMARY */}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">
            Total Activities
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-800">
            {activities.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">
            Active
          </p>

          <p className="mt-1 text-2xl font-bold text-amber-600">
            {activeCount}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-1">
          <p className="text-sm text-slate-500">
            Inactive
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-500">
            {inactiveCount}
          </p>
        </div>

      </div>

      {/* FILTERS */}

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="relative w-full md:max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search activities..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />

          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">

            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) =>
                setShowInactive(e.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />

            Show inactive activities

          </label>

        </div>

      </div>

      {/* BULK ACTION BAR */}

      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-sm font-semibold text-amber-800">
            {selectedIds.length} activity
            {selectedIds.length !== 1 ? "ies" : ""} selected
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear Selection
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              <Trash2 size={14} />
              Delete Selected
            </button>

          </div>

        </div>
      )}

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px] border-collapse">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50">

                <th className="w-12 px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  #
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Activity
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading activities...
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center"
                  >

                    <ActivityIcon
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No activities found
                    </p>

                  </td>
                </tr>
              ) : (
                filteredActivities.map(
                  (activity, index) => {
                    const selected =
                      selectedIds.includes(
                        activity._id
                      );

                    return (
                      <tr
                        key={activity._id}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          selected
                            ? "bg-amber-50"
                            : "hover:bg-amber-50/30"
                        }`}
                      >

                        <td className="px-4 py-4 text-center">

                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleSelection(
                                activity._id
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                          />

                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">

                          <p className="font-medium text-slate-800">
                            {activity.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Added{" "}
                            {activity.createdAt
                              ? new Date(
                                  activity.createdAt
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "—"}
                          </p>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {activity.order ?? 0}
                        </td>

                        <td className="px-5 py-4">

                          {activity.isActive ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                              Inactive
                            </span>
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  activity
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggle(
                                  activity
                                )
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                activity.isActive
                                  ? "border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              }`}
                            >
                              <Power size={14} />

                              {activity.isActive
                                ? "Disable"
                                : "Enable"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  activity
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  {editingActivity
                    ? "Edit Activity"
                    : "Add Activity"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {editingActivity
                    ? "Update the activity details."
                    : "Add an activity for magazine submissions."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Activity Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Industrial Visit"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />

              </div>

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Display Order
                </label>

                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingActivity
                    ? "Update Activity"
                    : "Add Activity"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}