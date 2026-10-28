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

/*
============================================================
Every login account in Clerk, with its app account (MongoDB)
if there is one. Deleting here removes the person completely.
============================================================
*/

export default function ClerkUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = async (page = 1, searchText = query) => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/api/users/clerk`, {
        params: { page, search: searchText },
      });

      setUsers(response.data?.data || []);
      setPagination(response.data?.pagination || { page, pageSize: 50, total: 0 });
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
    loadUsers(1, "");
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search.trim());
    loadUsers(1, search.trim());
  };

  const handleDelete = async (user) => {
    try {
      setDeletingId(user.clerkUserId);

      // What will be removed, before anything is removed
      const { data } = await axios.get(
        `${API_URL}/api/users/clerk/${user.clerkUserId}/footprint`
      );

      const summary = data.data;

      const items = [
        summary.hasLogin && "Login account (Clerk)",
        summary.hasAppAccount &&
          `App account (MongoDB)${summary.role ? `: ${ROLE_LABELS[summary.role] || summary.role}` : ""}`,
        summary.submissions > 0 &&
          `${summary.submissions} magazine submission(s), ${summary.published} of them published`,
        summary.photos > 0 &&
          `${summary.photos} photo(s) in image storage (R2 / Cloudinary)`,
        summary.comments > 0 && `${summary.comments} reader comment(s) on those submissions`,
        summary.likes > 0 && `${summary.likes} like(s) on those submissions`,
      ].filter(Boolean);

      const result = await Swal.fire({
        icon: "warning",
        title: `Delete ${escapeHtml(summary.name || summary.email)} completely?`,
        html: `
          <div style="text-align:left;font-size:14px">
            <p style="margin-bottom:8px">This permanently removes:</p>
            <ul style="padding-left:18px;list-style:disc">
              ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <p style="margin-top:12px;color:#b91c1c;font-weight:600">
              This cannot be undone. Type DELETE to confirm.
            </p>
          </div>`,
        input: "text",
        inputPlaceholder: "DELETE",
        showCancelButton: true,
        confirmButtonText: "Delete everything",
        confirmButtonColor: "#dc2626",
        inputValidator: (value) =>
          value === "DELETE" ? undefined : "Type DELETE in capitals to confirm.",
      });

      if (!result.isConfirmed) return;

      const response = await axios.delete(
        `${API_URL}/api/users/clerk/${user.clerkUserId}`
      );

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
      setDeletingId(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clerk Users</h1>

          <p className="mt-1 text-sm text-slate-500">
            Every login account ({pagination.total}). Deleting here removes the
            person completely: login, app account, submissions and their photos.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email, press Enter"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </form>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading logins...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No logins found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div
                key={user.clerkUserId}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
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

                <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                    disabled={deletingId === user.clerkUserId}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === user.clerkUserId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete completely
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
                Page {pagination.page} of {pageCount}
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
