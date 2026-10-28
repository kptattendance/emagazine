import MagazineContent from "../models/MagazineContent.js";

// Needed for the category names of the articles
import "../models/Activity.js";

import {
  DEPARTMENTS,
  departmentAliases,
  normalizeDepartment,
} from "../config/departments.js";

/*
=====================================================
MONTHLY ISSUE (PDF DATA)
=====================================================

Admin and institute coordinator: the whole institute,
or one department.
HOD: their own department only.
=====================================================
*/

const getRole = (user) =>
  String(user?.role || "").toLowerCase();

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const getMonthlyIssue = async (req, res) => {
  try {
    const role = getRole(req.user);

    if (!["admin", "mag_coordinator", "hod"].includes(role)) {
      return res.status(403).json({
        success: false,
        message:
          "Only the admin, institute coordinator or HOD can download the monthly issue.",
      });
    }

    const match = String(req.query.month || "").match(MONTH_PATTERN);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Please choose a month.",
      });
    }

    const year = Number(match[1]);
    const month = Number(match[2]);

    // HODs always get their own department
    let department =
      role === "hod"
        ? normalizeDepartment(req.user.department)
        : normalizeDepartment(req.query.department);

    if (role === "hod" && !department) {
      return res.status(400).json({
        success: false,
        message: "Department is not assigned to this HOD.",
      });
    }

    if (department && !DEPARTMENTS.includes(department)) {
      department = "";
    }

    const filter = {
      status: "published",
      eventDate: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      },
    };

    if (department) {
      filter.department = { $in: departmentAliases(department) };
    }

    const articles = await MagazineContent.find(filter)
      .select(
        "-student.phone -submittedBy.email -approvedBy -rejectionReason -likeCount -commentCount"
      )
      .populate("activity", "name type")
      .sort({ department: 1, eventDate: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      month: `${match[1]}-${match[2]}`,
      department,
      data: articles,
    });
  } catch (error) {
    console.error("GET MONTHLY ISSUE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load the monthly issue.",
    });
  }
};


/*
=====================================================
MONTHS THAT HAVE PUBLISHED CONTENT
=====================================================
*/

export const getIssueMonths = async (req, res) => {
  try {
    const months = await MagazineContent.aggregate([
      { $match: { status: "published", eventDate: { $ne: null } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$eventDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: months.map((item) => ({
        month: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("GET ISSUE MONTHS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load months.",
    });
  }
};


/*
=====================================================
IMAGE PASS-THROUGH (for building the PDF)
=====================================================

The PDF is built in the browser, which may not read
images straight from the R2 bucket. This passes images
through, but only from the magazine's own storage.
=====================================================
*/

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const allowedImageUrl = (value) => {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return false;

    const r2 = process.env.R2_PUBLIC_URL
      ? new URL(process.env.R2_PUBLIC_URL)
      : null;

    return (
      (r2 && url.host === r2.host) ||
      url.host === "res.cloudinary.com"
    );
  } catch (error) {
    return false;
  }
};

export const getIssueImage = async (req, res) => {
  try {
    const role = getRole(req.user);

    if (!["admin", "mag_coordinator", "hod"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed.",
      });
    }

    const url = String(req.query.url || "");

    if (!allowedImageUrl(url)) {
      return res.status(400).json({
        success: false,
        message: "Image not allowed.",
      });
    }

    const response = await fetch(url, { redirect: "error" });

    const type = response.headers.get("content-type") || "";

    if (!response.ok || !type.startsWith("image/")) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(413).json({
        success: false,
        message: "Image too large.",
      });
    }

    res.set("Content-Type", type);
    res.set("Cache-Control", "private, max-age=3600");

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("GET ISSUE IMAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load the image.",
    });
  }
};
