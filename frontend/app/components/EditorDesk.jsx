"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  ChevronDown,
  ChevronUp,
  PenLine,
  Quote,
  UserRound,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/*
============================================================
"From the Editor's Desk" on the home page.
Hidden until a message has been written.
============================================================
*/

export default function EditorDesk() {
  const [desk, setDesk] = useState(null);

  // Long messages start shortened, with "Read more"
  const [expanded, setExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);
  const messageRef = useRef(null);

  // Is the shortened message hiding anything? Checked again
  // when the screen size changes (phone turned, etc.)
  useEffect(() => {
    const element = messageRef.current;

    if (!element || expanded) return;

    const check = () =>
      setIsLong(element.scrollHeight > element.clientHeight + 1);

    check();

    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, [desk, expanded]);

  useEffect(() => {
    let cancelled = false;

    axios
      .get(`${API_URL}/api/editor-desk`)
      .then((response) => {
        if (!cancelled) {
          setDesk(response.data?.data || null);
        }
      })
      .catch((error) =>
        console.error("Failed to load the editor's desk:", error)
      );

    return () => {
      cancelled = true;
    };
  }, []);

  if (!desk?.message) {
    return null;
  }

  return (
    <section
      id="editor"
      className="border-b border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-teal-700">
            <PenLine size={17} />

            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-xs">
              A Word From Us
            </p>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            From the Editor&apos;s Desk
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl items-center gap-8 overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-amber-50/50 p-6 shadow-sm sm:p-10 md:grid-cols-[240px_1fr]">
          {/* PHOTO */}

          <div className="mx-auto w-48 sm:w-56 md:w-full">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 shadow-lg ring-4 ring-white">
              {desk.photo ? (
                <img
                  src={desk.photo}
                  alt={desk.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/40">
                  <UserRound size={64} />
                </div>
              )}
            </div>
          </div>

          {/* MESSAGE */}

          <div className="relative">
            <Quote
              size={44}
              className="absolute -left-1 -top-3 text-teal-100"
              aria-hidden="true"
            />

            <p
              ref={messageRef}
              className={`relative text-justify whitespace-pre-line text-[15px] leading-7 text-slate-700 sm:text-base sm:leading-8 ${
                expanded ? "" : "line-clamp-6 sm:line-clamp-[12]"
              }`}
            >
              {desk.message}
            </p>

            {(isLong || expanded) && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-bold text-teal-700 transition hover:bg-teal-100"
              >
                {expanded ? "Show less" : "Read more"}
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}

            <div className="mt-6 border-t border-teal-100 pt-4">
              <p className="text-lg font-black text-slate-900">
                {desk.name}
              </p>

              {desk.designation && (
                <p className="text-sm font-semibold text-teal-700">
                  {desk.designation}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
