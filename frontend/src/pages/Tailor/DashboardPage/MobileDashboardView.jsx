import moment from "moment";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, ArrowRight, ChevronRight, Calendar, X } from "lucide-react";

import CustomModal from "../../../components/CustomModal";
import CustomInput from "../../../components/CustomInput";
import ModalActionButtons from "../../../components/ModalActionButtons";

import MobileDashboardSkeleton from "./MobileDashboardSkeleton";

import useTailorRecentOrders from "../../../hooks/useTailorRecentOrders";
import useTailorDashboardStats from "../../../hooks/useTailorDashboardStats";
import useGetAuth from "../../../hooks/useGetAuth";
import * as customerRepo from "../../../offline/repos/customerRepo";

// Assets imports
import suitIcon from "../../../assets/suit.png";
import teamIcon from "../../../assets/team.png";
import moneyIcon from "../../../assets/money.png";
import expenseIcon from "../../../assets/expense.png";
import addUsersIcon from "../../../assets/add-users.png";
import addOrdersIcon from "../../../assets/add-orders.png";
import shoppingBagIcon from "../../../assets/shopping-bag.png";
import measuringTapeIcon from "../../../assets/measuring-tape.png";
// Imports End-----

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

const STATUS_STYLES = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Processing",
  },
  in_progress: {
    bg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "In Progress",
  },
  ready: {
    bg: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    label: "Ready",
  },
  delivered: {
    bg: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    label: "Delivered",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    label: "Cancelled",
  },
};

const MobileDashboardView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: authUser } = useGetAuth();
  const shopId = authUser?.shop?._id || authUser?.shop;

  const { data: stats, isLoading: statsLoading } = useTailorDashboardStats();
  const { data: recentOrders = [], isLoading: ordersLoading } =
    useTailorRecentOrders();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});

  const { mutate: saveCustomer, isPending } = useMutation({
    mutationFn: async (payload) => {
      const cleanName = payload.name.trim();
      const cleanPhone = payload.phone.replace(/[\s\-()]/g, "");

      if (navigator.onLine) {
        const res = await fetch("/api/customers/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: cleanName,
            phone: cleanPhone,
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to save customer");
        return result;
      } else {
        const existing = await customerRepo.getByPhone(shopId, cleanPhone);
        if (existing) {
          throw new Error("A customer with this phone number already exists");
        }
        return await customerRepo.create(shopId, {
          name: cleanName,
          phone: cleanPhone,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["tailorDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["tailorRecentOrders"] });
      queryClient.invalidateQueries({ queryKey: ["tailorLatestCustomers"] });
      toast.success("Customer added successfully!");
      closeModal();
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

  const closeModal = () => {
    setModalOpen(false);
    setForm({ name: "", phone: "" });
    setErrors({});
  };

  const statSummaryCards = [
    {
      id: "active_orders",
      title: "Active Orders",
      count: !stats ? "..." : (stats?.activeOrders ?? 0),
      image: shoppingBagIcon,
      bgColor: "bg-[#f2ebfe] dark:bg-[#2a1f4e]",
      onClick: () => navigate("/orders"),
    },
    {
      id: "total_customers",
      title: "Total Customers",
      count: !stats ? "..." : (stats?.totalCustomers ?? 0),
      image: teamIcon,
      bgColor: "bg-[#e6f9ed] dark:bg-[#1a3a2a]",
      onClick: () => navigate("/customers"),
    },
    {
      id: "payments",
      title: "Payments",
      count: !stats ? "..." : (stats?.readyOrders ?? 0),
      image: moneyIcon,
      bgColor: "bg-[#fff2e6] dark:bg-[#3a2f1a]",
      onClick: () => navigate("/payments"),
    },
  ];

  const quickActionsRow1 = [
    {
      id: "customers",
      title: "Customers",
      image: addUsersIcon,
      bgColor: "bg-[#f2ebfe] dark:bg-[#2a1f4e]",
      onClick: () => navigate("/customers"),
    },
    {
      id: "measurements",
      title: "Measurements",
      image: measuringTapeIcon,
      bgColor: "bg-[#e6f9ed] dark:bg-[#1a3a2a]",
      onClick: () => navigate("/customers?filter=without_measurement"),
    },
    {
      id: "add_orders",
      title: "Add Orders",
      image: addOrdersIcon,
      bgColor: "bg-[#ebf3fe] dark:bg-[#1a2a3a]",
      onClick: () => navigate("/orders"),
    },
  ];

  const quickActionsRow2 = [
    {
      id: "add_suit_type",
      title: "Add Suit Type",
      image: suitIcon,
      bgColor: "bg-[#fff2e6] dark:bg-[#3a2f1a]",
      onClick: () => navigate("/suit-types"),
    },
    {
      id: "expenses",
      title: "Expenses",
      image: expenseIcon,
      bgColor: "bg-[#fef3f2] dark:bg-[#3a1a1a]",
      onClick: () => navigate("/expenses"),
    },
  ];

  if (statsLoading && !stats) {
    return <MobileDashboardSkeleton />;
  }

  return (
    <div className="py-2 space-y-5">
      {/* 3 Summary Stat Cards Row using Assets */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-stretch">
        {statSummaryCards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            type="button"
            className={`w-full h-[110px] p-3 rounded-2xl flex flex-col justify-between items-start text-left transition-all duration-200 cursor-pointer active:scale-95 ${card.bgColor}`}
          >
            <img
              src={card.image}
              alt={card.title}
              className="size-7 sm:size-8 object-contain shrink-0"
            />
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white block leading-none">
                {card.count}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-200 mt-1 block leading-tight">
                {card.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions Header */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
        </div>

        {/* Quick Actions Grid: Row 1 (3 cards) & Row 2 (2 cards) */}
        <div className="space-y-2.5 sm:space-y-3.5">
          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 items-stretch">
            {quickActionsRow1.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                type="button"
                className={`w-full h-[110px] p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-between transition-all duration-200 cursor-pointer active:scale-95 text-center ${action.bgColor}`}
              >
                <div className="flex-1 flex items-center justify-center pt-1">
                  <img
                    src={action.image}
                    alt={action.title}
                    className="size-8 sm:size-9 object-contain shrink-0"
                  />
                </div>
                <div className="h-8 flex items-center justify-center w-full">
                  <span className="text-[11px] sm:text-xs font-bold leading-tight text-gray-900 dark:text-gray-100 line-clamp-2">
                    {action.title}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Row 2: 2 cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 items-stretch">
            {quickActionsRow2.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                type="button"
                className={`w-full h-[100px] p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-between transition-all duration-200 cursor-pointer active:scale-95 text-center ${action.bgColor}`}
              >
                <div className="flex-1 flex items-center justify-center pt-1">
                  <img
                    src={action.image}
                    alt={action.title}
                    className="size-8 sm:size-9 object-contain shrink-0"
                  />
                </div>
                <div className="h-8 flex items-center justify-center w-full">
                  <span className="text-[11px] sm:text-xs font-bold leading-tight text-gray-900 dark:text-gray-100 line-clamp-2">
                    {action.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
            Recent Orders
          </h3>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            See All <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-2.5">
          {ordersLoading ? (
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800/80 bg-white dark:bg-[#141025] flex items-center justify-between animate-pulse"
                >
                  <div className="space-y-2 flex-1 pr-3">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3.5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="h-3.5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-8 w-24 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
              No recent orders found
            </div>
          ) : (
            recentOrders.slice(0, 5).map((order) => {
              const statusConfig =
                STATUS_STYLES[order.status] || STATUS_STYLES.pending;
              const title =
                order.items?.[0]?.suitType?.name ||
                order.customer?.name ||
                "Shalwar Kameez";

              return (
                <div
                  key={order._id}
                  className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#141025] flex items-center justify-between shadow-xs hover:shadow-md transition-shadow"
                >
                  {/* Left Info */}
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                      {title}
                    </h4>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${statusConfig.bg}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                        • Order #{order.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span>
                        Delivery:{" "}
                        {moment(order.deliveryDate).format("DD MMM YYYY")}
                      </span>
                    </div>
                  </div>

                  {/* Right Button */}
                  <button
                    type="button"
                    onClick={() => navigate("/orders")}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    View Details <ChevronRight size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Customer Modal */}
      <CustomModal isOpen={modalOpen} className="w-[92%] max-w-md">
        <div className="flex flex-col gap-5">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UserPlus size={18} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add New Customer
              </h3>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4.5"
            noValidate
          >
            <CustomInput
              id="mobileCustomerName"
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
              id="mobileCustomerPhone"
              label="Mobile Number"
              required
              placeholder="03XXXXXXXXX"
              maxLength={11}
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                if (errors.phone) setErrors({ ...errors, phone: "" });
              }}
              error={errors.phone}
            />

            <ModalActionButtons
              onCancel={closeModal}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
              submitText="Save Customer"
              loadingText="Saving..."
            />
          </form>
        </div>
      </CustomModal>
    </div>
  );
};

export default MobileDashboardView;
