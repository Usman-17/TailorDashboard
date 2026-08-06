import { Undo } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomButton from "../components/CustomButton";

const PHONE_REGEX = /^(\+?92|0)?[3]\d{9}$/;

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  notes: "",
};

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

const AddCustomerPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (id) {
      const fetchCustomer = async () => {
        try {
          const res = await fetch(`/api/customers/${id}`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Customer not found");
          const data = await res.json();
          setForm({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            street: data.address?.street || "",
            city: data.address?.city || "",
            state: data.address?.state || "",
            notes: data.notes || "",
          });
        } catch (error) {
          toast.error("Failed to fetch customer data");
        }
      };
      fetchCustomer();
    }
  }, [id]);

  const {
    mutate: saveCustomer,
    isPending,
    error,
    isError,
  } = useMutation({
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

      const method = id ? "PUT" : "POST";
      const url = id ? `/api/customers/update/${id}` : "/api/customers/add";

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
      toast.success(`Customer ${id ? "updated" : "added"} successfully`);
      navigate("/customer/manage");
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
    saveCustomer(form);
  };

  const inputClass = (field) =>
    `w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title={id ? "Edit Customer" : "Add New Customer"}
          subtitle="Fill out the details below to save customer"
        />
        <div className="sm:w-auto w-full">
          <CustomButton
            title="Manage All Customers"
            to="/customer/manage"
            Icon={Undo}
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 mt-5 max-w-2xl bg-white p-6 rounded-lg border"
        noValidate
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              placeholder="Enter customer name"
              value={form.name}
              onChange={handleChange}
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="03XXXXXXXXX"
              maxLength={11}
              value={form.phone}
              onChange={handleChange}
              className={inputClass("phone")}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm text-gray-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            placeholder="Optional"
            value={form.email}
            onChange={handleChange}
            className={inputClass("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm text-gray-700">
            Street Address
          </label>
          <input
            name="street"
            type="text"
            placeholder="Street address"
            value={form.street}
            onChange={handleChange}
            className={inputClass("street")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">
              City
            </label>
            <input
              name="city"
              type="text"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              className={inputClass("city")}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-gray-700">
              State
            </label>
            <input
              name="state"
              type="text"
              placeholder="State/Province"
              value={form.state}
              onChange={handleChange}
              className={inputClass("state")}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm text-gray-700">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Optional notes about this customer"
            value={form.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        {isError && <p className="text-sm text-red-600">{error?.message}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isPending ? (
              <LoadingSpinner content={id ? "Updating..." : "Adding..."} />
            ) : id ? (
              "Update Customer"
            ) : (
              "Add Customer"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/customer/manage")}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default AddCustomerPage;
