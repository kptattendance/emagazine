"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

import { formatDate, getDepartmentLabel } from "../lib/magazineFormat";
import FittedImage from "./FittedImage";

// Seconds each slide stays before the next one slides in
const SLIDE_SECONDS = 4;

// Finger movement (px) that counts as a swipe
const SWIPE_DISTANCE = 50;

const TYPE_LABEL = {
  activity: "College Activity",
  club: "Club Activity",
  creative: "Creative Corner",
  achievement: "Achievement",
};

/*
============================================================
Full-width photo slider at the top of the home page.

One article at a time: its photo fills the width, with the
title over a dark fade. Slides change on their own, with
dots and arrows to move, and a swipe on phones. Clicking a
slide opens the article.
============================================================
*/

export default function HeroSlider({ articles, onRead }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const touchStart = useRef(null);

  const count = articles.length;

  const go = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count]
  );

  // People who turned off motion: no automatic sliding
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    setReducedMotion(query.matches);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || count < 2) return;

    const timer = setTimeout(() => go(index + 1), SLIDE_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [index, paused, reducedMotion, count, go]);

  if (count === 0) {
    return null;
  }

  const onTouchStart = (event) => {
    touchStart.current = event.touches[0].clientX;
    setPaused(true);
  };

  const onTouchEnd = (event) => {
    const start = touchStart.current;

    touchStart.current = null;
    setPaused(false);

    if (start === null) return;

    const moved = event.changedTouches[0].clientX - start;

    if (Math.abs(moved) > SWIPE_DISTANCE) {
      go(index + (moved < 0 ? 1 : -1));
    }
  };

  return (
    <div
      className="group relative w-full overflow-hidden bg-slate-900"
      role="region"
      aria-roledescription="carousel"
      aria-label="Latest magazine articles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
      }}
    >
      {/* SLIDES */}

      <div
        className="flex h-[62vh] min-h-[340px] max-h-[680px] transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {articles.map((article, position) => (
          <button
            key={article._id}
            type="button"
            onClick={() => onRead(article)}
            aria-hidden={position !== index}
            tabIndex={position === index ? 0 : -1}
            aria-label={`Read: ${article.title}`}
            className="relative h-full w-full shrink-0 cursor-pointer text-left"
          >
            {article.eventPhoto ? (
              <FittedImage
                src={article.eventPhoto}
                eager={position === 0}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
                <Newspaper size={90} className="text-white/15" />
              </div>
            )}

            {/* dark fade so the title reads on any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 px-5 pb-14 sm:px-10 sm:pb-16 lg:px-16">
              <div className="mx-auto max-w-6xl">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/85 sm:text-xs">
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-slate-900">
                    {article.activityName ||
                      TYPE_LABEL[article.contentType] ||
                      "KPT E-Magazine"}
                  </span>

                  <span>
                    {getDepartmentLabel(article.departmentName)}
                    {article.eventDate && ` · ${formatDate(article.eventDate)}`}
                  </span>
                </div>

                <h2 className="line-clamp-3 max-w-4xl text-2xl font-black leading-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
                  {article.title}
                </h2>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ARROWS */}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous article"
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 sm:flex"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next article"
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35 sm:flex"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* DOTS */}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-5 flex justify-center gap-1.5 px-4">
          {articles.map((article, position) => (
            <button
              key={article._id}
              type="button"
              onClick={() => go(position)}
              aria-label={`Show article ${position + 1}`}
              aria-current={position === index}
              className={`h-2 rounded-full transition-all ${
                position === index
                  ? "w-6 bg-white"
                  : "w-2 bg-white/45 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
