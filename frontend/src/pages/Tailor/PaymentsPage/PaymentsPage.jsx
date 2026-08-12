import dayjs from "dayjs";
import moment from "moment";
import { useState, useMemo } from "react";
import { Banknote, CalendarDays, Clock, Search, Wallet } from "lucide-react";

import CustomTable from "../../../components/CustomTable";
import CustomInput from "../../../components/CustomInput";
import CustomSelect from "../../../components/CustomSelect";
import SectionHeading from "../../../components/SectionHeading";
import CustomDatePicker from "../../../components/CustomDatePicker";

import { usePendingOrders } from "../../../hooks/usePendingOrders";
import { useGetOrderPayments } from "../../../hooks/useGetOrderPayments";
import { useOrderPaymentSummary } from "../../../hooks/useOrderPaymentSummary";
// Imports Emd-----

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

const PaymentsPage = () => {
  const [view, setView] = useState("history");
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeCard, setActiveCard] = useState(null);

  const handleCardClick = (cardId) => {
    if (cardId === "pending") {
      setView(view === "pending" ? "history" : "pending");
      setActiveCard(view === "pending" ? null : "pending");
      return;
    }
    setView("history");
    if (cardId === "total") {
      setDateFrom("");
      setDateTo("");
      setActiveCard(activeCard === "total" ? null : "total");
    } else if (cardId === "today") {
      const today = dayjs().format("YYYY-MM-DD");
      setDateFrom(today);
      setDateTo(today);
      setActiveCard(activeCard === "today" ? null : "today");
    } else if (cardId === "month") {
      setDateFrom(dayjs().startOf("month").format("YYYY-MM-DD"));
      setDateTo(dayjs().endOf("month").format("YYYY-MM-DD"));
      setActiveCard(activeCard === "month" ? null : "month");
    }
  };

  const filters = useMemo(
    () => ({
      search,
      method: filterMethod,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
    [search, filterMethod, dateFrom, dateTo],
  );

  const { payments, isLoading } = useGetOrderPayments(filters);
  const { summary } = useOrderPaymentSummary();
  const { pendingOrders, isLoading: pendingLoading } = usePendingOrders();

  const statCards = useMemo(
    () => [
      {
        id: "total",
        title: "Total Collected",
        count: `Rs. ${(summary?.totalCollected || 0).toLocaleString()}`,
        icon: Banknote,
        color: "#8b5cf6",
      },
      {
        id: "today",
        title: "Today's Collection",
        count: `Rs. ${(summary?.todayCollection || 0).toLocaleString()}`,
        icon: CalendarDays,
        color: "#10b981",
      },
      {
        id: "month",
        title: "This Month",
        count: `Rs. ${(summary?.monthCollection || 0).toLocaleString()}`,
        icon: Wallet,
        color: "#3b82f6",
      },
      {
        id: "pending",
        title: "Pending Amount",
        count: `Rs. ${(summary?.pendingAmount || 0).toLocaleString()}`,
        icon: Clock,
        color: "#f59e0b",
      },
    ],
    [summary],
  );

  const paymentColumns = [
    {
      title: "Sr.",
      key: "sr",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Payment ID",
      dataIndex: "paymentId",
      key: "paymentId",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      sorter: (a, b) =>
        (a.customerName || "").localeCompare(b.customerName || ""),
      render: (v) => (
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Order #",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (v) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
          {v || "-"}
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
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          Rs. {(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Method",
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
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {v ? moment(v).format("DD MMM YYYY") : "-"}
        </span>
      ),
    },
  ];

  const pendingColumns = [
    {
      title: "Sr.",
      key: "sr",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Order #",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (v) => (
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "customerPhone",
      key: "customerPhone",
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (v) => (
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          Rs. {(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Paid",
      dataIndex: "advancePaid",
      key: "advancePaid",
      align: "right",
      render: (v) => (
        <span className="font-semibold text-sm text-green-600 dark:text-green-400">
          Rs. {(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Remaining",
      dataIndex: "remainingBalance",
      key: "remainingBalance",
      align: "right",
      render: (v) => (
        <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
          Rs. {(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Delivery",
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {v ? moment(v).format("DD MMM YYYY") : "-"}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Payments"
          subtitle="View all payment history and track collections"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4 sm:my-5">
        {statCards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className="bg-white dark:bg-gray-900 rounded-xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4 border-l-4 transition-all duration-200 cursor-pointer hover:shadow-lg"
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
              style={{ backgroundColor: `${card.color}1A`, color: card.color }}
            >
              <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h4 className="text-gray-500 dark:text-gray-400 text-[13px] sm:text-sm truncate">
                {card.title}
              </h4>
              <p
                className="text-base sm:text-xl font-bold"
                style={{ color: card.color }}
              >
                {card.count}
              </p>
            </div>
          </div>
        ))}
      </div>

      {view === "history" ? (
        <>
          {/* Filters */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 my-4 px-1">
            <div className="col-span-2 lg:col-span-2 min-w-0">
              <CustomInput
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by payment ID, customer, or order #"
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
            <div className="col-span-2 lg:col-span-2 min-w-0">
              <CustomSelect
                value={filterMethod}
                onChange={(val) => setFilterMethod(val)}
                options={[
                  { value: "all", label: "All Methods" },
                  { value: "cash", label: "Cash" },
                  { value: "bank", label: "Bank Transfer" },
                  { value: "jazzcash", label: "JazzCash" },
                  { value: "easypaisa", label: "EasyPaisa" },
                ]}
                placeholder="Payment Method"
              />
            </div>
          </div>
          <CustomTable
            rowKey="_id"
            loading={isLoading}
            columns={paymentColumns}
            dataSource={payments}
            globalSearch={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search payments..."
            hideSearch
            totalLabel="Total Payments"
          />
        </>
      ) : (
        <>
          <CustomTable
            rowKey="_id"
            loading={pendingLoading}
            columns={pendingColumns}
            dataSource={pendingOrders}
            hideSearch
            searchPlaceholder="Search pending orders..."
            totalLabel="Pending Orders"
          />
        </>
      )}
    </>
  );
};

export default PaymentsPage;
