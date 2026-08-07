import express from "express";
const router = express.Router();

import {
  seedSuperAdmin,
  createSuperAdmin,
  createOwner,
  createStaff,
  login,
  logout,
  logoutAll,
  refreshTokenController,
  getUser,
  updateProfile,
  getAllStaff,
  removeStaff,
  forgotPassword,
  resetPassword,
  updateUserStatus,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { authorize, isOwnerOrAdmin } from "../middlewares/roleMiddleware.js";

// Public routes
router.post("/login", login);
router.post("/refresh", refreshTokenController);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Super Admin only
router.post(
  "/create-super-admin",
  protectRoute,
  authorize("super_admin"),
  createSuperAdmin,
);
router.post(
  "/create-owner",
  protectRoute,
  authorize("super_admin"),
  createOwner,
);
router.post("/seed-admin", seedSuperAdmin);

// Protected routes (all authenticated users)
router.post("/logout", protectRoute, logout);
router.post("/logout-all", protectRoute, logoutAll);
router.get("/user", protectRoute, getUser);
router.put("/profile/update", protectRoute, updateProfile);

// Staff management (Owner or Super Admin only)
router.post("/create-staff", protectRoute, isOwnerOrAdmin, createStaff);
router.get("/staff", protectRoute, isOwnerOrAdmin, getAllStaff);
router.delete("/staff/:id", protectRoute, isOwnerOrAdmin, removeStaff);

// Super Admin: list all users
router.get(
  "/admin/users",
  protectRoute,
  authorize("super_admin"),
  async (req, res) => {
    try {
      const User = (await import("../models/user.model.js")).default;
      const users = await User.find()
        .select("-password -refreshTokens -loginAttempts -lockUntil")
        .populate("shop", "name slug");
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// Super Admin: update user status
router.put(
  "/admin/users/:id/status",
  protectRoute,
  authorize("super_admin"),
  updateUserStatus,
);

export default router;
