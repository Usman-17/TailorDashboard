import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import {
  getTailorStats,
  getTailorCharts,
  getTailorRecentOrders,
  getTailorUpcomingDeliveries,
  getTailorLatestCustomers,
} from "../controllers/tailorDashboard.controller.js";

router.use(protectRoute, attachTenantContext);

router.get("/stats", getTailorStats);
router.get("/charts", getTailorCharts);
router.get("/recent-orders", getTailorRecentOrders);
router.get("/upcoming-deliveries", getTailorUpcomingDeliveries);
router.get("/latest-customers", getTailorLatestCustomers);

export default router;
