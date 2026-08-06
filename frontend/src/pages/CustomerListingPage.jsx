import { useState } from "react";
import moment from "moment";
import { Table, Input, Button, Space } from "antd";
import { Search, Pencil, Trash, Plus, Redo, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useGetAllCustomers from "../hooks/useGetAllCustomers";
import SectionHeading from "../components/SectionHeading";
import CustomerFormModal from "../components/CustomerFormModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

const CustomerListingPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });

  const navigate = useNavigate();

  const { data, isLoading } = useGetAllCustomers({ page, limit: pageSize, search });

  const customers = data?.customers || [];
  const pagination = data?.pagination || {};

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const openEdit = (customer) => {
    setEditCustomer(customer);
    setFormModalOpen(true);
  };

  const openCreate = () => {
    setEditCustomer(null);
    setFormModalOpen(true);
  };

  const columns = [
    {
      title: "Sr.",
      key: "sr",
      width: 60,
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "ID",
      dataIndex: "customerId",
      key: "customerId",
      width: 100,
      render: (text) => <span className="font-mono text-xs text-gray-500">{text}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium text-gray-900">{text}</span>,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: "City",
      key: "city",
      render: (_, r) => r.address?.city || <span className="text-gray-400">-</span>,
    },
    {
      title: "Measurement",
      key: "measurement",
      width: 120,
      render: (_, record) =>
        record.measurement ? (
          <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
            Added
          </span>
        ) : (
          <span className="inline-block rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-xs font-medium">
            None
          </span>
        ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (text) => moment(text).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-1 flex-wrap">
          <Button size="small" onClick={() => openEdit(record)} title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          {!record.measurement && (
            <button
              onClick={() => navigate(`/measurements/add/${record._id}`)}
              className="flex items-center gap-1 border border-gray-300 px-2 py-1 rounded text-xs transition-colors hover:text-orange-600 hover:border-orange-500 cursor-pointer"
              title="Add Measurement"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          )}

          {record.measurement && (
            <>
              <Button
                size="small"
                onClick={() => navigate(`/measurements/edit/${record._id}`)}
                title="Edit Measurement"
              >
                <Redo className="w-3.5 h-3.5 text-yellow-600" />
              </Button>
              <Button
                size="small"
                onClick={() => navigate(`/measurements/${record._id}`)}
                title="View Measurement"
              >
                <Eye className="w-3.5 h-3.5 text-gray-600" />
              </Button>
            </>
          )}

          <button
            onClick={() =>
              setDeleteModal({ open: true, id: record._id, name: record.name })
            }
            className="p-1.5 border border-gray-300 rounded hover:text-red-600 hover:border-red-500 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <SectionHeading
          title="Customers"
          subtitle="Manage all your customers"
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Input
              placeholder="Search name, phone, ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 220 }}
              suffix={<Search className="size-4 text-gray-400" />}
            />
            <Button onClick={handleSearch} className="ml-1">
              Search
            </Button>
            {search && (
              <Button onClick={handleReset} type="link">
                Reset
              </Button>
            )}
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={customers}
        scroll={{ x: true }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: pagination.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total) => `Total ${total} customers`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      {/* Modals */}
      <CustomerFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditCustomer(null);
        }}
        editCustomer={editCustomer}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
        customerId={deleteModal.id}
        customerName={deleteModal.name}
      />
    </div>
  );
};

export default CustomerListingPage;
