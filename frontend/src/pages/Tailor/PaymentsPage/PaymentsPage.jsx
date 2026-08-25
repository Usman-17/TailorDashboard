import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CalendarDays,
  Clock,
  Wallet,
  ChevronDown,
} from "lucide-react";

import MobilePaymentsPage from "./MobilePaymentsPage";
import DesktopPaymentsPage from "./DesktopPaymentsPage";
import CustomModal from "../../../components/CustomModal";
import ModalActionButtons from "../../../components/ModalActionButtons";

import OrderDetailPage from "../OrdersPage/OrderDetailPage";

import { usePendingOrders } from "../../../hooks/usePendingOrders";
import { useGetOrderPayments } from "../../../hooks/useGetOrderPayments";
import { useOrderPaymentSummary } from "../../../hooks/useOrderPaymentSummary";
// Imports End-----

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [detailOrderId, setDetailOrderId] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  const handleReceivePayment = (order) => {
    const remaining = (order.totalAmount || 0) - (order.advancePaid || 0);
    setSelectedOrder(order);
    setPaymentAmount(String(remaining));
    setPaymentMethod("cash");
    setPaymentNote("");
    setPaymentRefNo("");
    setShowPaymentModal(true);
  };

  const { mutate: addPayment, isPending: isAddingPayment } = useMutation({
    mutationFn: async () => {
      const amount = paymentAmount
        ? Number(paymentAmount)
        : selectedOrder.totalAmount - (selectedOrder.advancePaid || 0);
      const res = await fetch(`/api/orders/payment/${selectedOrder._id}`, {
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
      setSelectedOrder(null);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNote("");
      setPaymentRefNo("");
      queryClient.invalidateQueries({ queryKey: ["orderPayments"] });
      queryClient.invalidateQueries({ queryKey: ["orderPaymentSummary"] });
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
    },
    onError: (err) => toast.error(err.message),
  });

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

  const sharedProps = {
    view,
    setView,
    search,
    setSearch,
    filterMethod,
    setFilterMethod,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    statCards,
    activeCard,
    setActiveCard,
    handleCardClick,
    payments,
    isLoading,
    pendingOrders,
    pendingLoading,
    onReceivePayment: handleReceivePayment,
    onCardClick: (p) => {
      if (p?.order) setDetailOrderId(p.order);
    },
  };

  const selectedRemaining = selectedOrder
    ? (selectedOrder.totalAmount || 0) - (selectedOrder.advancePaid || 0)
    : 0;

  if (isMobile) {
    return (
      <>
        <MobilePaymentsPage {...sharedProps} />

        {/* Payment Detail Modal */}
        {detailOrderId && (
          <OrderDetailPage
            orderId={detailOrderId}
            open={!!detailOrderId}
            onClose={() => setDetailOrderId(null)}
            fullScreen
          />
        )}

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
                ✕
              </button>
            </div>

            {selectedOrder && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedOrder.orderNumber} · {selectedOrder.customerName} ·
                Remaining: PKR {selectedRemaining.toLocaleString()}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                min="1"
                inputMode="decimal"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Max: PKR ${selectedRemaining.toLocaleString()}`}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Method
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
            {["bank", "jazzcash", "easypaisa"].includes(paymentMethod) && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reference/Transaction ID{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  placeholder="Enter reference or transaction ID"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <ModalActionButtons
              onCancel={() => setShowPaymentModal(false)}
              onSubmit={() => addPayment()}
              isDisabled={
                (paymentAmount !== "" && Number(paymentAmount) <= 0) ||
                (["bank", "jazzcash", "easypaisa"].includes(paymentMethod) &&
                  !paymentRefNo)
              }
              isSubmitting={isAddingPayment}
              submitText="Save Payment"
              loadingText="Processing..."
            />
          </div>
        </CustomModal>
      </>
    );
  }

  return (
    <>
      <DesktopPaymentsPage {...sharedProps} />

      {/* Order Detail Modal */}
      {detailOrderId && (
        <OrderDetailPage
          orderId={detailOrderId}
          open={!!detailOrderId}
          onClose={() => setDetailOrderId(null)}
          fullScreen
        />
      )}

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
              ✕
            </button>
          </div>

          {selectedOrder && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedOrder.orderNumber} · {selectedOrder.customerName} ·
              Remaining: PKR {selectedRemaining.toLocaleString()}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={`Max: PKR ${selectedRemaining.toLocaleString()}`}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Method
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
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
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <ModalActionButtons
            onCancel={() => setShowPaymentModal(false)}
            onSubmit={() => addPayment()}
            isDisabled={
              (paymentAmount !== "" && Number(paymentAmount) <= 0) ||
              (["bank", "jazzcash", "easypaisa"].includes(paymentMethod) &&
                !paymentRefNo)
            }
            isSubmitting={isAddingPayment}
            submitText="Save Payment"
            loadingText="Processing..."
          />
        </div>
      </CustomModal>
    </>
  );
};

export default PaymentsPage;
