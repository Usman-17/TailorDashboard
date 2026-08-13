import User from "../models/user.model.js";
import { verifyAccessToken } from "../utils/generateToken.js";

export const protectRoute = async (req, res, next) => {
  try {
    const impersonationToken = req.cookies.impersonation_token;
    const accessToken = req.cookies.access_token;

    if (!impersonationToken && !accessToken) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Impersonation mode: impersonation_token takes priority
    if (impersonationToken) {
      let decoded;
      try {
        decoded = verifyAccessToken(impersonationToken);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ error: "Impersonation session expired" });
        }
        return res.status(401).json({ error: "Invalid impersonation token" });
      }

      if (!decoded.impersonation || !decoded.impersonatorId) {
        return res.status(401).json({ error: "Invalid impersonation token" });
      }

      const targetUser = await User.findById(decoded.userId).select(
        "+loginAttempts +lockUntil",
      );

      if (!targetUser) {
        return res.status(401).json({ error: "Target user no longer exists" });
      }

      if (!targetUser.isActive) {
        return res
          .status(403)
          .json({ error: "Target account has been deactivated" });
      }

      // Load impersonator info
      const impersonator = await User.findById(decoded.impersonatorId).select(
        "fullName email role",
      );

      req.user = targetUser;
      req.isImpersonating = true;
      req.impersonator = impersonator
        ? {
            id: impersonator._id,
            fullName: impersonator.fullName,
            email: impersonator.email,
            role: impersonator.role,
          }
        : null;

      return next();
    }

    // Normal mode
    let decoded;
    try {
      decoded = verifyAccessToken(accessToken);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await User.findById(decoded.userId).select(
      "+loginAttempts +lockUntil",
    );

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    if (user.isLocked) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        error: `Account is locked. Try again in ${remainingTime} minute(s).`,
      });
    }

    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(
        user.passwordChangedAt.getTime() / 1000,
        10,
      );
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          error: "Password recently changed. Please log in again.",
        });
      }
    }

    req.user = user;
    req.isImpersonating = false;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
