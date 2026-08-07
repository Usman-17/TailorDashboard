import mongoose from "mongoose";
import crypto from "crypto";

const ROLES = {
  SUPER_ADMIN: "super_admin",
  OWNER: "owner",
  STAFF: "staff",
};

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      minlength: 11,
      maxlength: 11,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.OWNER,
    },

    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshTokens: [refreshTokenSchema],

    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      select: false,
    },

    lastLogin: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

userSchema.methods.addRefreshToken = function (token, req) {
  const MAX_REFRESH_TOKENS = 5;

  this.refreshTokens.push({
    token,
    userAgent: req?.get?.("user-agent") || "unknown",
    ip: req?.ip || "unknown",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  if (this.refreshTokens.length > MAX_REFRESH_TOKENS) {
    this.refreshTokens = this.refreshTokens.slice(-MAX_REFRESH_TOKENS);
  }
};

userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
};

userSchema.methods.cleanExpiredRefreshTokens = function () {
  this.refreshTokens = this.refreshTokens.filter(
    (rt) => rt.expiresAt > new Date()
  );
};

userSchema.index({ role: 1, shop: 1 });

const User = mongoose.model("User", userSchema);

export { ROLES };
export default User;
