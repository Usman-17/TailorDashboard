import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  receivePayment,
  getShopPayments,
} from "../controllers/payment.controller.js";

router.use(protectRoute, authorize("super_admin"));

router.post("/receive/:shopId", receivePayment);
router.get("/shop/:shopId", getShopPayments);

export default router;
