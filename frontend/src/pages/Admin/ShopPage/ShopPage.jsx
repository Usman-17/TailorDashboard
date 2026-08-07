import dayjs from "dayjs";
import moment from "moment";
import toast from "react-hot-toast";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  SquarePen,
  X,
  MoreHorizontal,
  Wallet,
  ScrollText,
  Store,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import CustomTable from "../../../components/CustomTable";
import CustomInput from "../../../components/CustomInput";
import useGetAllShops from "../../../hooks/useGetAllShops";
import CustomSelect from "../../../components/CustomSelect";
import CustomUpload from "../../../components/CustomUpload";
import useGlobalFilter from "../../../hooks/useGlobalFilter";
import SectionHeading from "../../../components/SectionHeading";
import CustomDatePicker from "../../../components/CustomDatePicker";
import ActionButtons from "../../../components/ActionButtons";
import FullScreenModal from "../../../components/FullScreenModal";
import SummaryCard from "../../../components/SummaryCard";

import ReceivePaymentModal from "./ReceivePaymentModal";
import PaymentHistoryModal from "./PaymentHistoryModal";

const PLAN_BADGE = {
  monthly: "bg-blue-100 text-blue-700",
  quarterly: "bg-green-100 text-green-700",
  "half-yearly": "bg-purple-100 text-purple-700",
  yearly: "bg-orange-100 text-orange-700",
  custom: "bg-gray-100 text-gray-700",
};

const INITIAL_FORM = {
  fullName: "",
  email: "",
  mobile: "",
  shopName: "",
  subscriptionPlan: "monthly",
  subscriptionAmount: 1000,
  subscriptionDuration: "",
  subscriptionStart: "",
  subscriptionExpiry: "",
  isActive: "active",
  amountReceived: 0,
  notes: "",
  address: {
    street: "",
    city: "",
  },
};

const PLAN_MONTHS = {
  monthly: 1,
  quarterly: 3,
  "half-yearly": 6,
  yearly: 12,
};

const PLAN_PRICES = {
  monthly: 1000,
  quarterly: 2500,
  "half-yearly": 4500,
  yearly: 8000,
};

const getExpiryDate = (startDate, plan, duration) => {
  if (!startDate) return "";
  const start = dayjs(startDate);
  if (plan === "custom") {
    return start.add(Number(duration) || 0, "month").format("YYYY-MM-DD");
  }
  const months = PLAN_MONTHS[plan] || 1;
  return start.add(months, "month").format("YYYY-MM-DD");
};

const ShopPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [editingShop, setEditingShop] = useState(null);
  const [loadingShopId, setLoadingShopId] = useState(null);
  const [receivePaymentShop, setReceivePaymentShop] = useState(null);
  const [paymentHistoryShop, setPaymentHistoryShop] = useState(null);
  const formRef = useRef(null);

  const queryClient = useQueryClient();
  const { data: shops = [], isLoading } = useGetAllShops();

  const summaryStats = useMemo(() => {
    const total = shops.length;
    let active = 0;
    let expired = 0;
    let expiringSoon = 0;
    let suspended = 0;
    let totalRev = 0;

    const now = moment();

    shops.forEach((shop) => {
      totalRev += Number(shop.subscriptionAmount) || 0;

      const expiryDate = shop.rawExpiry ? moment(shop.rawExpiry) : null;
      const isPastExpiry = expiryDate ? expiryDate.isBefore(now, "day") : false;
      const daysUntilExpiry = expiryDate ? expiryDate.diff(now, "days") : null;

      if (shop.isActive === "suspended") {
        suspended++;
      } else if (shop.isActive === "expired" || isPastExpiry) {
        expired++;
      } else if (shop.isActive === "active") {
        active++;
        if (
          daysUntilExpiry !== null &&
          daysUntilExpiry >= 0 &&
          daysUntilExpiry <= 7
        ) {
          expiringSoon++;
        }
      }
    });

    return { total, active, expired, expiringSoon, suspended, totalRev };
  }, [shops]);

  const statCards = [
    {
      id: "all",
      title: "Total Shops",
      count: summaryStats.total,
      icon: Store,
      color: "#6366F1",
    },
    {
      id: "active",
      title: "Active",
      count: summaryStats.active,
      icon: CheckCircle2,
      color: "#10B981",
    },
    {
      id: "expiring_soon",
      title: "Expiring Soon",
      count: summaryStats.expiringSoon,
      icon: Clock,
      color: "#F59E0B",
    },
    {
      id: "expired",
      title: "Expired",
      count: summaryStats.expired,
      icon: AlertTriangle,
      color: "#EF4444",
    },
    {
      id: "suspended",
      title: "Suspended",
      count: summaryStats.suspended,
      icon: XCircle,
      color: "#6B7280",
    },
  ];

  const statusFiltered = useMemo(() => {
    if (statusFilter === "all") return shops;
    const now = moment();
    return shops.filter((shop) => {
      const expiryDate = shop.rawExpiry ? moment(shop.rawExpiry) : null;
      const isPastExpiry = expiryDate ? expiryDate.isBefore(now, "day") : false;
      const daysUntilExpiry = expiryDate ? expiryDate.diff(now, "days") : null;

      if (statusFilter === "active") {
        return shop.isActive === "active" && !isPastExpiry;
      }
      if (statusFilter === "expired") {
        return shop.isActive === "expired" || isPastExpiry;
      }
      if (statusFilter === "expiring_soon") {
        return (
          shop.isActive === "active" &&
          !isPastExpiry &&
          daysUntilExpiry !== null &&
          daysUntilExpiry >= 0 &&
          daysUntilExpiry <= 7
        );
      }
      if (statusFilter === "suspended") {
        return shop.isActive === "suspended";
      }
      return true;
    });
  }, [shops, statusFilter]);

  const filtered = useGlobalFilter(statusFiltered, search, [
    "name",
    "owner",
    "email",
    "phone",
  ]);

  const { mutate: createShop, isPending } = useMutation({
    mutationFn: async (data) => {
      const { logo, ...payload } = data;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (key === "address") {
          formData.append("address", JSON.stringify(val));
        } else {
          formData.append(key, val);
        }
      });
      if (logo && typeof logo !== "string") formData.append("logo", logo);

      const res = await fetch("/api/shops/create-owner", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create shop");
      return result;
    },
    onSuccess: () => {
      toast.success("Shop and owner created successfully");
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      closeModal();
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: updateShop, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, data }) => {
      const { logo, ...payload } = data;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (key === "address") {
          formData.append("address", JSON.stringify(val));
        } else {
          formData.append(key, String(val));
        }
      });
      if (logo && typeof logo !== "string") formData.append("logo", logo);

      const res = await fetch(`/api/shops/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update shop");
      return result;
    },
    onSuccess: () => {
      toast.success("Shop updated successfully");
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      closeModal();
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: receivePayment, isPending: isReceiving } = useMutation({
    mutationFn: async ({ shopId, data }) => {
      const res = await fetch(`/api/payments/receive/${shopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to record payment");
      return result;
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      setReceivePaymentShop(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const { data: paymentHistoryData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments", paymentHistoryShop?._id],
    queryFn: async () => {
      const res = await fetch(`/api/payments/shop/${paymentHistoryShop._id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!paymentHistoryShop,
  });

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email format";
    if (!form.mobile.trim()) e.mobile = "Mobile is required";
    else if (form.mobile.length !== 11) e.mobile = "Must be 11 digits";
    if (!form.shopName.trim()) e.shopName = "Shop name is required";
    if (!form.address.city.trim()) e.city = "City is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (editingShop) {
      // Strip subscription fields — those are managed via Receive Payment
      const { subscriptionPlan: _sp, subscriptionAmount: _sa, subscriptionDuration: _sd, subscriptionStart: _ss, subscriptionExpiry: _se, amountReceived: _ar, ...editPayload } = form;
      updateShop({ id: editingShop._id, data: { ...editPayload, logo: logoFile } });
    } else {
      createShop({ ...form, logo: logoFile });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(INITIAL_FORM);
    setErrors({});
    setLogoFile(null);
    setEditingShop(null);
    setLoadingShopId(null);
  };

  useEffect(() => {
    if (editingShop) {
      const fetchShop = async () => {
        setLoadingShopId(editingShop._id);
        try {
          const res = await fetch(`/api/shops/${editingShop._id}`, {
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setForm({
            fullName: data.owner?.fullName || "",
            email: data.owner?.email || "",
            mobile: data.owner?.mobile || "",
            shopName: data.name || "",
            subscriptionPlan: data.subscriptionPlan || "monthly",
            subscriptionAmount: data.subscriptionAmount || 0,
            subscriptionDuration: data.subscriptionDuration || "",
            subscriptionStart: data.subscriptionStart
              ? dayjs(data.subscriptionStart).format("YYYY-MM-DD")
              : "",
            subscriptionExpiry: data.subscriptionExpiry
              ? dayjs(data.subscriptionExpiry).format("YYYY-MM-DD")
              : "",
            isActive: data.isActive || "active",
            amountReceived: data.amountReceived || 0,
            notes: data.notes || "",
            address: {
              street: data.address?.street || "",
              city: data.address?.city || "",
            },
          });

          if (data.logo?.url) {
            setLogoFile(data.logo.url);
          }

          setShowModal(true);
        } catch (err) {
          toast.error(err.message || "Failed to load shop data");
        } finally {
          setLoadingShopId(null);
        }
      };
      fetchShop();
    }
  }, [editingShop]);

  const columns = [
    {
      title: "Sr.",
      key: "sr",
      width: 60,
      align: "center",
      sorter: (a, b) => a.sr - b.sr,
      render: (_, record) => record.sr,
    },
    {
      title: "Shop Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    {
      title: "Owner",
      dataIndex: "owner",
      key: "owner",
      sorter: (a, b) => a.owner.localeCompare(b.owner),
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      sorter: (a, b) => a.city.localeCompare(b.city),
    },
    {
      title: "Plan",
      dataIndex: "subscriptionPlan",
      key: "subscriptionPlan",
      sorter: (a, b) =>
        (a.subscriptionPlan || "").localeCompare(b.subscriptionPlan || ""),
      render: (v) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${PLAN_BADGE[v] || PLAN_BADGE.free}`}
        >
          {v || "free"}
        </span>
      ),
    },
    {
      title: "Subscription",
      dataIndex: "subscriptionAmount",
      key: "subscriptionAmount",
      sorter: (a, b) => a.subscriptionAmount - b.subscriptionAmount,
      render: (v) => `Rs. ${v.toLocaleString()}`,
    },
    {
      title: "Due Date",
      dataIndex: "subscriptionExpiry",
      key: "subscriptionExpiry",
      sorter: (a, b) =>
        moment(a.subscriptionExpiry, "DD MMM YYYY").unix() -
        moment(b.subscriptionExpiry, "DD MMM YYYY").unix(),
      render: (v) => v || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      sorter: (a, b) => (a.isActive || "").localeCompare(b.isActive || ""),
      render: (v, record) => {
        const colors = {
          active: "bg-green-100 text-green-700",
          expired: "bg-yellow-100 text-yellow-700",
          suspended: "bg-red-100 text-red-700",
        };
        const now = moment();
        const expiryDate = record.rawExpiry ? moment(record.rawExpiry) : null;
        const isPastExpiry = expiryDate ? expiryDate.isBefore(now, "day") : false;
        const daysUntilExpiry = expiryDate ? expiryDate.diff(now, "days") : null;

        let statusText = v ? v.charAt(0).toUpperCase() + v.slice(1) : "Active";
        let colorClass = colors[v] || colors.active;

        if (v === "active" && isPastExpiry) {
          statusText = "Expired";
          colorClass = "bg-yellow-100 text-yellow-700";
        } else if (
          v === "active" &&
          daysUntilExpiry !== null &&
          daysUntilExpiry >= 0 &&
          daysUntilExpiry <= 7
        ) {
          statusText = `Expiring (${daysUntilExpiry}d)`;
          colorClass = "bg-amber-100 text-amber-700 font-semibold";
        }

        return (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <ActionButtons
            record={record}
            isEditLoading={loadingShopId === record._id}
            onEdit={(r) => setEditingShop(r)}
          />
          <button
            title="Receive Payment"
            onClick={() => setReceivePaymentShop(record)}
            className="p-2 rounded-full border border-gray-300 text-green-600 hover:bg-green-50 hover:text-green-500 transition cursor-pointer"
          >
            <Wallet size={16} />
          </button>
          <button
            title="Payment History"
            onClick={() => setPaymentHistoryShop(record)}
            className="p-2 rounded-full border border-gray-300 text-blue-600 hover:bg-blue-50 hover:text-blue-500 transition cursor-pointer"
          >
            <ScrollText size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3 px-1 py-2 border-b border-gray-200">
        <SectionHeading
          title="Shops"
          subtitle="Manage subscriptions, payments, and shop access"
        />
        <button
          onClick={() => {
            setEditingShop(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-sm font-medium transition cursor-pointer text-white shadow-sm"
        >
          <SquarePen size={16} />
          Add Shop
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-5">
        {statCards.map((card) => (
          <SummaryCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            count={card.count}
            color={card.color}
            isSelected={statusFilter === card.id}
            onClick={() =>
              setStatusFilter(
                statusFilter === card.id && card.id !== "all" ? "all" : card.id
              )
            }
          />
        ))}
      </div>

      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered.map((item, index) => ({ ...item, sr: index + 1 }))}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, owner, email, phone..."
        totalLabel="Total Shops"
      />

      <FullScreenModal
        open={showModal}
        onClose={closeModal}
        title={editingShop ? "Edit Shop" : "Create Shop & Owner"}
        subtitle={
          editingShop
            ? "Update shop details"
            : "Add a new owner account and shop"
        }
        showClose={false}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2 text-sm rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || isUpdating}
              onClick={(e) => handleSubmit(e)}
              className="px-5 py-2 text-sm bg-[var(--secondary-color)] text-white rounded-full hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {isPending || isUpdating
                ? editingShop
                  ? "Updating..."
                  : "Creating..."
                : editingShop
                  ? "Update"
                  : "Create"}
            </button>
          </div>
        }
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-3 px-2"
          noValidate
        >
          <div className="border-b border-gray-200 pb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
              Owner Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <CustomInput
                id="shopName"
                label="Shop Name"
                required
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                placeholder="My Tailor Shop"
                error={errors.shopName}
              />
              <CustomInput
                id="fullName"
                label="Full Name"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="John Doe"
                error={errors.fullName}
              />
              <CustomInput
                id="email"
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="owner@example.com"
                error={errors.email}
              />
              <CustomInput
                id="mobile"
                label="Mobile"
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="03XXXXXXXXX"
                maxLength={11}
                error={errors.mobile}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
              Shop Details
            </h3>
            {!editingShop && (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect
                id="subscriptionPlan"
                label="Subscription Plan"
                required
                value={form.subscriptionPlan}
                onChange={(val) => {
                  const expiry = getExpiryDate(
                    form.subscriptionStart,
                    val,
                    form.subscriptionDuration,
                  );
                  setForm({
                    ...form,
                    subscriptionPlan: val,
                    subscriptionAmount:
                      PLAN_PRICES[val] || form.subscriptionAmount,
                    subscriptionExpiry: expiry,
                  });
                }}
                options={[
                  { label: "Monthly", value: "monthly" },
                  { label: "Quarterly (3 Months)", value: "quarterly" },
                  { label: "Half Yearly (6 Months)", value: "half-yearly" },
                  { label: "Yearly (12 Months)", value: "yearly" },
                  { label: "Custom", value: "custom" },
                ]}
                allowClear={false}
              />
              {form.subscriptionPlan === "custom" ? (
                <CustomInput
                  id="subscriptionDuration"
                  label="Duration (Months)"
                  type="number"
                  required
                  value={form.subscriptionDuration}
                  onChange={(e) => {
                    const duration = e.target.value;
                    const expiry = getExpiryDate(
                      form.subscriptionStart,
                      "custom",
                      duration,
                    );
                    setForm({
                      ...form,
                      subscriptionDuration: duration,
                      subscriptionExpiry: expiry,
                    });
                  }}
                  placeholder="e.g. 5"
                />
              ) : (
                <CustomInput
                  id="subscriptionAmount"
                  label="Subscription Amount (Rs.)"
                  type="number"
                  required
                  value={form.subscriptionAmount}
                  onChange={(e) =>
                    setForm({ ...form, subscriptionAmount: e.target.value })
                  }
                  placeholder="1000"
                />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <CustomDatePicker
                id="subscriptionStart"
                label="Start Date"
                required
                value={
                  form.subscriptionStart ? dayjs(form.subscriptionStart) : null
                }
                onChange={(date) => {
                  const start = date ? date.format("YYYY-MM-DD") : "";
                  const expiry = getExpiryDate(
                    start,
                    form.subscriptionPlan,
                    form.subscriptionDuration,
                  );
                  setForm({
                    ...form,
                    subscriptionStart: start,
                    subscriptionExpiry: expiry,
                  });
                }}
              />
              <CustomDatePicker
                id="subscriptionExpiry"
                label="Expiry Date (Auto)"
                value={
                  form.subscriptionExpiry
                    ? dayjs(form.subscriptionExpiry)
                    : null
                }
                onChange={(date) => {
                  setForm({
                    ...form,
                    subscriptionExpiry: date ? date.format("YYYY-MM-DD") : "",
                  });
                }}
              />
            </div>
            </>
            )}
            {!editingShop && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <CustomInput
                id="amountReceived"
                label="Amount Received (Rs.)"
                type="number"
                value={form.amountReceived}
                onChange={(e) =>
                  setForm({ ...form, amountReceived: e.target.value })
                }
                placeholder="0"
              />
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Remaining (Rs.)
                </label>
                <div className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 bg-gray-50">
                  {Math.max(
                    0,
                    (Number(form.subscriptionAmount) || 0) -
                      (Number(form.amountReceived) || 0),
                  )}
                </div>
              </div>
            </div>
            )}
            <div className="mt-4">
              <CustomSelect
                id="isActive"
                label="Shop Status"
                value={form.isActive}
                onChange={(val) => setForm({ ...form, isActive: val })}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Expired", value: "expired" },
                  { label: "Suspended", value: "suspended" },
                ]}
                allowClear={false}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
              Shop Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomInput
                id="street"
                label="Street Address"
                value={form.address.street}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, street: e.target.value },
                  })
                }
                placeholder="Street address"
                error={errors.address}
              />
              <CustomInput
                id="city"
                label="City"
                required
                value={form.address.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, city: e.target.value },
                  })
                }
                placeholder="City"
                error={errors.city}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
              Shop Logo
            </h3>
            <div className="overflow-hidden rounded-xl">
              <CustomUpload
                value={logoFile ? URL.createObjectURL(logoFile) : null}
                onChange={(file) => setLogoFile(file)}
                previewHeight={120}
                label=""
                title="Upload Logo"
                description="JPEG, PNG, WebP, SVG (max 5MB)"
              />
            </div>
          </div>


        </form>
      </FullScreenModal>

      {receivePaymentShop && (
        <ReceivePaymentModal
          shop={receivePaymentShop}
          open={!!receivePaymentShop}
          onClose={() => setReceivePaymentShop(null)}
          onSubmit={(data) =>
            receivePayment({ shopId: receivePaymentShop._id, data })
          }
          isPending={isReceiving}
        />
      )}

      {paymentHistoryShop && (
        <PaymentHistoryModal
          shop={paymentHistoryShop}
          open={!!paymentHistoryShop}
          onClose={() => setPaymentHistoryShop(null)}
          data={paymentHistoryData}
          isLoading={isLoadingPayments}
        />
      )}
    </div>
  );
};

export default ShopPage;
