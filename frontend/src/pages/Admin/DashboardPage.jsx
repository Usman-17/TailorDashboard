import moment from "moment";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import {
  Store,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Wallet,
  TrendingUp,
  CreditCard,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

import useDashboardStats from "../../hooks/useDashboardStats";
import useDashboardCharts from "../../hooks/useDashboardCharts";
import useAdminRecentPayments from "../../hooks/useAdminRecentPayments";
import useAdminUpcomingRenewals from "../../hooks/useAdminUpcomingRenewals";

import SectionHeading from "../../components/SectionHeading";
import DashboardSkeleton from "../../components/Skeletons/DashboardSkeleton";
import { useTheme } from "../../context/ThemeContext";
// Imports End----

const PLAN_BADGE = {
  monthly: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  quarterly: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "half-yearly": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  yearly: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  custom: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const DashboardPage = () => {
  const { isDarkMode } = useTheme();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();
  const { data: recentPayments = [], isLoading: paymentsLoading } =
    useAdminRecentPayments();
  const { data: upcomingRenewals = [], isLoading: renewalsLoading } =
    useAdminUpcomingRenewals();

  if (statsLoading || chartsLoading || paymentsLoading || renewalsLoading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: "Total Shops",
      value: (stats?.totalShops || 0).toLocaleString(),
      icon: Store,
      color: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
      subtext: "Total registered",
    },
    {
      title: "Active Shops",
      value: (stats?.activeShops || 0).toLocaleString(),
      icon: CheckCircle2,
      color: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
      subtext: "Active subscriptions",
    },
    {
      title: "Expiring Soon",
      value: (stats?.expiringSoonShops || 0).toLocaleString(),
      icon: Clock,
      color: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
      subtext: "Within 7 days",
    },
    {
      title: "Expired Shops",
      value: (stats?.expiredShops || 0).toLocaleString(),
      icon: AlertTriangle,
      color: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40",
      subtext: "Past expiry",
    },
    {
      title: "Suspended Shops",
      value: (stats?.suspendedShops || 0).toLocaleString(),
      icon: XCircle,
      color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      subtext: "Account suspended",
    },
    {
      title: "Today's Collection",
      value: `Rs. ${(stats?.todaysCollection || 0).toLocaleString()}`,
      icon: Wallet,
      color: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/40",
      subtext: "Collected today",
    },
    {
      title: "Monthly Revenue",
      value: `Rs. ${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40",
      subtext: "This month",
    },
  ];

  const revenueChartOptions = {
    chart: {
      type: "bar",
      height: 320,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      foreColor: isDarkMode ? "#a9a0c1" : "#374151",
      background: "transparent",
    },
    theme: {
      mode: isDarkMode ? "dark" : "light",
    },
    colors: ["#9333ea"],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "50%",
        distributed: false,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: charts?.revenueByMonth?.map((r) => r.month) || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: isDarkMode ? "#a9a0c1" : "#6b7280",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `Rs. ${val.toLocaleString()}`,
        style: {
          colors: isDarkMode ? "#a9a0c1" : "#6b7280",
        },
      },
    },
    grid: { borderColor: isDarkMode ? "#27223c" : "#F3F4F6", strokeDashArray: 4 },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      y: { formatter: (val) => `Rs. ${val.toLocaleString()}` },
    },
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Admin Dashboard"
        subtitle="Overview of platform performance, subscriptions, and shop activity"
      />

      {/* 7 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center justify-center size-9 rounded-xl border ${card.color}`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                  {card.title}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                  {card.value}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart Widget */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Revenue Overview
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Monthly subscription revenue breakdown
            </p>
          </div>
        </div>
        <Chart
          options={revenueChartOptions}
          series={[
            {
              name: "Revenue",
              data: charts?.revenueByMonth?.map((r) => r.total) || [],
            },
          ]}
          type="bar"
          height={320}
        />
      </div>

      {/* 2 Bottom Widgets: Recent Payments & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments Widget */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Recent Payments
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Latest subscription payments received
                </p>
              </div>
            </div>
            <Link
              to="/admin/shops"
              className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View Shops <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 overflow-x-auto mt-3">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">
                No recent payments found
              </p>
            ) : (
              recentPayments.map((pm) => (
                <div
                  key={pm._id}
                  className="py-3 flex items-center justify-between gap-3 text-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/40 px-2 rounded-lg transition"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {pm.shop?.name || "Shop"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {pm.recordedBy?.fullName
                        ? `Recorded by ${pm.recordedBy.fullName}`
                        : pm.paymentMethod?.toUpperCase()}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      Rs. {(pm.amount || 0).toLocaleString()}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        PLAN_BADGE[pm.subscriptionPlan] || PLAN_BADGE.custom
                      }`}
                    >
                      {pm.subscriptionPlan || "custom"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Renewals Widget */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141025] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Upcoming Renewals
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Shops due for subscription renewal
                </p>
              </div>
            </div>
            <Link
              to="/admin/shops"
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1"
            >
              Manage Shops <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-x-auto mt-3">
            {upcomingRenewals.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-8 text-center">
                No upcoming renewals
              </p>
            ) : (
              upcomingRenewals.map((shop) => {
                const now = moment();
                const expiryDate = shop.subscriptionExpiry
                  ? moment(shop.subscriptionExpiry)
                  : null;
                const isPastExpiry = expiryDate
                  ? expiryDate.isBefore(now, "day")
                  : false;
                const daysUntilExpiry = expiryDate
                  ? expiryDate.diff(now, "days")
                  : null;

                let badgeText = shop.isActive;
                let badgeClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";

                if (shop.isActive === "suspended") {
                  badgeText = "Suspended";
                  badgeClass = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                } else if (shop.isActive === "expired" || isPastExpiry) {
                  badgeText = "Expired";
                  badgeClass = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                } else if (
                  daysUntilExpiry !== null &&
                  daysUntilExpiry >= 0 &&
                  daysUntilExpiry <= 7
                ) {
                  badgeText = `Expiring (${daysUntilExpiry}d)`;
                  badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold";
                }

                return (
                  <div
                    key={shop._id}
                    className="py-3 flex items-center justify-between gap-3 text-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/40 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {shop.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Owner: {shop.owner?.fullName || "-"} (
                        {shop.owner?.mobile || "-"})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {expiryDate ? expiryDate.format("DD MMM YYYY") : "-"}
                      </p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}
                      >
                        {badgeText}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
