"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CreateMagazineContentPage() {
  const router = useRouter();
const { user, isLoaded } = useUser();
const { getToken } = useAuth();

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [form, setForm] = useState({
    title: "",
    activity: "",
    eventDate: "",
    description: "",

    name: "",
    registerNumber: "",
    department: "",
    semester: "",
    phone: "",

    eventPhoto: null,
    studentPhoto: null,
  });

  const [eventPhotoPreview, setEventPhotoPreview] =
    useState("");

  const [studentPhotoPreview, setStudentPhotoPreview] =
    useState("");


  /*
  =====================================================
  LOAD LOGGED-IN MONGO USER
  =====================================================
  */
useEffect(() => {
  if (!isLoaded) return;

  if (!user) {
    router.replace("/");
    return;
  }

  loadUser();
  loadActivities();
}, [isLoaded, user]);


 const loadUser = async () => {
  try {
    setLoadingUser(true);

    const token = await getToken();

    if (!token) {
      throw new Error(
        "Authentication token not available."
      );
    }

    const response = await axios.get(
      `${API_URL}/api/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Unable to load user."
      );
    }

    const mongoUser = response.data.data;

    /*
    -----------------------------------------------
    ONLY STUDENTS CAN ACCESS THIS PAGE
    -----------------------------------------------
    */

    if (mongoUser.role !== "student") {
      await Swal.fire({
        icon: "warning",
        title: "Access Denied",
        text: "This page is only available for students.",
        confirmButtonColor: "#d4a017",
      });

      router.replace("/");
      return;
    }

    setUserData(mongoUser);

    /*
    -----------------------------------------------
    PRE-FILL DETAILS AVAILABLE IN USER
    -----------------------------------------------
    */

    setForm((prev) => ({
      ...prev,
      name: mongoUser.name || "",
      phone: mongoUser.phone || "",
    }));
  } catch (error) {
    console.error(
      "LOAD USER ERROR:",
      error
    );

    await Swal.fire({
      icon: "error",
      title: "Unable to load profile",
      text:
        error.response?.data?.message ||
        error.message ||
        "Please try again.",
      confirmButtonColor: "#d4a017",
    });
  } finally {
    setLoadingUser(false);
  }
};


  /*
  =====================================================
  LOAD ACTIVITIES
  =====================================================
  */

  const loadActivities = async () => {
    try {
      setLoadingActivities(true);

      const response = await axios.get(
        `${API_URL}/api/activities/active`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to load activities."
        );
      }

      setActivities(response.data.data || []);
    } catch (error) {
      console.error(
        "LOAD ACTIVITIES ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load activities",
        text:
          error.response?.data?.message ||
          error.message ||
          "Please refresh the page.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setLoadingActivities(false);
    }
  };


  /*
  =====================================================
  INPUT CHANGE
  =====================================================
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  /*
  =====================================================
  EVENT PHOTO
  =====================================================
  */

  const handleEventPhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setForm((prev) => ({
        ...prev,
        eventPhoto: null,
      }));

      setEventPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid file",
        text: "Please select an image file.",
        confirmButtonColor: "#d4a017",
      });

      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Image too large",
        text: "Maximum image size is 10 MB.",
        confirmButtonColor: "#d4a017",
      });

      e.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      eventPhoto: file,
    }));

    setEventPhotoPreview(
      URL.createObjectURL(file)
    );
  };


  /*
  =====================================================
  STUDENT PHOTO
  =====================================================
  */

  const handleStudentPhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setForm((prev) => ({
        ...prev,
        studentPhoto: null,
      }));

      setStudentPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid file",
        text: "Please select an image file.",
        confirmButtonColor: "#d4a017",
      });

      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Image too large",
        text: "Maximum image size is 10 MB.",
        confirmButtonColor: "#d4a017",
      });

      e.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      studentPhoto: file,
    }));

    setStudentPhotoPreview(
      URL.createObjectURL(file)
    );
  };


  /*
  =====================================================
  REMOVE EVENT PHOTO
  =====================================================
  */

  const removeEventPhoto = () => {
    setForm((prev) => ({
      ...prev,
      eventPhoto: null,
    }));

    setEventPhotoPreview("");

    const input =
      document.getElementById("eventPhoto");

    if (input) {
      input.value = "";
    }
  };


  /*
  =====================================================
  REMOVE STUDENT PHOTO
  =====================================================
  */

  const removeStudentPhoto = () => {
    setForm((prev) => ({
      ...prev,
      studentPhoto: null,
    }));

    setStudentPhotoPreview("");

    const input =
      document.getElementById("studentPhoto");

    if (input) {
      input.value = "";
    }
  };


  /*
  =====================================================
  VALIDATE
  =====================================================
  */

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Please enter the magazine content title.";
    }

    if (!form.activity) {
      return "Please select an activity.";
    }

    if (!form.eventDate) {
      return "Please select the event date.";
    }

    if (!form.description.trim()) {
      return "Please enter a description.";
    }

    if (!form.name.trim()) {
      return "Please enter the student name.";
    }

    if (!form.registerNumber.trim()) {
      return "Please enter the register number.";
    }

    if (!form.department.trim()) {
      return "Please enter the department.";
    }

    if (!form.semester) {
      return "Please select the semester.";
    }

    if (!form.phone.trim()) {
      return "Please enter the phone number.";
    }

    if (!form.studentPhoto) {
      return "Please upload the student photo.";
    }

    if (!form.eventPhoto) {
      return "Please upload the event photo.";
    }

    return null;
  };


  /*
  =====================================================
  SUBMIT
  =====================================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userData?._id) {
      Swal.fire({
        icon: "error",
        title: "User information unavailable",
        text: "Please refresh the page and try again.",
        confirmButtonColor: "#d4a017",
      });

      return;
    }

    const validationError =
      validateForm();

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
      setSubmitting(true);

      const formData = new FormData();

      /*
      -----------------------------------------------
      USER
      -----------------------------------------------
      */

      formData.append(
        "userId",
        userData._id
      );

      /*
      -----------------------------------------------
      MAGAZINE CONTENT
      -----------------------------------------------
      */

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

      /*
      -----------------------------------------------
      STUDENT DETAILS
      -----------------------------------------------
      */

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
        form.department.trim()
      );

      formData.append(
        "semester",
        form.semester
      );

      formData.append(
        "phone",
        form.phone.trim()
      );

      /*
      -----------------------------------------------
      TWO IMAGES
      -----------------------------------------------
      */

      formData.append(
        "studentPhoto",
        form.studentPhoto
      );

      formData.append(
        "eventPhoto",
        form.eventPhoto
      );

      const response = await axios.post(
        `${API_URL}/api/magazine-content`,
        formData
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to submit magazine content."
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Submitted Successfully",
        text:
          response.data.message ||
          "Your magazine content has been submitted for approval.",
        confirmButtonColor: "#d4a017",
      });

      /*
      -----------------------------------------------
      CLEAR FORM
      -----------------------------------------------
      */

      setForm({
        title: "",
        activity: "",
        eventDate: "",
        description: "",

        name: userData.name || "",
        registerNumber: "",
        department: "",
        semester: "",
        phone: userData.phone || "",

        eventPhoto: null,
        studentPhoto: null,
      });

      setEventPhotoPreview("");
      setStudentPhotoPreview("");

      document
        .getElementById("eventPhoto")
        ?.value && 
        (document.getElementById("eventPhoto").value = "");

      document
        .getElementById("studentPhoto")
        ?.value &&
        (document.getElementById("studentPhoto").value = "");

      router.push("/student/magazine");
    } catch (error) {
      console.error(
        "SUBMIT MAGAZINE CONTENT ERROR:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to submit magazine content.",
        confirmButtonColor: "#d4a017",
      });
    } finally {
      setSubmitting(false);
    }
  };


  /*
  =====================================================
  LOADING
  =====================================================
  */

  if (
    !isLoaded ||
    loadingUser
  ) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading...
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
  
    

    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() =>
              router.push("/student/magazine")
            }
            className="mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            ← Back to Dashboard
          </button>

          <div>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Submit Magazine Content
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Share an activity or event for the college eMagazine.
            </p>
          </div>
        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              CONTENT DETAILS
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Activity Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the details of the activity or event.
              </p>
            </div>


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* TITLE */}

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
                  onChange={handleChange}
                  placeholder="Example: Industrial Visit to Infosys"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />
              </div>


              {/* ACTIVITY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Activity
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <select
                  name="activity"
                  value={form.activity}
                  onChange={handleChange}
                  disabled={loadingActivities}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingActivities
                      ? "Loading activities..."
                      : "Select activity"}
                  </option>

                  {activities.map(
                    (activity) => (
                      <option
                        key={activity._id}
                        value={activity._id}
                      >
                        {activity.name}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* EVENT DATE */}

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
                  value={form.eventDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />
              </div>


              {/* DESCRIPTION */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Describe the activity, what happened, important highlights, participation, outcome, etc."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />
              </div>

            </div>
          </section>


          {/* =================================================
              STUDENT DETAILS
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Student Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                These details will be stored with the magazine article.
              </p>
            </div>


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student Name
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Student name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />
              </div>


              {/* REGISTER NUMBER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Register Number
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="text"
                  name="registerNumber"
                  value={form.registerNumber}
                  onChange={handleChange}
                  placeholder="Example: 103CS26001"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />
              </div>


              {/* DEPARTMENT */}
<div>
  <label className="mb-2 block text-sm font-medium text-slate-700">
    Department
    <span className="text-red-500">
      {" "}*
    </span>
  </label>

  <select
    name="department"
    value={form.department}
    onChange={handleChange}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
  >
    <option value="">
      Select department
    </option>

    <option value="AT">
      Automobile Engineering
    </option>

    <option value="CH">
      Chemical Engineering
    </option>

    <option value="CE">
      Civil Engineering
    </option>

    <option value="CS">
      Computer Science & Engineering
    </option>

    <option value="EC">
      Electronics & Communication Engineering
    </option>

    <option value="EE">
      Electrical & Electronics Engineering
    </option>

    <option value="IN">
      Institute
    </option>

    <option value="ME">
      Mechanical Engineering
    </option>

    <option value="PS">
      Polymer Technology
    </option>

    <option value="SC">
      Science and Humanities
    </option>
  </select>
</div>


              {/* SEMESTER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Semester
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <select
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                >
                  <option value="">
                    Select semester
                  </option>

                  <option value="1">
                    1st Semester
                  </option>

                  <option value="2">
                    2nd Semester
                  </option>

                  <option value="3">
                    3rd Semester
                  </option>

                  <option value="4">
                    4th Semester
                  </option>

                  <option value="5">
                    5th Semester
                  </option>

                  <option value="6">
                    6th Semester
                  </option>
                </select>
              </div>


              {/* PHONE */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone Number
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20"
                />
              </div>

            </div>
          </section>


          {/* =================================================
              PHOTOS
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Photos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Upload the student photograph and the event photograph.
                Maximum 10 MB per image.
              </p>
            </div>


            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* STUDENT PHOTO */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student Photo
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-[#d4a017] hover:bg-[#d4a017]/5">

                  {studentPhotoPreview ? (
                    <img
                      src={studentPhotoPreview}
                      alt="Student preview"
                      className="h-44 w-44 rounded-xl object-cover shadow-sm"
                    />
                  ) : (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d4a017]/10 text-[#a67c00]">
                        📷
                      </div>

                      <p className="text-sm font-medium text-slate-700">
                        Click to upload student photo
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        JPG, PNG or WEBP
                      </p>
                    </>
                  )}

                  <input
                    id="studentPhoto"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleStudentPhotoChange
                    }
                    className="hidden"
                  />
                </label>

                {studentPhotoPreview && (
                  <button
                    type="button"
                    onClick={
                      removeStudentPhoto
                    }
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove photo
                  </button>
                )}
              </div>


              {/* EVENT PHOTO */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Event Photo
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-[#d4a017] hover:bg-[#d4a017]/5">

                  {eventPhotoPreview ? (
                    <img
                      src={eventPhotoPreview}
                      alt="Event preview"
                      className="h-44 w-full rounded-xl object-cover shadow-sm"
                    />
                  ) : (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d4a017]/10 text-[#a67c00]">
                        📷
                      </div>

                      <p className="text-sm font-medium text-slate-700">
                        Click to upload event photo
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        JPG, PNG or WEBP
                      </p>
                    </>
                  )}

                  <input
                    id="eventPhoto"
                    type="file"
                    accept="image/*"
                    onChange={
                      handleEventPhotoChange
                    }
                    className="hidden"
                  />
                </label>

                {eventPhotoPreview && (
                  <button
                    type="button"
                    onClick={
                      removeEventPhoto
                    }
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove photo
                  </button>
                )}
              </div>

            </div>
          </section>


          {/* =================================================
              INFORMATION
          ================================================= */}

          <div className="rounded-2xl border border-[#d4a017]/30 bg-[#d4a017]/5 p-4">
            <div className="flex gap-3">
              <div className="text-lg">
                ℹ️
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Submission process
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  After submission, the content will be sent to the
                  concerned HOD for approval before it is published
                  in the eMagazine.
                </p>
              </div>
            </div>
          </div>


          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push("/student")
              }
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingActivities
              }
              className="rounded-xl bg-[#d4a017] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b88a00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting..."
                : "Submit Magazine Content"}
            </button>

          </div>

        </form>
      </div>
    </div>
  
  );
}