/* eslint-disable no-unused-vars */
import { useState } from "react";
import Chart from "react-apexcharts";
import Skeleton from "react-loading-skeleton";
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

// ──────────────────────────────────────────
// Reusable card components
// ──────────────────────────────────────────
const StatCard = ({ icon: Icon, iconClass, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
    <div
      className={`flex items-center justify-center size-10 rounded-xl shrink-0 ${iconClass}`}
    >
      <Icon size={19} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, iconClass, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
      <div
        className={`flex items-center justify-center size-8 rounded-xl ${iconClass}`}
      >
        <Icon size={17} />
      </div>
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
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
        iconClass="bg-purple-50 text-purple-600"
      >
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4">
                <Skeleton width={60} height={12} />
                <Skeleton width={100} height={22} className="mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={CalendarCheck}
              iconClass="bg-sky-50 text-sky-600"
              label="Today"
              value={fmt(data?.revenue?.today)}
              sub="Collected today"
            />
            <StatCard
              icon={CalendarClock}
              iconClass="bg-blue-50 text-blue-600"
              label="This Week"
              value={fmt(data?.revenue?.week)}
              sub="Current week"
            />
            <StatCard
              icon={TrendingUp}
              iconClass="bg-purple-50 text-purple-600"
              label="This Month"
              value={fmt(data?.revenue?.month)}
              sub="Current month"
            />
            <StatCard
              icon={TrendingUp}
              iconClass="bg-indigo-50 text-indigo-600"
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
          iconClass="bg-emerald-50 text-emerald-600"
        >
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 p-4">
                  <Skeleton width={70} height={12} />
                  <Skeleton width={50} height={22} className="mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Store}
                iconClass="bg-gray-100 text-gray-600"
                label="Total Shops"
                value={(data?.shopReport?.total || 0).toLocaleString()}
              />
              <StatCard
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
                label="Active"
                value={(data?.shopReport?.active || 0).toLocaleString()}
              />
              <StatCard
                icon={AlertTriangle}
                iconClass="bg-rose-50 text-rose-600"
                label="Expired"
                value={(data?.shopReport?.expired || 0).toLocaleString()}
              />
              <StatCard
                icon={ShieldOff}
                iconClass="bg-gray-100 text-gray-500"
                label="Suspended"
                value={(data?.shopReport?.suspended || 0).toLocaleString()}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Subscription Report"
          icon={CreditCard}
          iconClass="bg-blue-50 text-blue-600"
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
        iconClass="bg-amber-50 text-amber-600"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4">
                <Skeleton width={80} height={12} />
                <Skeleton width={40} height={28} className="mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon={CalendarX}
              iconClass="bg-red-50 text-red-600"
              label="Expire Today"
              value={(data?.renewalReport?.expireToday || 0).toLocaleString()}
              sub="Needs immediate attention"
            />
            <StatCard
              icon={Clock}
              iconClass="bg-amber-50 text-amber-600"
              label="Expire This Week"
              value={(
                data?.renewalReport?.expireThisWeek || 0
              ).toLocaleString()}
              sub="Within 7 days"
            />
            <StatCard
              icon={CalendarClock}
              iconClass="bg-orange-50 text-orange-600"
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
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp size={17} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Revenue Chart
              </h3>
              <p className="text-xs text-gray-500">
                Subscription collection breakdown
              </p>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 self-start sm:self-auto">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.key
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
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
  );
};

export default ReportsPage;
