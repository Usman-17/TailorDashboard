import moment from "moment";
import { useState } from "react";
import {
  Search,
  Wallet,
  SlidersHorizontal,
  SquarePen,
  Ban,
  Redo,
} from "lucide-react";

import CustomSelect from "../../../components/CustomSelect";
import CustomDatePicker from "../../../components/CustomDatePicker";
// Imports End---

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

const CATEGORY_LABELS = {
  rent: "Rent",
  electricity: "Electricity",
  gas: "Gas",
  internet: "Internet",
  materials: "Materials",
  thread: "Thread",
  buttons: "Buttons",
  salary: "Salary",
  transport: "Transport",
  maintenance: "Maintenance",
  other: "Other",
};

const METHOD_LABELS = {
  cash: "Cash",
  bank: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
};

const MobileExpensesPage = ({
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  filterMethod,
  setFilterMethod,
  filterStatus,
  setFilterStatus,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  statCards,
  handleCardClick,
  expenses,
  isLoading,
  onAdd,
  onEdit,
  onVoid,
  onRestore,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters =
    filterCategory !== "all" ||
    filterMethod !== "all" ||
    filterStatus !== "active" ||
    dateFrom ||
    dateTo;

  return (
    <div className="space-y-4">
      {/* Overview Section */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-white">Overview</h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {statCards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="bg-white dark:bg-gray-800/80 rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer active:scale-[0.98] transition text-center"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${card.color}20`,
                  color: card.color,
                }}
              >
                <card.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {card.title}
                </p>
                <p className="text-xs font-bold" style={{ color: card.color }}>
                  {card.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="px-1">
        <button
          onClick={onAdd}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-purple-600/30 active:scale-[0.98]"
        >
          <SquarePen size={18} />
          Add Expense
        </button>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex-1">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or title..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
            />
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition cursor-pointer ${
            showFilters || hasActiveFilters
              ? "bg-purple-600 text-white"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="space-y-3 px-1">
          <div className="grid grid-cols-2 gap-3">
            <CustomDatePicker
              value={dateFrom || null}
              onChange={(d) => setDateFrom(d ? d.format("YYYY-MM-DD") : "")}
              placeholder="From"
              allowClear
            />
            <CustomDatePicker
              value={dateTo || null}
              onChange={(d) => setDateTo(d ? d.format("YYYY-MM-DD") : "")}
              placeholder="To"
              allowClear
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect
              allowClear={false}
              value={filterCategory}
              onChange={(val) => setFilterCategory(val)}
              placeholder="Category"
              options={[
                { value: "all", label: "All Categories" },
                {
                  value: "rent",
                  label: "Rent",
                },
                {
                  value: "electricity",
                  label: "Electricity",
                },
                { value: "gas", label: "Gas" },
                { value: "internet", label: "Internet" },
                { value: "materials", label: "Materials" },
                { value: "thread", label: "Thread" },
                { value: "buttons", label: "Buttons" },
                { value: "salary", label: "Salary" },
                { value: "transport", label: "Transport" },
                { value: "maintenance", label: "Maintenance" },
                { value: "other", label: "Other" },
              ]}
            />
            <CustomSelect
              allowClear={false}
              value={filterMethod}
              onChange={(val) => setFilterMethod(val)}
              placeholder="Method"
              options={[
                { value: "all", label: "All Methods" },
                { value: "cash", label: "Cash" },
                { value: "bank", label: "Bank Transfer" },
                { value: "jazzcash", label: "JazzCash" },
                { value: "easypaisa", label: "EasyPaisa" },
              ]}
            />
          </div>
          <CustomSelect
            allowClear={false}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            placeholder="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "voided", label: "Voided" },
            ]}
          />
        </div>
      )}

      {/* Expense Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : expenses && expenses.length > 0 ? (
        <div className="space-y-2 px-1">
          {expenses.map((exp, i) => {
            const canEdit =
              !exp.isVoided &&
              (() => {
                const now = new Date();
                const d = new Date(exp.date);
                return (
                  d.getFullYear() === now.getFullYear() &&
                  d.getMonth() === now.getMonth()
                );
              })();
            return (
              <div
                key={exp._id || i}
                className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 transition ${
                  exp.isVoided ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {exp.title}
                    </p>
                    <p className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      {exp.expenseId || "-"}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 shrink-0">
                    Rs. {(exp.amount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span
                    className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${CATEGORY_COLORS[exp.category] || ""}`}
                  >
                    {CATEGORY_LABELS[exp.category] || exp.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${METHOD_COLORS[exp.method] || ""}`}
                  >
                    {METHOD_LABELS[exp.method] || exp.method}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {exp.date ? moment(exp.date).format("DD MMM YYYY") : "-"}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Created:{" "}
                      {exp.createdAt
                        ? moment(exp.createdAt).format("DD MMM YYYY")
                        : "-"}
                    </p>
                  </div>
                  {exp.isVoided ? (
                    <button
                      onClick={() => onRestore(exp)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer transition-colors"
                    >
                      <Redo size={12} />
                      Restore
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => canEdit && onEdit(exp)}
                        disabled={!canEdit}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          canEdit
                            ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        <SquarePen size={14} />
                      </button>
                      <button
                        onClick={() => canEdit && onVoid(exp)}
                        disabled={!canEdit}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          canEdit
                            ? "text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        <Ban size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
          No expenses found
        </div>
      )}
    </div>
  );
};

export default MobileExpensesPage;
