/* eslint-disable no-unused-vars */
import { useState } from "react";
import Chart from "react-apexcharts";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  TrendingUp,
  Store,
  CreditCard,
  Clock,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  ShieldOff,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import SectionHeading from "../../components/SectionHeading";
import useAdminReports from "../../hooks/useAdminReports";
import { useTheme } from "../../context/ThemeContext";

// ──────────────────────────────────────────
// Reusable card components
// ──────────────────────────────────────────
const StatCard = ({ icon: Icon, iconClass, label, value, sub }) => (
  <div className="bg-white dark:bg-[#18142a] rounded-2xl border border-gray-200 dark:border-purple-500/20 p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
    <div
      className={`flex items-center justify-center size-10 rounded-xl shrink-0 ${iconClass}`}
    >
      <Icon size={19} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-purple-300/70 font-medium leading-tight">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-purple-300/50 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, iconClass, children }) => (
  <div className="bg-white dark:bg-[#18142a] rounded-2xl border border-gray-200 dark:border-purple-500/20 p-5 shadow-xs">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-purple-500/20">
      <div
        className={`flex items-center justify-center size-8 rounded-xl ${iconClass}`}
      >
        <Icon size={17} />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

// ──────────────────────────────────────────
// Period filter button
// ──────────────────────────────────────────
const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const fmt = (n) => `Rs. ${(n || 0).toLocaleString()}`;

// ──────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────
const ReportsPage = () => {
  const [period, setPeriod] = useState("month");
  const { data, isLoading, isFetching } = useAdminReports(period);
  const { isDarkMode } = useTheme();

  // ── Chart config ──
  const chartOptions = {
    chart: {
      type: "area",
      height: 300,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      sparkline: { enabled: false },
    },
    colors: ["#9333ea"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    stroke: { curve: "smooth", width: 2.5 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data?.chart?.labels || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#9CA3AF" } },
    },
    yaxis: {
      labels: {
        formatter: (val) => `Rs. ${(val / 1000).toFixed(0)}k`,
        style: { fontSize: "11px", colors: "#9CA3AF" },
      },
    },
    grid: { borderColor: "#F3F4F6", strokeDashArray: 4 },
    tooltip: { y: { formatter: (val) => `Rs. ${val.toLocaleString()}` } },
  };

  return (
    <SkeletonTheme
      baseColor={isDarkMode ? "#1e1935" : "#e5e7eb"}
      highlightColor={isDarkMode ? "#2e2650" : "#f3f4f6"}
    >
    <div className="space-y-6">
      {/* Header */}
      <SectionHeading
        title="Reports"
        subtitle="Platform-wide analytics for revenue, shops, subscriptions, and renewals"
      />

      {/* ── Revenue Report ────────────────────────────────── */}
      <SectionCard
        title="Revenue Report"
        icon={TrendingUp}
        iconClass="bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300"
      >
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-purple-500/20 dark:bg-[#120e24] p-4">
                <Skeleton width={60} height={12} />
                <Skeleton width={100} height={22} className="mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={CalendarCheck}
              iconClass="bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300"
              label="Today"
              value={fmt(data?.revenue?.today)}
              sub="Collected today"
            />
            <StatCard
              icon={CalendarClock}
              iconClass="bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300"
              label="This Week"
              value={fmt(data?.revenue?.week)}
              sub="Current week"
            />
            <StatCard
              icon={TrendingUp}
              iconClass="bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300"
              label="This Month"
              value={fmt(data?.revenue?.month)}
              sub="Current month"
            />
            <StatCard
              icon={TrendingUp}
              iconClass="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"
              label="This Year"
              value={fmt(data?.revenue?.year)}
              sub="Current year"
            />
          </div>
        )}
      </SectionCard>

      {/* ── Shop Report + Subscription Report (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Shop Report"
          icon={Store}
          iconClass="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
        >
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 dark:border-purple-500/20 dark:bg-[#120e24] p-4">
                  <Skeleton width={70} height={12} />
                  <Skeleton width={50} height={22} className="mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Store}
                iconClass="bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-300"
                label="Total Shops"
                value={(data?.shopReport?.total || 0).toLocaleString()}
              />
              <StatCard
                icon={CheckCircle2}
                iconClass="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                label="Active"
                value={(data?.shopReport?.active || 0).toLocaleString()}
              />
              <StatCard
                icon={AlertTriangle}
                iconClass="bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300"
                label="Expired"
                value={(data?.shopReport?.expired || 0).toLocaleString()}
              />
              <StatCard
                icon={ShieldOff}
                iconClass="bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400"
                label="Suspended"
                value={(data?.shopReport?.suspended || 0).toLocaleString()}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Subscription Report"
          icon={CreditCard}
          iconClass="bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300"
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100"
                >
                  <Skeleton width={80} height={14} />
                  <Skeleton width={60} height={14} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {[
                { key: "monthly", label: "Monthly", color: "bg-blue-500" },
                { key: "quarterly", label: "Quarterly", color: "bg-green-500" },
                {
                  key: "half-yearly",
                  label: "Half Yearly",
                  color: "bg-orange-400",
                },
                { key: "yearly", label: "Yearly", color: "bg-purple-500" },
                { key: "custom", label: "Custom", color: "bg-gray-400" },
              ].map(({ key, label, color }) => {
                const count = data?.subscriptionReport?.[key] || 0;
                const total = data?.shopReport?.total || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key} className="py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {count} Shops
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Renewal Report ──────────────────────────────────── */}
      <SectionCard
        title="Renewal Report"
        icon={Clock}
        iconClass="bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-purple-500/20 dark:bg-[#120e24] p-4">
                <Skeleton width={80} height={12} />
                <Skeleton width={40} height={28} className="mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon={CalendarX}
              iconClass="bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300"
              label="Expire Today"
              value={(data?.renewalReport?.expireToday || 0).toLocaleString()}
              sub="Needs immediate attention"
            />
            <StatCard
              icon={Clock}
              iconClass="bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300"
              label="Expire This Week"
              value={(
                data?.renewalReport?.expireThisWeek || 0
              ).toLocaleString()}
              sub="Within 7 days"
            />
            <StatCard
              icon={CalendarClock}
              iconClass="bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300"
              label="Expire This Month"
              value={(
                data?.renewalReport?.expireThisMonth || 0
              ).toLocaleString()}
              sub="Within 30 days"
            />
          </div>
        )}
      </SectionCard>

      {/* ── Revenue Chart ────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#18142a] rounded-2xl border border-gray-200 dark:border-purple-500/20 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-purple-500/20">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300">
              <TrendingUp size={17} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Revenue Chart
              </h3>
              <p className="text-xs text-gray-500 dark:text-purple-300/70">
                Subscription collection breakdown
              </p>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#120e24] rounded-xl p-1 self-start sm:self-auto">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.key
                    ? "bg-white dark:bg-[#1e1935] text-purple-700 dark:text-purple-300 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Skeleton height={300} className="rounded-xl" />
        ) : (
          <div
            className={`transition-opacity duration-300 ${isFetching ? "opacity-50" : "opacity-100"}`}
          >
            <Chart
              options={chartOptions}
              series={[{ name: "Revenue", data: data?.chart?.data || [] }]}
              type="area"
              height={300}
            />
          </div>
        )}
      </div>
    </div>
    </SkeletonTheme>
  );
};

export default ReportsPage;
