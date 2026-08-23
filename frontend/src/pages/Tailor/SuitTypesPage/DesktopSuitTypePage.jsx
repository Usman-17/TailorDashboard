import { Ban, Redo, SquarePen } from "lucide-react";

import CustomTable from "../../../components/CustomTable";
import ActionButtons from "../../../components/ActionButtons";
import SectionHeading from "../../../components/SectionHeading";
// Imports End----

const DesktopSuitTypePage = ({
  filtered,
  search,
  setSearch,
  isLoading,
  isRestoring,
  onAdd,
  onEdit,
  onVoid,
  onRestore,
}) => {
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
      title: "Suit Type Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (v) => (
        <span className="font-bold text-gray-900 dark:text-gray-100">{v}</span>
      ),
    },
    {
      title: "Price (PKR)",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
      render: (v) => (
        <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
          Rs. {Number(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      sorter: (a, b) => (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0),
      render: (isActive) =>
        isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-0.5 text-xs font-semibold">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-0.5 text-xs font-semibold">
            <span className="size-1.5 rounded-full bg-gray-400" />
            Inactive
          </span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1">
          <ActionButtons
            record={record}
            onEdit={onEdit}
            onDelete={record.isActive ? (r) => onVoid(r) : undefined}
            deleteTitle="Void"
            deleteIcon={Ban}
          />
          {!record.isActive && (
            <button
              title="Restore"
              onClick={() => onRestore(record._id)}
              disabled={isRestoring}
              className="p-2 rounded-full border border-gray-300 dark:border-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition cursor-pointer disabled:opacity-50"
            >
              <Redo size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="hidden md:block">
      {/* Desktop Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Suit Types"
          subtitle="Define suit types and default stitching prices"
        />
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-sm font-semibold transition-all cursor-pointer text-white shadow-sm"
        >
          <SquarePen size={18} />
          Add Suit Type
        </button>
      </div>

      {/* Desktop Table */}
      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered.map((item, index) => ({
          ...item,
          sr: index + 1,
        }))}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search suit type name..."
        totalLabel="Total Suit Types"
      />
    </div>
  );
};

export default DesktopSuitTypePage;
