import { Undo } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomButton from "../components/CustomButton";

const fields = [
  "Kameez Length",
  "Shoulder",
  "Chest",
  "Waist",
  "Hip",
  "Neck",
  "Sleeve Length",
  "Wrist",
  "Bicep",
  "Shalwar Length",
  "Thigh",
  "Knee",
  "Bottom",
  "Pant Waist",
];

const AddMeasurementPage = () => {
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  const [formData, setFormData] = useState({
    length: "",
    shoulder: "",
    chest: "",
    waist: "",
    hip: "",
    neck: "",
    sleeveLength: "",
    wrist: "",
    bicep: "",
    shalwarLength: "",
    thigh: "",
    knee: "",
    bottom: "",
    pantWaist: "",
  });

  const { id, customerId } = useParams();
  const navigate = useNavigate();

  // Fetch Customer
  useEffect(() => {
    const fetchCustomer = async () => {
      if (customerId) {
        try {
          setIsLoadingCustomer(true);
          const res = await fetch(`/api/customers/${customerId}`);
          if (!res.ok) throw new Error("Customer not found");
          const data = await res.json();
          setCustomer({ name: data.name, phone: data.phone });
        } catch (error) {
          toast.error("Failed to fetch customer info");
          console.error("Customer fetch error:", error);
        } finally {
          setIsLoadingCustomer(false);
        }
      }
    };

    fetchCustomer();
  }, [customerId]);

  // Fetch Customer Measurement
  useEffect(() => {
    if (id) {
      const fetchMeasurement = async () => {
        try {
          const res = await fetch(`/api/measurements/${id}`);
          if (!res.ok) throw new Error("Measurement not found");

          const data = await res.json();

          const cleaned = {};
          fields.forEach((field) => {
            cleaned[field] = data[field] || "";
          });
          setFormData(cleaned);
        } catch (error) {
          toast.error("Failed to fetch measurement data");
          console.error("Fetch error:", error);
        }
      };
      fetchMeasurement();
    }
  }, [id]);

  const {
    mutate: saveMeasurements,
    isPending,
    error,
    isError,
  } = useMutation({
    mutationFn: async (data) => {
      const method = id ? "PUT" : "POST";
      const url = id
        ? `/api/measurements/${customerId}`
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
      toast.success(`Measurements ${id ? "updated" : "added"} successfully`);
      navigate("/measurements/manage");
    },
    onError: () => {
      toast.error(`Failed to ${id ? "update" : "add"} measurements`);
    },
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    const isEmpty = Object.values(formData).some((value) => value === "");
    if (isEmpty) {
      toast.error("Please fill all fields");
      return;
    }

    saveMeasurements(formData);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title={id ? "Edit Measurements" : "Add Measurements"}
          subtitle="Fill out the details below to save measurements"
        />

        <div className="sm:w-auto w-full">
          <CustomButton
            title="Manage All Measurements"
            to="/customer/manage"
            Icon={Undo}
          />
        </div>
      </div>

      {/* Customer Detail */}
      {isLoadingCustomer ? (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:gap-10">
            <div className="h-4 w-1/6 bg-gray-300 rounded " />
            <div className="h-4 w-1/6 bg-gray-300 rounded" />
          </div>
        </div>
      ) : (
        customer.name &&
        customer.phone && (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:gap-10">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Name:</span>
                <span>{customer.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mt-1 sm:mt-0">
                <span className="font-medium">Phone:</span>
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
          {fields.map((field) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block mb-1 font-medium text-sm text-gray-700"
              >
                {field}
              </label>
              <input
                id={field}
                name={field}
                type="number"
                placeholder={`${field} size`}
                required
                value={formData[field]}
                onChange={handleInputChange}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder:text-sm sm:placeholder:text-base"
              />
            </div>
          ))}
        </div>

        {/* Error Message */}
        {isError && <p className="text-sm text-red-600">{error?.message}</p>}

        {/* Submit Button */}
        <div className="mt-10">
          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-900 disabled:opacity-50 w-full cursor-pointer"
          >
            {isPending ? (
              <LoadingSpinner content="Saving..." />
            ) : id ? (
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
