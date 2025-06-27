import { Select } from "antd";
import { useState } from "react";
import { Undo } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import CustomButton from "../components/CustomButton";
import LoadingSpinner from "../components/LoadingSpinner";
import SectionHeading from "../components/SectionHeading";
import { useGetAllCustomers } from "../hooks/useGetAllCustomers";

const AddOrdersPage = () => {
  const [formData, setFormData] = useState({
    customer: "",
    suitType: "",
    quantity: 1,
    deliveryDate: "",
    totalAmount: "",
    advancePaid: "",
    notes: "",
  });

  const navigate = useNavigate();

  // Get All Customers
  const { customers = [] } = useGetAllCustomers();

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
      navigate("/orders/manage");
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
          <CustomButton title="Manage Orders" to="/orders/manage" Icon={Undo} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Customer Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <Select
              showSearch
              placeholder="Select customer"
              value={formData.customer}
              className="w-full custom-select"
              optionFilterProp="label"
              onChange={(value) =>
                setFormData({ ...formData, customer: value })
              }
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              options={customers.map((customer) => ({
                label: `${customer.name} (${customer.phone})`,
                value: customer._id,
              }))}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Suit Type</label>
            <Select
              value={formData.suitType}
              placeholder="Select Suit type"
              className="w-full"
              onChange={(value) =>
                setFormData({ ...formData, suitType: value })
              }
              options={[
                { value: "Simple", label: "Simple" },
                { value: "Karahi", label: "Karahi" },
              ]}
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
          <div>
            <label className="block mb-1 text-sm font-medium">
              Total Price
            </label>
            <input
              type="number"
              min={1}
              placeholder="PKR"
              required
              name="totalAmount"
              onChange={handleChange}
              value={formData.totalAmount}
              className="w-full border px-3 py-2 rounded-md"
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
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. add pockets or special fabric"
            className="w-full border px-3 py-2 rounded-md"
            rows={2}
          />
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-4 py-2 rounded-full w-full hover:bg-neutral-900 disabled:opacity-50"
          >
            {isPending ? <LoadingSpinner content="Saving..." /> : "Add Order"}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddOrdersPage;
