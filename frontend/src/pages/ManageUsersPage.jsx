import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Table, Input, Button, Space, Tag, Select } from "antd";
import { Search } from "lucide-react";

import SectionHeading from "../components/SectionHeading";

const ROLE_COLORS = {
  super_admin: "red",
  owner: "blue",
  staff: "green",
};

const ManageUsersPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const searchInput = useRef(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/auth/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to fetch users");

      setData(
        result.map((user, index) => ({
          key: user._id,
          _id: user._id,
          sr: index + 1,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          shop: user.shop?.name || "-",
          isActive: user.isActive,
        }))
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  };

  const handleReset = (clearFilters) => {
    clearFilters();
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
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      className: "font-semibold",
      width: "18%",
      ...getColumnSearchProps("fullName"),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: "22%",
      ...getColumnSearchProps("email"),
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
      width: "14%",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: "12%",
      render: (role) => (
        <Tag color={ROLE_COLORS[role] || "default"}>
          {role?.replace("_", " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Shop",
      dataIndex: "shop",
      key: "shop",
      width: "16%",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: "10%",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <SectionHeading
          title="Manage Users"
          subtitle="View all users across the platform"
        />

        <div className="flex items-center gap-2">
          <Select
            placeholder="Role"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => setRoleFilter(value || "")}
            options={[
              { label: "Super Admin", value: "super_admin" },
              { label: "Owner", value: "owner" },
              { label: "Staff", value: "staff" },
            ]}
          />
        </div>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default ManageUsersPage;
