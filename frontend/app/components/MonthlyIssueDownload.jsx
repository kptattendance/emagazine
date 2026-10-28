"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useUser } from "@clerk/nextjs";

import { FileDown, Loader2 } from "lucide-react";

import { DEPARTMENTS, getDepartmentLabel } from "../lib/departments";
import { getCurrentUser } from "../lib/currentUser";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Photos are made smaller before going into the PDF
const PHOTO_MAX_PX = 1200;
const PORTRAIT_MAX_PX = 400;

// Photos loaded at the same time
const PARALLEL_LOADS = 4;

const monthLabel = (month) => {
  const [year, number] = month.split("-").map(Number);

  return new Date(year, number - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

// A photo as a smaller JPEG for the PDF; "" if it cannot load
const loadPhoto = async (url, maxPx) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/magazine-content/issue/image`,
      { params: { url }, responseType: "blob" }
    );

    const bitmap = await createImageBitmap(response.data);
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    bitmap.close?.();

    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    console.error("Photo could not be loaded for the PDF:", url, error);

    return "";
  }
};

/*
============================================================
Download the monthly issue as a PDF.

Admin and institute coordinator: whole institute or one
department. HOD: their own department.
============================================================
*/

export default function MonthlyIssueDownload() {
  const { user } = useUser();

  const [months, setMonths] = useState([]);
  const [month, setMonth] = useState("");
  const [department, setDepartment] = useState("");
  const [isHod, setIsHod] = useState(false);
  const [hodDepartment, setHodDepartment] = useState("");

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      axios.get(`${API_URL}/api/magazine-content/issue/months`),
      getCurrentUser(user.id),
    ])
      .then(([monthsResponse, meResponse]) => {
        const list = monthsResponse.data?.data || [];

        setMonths(list);
        setMonth(list[0]?.month || "");

        const me = meResponse.data?.data;

        if (me?.role === "hod") {
          setIsHod(true);
          setHodDepartment(me.department || "");
        }
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Unable to load",
          text: error.response?.data?.message || "Please try again.",
          confirmButtonColor: "#0f766e",
        });
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleDownload = async () => {
    if (!month) return;

    try {
      setProgress("Collecting articles...");

      const [{ data: issue }, pdf, assets] = await Promise.all([
        axios.get(`${API_URL}/api/magazine-content/issue`, {
          params: { month, department: isHod ? "" : department },
        }),
        import("../lib/pdf/monthlyIssuePdf"),
        import("../lib/pdf/letterheadAssets"),
      ]);

      // ---- every photo the issue needs
      const wanted = new Map();

      (issue.data || []).forEach((article) => {
        if (article.eventPhoto) {
          wanted.set(article.eventPhoto, PHOTO_MAX_PX);
        }

        [article.student?.photo, article.faculty?.photo]
          .filter(Boolean)
          .forEach((url) => {
            if (!wanted.has(url)) wanted.set(url, PORTRAIT_MAX_PX);
          });
      });

      const urls = [...wanted.keys()];
      const images = {};
      let done = 0;

      setProgress(`Loading photos 0 of ${urls.length}...`);

      const letterheadPromise = assets.loadLetterhead();

      for (let start = 0; start < urls.length; start += PARALLEL_LOADS) {
        await Promise.all(
          urls.slice(start, start + PARALLEL_LOADS).map(async (url) => {
            images[url] = await loadPhoto(url, wanted.get(url));
            done += 1;
            setProgress(`Loading photos ${done} of ${urls.length}...`);
          })
        );
      }

      const letterhead = await letterheadPromise;

      // Kannada text in articles needs its font ready
      await document.fonts.load(`400 40px ${assets.kannadaFontFamily()}`);
      await document.fonts.load(`700 40px ${assets.kannadaFontFamily()}`);

      setProgress("Building the PDF...");

      // Let the message show before the page is busy
      await new Promise((resolve) => setTimeout(resolve, 50));

      const doc = pdf.buildMonthlyIssuePdf({ issue, images, letterhead });

      doc.save(pdf.issueFileName(issue));

      const missing = urls.filter((url) => !images[url]).length;

      Swal.fire({
        icon: "success",
        title: "PDF downloaded",
        text: missing
          ? `${issue.data.length} articles. ${missing} photo(s) could not be loaded and were left out.`
          : `${issue.data.length} articles.`,
        confirmButtonColor: "#0f766e",
      });
    } catch (error) {
      console.error("MONTHLY ISSUE PDF ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Could not create the PDF",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#0f766e",
      });
    } finally {
      setProgress("");
    }
  };

  const selected = months.find((item) => item.month === month);
  const busy = Boolean(progress);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800">
        Monthly Issue PDF
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        A colourful PDF of the month&apos;s published articles, with
        photos and authors, on the college letterhead. Ready to
        circulate.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : months.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing has been published yet.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Month
                </label>

                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  {months.map((item) => (
                    <option key={item.month} value={item.month}>
                      {monthLabel(item.month)} ({item.count} published)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Department
                </label>

                {isHod ? (
                  <input
                    value={getDepartmentLabel(hodDepartment)}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  />
                ) : (
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {selected && !isHod && !department && (
              <p className="mt-3 text-xs text-slate-500">
                {selected.count} articles were published in{" "}
                {monthLabel(selected.month)}.
              </p>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={busy || !month}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
            >
              {busy ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <FileDown size={17} />
              )}
              {busy ? progress : "Download PDF"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
