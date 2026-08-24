import moment from "moment";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Edit3,
  Phone,
  Scissors,
  Shirt,
  XCircle,
  ChevronRight,
  MapPin,
  Package,
} from "lucide-react";

import { useGetOrder } from "../../../hooks/useGetOrder";

import CustomModal from "../../../components/CustomModal";
import CustomSelect from "../../../components/CustomSelect";
import FullScreenModal from "../../../components/FullScreenModal";
// Imports End----

const STATUS_FLOW = [
  { value: "pending", label: "Pending", icon: Clock, color: "text-yellow-500" },
  {
    value: "in_progress",
    label: "In Progress",
    icon: Scissors,
    color: "text-blue-500",
  },
  {
    value: "ready",
    label: "Ready",
    icon: CheckCircle,
    color: "text-indigo-500",
  },
  {
    value: "delivered",
    label: "Delivered",
    icon: CheckCircle,
    color: "text-green-500",
  },
];

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

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
];

const OrderDetailPage = ({ orderId, open, onClose, onEditOrder }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { order, isLoading } = useGetOrder(orderId);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: async ({ status, note = "" }) => {
      const res = await fetch(`/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, note }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: addPayment, isPending: isAddingPayment } = useMutation({
    mutationFn: async () => {
      const amount = paymentAmount ? Number(paymentAmount) : remaining;
      const res = await fetch(`/api/orders/payment/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount,
          method: paymentMethod,
          note: paymentNote,
          referenceNo: paymentRefNo,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add payment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNote("");
      setPaymentRefNo("");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: cancelOrder, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled", note: "Order cancelled" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel order");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const totalPaid = order?.advancePaid || 0;
  const remaining = (order?.totalAmount || 0) - totalPaid;
  const currentStatusIndex = order
    ? STATUS_FLOW.findIndex((s) => s.value === order.status)
    : -1;
  const canCancel =
    order && order.status !== "delivered" && order.status !== "cancelled";

  const getNextStatus = () => {
    if (
      currentStatusIndex >= 0 &&
      currentStatusIndex < STATUS_FLOW.length - 1
    ) {
      return STATUS_FLOW[currentStatusIndex + 1].value;
    }
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <>
      <FullScreenModal
        open={open}
        onClose={onClose}
        showClose={false}
        title={
          isLoading
            ? "Order Details"
            : order
              ? `Order Details`
              : "Order Details"
        }
        subtitle={order ? order.orderNumber : ""}
        actions={
          order && (
            <div className="flex items-center gap-2">
              {order.status !== "ready" &&
                order.status !== "delivered" &&
                order.status !== "cancelled" && (
                  <button
                    onClick={() =>
                      onEditOrder
                        ? onEditOrder(order._id)
                        : navigate(`/orders/edit/${order._id}`)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              {canCancel && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to cancel this order?",
                      )
                    ) {
                      cancelOrder();
                    }
                  }}
                  disabled={isCancelling}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50 cursor-pointer"
                >
                  <XCircle size={14} /> Cancel
                </button>
              )}
            </div>
          )
        }
      >
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          )}

          {!isLoading && !order && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Order not found
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          )}

          {!isLoading && order && (
            <>
              {/* Status + Total Amount Bar */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}
                  >
                    {order.status === "in_progress" && <Scissors size={12} />}
                    {order.status === "pending" && <Clock size={12} />}
                    {order.status === "ready" && <CheckCircle size={12} />}
                    {order.status === "delivered" && <CheckCircle size={12} />}
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      PKR {(order.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Order #
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Created
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {moment(order.createdAt).format("DD MMM YYYY")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Delivery
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {order.deliveryDate
                        ? moment(order.deliveryDate).format("DD MMM YYYY")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Card */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                      Customer
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {order.customer?.name || "-"}
                    </p>
                    {order.customer?.phone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {order.customer.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {order.customer?.phone && (
                      <>
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition"
                        >
                          <Phone size={16} />
                        </a>
                        <button
                          onClick={() => {
                            let phone = order.customer.phone.replace(
                              /[^0-9]/g,
                              "",
                            );
                            if (phone.startsWith("0"))
                              phone = "92" + phone.slice(1);
                            window.open(
                              `https://wa.me/${phone}?text=${encodeURIComponent(
                                `Assalam o Alaikum ${order.customer.name},\n\nRegarding your order ${order.orderNumber}...`,
                              )}`,
                              "_blank",
                            );
                          }}
                          className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:bg-[#1da851] transition"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Progress Timeline */}
              {order.status !== "cancelled" && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Order Progress
                    </h3>
                    <button
                      onClick={() => setShowTimeline(!showTimeline)}
                      className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 hover:text-purple-700 transition cursor-pointer"
                    >
                      {showTimeline ? "Hide" : "View Timeline"}{" "}
                      <ChevronRight
                        size={12}
                        className={`transition-transform ${showTimeline ? "rotate-90" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      {STATUS_FLOW.map((step, i) => {
                        const isCurrent = order.status === step.value;
                        const isPast = currentStatusIndex > i;
                        const isDone =
                          isPast ||
                          (step.value === "delivered" &&
                            order.status === "delivered");
                        const StepIcon = step.icon;

                        return (
                          <div
                            key={step.value}
                            className="flex flex-col items-center relative z-10"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                isDone
                                  ? "bg-green-500 border-green-500 text-white"
                                  : isCurrent
                                    ? "bg-purple-600 border-purple-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle size={14} />
                              ) : (
                                <StepIcon size={14} />
                              )}
                            </div>
                            <p
                              className={`text-[10px] font-medium mt-1.5 text-center leading-tight ${
                                isDone
                                  ? "text-green-600 dark:text-green-400"
                                  : isCurrent
                                    ? "text-purple-600 dark:text-purple-400 font-bold"
                                    : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {step.label}
                            </p>
                            {isDone && (
                              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                                {(() => {
                                  const event = (
                                    order.statusHistory || []
                                  ).find((sh) => sh.status === step.value);
                                  return event
                                    ? moment(event.changedAt).format("DD MMM")
                                    : "";
                                })()}
                              </p>
                            )}
                            {isCurrent && !isDone && (
                              <p className="text-[9px] text-purple-500 dark:text-purple-400 mt-0.5 font-medium">
                                {moment(order.updatedAt).format("DD MMM")}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Progress line behind circles */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (currentStatusIndex / (STATUS_FLOW.length - 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Next Status Button */}
                  {nextStatus && (
                    <button
                      onClick={() =>
                        updateStatus({
                          status: nextStatus,
                          note: `Status changed to ${STATUS_LABELS[nextStatus]}`,
                        })
                      }
                      disabled={isUpdatingStatus}
                      className="w-full mt-4 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingStatus
                        ? "Updating..."
                        : `Mark as ${STATUS_LABELS[nextStatus]}`}
                    </button>
                  )}

                  {/* Expanded Timeline */}
                  {showTimeline && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                      {(order.statusHistory || [])
                        .slice()
                        .reverse()
                        .map((event, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                {STATUS_LABELS[event.status] || event.status}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {moment(event.changedAt).format(
                                  "DD MMM YYYY, hh:mm A",
                                )}
                                {event.note && ` — ${event.note}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      {(order.statusHistory || []).length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                          No status history
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
                  <span className="text-xs font-semibold rounded-full px-4 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                    Order Cancelled
                  </span>
                </div>
              )}

              {/* Suit Items — Order Details */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package
                      size={16}
                      className="text-purple-600 dark:text-purple-400"
                    />{" "}
                    Order Details
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-0.5 font-medium">
                    {order.items?.length || 0}{" "}
                    {order.items?.length === 1 ? "Suit" : "Suits"}
                  </span>
                </div>

                <div className="space-y-4">
                  {(order.items || []).map((item, i) => (
                    <div
                      key={item._id || i}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {item.suitType}
                            </p>
                            {item.fabric && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.fabric}
                                {item.color ? ` · ${item.color}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              PKR {(item.totalPrice || 0).toLocaleString()}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                {item.quantity} × PKR{" "}
                                {(item.unitPrice || 0).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attributes */}
                      <div className="px-3 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.fabric && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-1">
                              <Shirt size={10} className="shrink-0" />
                              {item.fabric}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full px-2 py-1">
                              {item.color}
                            </span>
                          )}
                          {item.lowerType && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full px-2 py-1">
                              {item.lowerType}
                            </span>
                          )}
                          {item.collarType && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full px-2 py-1">
                              Collar: {item.collarType}
                            </span>
                          )}
                          {item.cuffType && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full px-2 py-1">
                              Cuff: {item.cuffType}
                            </span>
                          )}
                          {item.pocket && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full px-2 py-1">
                              Pocket: {item.pocket}
                            </span>
                          )}
                          {item.quantity && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-1">
                              Qty: {item.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <CreditCard
                    size={16}
                    className="text-purple-600 dark:text-purple-400"
                  />{" "}
                  Payment
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      PKR {(order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Paid
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      PKR {totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        Remaining
                      </span>
                      <span
                        className={`text-sm font-bold ${remaining === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                      >
                        PKR {remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {order.payments && order.payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    {order.payments.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-500 dark:text-gray-400">
                          {moment(p.date).format("DD MMM")} · {p.method}
                          {p.note && ` · ${p.note}`}
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          +PKR {(p.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!order.isPaid ? (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full mt-3 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer"
                  >
                    Receive Payment
                  </button>
                ) : (
                  <div className="mt-3 py-2.5 text-center text-sm font-semibold rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    Fully Paid ✓
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              {order.deliveryAddress && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <MapPin
                      size={16}
                      className="text-purple-600 dark:text-purple-400"
                    />{" "}
                    Delivery Address
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {order.deliveryAddress}
                  </p>
                </div>
              )}

              {/* Remarks */}
              {order.remarks && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    Remarks
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {order.remarks}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </FullScreenModal>

      {/* Payment Modal */}
      <CustomModal isOpen={showPaymentModal}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Receive Payment
            </h3>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              <XCircle size={18} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (Remaining: PKR {remaining.toLocaleString()})
            </label>
            <input
              type="number"
              min="1"
              max={remaining}
              value={paymentAmount || remaining}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={`PKR ${remaining.toLocaleString()}`}
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
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => addPayment()}
              disabled={
                Number(paymentAmount || remaining) <= 0 ||
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

export default OrderDetailPage;
