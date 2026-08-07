import {
  TrendingUp,
  IndianRupee,
  Store,
} from "lucide-react";
import Chart from "react-apexcharts";

import useDashboardStats from "../../hooks/useDashboardStats";
import useDashboardCharts from "../../hooks/useDashboardCharts";
import LoadingSpinner from "../../components/LoadingSpinner";

const DashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  if (statsLoading || chartsLoading) return <LoadingSpinner />;

  const statCards = [
    { title: "Total Shops", value: stats?.totalShops || 0, icon: Store, color: "bg-indigo-50 text-indigo-600", trend: `${stats?.activeShops || 0} active` },
    { title: "Total Income", value: `Rs. ${(stats?.totalIncome || 0).toLocaleString()}`, icon: IndianRupee, color: "bg-amber-50 text-amber-600", trend: "All time" },
    { title: "Monthly Revenue", value: `Rs. ${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-green-50 text-green-600", trend: `Exp: Rs. ${(stats?.monthlyExpenses || 0).toLocaleString()}` },
  ];

  const revenueChartOptions = {
    chart: { type: "bar", height: 350, toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
    colors: ["#465FFF"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    xaxis: { categories: charts?.revenueByMonth?.map((r) => r.month) || [], axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (val) => `Rs. ${(val / 1000).toFixed(0)}k` } },
    grid: { borderColor: "#F3F4F6", strokeDashArray: 4 },
    tooltip: { y: { formatter: (val) => `Rs. ${val.toLocaleString()}` } },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${card.color}`}>
                <card.icon className="size-5" />
              </div>
              <span className="text-xs text-gray-400 font-medium">{card.trend}</span>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Revenue Overview</h3>
        <Chart options={revenueChartOptions} series={[{ name: "Revenue", data: charts?.revenueByMonth?.map((r) => r.total) || [] }]} type="bar" height={350} />
      </div>
    </div>
  );
};

export default DashboardPage;
