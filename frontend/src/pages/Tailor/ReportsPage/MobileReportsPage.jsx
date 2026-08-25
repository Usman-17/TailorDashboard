import dayjs from "dayjs";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
  ShoppingCart,
  Users,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  Truck,
  Clock,
  CheckCircle,
  ChevronDown,
} from "lucide-react";

import CustomDatePicker from "../../../components/CustomDatePicker";
// Imports End----

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const STATUS_COLORS = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  in_progress: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    bar: "bg-blue-500",
  },
  ready: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    bar: "bg-purple-500",
  },
  delivered: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    bar: "bg-green-500",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    bar: "bg-red-500",
  },
};

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const CATEGORY_COLORS = [
  "bg-orange-500",
  "bg-yellow-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-green-500",
  "bg-cyan-500",
  "bg-gray-500",
  "bg-slate-500",
];

const METHOD_COLORS = {
  cash: "bg-green-500",
  bank: "bg-blue-500",
  jazzcash: "bg-purple-500",
  easypaisa: "bg-amber-500",
};

const METHOD_LABELS = {
  cash: "Cash",
  bank: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
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

const MobileReportsPage = ({
  period,
  setPeriod,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  periodLabel,
  summary,
  ordersByStatus,
  deliveryPerformance,
  expenseByCategory,
  paymentByMethod,
  monthlyRevenue,
  monthlyExpenses,
}) => {
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  const totalOrdersByStatus =
    Object.values(ordersByStatus).reduce((a, b) => a + b, 0) || 1;
  const maxExpenseCategory =
    expenseByCategory.length > 0
      ? Math.max(...expenseByCategory.map((e) => e.total))
      : 1;
  const maxPaymentMethod =
    paymentByMethod.length > 0
      ? Math.max(...paymentByMethod.map((p) => p.total))
      : 1;

  const selectedPeriodLabel =
    PERIODS.find((p) => p.value === period)?.label || "This Month";

  return (
    <div className="space-y-4">
      {/* Overview Section */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Reports</h2>
            <p className="text-[10px] text-purple-200">
              {periodLabel || "This Month"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
              <ShoppingCart
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                Order Value
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                Rs. {(summary?.totalOrderAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <Banknote
                size={14}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                Received
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                Rs. {(summary?.paymentsReceived || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                Outstanding
              </p>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Rs. {(summary?.outstanding || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/80 rounded-xl p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <Wallet size={14} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                Expenses
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                Rs. {(summary?.totalExpenses || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mx-1">
        <button
          onClick={() => setShowPeriodPicker(!showPeriodPicker)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer"
        >
          <span>{selectedPeriodLabel}</span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${showPeriodPicker ? "rotate-180" : ""}`}
          />
        </button>

        {showPeriodPicker && (
          <div className="mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setPeriod(p.value);
                  setShowPeriodPicker(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-gray-100 dark:border-gray-800 last:border-0 transition cursor-pointer ${
                  period === p.value
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {period === "custom" && (
          <div className="flex gap-2 mt-2">
            <div className="flex-1">
              <CustomDatePicker
                value={customFrom ? dayjs(customFrom) : null}
                onChange={(d) => setCustomFrom(d ? d.format("YYYY-MM-DD") : "")}
                placeholder="From"
                allowClear
              />
            </div>
            <div className="flex-1">
              <CustomDatePicker
                value={customTo ? dayjs(customTo) : null}
                onChange={(d) => setCustomTo(d ? d.format("YYYY-MM-DD") : "")}
                placeholder="To"
                allowClear
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mx-1 grid grid-cols-2 gap-2.5">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0">
            <Users size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Customers
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {summary?.totalCustomers || 0}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 shrink-0">
            <Activity size={16} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Avg. Order
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Rs. {(summary?.avgOrderValue || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
            <AlertTriangle
              size={16}
              className="text-red-600 dark:text-red-400"
            />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Overdue
            </p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {summary?.overdueOrders || 0}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
            <Truck size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Delivered
            </p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              {ordersByStatus.delivered || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="mx-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {(summary?.netCashProfit || 0) >= 0 ? (
              <TrendingUp
                size={16}
                className="text-blue-600 dark:text-blue-400"
              />
            ) : (
              <TrendingDown
                size={16}
                className="text-red-600 dark:text-red-400"
              />
            )}
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Net Cash Profit
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(summary?.cashProfitMargin || 0) >= 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}
          >
            {summary?.cashProfitMargin || 0}%
          </span>
        </div>
        <p
          className={`text-xl font-bold ${(summary?.netCashProfit || 0) >= 0 ? "text-gray-900 dark:text-white" : "text-red-600 dark:text-red-400"}`}
        >
          Rs. {(summary?.netCashProfit || 0).toLocaleString()}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          Payments Received − Expenses
        </p>
      </div>

      {/* Orders by Status */}
      <div className="mx-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <PieChart size={16} className="text-purple-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Order Status
          </h3>
        </div>
        <div className="space-y-2.5">
          {Object.entries(ordersByStatus)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => {
              const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
              const pct = (count / totalOrdersByStatus) * 100;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                    >
                      {STATUS_LABELS[status] || status}
                    </span>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          {Object.values(ordersByStatus).every((v) => v === 0) && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No orders found
            </p>
          )}
        </div>

        {/* Delivery Performance */}
        {deliveryPerformance.total > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Delivery Performance
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle
                  size={14}
                  className="mx-auto text-green-600 dark:text-green-400 mb-0.5"
                />
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {deliveryPerformance.onTime}
                </p>
                <p className="text-[10px] text-gray-500">On-Time</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Clock
                  size={14}
                  className="mx-auto text-amber-600 dark:text-amber-400 mb-0.5"
                />
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {deliveryPerformance.late}
                </p>
                <p className="text-[10px] text-gray-500">Late</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <AlertTriangle
                  size={14}
                  className="mx-auto text-red-600 dark:text-red-400 mb-0.5"
                />
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  {summary?.overdueOrders || 0}
                </p>
                <p className="text-[10px] text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="mx-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-purple-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Collection vs Expenses
          </h3>
        </div>
        <div className="space-y-2.5">
          {monthlyRevenue.length > 0 ? (
            monthlyRevenue.map((rev, i) => {
              const monthNames = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ];
              const label = `${monthNames[(rev._id?.month || 1) - 1]} ${rev._id?.year || ""}`;
              const exp = monthlyExpenses[i]?.total || 0;
              const maxVal = Math.max(rev.total || 0, exp, 1);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-600 dark:text-green-400">
                        Rs. {(rev.total || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-red-600 dark:text-red-400">
                        Rs. {exp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 h-3">
                    <div
                      className="bg-green-400 dark:bg-green-500 rounded-l"
                      style={{ width: `${((rev.total || 0) / maxVal) * 100}%` }}
                    />
                    <div
                      className="bg-red-400 dark:bg-red-500 rounded-r"
                      style={{ width: `${(exp / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No data available
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2.5 h-2.5 rounded bg-green-400 dark:bg-green-500" />{" "}
            Collection
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2.5 h-2.5 rounded bg-red-400 dark:bg-red-500" />{" "}
            Expenses
          </span>
        </div>
      </div>

      {/* Expense by Category */}
      <div className="mx-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-purple-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Expenses by Category
          </h3>
        </div>
        <div className="space-y-2.5">
          {expenseByCategory.map((cat, i) => {
            const pct =
              maxExpenseCategory > 0
                ? (cat.total / maxExpenseCategory) * 100
                : 0;
            const totalPct =
              summary?.totalExpenses > 0
                ? ((cat.total / summary.totalExpenses) * 100).toFixed(1)
                : "0.0";
            return (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {CATEGORY_LABELS[cat.category] || cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                      Rs. {cat.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10 text-right">
                      {totalPct}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {expenseByCategory.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No expenses found
            </p>
          )}
        </div>
      </div>

      {/* Payment by Method */}
      <div className="mx-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Banknote size={16} className="text-purple-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Payments by Method
          </h3>
        </div>
        <div className="space-y-2.5">
          {paymentByMethod.map((pm) => {
            const pct =
              maxPaymentMethod > 0 ? (pm.total / maxPaymentMethod) * 100 : 0;
            const totalPct =
              summary?.paymentsReceived > 0
                ? ((pm.total / summary.paymentsReceived) * 100).toFixed(1)
                : "0.0";
            return (
              <div key={pm.method}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {METHOD_LABELS[pm.method] || pm.method}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                      Rs. {pm.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10 text-right">
                      {totalPct}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${METHOD_COLORS[pm.method] || "bg-gray-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {paymentByMethod.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No payments found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileReportsPage;
