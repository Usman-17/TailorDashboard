import { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import CustomModal from "../../components/CustomModal";
import CustomTable from "../../components/CustomTable";
import CustomInput from "../../components/CustomInput";
import SectionHeading from "../../components/SectionHeading";

import useGlobalFilter from "../../hooks/useGlobalFilter";
import useGetAllUsers from "../../hooks/useGetAllUsers";
// Imports End-----

const ROLE_BADGE = {
  super_admin: "bg-red-100 text-red-700",
  owner: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700",
};

const ManageUsersPage = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const { data: users = [], isLoading } = useGetAllUsers();

  const { mutate: createSuperAdmin, isPending: submitting } = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/auth/create-super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to create Super Admin");
      return result;
    },
    onSuccess: () => {
      toast.success("Super Admin created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseModal();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, isActive }) => {
      setUpdatingId(id);
      const res = await fetch(`/api/auth/admin/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update status");
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.message || "Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUpdatingId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setUpdatingId(null);
    },
  });

  const filtered = useGlobalFilter(users, search, [
    "fullName",
    "email",
    "mobile",
    "shop",
  ]);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email format";
    if (!form.mobile.trim()) errs.mobile = "Mobile is required";
    else if (form.mobile.length !== 11) errs.mobile = "Must be 11 digits";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Min 8 characters";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm({
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    createSuperAdmin({
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      password: form.password,
    });
  };

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
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => (a.fullName || "").localeCompare(b.fullName || ""),
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      render: (v) => <span className="text-gray-600">{v}</span>,
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
      sorter: (a, b) => (a.mobile || "").localeCompare(b.mobile || ""),
      render: (v) => <span className="text-gray-600">{v}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: (a, b) => (a.role || "").localeCompare(b.role || ""),
      render: (v) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
            ROLE_BADGE[v] || "bg-gray-100 text-gray-600"
          }`}
        >
          {v ? v.replace("_", " ") : "-"}
        </span>
      ),
    },
    {
      title: "Shop",
      dataIndex: "shop",
      key: "shop",
      sorter: (a, b) => (a.shop || "").localeCompare(b.shop || ""),
      render: (v) => <span className="text-gray-600">{v}</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      sorter: (a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1),
      render: (v, record) => {
        const isUpdatingThis = updatingId === record._id;
        return (
          <button
            type="button"
            disabled={isUpdatingThis}
            onClick={(e) => {
              e.stopPropagation();
              updateStatus({ id: record._id, isActive: !v });
            }}
            title={`Click to toggle status (${v ? "Active" : "Inactive"})`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 border ${
              v
                ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
            } ${isUpdatingThis ? "opacity-50 cursor-wait" : ""}`}
          >
            <span
              className={`size-1.5 rounded-full ${
                v ? "bg-green-600 animate-pulse" : "bg-red-600"
              }`}
            />
            {isUpdatingThis ? "Updating..." : v ? "Active" : "Inactive"}
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <SectionHeading
          title="Manage Users"
          subtitle="View all users across the platform"
        />

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-sm font-medium transition cursor-pointer text-white shadow-sm shrink-0"
        >
          <UserPlus size={16} />
          Create Super Admin
        </button>
      </div>

      <CustomTable
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={filtered.map((item, index) => ({
          ...item,
          sr: index + 1,
        }))}
        globalSearch={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, mobile..."
        totalLabel="Total Users"
      />

      {/* Create Super Admin Popup Modal */}
      <CustomModal isOpen={isModalOpen} className="w-[95%] max-w-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Create Super Admin
            </h3>
            <p className="text-xs text-gray-500">
              Add a new super admin account
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomInput
              id="fullName"
              label="Full Name"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="e.g. John Doe"
              error={errors.fullName}
            />

            <CustomInput
              id="email"
              label="Email Address"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
              error={errors.email}
            />

            <div className="sm:col-span-2">
              <CustomInput
                id="mobile"
                label="Mobile Number"
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="03XXXXXXXXX"
                maxLength={11}
                error={errors.mobile}
              />
            </div>

            <CustomInput
              id="password"
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 characters"
              error={errors.password}
            />

            <CustomInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              placeholder="Re-enter password"
              error={errors.confirmPassword}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-5 py-2 text-sm rounded-full text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
};

export default ManageUsersPage;
