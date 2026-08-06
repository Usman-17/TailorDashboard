import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import { isOwnerOrAdmin } from "../middlewares/roleMiddleware.js";
import {
  addOrder,
  getAllOrders,
  getOrder,
  updateOrder,
  updateOrderStatus,
  addPayment,
  deleteOrder,
  generateInvoice,
  getDashboardStats,
  getSalesByDateRange,
} from "../controllers/order.controller.js";

router.use(protectRoute, attachTenantContext);

router.get("/all", getAllOrders);
router.get("/dashboard", getDashboardStats);
router.get("/sales", getSalesByDateRange);
router.get("/invoice/:id", generateInvoice);
router.get("/:id", getOrder);

router.post("/add", addOrder);
router.put("/update/:id", updateOrder);
router.put("/status/:id", updateOrderStatus);

router.post("/payment/:id", isOwnerOrAdmin, addPayment);
router.delete("/:id", isOwnerOrAdmin, deleteOrder);

export default router;
