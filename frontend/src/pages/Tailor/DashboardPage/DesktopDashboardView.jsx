import moment from "moment";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CalendarCheck,
} from "lucide-react";

import useTailorRecentOrders from "../../../hooks/useTailorRecentOrders";
import useTailorDashboardStats from "../../../hooks/useTailorDashboardStats";
import useTailorDashboardCharts from "../../../hooks/useTailorDashboardCharts";
import useTailorLatestCustomers from "../../../hooks/useTailorLatestCustomers";
import useTailorUpcomingDeliveries from "../../../hooks/useTailorUpcomingDeliveries";

import DesktopDashboardSkeleton from "./DesktopDashboardSkeleton";

import { useTheme } from "../../../context/ThemeContext";
// Imports End----

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
  />
);

const STATUS_COLORS = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ready:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const DesktopDashboardView = () => {
  const { isDarkMode } = useTheme();
  const { data: stats, isLoading: statsLoading } = useTailorDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useTailorDashboardCharts();
  const { data: recentOrders = [], isLoading: ordersLoading } =
    useTailorRecentOrders();
  const { data: upcomingDeliveries = [], isLoading: deliveriesLoading } =
    useTailorUpcomingDeliveries();
  const { data: latestCustomers = [], isLoading: customersLoading } =
    useTailorLatestCustomers();

  if (!stats && (statsLoading || chartsLoading)) {
    return <DesktopDashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400",
      trend: "+This month",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: Package,
      color:
        "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      trend: `${stats?.pendingOrders || 0} pending`,
    },
    {
      title: "Ready Orders",
      value: stats?.readyOrders || 0,
      icon: CheckCircle,
      color:
        "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
      trend: "Ready for delivery",
    },
    {
      title: "Overdue Orders",
      value: stats?.overdueOrders || 0,
      icon: AlertTriangle,
      color:
        "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
      trend: "Past delivery date",
    },
    {
      title: "Today's Deliveries",
      value: stats?.todayDeliveries || 0,
      icon: CalendarCheck,
      color: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
      trend: `${stats?.overdueOrders || 0} overdue`,
    },
  ];

  const orderStatusCards = [
    {
      title: "Pending",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      title: "In Progress",
      value: stats?.inProgressOrders || 0,
      icon: AlertTriangle,
      color: "text-blue-500",
    },
    {
      title: "Ready",
      value: stats?.readyOrders || 0,
      icon: CheckCircle,
      color: "text-purple-500",
    },
    {
      title: "Delivered",
      value: stats?.deliveredOrders || 0,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Cancelled",
      value: stats?.cancelledOrders || 0,
      icon: XCircle,
      color: "text-red-500",
    },
  ];

  const ordersChartOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      foreColor: isDarkMode ? "#a9a0c1" : "#374151",
      background: "transparent",
    },
    theme: { mode: isDarkMode ? "dark" : "light" },
    colors: ["#8143ec", "#10B981"],
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 4 },
    xaxis: {
      categories: charts?.ordersByMonth?.map((o) => o.month) || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: isDarkMode ? "#a9a0c1" : "#6b7280" } },
    },
    yaxis: {
      min: 0,
      labels: { style: { colors: isDarkMode ? "#a9a0c1" : "#6b7280" } },
    },
    grid: {
      borderColor: isDarkMode ? "#27223c" : "#F3F4F6",
      strokeDashArray: 4,
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: { colors: isDarkMode ? "#e0d7ff" : "#374151" },
    },
    tooltip: { theme: isDarkMode ? "dark" : "light" },
  };

  const statusPieOptions = {
    chart: {
      type: "donut",
      height: 280,
      fontFamily: "Outfit, sans-serif",
      foreColor: isDarkMode ? "#a9a0c1" : "#374151",
      background: "transparent",
    },
    theme: { mode: isDarkMode ? "dark" : "light" },
    colors: ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444"],
    labels: ["Pending", "In Progress", "Ready", "Delivered", "Cancelled"],
    plotOptions: { pie: { donut: { size: "70%" } } },
    legend: {
      position: "bottom",
      fontSize: "13px",
      labels: { colors: isDarkMode ? "#e0d7ff" : "#374151" },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: isDarkMode ? "dark" : "light" },
  };

  const statusPieSeries = [
    charts?.ordersByStatus?.pending || 0,
    charts?.ordersByStatus?.in_progress || 0,
    charts?.ordersByStatus?.ready || 0,
    charts?.ordersByStatus?.delivered || 0,
    charts?.ordersByStatus?.cancelled || 0,
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${card.color}`}
              >
                <card.icon className="size-5" />
              </div>
              <span className="text-xs whitespace-nowrap text-gray-400 dark:text-gray-500 font-medium">
                {card.trend}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold whitespace-nowrap text-gray-800 dark:text-gray-100 mt-1">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {orderStatusCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <card.icon className={`size-8 shrink-0 ${card.color}`} />
            <div className="min-w-0">
              <p className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {card.title}
              </p>
              <p className="text-xl font-bold whitespace-nowrap text-gray-800 dark:text-gray-100">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Monthly Orders
          </h3>
          <Chart
            options={ordersChartOptions}
            series={[
              {
                name: "Orders",
                data: charts?.ordersByMonth?.map((o) => o.count) || [],
              },
            ]}
            type="line"
            height={350}
          />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Orders by Status
          </h3>
          <Chart
            options={statusPieOptions}
            series={statusPieSeries}
            type="donut"
            height={280}
          />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Recent Orders
            </h3>
            <Link
              to="/orders"
              className="text-sm text-blue-600 dark:text-purple-400 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 dark:border-gray-800"
                    >
                      <td className="px-5 py-3">
                        <Skeleton className="w-20 h-4" />
                      </td>
                      <td className="px-5 py-3">
                        <Skeleton className="w-24 h-4" />
                      </td>
                      <td className="px-5 py-3">
                        <Skeleton className="w-16 h-4" />
                      </td>
                      <td className="px-5 py-3">
                        <Skeleton className="w-14 h-5 rounded-full" />
                      </td>
                    </tr>
                  ))
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-5 py-8 text-center text-gray-400 dark:text-gray-500"
                    >
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {order.customer?.name || "N/A"}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        Rs. {order.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                        >
                          {order.status?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Upcoming Deliveries
            </h3>
            <Link
              to="/orders"
              className="text-sm text-blue-600 dark:text-purple-400 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Delivery</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveriesLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 dark:border-gray-800"
                    >
                      <td className="px-5 py-3">
                        <Skeleton className="w-20 h-4" />
                      </td>
                      <td className="px-5 py-3">
                        <Skeleton className="w-24 h-4" />
                      </td>
                      <td className="px-5 py-3">
                        <Skeleton className="w-20 h-4" />
                      </td>
                      <td className="px-5 py-3">
                        <Skeleton className="w-14 h-5 rounded-full" />
                      </td>
                    </tr>
                  ))
                ) : upcomingDeliveries.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-5 py-8 text-center text-gray-400 dark:text-gray-500"
                    >
                      No upcoming deliveries
                    </td>
                  </tr>
                ) : (
                  upcomingDeliveries.map((order) => {
                    const deliveryDate = moment(order.deliveryDate);
                    const isOverdue = deliveryDate.isBefore(moment());
                    return (
                      <tr
                        key={order._id}
                        className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                          {order.customer?.name || "N/A"}
                        </td>
                        <td
                          className={`px-5 py-3 font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}
                        >
                          {deliveryDate.format("DD MMM YYYY")}
                          {isOverdue && (
                            <span className="ml-1 text-xs text-red-500 dark:text-red-400">
                              (overdue)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                          >
                            {order.status?.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Latest Customers */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Latest Customers
          </h3>
          <Link
            to="/customers"
            className="text-sm text-blue-600 dark:text-purple-400 hover:text-blue-700 font-medium"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Added</th>
              </tr>
            </thead>
            <tbody>
              {customersLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 dark:border-gray-800"
                  >
                    <td className="px-5 py-3">
                      <Skeleton className="w-16 h-4" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="w-24 h-4" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="w-20 h-4" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="w-20 h-4" />
                    </td>
                  </tr>
                ))
              ) : latestCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-5 py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    No customers yet
                  </td>
                </tr>
              ) : (
                latestCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {customer.customerId}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {customer.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                      {customer.phone}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                      {moment(customer.createdAt).format("DD MMM YYYY")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DesktopDashboardView;
