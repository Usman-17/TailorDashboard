import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  Ruler,
  Filter,
  Search,
  PlusCircle,
  Phone,
} from "lucide-react";

import teamIcon from "../../../assets/team.png";
import ActionButtons from "../../../components/ActionButtons";

const MobileCustomersPage = ({
  customers,
  filtered,
  search,
  setSearch,
  filterType,
  setFilterType,
  isLoading,
  openCreate,
  openEdit,
  openMeasureModal,
  openBookOrderModal,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  const filterOptions = [
    { id: "all", label: "All" },
    { id: "with_measurement", label: "Has Measurements" },
    { id: "without_measurement", label: "No Measurements" },
    { id: "new_this_month", label: "New This Month" },
  ];

  return (
    <div className="block md:hidden -mx-4">
      <div className="px-4 space-y-3">
        {/* Purple Stat Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-4 flex items-center gap-4 shadow-lg shadow-purple-600/20">
          <img
            src={teamIcon}
            alt=""
            className="absolute right-2 top-1/2 -translate-y-1/2 h-16 w-16 object-contain opacity-25 pointer-events-none select-none"
          />
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Total Customers
            </p>
            <p className="text-3xl font-black text-white leading-tight">
              {isLoading ? "..." : customers.length}
            </p>
          </div>
        </div>

        {/* Add New Customer Button */}
        <button
          onClick={openCreate}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Add New Customer
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
              placeholder="Search customer name or phone..."
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
                  onClick={() => setFilterType(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    filterType === opt.id
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

        {/* Customer Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-gray-200 dark:bg-gray-800/50 rounded-2xl"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17102a]">
            <Users
              size={38}
              className="text-gray-300 dark:text-gray-600 mb-3"
            />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              No customers found
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              Try a different search or add a new customer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((item, index) => {
              const orderCount =
                item.orders?.filter((o) => !o.isDeleted)?.length || 0;
              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/customers/${item._id}`)}
                  className="bg-white dark:bg-[#17102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all duration-150"
                >
                  {/* Top Row: Avatar + Name + Actions */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          <Phone size={11} />
                          {item.phone}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionButtons
                        record={item}
                        onEdit={() => openEdit(item)}
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Status + Actions */}
                  <div
                    className="flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Measurement Badge */}
                      {item.measurement ? (
                        <button
                          onClick={() => openMeasureModal(item, "view")}
                          className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 text-[10px] font-bold cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <Ruler size={10} />
                          Measured
                        </button>
                      ) : (
                        <button
                          onClick={() => openMeasureModal(item, "add")}
                          className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 text-[10px] font-bold cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                        >
                          <Ruler size={10} />
                          Add Measurement
                        </button>
                      )}

                      {/* Orders Badge */}
                      {orderCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                          {orderCount} Order{orderCount !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 text-[10px] font-bold">
                          No Orders
                        </span>
                      )}
                    </div>

                    {/* Book Order Button */}
                    <button
                      onClick={() => openBookOrderModal(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition cursor-pointer active:scale-95"
                    >
                      <PlusCircle size={11} />
                      Book Order
                    </button>
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

export default MobileCustomersPage;
