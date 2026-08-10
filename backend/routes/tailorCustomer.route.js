import express from "express";
const router = express.Router();

import {
  addCustomer,
  getAllCustomers,
  getCustomer,
  getCustomerDetail,
  updateCustomer,
} from "../controllers/tailorCustomer.controller.js";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";

router.use(protectRoute, attachTenantContext);

router.get("/all", getAllCustomers);
router.get("/:id/detail", getCustomerDetail);
router.get("/:id", getCustomer);

router.post("/add", addCustomer);
router.put("/update/:id", updateCustomer);

export default router;
