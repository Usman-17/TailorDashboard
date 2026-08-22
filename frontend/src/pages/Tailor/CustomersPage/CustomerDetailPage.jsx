import moment from "moment";
import { Link, useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Hash,
  Calendar,
  ShoppingBag,
  Wallet,
  Ruler,
  History,
  BadgeCheck,
  Ban,
} from "lucide-react";

import useGetCustomerDetail from "../../../hooks/useGetCustomerDetail";

import SummaryCard from "../../../components/SummaryCard";
import SectionHeading from "../../../components/SectionHeading";
import {
  KAMEEZ_FIELDS,
  SHALWAR_FIELDS,
  TROUSER_FIELDS,
  lowerFieldTitle,
} from "./measurementFields";
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

const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  bank: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
  online: "Online",
};

const TYPE_LABELS = { advance: "Advance", partial: "Partial", final: "Final" };

const METHOD_COLORS = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  jazzcash:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  easypaisa:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  online: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
};

const TYPE_COLORS = {
  advance:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  partial: "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
  final: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const MeasurementSection = ({ measurement, title, isCurrent = false }) => {
  const [activeLowerTab, setActiveLowerTab] = useState("shalwar");

  useEffect(() => {
    const hasTrouserData = TROUSER_FIELDS.some(
      (f) =>
        measurement?.[f] !== undefined &&
        measurement?.[f] !== "" &&
        measurement?.[f] !== null,
    );
    const hasShalwarData = SHALWAR_FIELDS.some(
      (f) =>
        measurement?.[f] !== undefined &&
        measurement?.[f] !== "" &&
        measurement?.[f] !== null,
    );
    if (hasTrouserData && !hasShalwarData) {
      setActiveLowerTab("trouser");
    }
  }, [measurement]);

  const value = (v) => (v === 0 ? "0" : (v ?? "-"));
  const activeLowerFields =
    activeLowerTab === "trouser" ? TROUSER_FIELDS : SHALWAR_FIELDS;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCurrent
          ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </h4>
        {isCurrent && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-0.5">
            <BadgeCheck size={13} /> Current
          </span>
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {measurement?.createdAt
            ? moment(measurement.createdAt).format("DD MMM YYYY")
            : "-"}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            Kameez
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
            {KAMEEZ_FIELDS.map((f) => (
              <div
                key={f}
                className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700/60 pb-1"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {lowerFieldTitle(f)}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {value(measurement?.[f])}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {activeLowerTab === "trouser" ? "Trouser" : "Shalwar"}
            </p>
            <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveLowerTab("shalwar")}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeLowerTab === "shalwar"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Shalwar
              </button>
              <button
                type="button"
                onClick={() => setActiveLowerTab("trouser")}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeLowerTab === "trouser"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Trouser
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
            {activeLowerFields.map((f) => (
              <div
                key={f}
                className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700/60 pb-1"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {lowerFieldTitle(f)}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {value(measurement?.[f])}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {measurement?.remarks && (
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/60 rounded-lg px-3 py-2">
          <span className="font-semibold">Remarks: </span>
          {measurement.remarks}
        </p>
      )}
    </div>
  );
};

const CustomerDetailPage = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetCustomerDetail(id);

  const [activeTab, setActiveTab] = useState("orders");

  const customer = data?.customer || null;
  const orders = useMemo(() => data?.orders || [], [data]);
  const payments = data?.payments || [];
  const measurements = useMemo(() => data?.measurements || [], [data]);

  const currentMeasurement = customer?.measurement || measurements[0] || null;
  const oldMeasurements = useMemo(() => {
    const currentId = currentMeasurement?._id;
    return measurements.filter((m) => m._id !== currentId);
  }, [measurements, currentMeasurement]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalPaid = orders.reduce((s, o) => s + (o.advancePaid || 0), 0);
    const outstanding = Math.max(0, totalAmount - totalPaid);
    return { totalOrders, totalAmount, totalPaid, outstanding };
  }, [orders]);

  const statCards = [
    {
      id: "orders",
      title: "Total Orders",
      count: stats.totalOrders,
      icon: ShoppingBag,
      color: "#6366F1",
    },
    {
      id: "total",
      title: "Total Amount",
      count: `Rs. ${stats.totalAmount.toLocaleString()}`,
      icon: Wallet,
      color: "#10B981",
    },
    {
      id: "paid",
      title: "Total Paid",
      count: `Rs. ${stats.totalPaid.toLocaleString()}`,
      icon: BadgeCheck,
      color: "#F59E0B",
    },
    {
      id: "outstanding",
      title: "Outstanding",
      count: `Rs. ${stats.outstanding.toLocaleString()}`,
      icon: Ban,
      color: "#EF4444",
    },
  ];

  const tabs = [
    {
      id: "orders",
      label: `Orders (${orders.length})`,
      icon: ShoppingBag,
    },
    {
      id: "payments",
      label: `Payments (${payments.length})`,
      icon: Wallet,
    },
    {
      id: "measurements",
      label: `Measurements (${measurements.length})`,
      icon: Ruler,
    },
  ];

  if (isLoading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"
              />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Customer not found.
        </p>
        <div className="text-center mt-4">
          <Link
            to="/customers"
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Customer Details"
          subtitle="Complete profile, orders, payments and measurements"
          subtitleClassName="max-w-56 sm:max-w-none"
        />
        <Link
          to="/customers"
          className="p-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-600 dark:hover:border-purple-400 transition-colors cursor-pointer shrink-0"
          title="Close"
        >
          <X size={18} />
        </Link>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] p-4 sm:p-5 my-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
          <div className="size-12 sm:size-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 text-white flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
            {(customer.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-words">
                {customer.name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1.5 mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5">
                <Hash size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{customer.customerId}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400 shrink-0" />
                {customer.phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User size={13} className="text-gray-400 shrink-0" />
                Joined {moment(customer.createdAt).format("DD MMM YYYY")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                {orders.length} orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-5">
        {statCards.map((card) => (
          <SummaryCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            count={card.count}
            color={card.color}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] overflow-hidden">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <ShoppingBag
                size={40}
                className="text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No orders found for this customer
              </p>
              <Link
                to="/customers"
                className="mt-3 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Book an order from Customers page
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Delivery Date</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {moment(order.createdAt).format("DD MMM YYYY")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {moment(order.deliveryDate).format("DD MMM YYYY")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {(order.items || []).slice(0, 2).map((item, i) => (
                            <span
                              key={i}
                              className="text-xs text-gray-600 dark:text-gray-300"
                            >
                              {item.suitType}{" "}
                              {item.quantity > 1 ? `x${item.quantity}` : ""}
                            </span>
                          ))}
                          {(order.items || []).length > 2 && (
                            <span className="text-[11px] text-gray-400">
                              +{(order.items || []).length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                            STATUS_COLORS[order.status] || STATUS_COLORS.pending
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-100">
                        Rs. {(order.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-green-600 dark:text-green-400">
                        Rs. {(order.advancePaid || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-red-500 dark:text-red-400">
                        Rs.{" "}
                        {Math.max(
                          0,
                          order.remainingBalance || 0,
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] overflow-hidden">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <Wallet
                size={40}
                className="text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No payments found for this customer
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Payment ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {payment.paymentId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {moment(payment.createdAt).format(
                          "DD MMM YYYY, h:mm A",
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                          {payment.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-100">
                        Rs. {(payment.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                            METHOD_COLORS[payment.method] || METHOD_COLORS.cash
                          }`}
                        >
                          {PAYMENT_METHOD_LABELS[payment.method] ||
                            payment.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                            TYPE_COLORS[payment.paymentType] ||
                            TYPE_COLORS.partial
                          }`}
                        >
                          {TYPE_LABELS[payment.paymentType] ||
                            payment.paymentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {payment.referenceNo || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                            payment.isVoided
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          }`}
                        >
                          {payment.isVoided ? "Voided" : "Paid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Measurements Tab */}
      {activeTab === "measurements" && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            <Ruler size={16} className="text-purple-500" />
            Current Measurement
          </div>
          {currentMeasurement ? (
            <MeasurementSection
              measurement={currentMeasurement}
              title="Latest Measurement"
              isCurrent
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <Ruler
                size={40}
                className="text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No measurement added for this customer yet
              </p>
            </div>
          )}

          {oldMeasurements.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <History size={16} className="text-gray-400" />
                Measurement History ({oldMeasurements.length})
              </div>
              <div className="space-y-3">
                {oldMeasurements.map((m) => (
                  <MeasurementSection
                    key={m._id}
                    measurement={m}
                    title={`Measurement - ${moment(m.createdAt).format("DD MMM YYYY")}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
