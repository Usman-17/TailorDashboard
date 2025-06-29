import express from "express";
const router = express.Router();

import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  addExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
} from "../controllers/expense.controller.js";

router.get("/all", protectRoute, getAllExpenses);
router.get("/:id", protectRoute, getExpenseById);
router.post("/add", protectRoute, addExpense);
router.put("/update/:id", protectRoute, updateExpense);

export default router;
