import express from "express";
const router = express.Router();

import {
  addCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomer,
  updateCustomer,
  getDeletedCustomers,
  permanentDeleteCustomer,
  restoreCustomer,
} from "../controllers/customer.controller.js";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";

router.use(protectRoute, attachTenantContext);

router.get("/all", getAllCustomers);
router.get("/trash", getDeletedCustomers);
router.get("/:id", getCustomer);

router.post("/add", addCustomer);
router.put("/update/:id", updateCustomer);
router.put("/restore/:id", restoreCustomer);
router.delete("/:id", deleteCustomer);
router.delete("/permanent/:id", permanentDeleteCustomer);

export default router;
