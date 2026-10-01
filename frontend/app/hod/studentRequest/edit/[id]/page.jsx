"use client";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  Save,
  Upload,
  X,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { useAuth } from "@clerk/nextjs";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

const DEPARTMENTS = [
  {
    code: "AE",
    name: "Automobile Engineering",
  },
  {
    code: "CE",
    name: "Civil Engineering",
  },
  {
    code: "ME",
    name: "Mechanical Engineering",
  },
  {
    code: "EE",
    name: "Electrical & Electronics Engineering",
  },
  {
    code: "CH",
    name: "Chemical Engineering",
  },
  {
    code: "PT",
    name: "Polymer Technology",
  },
  {
    code: "EC",
    name: "Electronics & Communication Engineering",
  },
  {
    code: "CS",
    name: "Computer Science & Engineering",
  },
  {
    code: "SC",
    name: "Science",
  },
  {
    code: "IN",
    name: "Institute",
  },
];

export default function HODStudentRequestEditPage() {
  const router = useRouter();

  const params = useParams();

  const contentId =
    params?.id;

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

  const [loadingActivities, setLoadingActivities] =
    useState(true);

  const [form, setForm] =
    useState({
      title: "",
      activity: "",
      level: "department",
      department: "",
      eventDate: "",
      description: "",

      studentName: "",
      registerNumber: "",
      studentDepartment: "",
      semester: "",
      phone: "",

      studentPhoto: null,
      eventPhoto: null,
    });

  const [studentPhotoPreview, setStudentPhotoPreview] =
    useState("");

  const [eventPhotoPreview, setEventPhotoPreview] =
    useState("");

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    if (!contentId) {
      return;
    }

    loadPage();
  }, [
    isLoaded,
    isSignedIn,
    contentId,
  ]);

  const loadPage = async () => {
    try {
      setLoading(true);

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

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
        !mongoUser ||
        mongoUser.role !== "hod"
      ) {
        await Swal.fire({
          icon: "error",
          title: "Access Denied",
          text:
            "Only HOD users can edit student magazine requests.",
          confirmButtonColor:
            "#d4a017",
        });

        router.replace("/hod/studentRequest");
        return;
      }

      if (!mongoUser._id) {
        throw new Error(
          "HOD MongoDB user ID is missing."
        );
      }

      if (!mongoUser.department) {
        throw new Error(
          "Department is not assigned to this HOD."
        );
      }

      setUser(mongoUser);

      await Promise.all([
        loadActivities(),
        loadContent(),
      ]);
    } catch (error) {
      console.error(
        "LOAD HOD EDIT PAGE ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title:
          "Unable to load request",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to load the magazine request.",
        confirmButtonColor:
          "#d4a017",
      });

      router.replace("/hod/studentRequest");
    } finally {
      setLoading(false);
    }
  };

  const loadActivities =
    async () => {
      try {
        setLoadingActivities(
          true
        );

        const response =
          await axios.get(
            `${API_URL}/api/activities/active`
          );

        const data =
          response.data?.data ||
          [];

        setActivities(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "LOAD ACTIVITIES ERROR:",
          error
        );

        throw new Error(
          error.response?.data?.message ||
            "Unable to load activities."
        );
      } finally {
        setLoadingActivities(
          false
        );
      }
    };

  const loadContent =
    async () => {
      try {
        const response =
          await axios.get(
            `${API_URL}/api/magazine-content/${contentId}`
          );

        const content =
          response.data?.data;

        if (!content) {
          throw new Error(
            "Magazine content not found."
          );
        }

        if (
          content.status ===
          "published"
        ) {
          throw new Error(
            "Published magazine content cannot be edited."
          );
        }

        setForm({
          title:
            content.title || "",

          activity:
            content.activity?._id ||
            content.activity ||
            "",

          level:
            content.level ||
            "department",

          department:
            content.department ||
            "",

          eventDate:
            content.eventDate
              ? formatDateForInput(
                  content.eventDate
                )
              : "",

          description:
            content.description ||
            "",

          studentName:
            content.student?.name ||
            "",

          registerNumber:
            content.student
              ?.registerNumber ||
            "",

          studentDepartment:
            content.student
              ?.department ||
            content.department ||
            "",

          semester:
            content.student
              ?.semester
              ? String(
                  content.student.semester
                )
              : "",

          phone:
            content.student?.phone ||
            "",

          studentPhoto:
            null,

          eventPhoto:
            null,
        });

        setStudentPhotoPreview(
          content.student?.photo ||
            ""
        );

        setEventPhotoPreview(
          content.eventPhoto ||
            ""
        );
      } catch (error) {
        console.error(
          "LOAD CONTENT ERROR:",
          error
        );

        throw new Error(
          error.response?.data?.message ||
            error.message ||
            "Unable to load magazine content."
        );
      }
    };

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  const handleStudentPhoto =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        Swal.fire({
          icon: "warning",
          title: "Invalid file",
          text:
            "Please select an image file.",
          confirmButtonColor:
            "#d4a017",
        });

        event.target.value =
          "";

        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        Swal.fire({
          icon: "warning",
          title:
            "Image too large",
          text:
            "Maximum image size is 10 MB.",
          confirmButtonColor:
            "#d4a017",
        });

        event.target.value =
          "";

        return;
      }

      setForm(
        (previous) => ({
          ...previous,
          studentPhoto:
            file,
        })
      );

      setStudentPhotoPreview(
        URL.createObjectURL(
          file
        )
      );
    };

  const handleEventPhoto =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        Swal.fire({
          icon: "warning",
          title: "Invalid file",
          text:
            "Please select an image file.",
          confirmButtonColor:
            "#d4a017",
        });

        event.target.value =
          "";

        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        Swal.fire({
          icon: "warning",
          title:
            "Image too large",
          text:
            "Maximum image size is 10 MB.",
          confirmButtonColor:
            "#d4a017",
        });

        event.target.value =
          "";

        return;
      }

      setForm(
        (previous) => ({
          ...previous,
          eventPhoto:
            file,
        })
      );

      setEventPhotoPreview(
        URL.createObjectURL(
          file
        )
      );
    };

  const handleSave =
    async (event) => {
      event.preventDefault();

      if (!user?._id) {
        Swal.fire({
          icon: "error",
          title: "User not found",
          text:
            "HOD user information is missing.",
          confirmButtonColor:
            "#d4a017",
        });

        return;
      }

      if (!contentId) {
        return;
      }

      if (!form.title.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Title required",
          text:
            "Please enter the article title.",
          confirmButtonColor:
            "#d4a017",
        });

        return;
      }

      if (!form.activity) {
        Swal.fire({
          icon: "warning",
          title:
            "Activity required",
          text:
            "Please select an activity.",
          confirmButtonColor:
            "#d4a017",
        });

        return;
      }

      if (!form.department) {
        Swal.fire({
          icon: "warning",
          title:
            "Department required",
          text:
            "Please select a department.",
          confirmButtonColor:
            "#d4a017",
        });

        return;
      }

      if (!form.eventDate) {
        Swal.fire({
          icon: "warning",
          title:
            "Event date required",
          text:
            "Please select the event date.",
          confirmButtonColor:
            "#d4a017",
        });

        return;
      }

      if (
        !form.description.trim()
      ) {
        Swal.fire({
          icon: "warning",
          title:
            "Description required",
          text:
            "Please enter the description.",
          confirmButtonColor:
            "#d4a017",
        });

        return;
      }

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
          form.level
        );

        formData.append(
          "department",
          form.department
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
          form.studentName.trim()
        );

        formData.append(
          "registerNumber",
          form.registerNumber
            .trim()
            .toUpperCase()
        );

        formData.append(
          "studentDepartment",
          form.studentDepartment
        );

        formData.append(
          "semester",
          form.semester
        );

        formData.append(
          "phone",
          form.phone.trim()
        );

        if (
          form.studentPhoto
        ) {
          formData.append(
            "studentPhoto",
            form.studentPhoto
          );
        }

        if (
          form.eventPhoto
        ) {
          formData.append(
            "eventPhoto",
            form.eventPhoto
          );
        }

        const response =
          await axios.patch(
            `${API_URL}/api/magazine-content/${contentId}`,
            formData
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Unable to update magazine content."
          );
        }

        await Swal.fire({
          icon: "success",
          title:
            "Updated Successfully",
          text:
            "The student magazine request has been updated.",
          confirmButtonColor:
            "#d4a017",
        });

        router.push(
          "/hod/studentRequest"
        );
      } catch (error) {
        console.error(
          "UPDATE HOD MAGAZINE ERROR:",
          error
        );

        Swal.fire({
          icon: "error",
          title:
            "Update failed",
          text:
            error.response?.data?.message ||
            error.message ||
            "Unable to update magazine content.",
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
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Loading magazine request...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        <div className="mb-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/hod/studentRequest"
              )
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft
              size={16}
            />
            Back to HOD Magazine
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>

              <h1 className="text-2xl font-bold text-slate-800">
                Edit Student Magazine Request
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review and update the student submission before approval.
              </p>

            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                HOD Department
              </p>

              <p className="mt-1 text-lg font-bold text-amber-800">
                {user?.department}
              </p>

            </div>

          </div>

        </div>

        <form
          onSubmit={
            handleSave
          }
          className="space-y-6"
        >

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-bold text-slate-800">
              Magazine Details
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Activity
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <select
                  name="activity"
                  value={
                    form.activity
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loadingActivities
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 disabled:bg-slate-100"
                >

                  <option value="">
                    {loadingActivities
                      ? "Loading activities..."
                      : "Select activity"}
                  </option>

                  {activities.map(
                    (
                      activity
                    ) => (
                      <option
                        key={
                          activity._id
                        }
                        value={
                          activity._id
                        }
                      >
                        {
                          activity.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Level
                </label>

                <select
                  name="level"
                  value={
                    form.level
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                >

                  <option value="department">
                    Department
                  </option>

                  <option value="institute">
                    Institute
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Department
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <select
                  name="department"
                  value={
                    form.department
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                >

                  <option value="">
                    Select department
                  </option>

                  {DEPARTMENTS.map(
                    (
                      department
                    ) => (
                      <option
                        key={
                          department.code
                        }
                        value={
                          department.code
                        }
                      >
                        {
                          department.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Event Date
                  <span className="text-red-500">
                    {" "}*
                  </span>
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />

              </div>

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={7}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />

              </div>

            </div>

          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-bold text-slate-800">
              Student Details
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student Name
                </label>

                <input
                  type="text"
                  name="studentName"
                  value={
                    form.studentName
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Register Number
                </label>

                <input
                  type="text"
                  name="registerNumber"
                  value={
                    form.registerNumber
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student Department
                </label>

                <select
                  name="studentDepartment"
                  value={
                    form.studentDepartment
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                >

                  <option value="">
                    Select department
                  </option>

                  {DEPARTMENTS.map(
                    (
                      department
                    ) => (
                      <option
                        key={
                          department.code
                        }
                        value={
                          department.code
                        }
                      >
                        {
                          department.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                >

                  <option value="">
                    Select semester
                  </option>

                  {[
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                  ].map(
                    (semester) => (
                      <option
                        key={
                          semester
                        }
                        value={
                          semester
                        }
                      >
                        Semester{" "}
                        {semester}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />

              </div>

            </div>

          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-bold text-slate-800">
              Photos
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student Photo
                </label>

                {studentPhotoPreview && (
                  <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                    <img
                      src={
                        studentPhotoPreview
                      }
                      alt="Student"
                      className="h-64 w-full object-contain"
                    />

                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#d4a017] hover:bg-amber-50">

                  <Upload
                    size={17}
                  />

                  Replace Student Photo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleStudentPhoto
                    }
                    className="hidden"
                  />

                </label>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Event Photo
                </label>

                {eventPhotoPreview && (
                  <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                    <img
                      src={
                        eventPhotoPreview
                      }
                      alt="Event"
                      className="h-64 w-full object-contain"
                    />

                  </div>
                )}

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#d4a017] hover:bg-amber-50">

                  <Upload
                    size={17}
                  />

                  Replace Event Photo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleEventPhoto
                    }
                    className="hidden"
                  />

                </label>

              </div>

            </div>

          </section>

          <div className="flex flex-wrap justify-end gap-3 pb-8">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/hod/studentRequest"
                )
              }
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4a017] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#bd8e0d] disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Save
                size={17}
              />

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

function formatDateForInput(
  value
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


