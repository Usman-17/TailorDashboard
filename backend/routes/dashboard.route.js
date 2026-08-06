import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  getDashboardStats,
  getChartData,
  getRecentOrders,
  getUpcomingDeliveries,
  getLatestCustomers,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/stats", getDashboardStats);
router.get("/charts", getChartData);
router.get("/recent-orders", getRecentOrders);
router.get("/upcoming-deliveries", getUpcomingDeliveries);
router.get("/latest-customers", getLatestCustomers);

export default router;
