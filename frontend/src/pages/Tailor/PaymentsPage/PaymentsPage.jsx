import moment from "moment";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Banknote,
  CalendarDays,
  Clock,
  CreditCard,
  Eye,
  Search,
  Wallet,
  Ban,
  CreditCardIcon,
  XCircle,
} from "lucide-react";

import SectionHeading from "../../../components/SectionHeading";
import CustomTable from "../../../components/CustomTable";
import FullScreenModal from "../../../components/FullScreenModal";
import CustomModal from "../../../components/CustomModal";
import CustomSelect from "../../../components/CustomSelect";

import { useGetOrderPayments } from "../../../hooks/useGetOrderPayments";
import { useOrderPaymentSummary } from "../../../hooks/useOrderPaymentSummary";
import { usePendingOrders } from "../../../hooks/usePendingOrders";

const METHOD_LABELS = {
  cash: "Cash",
  bank: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
};
const TYPE_LABELS = { advance: "Advance", partial: "Partial", final: "Final" };
const METHOD_COLORS = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  jazzcash:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  easypaisa:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};
const TYPE_COLORS = {
  advance:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  partial: "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
  final: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};
const STATUS_COLORS = {
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  voided: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
];

const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState("history");
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payOrder, setPayOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentRefNo, setPaymentRefNo] = useState("");

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
      const today = new Date().toISOString().slice(0, 10);
      setDateFrom(today);
      setDateTo(today);
      setActiveCard(activeCard === "today" ? null : "today");
    } else if (cardId === "month") {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      setDateFrom(first);
      setDateTo(last);
      setActiveCard(activeCard === "month" ? null : "month");
    }
  };

  const filters = useMemo(
    () => ({
      search,
      method: filterMethod,
      type: filterType,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
    [search, filterMethod, filterType, dateFrom, dateTo],
  );

  const { payments, isLoading } = useGetOrderPayments(filters);
  const { summary } = useOrderPaymentSummary();
  const { pendingOrders, isLoading: pendingLoading } = usePendingOrders();

  const { mutate: voidPayment } = useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await fetch(`/api/order-payments/void/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to void payment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payment voided successfully");
      setSelectedPayment(null);
      queryClient.invalidateQueries({ queryKey: ["orderPayments"] });
      queryClient.invalidateQueries({ queryKey: ["orderPaymentSummary"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: addPayment, isPending: isAddingPayment } = useMutation({
    mutationFn: async ({ orderId, amount, method, note, referenceNo }) => {
      const res = await fetch(`/api/orders/payment/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, method, note, referenceNo }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add payment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      setPayModalOpen(false);
      setPayOrder(null);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNote("");
      setPaymentRefNo("");
      queryClient.invalidateQueries({ queryKey: ["orderPayments"] });
      queryClient.invalidateQueries({ queryKey: ["orderPaymentSummary"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const openPayModal = (order) => {
    setPayOrder(order);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentNote("");
    setPaymentRefNo("");
    setPayModalOpen(true);
  };

  const handlePaySubmit = () => {
    if (!payOrder) return;
    const amt = paymentAmount
      ? Number(paymentAmount)
      : payOrder.remainingBalance;
    if (amt <= 0) return toast.error("Invalid amount");
    if (
      ["bank", "jazzcash", "easypaisa"].includes(paymentMethod) &&
      !paymentRefNo
    ) {
      return toast.error(
        "Reference/Transaction ID is required for this method",
      );
    }
    addPayment({
      orderId: payOrder._id,
      amount: amt,
      method: paymentMethod,
      note: paymentNote,
      referenceNo: paymentRefNo,
    });
  };

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
      title: "Type",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (v) => (
        <span
          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${TYPE_COLORS[v] || ""}`}
        >
          {TYPE_LABELS[v] || v}
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
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const status = record.isVoided ? "voided" : "paid";
        return (
          <span
            className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${STATUS_COLORS[status]}`}
          >
            {status === "paid" ? "Paid" : "Voided"}
          </span>
        );
      },
    },
    {
      title: "Received By",
      key: "receivedBy",
      render: (_, record) => (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {record.receivedBy?.fullName || "-"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 80,
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setSelectedPayment(record)}
            className="p-2 rounded-full border transition-all duration-200 shadow-sm cursor-pointer bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#2a1b44] dark:hover:text-blue-300"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {!record.isVoided && (
            <button
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to void this payment?")
                ) {
                  const reason = window.prompt("Reason (optional):") || "";
                  voidPayment({ id: record._id, reason });
                }
              }}
              className="p-2 rounded-full border transition-all duration-200 shadow-sm cursor-pointer bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#2a1b44] dark:hover:text-red-300"
              title="Void Payment"
            >
              <Ban size={16} />
            </button>
          )}
        </div>
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
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 120,
      render: (_, record) => (
        <button
          onClick={() => openPayModal(record)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer"
        >
          <CreditCardIcon size={14} /> Receive
        </button>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-5">
        {statCards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`bg-white shadow-md rounded-xl p-5 flex items-center gap-4 border-l-4 transition-all duration-200 cursor-pointer hover:shadow-lg`}
            style={{
              borderColor: card.color,
              boxShadow:
                activeCard === card.id
                  ? `0 0 0 2px ${card.color}40, 0 4px 12px ${card.color}20`
                  : undefined,
            }}
          >
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${card.color}1A`, color: card.color }}
            >
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-600 text-sm">{card.title}</h4>
              <p className="text-xl font-bold" style={{ color: card.color }}>
                {card.count}
              </p>
            </div>
          </div>
        ))}
      </div>

      {view === "history" ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 my-4 px-1">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by payment ID, customer, or order #"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="w-full sm:w-44">
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
            <div className="w-full sm:w-40">
              <CustomSelect
                value={filterType}
                onChange={(val) => setFilterType(val)}
                options={[
                  { value: "all", label: "All Types" },
                  { value: "advance", label: "Advance" },
                  { value: "partial", label: "Partial" },
                  { value: "final", label: "Final" },
                ]}
                placeholder="Payment Type"
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

      {/* View Payment Modal */}
      <FullScreenModal
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Details"
        subtitle={selectedPayment?.paymentId || ""}
      >
        {selectedPayment && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Payment Info
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Payment ID
                  </p>
                  <p className="text-sm font-mono font-semibold text-purple-600 dark:text-purple-400">
                    {selectedPayment.paymentId}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Amount
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Rs. {(selectedPayment.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Date
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {moment(selectedPayment.createdAt).format(
                      "DD MMM YYYY, hh:mm A",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <span
                    className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 ${STATUS_COLORS[selectedPayment.isVoided ? "voided" : "paid"]}`}
                  >
                    {selectedPayment.isVoided ? "Voided" : "Paid"}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={16} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Customer & Order
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Customer
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.customerName ||
                      selectedPayment.customer?.name ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Order #
                  </p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.orderNumber ||
                      selectedPayment.order?.orderNumber ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Customer Phone
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.customer?.phone || "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={16} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Payment Method
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Method
                  </p>
                  <span
                    className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 ${METHOD_COLORS[selectedPayment.method] || ""}`}
                  >
                    {METHOD_LABELS[selectedPayment.method] ||
                      selectedPayment.method}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Payment Type
                  </p>
                  <span
                    className={`inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 ${TYPE_COLORS[selectedPayment.paymentType] || ""}`}
                  >
                    {TYPE_LABELS[selectedPayment.paymentType] ||
                      selectedPayment.paymentType}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Reference/Transaction ID
                  </p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.referenceNo || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Received By
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.receivedBy?.fullName || "-"}
                  </p>
                </div>
                {selectedPayment.note && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Notes
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedPayment.note}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {selectedPayment.isVoided && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ban size={16} className="text-red-500" />
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Voided Payment
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-red-500">Voided At</p>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      {selectedPayment.voidedAt
                        ? moment(selectedPayment.voidedAt).format(
                            "DD MMM YYYY, hh:mm A",
                          )
                        : "-"}
                    </p>
                  </div>
                  {selectedPayment.voidReason && (
                    <div>
                      <p className="text-[11px] text-red-500">Reason</p>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {selectedPayment.voidReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </FullScreenModal>

      {/* Receive Payment Modal */}
      <CustomModal isOpen={payModalOpen}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Receive Payment
              </h3>
              {payOrder && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {payOrder.orderNumber} — {payOrder.customerName} (Remaining:
                  Rs. {payOrder.remainingBalance?.toLocaleString()})
                </p>
              )}
            </div>
            <button
              onClick={() => setPayModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              <XCircle size={18} />
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (Remaining: Rs.{" "}
              {payOrder?.remainingBalance?.toLocaleString() || 0})
            </label>
            <input
              type="number"
              min="1"
              max={payOrder?.remainingBalance || 0}
              value={paymentAmount || payOrder?.remainingBalance || ""}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={`Rs. ${payOrder?.remainingBalance?.toLocaleString() || 0}`}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <CustomSelect
              label="Method"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
              options={PAYMENT_METHODS.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
              placeholder="Select method"
            />
          </div>
          {["bank", "jazzcash", "easypaisa"].includes(paymentMethod) && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference/Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentRefNo}
                onChange={(e) => setPaymentRefNo(e.target.value)}
                placeholder="Enter reference or transaction ID"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Optional note"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setPayModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePaySubmit}
              disabled={
                Number(paymentAmount || payOrder?.remainingBalance || 0) <= 0 ||
                isAddingPayment ||
                (["bank", "jazzcash", "easypaisa"].includes(paymentMethod) &&
                  !paymentRefNo)
              }
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isAddingPayment ? "Processing..." : "Save Payment"}
            </button>
          </div>
        </div>
      </CustomModal>
    </>
  );
};

export default PaymentsPage;
