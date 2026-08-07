import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { getAdminReports } from "../controllers/reports.controller.js";

const router = express.Router();

router.use(protectRoute, (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

router.get("/", getAdminReports);

export default router;
