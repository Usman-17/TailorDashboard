import moment from "moment";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Highlighter from "react-highlight-words";
import { Table, Input, Button, Space } from "antd";
import { useEffect, useRef, useState } from "react";
import { Search, Pencil, Redo, Trash } from "lucide-react";

import CustomButton from "../components/CustomButton";
import SectionHeading from "../components/SectionHeading";
import { useMutation } from "@tanstack/react-query";
// Imports End

const CustomerListingPage = () => {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [loading, setLoading] = useState(true);
  const searchInput = useRef(null);
  const navigate = useNavigate();

  // Fetch all customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers/all", {
          credentials: "include",
        });
        const result = await res.json();

        setData(
          result.map((customer, index) => ({
            key: customer._id,
            _id: customer._id,
            sr: index + 1,
            name: customer.name,
            phone: customer.phone,
            createdAt: moment(customer.createdAt).format("DD MMM YYYY"),
          }))
        );
      } catch (err) {
        toast.error("Failed to fetch customers");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Delete customers mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete customers");
      return res.json();
    },

    onSuccess: (_, id) => {
      toast.success("Customers deleted successfully");
      setData((prev) => prev.filter((item) => item._id !== id));
    },
    onError: () => toast.error("Failed to delete customers"),
  });

  // Search filter functions
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
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
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
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  // Table columns
  const columns = [
    {
      title: "Sr.",
      dataIndex: "sr",
      key: "sr",
      width: "5%",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      className: "font-semibold text-md",
      width: "30%",
      ...getColumnSearchProps("name"),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: "25%",
      ...getColumnSearchProps("phone"),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "20%",
    },
    {
      title: "Action",
      key: "action",
      width: "20%",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/customer/edit/${record.key}`)}
            className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>

          {/* Add Measurements */}
          <Button
            onClick={() => navigate(`/measurements/add/${record.key}`)}
            className="flex items-center gap-1 text-green-600 hover:underline cursor-pointer"
          >
            <Redo className="w-4 h-4" />
            Add Measurements
          </Button>

          <button
            onClick={() => navigate(`/measurements/edit/${record.key}`)}
            className="flex items-center gap-1 hover:text-red-600 hover:underline cursor-pointer border border-gray-300 p-1 px-3 rounded hover:border-red-500 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Measurements
          </button>

          <button
            onClick={() => deleteMutation.mutate(record._id)}
            className="flex items-center gap-1 hover:text-red-600 hover:underline cursor-pointer border border-gray-300 p-1 px-3 rounded hover:border-red-500 transition-colors"
          >
            <Trash className="w-4 h-4" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title="Customers"
          subtitle="Search and manage customers below"
        />

        <div className="sm:w-auto w-full">
          <CustomButton
            title="Add New Customer"
            to="/customer/add"
            Icon={Redo}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 8 }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default CustomerListingPage;
