import moment from "moment";
import toast from "react-hot-toast";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  FileText,
  Scissors,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Loader,
} from "lucide-react";

import CustomInput from "../../../components/CustomInput";
import CustomSelect from "../../../components/CustomSelect";
import FullScreenModal from "../../../components/FullScreenModal";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { useGetOrder } from "../../../hooks/useGetOrder";
// Imports End-----

// ─── Constants ────────────────────────────────────────────────
const COLLAR_TYPES = [
  { label: "Collar", value: "Collar" },
  { label: "Ban", value: "Ban" },
];
const CUFF_TYPES = [
  { label: "Simple", value: "Simple" },
  { label: "Button", value: "Button" },
  { label: "Double Cuff", value: "Double Cuff" },
];
const POCKET_TYPES = [
  { label: "No Pocket", value: "No Pocket" },
  { label: "One Pocket", value: "One Pocket" },
  { label: "Two Pockets", value: "Two Pockets" },
];
const LOWER_TYPES = [
  { label: "Shalwar", value: "Shalwar" },
  { label: "Trouser", value: "Trouser" },
];

const createSuitItem = (overrides = {}) => {
  return {
    id: Date.now() + Math.random(),
    suitType: "",
    collarType: "Ban",
    cuffType: "Simple",
    pocket: "No Pocket",
    lowerType: "Shalwar",
    fabric: "",
    color: "",
    price: 0,
    quantity: 1,
    remarks: "",
    ...overrides,
  };
};

// ─── Main Modal ────────────────────────────────────────────────
const EditOrderModal = ({ open, onClose, orderId }) => {
  const formRef = useRef(null);
  const queryClient = useQueryClient();
  const [collapsedMap, setCollapsedMap] = useState({});

  const toggleCollapse = (id) =>
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));

  const { order, isLoading: orderLoading } = useGetOrder(orderId);

  const { data: suitTypesData } = useQuery({
    queryKey: ["suitTypes", "active"],
    enabled: open,
    queryFn: async () => {
      const res = await fetch("/api/suit-types/active", {
        credentials: "include",
      });
      if (!res.ok) return { suitTypes: [] };
      return res.json();
    },
  });

  const availableSuitTypesList = useMemo(
    () => suitTypesData?.suitTypes || [],
    [suitTypesData],
  );

  // State
  const [suitItems, setSuitItems] = useState([createSuitItem([])]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [discount, setDiscount] = useState("");
  const [globalRemarks, setGlobalRemarks] = useState("");

  // Load order data into the form
  useEffect(() => {
    if (open && order) {
      const items = (order.items || []).map((item) =>
        createSuitItem({
          suitType: item.suitType || "",
          collarType: item.collarType || "Ban",
          cuffType: item.cuffType || "Simple",
          pocket: item.pocket || "No Pocket",
          lowerType: item.lowerType || "Shalwar",
          fabric: item.fabric || "",
          color: item.color || "",
          price: Number(item.unitPrice) || 0,
          quantity: Number(item.quantity) || 1,
          remarks: item.description || "",
        }),
      );
      setSuitItems(items.length > 0 ? items : [createSuitItem()]);
      setDeliveryDate(
        order.deliveryDate
          ? moment(order.deliveryDate).format("YYYY-MM-DD")
          : "",
      );
      setDiscount(order.discount ? String(order.discount) : "");
      setGlobalRemarks(order.notes || "");
      setCollapsedMap({});
    }
  }, [open, order, availableSuitTypesList]);

  // Derived
  const totalAmount = suitItems.reduce(
    (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 1),
    0,
  );
  const discountAmount = Math.min(
    Math.max(Number(discount) || 0, 0),
    totalAmount,
  );
  const netAmount = totalAmount - discountAmount;
  const advancePaid = Number(order?.advancePaid) || 0;
  const remaining = Math.max(0, netAmount - advancePaid);

  const handleSuitChange = useCallback((id, patch) => {
    setSuitItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }, []);

  const addSuit = () => {
    const newSuit = createSuitItem();
    setCollapsedMap((prev) => {
      const nextMap = { ...prev };
      suitItems.forEach((s) => {
        nextMap[s.id] = true;
      });
      nextMap[newSuit.id] = false;
      return nextMap;
    });
    setSuitItems((prev) => [...prev, newSuit]);
  };

  const removeSuit = (id) => {
    setSuitItems((prev) =>
      prev.length > 1 ? prev.filter((s) => s.id !== id) : prev,
    );
  };

  const { mutate: updateOrder, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/orders/update/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(
          result.error || result.message || "Failed to update order",
        );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customerDetail"] });
      queryClient.invalidateQueries({ queryKey: ["orderPayments"] });
      queryClient.invalidateQueries({ queryKey: ["orderPaymentSummary"] });
      queryClient.invalidateQueries({ queryKey: ["tailorDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["tailorRecentOrders"] });
      queryClient.invalidateQueries({ queryKey: ["tailorLatestCustomers"] });
      queryClient.invalidateQueries({ queryKey: ["tailorUpcomingDeliveries"] });
      toast.success("Order updated successfully!");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!deliveryDate) return toast.error("Please select a delivery date");
    if (suitItems.some((s) => !s.suitType))
      return toast.error("Please select a suit type for every suit");
    if (totalAmount <= 0)
      return toast.error("Total amount must be greater than zero");

    const items = suitItems.map((s) => ({
      suitType: s.suitType,
      dressType: "Kameez Shalwar",
      lowerType: s.lowerType,
      collarType: s.collarType,
      cuffType: s.cuffType,
      pocket: s.pocket,
      fabric: s.fabric,
      color: s.color,
      description: s.remarks.trim(),
      quantity: Number(s.quantity) || 1,
      unitPrice: Number(s.price) || 0,
      totalPrice: (Number(s.price) || 0) * (Number(s.quantity) || 1),
    }));

    updateOrder({
      items,
      deliveryDate,
      discount: discountAmount,
      notes: globalRemarks.trim(),
    });
  };

  if (!open) return null;

  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      title="Edit Order"
      subtitle={
        order?.orderNumber
          ? `Order #${order.orderNumber}`
          : "Update order details"
      }
      showClose={false}
      showBack={true}
      actions={
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:block px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isPending}
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isPending ? (
              <>
                <Loader size={15} className="animate-spin mr-2" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      }
    >
      {orderLoading ? (
        <div className="flex justify-center py-20">
          <Loader
            size={24}
            className="animate-spin text-purple-600 dark:text-purple-400"
          />
        </div>
      ) : (
        <div className="space-y-6 pb-12">
          {/* ── Order Info Banner ──────────────────────────────── */}
          <div className="bg-[#fbf9ff] dark:bg-[#1a1232] border border-purple-100 dark:border-purple-900/40 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                  {order?.customer?.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {order?.customer?.phone || ""} • {order?.orderNumber || ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {order?.orderNumber && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                    {order.orderNumber}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-[11px] font-bold">
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/* ── Main Form ───────────────────────────────────── */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* ── Suit Items ─────────────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors
                    className="text-purple-600 dark:text-purple-400"
                    size={20}
                  />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    Suit Items
                  </h3>
                  <span className="size-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">
                    {suitItems.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addSuit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-dashed border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 text-sm font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition cursor-pointer"
                >
                  <Plus size={16} />
                  Add Suit
                </button>
              </div>

              {suitItems.map((suit, index) => {
                const isCollapsed = collapsedMap[suit.id];
                const update = (field, val) =>
                  handleSuitChange(suit.id, { [field]: val });

                return (
                  <div
                    key={suit.id}
                    className="bg-white dark:bg-[#15102a] border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div
                      onClick={() => toggleCollapse(suit.id)}
                      className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 cursor-pointer select-none transition-colors ${!isCollapsed ? "border-b border-gray-100 dark:border-gray-800" : ""} ${suit.suitType ? "bg-purple-50/50 dark:bg-purple-900/10" : "bg-gray-50/50 dark:bg-[#1a1129]"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                            Suit #{index + 1}
                            {suit.suitType && (
                              <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                                — {suit.suitType}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {suitItems.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSuit(suit.id);
                            }}
                            className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
                            title="Remove this suit"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <span className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition pointer-events-none">
                          {isCollapsed ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronUp size={16} />
                          )}
                        </span>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                          <CustomSelect
                            label="Suit Type"
                            value={suit.suitType}
                            placeholder="Select Suit Type"
                            required
                            allowClear={false}
                            onChange={(v) => {
                              update("suitType", v);
                              const selected = availableSuitTypesList.find(
                                (item) => item.name === v,
                              );
                              if (selected && Number(selected.price) >= 0) {
                                update("price", Number(selected.price));
                              }
                            }}
                            options={availableSuitTypesList.map((item) => ({
                              label: item.name,
                              value: item.name,
                            }))}
                          />
                          <CustomSelect
                            label="Collar Type"
                            value={suit.collarType}
                            onChange={(v) => update("collarType", v)}
                            options={COLLAR_TYPES}
                            required
                            allowClear={false}
                          />
                          <CustomSelect
                            label="Cuff Type"
                            value={suit.cuffType}
                            onChange={(v) => update("cuffType", v)}
                            options={CUFF_TYPES}
                            required
                            allowClear={false}
                          />
                          <CustomSelect
                            label="Pocket"
                            value={suit.pocket}
                            onChange={(v) => update("pocket", v)}
                            options={POCKET_TYPES}
                            required
                            allowClear={false}
                          />
                          <CustomSelect
                            label="Lower Type"
                            value={suit.lowerType}
                            onChange={(v) => update("lowerType", v)}
                            options={LOWER_TYPES}
                            required
                            allowClear={false}
                          />
                          <CustomInput
                            id={`quantity-${suit.id}`}
                            label="Quantity"
                            type="number"
                            min={1}
                            required
                            value={suit.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              update(
                                "quantity",
                                val === "" ? "" : Math.max(1, Number(val)),
                              );
                            }}
                            onBlur={() => {
                              if (!suit.quantity || Number(suit.quantity) < 1) {
                                update("quantity", 1);
                              }
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                          <CustomInput
                            id={`fabric-${suit.id}`}
                            label="Fabric Name"
                            value={suit.fabric}
                            onChange={(e) => update("fabric", e.target.value)}
                            placeholder="e.g. Cotton, Silk"
                          />
                          <CustomInput
                            id={`color-${suit.id}`}
                            label="Fabric Color"
                            value={suit.color}
                            onChange={(e) => update("color", e.target.value)}
                            placeholder="e.g. White, Blue"
                          />
                        </div>

                        <CustomInput
                          id={`remarks-${suit.id}`}
                          label="Additional Notes"
                          value={suit.remarks}
                          onChange={(e) => update("remarks", e.target.value)}
                          placeholder="Custom instructions for this suit..."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Delivery Date & Financials ─────────────────── */}
            <div className="bg-white dark:bg-[#15102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <DollarSign
                  className="text-purple-600 dark:text-purple-400"
                  size={20}
                />
                <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Delivery & Financials
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <CustomDatePicker
                    id="deliveryDate"
                    label="Delivery Date"
                    required
                    value={deliveryDate}
                    onChange={(date) =>
                      setDeliveryDate(date ? date.format("YYYY-MM-DD") : "")
                    }
                    placeholder="Select delivery date"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-700 dark:text-purple-100/90 tracking-wide">
                    Total (PKR)
                  </label>
                  <input
                    id="totalAmount"
                    readOnly
                    tabIndex={-1}
                    value={totalAmount.toLocaleString()}
                    className="w-full px-3.5 pr-3.5 h-10 rounded-lg text-[14px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-gray-100 dark:bg-[#1a1129] transition-all duration-200 border-[1.5px] border-gray-200 dark:border-purple-500/30 shadow-xs focus:outline-none cursor-default"
                  />
                </div>

                <CustomInput
                  id="discount"
                  label="Discount (PKR)"
                  type="number"
                  min={0}
                  max={totalAmount}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Discount"
                />

                <CustomInput
                  id="advancePaid"
                  label="Advance (PKR)"
                  type="number"
                  min={0}
                  max={netAmount}
                  readOnly
                  value={advancePaid}
                  placeholder="Advance"
                />

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 text-gray-700 dark:text-purple-100/90 tracking-wide">
                    Remaining Balance
                  </label>
                  <input
                    id="remainingBalance"
                    readOnly
                    tabIndex={-1}
                    value={remaining.toLocaleString()}
                    className={`w-full px-3.5 pr-3.5 h-10 rounded-lg text-[14px] font-mono font-bold ${remaining === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"} bg-gray-100 dark:bg-[#1a1129] transition-all duration-200 border-[1.5px] border-gray-200 dark:border-purple-500/30 shadow-xs focus:outline-none cursor-default`}
                  />
                </div>
              </div>
            </div>

            {/* ── Order Notes ─────────────────────────────── */}
            <div className="bg-white dark:bg-[#15102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <FileText
                  className="text-purple-600 dark:text-purple-400"
                  size={20}
                />
                <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Order Notes
                </h3>
              </div>
              <CustomInput
                id="globalRemarks"
                type="textarea"
                rows={3}
                value={globalRemarks}
                onChange={(e) => setGlobalRemarks(e.target.value)}
                placeholder="Any general notes or instructions for the entire order..."
              />
            </div>
          </form>
        </div>
      )}
    </FullScreenModal>
  );
};

export default EditOrderModal;
