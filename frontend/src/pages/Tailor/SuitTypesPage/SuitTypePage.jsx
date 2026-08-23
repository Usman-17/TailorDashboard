import toast from "react-hot-toast";
import { X, Tag, Info, Save } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import CustomModal from "../../../components/CustomModal";
import CustomInput from "../../../components/CustomInput";
import ModalActionButtons from "../../../components/ModalActionButtons";

import useGlobalFilter from "../../../hooks/useGlobalFilter";
import { useGetAllSuitTypes } from "../../../hooks/useGetSuitTypes.jsx";

import MobileSuitTypePage from "./MobileSuitTypePage";
import DesktopSuitTypePage from "./DesktopSuitTypePage";
// Imports End---

const SuitTypesPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [modalState, setModalState] = useState({ open: false, data: null });
  const [voidModal, setVoidModal] = useState({
    open: false,
    id: null,
    name: "",
  });

  const queryClient = useQueryClient();
  const { data, isLoading } = useGetAllSuitTypes();

  const suitTypes = useMemo(() => data?.suitTypes || [], [data]);
  const searchFiltered = useGlobalFilter(suitTypes, search, ["name"]);
  const filtered = useMemo(() => {
    if (statusFilter === "active")
      return searchFiltered.filter((s) => s.isActive);
    if (statusFilter === "inactive")
      return searchFiltered.filter((s) => !s.isActive);
    return searchFiltered;
  }, [searchFiltered, statusFilter]);

  const [form, setForm] = useState({ name: "", price: "", isActive: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modalState.data && modalState.open) {
      setForm({
        name: modalState.data.name || "",
        price: modalState.data.price !== undefined ? modalState.data.price : "",
        isActive:
          modalState.data.isActive !== undefined
            ? modalState.data.isActive
            : true,
      });
    } else if (modalState.open) {
      setForm({ name: "", price: "", isActive: true });
    }
    setErrors({});
  }, [modalState]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.price === "" || isNaN(form.price) || Number(form.price) < 0) {
      errs.price = "Valid price is required (min 0)";
    }
    return errs;
  };

  const { mutate: saveSuitType, isPending } = useMutation({
    mutationFn: async (payload) => {
      const isEdit = Boolean(modalState.data?._id);
      const url = isEdit
        ? `/api/suit-types/update/${modalState.data._id}`
        : "/api/suit-types/add";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save suit type");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suitTypes"] });
      toast.success(
        `Suit type ${modalState.data ? "updated" : "added"} successfully!`,
      );
      setModalState({ open: false, data: null });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    saveSuitType({
      name: form.name.trim(),
      price: Number(form.price),
      isActive: form.isActive,
    });
  };

  const { mutate: voidSuitType, isPending: isVoiding } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/suit-types/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: false }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to void suit type");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suitTypes"] });
      toast.success("Suit type deactivated successfully!");
      setVoidModal({ open: false, id: null, name: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: restoreSuitType, isPending: isRestoring } = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/suit-types/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: true }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to restore suit type");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suitTypes"] });
      toast.success("Suit type restored successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  // Shared handler callbacks passed to both views
  const handleAdd = () => setModalState({ open: true, data: null });
  const handleEdit = (r) => setModalState({ open: true, data: r });
  const handleVoid = (r) =>
    setVoidModal({ open: true, id: r._id, name: r.name });
  const handleRestore = (id) => restoreSuitType(id);

  const sharedProps = {
    suitTypes,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isLoading,
    isRestoring,
    onAdd: handleAdd,
    onEdit: handleEdit,
    onVoid: handleVoid,
    onRestore: handleRestore,
  };

  return (
    <div>
      {/* ─── Mobile View ─── */}
      <MobileSuitTypePage {...sharedProps} />

      {/* ─── Desktop View ─── */}
      <DesktopSuitTypePage {...sharedProps} />

      {/* ─── Mobile Add/Edit Modal (full screen) ─── */}
      <div className="md:hidden">
        <CustomModal isOpen={modalState.open} fullScreen>
          <div className="flex flex-col h-full px-4 pt-1.5 pb-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {modalState.data ? "Edit Suit Type" : "Add Suit Type"}
              </h2>
              <button
                type="button"
                onClick={() => setModalState({ open: false, data: null })}
                className="size-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 text-gray-500 dark:text-gray-400 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4 flex-1">
              {/* Suit Type Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Suit Type Name <span className="text-red-500">*</span>
                </label>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white dark:bg-[#1a1129] transition ${
                    errors.name
                      ? "border-red-400"
                      : "border-purple-400 dark:border-purple-500"
                  }`}
                >
                  <Tag size={18} className="text-purple-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter suit type name"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 pl-1">{errors.name}</p>
                )}
              </div>

              {/* Stitching Price */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Stitching Price <span className="text-red-500">*</span>
                </label>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white dark:bg-[#1a1129] transition ${
                    errors.price
                      ? "border-red-400"
                      : "border-gray-200 dark:border-gray-700 focus-within:border-purple-400 dark:focus-within:border-purple-500"
                  }`}
                >
                  <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 shrink-0 pr-2 border-r border-gray-200 dark:border-gray-700">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Enter stitching price"
                    value={form.price}
                    onChange={(e) => {
                      setForm({ ...form, price: e.target.value });
                      if (errors.price) setErrors({ ...errors, price: "" });
                    }}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-red-500 pl-1">{errors.price}</p>
                )}
              </div>

              {/* Status Toggle Pills */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#1a1129] p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: true })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                      form.isActive
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {form.isActive && (
                      <span className="size-1.5 rounded-full bg-white" />
                    )}
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: false })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                      !form.isActive
                        ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <Info
                  size={16}
                  className="text-purple-500 dark:text-purple-400 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-0.5">
                    Note
                  </p>
                  <p className="text-xs text-purple-600/80 dark:text-purple-400/80 leading-relaxed">
                    You can change the status of this suit type anytime from the
                    suit types list.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-60"
              >
                {isPending ? (
                  <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                {isPending
                  ? modalState.data
                    ? "Updating..."
                    : "Saving..."
                  : modalState.data
                    ? "Update Suit Type"
                    : "Save Suit Type"}
              </button>
              <button
                type="button"
                onClick={() => setModalState({ open: false, data: null })}
                className="w-full py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </CustomModal>
      </div>

      {/* ─── Desktop Add/Edit Modal (compact) ─── */}
      <div className="hidden md:block">
        <CustomModal isOpen={modalState.open} className="w-[92%] max-w-md">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Tag
                  size={18}
                  className="text-purple-600 dark:text-purple-400"
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {modalState.data ? "Edit Suit Type" : "Add New Suit Type"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalState({ open: false, data: null })}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <CustomInput
                id="suitTypeName"
                label="Suit Type Name"
                required
                placeholder="e.g. Single Silai, Karhai, Double Silai"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                error={errors.name}
              />
              <CustomInput
                id="suitTypePrice"
                label="Stitching Price (PKR)"
                type="number"
                required
                min={0}
                placeholder="e.g. 1200"
                value={form.price}
                onChange={(e) => {
                  setForm({ ...form, price: e.target.value });
                  if (errors.price) setErrors({ ...errors, price: "" });
                }}
                error={errors.price}
              />
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1129]">
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                    Status
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {form.isActive
                      ? "Active (Visible in Order Booking)"
                      : "Inactive (Hidden from Order Booking)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    form.isActive
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700"
                  }`}
                >
                  {form.isActive ? (
                    <>
                      <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </>
                  ) : (
                    <>
                      <span className="size-2 rounded-full bg-gray-400" />
                      Inactive
                    </>
                  )}
                </button>
              </div>
            </div>

            <ModalActionButtons
              onCancel={() => setModalState({ open: false, data: null })}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
              submitText={
                modalState.data ? "Update Suit Type" : "Save Suit Type"
              }
              loadingText={modalState.data ? "Updating..." : "Saving..."}
            />
          </div>
        </CustomModal>
      </div>

      {/* ─── Void Confirmation Modal ─── */}
      <CustomModal isOpen={voidModal.open} className="w-[92%] max-w-sm">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Void Suit Type?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to void{" "}
            <span className="font-bold text-purple-600">{voidModal.name}</span>?
            It will be marked inactive and hidden from order booking.
          </p>

          <ModalActionButtons
            onCancel={() => setVoidModal({ open: false, id: null, name: "" })}
            onSubmit={() => voidSuitType(voidModal.id)}
            isSubmitting={isVoiding}
            submitText="Void"
            loadingText="Voiding..."
          />
        </div>
      </CustomModal>
    </div>
  );
};

export default SuitTypesPage;
