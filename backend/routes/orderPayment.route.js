import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import {
  getAllPayments,
  getPaymentSummary,
  getPaymentById,
  voidPayment,
  backfillPayments,
  getPendingOrders,
} from "../controllers/orderPayment.controller.js";

router.use(protectRoute, attachTenantContext);

router.get("/all", getAllPayments);
router.get("/summary", getPaymentSummary);
router.get("/pending-orders", getPendingOrders);
router.post("/backfill", backfillPayments);
router.get("/:id", getPaymentById);
router.put("/void/:id", voidPayment);

export default router;
