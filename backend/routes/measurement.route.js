import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  addMeasurement,
  deleteMeasurement,
  getAllMeasurements,
  getMeasurementById,
  updateMeasurement,
} from "../controllers/measurement.controller.js";

router.get("/all", protectRoute, getAllMeasurements);
router.get("/:customerId", protectRoute, getMeasurementById);
router.post("/add/:customerId", protectRoute, addMeasurement);
router.put("/update/:customerId", protectRoute, updateMeasurement);
router.delete("/:customerId", protectRoute, deleteMeasurement);

export default router;
