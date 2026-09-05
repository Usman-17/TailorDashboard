import moment from "moment";
import { Link, useParams } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronLeft,
  Plus,
  SquarePen,
} from "lucide-react";

import useGetCustomerDetail from "../../../hooks/useGetCustomerDetail";

import SummaryCard from "../../../components/SummaryCard";
import BookOrderModal from "./BookOrderModal";
import EditOrderModal from "../OrdersPage/EditOrderModal";
import {
  KAMEEZ_FIELDS,
  SHALWAR_FIELDS,
  TROUSER_FIELDS,
  lowerFieldTitle,
  initialMeasurementState,
} from "./measurementFields";
import MeasurementModal from "./MeasurementModal";
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
  const [bookOrderOpen, setBookOrderOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [measureForm, setMeasureForm] = useState(initialMeasurementState);
  const tabRefs = useRef({});

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
      {/* Desktop Header (handled by global Header on mobile) */}
      <div className="hidden md:flex items-center justify-between pb-3.5 mb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Link
            to="/customers"
            className="size-8 -ml-1 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
          >
            <ChevronLeft size={22} />
          </Link>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
              Customer
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Profile, orders, payments &amp; measurements
            </p>
          </div>
        </div>
        <Link
          to="/customers"
          className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 text-gray-500 dark:text-gray-400 transition-all cursor-pointer"
        >
          <X size={20} />
        </Link>
      </div>
      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white break-words">
            {customer.name}
          </h3>
          {customer.customerId && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
              ID: {customer.customerId}
            </span>
          )}
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Phone size={14} className="text-gray-400 shrink-0" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span>
              Customer Since: {moment(customer.createdAt).format("DD MMM YYYY")}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 active:scale-95 text-white text-sm font-bold shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Phone size={15} />
            Call
          </a>
          <a
            href={`https://wa.me/${customer.phone?.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 active:scale-95 text-white text-sm font-bold shadow-md shadow-green-600/25 transition-all cursor-pointer"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Whatsapp
          </a>
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
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            onClick={() => {
              setActiveTab(tab.id);
              tabRefs.current[tab.id]?.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
              });
            }}
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
      </div>{" "}
      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div>
          {/* Action Bar with Add New Order Button */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Orders ({orders.length})
            </span>
            <button
              type="button"
              onClick={() => setBookOrderOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Add New Order
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17102a] flex flex-col items-center justify-center py-14 text-center px-4">
              <ShoppingBag
                size={40}
                className="text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                No orders found for this customer
              </p>
              <button
                type="button"
                onClick={() => setBookOrderOpen(true)}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Plus size={15} />
                Book First Order
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards Grid */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {orders.map((order, index) => (
                  <div
                    key={order._id}
                    className="bg-white dark:bg-[#17102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    {/* Top Row: Order # + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                          <ShoppingBag
                            size={16}
                            className="text-purple-600 dark:text-purple-400"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white block truncate">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold rounded-full px-2.5 py-0.5 shrink-0 ${
                          STATUS_COLORS[order.status] || STATUS_COLORS.pending
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="flex flex-wrap gap-1.5 py-0.5">
                      {(order.items || []).map((item, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-lg px-2.5 py-1 font-medium"
                        >
                          {item.suitType}{" "}
                          {item.quantity > 1 ? `×${item.quantity}` : ""}
                        </span>
                      ))}
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-dashed border-gray-100 dark:border-gray-800">
                      <div>
                        <span className="text-gray-400 block text-[11px]">
                          Order Date
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {moment(order.createdAt).format("DD MMM YYYY")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">
                          Delivery Date
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {moment(order.deliveryDate).format("DD MMM YYYY")}
                        </span>
                      </div>
                    </div>

                    {/* Financials Row: Total / Paid / Balance */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div>
                        <span className="text-gray-400 block text-[10px]">
                          Total
                        </span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          Rs. {(order.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">
                          Paid
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          Rs. {(order.advancePaid || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 block text-[10px]">
                          Balance
                        </span>
                        <span className="font-bold text-red-500 dark:text-red-400">
                          Rs.{" "}
                          {Math.max(
                            0,
                            order.remainingBalance || 0,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => setEditingOrderId(order._id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <SquarePen size={14} />
                        Edit Order
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] overflow-hidden">
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
                              {(order.items || [])
                                .slice(0, 2)
                                .map((item, i) => (
                                  <span
                                    key={i}
                                    className="text-xs text-gray-600 dark:text-gray-300"
                                  >
                                    {item.suitType}{" "}
                                    {item.quantity > 1
                                      ? `x${item.quantity}`
                                      : ""}
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
                                STATUS_COLORS[order.status] ||
                                STATUS_COLORS.pending
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
              </div>
            </>
          )}
        </div>
      )}
      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div>
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17102a] flex flex-col items-center justify-center py-14 text-center px-4">
              <Wallet
                size={40}
                className="text-gray-300 dark:text-gray-600 mb-3"
              />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                No payments found for this customer
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Payments Grid */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="bg-white dark:bg-[#17102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    {/* Top Row: Payment ID + Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-9 rounded-xl bg-green-50 dark:bg-green-950/50 flex items-center justify-center shrink-0">
                          <Wallet
                            size={16}
                            className="text-green-600 dark:text-green-400"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white block truncate">
                            {payment.paymentId}
                          </span>
                          <span className="text-[11px] text-gray-400 block">
                            Order:{" "}
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                              {payment.orderNumber}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-green-600 dark:text-green-400 block leading-tight">
                          Rs. {(payment.amount || 0).toLocaleString()}
                        </span>
                        <span
                          className={`inline-block mt-0.5 text-[10px] font-bold rounded-full px-2 py-0.2 ${
                            payment.isVoided
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          }`}
                        >
                          {payment.isVoided ? "Voided" : "Paid"}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Method, Type & Date */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                            METHOD_COLORS[payment.method] || METHOD_COLORS.cash
                          }`}
                        >
                          {PAYMENT_METHOD_LABELS[payment.method] ||
                            payment.method}
                        </span>
                        <span
                          className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                            TYPE_COLORS[payment.paymentType] ||
                            TYPE_COLORS.partial
                          }`}
                        >
                          {TYPE_LABELS[payment.paymentType] ||
                            payment.paymentType}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {moment(payment.createdAt).format(
                          "DD MMM YYYY, h:mm A",
                        )}
                      </span>
                    </div>

                    {/* Reference (if present) */}
                    {payment.referenceNo && (
                      <div className="text-[11px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-800/40 rounded-lg px-2.5 py-1">
                        Ref: {payment.referenceNo}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17102a] overflow-hidden">
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
                                METHOD_COLORS[payment.method] ||
                                METHOD_COLORS.cash
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
              </div>
            </>
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No measurement added for this customer yet
              </p>
              <button
                onClick={() => {
                  setMeasureForm(initialMeasurementState);
                  setMeasureModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition cursor-pointer"
              >
                <Plus size={16} />
                Add Measurement
              </button>
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
      {/* Book Order Modal */}
      <BookOrderModal
        open={bookOrderOpen}
        onClose={() => setBookOrderOpen(false)}
        customer={customer}
      />
      {/* Edit Order Modal */}
      <EditOrderModal
        open={!!editingOrderId}
        onClose={() => setEditingOrderId(null)}
        orderId={editingOrderId}
      />
      {/* Measurement Modal */}
      <MeasurementModal
        open={measureModalOpen}
        onClose={() => setMeasureModalOpen(false)}
        mode="add"
        customer={customer}
        measureForm={measureForm}
        setMeasureForm={setMeasureForm}
      />
    </div>
  );
};

export default CustomerDetailPage;
