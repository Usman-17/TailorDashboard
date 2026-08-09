import { Select } from "antd";
import { useState, useEffect } from "react";
import { Undo } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import CustomButton from "../components/CustomButton";
import LoadingSpinner from "../components/LoadingSpinner";
import SectionHeading from "../components/SectionHeading";
import { useGetAllCustomers } from "../hooks/useGetAllCustomers";
import { useGetAllSuitTypes } from "../hooks/useGetSuitTypes.jsx";

const AddOrdersPage = () => {
  const [searchParams] = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId") || "";

  const [formData, setFormData] = useState({
    customer: prefilledCustomerId,
    suitType: "Single Silai",
    quantity: 1,
    deliveryDate: "",
    totalAmount: "",
    advancePaid: "",
    notes: "",
  });

  const navigate = useNavigate();

  // Get All Customers
  const { data: customersData } = useGetAllCustomers({ page: 1, limit: 1000 });
  const customers = customersData?.customers || [];

  // Get Active Suit Types
  const { data: suitTypesData } = useGetAllSuitTypes();
  const activeSuitTypes = suitTypesData?.suitTypes || [];

  const suitTypeOptions =
    activeSuitTypes.length > 0
      ? activeSuitTypes.map((st) => ({
          label: `${st.name} (Rs. ${st.price})`,
          value: st.name,
          price: st.price,
        }))
      : [
          { label: "Single Silai (Rs. 1200)", value: "Single Silai", price: 1200 },
          { label: "Double Silai (Rs. 1500)", value: "Double Silai", price: 1500 },
          { label: "Karhai (Rs. 2000)", value: "Karhai", price: 2000 },
          { label: "Simple (Rs. 1000)", value: "Simple", price: 1000 },
          { label: "Fancy (Rs. 2500)", value: "Fancy", price: 2500 },
        ];

  const handleSuitTypeChange = (value) => {
    const selected = suitTypeOptions.find((opt) => opt.value === value);
    setFormData((prev) => ({
      ...prev,
      suitType: value,
      totalAmount: selected?.price ? selected.price * (prev.quantity || 1) : prev.totalAmount,
    }));
  };

  // Add Order Mutation
  const { mutate: addOrder, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/orders/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Failed to add order");
      }

      return res.json();
    },

    onSuccess: () => {
      toast.success("Order added successfully");
      navigate("/orders");
    },

    onError: (err) => {
      toast.error(err.message || "Failed to add order");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addOrder(formData);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title="Add New Order"
          subtitle="Fill order details below"
        />

        <div className="sm:w-auto w-full">
          <CustomButton title="Manage Orders" to="/orders" Icon={Undo} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer */}
        <div>
          <label className="block text-sm font-medium mb-1">Customer</label>
          <Select
            showSearch
            placeholder="Select customer"
            value={formData.customer}
            className="w-full"
            optionFilterProp="label"
            onChange={(value) => setFormData({ ...formData, customer: value })}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            options={customers.map((c) => ({
              label: `${c.name} (${c.phone})`,
              value: c._id,
            }))}
          />
        </div>

        {/* Suit Type & Quantity */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium">Suit Type</label>
            <Select
              value={formData.suitType}
              placeholder="Select Suit type"
              className="w-full"
              onChange={handleSuitTypeChange}
              options={suitTypeOptions}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Quantity</label>
            <input
              type="number"
              name="quantity"
              min={1}
              value={formData.quantity}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Delivery Date
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
        </div>

        {/* Delivery Date & Advance Payment */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium">Amount</label>
            <input
              type="number"
              name="totalAmount"
              placeholder="Enter Total Amount"
              min={1}
              value={formData.totalAmount}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Advance Payment
            </label>
            <input
              type="number"
              min={1}
              name="advancePaid"
              value={formData.advancePaid}
              onChange={handleChange}
              placeholder="Advance Payment"
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1 text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. add pockets or special fabric"
            className="w-full border px-3 py-2 rounded-md"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-4 py-2 rounded-full w-full hover:bg-neutral-900 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? <LoadingSpinner content="Saving..." /> : "Add Order"}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddOrdersPage;
