import moment from "moment";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Highlighter from "react-highlight-words";
import { Table, Input, Button, Space } from "antd";
import { Pencil, Redo, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import CustomButton from "../components/CustomButton";
import SectionHeading from "../components/SectionHeading";
// Imports End

const ExpensesListingPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch("/api/expenses/all");
        const result = await res.json();

        const mapped = result.map((item) => ({
          key: item._id,
          rawMonth: item.month,
          month: moment(item.month, "YYYY-MM").format("MMMM YYYY"),
          salaries: item.salaries || 0,
          rent: item.rent || 0,
          electricity: item.electricity || 0,
          food: item.food || 0,
          maintenance: item.maintenance || 0,
          other: item.other || 0,
          totalAmount: item.totalAmount,
        }));

        const sorted = mapped.sort(
          (a, b) => new Date(b.rawMonth) - new Date(a.rawMonth)
        );

        setData(sorted);
      } catch (err) {
        toast.error("Failed to fetch expenses");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Search helpers
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
      <Search style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
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

  const columns = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      ...getColumnSearchProps("month"),
    },
    {
      title: "Salaries",
      dataIndex: "salaries",
      key: "salaries",
      render: (val) => `Rs. ${val.toLocaleString()}`,
    },
    {
      title: "Rent",
      dataIndex: "rent",
      key: "rent",
      render: (val) => `Rs. ${val.toLocaleString()}`,
    },
    {
      title: "Electricity",
      dataIndex: "electricity",
      key: "electricity",
      render: (val) => `Rs. ${val.toLocaleString()}`,
      //   sorter: (a, b) => a.electricity - b.electricity,
    },
    {
      title: "Food",
      dataIndex: "food",
      key: "food",
      render: (val) => `Rs. ${val.toLocaleString()}`,
    },
    {
      title: "Maintenance",
      dataIndex: "maintenance",
      key: "maintenance",
      render: (val) => `Rs. ${val.toLocaleString()}`,
    },
    {
      title: "Other",
      dataIndex: "other",
      key: "other",
      render: (val) => `Rs. ${val.toLocaleString()}`,
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (val) => `Rs. ${val.toLocaleString()}`,
    },

    {
      title: "Action",
      key: "action",

      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/expenses/edit/${record.key}`)}
            className="flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeading
          title="Expenses Overview"
          subtitle="View, edit, and organize your monthly expense records"
        />

        <CustomButton title="Add New Expense" to="/expenses/add" Icon={Redo} />
      </div>
      <div>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 12 }}
          scroll={{ x: true }}
        />
      </div>
    </>
  );
};

export default ExpensesListingPage;
