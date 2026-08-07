import dayjs from "dayjs";
import moment from "moment";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { SquarePen, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import CustomTable from "../../components/CustomTable";
import CustomInput from "../../components/CustomInput";
import useGetAllShops from "../../hooks/useGetAllShops";
import CustomSelect from "../../components/CustomSelect";
import CustomUpload from "../../components/CustomUpload";
import useGlobalFilter from "../../hooks/useGlobalFilter";
import SectionHeading from "../../components/SectionHeading";
import CustomDatePicker from "../../components/CustomDatePicker";
import ActionButtons from "../../components/ActionButtons";
import FullScreenModal from "../../components/FullScreenModal";

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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [editingShop, setEditingShop] = useState(null);
  const [loadingShopId, setLoadingShopId] = useState(null);
  const formRef = useRef(null);

  const queryClient = useQueryClient();
  const { data: shops = [], isLoading } = useGetAllShops();

  const filtered = useGlobalFilter(shops, search, [
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
      updateShop({ id: editingShop._id, data: { ...form, logo: logoFile } });
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
    { title: "Sr.", key: "sr", width: 60, render: (_, __, index) => index + 1 },
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
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => a.phone.localeCompare(b.phone),
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
      title: "Amount",
      dataIndex: "subscriptionAmount",
      key: "subscriptionAmount",
      sorter: (a, b) => a.subscriptionAmount - b.subscriptionAmount,
      render: (v) => `Rs. ${v.toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      sorter: (a, b) => (a.isActive || "").localeCompare(b.isActive || ""),
      render: (v) => {
        const colors = {
          active: "bg-green-100 text-green-700",
          expired: "bg-yellow-100 text-yellow-700",
          suspended: "bg-red-100 text-red-700",
        };
        return (
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[v] || colors.active}`}>
            {v ? v.charAt(0).toUpperCase() + v.slice(1) : "Active"}
          </span>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        moment(a.createdAt, "DD MMM YYYY").unix() -
        moment(b.createdAt, "DD MMM YYYY").unix(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <ActionButtons
          record={record}
          isEditLoading={loadingShopId === record._id}
          onEdit={(r) => setEditingShop(r)}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <SectionHeading
          title="Shops"
          subtitle="All tailor shops on the platform"
        />
        <button
          onClick={() => {
            setEditingShop(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black hover:bg-neutral-900 text-sm transition cursor-pointer text-white"
        >
          <SquarePen size={16} />
          Add Shop
        </button>
      </div>

      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, owner, email, phone..."
        totalLabel="Total Shops"
      />

      <FullScreenModal
        open={showModal}
        onClose={closeModal}
        title={editingShop ? "Edit Shop" : "Create Shop & Owner"}
        subtitle={editingShop ? "Update shop details" : "Add a new owner account and shop"}
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
              {isPending || isUpdating ? (editingShop ? "Updating..." : "Creating...") : (editingShop ? "Update" : "Create")}
            </button>
          </div>
        }
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-4 px-6"
          noValidate
        >
          <div className="border-b pb-4 mb-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
              Owner Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
              Shop Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomInput
                id="shopName"
                label="Shop Name"
                required
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                placeholder="My Tailor Shop"
                error={errors.shopName}
              />
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {form.subscriptionPlan === "custom" && (
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
              )}
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
              Shop Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
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

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
              Notes
            </h3>
            <CustomInput
              id="notes"
              label="Notes"
              type="textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes (optional)"
              rows={3}
            />
          </div>
        </form>
      </FullScreenModal>
    </div>
  );
};

export default ShopPage;
