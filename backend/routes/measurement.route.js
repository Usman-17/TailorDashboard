import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import { isOwnerOrAdmin } from "../middlewares/roleMiddleware.js";
import {
  addMeasurement,
  deleteMeasurement,
  getAllMeasurements,
  getMeasurementById,
  updateMeasurement,
} from "../controllers/measurement.controller.js";

router.use(protectRoute, attachTenantContext);

router.get("/all", getAllMeasurements);
router.get("/:customerId", getMeasurementById);
router.post("/add/:customerId", isOwnerOrAdmin, addMeasurement);
router.put("/update/:customerId", isOwnerOrAdmin, updateMeasurement);
router.delete("/:customerId", isOwnerOrAdmin, deleteMeasurement);

export default router;
