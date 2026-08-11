import moment from "moment";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  SquarePen,
  MessageCircle,
  Phone,
  Scissors,
  Shirt,
  Tag,
  User,
  XCircle,
} from "lucide-react";

import { useGetOrder } from "../../../hooks/useGetOrder";
import FullScreenModal from "../../../components/FullScreenModal";
import CustomModal from "../../../components/CustomModal";
import CustomSelect from "../../../components/CustomSelect";

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

  // Status update mutation
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

  // Payment mutation
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

  // Cancel order mutation
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
        title={
          isLoading
            ? "Order Details"
            : order
              ? `Order ${order.orderNumber}`
              : "Order Details"
        }
        subtitle={
          order
            ? `Created ${moment(order.createdAt).format("DD MMM YYYY, hh:mm A")}`
            : ""
        }
        actions={
          order && (
            <div className="flex flex-wrap items-center gap-2">
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
                    <SquarePen size={14} /> Edit
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
                >
                  <XCircle size={14} /> Cancel
                </button>
              )}
              {order.status === "ready" && order.customer?.phone && (
                <button
                  onClick={() => {
                    let phone = order.customer.phone.replace(/[^0-9]/g, "");
                    if (phone.startsWith("0")) phone = "92" + phone.slice(1);
                    const suitTypes =
                      order.items?.map((i) => i.suitType).join(", ") ||
                      "your order";
                    const msg = `Assalam o Alaikum ${order.customer.name},\n\nYour order *${order.orderNumber}* (${suitTypes}) is ready for pickup.\n\nPlease visit us at your earliest convenience to collect your order.\n\nThank you for choosing us! 🪡`;
                    window.open(
                      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
                      "_blank",
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[#25D366] text-white hover:bg-[#1da851] transition cursor-pointer"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              )}
            </div>
          )
        }
      >
        <div className="space-y-5">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column — Customer + Order Info + Suit Items */}
              <div className="lg:col-span-2 space-y-5">
                {/* Customer Info */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <User size={16} className="text-purple-500" /> Customer
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Name
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {order.customer?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mobile
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        <Phone size={12} /> {order.customer?.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Customer ID
                      </p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {order.customer?.customerId || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <Tag size={16} className="text-purple-500" /> Order Details
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Order #
                      </p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Created
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {moment(order.createdAt).format("DD MMM YYYY")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Delivery
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {order.deliveryDate
                          ? moment(order.deliveryDate).format("DD MMM YYYY")
                          : "-"}
                      </p>
                    </div>
                    {order.status === "delivered" &&
                      (() => {
                        const deliveredEvent = (order.statusHistory || []).find(
                          (sh) => sh.status === "delivered",
                        );
                        if (!deliveredEvent) return null;
                        return (
                          <div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Delivered On
                            </p>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {moment(deliveredEvent.changedAt).format(
                                "DD MMM YYYY",
                              )}
                            </p>
                          </div>
                        );
                      })()}
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Status
                      </p>
                      <span
                        className={`inline-block text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suit Items */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    <Shirt size={16} className="text-purple-500" /> Suit Items
                    <span className="ml-auto text-xs font-normal text-gray-400 dark:text-gray-500">
                      {order.items?.length || 0}{" "}
                      {order.items?.length === 1 ? "suit" : "suits"}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {(order.items || []).map((item, i) => (
                      <div
                        key={item._id || i}
                        className="relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.suitType}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            Rs. {(item.totalPrice || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {item.lowerType && (
                              <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                                  Lower
                                </p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {item.lowerType}
                                </p>
                              </div>
                            )}
                            {item.collarType && (
                              <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                                  Collar
                                </p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {item.collarType}
                                </p>
                              </div>
                            )}
                            {item.cuffType && (
                              <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                                  Cuff
                                </p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {item.cuffType}
                                </p>
                              </div>
                            )}
                            {item.pocket && (
                              <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                                  Pocket
                                </p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {item.pocket}
                                </p>
                              </div>
                            )}
                            {item.fabric && (
                              <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                                  Fabric
                                </p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {item.fabric}
                                </p>
                              </div>
                            )}
                            {item.color && (
                              <div className="space-y-0.5">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                                  Color
                                </p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {item.color}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Qty:{" "}
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {item.quantity}
                              </span>
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Unit:{" "}
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  Rs. {(item.unitPrice || 0).toLocaleString()}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column — Payment + Status */}
              <div className="space-y-5">
                {/* Payment Summary */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <CreditCard size={16} className="text-purple-500" /> Payment
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Rs. {(order.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Paid
                      </span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Rs. {totalPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Remaining
                        </span>
                        <span
                          className={`text-sm font-bold ${remaining === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                        >
                          Rs. {remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!order.isPaid && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full mt-3 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer"
                    >
                      Receive Payment
                    </button>
                  )}
                  {order.isPaid && (
                    <div className="mt-3 py-2 text-center text-sm font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      Fully Paid
                    </div>
                  )}
                </div>

                {/* Status Management */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <Clock size={16} className="text-purple-500" /> Status
                  </h2>
                  {order.status !== "cancelled" ? (
                    <div className="space-y-2">
                      {STATUS_FLOW.map((step, i) => {
                        const isCurrent = order.status === step.value;
                        const isPast = currentStatusIndex > i;
                        const isDelivered =
                          step.value === "delivered" &&
                          order.status === "delivered";
                        const StepIcon = step.icon;
                        const isDone = isPast || isDelivered;
                        return (
                          <div
                            key={step.value}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isDone ? "bg-green-500 text-white" : isCurrent ? "bg-purple-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}
                            >
                              {isDone ? (
                                <CheckCircle size={14} />
                              ) : (
                                <StepIcon size={14} />
                              )}
                            </div>
                            <span
                              className={`text-xs font-medium flex-1 ${isDone ? "text-green-600 dark:text-green-400" : isCurrent ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"}`}
                            >
                              {step.label}
                            </span>
                            {isDone && (
                              <CheckCircle
                                size={12}
                                className="text-green-500"
                              />
                            )}
                          </div>
                        );
                      })}
                      {nextStatus && (
                        <button
                          onClick={() =>
                            updateStatus({
                              status: nextStatus,
                              note: `Status changed to ${STATUS_LABELS[nextStatus]}`,
                            })
                          }
                          disabled={isUpdatingStatus}
                          className="w-full mt-3 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
                        >
                          {isUpdatingStatus
                            ? "Updating..."
                            : `Mark as ${STATUS_LABELS[nextStatus]}`}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-3 text-center">
                      <span className="text-xs font-semibold rounded-full px-4 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                        Order Cancelled
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              Amount (Remaining: Rs. {remaining.toLocaleString()})
            </label>
            <input
              type="number"
              min="1"
              max={remaining}
              value={paymentAmount || remaining}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={`Rs. ${remaining.toLocaleString()}`}
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
