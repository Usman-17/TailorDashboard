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
        <RangePicker
          value={dates}
          className="w-full sm:w-auto"
          allowClear
          format="DD MMM YYYY"
          onChange={(val) => {
            setDates(val);
            if (!val || val.length === 0) setEnabled(false);
          }}
        />

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
        <div className="rounded-md px-4 py-3 space-y-3 text-[15px] leading-6">
          <div className="text-gray-700 text-sm mb-5">
            <span className="font-medium">From:</span>{" "}
            <b>{moment(from).format("DD MMM, YYYY")}</b>{" "}
            <span className="mx-2">→</span>
            <span className="font-medium">To:</span>{" "}
            <b>{moment(to).format("DD MMM, YYYY")}</b>
          </div>

          <div className="mt-5">
            <span className="text-gray-600">💰 Total Sales:</span>{" "}
            <b className="text-green-600">Rs. {data.totalAmount}</b>
          </div>
          <div>
            <span className="text-gray-600">📦 Total Orders:</span>{" "}
            <b>{data.totalOrders}</b>
          </div>
        </div>
      )}
    </>
  );
};

export default SalePage;
