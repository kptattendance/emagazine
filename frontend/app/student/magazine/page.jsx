"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function StudentMagazinePage() {
  const router = useRouter();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const { user } = useUser();

  const [mongoUser, setMongoUser] =
    useState(null);

  const [contents, setContents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState(null);


  /*
  =====================================================
  LOAD USER
  =====================================================
  */

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      router.replace("/");
      return;
    }

    loadUser();
  }, [
    isLoaded,
    isSignedIn,
    user,
  ]);


  /*
  =====================================================
  LOAD MONGO USER
  =====================================================
  */

  const loadUser = async () => {
    try {
      const token =
        await getToken();

      if (!token) {
        return;
      }

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

      if (!data) {
        throw new Error(
          "User information not found."
        );
      }

      if (
        data.role !== "student"
      ) {
        router.replace("/");
        return;
      }

      setMongoUser(data);

      loadContents(data._id);
    } catch (error) {
      console.error(
        "LOAD USER ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load profile",
        text:
          error.response?.data?.message ||
          "Please try again.",
        confirmButtonColor:
          "#d4a017",
      });
    }
  };


  /*
  =====================================================
  LOAD CONTENTS
  =====================================================
  */

  const loadContents = async (
    userId
  ) => {
    try {
      setLoading(true);

      const response =
        await axios.get(
          `${API_URL}/api/magazine-content/my/${userId}`
        );

      setContents(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        "LOAD CONTENTS ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load submissions",
        text:
          error.response?.data?.message ||
          "Please try again.",
        confirmButtonColor:
          "#d4a017",
      });
    } finally {
      setLoading(false);
    }
  };


  /*
  =====================================================
  DELETE
  =====================================================
  */

  const handleDelete = async (
    content
  ) => {
    const result =
      await Swal.fire({
        icon: "warning",
        title: "Delete submission?",
        text:
          "This will permanently delete the magazine submission and its images.",
        showCancelButton: true,
        confirmButtonText:
          "Yes, Delete",
        cancelButtonText:
          "Cancel",
        confirmButtonColor:
          "#dc2626",
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(
        content._id
      );

      await axios.delete(
        `${API_URL}/api/magazine-content/${content._id}`,
        {
          data: {
            userId:
              mongoUser._id,
          },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text:
          "Magazine submission deleted successfully.",
        confirmButtonColor:
          "#d4a017",
      });

      loadContents(
        mongoUser._id
      );
    } catch (error) {
      console.error(
        "DELETE CONTENT ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          error.response?.data?.message ||
          "Unable to delete submission.",
        confirmButtonColor:
          "#d4a017",
      });
    } finally {
      setDeletingId(null);
    }
  };


  /*
  =====================================================
  STATUS
  =====================================================
  */

  const getStatusStyle = (
    status
  ) => {
    if (status === "published") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-amber-100 text-amber-700";
  };


  /*
  =====================================================
  LOADING
  =====================================================
  */

  if (
    !isLoaded ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading submissions...
            </p>
          </div>
        </div>
      </div>
    );
  }


  /*
  =====================================================
  PAGE
  =====================================================
  */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              My Magazine Submissions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage submitted magazine content.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/student/magazine/create"
              )
            }
            className="rounded-xl bg-[#d4a017] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b88a00]"
          >
            + New Submission
          </button>

        </div>


        {/* CONTENT */}

        {contents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">

            <h2 className="text-lg font-semibold text-slate-800">
              No submissions yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Submit your first activity for the college eMagazine.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">

            {contents.map(
              (content) => (
                <div
                  key={content._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  <div className="flex flex-col lg:flex-row">

                    {/* EVENT PHOTO */}

                    <div className="lg:w-64">

                      {content.eventPhoto ? (
                        <img
                          src={
                            content.eventPhoto
                          }
                          alt={
                            content.title
                          }
                          className="h-56 w-full object-cover lg:h-full"
                        />
                      ) : (
                        <div className="flex h-56 items-center justify-center bg-slate-100 text-sm text-slate-400">
                          No image
                        </div>
                      )}

                    </div>


                    {/* DETAILS */}

                    <div className="flex-1 p-5">

                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <div>
                          <h2 className="text-lg font-bold text-slate-800">
                            {content.title}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {content.activity?.name ||
                              "Activity"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            content.status
                          )}`}
                        >
                          {content.status}
                        </span>

                      </div>


                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">

                        <div>
                          <span className="font-semibold">
                            Event Date:
                          </span>{" "}
                          {new Date(
                            content.eventDate
                          ).toLocaleDateString(
                            "en-IN"
                          )}
                        </div>

                        <div>
                          <span className="font-semibold">
                            Department:
                          </span>{" "}
                          {content.student?.department ||
                            content.department ||
                            "-"}
                        </div>

                      </div>


                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                        {content.description}
                      </p>


                      {/* REJECTION */}

                      {content.status ===
                        "rejected" &&
                        content.rejectionReason && (
                          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">

                            <p className="text-xs font-bold uppercase text-red-700">
                              Rejection Reason
                            </p>

                            <p className="mt-1 text-sm text-red-700">
                              {
                                content.rejectionReason
                              }
                            </p>

                          </div>
                        )}


                      {/* ACTIONS */}

                      <div className="mt-5 flex flex-wrap gap-2">

                        {(content.status ===
                          "pending" ||
                          content.status ===
                            "rejected") && (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/student/magazine/edit/${content._id}`
                              )
                            }
                            className="rounded-xl bg-[#d4a017] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b88a00]"
                          >
                            Edit
                          </button>
                        )}


                        {(content.status ===
                          "pending" ||
                          content.status ===
                            "rejected") && (
                          <button
                            type="button"
                            disabled={
                              deletingId ===
                              content._id
                            }
                            onClick={() =>
                              handleDelete(
                                content
                              )
                            }
                            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId ===
                            content._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        )}

                      </div>

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