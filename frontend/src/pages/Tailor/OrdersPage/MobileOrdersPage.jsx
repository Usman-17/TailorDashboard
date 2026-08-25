import moment from "moment";
import { useState } from "react";
import {
  ShoppingBag,
  Filter,
  Search,
  SquarePen,
  Phone,
  Calendar,
  ChevronRight,
} from "lucide-react";
// Imports End----

const STATUS_COLORS = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ready:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const MobileOrdersPage = ({
  stats,
  filtered,
  isLoading,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  setSelectedOrderId,
  openPicker,
}) => {
  const [showFilter, setShowFilter] = useState(false);

  const filterOptions = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="block md:hidden -mx-4">
      <div className="px-4 space-y-3">
        {/* Purple Stat Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-4 flex items-center gap-4 shadow-lg shadow-purple-600/20">
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Total Orders
            </p>
            <p className="text-3xl font-black text-white leading-tight">
              {isLoading ? "..." : stats.total}
            </p>
          </div>
        </div>

        {/* Add New Order Button */}
        <button
          onClick={openPicker}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all cursor-pointer"
        >
          <SquarePen size={16} />
          Add New Order
        </button>

        {/* Search + Filter Row */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer shrink-0 ${
              showFilter
                ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white dark:bg-[#17102a] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Filter size={15} />
            Filter
          </button>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Filter by
            </p>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFilterStatus(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    filterStatus === opt.id
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Orders Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-gray-200 dark:bg-gray-800/50 rounded-2xl"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17102a]">
            <ShoppingBag
              size={38}
              className="text-gray-300 dark:text-gray-600 mb-3"
            />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              No orders found
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              Try a different search or add a new order
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((order) => {
              const isUrgent =
                order.deliveryDate &&
                !["delivered", "cancelled"].includes(order.status) &&
                moment(order.deliveryDate)
                  .startOf("day")
                  .diff(moment().startOf("day"), "days") <= 3;
              return (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrderId(order._id)}
                  className={`bg-white dark:bg-[#17102a] border border-gray-200 dark:border-gray-800 border-l-4 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all duration-150 ${
                    isUrgent ? "order-urgent" : "order-normal"
                  }`}
                >
                  {/* Top Row: Order # + Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-bold text-gray-900 dark:text-white block">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium block">
                        {order.customer?.name || "-"}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 shrink-0 ${
                        STATUS_COLORS[order.status] || STATUS_COLORS.pending
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  {/* Info Row: Phone */}
                  {order.customer?.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <Phone size={11} />
                      {order.customer.phone}
                    </div>
                  )}

                  {/* Details Row: Suits + Due Date */}
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    {(order.items || []).length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                        <ShoppingBag size={11} className="text-gray-400" />
                        {(order.items || [])
                          .map((it) => it.suitType)
                          .filter(Boolean)
                          .join(", ")}
                        {(order.items || []).reduce(
                          (s, it) => s + (it.quantity || 1),
                          0,
                        ) > 1 && (
                          <>
                            {" "}
                            ×{" "}
                            {order.items.reduce(
                              (s, it) => s + (it.quantity || 1),
                              0,
                            )}
                          </>
                        )}
                      </span>
                    )}
                    {order.deliveryDate && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                        <Calendar size={11} className="text-gray-400" />
                        Due: {moment(order.deliveryDate).format("DD MMM YYYY")}
                      </span>
                    )}
                  </div>

                  {/* Bottom Row: Total + View Details */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Rs. {(order.totalAmount || 0).toLocaleString()}
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 ml-1">
                        Total Amount
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                      View Details
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileOrdersPage;
