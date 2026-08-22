import moment from "moment";
import { useState, useMemo } from "react";
import {
  Ban,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  Redo,
  Search,
  SquarePen,
  Truck,
  Users,
  X,
} from "lucide-react";

import SummaryCard from "../../../components/SummaryCard";
import CustomTable from "../../../components/CustomTable";
import CustomModal from "../../../components/CustomModal";
import BookOrderModal from "../CustomersPage/BookOrderModal";
import SectionHeading from "../../../components/SectionHeading";

import EditOrderModal from "./EditOrderModal";
import OrderDetailPage from "./OrderDetailPage";

import useGlobalFilter from "../../../hooks/useGlobalFilter";
import { useGetAllOrders } from "../../../hooks/useGetAllOrders";
import useGetAuth from "../../../hooks/useGetAuth";
import useGetAllCustomers from "../../../hooks/useGetAllCustomers";
// Imports End----

const STATUS_COLORS = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "in progress":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ready:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const OrdersPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [bookOrderCustomer, setBookOrderCustomer] = useState(null);

  const { orders, isLoading } = useGetAllOrders();
  const { data: customersData, isLoading: customersLoading } =
    useGetAllCustomers();
  const { data: authUser } = useGetAuth();

  const customers = useMemo(
    () => customersData?.customers || [],
    [customersData],
  );

  const filteredCustomers = useGlobalFilter(customers, customerSearch, [
    "name",
    "phone",
    "customerId",
  ]);

  const openBookOrder = (customer) => {
    setPickerOpen(false);
    setCustomerSearch("");
    setBookOrderCustomer(customer);
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const pending = orders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status),
    ).length;
    return { total, delivered, cancelled, pending };
  }, [orders]);

  const statCards = [
    {
      id: "all",
      title: "Total Orders",
      count: stats.total,
      icon: Users,
      color: "#3B82F6",
    },
    {
      id: "delivered",
      title: "Delivered",
      count: stats.delivered,
      icon: CheckCircle,
      color: "#10B981",
    },
    {
      id: "pending",
      title: "Pending",
      count: stats.pending,
      icon: Truck,
      color: "#F59E0B",
    },
    {
      id: "cancelled",
      title: "Cancelled",
      count: stats.cancelled,
      icon: Ban,
      color: "#EF4444",
    },
  ];

  const filtered = useMemo(() => {
    let result = orders;
    if (filterStatus === "pending")
      result = result.filter(
        (o) => !["delivered", "cancelled"].includes(o.status),
      );
    else if (filterStatus !== "all")
      result = result.filter((o) => o.status === filterStatus);

    if (search) {
      const q = search.toLowerCase();
      const match = (val) =>
        val != null && val.toString().toLowerCase().includes(q);
      result = result.filter((o) => {
        const customer = o.customer || {};
        const suits = (o.items || [])
          .map((it) => `${it.suitType || ""} ${it.description || ""}`)
          .join(" ");
        return (
          match(o.orderNumber) ||
          match(customer.name) ||
          match(customer.phone) ||
          match(customer.customerId) ||
          match(o.status) ||
          (suits && suits.toLowerCase().includes(q)) ||
          match(o.totalAmount)
        );
      });
    }

    const isUrgent = (o) => {
      if (!o.deliveryDate || ["delivered", "cancelled"].includes(o.status))
        return false;
      return (
        moment(o.deliveryDate)
          .startOf("day")
          .diff(moment().startOf("day"), "days") <= 3
      );
    };
    const urgent = result.filter(isUrgent);
    const rest = result.filter((o) => !isUrgent(o));
    return [...urgent, ...rest];
  }, [orders, filterStatus, search]);

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
      sorter: (a, b) =>
        (a.orderNumber || "").localeCompare(b.orderNumber || ""),
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
      title: "Suits",
      key: "items",
      render: (_, record) => {
        const items = record.items || [];
        if (items.length === 0) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex flex-col gap-0.5">
            {items.slice(0, 2).map((item, i) => (
              <span
                key={i}
                className="text-xs text-gray-700 dark:text-gray-300"
              >
                {item.suitType || "-"}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
            ))}
            {items.length > 2 && (
              <span className="text-[10px] text-gray-400">
                +{items.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Delivery",
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
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: (v) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {v != null ? `Rs. ${v.toLocaleString()}` : "-"}
        </span>
      ),
    },
    {
      title: "Remaining",
      key: "remaining",
      align: "right",
      sorter: (a, b) => {
        const aRem = (a.totalAmount || 0) - (a.advancePaid || 0);
        const bRem = (b.totalAmount || 0) - (b.advancePaid || 0);
        return aRem - bRem;
      },
      render: (_, record) => {
        const remaining = (record.totalAmount || 0) - (record.advancePaid || 0);
        return (
          <span
            className={`font-semibold ${remaining === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
          >
            Rs. {remaining.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (status) => (
        <span
          className={`text-xs font-semibold rounded-full px-3 py-1 ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}
        >
          {status?.charAt(0).toUpperCase() + status?.slice(1) || "-"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 120,
      render: (_, record) => {
        const canEdit = !["ready", "delivered", "cancelled"].includes(
          record.status,
        );
        return (
          <div className="flex items-center justify-center gap-2">
            {canEdit && (
              <button
                onClick={() => setEditingOrderId(record._id)}
                className="p-2 rounded-full border transition-all duration-200 shadow-sm cursor-pointer bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[color-mix(in_srgb,var(--secondary-color)_30%,transparent)] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-[color-mix(in_srgb,var(--secondary-color)_15%,transparent)] dark:hover:text-amber-300 active:scale-90 active:shadow-inner"
                title="Edit"
              >
                <SquarePen size={16} />
              </button>
            )}
            <button
              onClick={() => setSelectedOrderId(record._id)}
              className="p-2 rounded-full border transition-all duration-200 shadow-sm cursor-pointer bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#3b1f5a] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#2a1b44] dark:hover:text-blue-300 active:scale-90 active:shadow-inner"
              title="View"
            >
              <ExternalLink size={16} />
            </button>
            {record.status === "ready" && record.customer?.phone && (
              <button
                onClick={() => {
                  let phone = record.customer.phone.replace(/[^0-9]/g, "");
                  if (phone.startsWith("0")) phone = "92" + phone.slice(1);
                  const totalSuits = record.items?.length || 0;
                  const totalAmount = Number(
                    record.totalAmount || 0,
                  ).toLocaleString();
                  const shopName = authUser?.shop?.name || "our shop";
                  const msg = `Assalam o Alaikum ${record.customer.name},\n\nThis is to inform you that your order *${record.orderNumber}* is now *ready for pickup*.\n\n*Order Summary:*\n- Total Suits: ${totalSuits}\n- Total Amount: Rs. ${totalAmount}\n\nKindly visit us at your earliest convenience to collect your order.\n\nJazakAllah,\n*${shopName}*`;
                  window.open(
                    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
                    "_blank",
                  );
                }}
                className="p-2 rounded-full border transition-all duration-200 shadow-sm cursor-pointer bg-white dark:bg-[#1a1129] border-gray-300 dark:border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 dark:hover:bg-[#25D366]/10 active:scale-90 active:shadow-inner"
                title="WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-2 px-1 py-2 border-b border-gray-200 dark:border-gray-800">
        <SectionHeading title="Orders" subtitle="Manage all customer orders" />
        <button
          onClick={() => setPickerOpen(true)}
          className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-sm font-semibold transition-all cursor-pointer text-white shadow-md hover:shadow-purple-500/30 active:scale-95 shrink-0"
        >
          <Redo size={16} />
          Add New Order
        </button>
      </div>

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
                filterStatus === card.id && card.id !== "all" ? "all" : card.id,
              )
            }
          />
        ))}
      </div>

      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order #, customer, status..."
        totalLabel="Total Orders"
        rowClassName={(record) => {
          let cls = "!h-12 [&>td]:!py-1.5 [&>td]:!px-2 cursor-pointer";
          if (
            record.deliveryDate &&
            !["delivered", "cancelled"].includes(record.status)
          ) {
            const days = moment(record.deliveryDate)
              .startOf("day")
              .diff(moment().startOf("day"), "days");
            if (days <= 3) cls = `row-urgent ${cls}`;
          }
          return cls;
        }}
      />

      <OrderDetailPage
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onEditOrder={(id) => setEditingOrderId(id)}
        fullScreen
      />

      <EditOrderModal
        orderId={editingOrderId}
        open={!!editingOrderId}
        onClose={() => setEditingOrderId(null)}
      />

      <BookOrderModal
        open={!!bookOrderCustomer}
        onClose={() => setBookOrderCustomer(null)}
        customer={bookOrderCustomer}
      />

      {/* Customer Picker for New Order */}
      <CustomModal isOpen={pickerOpen} className="w-[92%] max-w-md">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3.5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Select Customer
            </h3>
            <button
              onClick={() => setPickerOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by name, phone, ID..."
              className="w-full pl-10 pr-3.5 h-10 rounded-lg text-[14px] font-['Outfit',sans-serif] text-gray-900 dark:text-white placeholder-gray-400 bg-gray-50 dark:bg-[#0f0d1b] border-[1.5px] border-gray-200 dark:border-purple-500/30 focus:border-[var(--secondary-color)] dark:focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.25)] focus:outline-none transition-all duration-200"
            />
          </div>

          <div className="max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
            {customersLoading ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                Loading customers...
              </p>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                No customers found
              </p>
            ) : (
              filteredCustomers.map((cust) => (
                <button
                  key={cust._id}
                  onClick={() => openBookOrder(cust)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15102a] hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition cursor-pointer text-left"
                >
                  <div className="size-9 rounded-full bg-purple-600/15 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-sm border border-purple-500/30 shrink-0">
                    {(cust.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {cust.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cust.phone} • {cust.customerId}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </CustomModal>
    </>
  );
};

export default OrdersPage;
