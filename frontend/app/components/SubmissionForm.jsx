"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@clerk/nextjs";

import {
  CalendarDays,
  ImagePlus,
  Loader2,
  Newspaper,
  Save,
  Upload,
  X,
} from "lucide-react";

import {
  DEPARTMENTS,
  INSTITUTE_DEPARTMENT,
  getDepartmentLabel,
  normalizeDepartment,
} from "../lib/departments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

/*
============================================================
Magazine submission form for faculty, the magazine
coordinator, and approvers editing faculty content.

contentId given  → edit that content
contentId absent → new submission
============================================================
*/

export default function SubmissionForm({
  contentId,
  backHref,
}) {
  const router = useRouter();

  const { isLoaded, isSignedIn } = useAuth();

  const isEdit = Boolean(contentId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mongoUser, setMongoUser] = useState(null);
  const [activities, setActivities] = useState([]);

  // Role of whoever submitted the content being edited
  const [submitterRole, setSubmitterRole] = useState("");

  const [postType, setPostType] = useState("activity");

  const [form, setForm] = useState({
    title: "",
    activity: "",
    department: "",
    eventDate: "",
    description: "",
    facultyName: "",
    designation: "",
    originalWork: false,
  });

  const [eventPhoto, setEventPhoto] = useState(null);
  const [eventPhotoPreview, setEventPhotoPreview] = useState("");

  // Photo already stored for the content being edited
  const [savedEventPhoto, setSavedEventPhoto] = useState("");

  const [facultyPhoto, setFacultyPhoto] = useState(null);
  const [facultyPhotoPreview, setFacultyPhotoPreview] = useState("");

  /* =========================================================
     LOAD USER + ACTIVITIES + CONTENT
  ========================================================= */

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    loadPage();
  }, [isLoaded, isSignedIn, contentId]);

  const loadPage = async () => {
    try {
      setLoading(true);

      const [userResponse, activityResponse] =
        await Promise.all([
          axios.get(`${API_URL}/api/users/me`),
          axios.get(`${API_URL}/api/activities/active`),
        ]);

      const userData = userResponse.data?.data;

      if (!userData) {
        throw new Error("User information could not be loaded.");
      }

      const activityData = activityResponse.data?.data || [];

      setMongoUser(userData);
      setActivities(activityData);

      if (isEdit) {
        const contentResponse = await axios.get(
          `${API_URL}/api/magazine-content/${contentId}`
        );

        const content = contentResponse.data?.data;

        if (!content) {
          throw new Error("Magazine content not found.");
        }

        if (content.status === "published") {
          throw new Error(
            "Published magazine content cannot be edited."
          );
        }

        setSubmitterRole(
          String(content.submittedBy?.role || "").toLowerCase()
        );

        setPostType(content.contentType || "activity");

        setForm({
          title: content.title || "",
          activity:
            content.activity?._id || content.activity || "",
          department: normalizeDepartment(content.department),
          eventDate: content.eventDate
            ? String(content.eventDate).slice(0, 10)
            : "",
          description: content.description || "",
          facultyName: content.faculty?.name || "",
          designation: content.faculty?.designation || "",
          originalWork: true,
        });

        setSavedEventPhoto(content.eventPhoto || "");
        setEventPhotoPreview(content.eventPhoto || "");
        setFacultyPhotoPreview(content.faculty?.photo || "");

        return;
      }

      /* ---------------------------------------------
         NEW SUBMISSION: PRE-FILL FROM THE ACCOUNT
         AND FROM THE LAST SUBMISSION
      --------------------------------------------- */

      const myResponse = await axios.get(
        `${API_URL}/api/magazine-content/my`
      );

      const lastDesignation =
        (myResponse.data?.data || []).find(
          (item) => item.faculty?.designation
        )?.faculty.designation || "";

      setForm((previous) => ({
        ...previous,
        department:
          userData.role === "mag_coordinator"
            ? INSTITUTE_DEPARTMENT
            : normalizeDepartment(userData.department),
        facultyName: userData.name || "",
        designation: lastDesignation,
      }));
    } catch (error) {
      console.error("Submission form load error:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to Load",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to load the magazine submission page.",
        confirmButtonColor: "#d4a017",
      });

      router.replace(backHref);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     DERIVED VALUES
  ========================================================= */

  const typeActivities = activities.filter(
    (activity) => (activity.type || "activity") === postType
  );

  const selectedActivity = activities.find(
    (activity) => activity._id === form.activity
  );

  const isCreative = postType === "creative";

  const imageRequired =
    !isCreative || selectedActivity?.imageRequired !== false;

  const isInstitute =
    form.department === INSTITUTE_DEPARTMENT;

  // Faculty details belong only to content submitted by faculty
  const showFaculty = !isEdit || submitterRole !== "student";

  const facultyRequired = !isEdit || submitterRole === "staff";

  const userRole = String(mongoUser?.role || "").toLowerCase();

  const publishesDirectly =
    userRole === "admin" ||
    (userRole === "mag_coordinator" && isInstitute) ||
    (userRole === "hod" &&
      Boolean(form.department) &&
      normalizeDepartment(mongoUser?.department) ===
        form.department);

  const approverLabel = isInstitute
    ? "Magazine Coordinator"
    : `HOD of ${getDepartmentLabel(form.department)}`;

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePostTypeChange = (type) => {
    setPostType(type);

    setForm((previous) => ({
      ...previous,
      activity: "",
    }));
  };

  /* =========================================================
     PHOTOS
  ========================================================= */

  const pickImage = (e, setFile, setPreview) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid File",
        text: "Please select an image file.",
        confirmButtonColor: "#d4a017",
      });

      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      Swal.fire({
        icon: "warning",
        title: "File Too Large",
        text: "The image must be smaller than 10 MB.",
        confirmButtonColor: "#d4a017",
      });

      e.target.value = "";
      return;
    }

    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* =========================================================
     VALIDATE
  ========================================================= */

  const validateForm = () => {
    if (!form.activity) {
      return isCreative
        ? "Please select a category."
        : "Please select an activity.";
    }

    if (!form.title.trim()) {
      return "Please enter the title.";
    }

    if (!form.department) {
      return "Please select where this should be published.";
    }

    if (!isCreative && !form.eventDate) {
      return "Please select the event date.";
    }

    if (!form.description.trim()) {
      return isCreative
        ? "Please enter your write-up."
        : "Please enter the activity description.";
    }

    if (imageRequired && !eventPhotoPreview) {
      return isCreative
        ? "Please upload the image."
        : "Please upload an event photo.";
    }

    if (showFaculty && facultyRequired) {
      if (!form.facultyName.trim()) {
        return "Please enter your name.";
      }

      if (!form.designation.trim()) {
        return "Please enter your designation.";
      }
    }

    if (isCreative && !isEdit && !form.originalWork) {
      return "Please confirm that this is your own original work.";
    }

    return null;
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: validationError,
        confirmButtonColor: "#d4a017",
      });
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("activity", form.activity);

      formData.append(
        "level",
        isInstitute ? "institute" : "department"
      );

      formData.append("department", form.department);

      if (!isCreative) {
        formData.append("eventDate", form.eventDate);
      }

      formData.append("description", form.description.trim());

      if (isCreative) {
        formData.append("originalWork", "true");
      }

      if (showFaculty) {
        formData.append("facultyName", form.facultyName.trim());
        formData.append("designation", form.designation.trim());

        if (facultyPhoto) {
          formData.append("facultyPhoto", facultyPhoto);
        }
      }

      if (eventPhoto) {
        formData.append("eventPhoto", eventPhoto);
      }

      const response = isEdit
        ? await axios.put(
            `${API_URL}/api/magazine-content/${contentId}`,
            formData
          )
        : await axios.post(
            `${API_URL}/api/magazine-content`,
            formData
          );

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Updated" : "Submitted",
        text:
          response.data?.message ||
          "Magazine content saved successfully.",
        confirmButtonColor: "#d4a017",
      });

      router.push(backHref);
    } catch (error) {
      console.error("Submission form save error:", error);

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text:
          error.response?.data?.message ||
          "Unable to save the magazine content.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading magazine submission...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {isEdit ? "Edit Submission" : "New Submission"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Share a college activity, or your own article, poem or artwork.
        </p>
      </div>

      {form.department && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <Newspaper className="h-5 w-5 text-amber-700" />
            </div>

            <p className="text-sm leading-6 text-amber-800">
              {publishesDirectly
                ? "You are the approver for this content, so it does not need approval from another user."
                : `This submission is reviewed by the ${approverLabel} before it appears in the magazine.`}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-800">
              Content Details
            </h2>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* =================================================
                POST TYPE
            ================================================= */}

            <div>
              <label className={labelClass}>
                What are you submitting?
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "activity",
                    title: "College Activity",
                    text: "An event, visit, workshop or achievement.",
                  },
                  {
                    value: "creative",
                    title: "My Own Work",
                    text: "An article, poem, story, drawing or photograph.",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handlePostTypeChange(option.value)
                    }
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      postType === option.value
                        ? "border-amber-500 bg-amber-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {option.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {option.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* =================================================
                ACTIVITY / CATEGORY + DATE
            ================================================= */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {isCreative ? "Category" : "Activity"}
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  name="activity"
                  value={form.activity}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">
                    {isCreative
                      ? "Select Category"
                      : "Select Activity"}
                  </option>

                  {typeActivities.map((activity) => (
                    <option
                      key={activity._id}
                      value={activity._id}
                    >
                      {activity.name}
                    </option>
                  ))}
                </select>

                {typeActivities.length === 0 && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Nothing is available here yet. Please ask the
                    administrator to add one.
                  </p>
                )}
              </div>

              {!isCreative && (
                <div>
                  <label className={labelClass}>
                    Event Date
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="date"
                      name="eventDate"
                      value={form.eventDate}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                TITLE
            ================================================= */}

            <div>
              <label className={labelClass}>
                Title
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={
                  isCreative
                    ? "Title of your work"
                    : "Example: Industrial Visit to ABC Industries"
                }
                className={inputClass}
              />
            </div>

            {/* =================================================
                DEPARTMENT
            ================================================= */}

            <div>
              <label className={labelClass}>
                Publish Under
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Department</option>

                {DEPARTMENTS.map((department) => (
                  <option
                    key={department.value}
                    value={department.value}
                  >
                    {department.value === INSTITUTE_DEPARTMENT
                      ? "Institute Level (whole college)"
                      : department.label}
                  </option>
                ))}
              </select>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div>
              <label className={labelClass}>
                {isCreative ? "Write-up" : "Description"}
                <span className="ml-1 text-red-500">*</span>
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={isCreative ? 12 : 7}
                placeholder={
                  isCreative
                    ? "Type your article, poem or story here. For a drawing or photograph, write a short note about it."
                    : "Describe the activity, purpose, participants, important highlights and outcomes..."
                }
                className={`${inputClass} resize-y leading-6`}
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {form.description.length} characters
              </div>
            </div>

            {/* =================================================
                EVENT PHOTO / IMAGE
            ================================================= */}

            <div>
              <label className={labelClass}>
                {isCreative ? "Image" : "Event Photo"}

                {imageRequired ? (
                  <span className="ml-1 text-red-500">*</span>
                ) : (
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                )}
              </label>

              {!eventPhotoPreview ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center transition hover:border-amber-400 hover:bg-amber-50">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                    <ImagePlus className="h-7 w-7 text-amber-700" />
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    Click to upload
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    JPG, JPEG, PNG or WEBP · Maximum 10 MB
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      pickImage(
                        e,
                        setEventPhoto,
                        setEventPhotoPreview
                      )
                    }
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="relative">
                    <img
                      src={eventPhotoPreview}
                      alt="Preview"
                      className="max-h-[450px] w-full object-contain bg-slate-100"
                    />

                    {eventPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setEventPhoto(null);
                          setEventPhotoPreview(savedEventPhoto);
                        }}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md transition hover:bg-red-50 hover:text-red-600"
                        title="Remove photo"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-end border-t border-slate-200 bg-white px-4 py-3">
                    <label className="shrink-0 cursor-pointer">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
                        <Upload className="h-4 w-4" />
                        Change
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          pickImage(
                            e,
                            setEventPhoto,
                            setEventPhotoPreview
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            FACULTY DETAILS
        ===================================================== */}

        {showFaculty && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-slate-800">
                Faculty Details
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Shown with the content in the magazine.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Name
                  {facultyRequired && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                <input
                  type="text"
                  name="facultyName"
                  value={form.facultyName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Designation
                  {facultyRequired && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="Example: Lecturer, Computer Science"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Photo
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <div className="flex items-center gap-4">
                  {facultyPhotoPreview ? (
                    <img
                      src={facultyPhotoPreview}
                      alt="Faculty"
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}

                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
                      <Upload className="h-4 w-4" />
                      {facultyPhotoPreview ? "Change" : "Upload"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        pickImage(
                          e,
                          setFacultyPhoto,
                          setFacultyPhotoPreview
                        )
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            ORIGINAL WORK
        ===================================================== */}

        {isCreative && !isEdit && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <input
              type="checkbox"
              name="originalWork"
              checked={form.originalWork}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />

            <span className="text-sm leading-6 text-slate-700">
              I confirm that this is my own original work and is not
              copied from any other source.
            </span>
          </label>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit
                  ? "Save Changes"
                  : publishesDirectly
                    ? "Publish"
                    : "Submit for Approval"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
