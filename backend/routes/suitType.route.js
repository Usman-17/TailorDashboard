import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import {
  getAllSuitTypes,
  getActiveSuitTypes,
  addSuitType,
  updateSuitType,
  deleteSuitType,
} from "../controllers/suitType.controller.js";

router.use(protectRoute, attachTenantContext);

router.get("/all", getAllSuitTypes);
router.get("/active", getActiveSuitTypes);
router.post("/add", addSuitType);
router.put("/update/:id", updateSuitType);
router.delete("/:id", deleteSuitType);

export default router;
