import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
} from "lucide-react";

import SectionHeading from "../../../components/SectionHeading";
import CustomSelect from "../../../components/CustomSelect";
import { useTailorReports } from "../../../hooks/useTailorReports";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const STATUS_COLORS = {
  pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500" },
  in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", bar: "bg-blue-500" },
  ready: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", bar: "bg-purple-500" },
  delivered: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", bar: "bg-green-500" },
  cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", bar: "bg-red-500" },
};

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const CATEGORY_COLORS = [
  "bg-orange-500", "bg-yellow-500", "bg-amber-500", "bg-blue-500",
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-green-500",
  "bg-cyan-500", "bg-gray-500", "bg-slate-500",
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
  rent: "Rent", electricity: "Electricity", gas: "Gas", internet: "Internet",
  materials: "Materials", thread: "Thread", buttons: "Buttons", salary: "Salary",
  transport: "Transport", maintenance: "Maintenance", other: "Other",
};

const TailorReportsPage = () => {
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const {
    periodLabel,
    summary,
    ordersByStatus,
    deliveryPerformance,
    expenseByCategory,
    paymentByMethod,
    monthlyOrders,
    monthlyRevenue,
    monthlyExpenses,
    isLoading,
  } = useTailorReports(period === "custom" ? "all" : period, customFrom, customTo);

  const totalOrdersByStatus = Object.values(ordersByStatus).reduce((a, b) => a + b, 0) || 1;
  const maxExpenseCategory = expenseByCategory.length > 0 ? Math.max(...expenseByCategory.map((e) => e.total)) : 1;
  const maxPaymentMethod = paymentByMethod.length > 0 ? Math.max(...paymentByMethod.map((p) => p.total)) : 1;

  if (isLoading) {
    return (
      <>
        <SectionHeading title="Reports" subtitle="Business analytics and insights" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 my-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-28" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading title="Reports" subtitle={`Business analytics — ${periodLabel || "This Month"}`} />
        <div className="flex items-center gap-2">
          {period === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </>
          )}
          <div className="w-full sm:w-44">
            <CustomSelect value={period} onChange={setPeriod} options={PERIODS} placeholder="Period" />
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 my-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Order Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {(summary?.totalOrderAmount || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{summary?.totalOrders || 0} orders</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <ArrowUpRight size={14} /> Payments Received
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {(summary?.paymentsReceived || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{summary?.totalPayments || 0} payments</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">Rs. {(summary?.outstanding || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending collection</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Wallet className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <ArrowDownRight size={14} /> Expenses
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {(summary?.totalExpenses || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{summary?.totalExpenseCount || 0} recorded</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${(summary?.netCashProfit || 0) >= 0 ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              {(summary?.netCashProfit || 0) >= 0
                ? <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                : <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />}
            </div>
            <span className={`text-xs font-medium ${(summary?.netCashProfit || 0) >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
              Net Cash Profit
            </span>
          </div>
          <p className={`text-2xl font-bold ${(summary?.netCashProfit || 0) >= 0 ? "text-gray-900 dark:text-white" : "text-red-600 dark:text-red-400"}`}>
            Rs. {(summary?.netCashProfit || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Payments Received − Expenses</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${(summary?.cashProfitMargin || 0) >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              <Activity className={`w-5 h-5 ${(summary?.cashProfitMargin || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`} />
            </div>
            <span className={`text-xs font-medium ${(summary?.cashProfitMargin || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              Cash Profit Margin
            </span>
          </div>
          <p className={`text-2xl font-bold ${(summary?.cashProfitMargin || 0) >= 0 ? "text-gray-900 dark:text-white" : "text-red-600 dark:text-red-400"}`}>
            {summary?.cashProfitMargin || 0}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">(Profit ÷ Payments Received) × 100</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Customers</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{summary?.totalCustomers || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Order Value</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Rs. {(summary?.avgOrderValue || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Overdue Orders</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{summary?.overdueOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Delivered</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{ordersByStatus.delivered || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-5">
        {/* Monthly Revenue vs Expenses */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-500" /> Collection vs Expenses
          </h3>
          <div className="space-y-3">
            {monthlyRevenue.length > 0 ? monthlyRevenue.map((rev, i) => {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const label = `${monthNames[(rev._id?.month || 1) - 1]} ${rev._id?.year || ""}`;
              const exp = monthlyExpenses[i]?.total || 0;
              const maxVal = Math.max(rev.total || 0, exp, 1);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-600 dark:text-green-400">Rs. {(rev.total || 0).toLocaleString()}</span>
                      <span className="text-xs text-red-600 dark:text-red-400">Rs. {exp.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-4">
                    <div className="bg-green-400 dark:bg-green-500 rounded-l" style={{ width: `${((rev.total || 0) / maxVal) * 100}%` }} />
                    <div className="bg-red-400 dark:bg-red-500 rounded-r" style={{ width: `${(exp / maxVal) * 100}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-green-400 dark:bg-green-500" /> Collection</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-red-400 dark:bg-red-500" /> Expenses</span>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-purple-500" /> Orders & Delivery Performance
          </h3>
          <div className="space-y-3">
            {Object.entries(ordersByStatus).filter(([, count]) => count > 0).map(([status, count]) => {
              const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
              const pct = (count / totalOrdersByStatus) * 100;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.values(ordersByStatus).every((v) => v === 0) && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No orders found</p>
            )}
          </div>
          {/* Delivery Performance */}
          {deliveryPerformance.total > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Delivery Performance</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle size={16} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">{deliveryPerformance.onTime}</p>
                  <p className="text-[10px] text-gray-500">On-Time</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Clock size={16} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{deliveryPerformance.late}</p>
                  <p className="text-[10px] text-gray-500">Late</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle size={16} className="mx-auto text-red-600 dark:text-red-400 mb-1" />
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{summary?.overdueOrders || 0}</p>
                  <p className="text-[10px] text-gray-500">Overdue</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-5">
        {/* Expense by Category */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Wallet size={16} className="text-purple-500" /> Expenses by Category
          </h3>
          <div className="space-y-3">
            {expenseByCategory.map((cat, i) => {
              const pct = maxExpenseCategory > 0 ? (cat.total / maxExpenseCategory) * 100 : 0;
              const totalPct = summary?.totalExpenses > 0 ? ((cat.total / summary.totalExpenses) * 100).toFixed(1) : "0.0";
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Rs. {cat.total.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10 text-right">{totalPct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {expenseByCategory.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No expenses found</p>
            )}
          </div>
        </div>

        {/* Payment by Method */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Banknote size={16} className="text-purple-500" /> Payments by Method
          </h3>
          <div className="space-y-3">
            {paymentByMethod.map((pm) => {
              const pct = maxPaymentMethod > 0 ? (pm.total / maxPaymentMethod) * 100 : 0;
              const totalPct = summary?.paymentsReceived > 0 ? ((pm.total / summary.paymentsReceived) * 100).toFixed(1) : "0.0";
              return (
                <div key={pm.method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{METHOD_LABELS[pm.method] || pm.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Rs. {pm.total.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10 text-right">{totalPct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${METHOD_COLORS[pm.method] || "bg-gray-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {paymentByMethod.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No payments found</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TailorReportsPage;
