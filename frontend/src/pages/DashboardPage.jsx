import {
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  IndianRupee,
  CalendarCheck,
  Banknote,
} from "lucide-react";
import Chart from "react-apexcharts";
import moment from "moment";

import useDashboardStats from "../hooks/useDashboardStats";
import useDashboardCharts from "../hooks/useDashboardCharts";
import useDashboardRecentOrders from "../hooks/useDashboardRecentOrders";
import useDashboardUpcomingDeliveries from "../hooks/useDashboardUpcomingDeliveries";
import useDashboardLatestCustomers from "../hooks/useDashboardLatestCustomers";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTheme } from "../context/ThemeContext";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ready: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const DashboardPage = () => {
  const { isDarkMode } = useTheme();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();
  const { data: recentOrders = [], isLoading: ordersLoading } = useDashboardRecentOrders();
  const { data: upcomingDeliveries = [], isLoading: deliveriesLoading } = useDashboardUpcomingDeliveries();
  const { data: latestCustomers = [], isLoading: customersLoading } = useDashboardLatestCustomers();

  if (statsLoading || chartsLoading) return <LoadingSpinner />;

  const statCards = [
    { title: "Total Customers", value: stats?.totalCustomers || 0, icon: Users, color: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400", trend: "+This month" },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: Package, color: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", trend: `${stats?.pendingOrders || 0} pending` },
    { title: "Monthly Revenue", value: `Rs. ${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400", trend: `Exp: Rs. ${(stats?.monthlyExpenses || 0).toLocaleString()}` },
    { title: "Net Profit", value: `Rs. ${(stats?.netProfit || 0).toLocaleString()}`, icon: Banknote, color: "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400", trend: "This month" },
    { title: "Today's Deliveries", value: stats?.todayDeliveries || 0, icon: CalendarCheck, color: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400", trend: `${stats?.overdueOrders || 0} overdue` },
  ];

  const orderStatusCards = [
    { title: "Pending", value: stats?.pendingOrders || 0, icon: Clock, color: "text-amber-500" },
    { title: "In Progress", value: stats?.inProgressOrders || 0, icon: AlertTriangle, color: "text-blue-500" },
    { title: "Ready", value: stats?.readyOrders || 0, icon: CheckCircle, color: "text-purple-500" },
    { title: "Delivered", value: stats?.deliveredOrders || 0, icon: CheckCircle, color: "text-green-500" },
    { title: "Cancelled", value: stats?.cancelledOrders || 0, icon: XCircle, color: "text-red-500" },
  ];

  const revenueChartOptions = {
    chart: { type: "bar", height: 350, toolbar: { show: false }, fontFamily: "Outfit, sans-serif", foreColor: isDarkMode ? "#a9a0c1" : "#374151", background: "transparent" },
    theme: { mode: isDarkMode ? "dark" : "light" },
    colors: ["#8143ec"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    xaxis: { categories: charts?.revenueByMonth?.map((r) => r.month) || [], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: isDarkMode ? "#a9a0c1" : "#6b7280" } } },
    yaxis: { labels: { formatter: (val) => `Rs. ${(val / 1000).toFixed(0)}k`, style: { colors: isDarkMode ? "#a9a0c1" : "#6b7280" } } },
    grid: { borderColor: isDarkMode ? "#27223c" : "#F3F4F6", strokeDashArray: 4 },
    tooltip: { theme: isDarkMode ? "dark" : "light", y: { formatter: (val) => `Rs. ${val.toLocaleString()}` } },
  };

  const ordersChartOptions = {
    chart: { type: "line", height: 350, toolbar: { show: false }, fontFamily: "Outfit, sans-serif", foreColor: isDarkMode ? "#a9a0c1" : "#374151", background: "transparent" },
    theme: { mode: isDarkMode ? "dark" : "light" },
    colors: ["#8143ec", "#10B981"],
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 4 },
    xaxis: { categories: charts?.ordersByMonth?.map((o) => o.month) || [], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: isDarkMode ? "#a9a0c1" : "#6b7280" } } },
    yaxis: { min: 0, labels: { style: { colors: isDarkMode ? "#a9a0c1" : "#6b7280" } } },
    grid: { borderColor: isDarkMode ? "#27223c" : "#F3F4F6", strokeDashArray: 4 },
    legend: { position: "top", horizontalAlign: "right", labels: { colors: isDarkMode ? "#e0d7ff" : "#374151" } },
    tooltip: { theme: isDarkMode ? "dark" : "light" },
  };

  const statusPieOptions = {
    chart: { type: "donut", height: 280, fontFamily: "Outfit, sans-serif", foreColor: isDarkMode ? "#a9a0c1" : "#374151", background: "transparent" },
    theme: { mode: isDarkMode ? "dark" : "light" },
    colors: ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444"],
    labels: ["Pending", "In Progress", "Ready", "Delivered", "Cancelled"],
    plotOptions: { pie: { donut: { size: "70%" } } },
    legend: { position: "bottom", fontSize: "13px", labels: { colors: isDarkMode ? "#e0d7ff" : "#374151" } },
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
          <div key={card.title} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${card.color}`}>
                <card.icon className="size-5" />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{card.trend}</span>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {orderStatusCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <card.icon className={`size-8 ${card.color}`} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.title}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Revenue</h3>
          <Chart options={revenueChartOptions} series={[{ name: "Revenue", data: charts?.revenueByMonth?.map((r) => r.total) || [] }]} type="bar" height={350} />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Orders by Status</h3>
          <Chart options={statusPieOptions} series={statusPieSeries} type="donut" height={280} />
        </div>
      </div>

      {/* Orders Trend */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Orders Trend (Last 6 Months)</h3>
        <Chart options={ordersChartOptions} series={[{ name: "Orders", data: charts?.ordersByMonth?.map((o) => o.count) || [] }]} type="line" height={350} />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Recent Orders</h3>
            <a href="/orders/manage" className="text-sm text-blue-600 dark:text-purple-400 hover:text-blue-700 font-medium">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">Loading...</td></tr>
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">No orders yet</td></tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{order.customer?.name || "N/A"}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">Rs. {order.totalAmount?.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
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
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Upcoming Deliveries</h3>
            <a href="/orders/manage" className="text-sm text-blue-600 dark:text-purple-400 hover:text-blue-700 font-medium">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">Loading...</td></tr>
                ) : upcomingDeliveries.length === 0 ? (
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">No upcoming deliveries</td></tr>
                ) : (
                  upcomingDeliveries.map((order) => {
                    const deliveryDate = moment(order.deliveryDate);
                    const isOverdue = deliveryDate.isBefore(moment());
                    return (
                      <tr key={order._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{order.customer?.name || "N/A"}</td>
                        <td className={`px-5 py-3 font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}>
                          {deliveryDate.format("DD MMM YYYY")}
                          {isOverdue && <span className="ml-1 text-xs text-red-500 dark:text-red-400">(overdue)</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
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
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Latest Customers</h3>
          <a href="/customer/manage" className="text-sm text-blue-600 dark:text-purple-400 hover:text-blue-700 font-medium">View all</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Added</th>
              </tr>
            </thead>
            <tbody>
              {customersLoading ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">Loading...</td></tr>
              ) : latestCustomers.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">No customers yet</td></tr>
              ) : (
                latestCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{customer.customerId}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{customer.name}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{customer.phone}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{customer.email || "-"}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{moment(customer.createdAt).format("DD MMM YYYY")}</td>
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

export default DashboardPage;
