import crypto from "crypto";

import Comment from "../models/Comment.js";
import ArticleLike from "../models/ArticleLike.js";
import MagazineContent from "../models/MagazineContent.js";

import {
  BLOCKED_WORDS,
  COMMENT_MAX_LENGTH,
  VISITOR_PLACES,
  VISITOR_TYPES,
} from "../config/feedback.js";

import {
  departmentAliases,
  normalizeDepartment,
} from "../config/departments.js";

import { verifyTurnstile } from "../config/turnstile.js";

/*
=====================================================
HELPERS
=====================================================
*/

// Forms filled faster than this are almost always bots
const MIN_FILL_MS = 3000;

const LINK_PATTERN =
  /(https?:\/\/|www\.|\.(com|in|net|org|xyz|info|ru|io)\b)/i;

const hashIp = (ip) =>
  crypto
    .createHash("sha256")
    .update(`${process.env.IP_HASH_SALT || "kpt-emagazine"}:${ip || ""}`)
    .digest("hex")
    .slice(0, 32);

const decodeHeader = (value) => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch (error) {
    return String(value || "");
  }
};

// Approximate location of the reader's network (Vercel)
const approxLocationOf = (req) => ({
  city: decodeHeader(req.headers["x-vercel-ip-city"]),
  region: decodeHeader(req.headers["x-vercel-ip-country-region"]),
  country: decodeHeader(req.headers["x-vercel-ip-country"]),
});

const containsBlockedWord = (text) => {
  const words = String(text).toLowerCase().match(/[a-z]+/g) || [];

  return words.some((word) => BLOCKED_WORDS.includes(word));
};

const findPublished = (contentId) =>
  MagazineContent.findOne({
    _id: contentId,
    status: "published",
  });

const getRole = (user) =>
  String(user?.role || "").toLowerCase();

/*
Admin and the institute coordinator: any comment.
HOD: comments on their own department's articles.
*/
const canModerate = (user, article) => {
  const role = getRole(user);

  if (role === "admin" || role === "mag_coordinator") {
    return true;
  }

  return (
    role === "hod" &&
    Boolean(user.department) &&
    normalizeDepartment(user.department) ===
      normalizeDepartment(article?.department)
  );
};

const publicComment = (comment) => ({
  _id: comment._id,
  name: comment.name,
  visitorType: comment.visitorType,
  place: comment.place,
  text: comment.text,
  createdAt: comment.createdAt,
});


/*
=====================================================
COMMENTS ON AN ARTICLE (PUBLIC)
=====================================================
*/

export const getArticleComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      content: req.params.contentId,
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      data: comments.map(publicComment),
    });
  } catch (error) {
    console.error("GET COMMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load comments.",
    });
  }
};


/*
=====================================================
ADD A COMMENT (PUBLIC, NO LOGIN)
=====================================================

Published immediately. Bots and abuse are held back by:
Turnstile, a hidden field, a minimum fill time, no links,
a small word filter, and a per-network rate limit.
=====================================================
*/

export const addComment = async (req, res) => {
  try {
    const {
      name,
      visitorType,
      place,
      text,
      website,
      startedAt,
      turnstileToken,
    } = req.body;

    // Hidden field: people never fill it in, bots do
    if (website) {
      return res.status(400).json({
        success: false,
        message: "Comment could not be posted.",
      });
    }

    if (
      !Number(startedAt) ||
      Date.now() - Number(startedAt) < MIN_FILL_MS
    ) {
      return res.status(400).json({
        success: false,
        message: "Please take a moment before posting.",
      });
    }

    const cleanName = String(name || "").trim();
    const cleanText = String(text || "").trim();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Please enter your name.",
      });
    }

    if (!VISITOR_TYPES.includes(visitorType)) {
      return res.status(400).json({
        success: false,
        message: "Please choose who you are.",
      });
    }

    if (!VISITOR_PLACES.includes(place)) {
      return res.status(400).json({
        success: false,
        message: "Please choose where you are from.",
      });
    }

    if (cleanText.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please write a comment.",
      });
    }

    if (cleanText.length > COMMENT_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Comments can be at most ${COMMENT_MAX_LENGTH} characters.`,
      });
    }

    if (
      LINK_PATTERN.test(cleanText) ||
      LINK_PATTERN.test(cleanName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Links are not allowed in comments.",
      });
    }

    if (
      containsBlockedWord(cleanText) ||
      containsBlockedWord(cleanName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please keep comments polite.",
      });
    }

    if (!(await verifyTurnstile(turnstileToken, req.ip))) {
      return res.status(400).json({
        success: false,
        message:
          "Could not confirm you are not a robot. Please try again.",
      });
    }

    const article = await findPublished(req.params.contentId);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    const comment = await Comment.create({
      content: article._id,
      name: cleanName,
      visitorType,
      place,
      text: cleanText,
      approxLocation: approxLocationOf(req),
      ipHash: hashIp(req.ip),
    });

    await MagazineContent.updateOne(
      { _id: article._id },
      { $inc: { commentCount: 1 } }
    );

    return res.status(201).json({
      success: true,
      message: "Thank you for your comment.",
      data: publicComment(comment),
    });
  } catch (error) {
    console.error("ADD COMMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to post the comment.",
    });
  }
};


/*
=====================================================
COMMENTS FOR MODERATORS
=====================================================

Includes the approximate location. HODs see comments on
their own department's articles.
=====================================================
*/

export const getCommentsForModeration = async (req, res) => {
  try {
    const role = getRole(req.user);

    const filter = {};

    if (role === "hod") {
      if (!req.user.department) {
        return res.status(400).json({
          success: false,
          message: "Department is not assigned to this HOD.",
        });
      }

      filter.content = {
        $in: await MagazineContent.find({
          department: {
            $in: departmentAliases(req.user.department),
          },
        }).distinct("_id"),
      };
    } else if (!["admin", "mag_coordinator"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to see comments.",
      });
    }

    const comments = await Comment.find(filter)
      .populate("content", "title department")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.status(200).json({
      success: true,
      data: comments.map((comment) => ({
        ...publicComment(comment),
        approxLocation: comment.approxLocation,
        ipHash: comment.ipHash,
        article: comment.content,
      })),
    });
  } catch (error) {
    console.error("GET MODERATION COMMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load comments.",
    });
  }
};


/*
=====================================================
DELETE A COMMENT
=====================================================
*/

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    const article = await MagazineContent.findById(
      comment.content
    ).lean();

    if (!canModerate(req.user, article)) {
      return res.status(403).json({
        success: false,
        message:
          "You can delete comments only on your own department's articles.",
      });
    }

    await comment.deleteOne();

    if (article) {
      await MagazineContent.updateOne(
        { _id: article._id, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted.",
    });
  } catch (error) {
    console.error("DELETE COMMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete the comment.",
    });
  }
};


/*
=====================================================
LIKE / UNLIKE (PUBLIC, NO LOGIN)
=====================================================

One like per browser per article; clicking again
removes it. The per-network rate limit stops scripts.
=====================================================
*/

const VISITOR_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

export const toggleLike = async (req, res) => {
  try {
    const visitorId = String(req.body.visitorId || "");

    if (!VISITOR_ID_PATTERN.test(visitorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request.",
      });
    }

    const article = await findPublished(req.params.contentId);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    const removed = await ArticleLike.findOneAndDelete({
      content: article._id,
      visitorId,
    });

    let liked;

    if (removed) {
      liked = false;

      await MagazineContent.updateOne(
        { _id: article._id, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } }
      );
    } else {
      try {
        await ArticleLike.create({
          content: article._id,
          visitorId,
        });

        liked = true;

        await MagazineContent.updateOne(
          { _id: article._id },
          { $inc: { likeCount: 1 } }
        );
      } catch (error) {
        // Two clicks at once: the first one already liked it
        if (error?.code !== 11000) throw error;

        liked = true;
      }
    }

    const updated = await MagazineContent.findById(article._id)
      .select("likeCount")
      .lean();

    return res.status(200).json({
      success: true,
      liked,
      likeCount: updated?.likeCount || 0,
    });
  } catch (error) {
    console.error("TOGGLE LIKE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update the like.",
    });
  }
};

// Which of these articles this browser has liked
export const getLikedArticles = async (req, res) => {
  try {
    const visitorId = String(req.query.visitorId || "");

    if (!VISITOR_ID_PATTERN.test(visitorId)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const likes = await ArticleLike.find({ visitorId })
      .select("content")
      .lean();

    return res.status(200).json({
      success: true,
      data: likes.map((like) => String(like.content)),
    });
  } catch (error) {
    console.error("GET LIKED ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load likes.",
    });
  }
};

// When an article is deleted, its comments and likes go too.
// A failure here never undoes or blocks the article delete.
export const deleteFeedbackFor = async (contentId) => {
  try {
    await Promise.all([
      Comment.deleteMany({ content: contentId }),
      ArticleLike.deleteMany({ content: contentId }),
    ]);
  } catch (error) {
    console.error("DELETE FEEDBACK ERROR:", error);
  }
};
