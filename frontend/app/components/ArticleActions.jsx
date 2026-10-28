"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { Check, Heart, Link2, Share2 } from "lucide-react";

import { getVisitorId } from "../lib/feedback";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// The WhatsApp logo, drawn small next to the button text
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.25-8.23 8.25zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

/*
============================================================
Like and share, under a full article. Readers do not log in.

Share opens the phone's own share menu (WhatsApp, status,
Instagram...) where the browser supports it; the WhatsApp
and Copy link buttons work everywhere.
============================================================
*/

export default function ArticleActions({ article }) {
  const articleId = article._id;

  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Each article has its own address, which shows a preview
  // (photo and title) when shared
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/article/${articleId}`);
    setCanShare(typeof navigator.share === "function");

    axios
      .get(`${API_URL}/api/feedback/likes`, {
        params: { visitorId: getVisitorId() },
      })
      .then((response) =>
        setLiked((response.data?.data || []).includes(String(articleId)))
      )
      .catch(() => {});
  }, [articleId]);

  const shareText = `${article.title} | KPT E-Magazine`;

  /* ---------- like */

  const toggleLike = async () => {
    if (liking) return;

    // Show the change at once, then confirm with the server
    setLiking(true);
    setLiked(!liked);
    setLikeCount((count) => Math.max(0, count + (liked ? -1 : 1)));

    try {
      const response = await axios.post(
        `${API_URL}/api/feedback/articles/${articleId}/like`,
        { visitorId: getVisitorId() }
      );

      setLiked(Boolean(response.data?.liked));
      setLikeCount(response.data?.likeCount ?? 0);
    } catch (error) {
      setLiked(liked);
      setLikeCount((count) => Math.max(0, count + (liked ? 1 : -1)));
    } finally {
      setLiking(false);
    }
  };

  /* ---------- share */

  const shareNative = async () => {
    try {
      await navigator.share({
        title: shareText,
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      // Closing the share menu is not an error
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      window.prompt("Copy this link:", shareUrl);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}\n${shareUrl}`
  )}`;

  const buttonClass =
    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition";

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          className={`${buttonClass} ${
            liked
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600"
          }`}
        >
          <Heart size={17} className={liked ? "fill-rose-500 text-rose-500" : ""} />
          {liked ? "Liked" : "Like"}
          <span className="font-semibold text-slate-400">{likeCount}</span>
        </button>

        {canShare && (
          <button
            type="button"
            onClick={shareNative}
            className={`${buttonClass} border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100`}
          >
            <Share2 size={16} />
            Share
          </button>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
        >
          <WhatsAppIcon />
          WhatsApp
        </a>

        <button
          type="button"
          onClick={copyLink}
          className={`${buttonClass} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Link2 size={16} />}
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>

      {canShare && (
        <p className="mt-2 text-xs text-slate-400">
          Tip: Share, then choose WhatsApp to send it to friends or put
          it on your status.
        </p>
      )}
    </div>
  );
}
