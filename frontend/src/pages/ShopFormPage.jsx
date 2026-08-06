import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader, ArrowLeft } from "lucide-react";
import SectionHeading from "../components/SectionHeading";

const ShopFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    mobile: "",
    shopName: "",
    shopPhone: "",
    shopEmail: "",
    subscriptionPlan: "free",
    subscriptionAmount: 0,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    subscriptionPlan: "free",
    subscriptionAmount: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  const { data: shopData, isLoading: shopLoading } = useQuery({
    queryKey: ["shop", id],
    queryFn: async () => {
      const res = await fetch(`/api/shops/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch shop");
      return res.json();
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (shopData && isEdit) {
      setEditForm({
        name: shopData.name || "",
        phone: shopData.phone || "",
        email: shopData.email || "",
        street: shopData.address?.street || "",
        city: shopData.address?.city || "",
        state: shopData.address?.state || "",
        postalCode: shopData.address?.postalCode || "",
        subscriptionPlan: shopData.subscriptionPlan || "free",
        subscriptionAmount: shopData.subscriptionAmount || 0,
        isActive: shopData.isActive ?? true,
      });
    }
  }, [shopData, isEdit]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/shops/create-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          subscriptionPlan: form.subscriptionPlan,
          subscriptionAmount: Number(form.subscriptionAmount),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create shop");
      return result;
    },
    onSuccess: () => {
      toast.success("Shop and owner created successfully");
      navigate("/admin/shops");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`/api/shops/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
          },
          subscriptionPlan: data.subscriptionPlan,
          subscriptionAmount: Number(data.subscriptionAmount),
          isActive: data.isActive,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update shop");
      return result;
    },
    onSuccess: () => {
      toast.success("Shop updated successfully");
      navigate("/admin/shops");
    },
    onError: (error) => toast.error(error.message),
  });

  const validateCreate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!form.mobile.trim()) newErrors.mobile = "Mobile is required";
    else if (form.mobile.length !== 11)
      newErrors.mobile = "Mobile must be 11 digits";
    if (!form.shopName.trim()) newErrors.shopName = "Shop name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEdit = () => {
    const newErrors = {};
    if (!editForm.name.trim()) newErrors.name = "Shop name is required";
    if (!editForm.phone.trim()) newErrors.phone = "Phone is required";
    if (!editForm.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email))
      newErrors.email = "Invalid email format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!validateCreate()) return;
    createMutation.mutate(form);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateEdit()) return;
    updateMutation.mutate(editForm);
  };

  const inputClass = (field) =>
    `w-full border px-3 py-2 rounded text-black ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  if (isEdit && shopLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/admin/shops")}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Shops
      </button>

      <SectionHeading
        title={isEdit ? "Edit Shop" : "Create Shop & Owner"}
        subtitle={
          isEdit
            ? "Update shop details"
            : "Create a new owner account and shop"
        }
      />

      {isEdit ? (
        <form onSubmit={handleEditSubmit} className="mt-6 grid gap-4 bg-white p-6 rounded-lg border" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shop Name *</label>
              <input
                type="text"
                className={inputClass("name")}
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input
                type="text"
                className={inputClass("phone")}
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              className={inputClass("email")}
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Street</label>
              <input
                type="text"
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={editForm.street}
                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal Code</label>
              <input
                type="text"
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={editForm.postalCode}
                onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Plan</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={editForm.subscriptionPlan}
                onChange={(e) => setEditForm({ ...editForm, subscriptionPlan: e.target.value })}
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Amount (Rs.)</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={editForm.subscriptionAmount}
                onChange={(e) => setEditForm({ ...editForm, subscriptionAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={editForm.isActive ? "active" : "inactive"}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "active" })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-900 transition cursor-pointer disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/shops")}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCreateSubmit} className="mt-6 grid gap-4 bg-white p-6 rounded-lg border" noValidate>
          {/* Owner Section */}
          <div className="border-b pb-4 mb-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Owner Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  className={inputClass("fullName")}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  className={inputClass("email")}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="owner@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  className={inputClass("password")}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile *</label>
                <input
                  type="text"
                  className={inputClass("mobile")}
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="03XXXXXXXXX"
                  maxLength={11}
                />
                {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
              </div>
            </div>
          </div>

          {/* Shop Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Shop Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Shop Name *</label>
                <input
                  type="text"
                  className={inputClass("shopName")}
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  placeholder="My Tailor Shop"
                />
                {errors.shopName && <p className="text-red-500 text-xs mt-1">{errors.shopName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shop Phone</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                  value={form.shopPhone}
                  onChange={(e) => setForm({ ...form, shopPhone: e.target.value })}
                  placeholder="Defaults to owner mobile"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Shop Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                value={form.shopEmail}
                onChange={(e) => setForm({ ...form, shopEmail: e.target.value })}
                placeholder="Defaults to owner-email-shop@tailor.local"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                  value={form.subscriptionPlan}
                  onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subscription Amount (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 px-3 py-2 rounded text-black"
                  value={form.subscriptionAmount}
                  onChange={(e) => setForm({ ...form, subscriptionAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-900 transition cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Shop & Owner"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/shops")}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShopFormPage;
