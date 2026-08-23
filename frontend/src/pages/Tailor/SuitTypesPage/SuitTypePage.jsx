import toast from "react-hot-toast";
import { X, Tag } from "lucide-react";
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

      {/* ─── Add / Edit Modal ─── */}
      <CustomModal isOpen={modalState.open} className="w-[92%] max-w-md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-purple-600 dark:text-purple-400" />
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
            submitText={modalState.data ? "Update Suit Type" : "Save Suit Type"}
            loadingText={modalState.data ? "Updating..." : "Saving..."}
          />
        </div>
      </CustomModal>

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
