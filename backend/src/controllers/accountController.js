import { clerkClient } from "@clerk/express";

import User from "../models/User.js";
import MagazineContent from "../models/MagazineContent.js";
import Comment from "../models/Comment.js";
import ArticleLike from "../models/ArticleLike.js";

import { deleteImage } from "../config/storage.js";
import { deleteFeedbackFor } from "./feedbackController.js";

/*
=====================================================
LOGIN ACCOUNTS (CLERK)
=====================================================

Admin only. Lists every Clerk login, linked to its app
account in MongoDB where there is one, and deletes a
person completely: login, app account, their magazine
submissions, the photos of those submissions, and the
comments and likes on them.
=====================================================
*/

const PAGE_SIZE = 50;

const clerkStatus = (error) =>
  error?.status || error?.statusCode;

const primaryEmail = (clerkUser) =>
  clerkUser?.primaryEmailAddress?.emailAddress ||
  clerkUser?.emailAddresses?.[0]?.emailAddress ||
  "";

const clerkName = (clerkUser) =>
  clerkUser?.fullName ||
  [clerkUser?.firstName, clerkUser?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();


/*
=====================================================
LIST
=====================================================
*/

export const listClerkUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const search = String(req.query.search || "").trim();

    const result = await clerkClient.users.getUserList({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      orderBy: "-created_at",
      ...(search && { query: search }),
    });

    const clerkUsers = result.data || [];

    const appUsers = await User.find({
      clerkUserId: { $in: clerkUsers.map((user) => user.id) },
    })
      .select("clerkUserId role department isActive")
      .lean();

    const appById = Object.fromEntries(
      appUsers.map((user) => [user.clerkUserId, user])
    );

    return res.status(200).json({
      success: true,
      data: clerkUsers.map((user) => {
        const app = appById[user.id];

        return {
          clerkUserId: user.id,
          name: clerkName(user),
          email: primaryEmail(user),
          imageUrl: user.imageUrl || "",
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
          banned: Boolean(user.banned),
          appAccount: app
            ? {
                role: app.role,
                department: app.department || "",
                isActive: app.isActive,
              }
            : null,
        };
      }),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: result.totalCount ?? clerkUsers.length,
      },
    });
  } catch (error) {
    console.error("LIST CLERK USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load login accounts.",
    });
  }
};


/*
=====================================================
WHAT BELONGS TO A PERSON
=====================================================
*/

const findFootprint = async (clerkUserId) => {
  let clerkUser = null;

  try {
    clerkUser = await clerkClient.users.getUser(clerkUserId);
  } catch (error) {
    if (clerkStatus(error) !== 404) throw error;
  }

  const appUser = await User.findOne({ clerkUserId });

  // Submissions are linked by e-mail; a login can have several
  const emails = [
    ...(clerkUser?.emailAddresses || []).map(
      (item) => item.emailAddress
    ),
    appUser?.email,
  ]
    .filter(Boolean)
    .map((email) => email.trim().toLowerCase());

  const uniqueEmails = [...new Set(emails)];

  const contents = uniqueEmails.length
    ? await MagazineContent.find({
        "submittedBy.email": { $in: uniqueEmails },
      })
        .select("title status eventPhoto student.photo faculty.photo")
        .lean()
    : [];

  const contentIds = contents.map((content) => content._id);

  const photos = contents.flatMap((content) =>
    [
      content.eventPhoto,
      content.student?.photo,
      content.faculty?.photo,
    ].filter(Boolean)
  );

  const [comments, likes] = await Promise.all([
    Comment.countDocuments({ content: { $in: contentIds } }),
    ArticleLike.countDocuments({ content: { $in: contentIds } }),
  ]);

  return {
    clerkUser,
    appUser,
    contents,
    photos,
    summary: {
      name: clerkName(clerkUser) || appUser?.name || "",
      email: primaryEmail(clerkUser) || appUser?.email || "",
      hasLogin: Boolean(clerkUser),
      hasAppAccount: Boolean(appUser),
      role: appUser?.role || "",
      submissions: contents.length,
      published: contents.filter(
        (content) => content.status === "published"
      ).length,
      photos: photos.length,
      comments,
      likes,
    },
  };
};

export const getAccountFootprint = async (req, res) => {
  try {
    const { summary } = await findFootprint(req.params.clerkUserId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("ACCOUNT FOOTPRINT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check this account.",
    });
  }
};


/*
=====================================================
DELETE EVERYTHING
=====================================================

Order: the login first, so nothing else is removed if
Clerk refuses. Then submissions with their photos,
comments and likes, then the app account.
=====================================================
*/

export const deleteAccountCompletely = async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    if (clerkUserId === req.clerkUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const footprint = await findFootprint(clerkUserId);
    const { clerkUser, appUser, contents, photos, summary } = footprint;

    if (!clerkUser && !appUser) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (appUser?.role === "admin" && appUser.isActive) {
      const activeAdmins = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: "The last active admin cannot be deleted.",
        });
      }
    }

    // ---- 1. login
    if (clerkUser) {
      try {
        await clerkClient.users.deleteUser(clerkUserId);
      } catch (error) {
        if (clerkStatus(error) !== 404) {
          console.error("CLERK DELETE ERROR:", error);

          return res.status(500).json({
            success: false,
            message:
              "Clerk could not delete the login. Nothing else was deleted.",
          });
        }
      }
    }

    // ---- 2. photos (a failed photo delete is logged, not fatal)
    for (const url of photos) {
      await deleteImage(url);
    }

    // ---- 3. submissions with their comments and likes
    for (const content of contents) {
      await deleteFeedbackFor(content._id);
    }

    await MagazineContent.deleteMany({
      _id: { $in: contents.map((content) => content._id) },
    });

    // ---- 4. app account
    if (appUser) {
      await User.deleteOne({ _id: appUser._id });
    }

    return res.status(200).json({
      success: true,
      message: `${summary.name || summary.email || "Account"} deleted completely.`,
      data: summary,
    });
  } catch (error) {
    console.error("DELETE ACCOUNT COMPLETELY ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Deleting stopped part-way. Check the account again before retrying.",
    });
  }
};
