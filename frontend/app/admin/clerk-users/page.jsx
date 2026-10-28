"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Trash2,
  UserX,
} from "lucide-react";

import { ROLE_LABELS } from "../../lib/approvalStatus";
import { getDepartmentLabel } from "../../lib/departments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Role filter value for logins without an app account
const NO_APP_ACCOUNT = "none";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Never";

const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

// Asks for DELETE before anything is removed
const confirmDelete = ({ title, removed, kept, confirmText }) =>
  Swal.fire({
    icon: "warning",
    title: escapeHtml(title),
    html: `
      <div style="text-align:left;font-size:14px">
        <p style="margin-bottom:8px">This permanently removes:</p>
        <ul style="padding-left:18px;list-style:disc">
          ${removed.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <p style="margin-top:10px;color:#0f766e;font-weight:600">
          ${escapeHtml(kept)}
        </p>
        <p style="margin-top:12px;color:#b91c1c;font-weight:600">
          This cannot be undone. Type DELETE to confirm.
        </p>
      </div>`,
    input: "text",
    inputPlaceholder: "DELETE",
    showCancelButton: true,
    confirmButtonText: confirmText,
    confirmButtonColor: "#dc2626",
    inputValidator: (value) =>
      value === "DELETE" ? undefined : "Type DELETE in capitals to confirm.",
  });

/*
============================================================
Every login account in Clerk, with its app account (MongoDB)
if there is one. Deleting here removes the login and the app
account; the person's submissions stay in the magazine.
============================================================
*/

export default function ClerkUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, allLogins: 0 });
  const [roleCounts, setRoleCounts] = useState({});

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ search: "", role: "" });

  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadUsers = async (page = 1, nextFilters = filters) => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/api/users/clerk`, {
        params: { page, ...nextFilters },
      });

      setUsers(response.data?.data || []);
      setRoleCounts(response.data?.roleCounts || {});
      setPagination(response.data?.pagination || { page, pageSize: 50, total: 0, allLogins: 0 });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load logins",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, filters);
  }, []);

  const applyFilters = (next) => {
    setFilters(next);
    setSelected([]);
    loadUsers(1, next);
  };

  /* ---------- selection */

  const pageIds = users.map((user) => user.clerkUserId);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const toggleOne = (id) =>
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );

  const togglePage = () =>
    setSelected((previous) =>
      allOnPageSelected
        ? previous.filter((id) => !pageIds.includes(id))
        : [...new Set([...previous, ...pageIds])]
    );

  /* ---------- delete one */

  const handleDelete = async (user) => {
    try {
      setBusy(true);

      const { data } = await axios.get(
        `${API_URL}/api/users/clerk/${user.clerkUserId}/footprint`
      );

      const summary = data.data;

      const result = await confirmDelete({
        title: `Delete ${summary.name || summary.email}?`,
        removed: [
          summary.hasLogin && "Login account (Clerk)",
          summary.hasAppAccount &&
            `App account (MongoDB)${summary.role ? `: ${ROLE_LABELS[summary.role] || summary.role}` : ""}`,
          summary.submissions > 0 &&
            "Phone number and email stored in their submissions",
        ].filter(Boolean),
        kept:
          summary.submissions > 0
            ? `Their ${summary.submissions} submission(s) (${summary.published} published) stay in the magazine with name, photos, comments and likes.`
            : "They have no submissions.",
        confirmText: "Delete account",
      });

      if (!result.isConfirmed) return;

      const response = await axios.delete(
        `${API_URL}/api/users/clerk/${user.clerkUserId}`
      );

      setSelected((previous) => previous.filter((id) => id !== user.clerkUserId));

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: response.data?.message,
        confirmButtonColor: "#0f766e",
      });

      loadUsers(pagination.page);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setBusy(false);
    }
  };

  /* ---------- delete selected */

  const handleBulkDelete = async () => {
    try {
      setBusy(true);

      const { data } = await axios.post(
        `${API_URL}/api/users/clerk/bulk-footprint`,
        { clerkUserIds: selected }
      );

      const summaries = data.data || [];

      const submissions = summaries.reduce((sum, item) => sum + item.submissions, 0);
      const published = summaries.reduce((sum, item) => sum + item.published, 0);

      const byRole = {};
      summaries.forEach((item) => {
        const label = item.role ? ROLE_LABELS[item.role] || item.role : "No app account";
        byRole[label] = (byRole[label] || 0) + 1;
      });

      const result = await confirmDelete({
        title: `Delete ${summaries.length} account(s)?`,
        removed: [
          `${summaries.length} login account(s) and their app accounts: ${Object.entries(byRole)
            .map(([label, count]) => `${count} ${label}`)
            .join(", ")}`,
          submissions > 0 && "Phone numbers and emails stored in their submissions",
        ].filter(Boolean),
        kept:
          submissions > 0
            ? `Their ${submissions} submission(s) (${published} published) stay in the magazine with names, photos, comments and likes.`
            : "None of them have submissions.",
        confirmText: `Delete ${summaries.length} account(s)`,
      });

      if (!result.isConfirmed) return;

      const response = await axios.post(
        `${API_URL}/api/users/clerk/bulk-delete`,
        { clerkUserIds: selected }
      );

      const failed = response.data?.failed || [];

      setSelected(failed.map((item) => item.clerkUserId));

      await Swal.fire({
        icon: failed.length ? "warning" : "success",
        title: response.data?.message,
        html: failed.length
          ? `<div style="text-align:left;font-size:13px"><p>Not deleted:</p><ul style="padding-left:18px;list-style:disc">${failed
              .map((item) => `<li><b>${escapeHtml(item.name)}</b>: ${escapeHtml(item.message)}</li>`)
              .join("")}</ul></div>`
          : "",
        confirmButtonColor: "#0f766e",
      });

      loadUsers(1);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setBusy(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  const roleOptions = Object.keys(ROLE_LABELS).filter((role) => roleCounts[role]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Clerk Users</h1>

        <p className="mt-1 text-sm text-slate-500">
          Every login account ({pagination.allLogins}). Deleting here removes the
          login and app account; their submissions stay in the magazine.
        </p>
      </div>

      {/* FILTERS */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters({ ...filters, search: search.trim() });
          }}
          className="relative flex-1"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email, press Enter"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </form>

        <select
          value={filters.role}
          onChange={(e) => applyFilters({ ...filters, role: e.target.value })}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-64"
        >
          <option value="">All roles ({pagination.allLogins})</option>

          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]} ({roleCounts[role]})
            </option>
          ))}

          {roleCounts[NO_APP_ACCOUNT] > 0 && (
            <option value={NO_APP_ACCOUNT}>
              No app account ({roleCounts[NO_APP_ACCOUNT]})
            </option>
          )}
        </select>
      </div>

      {/* BULK BAR */}

      {selected.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-red-700">
            {selected.length} account(s) selected
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete selected
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading logins...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No logins match.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={togglePage}
              className="h-4 w-4 rounded border-slate-300"
            />
            Select all on this page ({users.length})
          </label>

          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div
                key={user.clerkUserId}
                className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  selected.includes(user.clerkUserId) ? "bg-red-50/40" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(user.clerkUserId)}
                    onChange={() => toggleOne(user.clerkUserId)}
                    aria-label={`Select ${user.name || user.email}`}
                    className="h-4 w-4 shrink-0 rounded border-slate-300"
                  />

                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {user.name || "(no name)"}
                    </p>

                    <p className="truncate text-xs text-slate-500">{user.email}</p>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Joined {formatDate(user.createdAt)} · Last login {formatDate(user.lastSignInAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 pl-7 sm:pl-0">
                  {user.appAccount ? (
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      {ROLE_LABELS[user.appAccount.role] || user.appAccount.role}
                      {user.appAccount.department &&
                        ` · ${getDepartmentLabel(user.appAccount.department)}`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      <UserX size={12} />
                      No app account
                    </span>
                  )}

                  {(user.banned || user.appAccount?.isActive === false) && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Inactive
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(user)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Delete account
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <button
                type="button"
                onClick={() => loadUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span>
                Page {pagination.page} of {pageCount} · {pagination.total} matching
              </span>

              <button
                type="button"
                onClick={() => loadUsers(pagination.page + 1)}
                disabled={pagination.page >= pageCount}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
