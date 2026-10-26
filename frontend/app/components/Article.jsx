"use client";

import { useEffect, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Heart,
  MessageCircle,
  X,
  Image as ImageIcon,
} from "lucide-react";

import {
  getMonthName,
  formatDate,
  getOrdinal,
  getDepartmentLabel,
} from "../lib/magazineFormat";

import ArticleFeedback from "./ArticleFeedback";

/*
============================================================
Article card and full-article view, used on the home page
and the magazine page.
============================================================
*/

export function ArticleCard({
  article,
  onRead,
  // Off inside the moving carousel: a photo click opens the article
  photoPreview = true,
}) {
  const [previewImage, setPreviewImage] = useState(null);

  const openPhoto = (photo) => {
    if (photoPreview) {
      setPreviewImage(photo);
    } else {
      onRead();
    }
  };

  return (
    <>
      <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">

        <div
          className={`relative h-56 overflow-hidden ${photoPreview ? "cursor-zoom-in" : "cursor-pointer"} bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900`}
          onClick={() => {
            if (article.eventPhoto) {
              openPhoto(article.eventPhoto);
            } else if (!photoPreview) {
              onRead();
            }
          }}
        >
          {article.eventPhoto ? (
            <img
  loading="lazy"
  decoding="async"
              src={article.eventPhoto}
              alt={article.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon
                size={46}
                className="text-white/30"
              />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          <div className="absolute left-4 top-4 pointer-events-none">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 shadow-sm">
              {article.activityName}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-white pointer-events-none">
            <CalendarDays size={13} />
            {formatDate(article.eventDate)}
          </div>

          {article.eventPhoto && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm pointer-events-none">
              {photoPreview ? "Click to enlarge" : "Tap to read"}
            </div>
          )}
        </div>

        <div className="p-5">

          <p className="text-xs font-bold text-teal-700">
            {getDepartmentLabel(article.departmentName)}
          </p>

          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-slate-900">
            {article.title}
          </h2>

          {article.achievementText && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              🏆 {article.achievementText}
            </p>
          )}

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
            {article.description}
          </p>

          {article.studentName && (
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">

              {article.studentPhoto ? (
                <img
  loading="lazy"
  decoding="async"
                  src={article.studentPhoto}
                  alt={article.studentName}
                  onClick={(event) => {
                    event.stopPropagation();
                    openPhoto(article.studentPhoto);
                  }}
                  className="h-9 w-9 cursor-zoom-in rounded-full object-cover transition hover:scale-110"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <GraduationCap size={17} />
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {article.studentName}
                </p>

                <p className="text-[11px] text-slate-500">
                  {article.registerNumber &&
                    article.registerNumber}

                  {article.registerNumber &&
                    article.semester &&
                    " • "}

                  {article.semester &&
                    `${article.semester}${getOrdinal(
                      article.semester
                    )} Semester`}
                  {article.designation}
                </p>
              </div>

            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onRead}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 transition hover:text-teal-800"
            >
              Read article
              <ArrowRight size={15} />
            </button>

            <span className="flex items-center gap-3 text-xs font-semibold text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Heart size={14} />
                {article.likeCount || 0}
              </span>

              <span className="inline-flex items-center gap-1">
                <MessageCircle size={14} />
                {article.commentCount || 0}
              </span>
            </span>
          </div>

        </div>
      </article>

      {previewImage && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-xl transition hover:bg-red-50 hover:text-red-600"
            aria-label="Close image"
          >
            <X size={24} />
          </button>

          <img
  loading="lazy"
  decoding="async"
            src={previewImage}
            alt="Enlarged preview"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

export function ArticleModal({
  article,
  onClose,
}) {
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, previewImage]);

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-red-50 hover:text-red-600"
          >
            <X size={20} />
          </button>

          <div className="max-h-[92vh] overflow-y-auto scrollbar-hide">

            {article.eventPhoto && (
              <div
                className="relative h-64 cursor-zoom-in overflow-hidden bg-slate-900 sm:h-80"
                onClick={() => setPreviewImage(article.eventPhoto)}
              >
                <img
  loading="lazy"
  decoding="async"
                  src={article.eventPhoto}
                  alt={article.title}
                  className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                />

                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5 right-16 pointer-events-none">
                  <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 shadow-sm">
                    {article.activityName}
                  </span>
                </div>

                <div className="absolute bottom-4 right-5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  Click to enlarge
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8">

              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                {getDepartmentLabel(article.departmentName)}
              </p>

              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
                {article.title}
              </h2>

              {article.achievementText && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800">
                  🏆 {article.achievementText}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {formatDate(article.eventDate)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {getMonthName(article.issueMonth)} {article.issueYear}
                </span>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                  {article.description}
                </p>
              </div>

              {article.studentName && (
                <div className="mt-7 rounded-2xl border border-teal-100 bg-teal-50/60 p-5">
                  <div className="flex items-center gap-4">

                    {article.studentPhoto ? (
                      <img
  loading="lazy"
  decoding="async"
                        src={article.studentPhoto}
                        alt={article.studentName}
                        onClick={() =>
                          setPreviewImage(article.studentPhoto)
                        }
                        className="h-16 w-16 cursor-zoom-in rounded-2xl object-cover transition hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-700">
                        <GraduationCap size={28} />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        Submitted by
                      </p>

                      <p className="mt-1 text-base font-black text-slate-900">
                        {article.studentName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {article.registerNumber}

                        {article.registerNumber &&
                          article.semester &&
                          " • "}

                        {article.semester &&
                          `${article.semester}${getOrdinal(
                            article.semester
                          )} Semester`}
                        {article.designation}
                      </p>
                    </div>

                  </div>
                </div>
              )}

              <ArticleFeedback article={article} />

            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-xl transition hover:bg-red-50 hover:text-red-600"
            aria-label="Close image"
          >
            <X size={24} />
          </button>

          <img
  loading="lazy"
  decoding="async"
            src={previewImage}
            alt="Enlarged preview"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
