import moment from "moment";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Space, Tag, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import { Search, Pencil, Trash, Plus, Power, PowerOff } from "lucide-react";

import SectionHeading from "../components/SectionHeading";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const PLAN_COLORS = {
  free: "default",
  basic: "blue",
  premium: "green",
  enterprise: "purple",
};

const ShopListingPage = () => {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const searchInput = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchShops = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (planFilter) params.append("plan", planFilter);

      const res = await fetch(`/api/shops/all?${params.toString()}`, {
        credentials: "include",
      });
      const result = await res.json();

      setData(
        result.shops.map((shop, index) => ({
          key: shop._id,
          _id: shop._id,
          sr: index + 1,
          name: shop.name,
          email: shop.email,
          phone: shop.phone,
          owner: shop.owner?.fullName || "N/A",
          ownerEmail: shop.owner?.email || "N/A",
          subscriptionPlan: shop.subscriptionPlan,
          subscriptionAmount: shop.subscriptionAmount || 0,
          isActive: shop.isActive,
          city: shop.address?.city || "-",
          createdAt: moment(shop.createdAt).format("DD MMM YYYY"),
        }))
      );
    } catch (err) {
      toast.error("Failed to fetch shops");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [statusFilter, planFilter]);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/shops/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete shop");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Shop deleted successfully");
      fetchShops();
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/shops/${id}/toggle-status`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle status");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message);
      fetchShops();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<Search size={14} />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button type="link" size="small" onClick={() => close()}>
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <Search
        className="w-4 h-4"
        style={{ color: filtered ? "#1677ff" : undefined }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      key: "sr",
      width: "5%",
    },
    {
      title: "Shop Name",
      dataIndex: "name",
      key: "name",
      className: "font-semibold",
      width: "18%",
      ...getColumnSearchProps("name"),
    },
    {
      title: "Owner",
      dataIndex: "owner",
      key: "owner",
      width: "14%",
      ...getColumnSearchProps("owner"),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: "18%",
      ...getColumnSearchProps("email"),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: "12%",
      ...getColumnSearchProps("phone"),
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      width: "10%",
    },
    {
      title: "Plan",
      dataIndex: "subscriptionPlan",
      key: "subscriptionPlan",
      width: "8%",
      render: (plan) => (
        <Tag color={PLAN_COLORS[plan] || "default"}>
          {plan?.toUpperCase() || "FREE"}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "subscriptionAmount",
      key: "subscriptionAmount",
      width: "8%",
      render: (amount) => `Rs. ${amount.toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: "8%",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "15%",
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button
            size="small"
            onClick={() => navigate(`/admin/shops/edit/${record._id}`)}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="small"
            onClick={() => toggleStatusMutation.mutate(record._id)}
            title={record.isActive ? "Deactivate" : "Activate"}
          >
            {record.isActive ? (
              <PowerOff className="w-4 h-4 text-red-500" />
            ) : (
              <Power className="w-4 h-4 text-green-500" />
            )}
          </Button>
          <Button
            size="small"
            danger
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete "${record.name}"? This action cannot be undone.`
                )
              ) {
                deleteMutation.mutate(record._id);
              }
            }}
            title="Delete"
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <SectionHeading
          title="Shops"
          subtitle="Manage all tailor shops"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setStatusFilter(value || "")}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
          <Select
            placeholder="Plan"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setPlanFilter(value || "")}
            options={[
              { label: "Free", value: "free" },
              { label: "Basic", value: "basic" },
              { label: "Premium", value: "premium" },
              { label: "Enterprise", value: "enterprise" },
            ]}
          />
          <button
            onClick={() => navigate("/admin/shops/create")}
            className="inline-flex items-center gap-2 px-5 py-2 rounded bg-black hover:bg-neutral-900 text-sm transition cursor-pointer text-white"
          >
            <Plus size={18} />
            Create Shop
          </button>
        </div>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} shops` }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default ShopListingPage;
