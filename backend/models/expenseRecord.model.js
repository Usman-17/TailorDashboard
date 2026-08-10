import mongoose from "mongoose";

const EXPENSE_CATEGORIES = [
  "rent",
  "electricity",
  "gas",
  "internet",
  "materials",
  "thread",
  "buttons",
  "salary",
  "transport",
  "maintenance",
  "other",
];

const EXPENSE_METHODS = ["cash", "bank", "jazzcash", "easypaisa"];

const expenseRecordSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    expenseId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: [true, "Category is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    method: {
      type: String,
      enum: EXPENSE_METHODS,
      default: "cash",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

expenseRecordSchema.index({ shopId: 1, createdAt: -1 });
expenseRecordSchema.index({ shopId: 1, category: 1 });
expenseRecordSchema.index({ shopId: 1, date: -1 });
expenseRecordSchema.index({ shopId: 1, expenseId: 1 }, { unique: true });

const ExpenseRecord = mongoose.model("ExpenseRecord", expenseRecordSchema);
export { EXPENSE_CATEGORIES, EXPENSE_METHODS };
export default ExpenseRecord;
