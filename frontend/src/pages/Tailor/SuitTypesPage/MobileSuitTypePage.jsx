import { useState } from "react";
import { Plus, Tag, Ban, Redo, Filter, Search } from "lucide-react";

import tailorIcon from "../../../assets/tailor.png";
import ActionButtons from "../../../components/ActionButtons";

// Imports End---

const MobileSuitTypePage = ({
  suitTypes,
  filtered,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  isLoading,
  isRestoring,
  onAdd,
  onEdit,
  onVoid,
  onRestore,
}) => {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div className="block md:hidden -mx-4">
      <div className="px-4 space-y-3">
        {/* Purple Stat Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-4 flex items-center gap-4 shadow-lg shadow-purple-600/20">
          {/* Decorative tailor image */}
          <img
            src={tailorIcon}
            alt=""
            className="absolute right-2 top-1/2 -translate-y-1/2 h-16 w-16 object-contain opacity-25 pointer-events-none select-none"
          />
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Tag size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
              Total Suit Types
            </p>
            <p className="text-3xl font-black text-white leading-tight">
              {isLoading ? "..." : suitTypes.length}
            </p>
          </div>
        </div>

        {/* Add New Suit Type Button */}
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Add New Suit Type
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
              placeholder="Search suit type name..."
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
              Filter by Status
            </p>
            <div className="flex gap-2">
              {["all", "active", "inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer capitalize ${
                    statusFilter === status
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cards Grid */}
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
            <Tag size={38} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              No suit types found
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              Try a different search or add a new one
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((item, index) => (
              <div
                key={item._id}
                className="bg-white dark:bg-[#17102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
              >
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Rs.{" "}
                      <span className="font-extrabold text-purple-600 dark:text-purple-400">
                        {Number(item.price || 0).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 text-[10px] font-bold">
                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 text-[10px] font-bold">
                      <span className="size-1.5 rounded-full bg-gray-400" />
                      Inactive
                    </span>
                  )}
                  <ActionButtons
                    record={item}
                    onEdit={onEdit}
                    onDelete={item.isActive ? (r) => onVoid(r) : undefined}
                    deleteTitle="Void"
                    deleteIcon={Ban}
                  />
                  {!item.isActive && (
                    <button
                      title="Restore"
                      onClick={() => onRestore(item._id)}
                      disabled={isRestoring}
                      className="p-2 rounded-full border border-gray-300 dark:border-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition cursor-pointer disabled:opacity-50"
                    >
                      <Redo size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSuitTypePage;
