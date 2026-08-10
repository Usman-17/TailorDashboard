import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import { getTailorReports } from "../controllers/tailorReport.controller.js";

router.use(protectRoute, attachTenantContext);

router.get("/", getTailorReports);

export default router;
