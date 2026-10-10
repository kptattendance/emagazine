"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@clerk/nextjs";

import { getDepartmentLabel } from "../lib/departments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/*
============================================================
Pending magazine content waiting for the logged-in
approver (HOD or Magazine Coordinator).

Student content and faculty content have separate
edit pages.
============================================================
*/

export default function ReviewRequests({
  scopeLabel,
  subtitle,
  emptyText,
  studentEditBasePath,
  facultyEditBasePath,
}) {
  const router = useRouter();

  const { isLoaded, isSignedIn } = useAuth();

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    loadPending();
  }, [isLoaded, isSignedIn]);

  const loadPending = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/api/magazine-content/pending`
      );

      setContents(response.data?.data || []);
    } catch (error) {
      console.error("LOAD PENDING ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to load submissions",
        text:
          error.response?.data?.message ||
          error.message ||
          "Please try again.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (content) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Approve this content?",
      text: "Once approved, it will be published and the submitter will no longer be able to edit it.",
      showCancelButton: true,
      confirmButtonText: "Approve & Publish",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setProcessingId(content._id);

      await axios.patch(
        `${API_URL}/api/magazine-content/${content._id}/approve`
      );

      await Swal.fire({
        icon: "success",
        title: "Published",
        text: "Magazine content has been approved and published.",
        confirmButtonColor: "#d4a017",
      });

      await loadPending();
    } catch (error) {
      console.error("APPROVE ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Approval failed",
        text:
          error.response?.data?.message ||
          "Unable to approve content.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (content) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Reject Content",
      input: "textarea",
      inputLabel: "Reason for rejection",
      inputPlaceholder: "Enter the reason...",
      inputAttributes: {
        "aria-label": "Reason for rejection",
      },
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      inputValidator: (value) => {
        if (!value?.trim()) {
          return "Please enter a rejection reason.";
        }

        return undefined;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setProcessingId(content._id);

      await axios.patch(
        `${API_URL}/api/magazine-content/${content._id}/reject`,
        {
          rejectionReason: result.value.trim(),
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Rejected",
        text: "The content has been returned to the submitter.",
        confirmButtonColor: "#d4a017",
      });

      await loadPending();
    } catch (error) {
      console.error("REJECT ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Rejection failed",
        text:
          error.response?.data?.message ||
          "Unable to reject content.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setProcessingId(null);
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
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Magazine Submissions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Reviewing
            </p>

            <p className="mt-1 text-lg font-bold text-amber-800">
              {scopeLabel}
            </p>
          </div>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            No pending submissions
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {contents.map((content) => {
            const isStudent =
              String(
                content.submittedBy?.role || ""
              ).toLowerCase() === "student";

            const isCreative =
              content.contentType === "creative";

            const photo = isStudent
              ? content.student?.photo
              : content.faculty?.photo;

            const details = isStudent
              ? [
                  ["Name", content.student?.name],
                  ["Register No", content.student?.registerNumber],
                  ["Department", content.student?.department],
                  ["Semester", content.student?.semester],
                  ["Phone", content.student?.phone],
                ]
              : [
                  [
                    "Name",
                    content.faculty?.name ||
                      content.submittedBy?.name,
                  ],
                  ["Designation", content.faculty?.designation],
                ];

            return (
              <div
                key={content._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        {content.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {content.activity?.name || "-"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending Approval
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3">
                  <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                      {isStudent ? "Student" : "Faculty"}
                    </h3>

                    {photo ? (
                      <img
                        src={photo}
                        alt={isStudent ? "Student" : "Faculty"}
                        className="mb-4 h-32 w-32 rounded-2xl object-cover"
                      />
                    ) : null}

                    <div className="space-y-2 text-sm text-slate-700">
                      {details.map(([label, value]) => (
                        <p key={label}>
                          <span className="font-semibold">
                            {label}:
                          </span>{" "}
                          {value || "-"}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                      Submission
                    </h3>

                    <div className="space-y-3 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">
                          Type:
                        </span>{" "}
                        {isCreative
                          ? "Own work"
                          : "College activity"}
                      </p>

                      <p>
                        <span className="font-semibold">
                          {isCreative ? "Category:" : "Activity:"}
                        </span>{" "}
                        {content.activity?.name || "-"}
                      </p>

                      <p>
                        <span className="font-semibold">
                          Publish Under:
                        </span>{" "}
                        {getDepartmentLabel(content.department)}
                      </p>

                      {!isCreative && (
                        <p>
                          <span className="font-semibold">
                            Event Date:
                          </span>{" "}
                          {content.eventDate
                            ? new Date(
                                content.eventDate
                              ).toLocaleDateString("en-IN")
                            : "-"}
                        </p>
                      )}

                      <p>
                        <span className="font-semibold">
                          Submitted By:
                        </span>{" "}
                        {content.submittedBy?.name || "-"}
                      </p>

                      <p>
                        <span className="font-semibold">
                          Submitted Email:
                        </span>{" "}
                        {content.submittedBy?.email || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                      {isCreative ? "Work" : "Event"}
                    </h3>

                    {content.eventPhoto ? (
                      <a
                        href={content.eventPhoto}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={content.eventPhoto}
                          alt={content.title || "Photo"}
                          className="mb-4 h-56 w-full rounded-2xl object-cover"
                        />
                      </a>
                    ) : (
                      <div className="mb-4 flex h-20 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
                        No image
                      </div>
                    )}

                    <p className="max-h-72 overflow-y-auto whitespace-pre-line text-sm leading-6 text-slate-600">
                      {content.description || "-"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-5">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `${
                            isStudent
                              ? studentEditBasePath
                              : facultyEditBasePath
                          }/${content._id}`
                        )
                      }
                      disabled={processingId === content._id}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(content)}
                      disabled={processingId === content._id}
                      className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingId === content._id
                        ? "Processing..."
                        : "Approve & Publish"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(content)}
                      disabled={processingId === content._id}
                      className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingId === content._id
                        ? "Processing..."
                        : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
