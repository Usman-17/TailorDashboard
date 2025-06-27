import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { addOrder } from "../controllers/order.controller.js";

router.post("/add", protectRoute, addOrder);

export default router;
