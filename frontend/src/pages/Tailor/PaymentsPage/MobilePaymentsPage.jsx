import moment from "moment";
import { useState } from "react";
import {
  Search,
  ChevronRight,
  CreditCard,
  Wallet,
  Clock,
  SlidersHorizontal,
} from "lucide-react";

import CustomSelect from "../../../components/CustomSelect";
import CustomDatePicker from "../../../components/CustomDatePicker";
// Imports End----

const METHOD_LABELS = {
  cash: "Cash",
  bank: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
};

const METHOD_COLORS = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  jazzcash:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  easypaisa:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const MobilePaymentsPage = ({
  view,
  setView,
  search,
  setSearch,
  filterMethod,
  setFilterMethod,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  statCards,
  setActiveCard,
  handleCardClick,
  payments,
  isLoading,
  pendingOrders,
  pendingLoading,
  onReceivePayment,
  onCardClick,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = filterMethod !== "all" || dateFrom || dateTo;

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

        <div className="grid grid-cols-2 gap-2.5">
          {statCards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="bg-white dark:bg-gray-800/80 rounded-xl p-3 flex items-center gap-2 cursor-pointer active:scale-[0.98] transition"
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
              <div className="min-w-0">
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

      {/* View Toggle */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => {
            setView("history");
            setActiveCard?.(null);
          }}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
            view === "history"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Wallet size={14} /> Payment History
        </button>
        <button
          onClick={() => {
            setView("pending");
            setActiveCard?.("pending");
          }}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
            view === "pending"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Clock size={14} /> Pending Orders
        </button>
      </div>

      {view === "history" ? (
        <>
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
                  placeholder="Search by payment ID, customer, or order #"
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

              <CustomSelect
                allowClear={false}
                value={filterMethod}
                onChange={(val) => setFilterMethod(val)}
                placeholder="Payment Method"
                options={[
                  { value: "all", label: "All Methods" },
                  { value: "cash", label: "Cash" },
                  { value: "bank", label: "Bank Transfer" },
                  { value: "jazzcash", label: "JazzCash" },
                  { value: "easypaisa", label: "EasyPaisa" },
                ]}
              />
            </div>
          )}

          {/* Payment Cards Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-2 px-1">
              {payments.map((p, i) => (
                <div
                  key={p._id || i}
                  onClick={() => onCardClick?.(p)}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 cursor-pointer active:scale-[0.98] transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {(p.customerName || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {p.customerName || "-"}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {p.orderNumber || "-"}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {p.createdAt
                          ? moment(p.createdAt).format("DD MMM YYYY · h:mm A")
                          : "-"}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        PKR {(p.amount || 0).toLocaleString()}
                      </p>
                      <ChevronRight
                        size={14}
                        className="text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      {p.paymentId || "-"}
                    </span>
                    <span
                      className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${METHOD_COLORS[p.method] || ""}`}
                    >
                      {METHOD_LABELS[p.method] || p.method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              No payments found
            </div>
          )}
        </>
      ) : (
        <>
          {/* Pending Orders Grid */}
          {pendingLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : pendingOrders && pendingOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 px-1">
              {pendingOrders.map((o, i) => (
                <div
                  key={o._id || i}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      {o.orderNumber || "-"}
                    </span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {o.customerName || "-"}
                  </p>
                  {o.customerPhone && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {o.customerPhone}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500">
                        Total
                      </p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        PKR {(o.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 dark:text-gray-500">
                        Remaining
                      </p>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        PKR {(o.remainingBalance || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {o.deliveryDate && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Delivery: {moment(o.deliveryDate).format("DD MMM YYYY")}
                    </p>
                  )}
                  {o.remainingBalance > 0 && (
                    <button
                      onClick={() => onReceivePayment?.(o)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 text-[11px] font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] transition cursor-pointer"
                    >
                      <CreditCard size={12} /> Receive Payment
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              No pending orders
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MobilePaymentsPage;
