import moment from "moment";
import toast from "react-hot-toast";
import {  useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Ruler,
  UserCheck,
  UserPlus,
  X,
  PlusCircle,
  ChevronLeft,
} from "lucide-react";

import CustomInput from "../../../components/CustomInput";
import CustomModal from "../../../components/CustomModal";
import ModalActionButtons from "../../../components/ModalActionButtons";

import useGlobalFilter from "../../../hooks/useGlobalFilter";
import useGetAllCustomers from "../../../hooks/useGetAllCustomers";

import BookOrderModal from "./BookOrderModal";
import MeasurementModal from "./MeasurementModal";
import MobileCustomersPage from "./MobileCustomersPage";
import DesktopCustomersPage from "./DesktopCustomersPage";
import { initialMeasurementState } from "./measurementFields";
// Imports End----

const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Full name is required";
  if (!form.phone.trim()) errors.phone = "Mobile number is required";
  else {
    const cleaned = form.phone.replace(/[\s\-()]/g, "");
    if (!PHONE_REGEX.test(cleaned))
      errors.phone = "Invalid Pakistani mobile number (03XXXXXXXXX)";
  }
  return errors;
};

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [measureModal, setMeasureModal] = useState({
    open: false,
    mode: "add",
    customer: null,
  });
  const [measureForm, setMeasureForm] = useState(initialMeasurementState);
  const [bookOrderModal, setBookOrderModal] = useState({
    open: false,
    customer: null,
  });
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get("modal");

  const openBookOrderModal = (customer) => {
    setBookOrderModal({ open: true, customer });
    setSearchParams({ modal: "book-order" });
  };

  const closeBookOrderModal = () => {
    setBookOrderModal({ open: false, customer: null });
    setSearchParams({}, { replace: true });
  };

  const queryClient = useQueryClient();
  const { data, isLoading } = useGetAllCustomers();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const customers = useMemo(() => data?.customers || [], [data]);

  useEffect(() => {
    if (editCustomer) {
      setForm({
        name: editCustomer.name || "",
        phone: editCustomer.phone || "",
      });
    } else {
      setForm({ name: "", phone: "" });
    }
    setErrors({});
  }, [editCustomer, formModalOpen]);

  const { mutate: saveCustomer, isPending: isSaving } = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name.trim(),
        phone: data.phone.replace(/[\s\-()]/g, ""),
      };

      const method = editCustomer ? "PUT" : "POST";
      const url = editCustomer
        ? `/api/customers/update/${editCustomer._id}`
        : "/api/customers/add";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save customer");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(
        `Customer ${editCustomer ? "updated" : "saved"} successfully`,
      );
      closeFormModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    saveCustomer(form);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setEditCustomer(null);
    setForm({ name: "", phone: "" });
    setErrors({});
  };

  const openCreate = () => {
    setEditCustomer(null);
    setForm({ name: "", phone: "" });
    setErrors({});
    setFormModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
    });
    setErrors({});
    setFormModalOpen(true);
  };

  const openMeasureModal = (customer, mode) => {
    setMeasureModal({ open: true, mode, customer });
    setSearchParams({ modal: "measurements" });
  };

  const closeMeasureModal = () => {
    setMeasureModal({ open: false, mode: "add", customer: null });
    setSearchParams({}, { replace: true });
  };

  const summaryStats = useMemo(() => {
    const total = customers.length;
    let withMeasurement = 0;
    let withoutMeasurement = 0;
    let newThisMonth = 0;

    const startOfMonth = moment().startOf("month");

    customers.forEach((cust) => {
      if (cust.measurement) {
        withMeasurement++;
      } else {
        withoutMeasurement++;
      }
      if (cust.createdAt && moment(cust.createdAt).isAfter(startOfMonth)) {
        newThisMonth++;
      }
    });

    return {
      total,
      withMeasurement,
      withoutMeasurement,
      newThisMonth,
    };
  }, [customers]);

  const statCards = [
    {
      id: "all",
      title: "Total Customers",
      count: summaryStats.total,
      icon: Users,
      color: "#6366F1",
    },
    {
      id: "with_measurement",
      title: "With Measurement",
      count: summaryStats.withMeasurement,
      icon: Ruler,
      color: "#10B981",
    },
    {
      id: "without_measurement",
      title: "No Measurement",
      count: summaryStats.withoutMeasurement,
      icon: UserCheck,
      color: "#F59E0B",
    },
    {
      id: "new_this_month",
      title: "New This Month",
      count: summaryStats.newThisMonth,
      icon: UserPlus,
      color: "#8B5CF6",
    },
  ];

  const filteredByType = useMemo(() => {
    if (filterType === "all") return customers;
    const startOfMonth = moment().startOf("month");
    return customers.filter((cust) => {
      if (filterType === "with_measurement") return Boolean(cust.measurement);
      if (filterType === "without_measurement") return !cust.measurement;
      if (filterType === "new_this_month")
        return cust.createdAt && moment(cust.createdAt).isAfter(startOfMonth);
      return true;
    });
  }, [customers, filterType]);

  const filtered = useGlobalFilter(filteredByType, search, [
    "name",
    "phone",
    "customerId",
  ]);

  return (
    <div>
      {/* ─── Mobile View ─── */}
      <MobileCustomersPage
        customers={customers}
        filtered={filtered}
        search={search}
        setSearch={setSearch}
        filterType={filterType}
        setFilterType={setFilterType}
        isLoading={isLoading}
        formModalOpen={formModalOpen}
        form={form}
        errors={errors}
        editCustomer={editCustomer}
        isSaving={isSaving}
        handleSubmit={handleSubmit}
        openCreate={openCreate}
        openEdit={openEdit}
        closeFormModal={closeFormModal}
        openMeasureModal={openMeasureModal}
        openBookOrderModal={openBookOrderModal}
        setForm={setForm}
        setErrors={setErrors}
      />

      {/* ─── Desktop View ─── */}
      <DesktopCustomersPage
        customers={customers}
        filtered={filtered}
        search={search}
        setSearch={setSearch}
        filterType={filterType}
        setFilterType={setFilterType}
        statCards={statCards}
        isLoading={isLoading}
        openCreate={openCreate}
        openEdit={openEdit}
        openMeasureModal={openMeasureModal}
        openBookOrderModal={openBookOrderModal}
      />

      {/* Shared Modals (both mobile + desktop) */}
      {/* Add/Edit Customer Modal — Mobile fullScreen, Desktop compact */}
      {isMobile ? (
        <CustomModal isOpen={formModalOpen} fullScreen onClose={closeFormModal}>
          <div className="flex flex-col h-full px-4 pt-1.5 pb-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="size-8 -ml-1 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
                >
                  <ChevronLeft size={22} />
                </button>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                    {editCustomer ? "Edit Customer" : "Add New Customer"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editCustomer
                      ? "Update customer details"
                      : "Create a new customer profile"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 text-gray-500 dark:text-gray-400 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 flex-1"
              noValidate
            >
              {/* Hero Illustration */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 dark:from-purple-950/60 dark:via-purple-900/40 dark:to-indigo-950/60 py-6 flex items-center justify-center">
                <div className="relative flex items-center gap-4">
                  {/* Avatar silhouette */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-16 rounded-full bg-purple-200/80 dark:bg-purple-800/50 flex items-center justify-center">
                      <Users
                        size={28}
                        className="text-purple-500 dark:text-purple-300"
                      />
                    </div>
                    <div className="w-10 h-1.5 rounded-full bg-purple-200/60 dark:bg-purple-800/40" />
                  </div>
                  {/* Dress form silhouette */}
                  <div className="w-10 h-20 rounded-t-full bg-purple-200/50 dark:bg-purple-800/30" />
                  {/* Plus badge */}
                  <div className="absolute -right-1 -bottom-1 size-9 rounded-full bg-purple-600 shadow-lg shadow-purple-600/30 flex items-center justify-center">
                    <PlusCircle size={18} className="text-white" />
                  </div>
                </div>
              </div>

              <CustomInput
                id="mName"
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Enter customer name"
                error={errors.name}
              />

              {/* Mobile Number with flag */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div
                  className={`flex items-center gap-2 px-3.5 h-10 rounded-lg border-[1.5px] bg-white dark:bg-[#0f0d1b] shadow-xs transition-all duration-200 ${
                    errors.phone
                      ? "!border-red-400 !shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
                      : "border-gray-200 dark:border-purple-500/30 hover:border-gray-400 dark:hover:border-purple-400 focus-within:border-[var(--secondary-color)] dark:focus-within:border-purple-400 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.25)]"
                  }`}
                >
                  <div className="flex items-center pr-2.5 border-r border-gray-200 dark:border-gray-700 shrink-0">
                    <span className="text-lg leading-none">🇵🇰</span>
                  </div>
                  <input
                    type="tel"
                    id="mPhone"
                    placeholder="03XXXXXXXXX"
                    maxLength={11}
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 pl-1">{errors.phone}</p>
                )}
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="size-4 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-800 dark:text-purple-300">
                    Your customer data is safe
                  </p>
                  <p className="text-[11px] text-purple-600/70 dark:text-purple-400/60 mt-0.5 leading-relaxed">
                    We respect the security and privacy of all customer
                    information.
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="space-y-2 pt-2 mt-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                  )}
                  {isSaving
                    ? editCustomer
                      ? "Updating..."
                      : "Saving..."
                    : editCustomer
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="w-full py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </CustomModal>
      ) : (
        <CustomModal isOpen={formModalOpen} className="w-[92%] max-w-md">
          <div className="flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editCustomer ? "Edit Customer" : "Add New Customer"}
              </h3>
              <button
                onClick={closeFormModal}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4.5"
              noValidate
            >
              <CustomInput
                id="name"
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Enter customer name"
                error={errors.name}
              />

              <CustomInput
                id="phone"
                label="Mobile Number"
                required
                placeholder="03XXXXXXXXX"
                maxLength={11}
                error={errors.phone}
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
              />

              <ModalActionButtons
                onCancel={closeFormModal}
                onSubmit={handleSubmit}
                isSubmitting={isSaving}
                submitText={editCustomer ? "Update Customer" : "Save Customer"}
                loadingText={editCustomer ? "Updating..." : "Saving..."}
              />
            </form>
          </div>
        </CustomModal>
      )}

      <MeasurementModal
        open={measureModal.open && modalParam === "measurements"}
        onClose={closeMeasureModal}
        mode={measureModal.mode}
        customer={measureModal.customer}
        measureForm={measureForm}
        setMeasureForm={setMeasureForm}
      />

      <BookOrderModal
        open={bookOrderModal.open && modalParam === "book-order"}
        onClose={closeBookOrderModal}
        customer={bookOrderModal.customer}
      />
    </div>
  );
};

export default CustomersPage;
