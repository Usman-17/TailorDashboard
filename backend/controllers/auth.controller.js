import User, { ROLES } from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import {
  generateAccessToken,
  generateRefreshToken,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  verifyRefreshToken,
} from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5");
const LOCK_TIME = parseInt(process.env.LOCK_TIME || "900000");

const signTokens = (user, res, req) => {
  const accessToken = generateAccessToken(
    user._id,
    user.role,
    user.shop || null
  );
  const refreshToken = generateRefreshToken(user._id);

  setAccessCookie(accessToken, res);
  setRefreshCookie(refreshToken, res);

  user.addRefreshToken(refreshToken, req);
  user.lastLogin = new Date();
  user.cleanExpiredRefreshTokens();

  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

// POST /api/auth/seed-super-admin (RUN ONCE - called from index.js or manually)
export const seedSuperAdmin = async (req, res) => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      if (res) {
        return res.status(400).json({ error: "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env" });
      }
      return null;
    }

    const fullName = "Super Admin";
    const mobile = "03000000000";

    const existing = await User.findOne({ email });
    if (existing) {
      if (res) {
        return res.status(200).json({ message: "Super Admin already exists" });
      }
      return existing;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await User.create({
      fullName,
      email,
      mobile,
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
      shop: null,
    });

    console.log(`Super Admin created: ${email}`);

    if (res) {
      return res.status(201).json({
        message: "Super Admin account created",
        user: sanitizeUser(admin),
      });
    }
    return admin;
  } catch (error) {
    console.error("Error seeding Super Admin:", error.message);
    if (res) {
      return res.status(500).json({ error: "Failed to seed Super Admin" });
    }
    return null;
  }
};

// POST /api/auth/create-owner (Super Admin only)
export const createOwner = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      mobile,
      shopName,
      shopPhone,
      shopEmail,
    } = req.body;

    if (!fullName || !email || !password || !mobile || !shopName) {
      return res.status(400).json({
        error: "fullName, email, password, mobile, and shopName are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid owner email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    if (mobile.length !== 11) {
      return res
        .status(400)
        .json({ error: "Mobile number must be 11 digits" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(409).json({
        error:
          existingUser.email === email
            ? "Email is already taken"
            : "Phone number is already taken",
      });
    }

    if (shopEmail) {
      const existingShop = await Shop.findOne({ email: shopEmail });
      if (existingShop) {
        return res.status(409).json({
          error: "A shop with this email already exists",
        });
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const session = await User.startSession();
    session.startTransaction();

    try {
      const users = await User.create(
        [
          {
            fullName,
            email,
            mobile,
            password: hashedPassword,
            role: ROLES.OWNER,
          },
        ],
        { session }
      );

      const user = users[0];

      const shops = await Shop.create(
        [
          {
            name: shopName,
            owner: user._id,
            phone: shopPhone || mobile,
            email: shopEmail || `${email.split("@")[0]}-shop@tailor.local`,
          },
        ],
        { session }
      );

      user.shop = shops[0]._id;
      await user.save({ session });

      await session.commitTransaction();

      const populated = await user.populate("shop", "name slug");

      return res.status(201).json({
        message: "Owner account and shop created successfully",
        user: sanitizeUser(populated),
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error in createOwner:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `A record with this ${field} already exists`,
      });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/auth/create-staff (Owner only)
export const createStaff = async (req, res) => {
  try {
    const { fullName, email, password, mobile } = req.body;

    if (!fullName || !email || !password || !mobile) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    if (!req.user.shop) {
      return res.status(400).json({ error: "No shop associated with account" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(409).json({
        error:
          existingUser.email === email
            ? "Email is already taken"
            : "Phone number is already taken",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const staff = await User.create({
      fullName,
      email,
      mobile,
      password: hashedPassword,
      role: ROLES.STAFF,
      shop: req.user.shop,
    });

    res.status(201).json({
      user: sanitizeUser(staff),
    });
  } catch (error) {
    console.error("Error in createStaff:", error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A user with this email or phone already exists",
      });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select(
      "+password +loginAttempts +lockUntil"
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        error: `Account is locked. Try again in ${remainingTime} minute(s).`,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
      }

      await user.save();
      return res.status(400).json({ error: "Invalid email or password" });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;

    signTokens(user, res, req);
    await user.save();

    res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/auth/refresh
export const refreshTokenController = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;

    if (!token) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId).select(
      "+loginAttempts +lockUntil"
    );

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "User no longer exists" });
    }

    if (!user.isActive) {
      clearAuthCookies(res);
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    const storedToken = user.refreshTokens.find((rt) => rt.token === token);
    if (!storedToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Refresh token not recognized" });
    }

    user.removeRefreshToken(token);

    signTokens(user, res, req);
    await user.save();

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Error in refreshToken controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;

    if (token && req.user) {
      req.user.removeRefreshToken(token);
      await req.user.save();
    }

    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/auth/logout-all
export const logoutAll = async (req, res) => {
  try {
    req.user.refreshTokens = [];
    await req.user.save();

    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error("Error in logoutAll controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/auth/user
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -refreshTokens -loginAttempts -lockUntil")
      .populate("shop", "name slug settings isActive logo");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUser controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/auth/profile/update
export const updateProfile = async (req, res) => {
  try {
    const { fullName, mobile, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentPassword && newPassword) {
      const isPasswordMatched = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordMatched) {
        return res
          .status(400)
          .json({ error: "Current password is incorrect" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: "New password must be at least 8 characters long",
        });
      }

      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
      user.passwordChangedAt = Date.now();
    } else if (currentPassword || newPassword) {
      return res.status(400).json({
        error:
          "Both current password and new password must be provided to change the password",
      });
    }

    if (fullName) user.fullName = fullName;
    if (mobile) user.mobile = mobile;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Error in updateProfile:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/auth/staff (owner only)
export const getAllStaff = async (req, res) => {
  try {
    if (!req.user.shop) {
      return res.status(400).json({ error: "No shop associated with account" });
    }

    const staff = await User.find({
      shop: req.user.shop,
      role: ROLES.STAFF,
    }).select("-password -refreshTokens -loginAttempts -lockUntil");

    res.status(200).json(staff);
  } catch (error) {
    console.error("Error in getAllStaff controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/auth/staff/:id (owner only)
export const removeStaff = async (req, res) => {
  try {
    if (!req.user.shop) {
      return res.status(400).json({ error: "No shop associated with account" });
    }

    const staff = await User.findOne({
      _id: req.params.id,
      shop: req.user.shop,
      role: ROLES.STAFF,
    });

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Staff member removed successfully" });
  } catch (error) {
    console.error("Error in removeStaff controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = await user.createPasswordResetToken();
    await user.save();

    const resetURL = `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>Hi ${user.fullName},</p>
        <p>Please click the button below to reset your password. This link will expire in 15 minutes:</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/reset-password/${token}" 
             style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thank you,<br>Your Team</p>
      </div>
    </body>
    </html>
    `;

    await sendEmail({
      to: email,
      subject: "Tailor Dashboard Password Reset Request",
      text: `Hi ${user.fullName}, please follow this link to reset your password.`,
      html: resetURL,
    });

    res.status(200).json({
      success: true,
      message: `Password reset email sent to ${user.email}. Check your inbox.`,
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters long.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res
        .status(400)
        .json({ error: "Token expired or invalid, please try again." });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = Date.now();
    user.refreshTokens = [];

    await user.save();

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error.message);
    res.status(500).json({ error: error.message });
  }
};
