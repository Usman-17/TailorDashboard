import moment from "moment";
import toast from "react-hot-toast";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Ruler,
  UserCheck,
  UserPlus,
  UserRound,
  X,
  PlusCircle,
} from "lucide-react";

import CustomTable from "../../../components/CustomTable";
import CustomInput from "../../../components/CustomInput";
import CustomModal from "../../../components/CustomModal";
import ModalActionButtons from "../../../components/ModalActionButtons";

import useGlobalFilter from "../../../hooks/useGlobalFilter";
import useGetAllCustomers from "../../../hooks/useGetAllCustomers";

import SummaryCard from "../../../components/SummaryCard";
import ActionButtons from "../../../components/ActionButtons";
import SectionHeading from "../../../components/SectionHeading";

import BookOrderModal from "./BookOrderModal";
import MeasurementModal from "./MeasurementModal";
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
  const navigate = useNavigate();
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

  const columns = [
    {
      title: "Sr.",
      key: "sr",
      width: 60,
      align: "center",
      sorter: (a, b) => a.sr - b.sr,
      render: (_, record) => record.sr,
    },
    {
      title: "Customer ID",
      dataIndex: "customerId",
      key: "customerId",
      sorter: (a, b) => (a.customerId || "").localeCompare(b.customerId || ""),
      render: (v) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 font-semibold">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Full Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (v) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {v}
        </span>
      ),
    },
    {
      title: "Mobile Number",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-300">{v}</span>
      ),
    },
    {
      title: "Measurement",
      key: "measurement",
      sorter: (a, b) => (a.measurement ? 1 : 0) - (b.measurement ? 1 : 0),
      render: (_, record) =>
        record.measurement ? (
          <button
            onClick={() => openMeasureModal(record, "view")}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-0.5 text-xs font-semibold cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
            title="View Measurement"
          >
            <span className="size-1.5 rounded-full bg-green-500 dark:bg-green-400" />
            Available
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2.5 py-0.5 text-xs font-semibold">
            <span className="size-1.5 rounded-full bg-red-500 dark:bg-red-400" />
            Not Added
          </span>
        ),
    },
    {
      title: "Orders",
      key: "orders",
      sorter: (a, b) =>
        (a.orders?.filter((o) => !o.isDeleted)?.length || 0) -
        (b.orders?.filter((o) => !o.isDeleted)?.length || 0),
      render: (_, record) => {
        const count = record.orders?.filter((o) => !o.isDeleted)?.length || 0;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              count > 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {count} Order{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1 flex-nowrap">
          <ActionButtons record={record} onEdit={(r) => openEdit(r)} />

          {!record.measurement && (
            <button
              onClick={() => openMeasureModal(record, "add")}
              className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:text-orange-400 cursor-pointer active:scale-90"
              title="Add Measurement"
            >
              <Ruler size={16} />
            </button>
          )}

          {record.measurement && (
            <button
              onClick={() => openMeasureModal(record, "edit")}
              className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:text-yellow-400 cursor-pointer active:scale-90"
              title="Edit Measurement"
            >
              <Ruler size={16} />
            </button>
          )}
          <button
            onClick={() => openBookOrderModal(record)}
            className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:text-purple-300 cursor-pointer active:scale-90"
            title="Book Order"
          >
            <PlusCircle size={16} />
          </button>
          <button
            onClick={() => navigate(`/customers/${record._id}`)}
            className="p-2 rounded-full border transition-all duration-200 shadow-sm flex items-center justify-center outline-none bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#2a1b44] dark:hover:text-blue-300 cursor-pointer active:scale-90"
            title="View"
          >
            <UserRound size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Customers"
          subtitle="Manage customer records and measurements"
        />
        <button
          onClick={openCreate}
          className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-sm font-semibold transition-all cursor-pointer text-white shadow-md hover:shadow-purple-500/30 active:scale-95 shrink-0"
        >
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 my-5">
        {statCards.map((card) => (
          <SummaryCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            count={card.count}
            color={card.color}
            isSelected={filterType === card.id}
            onClick={() =>
              setFilterType(
                filterType === card.id && card.id !== "all" ? "all" : card.id,
              )
            }
          />
        ))}
      </div>

      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered.map((item, index) => ({ ...item, sr: index + 1 }))}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer name, mobile number, ID..."
        totalLabel="Total Customers"
      />

      {/* Custom Modal for Add/Edit Customer */}
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
            {/* Full Name */}
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

            {/* Mobile Number */}
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

            {/* Footer Buttons */}
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
