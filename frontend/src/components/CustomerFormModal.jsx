import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  notes: "",
};

const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.phone.trim()) errors.phone = "Phone is required";
  else {
    const cleaned = form.phone.replace(/[\s\-()]/g, "");
    if (!PHONE_REGEX.test(cleaned))
      errors.phone = "Invalid Pakistani phone (03XXXXXXXXX)";
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Invalid email format";
  return errors;
};

const CustomerFormModal = ({ isOpen, onClose, editCustomer = null }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const isEdit = Boolean(editCustomer);

  useEffect(() => {
    if (editCustomer) {
      setForm({
        name: editCustomer.name || "",
        phone: editCustomer.phone || "",
        email: editCustomer.email || "",
        street: editCustomer.address?.street || "",
        city: editCustomer.address?.city || "",
        state: editCustomer.address?.state || "",
        notes: editCustomer.notes || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [editCustomer, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name.trim(),
        phone: data.phone.replace(/[\s\-()]/g, ""),
        email: data.email || undefined,
        address: {
          street: data.street || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
        },
        notes: data.notes || "",
      };

      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
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
      toast.success(`Customer ${isEdit ? "updated" : "added"} successfully`);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    mutation.mutate(form);
  };

  if (!isOpen) return null;

  const inputClass = (field) =>
    `w-full border px-3 py-2 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit Customer" : "Add New Customer"}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter customer name"
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="03XXXXXXXXX"
                maxLength={11}
                className={inputClass("phone")}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Optional"
                className={inputClass("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="street"
              value={form.street}
              onChange={handleChange}
              placeholder="Street address"
              className={inputClass("street")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className={inputClass("city")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State/Province"
                className={inputClass("state")}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Optional notes about this customer"
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {mutation.isPending ? (
                <LoadingSpinner content={isEdit ? "Updating..." : "Adding..."} />
              ) : isEdit ? (
                "Update Customer"
              ) : (
                "Add Customer"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
