import { Undo } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import CustomButton from "../components/CustomButton";
import SectionHeading from "../components/SectionHeading";
import LoadingSpinner from "../components/LoadingSpinner";
// Imports End

// All input fields
const fields = [
  "length",
  "shoulder",
  "chest",
  "waist",
  "hip",
  "neck",
  "sleeveLength",
  "wrist",
  "bicep",
  "shalwarLength",
  "thigh",
  "knee",
  "bottom",
  "pantWaist",
];

// Initial form state
const initialFormState = fields.reduce((acc, field) => {
  acc[field] = "";
  return acc;
}, {});

const AddMeasurementPage = () => {
  const [formData, setFormData] = useState(initialFormState);

  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  const navigate = useNavigate();
  const { customerId } = useParams();

  // Fetch Customer Info
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;

      try {
        setIsLoadingCustomer(true);
        const res = await fetch(`/api/customers/${customerId}`);
        if (!res.ok) throw new Error("Customer not found");
        const data = await res.json();
        setCustomer({ name: data.name, phone: data.phone });
      } catch (err) {
        toast.error("Failed to fetch customer info");
        console.error("Customer fetch error:", err);
      } finally {
        setIsLoadingCustomer(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  // Fetch existing measurements
  const { data: measurement } = useQuery({
    queryKey: ["measurement", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const res = await fetch(`/api/measurements/${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch measurement");
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (measurement) {
      const cleaned = { ...initialFormState };
      Object.keys(cleaned).forEach((key) => {
        cleaned[key] = measurement[key] ?? "";
      });
      setFormData(cleaned);
    }
  }, [measurement]);

  // Save or Update Measurements
  const { mutate: saveMeasurements, isPending } = useMutation({
    mutationFn: async (data) => {
      const method = measurement ? "PUT" : "POST";
      const url = measurement
        ? `/api/measurements/update/${customerId}`
        : `/api/measurements/add/${customerId}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Failed to save measurements");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(
        `Measurements ${measurement ? "updated" : "added"} successfully`
      );
      navigate("/customer/manage");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save measurements");
    },
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEmpty = Object.values(formData).some((val) => val === "");
    if (isEmpty) {
      toast.error("Please fill all fields");
      return;
    }
    saveMeasurements(formData);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title={measurement ? "Edit Measurements" : "Add Measurements"}
          subtitle="Fill out the details below to save measurements"
        />
        <CustomButton
          title="Manage All Customers"
          to="/customer/manage"
          Icon={Undo}
        />
      </div>

      {/* Customer Detail */}
      {isLoadingCustomer ? (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
          <div className="flex gap-10">
            <div className="h-4 w-1/6 bg-gray-300 rounded " />
            <div className="h-4 w-1/6 bg-gray-300 rounded" />
          </div>
        </div>
      ) : (
        customer.name &&
        customer.phone && (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 mb-6 text-nowrap">
            <div className="flex gap-10">
              <div className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700">
                <span className="font-medium">Name:</span>
                <span>{customer.name}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700 mt-1 sm:mt-0">
                <span className="font-medium">Phone:</span>
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Measurement Form */}
      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-4">
          {fields.map((field) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block mb-1 font-medium text-sm text-gray-700 capitalize"
              >
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                id={field}
                name={field}
                type="number"
                step="any"
                required
                placeholder={`${field} size`}
                value={formData[field]}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none placeholder:text-sm sm:placeholder:text-base"
              />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-900 disabled:opacity-50 w-full"
          >
            {isPending ? (
              <LoadingSpinner content="Saving..." />
            ) : measurement ? (
              "Update Measurement"
            ) : (
              "Add Measurement"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMeasurementPage;
