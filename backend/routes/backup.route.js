import express from "express";
import {
  downloadBackup,
  restoreBackup,
} from "../controllers/backup.controller.js";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

// Apply auth and tenant middlewares
router.use(protectRoute, attachTenantContext);

// GET /api/backup/download
router.get("/download", downloadBackup);

// POST /api/backup/restore
router.post("/restore", restoreBackup);

export default router;
