"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function HODMagazinePage() {
  const router = useRouter();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const [user, setUser] =
    useState(null);

  const [contents, setContents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    loadUser();
  }, [
    isLoaded,
    isSignedIn,
  ]);

  const loadUser = async () => {
    try {
      const token =
        await getToken();

      const response =
        await axios.get(
          `${API_URL}/api/users/me`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        response.data?.data;

      if (
        data?.role !== "hod"
      ) {
        router.replace("/");
        return;
      }

      if (!data?._id) {
        throw new Error(
          "HOD MongoDB user ID is missing."
        );
      }

      if (!data?.department) {
        Swal.fire({
          icon: "error",
          title: "Department not assigned",
          text:
            "This HOD does not have a department assigned.",
          confirmButtonColor:
            "#d4a017",
        });

        setLoading(false);
        return;
      }

      setUser(data);

      await loadPending(
        data._id
      );
    } catch (error) {
      console.error(
        "LOAD HOD USER ERROR:",
        error
      );

      setLoading(false);

      Swal.fire({
        icon: "error",
        title:
          "Unable to load profile",
        text:
          error.response?.data?.message ||
          error.message ||
          "Please try again.",
        confirmButtonColor:
          "#d4a017",
      });
    }
  };

  const loadPending = async (
    userId
  ) => {
    try {
      setLoading(true);

      if (!userId) {
        throw new Error(
          "HOD user ID is missing."
        );
      }

      const response =
        await axios.get(
          `${API_URL}/api/magazine-content/pending`,
          {
            params: {
              userId,
            },
          }
        );

      setContents(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        "LOAD PENDING ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title:
          "Unable to load submissions",
        text:
          error.response?.data?.message ||
          error.message ||
          "Please try again.",
        confirmButtonColor:
          "#d4a017",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (
    content
  ) => {
    if (!user?._id) {
      return;
    }

    const result =
      await Swal.fire({
        icon: "question",
        title:
          "Approve this content?",
        text:
          "Once approved, it will be published and the student will no longer be able to edit it.",
        showCancelButton: true,
        confirmButtonText:
          "Approve & Publish",
        cancelButtonText:
          "Cancel",
        confirmButtonColor:
          "#16a34a",
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setProcessingId(
        content._id
      );

      await axios.patch(
        `${API_URL}/api/magazine-content/${content._id}/approve`,
        {
          approverId:
            user._id,
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Published",
        text:
          "Magazine content has been approved and published.",
        confirmButtonColor:
          "#d4a017",
      });

      await loadPending(
        user._id
      );
    } catch (error) {
      console.error(
        "APPROVE ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title:
          "Approval failed",
        text:
          error.response?.data?.message ||
          "Unable to approve content.",
        confirmButtonColor:
          "#d4a017",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (
    content
  ) => {
    if (!user?._id) {
      return;
    }

    const result =
      await Swal.fire({
        icon: "warning",
        title:
          "Reject Content",
        input: "textarea",
        inputLabel:
          "Reason for rejection",
        inputPlaceholder:
          "Enter the reason...",
        inputAttributes: {
          "aria-label":
            "Reason for rejection",
        },
        showCancelButton: true,
        confirmButtonText:
          "Reject",
        cancelButtonText:
          "Cancel",
        confirmButtonColor:
          "#dc2626",
        inputValidator:
          (value) => {
            if (
              !value?.trim()
            ) {
              return "Please enter a rejection reason.";
            }

            return undefined;
          },
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setProcessingId(
        content._id
      );

      await axios.patch(
        `${API_URL}/api/magazine-content/${content._id}/reject`,
        {
          approverId:
            user._id,
          rejectionReason:
            result.value.trim(),
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Rejected",
        text:
          "The content has been returned to the student.",
        confirmButtonColor:
          "#d4a017",
      });

      await loadPending(
        user._id
      );
    } catch (error) {
      console.error(
        "REJECT ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title:
          "Rejection failed",
        text:
          error.response?.data?.message ||
          "Unable to reject content.",
        confirmButtonColor:
          "#d4a017",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (
    !isLoaded ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-500">
        Loading magazine submissions...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">
            Unable to load HOD profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please contact the administrator and ensure a department is assigned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Magazine Submissions
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review student submissions before publishing.
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Department
              </p>

              <p className="mt-1 text-lg font-bold text-amber-800">
                {user.department}
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
              There are no magazine submissions waiting for approval in your department.
            </p>

          </div>
        ) : (
          <div className="space-y-6">

            {contents.map(
              (content) => (
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
                          {content.activity?.name ||
                            "-"}
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
                        Student
                      </h3>

                      {content.student?.photo ? (
                        <img
                          src={
                            content.student.photo
                          }
                          alt={
                            content.student.name ||
                            "Student"
                          }
                          className="mb-4 h-32 w-32 rounded-2xl object-cover"
                        />
                      ) : null}

                      <div className="space-y-2 text-sm text-slate-700">

                        <p>
                          <span className="font-semibold">
                            Name:
                          </span>{" "}
                          {content.student?.name ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Register No:
                          </span>{" "}
                          {content.student?.registerNumber ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Department:
                          </span>{" "}
                          {content.student?.department ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Semester:
                          </span>{" "}
                          {content.student?.semester ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Phone:
                          </span>{" "}
                          {content.student?.phone ||
                            "-"}
                        </p>

                      </div>

                    </div>

                    <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">

                      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                        Submission
                      </h3>

                      <div className="space-y-3 text-sm text-slate-700">

                        <p>
                          <span className="font-semibold">
                            Title:
                          </span>{" "}
                          {content.title ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Activity:
                          </span>{" "}
                          {content.activity?.name ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Level:
                          </span>{" "}
                          {content.level ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Department:
                          </span>{" "}
                          {content.department ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Event Date:
                          </span>{" "}
                          {content.eventDate
                            ? new Date(
                                content.eventDate
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Submitted By:
                          </span>{" "}
                          {content.submittedBy?.name ||
                            "-"}
                        </p>

                        <p>
                          <span className="font-semibold">
                            Submitted Email:
                          </span>{" "}
                          {content.submittedBy?.email ||
                            "-"}
                        </p>

                      </div>

                    </div>

                    <div className="p-5">

                      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                        Event
                      </h3>

                      {content.eventPhoto ? (
                        <img
                          src={
                            content.eventPhoto
                          }
                          alt={
                            content.title ||
                            "Event"
                          }
                          className="mb-4 h-56 w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="mb-4 flex h-56 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
                          No event photo
                        </div>
                      )}

                      <p className="text-sm leading-6 text-slate-600">
                        {content.description ||
                          "-"}
                      </p>

                    </div>

                  </div>

                  <div className="border-t border-slate-100 p-5">

                    <div className="flex flex-wrap gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/hod/studentRequest/edit/${content._id}`
                          )
                        }
                        disabled={
                          processingId ===
                          content._id
                        }
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleApprove(
                            content
                          )
                        }
                        disabled={
                          processingId ===
                          content._id
                        }
                        className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId ===
                        content._id
                          ? "Processing..."
                          : "Approve & Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleReject(
                            content
                          )
                        }
                        disabled={
                          processingId ===
                          content._id
                        }
                        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId ===
                        content._id
                          ? "Processing..."
                          : "Reject"}
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}