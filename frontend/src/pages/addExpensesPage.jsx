import dayjs from "dayjs";
import { DatePicker } from "antd";
import { Undo } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import CustomButton from "../components/CustomButton";
import SectionHeading from "../components/SectionHeading";
import LoadingSpinner from "../components/LoadingSpinner";
// Imports End

const AddExpensesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    month: "",
    salaries: "",
    rent: "",
    electricity: "",
    food: "",
    maintenance: "",
    other: "",
  });

  // Fetch expenses if editing
  useEffect(() => {
    if (id) {
      const fetchExpenses = async () => {
        try {
          const res = await fetch(`/api/expenses/${id}`);
          const data = await res.json();
          setFormData({
            month: data.month || "",
            salaries: data.salaries || "",
            rent: data.rent || "",
            electricity: data.electricity || "",
            food: data.food || "",
            maintenance: data.maintenance || "",
            other: data.other || "",
          });
        } catch (error) {
          toast.error("Failed to fetch expenses data");
          console.error("Error fetching expenses:", error);
        }
      };
      fetchExpenses();
    }
  }, [id]);

  // Save Expenses Mutation
  const { mutate: saveExpenses, isPending } = useMutation({
    mutationFn: async (data) => {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/expenses/update/${id}` : `/api/expenses/add`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Failed to save expenses");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(`Expense ${id ? "updated" : "added"} successfully`);
      navigate("/expenses/manage");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save expenses");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveExpenses(formData);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title={id ? "Edit Expenses" : "Add Expenses"}
          subtitle="Enter monthly expenses below"
        />
        <CustomButton
          title="Manage All Expenses"
          to="/expenses/manage"
          Icon={Undo}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label htmlFor="month" className="block mb-1 text-sm font-medium">
              Month
            </label>
            <DatePicker
              picker="month"
              format="YYYY-MM"
              className="w-full ant-select-single ant-select-selector "
              value={formData.month ? dayjs(formData.month) : null}
              onChange={(date, dateString) =>
                setFormData((prev) => ({ ...prev, month: dateString }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="salaries"
              className="block mb-1 text-sm font-medium"
            >
              Salaries
            </label>
            <input
              type="number"
              name="salaries"
              id="salaries"
              min={0}
              placeholder="Enter Salaries"
              value={formData.salaries}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>

          <div>
            <label htmlFor="rent" className="block mb-1 text-sm font-medium">
              Rent
            </label>
            <input
              type="number"
              name="rent"
              id="rent"
              min={0}
              placeholder="Enter Rent"
              value={formData.rent}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="electricity"
              className="block mb-1 text-sm font-medium"
            >
              Electricity
            </label>
            <input
              type="number"
              name="electricity"
              id="electricity"
              min={0}
              placeholder="Enter Bills"
              value={formData.electricity}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>

          <div>
            <label htmlFor="food" className="block mb-1 text-sm font-medium">
              Food
            </label>
            <input
              type="number"
              name="food"
              id="food"
              min={0}
              placeholder="Enter Food Expense Amount"
              value={formData.food}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="maintenance"
              className="block mb-1 text-sm font-medium"
            >
              Maintenance
            </label>
            <input
              type="number"
              name="maintenance"
              min={0}
              id="maintenance"
              placeholder="Enter Maintenance Expense"
              value={formData.maintenance}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>

          <div>
            <label htmlFor="other" className="block mb-1 text-sm font-medium">
              Other
            </label>
            <input
              type="number"
              name="other"
              id="other"
              min={0}
              value={formData.other}
              placeholder="Other Expense"
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded-md placeholder:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="bg-black text-white px-4 py-2 rounded-full w-full hover:bg-neutral-900 disabled:opacity-50"
          >
            {isPending ? (
              <LoadingSpinner content="Saving..." />
            ) : id ? (
              "Update Expenses"
            ) : (
              "Add Expenses"
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddExpensesPage;
