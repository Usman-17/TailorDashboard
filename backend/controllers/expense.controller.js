import Expense from "../models/expense.model.js";

// PATH     : /api/expenses/add
// METHOD   : POST
// ACCESS   : PRIVATE
// DESC     : Add expenses
export const addExpense = async (req, res) => {
  try {
    const {
      month,
      salaries = 0,
      rent = 0,
      electricity = 0,
      food = 0,
      maintenance = 0,
      other = 0,
    } = req.body;

    const totalAmount =
      Number(salaries) +
      Number(rent) +
      Number(electricity) +
      Number(food) +
      Number(maintenance) +
      Number(other);

    const existing = await Expense.findOne({ month });
    if (existing)
      return res
        .status(400)
        .json({ message: `Expense record for ${month} already exists.` });

    const newExpense = await Expense.create({
      month,
      salaries,
      rent,
      electricity,
      food,
      maintenance,
      other,
      totalAmount,
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PATH     : /api/measurements/update/id
// METHOD   : PUT
// ACCESS   : PRIVATE
// DESC     : Update Expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      month,
      salaries = 0,
      rent = 0,
      electricity = 0,
      food = 0,
      maintenance = 0,
      other = 0,
      notes = "",
    } = req.body;

    const expense = await Expense.findOne({ _id: id });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    expense.month = month || expense.month;
    expense.salaries = salaries;
    expense.rent = rent;
    expense.electricity = electricity;
    expense.food = food;
    expense.maintenance = maintenance;
    expense.other = other;
    expense.notes = notes;

    // Recalculate totalAmount
    expense.totalAmount =
      Number(salaries) +
      Number(rent) +
      Number(electricity) +
      Number(food) +
      Number(maintenance) +
      Number(other);

    const updated = await expense.save();
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateExpense controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PATH     : /api/expenses/id
// METHOD   : GET
// ACCESS   : PRIVATE
// DESC     : get expenses by id
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Get Expense By ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PATH     : /api/expenses/all
// METHOD   : GET
// ACCESS   : PRIVATE
// DESC     : get all expenses
export const getAllExpenses = async (req, res) => {
  try {
    const expense = await Expense.find().sort({ createdAt: -1 });

    if (!expense) {
      return res
        .status(404)
        .json({ message: "No expense found for this month" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Get Monthly Expense Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
