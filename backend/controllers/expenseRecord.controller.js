import mongoose from "mongoose";
import ExpenseRecord from "../models/expenseRecord.model.js";

const generateExpenseId = async (shopId) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `EXP-${dateStr}`;

  const count = await ExpenseRecord.countDocuments({
    shopId,
    expenseId: { $regex: `^${prefix}` },
  });

  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

const isCurrentMonth = (date) => {
  const now = new Date();
  const d = new Date(date);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

// GET /api/expense-records/all
export const getAllExpenses = async (req, res) => {
  try {
    const { shopId } = req;
    const { category, method, from, to, search, page = 1, limit = 50 } = req.query;

    const filter = { shopId };

    if (category && category !== "all") {
      filter.category = category;
    }
    if (method && method !== "all") {
      filter.method = method;
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }
    if (search) {
      filter.$or = [
        { expenseId: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      ExpenseRecord.find(filter)
        .populate("createdBy", "fullName")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ExpenseRecord.countDocuments(filter),
    ]);

    return res.status(200).json({
      expenses,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error in getAllExpenses:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/expense-records/summary
export const getExpenseSummary = async (req, res) => {
  try {
    const { shopId } = req;
    const shopOid = new mongoose.Types.ObjectId(shopId);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalExpenses, todayExpenses, monthExpenses] = await Promise.all([
      ExpenseRecord.aggregate([
        { $match: { shopId: shopOid } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      ExpenseRecord.aggregate([
        { $match: { shopId: shopOid, date: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      ExpenseRecord.aggregate([
        { $match: { shopId: shopOid, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return res.status(200).json({
      totalExpenses: totalExpenses[0]?.total || 0,
      todayExpenses: todayExpenses[0]?.total || 0,
      monthExpenses: monthExpenses[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error in getExpenseSummary:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/expense-records/:id
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const expense = await ExpenseRecord.findOne({ _id: id, shopId }).populate(
      "createdBy",
      "fullName",
    );

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error("Error in getExpenseById:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/expense-records/add
export const addExpense = async (req, res) => {
  try {
    const { shopId, user } = req;
    const { title, category, amount, method, date, note } = req.body;

    if (!title || !category || amount == null || !date) {
      return res.status(400).json({ error: "Title, category, amount, and date are required" });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({ error: "Amount cannot be negative" });
    }

    const expenseId = await generateExpenseId(shopId);

    const expense = await ExpenseRecord.create({
      shopId,
      expenseId,
      title,
      category,
      amount: Number(amount),
      method: method || "cash",
      date: new Date(date),
      note: note || "",
      createdBy: user._id,
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error("Error in addExpense:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/expense-records/update/:id
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;
    const { title, category, amount, method, date, note } = req.body;

    const expense = await ExpenseRecord.findOne({ _id: id, shopId });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (!isCurrentMonth(expense.date)) {
      return res.status(400).json({ error: "Cannot edit expenses from previous months" });
    }

    if (title !== undefined) expense.title = title;
    if (category !== undefined) expense.category = category;
    if (amount !== undefined) expense.amount = Number(amount);
    if (method !== undefined) expense.method = method;
    if (date !== undefined) expense.date = new Date(date);
    if (note !== undefined) expense.note = note;

    await expense.save();

    return res.status(200).json(expense);
  } catch (error) {
    console.error("Error in updateExpense:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/expense-records/delete/:id
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    const expense = await ExpenseRecord.findOne({ _id: id, shopId });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (!isCurrentMonth(expense.date)) {
      return res.status(400).json({ error: "Cannot delete expenses from previous months" });
    }

    await ExpenseRecord.deleteOne({ _id: id, shopId });

    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error in deleteExpense:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
