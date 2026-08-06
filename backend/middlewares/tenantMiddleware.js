import { ROLES } from "../models/user.model.js";

export const attachTenantContext = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    req.shopId = req.body.shopId || req.query.shopId || null;
    req.isSuperAdmin = true;
    return next();
  }

  if (!req.user.shop) {
    return res.status(400).json({
      error: "No shop associated with this account",
    });
  }

  req.shopId = req.user.shop;
  req.isSuperAdmin = false;
  next();
};

export const validateShopAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  const requestedShopId =
    req.params.shopId || req.body.shopId || req.query.shopId;

  if (requestedShopId && requestedShopId !== req.user.shop?.toString()) {
    return res.status(403).json({
      error: "Forbidden: Cannot access another shop's data",
    });
  }

  next();
};
