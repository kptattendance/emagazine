"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth, useUser } from "@clerk/nextjs";

import {
  ArrowLeft,
  CalendarDays,
  ImagePlus,
  Loader2,
  Newspaper,
  Save,
  Upload,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HODMagazineCreatePage() {
  const router = useRouter();

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mongoUser, setMongoUser] = useState(null);
  const [activities, setActivities] = useState([]);

  const [form, setForm] = useState({
    title: "",
    activity: "",
    eventDate: "",
    description: "",
  });

  const [eventPhoto, setEventPhoto] = useState(null);
  const [eventPhotoPreview, setEventPhotoPreview] = useState("");

  /* =========================================================
     LOAD USER + ACTIVITIES
  ========================================================= */

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      router.replace("/");
      return;
    }

    loadPage();
  }, [isLoaded, isSignedIn, user]);

  const loadPage = async () => {
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

      /* ---------------------------------------------
         GET MONGO USER
      --------------------------------------------- */

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
          text: "Only HOD users can create department magazine content.",
          confirmButtonColor: "#d4a017",
        });

        router.replace("/");
        return;
      }

      setMongoUser(userData);

      /* ---------------------------------------------
         GET ACTIVE ACTIVITIES
      --------------------------------------------- */

      const activityResponse = await axios.get(
        `${API_URL}/api/activities/active`,
        { headers }
      );

      const activityData =
        activityResponse.data?.data ||
        activityResponse.data?.activities ||
        activityResponse.data ||
        [];

      setActivities(Array.isArray(activityData) ? activityData : []);
    } catch (error) {
      console.error("HOD magazine create load error:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to Load",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to load the magazine submission page.",
        confirmButtonColor: "#d4a017",
      });

      router.replace("/hod");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     PHOTO
  ========================================================= */

  const handlePhotoChange = (e) => {
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

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "File Too Large",
        text: "The image must be smaller than 10 MB.",
        confirmButtonColor: "#d4a017",
      });

      e.target.value = "";
      return;
    }

    setEventPhoto(file);
    setEventPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setEventPhoto(null);
    setEventPhotoPreview("");
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Title Required",
        text: "Please enter the magazine title.",
        confirmButtonColor: "#d4a017",
      });
      return;
    }

    if (!form.activity) {
      Swal.fire({
        icon: "warning",
        title: "Activity Required",
        text: "Please select an activity.",
        confirmButtonColor: "#d4a017",
      });
      return;
    }

    if (!form.eventDate) {
      Swal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select the event date.",
        confirmButtonColor: "#d4a017",
      });
      return;
    }

    if (!form.description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Description Required",
        text: "Please enter the activity description.",
        confirmButtonColor: "#d4a017",
      });
      return;
    }

    if (!eventPhoto) {
      Swal.fire({
        icon: "warning",
        title: "Photo Required",
        text: "Please upload an event photo.",
        confirmButtonColor: "#d4a017",
      });
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not available.");
      }

      const formData = new FormData();

      /* ---------------------------------------------
         BASIC CONTENT
      --------------------------------------------- */

      formData.append("userId", mongoUser._id);
      formData.append("title", form.title.trim());
      formData.append("activity", form.activity);

      /*
       HOD CONTENT IS DEPARTMENT LEVEL
      */
      formData.append("level", "department");

      /*
       Department comes automatically from HOD's
       MongoDB user record if available.
      */
      formData.append(
        "department",
        mongoUser.department || ""
      );

      formData.append("eventDate", form.eventDate);
      formData.append(
        "description",
        form.description.trim()
      );

      /*
       HOD does not need student details.
      */

      formData.append("eventPhoto", eventPhoto);

      const response = await axios.post(
        `${API_URL}/api/magazine-content`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );


      await Swal.fire({
        icon: "success",
        title: "Published Successfully",
        text: "The magazine content has been published successfully.",
        confirmButtonColor: "#d4a017",
      });

      router.push("/hod/magazine");
      router.refresh();
    } catch (error) {
      console.error("HOD magazine create error:", error);

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text:
          error.response?.data?.message ||
          "Unable to publish the magazine content.",
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
  

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <Newspaper className="h-5 w-5 text-amber-700" />
          </div>

          <div>
            <p className="font-semibold text-amber-900">
              HOD Magazine Publication
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Content submitted by the HOD is published directly and does
              not require approval from another user.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* =================================================
              FORM HEADER
          ================================================= */}

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-800">
              Activity Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Enter the details of the department activity.
            </p>
          </div>

          {/* =================================================
              FORM BODY
          ================================================= */}

          <div className="space-y-6 p-5 sm:p-6">
            {/* =================================================
                TITLE
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Magazine Title
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: Industrial Visit to ABC Industries"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* =================================================
                ACTIVITY + DATE
            ================================================= */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Activity
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  name="activity"
                  value={form.activity}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">
                    Select Activity
                  </option>

                  {activities.map((activity) => (
                    <option
                      key={activity._id}
                      value={activity._id}
                    >
                      {activity.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                DEPARTMENT
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Department
              </label>

              <input
                type="text"
                value={mongoUser?.department || "Department"}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Department is taken from the logged-in HOD account.
              </p>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
                <span className="ml-1 text-red-500">*</span>
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={7}
                placeholder="Describe the activity, purpose, participants, important highlights and outcomes..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />

              <div className="mt-1 text-right text-xs text-slate-400">
                {form.description.length} characters
              </div>
            </div>

            {/* =================================================
                EVENT PHOTO
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Event Photo
                <span className="ml-1 text-red-500">*</span>
              </label>

              {!eventPhotoPreview ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center transition hover:border-amber-400 hover:bg-amber-50">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                    <ImagePlus className="h-7 w-7 text-amber-700" />
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    Click to upload event photo
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    JPG, JPEG, PNG or WEBP · Maximum 10 MB
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="relative">
                    <img
                      src={eventPhotoPreview}
                      alt="Event preview"
                      className="max-h-[450px] w-full object-contain bg-slate-100"
                    />

                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md transition hover:bg-red-50 hover:text-red-600"
                      title="Remove photo"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {eventPhoto?.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {eventPhoto
                          ? `${(
                              eventPhoto.size /
                              (1024 * 1024)
                            ).toFixed(2)} MB`
                          : ""}
                      </p>
                    </div>

                    <label className="shrink-0 cursor-pointer">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
                        <Upload className="h-4 w-4" />
                        Change
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={() => router.push("/hod/magazine")}
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
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Publish Magazine
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}