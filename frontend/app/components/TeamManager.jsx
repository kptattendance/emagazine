"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
  GraduationCap,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import {
  DEPARTMENTS,
  getDepartmentLabel,
} from "../lib/departments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

const labelClass =
  "mb-1.5 block text-sm font-semibold text-slate-700";

const EMPTY_FORM = {
  memberType: "faculty",
  name: "",
  position: "",
  department: "",
  designation: "",
  registerNumber: "",
  semester: "",
  order: 0,
};

/*
============================================================
Add, edit and remove the magazine team shown on the
home page. Used by the admin and the institute HOD.
============================================================
*/

export default function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/api/team`);

      setMembers(response.data?.data || []);
    } catch (error) {
      console.error("LOAD TEAM ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to load the team",
        text:
          error.response?.data?.message ||
          "Please try again.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORM
  ========================================================= */

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPhoto(null);
    setPhotoPreview("");
    setShowForm(true);
  };

  const openEdit = (member) => {
    setEditing(member);

    setForm({
      memberType: member.memberType,
      name: member.name || "",
      position: member.position || "",
      department: member.department || "",
      designation: member.designation || "",
      registerNumber: member.registerNumber || "",
      semester: member.semester ? String(member.semester) : "",
      order: member.order ?? 0,
    });

    setPhoto(null);
    setPhotoPreview(member.photo || "");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid File",
        text: "Please select an image file.",
        confirmButtonColor: "#0f766e",
      });

      e.target.value = "";
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isFaculty = form.memberType === "faculty";

    const missing = !form.name.trim()
      ? "Please enter the name."
      : !form.department
        ? "Please select the department."
        : isFaculty && !form.designation.trim()
          ? "Please enter the designation."
          : !isFaculty && !form.registerNumber.trim()
            ? "Please enter the register number."
            : !isFaculty && !form.semester
              ? "Please select the semester."
              : null;

    if (missing) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: missing,
        confirmButtonColor: "#0f766e",
      });
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, String(value).trim())
      );

      if (photo) {
        formData.append("photo", photo);
      }

      const response = editing
        ? await axios.put(
            `${API_URL}/api/team/${editing._id}`,
            formData
          )
        : await axios.post(`${API_URL}/api/team`, formData);

      setShowForm(false);

      await loadMembers();

      Swal.fire({
        icon: "success",
        title: response.data?.message || "Saved",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("SAVE TEAM MEMBER ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text:
          error.response?.data?.message ||
          "Unable to save the team member.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Remove team member?",
      text: `${member.name} will be removed from the magazine team.`,
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/api/team/${member._id}`);

      setMembers((previous) =>
        previous.filter((item) => item._id !== member._id)
      );
    } catch (error) {
      console.error("DELETE TEAM MEMBER ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Remove failed",
        text:
          error.response?.data?.message ||
          "Unable to remove the team member.",
        confirmButtonColor: "#0f766e",
      });
    }
  };

  /* =========================================================
     PAGE
  ========================================================= */

  const groups = [
    {
      title: "Faculty",
      items: members.filter((m) => m.memberType === "faculty"),
    },
    {
      title: "Students",
      items: members.filter((m) => m.memberType === "student"),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Magazine Team
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Faculty and student coordinators shown on the home page.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
        >
          <Plus size={17} />
          Add Member
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading team...
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            No team members yet. Add the magazine coordinators to
            show them on the home page.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.title}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                  {group.title}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((member) => (
                    <div
                      key={member._id}
                      className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                          {member.memberType === "student" ? (
                            <GraduationCap size={28} />
                          ) : (
                            <UserRound size={28} />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-800">
                          {member.name}
                        </p>

                        {member.position && (
                          <p className="truncate text-xs font-semibold text-teal-700">
                            {member.position}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          {member.memberType === "faculty"
                            ? member.designation
                            : `${member.registerNumber} · Semester ${member.semester}`}
                        </p>

                        <p className="text-xs text-slate-500">
                          {getDepartmentLabel(member.department)}
                        </p>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(member)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(member)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {/* =====================================================
          ADD / EDIT FORM
      ===================================================== */}

      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <h2 className="font-bold text-slate-800">
                {editing ? "Edit Member" : "Add Member"}
              </h2>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["faculty", "Faculty"],
                  ["student", "Student"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        memberType: value,
                      }))
                    }
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      form.memberType === value
                        ? "border-teal-600 bg-teal-50 text-teal-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <ImagePlus size={24} />
                  </div>
                )}

                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-700">
                    <Upload size={15} />
                    {photoPreview ? "Change photo" : "Upload photo"}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className={labelClass}>Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Role in the Magazine
                </label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  placeholder="Example: Chief Editor, Student Coordinator"
                  className={inputClass}
                />
              </div>

              {form.memberType === "faculty" ? (
                <div>
                  <label className={labelClass}>Designation *</label>
                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="Example: Senior Lecturer"
                    className={inputClass}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      Register No. *
                    </label>
                    <input
                      name="registerNumber"
                      value={form.registerNumber}
                      onChange={handleChange}
                      className={`${inputClass} uppercase`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Semester *</label>
                    <select
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5, 6].map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[1fr_96px] gap-3">
                <div>
                  <label className={labelClass}>Department *</label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select</option>
                    {DEPARTMENTS.map((department) => (
                      <option
                        key={department.value}
                        value={department.value}
                      >
                        {department.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Order</label>
                  <input
                    type="number"
                    name="order"
                    min="0"
                    value={form.order}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
