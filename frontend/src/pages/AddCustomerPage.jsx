import { Undo } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomButton from "../components/CustomButton";

const AddCustomerPage = () => {
  const [formData, setFormData] = useState({ name: "", phone: "" });

  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch customer if editing
  useEffect(() => {
    if (id) {
      const fetchCustomer = async () => {
        try {
          const res = await fetch(`/api/customers/${id}`);
          if (!res.ok) throw new Error("Customer not found");
          const data = await res.json();
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
          });
        } catch (error) {
          toast.error("Failed to fetch customer data");
          console.error("Error fetching customer:", error);
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
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/customers/update/${id}` : "/api/customers/add";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Failed to save customer");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(`Customer ${id ? "updated" : "added"} successfully`);
      navigate("/customer/manage");
    },
    onError: () => {
      toast.error(`Failed to ${id ? "update" : "add"} customer`);
    },
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill all fields");
      return;
    }
    saveCustomer(formData);
  };

  return (
    <>
      {/* Header */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 mt-5">
        <div className="flex items-center gap-3 w-full flex-col sm:flex-row mt-1">
          {/* Customer Name */}
          <div className="w-full">
            <label
              htmlFor="name"
              className="block mb-1 font-medium text-sm text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter customer name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Customer Phone */}
          <div className="w-full">
            <label
              htmlFor="phone"
              className="block mb-1 font-medium text-sm text-gray-700"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="03XXXXXXXXX"
              required
              pattern="03[0-9]{9}"
              minLength={11}
              maxLength={11}
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Error Message */}
        {isError && <p className="text-sm text-red-600">{error?.message}</p>}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-900 disabled:opacity-50 w-full cursor-pointer"
          >
            {isPending ? (
              <LoadingSpinner content="Saving..." />
            ) : id ? (
              "Update Customer"
            ) : (
              "Add Customer"
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddCustomerPage;
