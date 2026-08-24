import { useNavigate } from "react-router-dom";
import { Ruler, UserPlus, UserRound, PlusCircle } from "lucide-react";

import CustomTable from "../../../components/CustomTable";
import ActionButtons from "../../../components/ActionButtons";
import SummaryCard from "../../../components/SummaryCard";
import SectionHeading from "../../../components/SectionHeading";
// Imports End----

const DesktopCustomersPage = ({
  filtered,
  search,
  setSearch,
  filterType,
  setFilterType,
  statCards,
  isLoading,
  openCreate,
  openEdit,
  openMeasureModal,
  openBookOrderModal,
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: "Sr.",
      key: "sr",
      width: 60,
      align: "center",
      sorter: (a, b) => a.sr - b.sr,
      render: (_, record) => record.sr,
    },
    {
      title: "Customer ID",
      dataIndex: "customerId",
      key: "customerId",
      sorter: (a, b) => (a.customerId || "").localeCompare(b.customerId || ""),
      render: (v) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Full Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (v) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {v}
        </span>
      ),
    },
    {
      title: "Mobile Number",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-300">{v}</span>
      ),
    },
    {
      title: "Measurement",
      key: "measurement",
      sorter: (a, b) => (a.measurement ? 1 : 0) - (b.measurement ? 1 : 0),
      render: (_, record) =>
        record.measurement ? (
          <button
            onClick={() => openMeasureModal(record, "view")}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
            title="View Measurement"
          >
            <span className="size-1.5 rounded-full bg-green-500 dark:bg-green-400" />
            Available
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2.5 py-0.5 text-xs font-semibold">
            <span className="size-1.5 rounded-full bg-red-500 dark:text-red-400" />
            Not Added
          </span>
        ),
    },
    {
      title: "Orders",
      key: "orders",
      sorter: (a, b) =>
        (a.orders?.filter((o) => !o.isDeleted)?.length || 0) -
        (b.orders?.filter((o) => !o.isDeleted)?.length || 0),
      render: (_, record) => {
        const count = record.orders?.filter((o) => !o.isDeleted)?.length || 0;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              count > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {count} Order{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1 flex-nowrap">
          <ActionButtons record={record} onEdit={(r) => openEdit(r)} />

          {!record.measurement && (
            <button
              onClick={() => openMeasureModal(record, "add")}
              className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:text-orange-400 cursor-pointer active:scale-90"
              title="Add Measurement"
            >
              <Ruler size={16} />
            </button>
          )}

          {record.measurement && (
            <button
              onClick={() => openMeasureModal(record, "edit")}
              className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:text-yellow-400 cursor-pointer active:scale-90"
              title="Edit Measurement"
            >
              <Ruler size={16} />
            </button>
          )}
          <button
            onClick={() => openBookOrderModal(record)}
            className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:text-purple-300 cursor-pointer active:scale-90"
            title="Book Order"
          >
            <PlusCircle size={16} />
          </button>
          <button
            onClick={() => navigate(`/customers/${record._id}`)}
            className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#2a1b44] dark:hover:text-blue-300 cursor-pointer active:scale-90"
            title="View"
          >
            <UserRound size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="hidden md:block">
      <div className="flex items-center justify-between gap-3 mb-2 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Customers"
          subtitle="Manage customer records and measurements"
        />
        <button
          onClick={openCreate}
          className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-sm font-semibold transition-all cursor-pointer text-white shadow-md hover:shadow-purple-500/30 active:scale-95 shrink-0"
        >
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 my-5">
        {statCards.map((card) => (
          <SummaryCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            count={card.count}
            color={card.color}
            isSelected={filterType === card.id}
            onClick={() =>
              setFilterType(
                filterType === card.id && card.id !== "all" ? "all" : card.id,
              )
            }
          />
        ))}
      </div>

      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered.map((item, index) => ({ ...item, sr: index + 1 }))}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer name, mobile number, ID..."
        totalLabel="Total Customers"
      />
    </div>
  );
};

export default DesktopCustomersPage;
