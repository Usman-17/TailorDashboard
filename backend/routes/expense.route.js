import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import {
  addExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
} from "../controllers/expense.controller.js";

router.get("/all", protectRoute, attachTenantContext, getAllExpenses);
router.get("/:id", protectRoute, attachTenantContext, getExpenseById);
router.post("/add", protectRoute, attachTenantContext, addExpense);
router.put("/update/:id", protectRoute, attachTenantContext, updateExpense);

export default router;
