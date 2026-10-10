"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@clerk/nextjs";

import { getDepartmentLabel } from "../lib/departments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  published: "bg-emerald-100 text-emerald-700",
};

const STATUS_LABELS = {
  pending: "Pending Approval",
  rejected: "Rejected",
  published: "Published",
};

/*
============================================================
List of magazine content.

endpoint "my"     → content submitted by the logged-in user
endpoint "review" → content the logged-in user approves
============================================================
*/

export default function SubmissionList({
  endpoint,
  title,
  subtitle,
  emptyText,
  newHref,
  editBasePath,
  canManagePublished = false,
}) {
  const router = useRouter();

  const { isLoaded, isSignedIn } = useAuth();

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    loadContents();
  }, [isLoaded, isSignedIn]);

  const loadContents = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/api/magazine-content/${endpoint}`
      );

      setContents(response.data?.data || []);
    } catch (error) {
      console.error("LOAD CONTENTS ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to load submissions",
        text:
          error.response?.data?.message ||
          "Please try again.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (content) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this content?",
      text: `"${content.title}" will be permanently deleted.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(content._id);

      await axios.delete(
        `${API_URL}/api/magazine-content/${content._id}`
      );

      setContents((previous) =>
        previous.filter((item) => item._id !== content._id)
      );
    } catch (error) {
      console.error("DELETE CONTENT ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          error.response?.data?.message ||
          "Unable to delete the content.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Loading magazine submissions...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {title}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        </div>

        {newHref && (
          <button
            type="button"
            onClick={() => router.push(newHref)}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            New Submission
          </button>
        )}
      </div>

      {contents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contents.map((content) => {
            const isPublished = content.status === "published";

            const author =
              content.student?.name ||
              content.faculty?.name ||
              content.submittedBy?.name;

            return (
              <div
                key={content._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row">
                  {content.eventPhoto && (
                    <img
                      src={content.eventPhoto}
                      alt={content.title}
                      className="h-40 w-full rounded-xl object-cover sm:h-28 sm:w-40 sm:shrink-0"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h2 className="text-lg font-bold text-slate-800">
                        {content.title}
                      </h2>

                      <span
                        className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[content.status] || ""
                        }`}
                      >
                        {STATUS_LABELS[content.status] ||
                          content.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {content.activity?.name || "-"} ·{" "}
                      {getDepartmentLabel(content.department)}
                      {content.eventDate
                        ? ` · ${new Date(
                            content.eventDate
                          ).toLocaleDateString("en-IN")}`
                        : ""}
                    </p>

                    {endpoint !== "my" && author && (
                      <p className="mt-1 text-sm text-slate-500">
                        By {author}
                      </p>
                    )}

                    <p className="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {content.description}
                    </p>

                    {content.status === "rejected" &&
                      content.rejectionReason && (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          <span className="font-semibold">
                            Reason for rejection:
                          </span>{" "}
                          {content.rejectionReason}
                        </div>
                      )}
                  </div>
                </div>

                {(!isPublished || canManagePublished) && (
                  <div className="flex flex-wrap gap-3 border-t border-slate-100 px-5 py-4">
                    {!isPublished && (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `${editBasePath}/${content._id}`
                          )
                        }
                        disabled={deletingId === content._id}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {content.status === "rejected"
                          ? "Edit & Resubmit"
                          : "Edit"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(content)}
                      disabled={deletingId === content._id}
                      className="rounded-xl border border-red-100 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === content._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
