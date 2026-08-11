import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import { attachTenantContext } from "../middlewares/tenantMiddleware.js";
import {
  getAllExpenses,
  getExpenseSummary,
  getExpenseById,
  addExpense,
  updateExpense,
  voidExpense,
} from "../controllers/expenseRecord.controller.js";

router.use(protectRoute, attachTenantContext);

router.get("/all", getAllExpenses);
router.get("/summary", getExpenseSummary);
router.post("/add", addExpense);
router.get("/:id", getExpenseById);
router.put("/update/:id", updateExpense);
router.put("/void/:id", voidExpense);

export default router;
