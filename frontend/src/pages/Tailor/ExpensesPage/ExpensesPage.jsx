import moment from "moment";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Banknote,
  CalendarDays,
  Clock,
  Search,
  Plus,
  XCircle,
} from "lucide-react";

import SectionHeading from "../../../components/SectionHeading";
import CustomTable from "../../../components/CustomTable";
import CustomModal from "../../../components/CustomModal";
import CustomSelect from "../../../components/CustomSelect";
import ActionButtons from "../../../components/ActionButtons";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";

import { useGetExpenses } from "../../../hooks/useGetExpenses";
import { useExpenseSummary } from "../../../hooks/useExpenseSummary";

const CATEGORIES = [
  { value: "rent", label: "Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "gas", label: "Gas" },
  { value: "internet", label: "Internet" },
  { value: "materials", label: "Materials" },
  { value: "thread", label: "Thread" },
  { value: "buttons", label: "Buttons" },
  { value: "salary", label: "Salary" },
  { value: "transport", label: "Transport" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
];

const CATEGORY_COLORS = {
  rent: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  electricity:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  gas: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  internet: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  materials:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  thread: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  buttons:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  salary:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  transport: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  maintenance:
    "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
};

const METHOD_COLORS = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  jazzcash:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  easypaisa:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);
const METHOD_LABELS = Object.fromEntries(
  METHODS.map((m) => [m.value, m.label]),
);

const isCurrentMonth = (date) => {
  const now = new Date();
  const d = new Date(date);
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
};

const emptyForm = {
  title: "",
  category: "",
  amount: "",
  method: "cash",
  date: "",
  note: "",
};

const ExpensesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeCard, setActiveCard] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteModal, setDeleteModal] = useState({ open: false, expense: null });

  const filters = useMemo(
    () => ({
      category: filterCategory,
      method: filterMethod,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      search,
    }),
    [filterCategory, filterMethod, dateFrom, dateTo, search],
  );

  const { expenses, isLoading } = useGetExpenses(filters);
  const { summary } = useExpenseSummary();

  const handleCardClick = (cardId) => {
    if (cardId === "total") {
      setDateFrom("");
      setDateTo("");
      setActiveCard(activeCard === "total" ? null : "total");
    } else if (cardId === "today") {
      const today = new Date().toISOString().slice(0, 10);
      setDateFrom(today);
      setDateTo(today);
      setActiveCard(activeCard === "today" ? null : "today");
    } else if (cardId === "month") {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      setDateFrom(first);
      setDateTo(last);
      setActiveCard(activeCard === "month" ? null : "month");
    }
  };

  const statCards = useMemo(
    () => [
      {
        id: "total",
        title: "Total Expenses",
        count: `Rs. ${(summary?.totalExpenses || 0).toLocaleString()}`,
        icon: Banknote,
        color: "#ef4444",
      },
      {
        id: "today",
        title: "Today's Expenses",
        count: `Rs. ${(summary?.todayExpenses || 0).toLocaleString()}`,
        icon: CalendarDays,
        color: "#f59e0b",
      },
      {
        id: "month",
        title: "This Month",
        count: `Rs. ${(summary?.monthExpenses || 0).toLocaleString()}`,
        icon: Clock,
        color: "#3b82f6",
      },
    ],
    [summary],
  );

  const { mutate: addExpense, isPending: isAdding } = useMutation({
    mutationFn: async (data) => {
      const url = editingExpense
        ? `/api/expense-records/update/${editingExpense._id}`
        : "/api/expense-records/add";
      const method = editingExpense ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingExpense ? "Expense updated" : "Expense added");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["expenseRecords"] });
      queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: deleteExpense, isPending: isDeleting } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/expense-records/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Expense deleted");
      setDeleteModal({ open: false, expense: null });
      queryClient.invalidateQueries({ queryKey: ["expenseRecords"] });
      queryClient.invalidateQueries({ queryKey: ["expenseSummary"] });
    },
    onError: (err) => {
      toast.error(err.message);
      setDeleteModal({ open: false, expense: null });
    },
  });

  const openAddModal = () => {
    setEditingExpense(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      method: expense.method,
      date: moment(expense.date).format("YYYY-MM-DD"),
      note: expense.note || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.category) return toast.error("Category is required");
    if (!form.amount || Number(form.amount) <= 0)
      return toast.error("Valid amount is required");
    if (!form.date) return toast.error("Date is required");
    addExpense(form);
  };

  const columns = [
    {
      title: "Sr.",
      key: "sr",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Expense ID",
      dataIndex: "expenseId",
      key: "expenseId",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (v) => (
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (v) => (
        <span
          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${CATEGORY_COLORS[v] || ""}`}
        >
          {CATEGORY_LABELS[v] || v}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      render: (v) => (
        <span className="font-semibold text-sm text-red-600 dark:text-red-400">
          Rs. {(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Payment Method",
      dataIndex: "method",
      key: "method",
      render: (v) => (
        <span
          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${METHOD_COLORS[v] || ""}`}
        >
          {METHOD_LABELS[v] || v}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {v ? moment(v).format("DD MMM YYYY") : "-"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 100,
      render: (_, record) => {
        const canEdit = isCurrentMonth(record.date);
        return (
          <ActionButtons
            record={record}
            onEdit={openEditModal}
            onDelete={(rec) => setDeleteModal({ open: true, expense: rec })}
            editDisabled={!canEdit}
            deleteDisabled={!canEdit}
          />
        );
      },
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Expenses"
          subtitle="Track and manage all your business expenses"
        />
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 my-5">
        {statCards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className="bg-white shadow-md rounded-xl p-5 flex items-center gap-4 border-l-4 transition-all duration-200 cursor-pointer hover:shadow-lg"
            style={{
              borderColor: card.color,
              boxShadow:
                activeCard === card.id
                  ? `0 0 0 2px ${card.color}40, 0 4px 12px ${card.color}20`
                  : undefined,
            }}
          >
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${card.color}1A`, color: card.color }}
            >
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-600 text-sm">{card.title}</h4>
              <p className="text-xl font-bold" style={{ color: card.color }}>
                {card.count}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 my-4 px-1">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense ID or title..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="w-full sm:w-44">
          <CustomSelect
            value={filterCategory}
            onChange={(val) => setFilterCategory(val)}
            options={[{ value: "all", label: "All Categories" }, ...CATEGORIES]}
            placeholder="Category"
          />
        </div>
        <div className="w-full sm:w-44">
          <CustomSelect
            value={filterMethod}
            onChange={(val) => setFilterMethod(val)}
            options={[{ value: "all", label: "All Methods" }, ...METHODS]}
            placeholder="Payment Method"
          />
        </div>
      </div>

      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={expenses}
        hideSearch
        totalLabel="Total Expenses"
      />

      {/* Add / Edit Expense Modal */}
      <CustomModal isOpen={modalOpen}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </h3>
            </div>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              <XCircle size={18} />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expense Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Office rent for July"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Category"
                value={form.category}
                onChange={(val) => setForm({ ...form, category: val })}
                options={CATEGORIES}
                placeholder="Select category"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Rs. 0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Payment Method"
                value={form.method}
                onChange={(val) => setForm({ ...form, method: val })}
                options={METHODS}
                placeholder="Select method"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional notes"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isAdding}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isAdding
                ? "Saving..."
                : editingExpense
                  ? "Update Expense"
                  : "Save Expense"}
            </button>
          </div>
        </div>
      </CustomModal>

      <ConfirmDeleteModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, expense: null })}
        onConfirm={() => deleteExpense(deleteModal.expense?._id)}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deleteModal.expense?.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ExpensesPage;
