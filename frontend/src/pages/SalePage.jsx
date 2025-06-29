import dayjs from "dayjs";
import moment from "moment";
import { useState } from "react";
import toast from "react-hot-toast";
import { DatePicker, Button } from "antd";
import { useQuery } from "@tanstack/react-query";

import SectionHeading from "../components/SectionHeading";

const SalePage = () => {
  const { RangePicker } = DatePicker;
  const [dates, setDates] = useState([dayjs(), dayjs()]);
  const [enabled, setEnabled] = useState(false);

  const from = dates?.[0] ? dates[0].format("YYYY-MM-DD") : null;
  const to = dates?.[1] ? dates[1].format("YYYY-MM-DD") : null;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sales", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/orders/sales?from=${from}&to=${to}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sales");
      return res.json();
    },
    enabled: !!(enabled && from && to),
    onError: () => toast.error("Failed to fetch sales data"),
  });

  const handleFetch = () => {
    if (!dates.length) return toast.error("Please select a date range");
    setEnabled(true);
    refetch();
  };

  return (
    <>
      <SectionHeading
        title="Sale Report"
        subtitle="View and track all sale orders and their status below"
      />
      <p className="text-sm text-gray-600 mb-2 mt-10">
        Select a date range to generate the sale report.
      </p>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="w-full max-w-xs sm:max-w-96">
          <RangePicker
            value={dates}
            allowClear
            format="DD MMM YYYY"
            onChange={(val) => {
              setDates(val);
              if (!val || val.length === 0) setEnabled(false);
            }}
            className="w-full"
          />
        </div>

        <Button
          type="primary"
          onClick={handleFetch}
          loading={isLoading}
          className="w-full sm:w-fit"
          style={{
            backgroundColor: "#000",
            borderColor: "#000",
          }}
        >
          Get Sales
        </Button>
      </div>

      {data && (
        <div className="overflow-x-auto rounded-xl shadow bg-white text-nowrap">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-2 sm:px-6 py-4 text-left">From</th>
                <th className="px-2 sm:px-6 py-4 text-left">To</th>
                <th className="px-2 sm:px-6 py-4 text-left">Total Sale</th>
                <th className="px-2 sm:px-6 py-4 text-left">Total Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50 transition-all duration-200">
                <td className="px-6 sm:px-10 py-4 font-medium text-gray-800">
                  {moment(from).format("DD MMM, YYYY")}
                </td>
                <td className="px-2 sm:px-6 py-4 truncate max-w-xs">
                  {moment(to).format("DD MMM, YYYY")}
                </td>
                <td className="px-2 sm:px-6 py-4 truncate max-w-xs">
                  Rs. {data.totalAmount.toLocaleString()}
                </td>
                <td className="px-2 sm:px-6 py-4 truncate max-w-xs">
                  {data.totalOrders.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default SalePage;
