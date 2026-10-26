"use client";

import { useState } from "react";

import { ArticleCard } from "./Article";

// Seconds each card takes to pass; more cards, longer loop
const SECONDS_PER_CARD = 6;

/*
============================================================
Endless sideways-moving row of article cards.

The list is drawn twice, back to back, and slid left by
exactly one copy, so the loop has no visible jump.
It pauses while the reader hovers or touches it, and does
not move for people who turned off motion on their device
(they can scroll it sideways instead).
============================================================
*/

export default function ArticleCarousel({ articles, onRead }) {
  const [paused, setPaused] = useState(false);

  if (articles.length === 0) {
    return null;
  }

  const duration = `${Math.max(articles.length, 4) * SECONDS_PER_CARD}s`;

  const renderCards = (copy) =>
    articles.map((article) => (
      <div
        key={`${copy}-${article._id}`}
        className="w-[280px] shrink-0 sm:w-[320px]"
        aria-hidden={copy === 1 ? "true" : undefined}
      >
        <ArticleCard
          article={article}
          onRead={() => onRead(article)}
          photoPreview={false}
        />
      </div>
    ));

  return (
    <div
      className="carousel relative -mx-4 overflow-hidden sm:mx-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Soft fade at both edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#fffdf5] to-transparent sm:w-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#fffdf5] to-transparent sm:w-20" />

      <div
        className="carousel-track flex w-max gap-6 py-2"
        style={{
          animationDuration: duration,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {renderCards(0)}
        {renderCards(1)}
      </div>
    </div>
  );
}
