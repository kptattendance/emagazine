"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function EditMagazineContentPage() {
  const router = useRouter();
  const params = useParams();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const [user, setUser] =
    useState(null);

  const [activities, setActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState({
      title: "",
      activity: "",
      eventDate: "",
      description: "",
      department: "",

      name: "",
      registerNumber: "",
      studentDepartment: "",
      semester: "",
      phone: "",

      studentPhoto: null,
      eventPhoto: null,
    });

  const [oldStudentPhoto, setOldStudentPhoto] =
    useState("");

  const [oldEventPhoto, setOldEventPhoto] =
    useState("");

  const [studentPreview, setStudentPreview] =
    useState("");

  const [eventPreview, setEventPreview] =
    useState("");


  /*
  =====================================================
  LOAD
  =====================================================
  */

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    loadData();
  }, [
    isLoaded,
    isSignedIn,
    params?.id,
  ]);


  /*
  =====================================================
  LOAD DATA
  =====================================================
  */

  const loadData = async () => {
    try {
      setLoading(true);

      const token =
        await getToken();

      const userResponse =
        await axios.get(
          `${API_URL}/api/users/me`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const mongoUser =
        userResponse.data?.data;

      if (
        mongoUser?.role !==
        "student"
      ) {
        router.replace("/");
        return;
      }

      setUser(mongoUser);


      const response =
        await axios.get(
          `${API_URL}/api/magazine-content/${params.id}`
        );

      const content =
        response.data?.data;

      if (!content) {
        throw new Error(
          "Content not found."
        );
      }


      if (
        ![
          "pending",
          "rejected",
        ].includes(
          content.status
        )
      ) {
        await Swal.fire({
          icon: "info",
          title:
            "Content cannot be edited",
          text:
            "Published content cannot be edited.",
          confirmButtonColor:
            "#d4a017",
        });

        router.push(
          "/student/magazine"
        );

        return;
      }


      /*
      -----------------------------------------------
      SECURITY CHECK
      -----------------------------------------------
      */

      if (
        content.submittedBy?.email !==
        mongoUser.email
      ) {
        await Swal.fire({
          icon: "error",
          title: "Access denied",
          text:
            "This content does not belong to your account.",
          confirmButtonColor:
            "#d4a017",
        });

        router.push(
          "/student/magazine"
        );

        return;
      }


      setForm({
        title:
          content.title || "",

        activity:
          content.activity?._id || "",

        eventDate:
          content.eventDate
            ? new Date(
                content.eventDate
              )
                .toISOString()
                .split("T")[0]
            : "",

        description:
          content.description || "",

        department:
          content.department || "",

        name:
          content.student?.name ||
          "",

        registerNumber:
          content.student
            ?.registerNumber || "",

        studentDepartment:
          content.student
            ?.department || "",

        semester:
          content.student
            ?.semester || "",

        phone:
          content.student?.phone ||
          "",

        studentPhoto: null,
        eventPhoto: null,
      });


      setOldStudentPhoto(
        content.student?.photo ||
          ""
      );

      setOldEventPhoto(
        content.eventPhoto ||
          ""
      );


      /*
      -----------------------------------------------
      ACTIVITIES
      -----------------------------------------------
      */

      const activityResponse =
        await axios.get(
          `${API_URL}/api/activities/active`
        );

      setActivities(
        activityResponse.data?.data ||
          []
      );
    } catch (error) {
      console.error(
        "LOAD EDIT PAGE ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load content",
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


  /*
  =====================================================
  INPUT
  =====================================================
  */

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  /*
  =====================================================
  STUDENT PHOTO
  =====================================================
  */

  const handleStudentPhoto =
    (e) => {
      const file =
        e.target.files?.[0];

      if (!file) return;

      setForm((prev) => ({
        ...prev,
        studentPhoto: file,
      }));

      setStudentPreview(
        URL.createObjectURL(file)
      );
    };


  /*
  =====================================================
  EVENT PHOTO
  =====================================================
  */

  const handleEventPhoto =
    (e) => {
      const file =
        e.target.files?.[0];

      if (!file) return;

      setForm((prev) => ({
        ...prev,
        eventPhoto: file,
      }));

      setEventPreview(
        URL.createObjectURL(file)
      );
    };


  /*
  =====================================================
  SUBMIT
  =====================================================
  */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData =
        new FormData();

      formData.append(
        "userId",
        user._id
      );

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "activity",
        form.activity
      );

      formData.append(
        "level",
        "department"
      );

      formData.append(
        "department",
        form.department.trim()
      );

      formData.append(
        "eventDate",
        form.eventDate
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "studentName",
        form.name.trim()
      );

      formData.append(
        "registerNumber",
        form.registerNumber
          .trim()
          .toUpperCase()
      );

      formData.append(
        "studentDepartment",
        form.studentDepartment.trim()
      );

      formData.append(
        "semester",
        form.semester
      );

      formData.append(
        "phone",
        form.phone.trim()
      );


      if (form.studentPhoto) {
        formData.append(
          "studentPhoto",
          form.studentPhoto
        );
      }

      if (form.eventPhoto) {
        formData.append(
          "eventPhoto",
          form.eventPhoto
        );
      }


      const response =
        await axios.put(
          `${API_URL}/api/magazine-content/${params.id}`,
          formData
        );


      await Swal.fire({
        icon: "success",
        title: "Updated",
        text:
          response.data?.message ||
          "Magazine content updated successfully.",
        confirmButtonColor:
          "#d4a017",
      });


      router.push(
        "/student/magazine"
      );
    } catch (error) {
      console.error(
        "UPDATE CONTENT ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Update failed",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to update content.",
        confirmButtonColor:
          "#d4a017",
      });
    } finally {
      setSaving(false);
    }
  };


  if (
    !isLoaded ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-4xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/student/magazine"
            )
          }
          className="mb-5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back to My Submissions
        </button>


        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h1 className="text-2xl font-bold text-slate-800">
            Edit Magazine Content
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Make the required changes and submit again.
          </p>


          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Title
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>


            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Activity
                </label>

                <select
                  name="activity"
                  value={
                    form.activity
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">
                    Select activity
                  </option>

                  {activities.map(
                    (item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>
              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Event Date
                </label>

                <input
                  type="date"
                  name="eventDate"
                  value={
                    form.eventDate
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

            </div>


            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>

              <textarea
                name="description"
                rows={6}
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />
            </div>


            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Student Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Register Number
                </label>

                <input
                  name="registerNumber"
                  value={
                    form.registerNumber
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Department
                </label>

                <input
                  name="studentDepartment"
                  value={
                    form.studentDepartment
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Semester
                </label>

                <select
                  name="semester"
                  value={
                    form.semester
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                >
                  <option value="">
                    Select semester
                  </option>

                  {[1, 2, 3, 4, 5, 6].map(
                    (sem) => (
                      <option
                        key={sem}
                        value={sem}
                      >
                        {sem}{" "}
                        {sem === 1
                          ? "st"
                          : sem === 2
                          ? "nd"
                          : sem === 3
                          ? "rd"
                          : "th"}{" "}
                        Semester
                      </option>
                    )
                  )}
                </select>
              </div>


              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">
                  Phone
                </label>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

            </div>


            {/* PHOTOS */}

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Student Photo
                </label>

                {studentPreview ||
                oldStudentPhoto ? (
                  <img
                    src={
                      studentPreview ||
                      oldStudentPhoto
                    }
                    alt="Student"
                    className="mb-3 h-40 w-40 rounded-xl object-cover"
                  />
                ) : null}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleStudentPhoto
                  }
                  className="w-full text-sm"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Event Photo
                </label>

                {eventPreview ||
                oldEventPhoto ? (
                  <img
                    src={
                      eventPreview ||
                      oldEventPhoto
                    }
                    alt="Event"
                    className="mb-3 h-40 w-full rounded-xl object-cover"
                  />
                ) : null}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleEventPhoto
                  }
                  className="w-full text-sm"
                />
              </div>

            </div>


            <div className="flex justify-end gap-3 pt-4">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/student/magazine"
                  )
                }
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#d4a017] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b88a00] disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}