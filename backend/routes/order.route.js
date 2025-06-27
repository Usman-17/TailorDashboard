import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { addOrder, getAllOrders } from "../controllers/order.controller.js";

// Get all orders
router.get("/all", protectRoute, getAllOrders);
router.post("/add", protectRoute, addOrder);

export default router;
