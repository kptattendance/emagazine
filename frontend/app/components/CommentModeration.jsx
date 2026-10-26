"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { MapPin, MessageCircle, Search, Trash2 } from "lucide-react";

import { getDepartmentLabel } from "../lib/departments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const locationText = (location) =>
  [location?.city, location?.region, location?.country]
    .filter(Boolean)
    .join(", ") || "Not available";

/*
============================================================
Reader comments for the admin, institute coordinator and
HOD (own department's articles). Shows who commented,
what they said they are, where from, and the approximate
location of their network. Comments can be deleted.
============================================================
*/

export default function CommentModeration({ scopeText }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/feedback/comments`)
      .then((response) => setComments(response.data?.data || []))
      .catch((error) => {
        console.error("LOAD COMMENTS ERROR:", error);

        Swal.fire({
          icon: "error",
          title: "Unable to load comments",
          text:
            error.response?.data?.message ||
            "Please try again.",
          confirmButtonColor: "#0f766e",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  // How many comments came from the same network
  const postsPerNetwork = useMemo(() => {
    const counts = {};

    comments.forEach((comment) => {
      if (comment.ipHash) {
        counts[comment.ipHash] = (counts[comment.ipHash] || 0) + 1;
      }
    });

    return counts;
  }, [comments]);

  const visible = comments.filter((comment) => {
    const text = search.trim().toLowerCase();

    if (!text) return true;

    return [
      comment.name,
      comment.text,
      comment.visitorType,
      comment.place,
      comment.article?.title,
      locationText(comment.approxLocation),
    ]
      .join(" ")
      .toLowerCase()
      .includes(text);
  });

  const handleDelete = async (comment) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this comment?",
      text: `"${comment.text.slice(0, 120)}" by ${comment.name}`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(comment._id);

      await axios.delete(
        `${API_URL}/api/feedback/comments/${comment._id}`
      );

      setComments((previous) =>
        previous.filter((item) => item._id !== comment._id)
      );
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          error.response?.data?.message ||
          "Unable to delete the comment.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Reader Comments
          </h1>

          <p className="mt-1 text-sm text-slate-500">{scopeText}</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading comments...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <MessageCircle className="mx-auto text-slate-300" size={32} />

          <p className="mt-3 text-sm text-slate-500">
            {comments.length === 0
              ? "No reader comments yet."
              : "No comments match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((comment) => {
            const repeats = postsPerNetwork[comment.ipHash] || 0;

            return (
              <div
                key={comment._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-teal-700">
                      On: {comment.article?.title || "Deleted article"}
                      {comment.article?.department &&
                        ` · ${getDepartmentLabel(comment.article.department)}`}
                    </p>

                    <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-bold text-slate-800">
                        {comment.name}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {comment.visitorType}
                      </span>

                      <span className="text-xs text-slate-500">
                        says from {comment.place}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                      {comment.text}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>{formatDateTime(comment.createdAt)}</span>

                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        Network location: {locationText(comment.approxLocation)}
                      </span>

                      {repeats > 1 && (
                        <span className="font-semibold text-amber-600">
                          {repeats} comments from this network
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(comment)}
                    disabled={deletingId === comment._id}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {deletingId === comment._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
