import express from "express";

import {
  createUser,
  createMyUser,
  getMyUser,
  getAllUsers,
  getUserById,
  updateMyUser,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  restoreUser,
  deleteMultipleUsers,
} from "../controllers/userController.js";

import {
  deleteAccountCompletely,
  deleteAccountsBulk,
  getAccountFootprint,
  getBulkFootprint,
  listClerkUsers,
} from "../controllers/accountController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// MY USER PROFILE
// =====================================================

// Get logged-in user's MongoDB profile
router.get(
  "/me",
  requireAuth,
  getMyUser
);

// Create MongoDB user profile for first-time Clerk user
router.post(
  "/me",
  requireAuth,
  createMyUser
);

// Update logged-in user's own basic information
router.put(
  "/me",
  requireAuth,
  updateMyUser
);

// =====================================================
// ADMIN USER MANAGEMENT
// =====================================================

// Login accounts in Clerk, and deleting a person completely
router.get(
  "/clerk",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  listClerkUsers
);

router.get(
  "/clerk/:clerkUserId/footprint",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  getAccountFootprint
);

router.post(
  "/clerk/bulk-footprint",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  getBulkFootprint
);

router.post(
  "/clerk/bulk-delete",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  deleteAccountsBulk
);

router.delete(
  "/clerk/:clerkUserId",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  deleteAccountCompletely
);

// Create a user manually
router.post(
  "/",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  createUser
);

// Get all users
router.get(
  "/",
  requireAuth,
  resolveUser,
  requireRole("admin", "sports_officer"),
  getAllUsers
);

// Get specific user
router.get(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole("admin", "sports_officer"),
  getUserById
);

// Update user
router.put(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole("admin", "sports_officer"),
  updateUser
);

// Change role
router.patch(
  "/:id/role",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  updateUserRole
);

// Activate / deactivate
router.patch(
  "/:id/status",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  toggleUserStatus
);

// Safe delete = deactivate
router.delete(
  "/:id",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  deleteUser
);

// Restore deactivated user
router.patch(
  "/:id/restore",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  restoreUser
);


router.post(
  "/bulk-delete",
  requireAuth,
  resolveUser,
  requireRole("admin"),
  deleteMultipleUsers
);
export default router;