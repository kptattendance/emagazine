import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

import { DEPARTMENTS } from "../config/departments.js";

const ADMIN_CREATED_ROLES = [
  "admin",
  "hod",
  "principal",
  "staff",
  "mag_coordinator",
];

const ALL_ROLES = [
  "admin",
  "hod",
  "principal",
  "staff",
  "mag_coordinator",
  "student",
];

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export const createUser = async (req, res) => {
  let clerkUser = null;
  let mongoUser = null;

  try {
    const {
      name,
      email,
      phone,
      role,
      department,
      isActive = true,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required.",
      });
    }

    if (!department || !DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        success: false,
        message: "Valid department is required.",
      });
    }

    if (!ADMIN_CREATED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Student accounts must be created through the Student module.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || "";
    const cleanDepartment = department.trim();

    const existingMongoUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingMongoUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists in MongoDB.",
      });
    }

    const { firstName, lastName } = splitName(cleanName);

    const clerkCreateData = {
      emailAddress: [cleanEmail],
      firstName,
      lastName,
      publicMetadata: {
        role: role,
      },
      skipPasswordRequirement: true,
    };

    if (!isActive) {
      clerkCreateData.banned = true;
    }

    clerkUser = await clerkClient.users.createUser(
      clerkCreateData
    );

    mongoUser = await User.create({
      clerkUserId: clerkUser.id,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role,
      department: cleanDepartment,
      isActive: Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      message:
        "User created successfully in Clerk and MongoDB.",
      data: {
        _id: mongoUser._id,
        clerkUserId: mongoUser.clerkUserId,
        name: mongoUser.name,
        email: mongoUser.email,
        phone: mongoUser.phone,
        role: mongoUser.role,
        department: mongoUser.department,
        isActive: mongoUser.isActive,
      },
    });
  } catch (error) {
    console.error(
      "CREATE USER ERROR:",
      error
    );

    if (
      clerkUser?.id &&
      !mongoUser
    ) {
      try {
        await clerkClient.users.deleteUser(
          clerkUser.id
        );
      } catch (rollbackError) {
        console.error(
          "CLERK ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    if (error?.errors?.length) {
      const clerkError =
        error.errors[0];

      console.error(
        "CLERK ERROR DETAILS:",
        error.errors
      );

      return res.status(400).json({
        success: false,
        message:
          clerkError?.longMessage ||
          clerkError?.message ||
          "Clerk could not create the user.",
      });
    }

    if (error?.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: duplicateField
          ? `A user with the same ${duplicateField} already exists.`
          : "A user with the same information already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create user.",
    });
  }
};

export const createMyUser = async (
  req,
  res
) => {
  try {
    const { department } = req.body;

    const clerkUserId =
      req.clerkUserId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Clerk authentication required.",
      });
    }

    const existingUser =
      await User.findOne({
        clerkUserId,
      });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message:
          "User already exists.",
        data: existingUser,
      });
    }

    const clerkUser =
      await clerkClient.users.getUser(
        clerkUserId
      );

    const name =
      clerkUser.fullName ||
      [
        clerkUser.firstName,
        clerkUser.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    const email =
      clerkUser.primaryEmailAddress
        ?.emailAddress ||
      clerkUser.emailAddresses?.[0]
        ?.emailAddress ||
      "";

    const phone =
      clerkUser.primaryPhoneNumber
        ?.phoneNumber ||
      clerkUser.phoneNumbers?.[0]
        ?.phoneNumber ||
      "";

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          "Name is missing from the Clerk account.",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email is missing from the Clerk account.",
      });
    }

    const mongoUser =
      await User.create({
        clerkUserId,
        name,
        email:
          email.toLowerCase(),
        phone,
        role: "student",
        department:
          department &&
          DEPARTMENTS.includes(department)
            ? department
            : undefined,
        isActive: true,
      });

    return res.status(201).json({
      success: true,
      message:
        "Application user created successfully.",
      data: mongoUser,
    });
  } catch (error) {
    console.error(
      "CREATE MY USER ERROR:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Application user already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create application user.",
    });
  }
};

export const getMyUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findOne({
        clerkUserId:
          req.clerkUserId,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Application user not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account is inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "GET MY USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user.",
    });
  }
};

export const getAllUsers = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      role = "",
      isActive = "",
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );

    const currentLimit =
      Math.min(
        Math.max(
          Number(limit) || 20,
          1
        ),
        100
      );

    const query = {};

    if (search.trim()) {
      const regex =
        new RegExp(
          search.trim(),
          "i"
        );

      query.$or = [
        {
          name: regex,
        },
        {
          email: regex,
        },
        {
          phone: regex,
        },
        {
          clerkUserId: regex,
        },
      ];
    }

    if (
      role &&
      ALL_ROLES.includes(role)
    ) {
      query.role = role;
    }

    if (isActive === "true") {
      query.isActive = true;
    }

    if (isActive === "false") {
      query.isActive = false;
    }

    const skip =
      (currentPage - 1) *
      currentLimit;

    const [
      users,
      totalUsers,
    ] = await Promise.all([
      User.find(query)
        .select("-__v")
        .sort({
          name: 1,
        })
        .skip(skip)
        .limit(currentLimit)
        .lean(),

      User.countDocuments(
        query
      ),
    ]);

    const totalPages =
      Math.ceil(
        totalUsers /
          currentLimit
      );

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        totalUsers,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET ALL USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch users.",
    });
  }
};

export const getUserById = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "GET USER BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user.",
    });
  }
};

export const updateMyUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findOne({
        clerkUserId:
          req.clerkUserId,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Application user not found.",
      });
    }

    const {
      name,
      phone,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty.",
        });
      }

      user.name =
        name.trim();
    }

    if (phone !== undefined) {
      user.phone =
        phone.trim();
    }

    await user.save();

    if (name !== undefined) {
      const {
        firstName,
        lastName,
      } = splitName(
        user.name
      );

      await clerkClient.users.updateUser(
        user.clerkUserId,
        {
          firstName,
          lastName,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "UPDATE MY USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile.",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const {
      name,
      phone,
      role,
      department,
      isActive,
    } = req.body;

    if (
      role !== undefined &&
      !ALL_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    if (
      department !== undefined &&
      !DEPARTMENTS.includes(department)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid department.",
      });
    }

    if (
      user.role === "admin" &&
      role !== undefined &&
      role !== "admin"
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be changed to another role.",
        });
      }
    }

    if (
      user.role === "admin" &&
      isActive === false
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be deactivated.",
        });
      }
    }

    if (name !== undefined) {
      const cleanName = String(name).trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = cleanName;
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (department !== undefined) {
      user.department = department;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User details updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "UPDATE USER ERROR:",
      error
    );

    if (error?.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0];

      return res.status(409).json({
        success: false,
        message: duplicateField
          ? `Another user already uses this ${duplicateField}.`
          : "Another user already uses the same information.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
    });
  }
};

export const updateUserRole = async (
  req,
  res
) => {
  try {
    const {
      role,
    } = req.body;

    if (!ALL_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role.",
      });
    }

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (
      user.role === "admin" &&
      role !== "admin"
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be changed.",
        });
      }
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "User role updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "UPDATE USER ROLE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update user role.",
    });
  }
};

export const toggleUserStatus = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    if (
      req.user &&
      String(user._id) ===
        String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own account status.",
      });
    }

    const newStatus =
      !user.isActive;

    if (
      user.role === "admin" &&
      user.isActive &&
      !newStatus
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be deactivated.",
        });
      }
    }

    user.isActive =
      newStatus;

    await user.save();

    if (newStatus) {
      await clerkClient.users.unbanUser(
        user.clerkUserId
      );
    } else {
      await clerkClient.users.banUser(
        user.clerkUserId
      );
    }

    return res.status(200).json({
      success: true,
      message: newStatus
        ? "User activated successfully."
        : "User deactivated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "TOGGLE USER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to change user status.",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      req.user &&
      String(user._id) === String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    if (user.role === "admin" && user.isActive) {
      const adminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be deleted.",
        });
      }
    }

    if (user.clerkUserId) {
      try {
        await clerkClient.users.deleteUser(
          user.clerkUserId
        );
      } catch (clerkError) {
        console.error(
          "CLERK DELETE ERROR:",
          clerkError
        );

        const clerkStatus =
          clerkError?.status ||
          clerkError?.statusCode;

        if (clerkStatus !== 404) {
          return res.status(500).json({
            success: false,
            message:
              "Failed to delete user from Clerk. MongoDB user was not deleted.",
          });
        }
      }
    }

    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message:
        "User deleted successfully from Clerk and MongoDB.",
      data: {
        _id: user._id,
        clerkUserId: user.clerkUserId,
      },
    });
  } catch (error) {
    console.error(
      "DELETE USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete user.",
    });
  }
};

export const deleteMultipleUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one user.",
      });
    }

    const uniqueUserIds = [
      ...new Set(
        userIds.map((id) => String(id))
      ),
    ];

    const users = await User.find({
      _id: { $in: uniqueUserIds },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found.",
      });
    }

    const currentUserId =
      req.user?._id
        ? String(req.user._id)
        : null;

    const tryingToDeleteSelf = users.some(
      (user) =>
        String(user._id) === currentUserId
    );

    if (tryingToDeleteSelf) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account. Remove yourself from the selection.",
      });
    }

    const selectedActiveAdmins = users.filter(
      (user) =>
        user.role === "admin" &&
        user.isActive
    ).length;

    if (selectedActiveAdmins > 0) {
      const totalActiveAdmins =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (
        totalActiveAdmins -
          selectedActiveAdmins <
        1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one active admin must remain. Remove the admin account from the selection.",
        });
      }
    }

    const clerkErrors = [];

    for (const user of users) {
      if (!user.clerkUserId) {
        continue;
      }

      try {
        await clerkClient.users.deleteUser(
          user.clerkUserId
        );
      } catch (clerkError) {
        const clerkStatus =
          clerkError?.status ||
          clerkError?.statusCode;

        if (clerkStatus === 404) {
          continue;
        }

        console.error(
          `Failed to delete Clerk user ${user.clerkUserId}:`,
          clerkError
        );

        clerkErrors.push({
          userId: user._id,
          name: user.name,
          message:
            clerkError?.message ||
            "Failed to delete Clerk account.",
        });
      }
    }

    if (clerkErrors.length > 0) {
      return res.status(500).json({
        success: false,
        message:
          "Some users could not be deleted from Clerk. MongoDB records were kept.",
        errors: clerkErrors,
      });
    }

    const deleteResult =
      await User.deleteMany({
        _id: {
          $in: users.map(
            (user) => user._id
          ),
        },
      });

    return res.status(200).json({
      success: true,
      message:
        `${deleteResult.deletedCount} user(s) deleted successfully from Clerk and MongoDB.`,
      deletedCount:
        deleteResult.deletedCount,
    });
  } catch (error) {
    console.error(
      "DELETE MULTIPLE USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete selected users.",
    });
  }
};

export const restoreUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    user.isActive = true;

    await user.save();

    await clerkClient.users.unbanUser(
      user.clerkUserId
    );

    return res.status(200).json({
      success: true,
      message:
        "User restored successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "RESTORE USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to restore user.",
    });
  }
};