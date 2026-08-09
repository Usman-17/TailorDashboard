import { useState, useMemo } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle, Eye, Redo, Truck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SummaryCard from "../components/SummaryCard";
import CustomButton from "../components/CustomButton";
import SectionHeading from "../components/SectionHeading";
import CustomTable from "../components/CustomTable";
import CustomSelect from "../components/CustomSelect";
import useGlobalFilter from "../hooks/useGlobalFilter";
import { useGetAllOrders } from "../hooks/useGetAllOrders";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "in progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ready: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const OrdersListingPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orders, isLoading } = useGetAllOrders();

  // Summary stats
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const pending = orders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status)
    ).length;
    return { total, delivered, cancelled, pending };
  }, [orders]);

  const statCards = [
    { id: "all", title: "Total Orders", count: stats.total, icon: Users, color: "#3B82F6" },
    { id: "delivered", title: "Delivered", count: stats.delivered, icon: CheckCircle, color: "#10B981" },
    { id: "pending", title: "Pending", count: stats.pending, icon: Truck, color: "#F59E0B" },
    { id: "cancelled", title: "Cancelled", count: stats.cancelled, icon: Ban, color: "#EF4444" },
  ];

  // Status update mutation
  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const res = await fetch(`/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("Failed to update order status"),
  });

  // Filter by summary card
  const filteredByStatus = useMemo(() => {
    if (filterStatus === "all") return orders;
    if (filterStatus === "pending")
      return orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  // Global search filter
  const filtered = useGlobalFilter(filteredByStatus, search, [
    "orderNumber",
    "customer.name",
    "customer.phone",
    "customer.customerId",
    "status",
    "suitType",
  ]);

  const columns = [
    {
      title: "Sr.",
      key: "sr",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Order #",
      dataIndex: "orderNumber",
      key: "orderNumber",
      sorter: (a, b) => (a.orderNumber || "").localeCompare(b.orderNumber || ""),
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
          {v || "-"}
        </span>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      sorter: (a, b) =>
        (a.customer?.name || "").localeCompare(b.customer?.name || ""),
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {record.customer?.name || "-"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {record.customer?.phone || ""}
          </span>
        </div>
      ),
    },
    {
      title: "Suit Type",
      dataIndex: "suitType",
      key: "suitType",
      sorter: (a, b) => (a.suitType || "").localeCompare(b.suitType || ""),
      render: (v) => <span className="text-sm">{v || "-"}</span>,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: 60,
      sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0),
      render: (v) => <span className="font-medium">{v ?? "-"}</span>,
    },
    {
      title: "Total (Rs.)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: (v) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {v != null ? v.toLocaleString() : "-"}
        </span>
      ),
    },
    {
      title: "Advance (Rs.)",
      dataIndex: "advancePaid",
      key: "advancePaid",
      align: "right",
      sorter: (a, b) => (a.advancePaid || 0) - (b.advancePaid || 0),
      render: (v) => (
        <span className="text-gray-700 dark:text-gray-300">
          {v != null ? Number(v).toLocaleString() : "0"}
        </span>
      ),
    },
    {
      title: "Delivery Date",
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      sorter: (a, b) =>
        moment(a.deliveryDate).unix() - moment(b.deliveryDate).unix(),
      render: (v) =>
        v ? (
          <span className="text-sm">{moment(v).format("DD MMM YYYY")}</span>
        ) : (
          "-"
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (status, record) => (
        <select
          value={status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            updateStatus({ orderId: record._id, status: e.target.value })
          }
          className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 ${
            STATUS_COLORS[status] || STATUS_COLORS.pending
          }`}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      title: "Order Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: (v) =>
        v ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {moment(v).format("DD MMM YYYY")}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 80,
      render: (_, record) => (
        <button
          onClick={() => navigate(`/orders/${record._id}`)}
          className="p-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer"
          title="View Order"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading
          title="Orders List"
          subtitle="Manage all customer orders below"
        />
        <div className="sm:w-auto w-full">
          <CustomButton title="Add New Order" to="/orders/add" Icon={Redo} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-5">
        {statCards.map((card) => (
          <SummaryCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            count={card.count}
            color={card.color}
            isSelected={filterStatus === card.id}
            onClick={() =>
              setFilterStatus(
                filterStatus === card.id && card.id !== "all" ? "all" : card.id
              )
            }
          />
        ))}
      </div>

      {/* Orders Table */}
      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order #, customer, status..."
        totalLabel="Total Orders"
      />
    </>
  );
};

export default OrdersListingPage;
