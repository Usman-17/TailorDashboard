import moment from "moment";
import toast from "react-hot-toast";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Ruler,
  DollarSign,
  Scissors,
  FileText,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";

import CustomInput from "../../../components/CustomInput";
import CustomSelect from "../../../components/CustomSelect";
import LoadingSpinner from "../../../components/LoadingSpinner";
import FullScreenModal from "../../../components/FullScreenModal";
import CustomDatePicker from "../../../components/CustomDatePicker";
// Imports End-----

// ─── Constants ────────────────────────────────────────────────
const COLLAR_TYPES = [
  { label: "Ban Collar", value: "Ban Collar" },
  { label: "Shirt Collar", value: "Shirt Collar" },
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

// ─── Default Suit Item Factory ─────────────────────────────────
const createSuitItem = (suitTypes = [], overrides = {}) => {
  const first = suitTypes[0];
  return {
    id: Date.now() + Math.random(),
    suitType: first?.name || "",
    collarType: "Ban Collar",
    cuffType: "Simple",
    pocket: "No Pocket",
    lowerType: "Shalwar",
    fabric: "",
    color: "",
    price: first ? Number(first.price) || 0 : 0,
    quantity: 1,
    remarks: "",
    ...overrides,
  };
};

// ─── Main Modal ────────────────────────────────────────────────
const BookOrderModal = ({ open, onClose, customer }) => {
  const formRef = useRef(null);
  const queryClient = useQueryClient();
  const customerId = customer?._id;
  const [collapsedMap, setCollapsedMap] = useState({});

  const toggleCollapse = (id) =>
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));

  // Queries
  const { data: existingMeasurement } = useQuery({
    queryKey: ["measurement", customerId],
    enabled: !!customerId && open,
    queryFn: async () => {
      const res = await fetch(`/api/measurements/${customerId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const { data: nextOrderData, isLoading: isLoadingNextNo } = useQuery({
    queryKey: ["nextOrderNumber"],
    enabled: open,
    queryFn: async () => {
      const res = await fetch("/api/orders/next-number", {
        credentials: "include",
      });
      if (!res.ok) return { nextOrderNumber: "ORD-0001" };
      return res.json();
    },
  });

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
  const [orderNumber, setOrderNumber] = useState("");
  const [suitItems, setSuitItems] = useState([createSuitItem([])]);
  const [deliveryDate, setDeliveryDate] = useState(
    moment().add(7, "days").format("YYYY-MM-DD"),
  );
  const [advancePaid, setAdvancePaid] = useState(0);
  const [globalRemarks, setGlobalRemarks] = useState("");
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Derived
  const totalAmount = suitItems.reduce(
    (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 1),
    0,
  );
  const remaining = Math.max(0, totalAmount - (Number(advancePaid) || 0));

  useEffect(() => {
    if (nextOrderData?.nextOrderNumber)
      setOrderNumber(nextOrderData.nextOrderNumber);
  }, [nextOrderData]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSuitItems([createSuitItem(availableSuitTypesList)]);
      setAdvancePaid(0);
      setGlobalRemarks("");
    }
  }, [open, availableSuitTypesList]);

  const handleSuitChange = useCallback((id, patch) => {
    setSuitItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }, []);

  const addSuit = () =>
    setSuitItems((prev) => [...prev, createSuitItem(availableSuitTypesList)]);

  const removeSuit = (id) => {
    setSuitItems((prev) =>
      prev.length > 1 ? prev.filter((s) => s.id !== id) : prev,
    );
  };

  const { mutate: bookOrder, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/orders/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(
          result.error || result.message || "Failed to book order",
        );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Order booked successfully!");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer) return toast.error("No customer selected");
    if (!deliveryDate) return toast.error("Please select a delivery date");
    if (suitItems.some((s) => !s.suitType))
      return toast.error("Please select a suit type for every suit");
    if (totalAmount <= 0)
      return toast.error("Total amount must be greater than zero");

    const items = suitItems.map((s) => {
      return {
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
      };
    });

    const allRemarks = globalRemarks.trim();

    bookOrder({
      customer: customer._id,
      measurement: existingMeasurement?._id || null,
      orderNumber: orderNumber || undefined,
      deliveryDate,
      totalAmount,
      advancePaid: Number(advancePaid) || 0,
      notes: allRemarks,
      items,
    });
  };

  if (!open) return null;

  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      title="Book New Order"
      subtitle={`Customer: ${customer?.name || ""} (${customer?.phone || ""}) — ${customer?.customerId || ""}`}
      showClose={false}
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <LoadingSpinner content="Saving Order..." />
            ) : (
              <>
                <ShoppingBag size={16} />
                Save &amp; Book Order
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-12">
        {/* ── Customer & Measurement Banner ────────────────── */}
        <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-900/30 border border-purple-200 dark:border-purple-800/40 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-purple-600/20 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-lg border border-purple-500/30">
                {customer?.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {customer?.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-semibold">
                    {customer?.customerId || "Customer"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  📱 {customer?.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {existingMeasurement ? (
                <button
                  type="button"
                  onClick={() => setShowMeasurements(!showMeasurements)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30 text-xs font-semibold hover:bg-green-500/20 transition cursor-pointer"
                >
                  <Ruler size={14} />
                  Measurements Available
                  {showMeasurements ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  <Info size={14} />
                  No Measurement Recorded
                </span>
              )}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-600 text-white text-xs font-bold shadow-sm">
                <Tag size={14} />
                <span>
                  {isLoadingNextNo ? "..." : orderNumber || "ORD-0001"}
                </span>
              </div>
            </div>
          </div>

          {/* Measurement Preview */}
          {existingMeasurement && showMeasurements && (
            <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-800/30 space-y-3 text-xs">
              {/* Kameez Measurements */}
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Kameez
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2 mt-1.5">
                  {[
                    ["Length", existingMeasurement.length],
                    ["Shoulder", existingMeasurement.shoulder],
                    ["Chest", existingMeasurement.chest],
                    ["Waist", existingMeasurement.waist],
                    ["Hip", existingMeasurement.hip],
                    ["Neck", existingMeasurement.neck],
                    ["Sleeve", existingMeasurement.sleeveLength],
                    ["Arm Hole", existingMeasurement.armHole],
                    ["Bicep", existingMeasurement.bicep],
                    ["Cuff", existingMeasurement.cuff],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="bg-white/70 dark:bg-[#1a1129] p-2 rounded-lg border border-purple-100 dark:border-purple-900/40 text-center"
                    >
                      <span className="text-gray-400 block font-medium">
                        {label}
                      </span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {val || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower Measurements */}
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  {existingMeasurement.lower?.type === "trouser"
                    ? "Trouser"
                    : "Shalwar"}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-1.5">
                  {[
                    [
                      existingMeasurement.lower?.type === "trouser"
                        ? "Length"
                        : "Shalwar Length",
                      existingMeasurement.shalwarLength,
                    ],
                    [
                      existingMeasurement.lower?.type === "trouser"
                        ? "Waist"
                        : "Shalwar Waist",
                      existingMeasurement.shalwarWaist,
                    ],
                    [
                      existingMeasurement.lower?.type === "trouser"
                        ? "Hip"
                        : "Shalwar Hip",
                      existingMeasurement.shalwarHip,
                    ],
                    ["Thigh", existingMeasurement.thigh],
                    ["Knee", existingMeasurement.knee],
                    ["Bottom", existingMeasurement.bottom],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="bg-white/70 dark:bg-[#1a1129] p-2 rounded-lg border border-purple-100 dark:border-purple-900/40 text-center"
                    >
                      <span className="text-gray-400 block font-medium">
                        {label}
                      </span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {val || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Main Form ─────────────────────────────────────── */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* ── Suit Items ─────────────────────────────────── */}
          <div className="space-y-4">
            {/* Section Title */}
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

            {/* Suit Cards */}
            {suitItems.map((suit, index) => {
              const isCollapsed = collapsedMap[suit.id];
              const update = (field, val) => handleSuitChange(suit.id, { [field]: val });

              return (
                <div key={suit.id} className="bg-white dark:bg-[#15102a] border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                  {/* Card Header */}
                  <div className={`flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 ${suit.suitType ? "bg-purple-50/50 dark:bg-purple-900/10" : "bg-gray-50/50 dark:bg-[#1a1129]"}`}>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          Suit #{index + 1}
                        </span>
                        {suit.suitType && (
                          <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                            — {suit.suitType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {suit.price > 0 && (
                        <span className="font-mono text-sm font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-full">
                          {suit.quantity || 1} × Rs. {Number(suit.price).toLocaleString()} = Rs. {Number(suit.price * (suit.quantity || 1)).toLocaleString()}
                        </span>
                      )}
                      {suitItems.length > 1 && (
                        <button type="button" onClick={() => removeSuit(suit.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer" title="Remove this suit">
                          <Trash2 size={15} />
                        </button>
                      )}
                      <button type="button" onClick={() => toggleCollapse(suit.id)} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer">
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  {!isCollapsed && (
                    <div className="p-5 space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <CustomSelect label="Suit Type" value={suit.suitType} required onChange={(v) => { update("suitType", v); const selected = availableSuitTypesList.find((item) => item.name === v); if (selected && Number(selected.price) >= 0) { update("price", Number(selected.price)); } }} options={availableSuitTypesList.map((item) => ({ label: `${item.name}${item.price > 0 ? ` — Rs. ${Number(item.price).toLocaleString()}` : ""}`, value: item.name }))} />
                        <CustomSelect label="Collar Type" value={suit.collarType} onChange={(v) => update("collarType", v)} options={COLLAR_TYPES} required allowClear={false} />
                        <CustomSelect label="Cuff Type" value={suit.cuffType} onChange={(v) => update("cuffType", v)} options={CUFF_TYPES} required allowClear={false} />
                        <CustomSelect label="Pocket" value={suit.pocket} onChange={(v) => update("pocket", v)} options={POCKET_TYPES} required allowClear={false} />
                        <CustomSelect label="Lower Type" value={suit.lowerType} onChange={(v) => update("lowerType", v)} options={LOWER_TYPES} required allowClear={false} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <CustomInput id={`fabric-${suit.id}`} label="Fabric Name" value={suit.fabric} onChange={(e) => update("fabric", e.target.value)} placeholder="e.g. Cotton, Silk, Khaddar" />
                        <CustomInput id={`color-${suit.id}`} label="Fabric Color" value={suit.color} onChange={(e) => update("color", e.target.value)} placeholder="e.g. White, Navy Blue" />
                        <CustomInput id={`quantity-${suit.id}`} label="Quantity" type="number" min={1} required value={suit.quantity} onChange={(e) => update("quantity", Math.max(1, Number(e.target.value)))} />
                        <CustomInput id={`price-${suit.id}`} label="Stitching Price (PKR)" type="number" min={0} required value={suit.price} onChange={(e) => update("price", Number(e.target.value))} />
                      </div>

                      <CustomInput id={`remarks-${suit.id}`} label="Additional Notes" value={suit.remarks} onChange={(e) => update("remarks", e.target.value)} placeholder="Custom instructions for this suit..." />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Suits Summary Strip */}
            {suitItems.length > 1 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4">
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-3">
                  Order Summary
                </div>
                <div className="space-y-2">
                  {suitItems.map((s, i) => {
                    const qty = Number(s.quantity) || 1;
                    const lineTotal = (Number(s.price) || 0) * qty;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {s.suitType || "Not selected"}
                            {qty > 1 && (
                              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                × {qty}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300">
                          Rs. {lineTotal.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-purple-300 dark:border-purple-700 pt-2 mt-2 flex items-center justify-between font-bold text-base">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="font-mono text-purple-700 dark:text-purple-300">
                      Rs. {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Delivery Date & Financials ─────────────────── */}
          <div className="bg-white dark:bg-[#15102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <DollarSign
                className="text-purple-600 dark:text-purple-400"
                size={20}
              />
              <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Delivery & Financials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Delivery Date */}
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

              {/* Total (auto-calculated) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Total Amount (PKR)
                </label>
                <div className="px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">PKR</span>
                  <span className="font-mono text-base font-extrabold text-purple-700 dark:text-purple-300">
                    {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Advance */}
              <CustomInput
                id="advancePaid"
                label="Advance Paid (PKR)"
                type="number"
                min={0}
                max={totalAmount}
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                placeholder="Enter advance"
              />

              {/* Remaining */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Remaining Balance
                </label>
                <div className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#1a1129] flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">PKR</span>
                  <span
                    className={`font-mono text-base font-extrabold ${remaining === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                  >
                    {remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Global Remarks ─────────────────────────────── */}
          <div className="bg-white dark:bg-[#15102a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs space-y-3">
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
    </FullScreenModal>
  );
};

export default BookOrderModal;
