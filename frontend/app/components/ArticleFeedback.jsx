"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { Heart, Loader2, MessageCircle, Send } from "lucide-react";

import Turnstile, { turnstileConfigured } from "./Turnstile";

import {
  COMMENT_MAX_LENGTH,
  VISITOR_PLACES,
  VISITOR_TYPES,
  getVisitorId,
  loadCommenterDetails,
  saveCommenterDetails,
} from "../lib/feedback";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/*
============================================================
Like button and comments under a full article.
Readers do not log in.
============================================================
*/

export default function ArticleFeedback({ article }) {
  const articleId = article._id;

  const [likeCount, setLikeCount] = useState(article.likeCount || 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [form, setForm] = useState({
    name: "",
    visitorType: "",
    place: "",
    text: "",
    website: "",
  });

  const [startedAt, setStartedAt] = useState(Date.now());
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState(null);

  /* ---------- load likes and comments */

  useEffect(() => {
    const saved = loadCommenterDetails();

    if (saved) {
      setForm((previous) => ({ ...previous, ...saved }));
    }

    axios
      .get(`${API_URL}/api/feedback/likes`, {
        params: { visitorId: getVisitorId() },
      })
      .then((response) =>
        setLiked((response.data?.data || []).includes(String(articleId)))
      )
      .catch(() => {});

    axios
      .get(`${API_URL}/api/feedback/articles/${articleId}/comments`)
      .then((response) => setComments(response.data?.data || []))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [articleId]);

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

  /* ---------- comment */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setNotice(null);

    const missing = !form.name.trim()
      ? "Please enter your name."
      : !form.visitorType
        ? "Please choose who you are."
        : !form.place
          ? "Please choose where you are from."
          : !form.text.trim()
            ? "Please write a comment."
            : turnstileConfigured && !token
              ? "Please wait a moment while we check you are not a robot."
              : null;

    if (missing) {
      setNotice({ type: "error", text: missing });
      return;
    }

    try {
      setPosting(true);

      const response = await axios.post(
        `${API_URL}/api/feedback/articles/${articleId}/comments`,
        {
          ...form,
          name: form.name.trim(),
          text: form.text.trim(),
          startedAt,
          turnstileToken: token,
        }
      );

      saveCommenterDetails({
        name: form.name.trim(),
        visitorType: form.visitorType,
        place: form.place,
      });

      setComments((previous) => [response.data.data, ...previous]);

      setForm((previous) => ({ ...previous, text: "" }));
      setNotice({ type: "success", text: "Thank you! Your comment is posted." });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message ||
          "Your comment could not be posted. Please try again.",
      });
    } finally {
      setPosting(false);
      setStartedAt(Date.now());
      setToken("");
      setResetKey((key) => key + 1);
    }
  };

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      {/* LIKE */}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
            liked
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600"
          }`}
        >
          <Heart size={17} className={liked ? "fill-rose-500 text-rose-500" : ""} />
          {liked ? "Liked" : "Like"}
          <span className="font-semibold text-slate-400">
            {likeCount}
          </span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <MessageCircle size={17} />
          {comments.length} comment{comments.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* COMMENT FORM */}

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
      >
        <p className="mb-3 text-sm font-bold text-slate-800">
          Leave a comment
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            maxLength={60}
            className={inputClass}
          />

          <select
            name="visitorType"
            value={form.visitorType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">I am a...</option>
            {VISITOR_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            name="place"
            value={form.place}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">From...</option>
            {VISITOR_PLACES.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </div>

        {/* Hidden from people; bots fill it in */}
        <input
          name="website"
          value={form.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <textarea
          name="text"
          value={form.text}
          onChange={handleChange}
          rows={3}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder="Write your comment..."
          className={`${inputClass} mt-3 resize-y`}
        />

        <div className="mt-1 text-right text-[11px] text-slate-400">
          {form.text.length}/{COMMENT_MAX_LENGTH}
        </div>

        <Turnstile onToken={setToken} resetKey={resetKey} />

        {notice && (
          <p
            className={`mt-2 text-sm font-medium ${
              notice.type === "success" ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {notice.text}
          </p>
        )}

        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-4 text-slate-400">
            Comments appear immediately. Your approximate location is
            recorded for the magazine team. Links are not allowed.
          </p>

          <button
            type="submit"
            disabled={posting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
          >
            {posting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            Post
          </button>
        </div>
      </form>

      {/* COMMENTS */}

      <div className="mt-6 space-y-3">
        {loadingComments ? (
          <p className="text-sm text-slate-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-400">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-bold text-slate-800">
                  {comment.name}
                </span>
                <span className="text-xs text-slate-500">
                  {comment.visitorType} · {comment.place}
                </span>
                <span className="text-xs text-slate-400">
                  · {timeAgo(comment.createdAt)}
                </span>
              </div>

              <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                {comment.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
