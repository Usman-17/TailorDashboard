import { ROLES } from "../models/user.model.js";

const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.STAFF],
  [ROLES.OWNER]: [ROLES.OWNER, ROLES.STAFF],
  [ROLES.STAFF]: [ROLES.STAFF],
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};

export const authorizeHierarchy = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userEffectiveRoles = ROLE_HIERARCHY[req.user.role] || [];
    const hasAccess = allowedRoles.some((role) =>
      userEffectiveRoles.includes(role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};

export const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  if (req.user.role === ROLES.OWNER && req.user.shop) {
    return next();
  }

  return res.status(403).json({
    error: "Forbidden: Owner or Admin access required",
  });
};
