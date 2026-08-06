import { useQuery } from "@tanstack/react-query";

const useDashboardCharts = () => {
  return useQuery({
    queryKey: ["dashboardCharts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/charts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chart data");
      return res.json();
    },
    staleTime: 60000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export default useDashboardCharts;
