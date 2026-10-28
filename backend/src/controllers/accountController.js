import { clerkClient } from "@clerk/express";

import User from "../models/User.js";
import MagazineContent from "../models/MagazineContent.js";

/*
=====================================================
LOGIN ACCOUNTS (CLERK)
=====================================================

Admin only. Lists every Clerk login, linked to its app
account in MongoDB where there is one, and deletes a
person's accounts: the login and the app account.

Their magazine submissions stay, with name, photos
and likes. Only the private contact details
inside them (phone number and e-mail) are cleared.
=====================================================
*/

const PAGE_SIZE = 50;

// Most accounts deleted in one go
const BULK_LIMIT = 100;

// Role filter value for logins without an app account
const NO_APP_ACCOUNT = "none";

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

// Every Clerk login, newest first
const fetchAllClerkUsers = async () => {
  const all = [];
  const limit = 500;

  for (let offset = 0; ; offset += limit) {
    const result = await clerkClient.users.getUserList({
      limit,
      offset,
      orderBy: "-created_at",
    });

    const batch = result.data || [];

    all.push(...batch);

    if (batch.length < limit) break;
  }

  return all;
};


/*
=====================================================
LIST
=====================================================

Role lives in MongoDB, not Clerk, so the two are joined
here before filtering and paging.
=====================================================
*/

export const listClerkUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const search = String(req.query.search || "").trim().toLowerCase();
    const role = String(req.query.role || "").trim();

    const clerkUsers = await fetchAllClerkUsers();

    const appUsers = await User.find({
      clerkUserId: { $in: clerkUsers.map((user) => user.id) },
    })
      .select("clerkUserId role department isActive")
      .lean();

    const appById = Object.fromEntries(
      appUsers.map((user) => [user.clerkUserId, user])
    );

    const rows = clerkUsers
      .map((user) => {
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
      })
      .filter((row) => {
        if (role === NO_APP_ACCOUNT && row.appAccount) return false;
        if (role && role !== NO_APP_ACCOUNT && row.appAccount?.role !== role) {
          return false;
        }

        return (
          !search ||
          `${row.name} ${row.email}`.toLowerCase().includes(search)
        );
      });

    // How many logins each role has, for the filter
    const roleCounts = {};

    clerkUsers.forEach((user) => {
      const key = appById[user.id]?.role || NO_APP_ACCOUNT;
      roleCounts[key] = (roleCounts[key] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      roleCounts,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: rows.length,
        allLogins: clerkUsers.length,
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
        .select("status")
        .lean()
    : [];

  return {
    clerkUser,
    appUser,
    contents,
    summary: {
      clerkUserId,
      name: clerkName(clerkUser) || appUser?.name || "",
      email: primaryEmail(clerkUser) || appUser?.email || "",
      hasLogin: Boolean(clerkUser),
      hasAppAccount: Boolean(appUser),
      role: appUser?.role || "",
      submissions: contents.length,
      published: contents.filter(
        (content) => content.status === "published"
      ).length,
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
DELETE ONE PERSON, KEEP THEIR SUBMISSIONS
=====================================================

Order: the login first, so nothing else changes if
Clerk refuses. Then the contact details inside their
submissions are cleared, then the app account goes.

Returns { ok, status, message, summary }.
=====================================================
*/

const deleteOneAccount = async (clerkUserId, actingClerkUserId) => {
  if (clerkUserId === actingClerkUserId) {
    return {
      ok: false,
      status: 400,
      message: "You cannot delete your own account.",
    };
  }

  const { clerkUser, appUser, contents, summary } =
    await findFootprint(clerkUserId);

  if (!clerkUser && !appUser) {
    return { ok: false, status: 404, message: "Account not found." };
  }

  if (appUser?.role === "admin" && appUser.isActive) {
    const activeAdmins = await User.countDocuments({
      role: "admin",
      isActive: true,
    });

    if (activeAdmins <= 1) {
      return {
        ok: false,
        status: 400,
        message: "The last active admin cannot be deleted.",
        summary,
      };
    }
  }

  // ---- 1. login
  if (clerkUser) {
    try {
      await clerkClient.users.deleteUser(clerkUserId);
    } catch (error) {
      if (clerkStatus(error) !== 404) {
        console.error("CLERK DELETE ERROR:", error);

        return {
          ok: false,
          status: 500,
          message: "Clerk could not delete the login. Nothing else was deleted.",
          summary,
        };
      }
    }
  }

  // ---- 2. submissions stay; private contact details go
  if (contents.length) {
    await MagazineContent.updateMany(
      { _id: { $in: contents.map((content) => content._id) } },
      {
        $set: {
          "submittedBy.email": "",
          "student.phone": "",
        },
      }
    );
  }

  // ---- 3. app account
  if (appUser) {
    await User.deleteOne({ _id: appUser._id });
  }

  return {
    ok: true,
    status: 200,
    message: `${summary.name || summary.email || "Account"} deleted. Their ${summary.submissions} submission(s) are kept.`,
    summary,
  };
};

export const deleteAccountCompletely = async (req, res) => {
  try {
    const result = await deleteOneAccount(
      req.params.clerkUserId,
      req.clerkUserId
    );

    return res.status(result.status).json({
      success: result.ok,
      message: result.message,
      data: result.summary,
    });
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Deleting stopped part-way. Check the account again before retrying.",
    });
  }
};


/*
=====================================================
SEVERAL AT ONCE
=====================================================

One by one, so the "last admin" and "not yourself"
rules hold for each. Reports what happened to each.
=====================================================
*/

export const getBulkFootprint = async (req, res) => {
  try {
    const ids = [...new Set((req.body.clerkUserIds || []).map(String))];

    if (ids.length === 0 || ids.length > BULK_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Select between 1 and ${BULK_LIMIT} accounts.`,
      });
    }

    const summaries = [];

    for (const id of ids) {
      summaries.push((await findFootprint(id)).summary);
    }

    return res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    console.error("BULK FOOTPRINT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check the selected accounts.",
    });
  }
};

export const deleteAccountsBulk = async (req, res) => {
  try {
    const ids = [...new Set((req.body.clerkUserIds || []).map(String))];

    if (ids.length === 0 || ids.length > BULK_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Select between 1 and ${BULK_LIMIT} accounts.`,
      });
    }

    const results = [];

    for (const id of ids) {
      try {
        const result = await deleteOneAccount(id, req.clerkUserId);

        results.push({
          clerkUserId: id,
          ok: result.ok,
          message: result.message,
          name: result.summary?.name || result.summary?.email || id,
        });
      } catch (error) {
        console.error("BULK DELETE ACCOUNT ERROR:", id, error);

        results.push({
          clerkUserId: id,
          ok: false,
          message: "Deleting stopped part-way for this account.",
          name: id,
        });
      }
    }

    const deleted = results.filter((result) => result.ok).length;

    return res.status(200).json({
      success: true,
      message: `${deleted} of ${ids.length} account(s) deleted. Their submissions are kept.`,
      deleted,
      failed: results.filter((result) => !result.ok),
    });
  } catch (error) {
    console.error("BULK DELETE ACCOUNTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Bulk delete failed.",
    });
  }
};
