import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  addOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";

// Get all orders
router.get("/all", protectRoute, getAllOrders);
router.post("/add", protectRoute, addOrder);
router.put("/status/:id", protectRoute, updateOrderStatus);

export default router;
