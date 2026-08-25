import moment from "moment";
import { Ban, Search, Redo } from "lucide-react";

import CustomTable from "../../../components/CustomTable";
import CustomInput from "../../../components/CustomInput";
import CustomSelect from "../../../components/CustomSelect";
import ActionButtons from "../../../components/ActionButtons";
import SectionHeading from "../../../components/SectionHeading";
import CustomDatePicker from "../../../components/CustomDatePicker";

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

const DesktopExpensesPage = ({
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
  activeCard,
  statCards,
  handleCardClick,
  expenses,
  isLoading,
  onAdd,
  onEdit,
  onVoid,
  onRestore,
}) => {
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
        if (record.isVoided) {
          return (
            <button
              onClick={() => onRestore(record)}
              className="flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer transition-colors"
            >
              <Redo size={12} />
              Restore
            </button>
          );
        }
        const canEdit = isCurrentMonth(record.date);
        return (
          <ActionButtons
            record={record}
            onEdit={onEdit}
            onDelete={onVoid}
            editDisabled={!canEdit}
            deleteDisabled={!canEdit}
            deleteTitle="Void"
            deleteIcon={Ban}
          />
        );
      },
    },
  ];

  return (
    <div className="hidden sm:block">
      <div className="flex items-center justify-between gap-3 mb-2 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Expenses"
          subtitle="Track and manage all your business expenses"
        />
        <button
          onClick={onAdd}
          className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-sm font-semibold transition-all cursor-pointer text-white shadow-md hover:shadow-purple-500/30 active:scale-95 shrink-0"
        >
          <Redo size={16} /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4 my-4 sm:my-5">
        {statCards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border-l-4 transition-all duration-200 cursor-pointer hover:shadow-lg"
            style={{
              borderColor: card.color,
              boxShadow:
                activeCard === card.id
                  ? `0 0 0 2px ${card.color}40, 0 4px 12px ${card.color}20`
                  : undefined,
            }}
          >
            <div
              className="p-2.5 sm:p-3 rounded-full shrink-0"
              style={{
                backgroundColor: `${card.color}1A`,
                color: card.color,
              }}
            >
              <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h4 className="text-gray-500 dark:text-gray-400 text-[13px] sm:text-sm truncate">
                {card.title}
              </h4>
              <p
                className="text-lg sm:text-xl font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ color: card.color }}
              >
                {card.count}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 my-4 px-1">
        <div className="col-span-2 lg:col-span-1 min-w-0">
          <CustomInput
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense ID or title..."
          />
        </div>
        <div className="min-w-0">
          <CustomDatePicker
            value={dateFrom || null}
            onChange={(d) => setDateFrom(d ? d.format("YYYY-MM-DD") : "")}
            placeholder="From"
            allowClear
          />
        </div>
        <div className="min-w-0">
          <CustomDatePicker
            value={dateTo || null}
            onChange={(d) => setDateTo(d ? d.format("YYYY-MM-DD") : "")}
            placeholder="To"
            allowClear
          />
        </div>
        <div className="min-w-0">
          <CustomSelect
            allowClear={false}
            value={filterCategory}
            onChange={(val) => setFilterCategory(val)}
            options={[{ value: "all", label: "All Categories" }, ...CATEGORIES]}
            placeholder="Category"
          />
        </div>
        <div className="min-w-0">
          <CustomSelect
            allowClear={false}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            options={[
              { value: "active", label: "Active" },
              { value: "voided", label: "Voided" },
            ]}
            placeholder="Status"
          />
        </div>
        <div className="min-w-0">
          <CustomSelect
            allowClear={false}
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
    </div>
  );
};

export default DesktopExpensesPage;
