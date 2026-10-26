"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { ImagePlus, Loader2, Save, Upload } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

const labelClass =
  "mb-1.5 block text-sm font-semibold text-slate-700";

/*
============================================================
Edit "From the Editor's Desk" on the home page:
photo, name, designation and message.
============================================================
*/

export default function EditorDeskManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    message: "",
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/editor-desk`)
      .then((response) => {
        const desk = response.data?.data;

        if (desk) {
          setForm({
            name: desk.name || "",
            designation: desk.designation || "",
            message: desk.message || "",
          });

          setPhotoPreview(desk.photo || "");
        }
      })
      .catch((error) =>
        console.error("LOAD EDITOR DESK ERROR:", error)
      )
      .finally(() => setLoading(false));
  }, []);

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

    if (form.message.trim() && !form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name required",
        text: "Please enter the editor's name.",
        confirmButtonColor: "#0f766e",
      });
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("designation", form.designation.trim());
      formData.append("message", form.message.trim());

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await axios.put(
        `${API_URL}/api/editor-desk`,
        formData
      );

      setPhoto(null);

      Swal.fire({
        icon: "success",
        title: response.data?.message || "Saved",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("SAVE EDITOR DESK ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text:
          error.response?.data?.message ||
          "Unable to save the editor's desk.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-slate-800">
          From the Editor&apos;s Desk
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Shown on the home page above the Magazine Team. Leave the
          message empty to hide it.
        </p>
      </div>

      {loading ? (
        <p className="p-5 text-sm text-slate-500">Loading...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 p-5 md:grid-cols-[160px_1fr]"
        >
          <div className="flex flex-col items-center gap-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Editor"
                className="aspect-[4/5] w-36 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-36 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ImagePlus size={28} />
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

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Editor&apos;s Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Designation</label>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="Example: Chief Editor"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={8}
                placeholder="The editor's message to readers..."
                className={`${inputClass} resize-y leading-6`}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
