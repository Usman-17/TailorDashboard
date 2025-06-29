import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
    },

    salaries: {
      type: Number,
      default: 0,
    },

    rent: {
      type: Number,
      default: 0,
    },

    electricity: {
      type: Number,
      default: 0,
    },

    food: {
      type: Number,
      default: 0,
    },

    maintenance: {
      type: Number,
      default: 0,
    },

    other: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
